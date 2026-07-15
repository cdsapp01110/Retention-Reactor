// The SQL that powers each analytics module. These queries would run against a
// raw event, order, and customer warehouse. The figures shown in the app are
// produced by the same logic over the simulated data, so the queries and the
// dashboard stay in sync.

export const SCHEMA = [
  { table: 'users', kind: 'dim', fields: ['user_id', 'signup_date', 'channel_id', 'device_type', 'region_id', 'campaign_id'] },
  { table: 'sessions', kind: 'fact', fields: ['session_id', 'user_id', 'started_at', 'device_type'] },
  { table: 'events', kind: 'fact', fields: ['event_id', 'session_id', 'user_id', 'event_name', 'event_time'] },
  { table: 'orders', kind: 'fact', fields: ['order_id', 'user_id', 'order_date', 'gross_revenue', 'discount_amount', 'net_revenue', 'margin_estimate'] },
  { table: 'order_items', kind: 'fact', fields: ['order_item_id', 'order_id', 'product_id', 'quantity', 'unit_price'] },
  { table: 'products', kind: 'dim', fields: ['product_id', 'name', 'category', 'price', 'margin_pct'] },
  { table: 'campaigns', kind: 'dim', fields: ['campaign_id', 'campaign_name', 'channel_id', 'is_discounted'] },
  { table: 'channels', kind: 'dim', fields: ['channel_id', 'channel_name', 'type', 'is_paid'] },
  { table: 'regions', kind: 'dim', fields: ['region_id', 'country', 'region', 'continent'] }
];

export const QUERIES = [
  {
    id: 'cohort-assign',
    module: 'Cohort Lab',
    title: 'Cohort Assignment',
    question: 'Which month does each customer belong to, by signup versus first purchase?',
    why: 'Retention curves need a fixed anchor. This query tags every customer with two anchors, the month they signed up and the month they first bought, so you can compare acquisition reach against retention quality.',
    sql: `-- Assign every customer to a monthly cohort using two anchors:
--   signup cohort        = the month they first signed up
--   first-purchase cohort = the month they first bought something
WITH first_order AS (
    -- Find the first order month for each customer
    SELECT
        user_id,
        DATE_TRUNC('month', MIN(order_date))::date AS first_order_month
    FROM orders
    WHERE order_date IS NOT NULL
    GROUP BY user_id
)
SELECT
    u.user_id,
    u.signup_date,
    DATE_TRUNC('month', u.signup_date)::date AS signup_cohort,
    fo.first_order_month                       AS first_purchase_cohort,
    ch.channel_name,
    u.device_type,
    r.region,
    CASE WHEN SUM(o.discount_amount) > 0 THEN 1 ELSE 0 END AS used_discount
FROM users u
LEFT JOIN first_order fo ON fo.user_id = u.user_id
LEFT JOIN channels   ch  ON ch.channel_id = u.channel_id
LEFT JOIN regions    r   ON r.region_id = u.region_id
LEFT JOIN orders     o   ON o.user_id = u.user_id
GROUP BY 1, 2, 3, 4, 5, 6, 7;`
  },
  {
    id: 'retention-matrix',
    module: 'Cohort Lab',
    title: 'Retention Matrix',
    question: 'What percentage of each cohort is still active N months after acquisition?',
    why: 'The retention triangle is the signature retention chart: rows are cohorts, columns are month offsets. Window functions and a period spine let each cell equal distinct active users divided by the size of that cohort.',
    sql: `-- Build the classic retention triangle: one row per cohort, one column
-- per month offset (0 = the month they joined). Each cell is the share of
-- the cohort still active that many months later.
WITH cohort_base AS (
    -- Anchor each user to the month they signed up
    SELECT
        user_id,
        DATE_TRUNC('month', signup_date)::date AS cohort_month
    FROM users
),
activity AS (
    -- For every order, find its cohort and how many months after the anchor it happened
    SELECT
        cb.cohort_month,
        cb.user_id,
        DATE_TRUNC('month', o.order_date)::date AS active_month,
        (DATE_PART('year',  AGE(o.order_date, cb.cohort_month)) * 12
       + DATE_PART('month', AGE(o.order_date, cb.cohort_month)))::int AS period
    FROM cohort_base cb
    JOIN orders o ON o.user_id = cb.user_id
),
retained AS (
    -- Distinct active users per cohort per month offset (cap at 12 months)
    SELECT
        cohort_month,
        period,
        COUNT(DISTINCT user_id) AS retained_users
    FROM activity
    WHERE period BETWEEN 0 AND 11
    GROUP BY cohort_month, period
),
cohort_size AS (
    -- Total people in each cohort, the denominator for the rate
    SELECT cohort_month, COUNT(DISTINCT user_id) AS size
    FROM cohort_base
    GROUP BY cohort_month
)
SELECT
    r.cohort_month,
    r.period,
    r.retained_users,
    cs.size,
    ROUND(100.0 * r.retained_users / cs.size, 2) AS retention_rate
FROM retained r
JOIN cohort_size cs ON cs.cohort_month = r.cohort_month
ORDER BY r.cohort_month, r.period;`
  },
  {
    id: 'cohort-curves',
    module: 'Cohort Lab',
    title: 'Cohort Retention Curves',
    question: 'Do newer cohorts retain better than older ones?',
    why: 'Pivoting offsets into columns lets you overlay each cohort as a line and see at a glance whether newer cohorts retain better than older ones.',
    sql: `-- Pivot the retention triangle so each cohort becomes one row and each
-- month offset becomes a column. Overlaying the rows as lines shows whether
-- retention is improving over time.
WITH retention AS (
    SELECT
        cohort_month,
        period,
        ROUND(100.0 * retained_users / size, 2) AS retention_rate
    FROM retention_matrix
)
SELECT
    cohort_month,
    MAX(CASE WHEN period = 0 THEN retention_rate END) AS m0,
    MAX(CASE WHEN period = 1 THEN retention_rate END) AS m1,
    MAX(CASE WHEN period = 2 THEN retention_rate END) AS m2,
    MAX(CASE WHEN period = 3 THEN retention_rate END) AS m3,
    MAX(CASE WHEN period = 6 THEN retention_rate END) AS m6,
    MAX(CASE WHEN period = 9 THEN retention_rate END) AS m9
FROM retention
GROUP BY cohort_month
ORDER BY cohort_month;`
  },
  {
    id: 'funnel-stages',
    module: 'Funnel Lab',
    title: 'Funnel Stage Aggregation',
    question: 'How many users reach each step from visit to purchase?',
    why: 'A sessionized funnel with a conditional step ladder isolates drop-off between adjacent steps. Each later step only counts sessions that cleared the step before, so the loss between steps is honest.',
    sql: `-- Count how many sessions reach each step from visit to purchase, then
-- turn those counts into step-by-step conversion rates. Each later step
-- only counts if the session cleared the step before it.
WITH session_steps AS (
    -- For each session, flag which steps it reached (1) or did not (0)
    SELECT
        s.session_id,
        s.user_id,
        MAX(CASE WHEN e.event_name = 'visit'         THEN 1 ELSE 0 END) AS step_visit,
        MAX(CASE WHEN e.event_name = 'product_view'  THEN 1 ELSE 0 END) AS step_view,
        MAX(CASE WHEN e.event_name = 'add_to_cart'   THEN 1 ELSE 0 END) AS step_cart,
        MAX(CASE WHEN e.event_name = 'checkout_start' THEN 1 ELSE 0 END) AS step_checkout,
        MAX(CASE WHEN e.event_name = 'purchase'       THEN 1 ELSE 0 END) AS step_purchase
    FROM sessions s
    JOIN events e ON e.session_id = s.session_id
    GROUP BY 1, 2
),
funnel_counts AS (
    -- Roll session steps up into totals, gated by the prior step
    SELECT
        COUNT(*)                                                        AS visits,
        SUM(step_view)                                                 AS views,
        SUM(CASE WHEN step_view = 1 THEN step_cart ELSE 0 END)         AS carts,
        SUM(CASE WHEN step_cart = 1 THEN step_checkout ELSE 0 END)     AS checkouts,
        SUM(CASE WHEN step_checkout = 1 THEN step_purchase ELSE 0 END) AS purchases
    FROM session_steps
)
SELECT
    visits,
    views,
    ROUND(100.0 * views / visits, 2)        AS view_rate,
    ROUND(100.0 * carts / views, 2)          AS cart_rate,
    ROUND(100.0 * checkouts / carts, 2)      AS checkout_rate,
    ROUND(100.0 * purchases / checkouts, 2)  AS purchase_rate,
    ROUND(100.0 * purchases / visits, 2)     AS end_to_end_conv
FROM funnel_counts;`
  },
  {
    id: 'funnel-segment',
    module: 'Funnel Lab',
    title: 'Funnel by Segment (channel / device / region)',
    question: 'Where does each segment leak most, and is mobile checkout the main cause?',
    why: 'Grouping the ladder by segment exposes the bottleneck for each slice. Checkout to purchase is where device friction usually appears.',
    sql: `-- The same funnel, grouped by any one segment. Here it is broken out by
-- channel so you can see which channels leak most between checkout and purchase.
WITH segmented AS (
    SELECT
        c.channel_name AS segment,
        COUNT(DISTINCT s.session_id) AS visits,
        COUNT(DISTINCT CASE WHEN e.event_name = 'checkout_start' THEN s.session_id END) AS checkouts,
        COUNT(DISTINCT CASE WHEN e.event_name = 'purchase'       THEN s.session_id END) AS purchases
    FROM sessions s
    JOIN events   e ON e.session_id = s.session_id
    JOIN users    u ON u.user_id = s.user_id
    JOIN channels c ON c.channel_id = u.channel_id
    GROUP BY c.channel_name
)
SELECT
    segment,
    visits,
    ROUND(100.0 * purchases / NULLIF(checkouts, 0), 2) AS checkout_to_purchase,
    ROUND(100.0 * purchases / NULLIF(visits, 0), 2)   AS end_to_end_conv,
    visits - purchases                                AS users_lost
FROM segmented
ORDER BY end_to_end_conv DESC;`
  },
  {
    id: 'discount-impact',
    module: 'Revenue Lab',
    title: 'Discount Impact on Conversion & Margin Quality',
    question: 'Do discounts lift conversion while eroding long-term margin and repeat behavior?',
    why: 'A discount-quality comparison groups customers by whether their first order was discounted, then measures conversion lift against margin, AOV, and repeat rates. The pattern repeats: high conversion, low margin, low repeat.',
    sql: `-- Split customers by whether their first order used a discount, then
-- compare the two groups on volume, margin, AOV, and repeat behavior.
WITH first_order_flag AS (
    -- Tag each customer "discount" or "full_price" based on their first order
    SELECT
        u.user_id,
        u.signup_date,
        CASE WHEN MIN(o.discount_amount) > 0 THEN 'discount' ELSE 'full_price' END AS acq_segment
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.user_id AND o.is_first_purchase = TRUE
    GROUP BY 1, 2
),
group_stats AS (
    -- Aggregate all orders within each acquisition group
    SELECT
        f.acq_segment,
        COUNT(DISTINCT f.user_id) AS customers,
        COUNT(DISTINCT o.order_id) AS orders,
        SUM(o.gross_revenue)   AS gross_revenue,
        SUM(o.net_revenue)     AS net_revenue,
        SUM(o.discount_amount) AS discount_amount,
        SUM(o.margin_estimate) AS margin,
        AVG(o.net_revenue)     AS aov
    FROM first_order_flag f
    LEFT JOIN orders o ON o.user_id = f.user_id
    GROUP BY f.acq_segment
)
SELECT
    acq_segment,
    customers,
    orders,
    ROUND(aov, 2) AS aov,
    ROUND(100.0 * customers / SUM(customers) OVER (), 2)        AS customer_share,
    ROUND(100.0 * margin / NULLIF(gross_revenue, 0), 2)        AS margin_pct,
    ROUND(100.0 * discount_amount / NULLIF(gross_revenue, 0), 2) AS discount_depth,
    ROUND(1.0 * orders / NULLIF(customers, 0), 2)               AS orders_per_customer
FROM group_stats
ORDER BY acq_segment;`
  },
  {
    id: 'segment-rank',
    module: 'Segment Explorer',
    title: 'Risk / Opportunity Segment Ranking',
    question: 'Which segments should receive budget and which are eroding value?',
    why: 'A composite opportunity score blends conversion, retention, and LTV. NTILE quartiles plus rule-based tags flag retention outliers, funnel risks, and discount-driven churn so budget can be directed with intent.',
    sql: `-- Score every segment on a blend of conversion, retention, and LTV,
-- then tag it as a retention outlier, a funnel risk, or a discount risk.
-- NTILE splits the segments into four tiers.
WITH seg_customers AS (
    -- Per channel: how many customers joined and how many were discount-acquired
    SELECT
        c.channel_name AS segment,
        COUNT(DISTINCT u.user_id)                              AS customers,
        SUM(CASE WHEN u.used_discount THEN 1 ELSE 0 END)       AS discount_acquired
    FROM users u
    JOIN channels c ON c.channel_id = u.channel_id
    GROUP BY c.channel_name
),
seg_orders AS (
    -- Per channel: purchasers, repeat buyers, revenue, and margin
    SELECT
        c.channel_name AS segment,
        COUNT(DISTINCT o.user_id)                                                       AS purchasers,
        COUNT(DISTINCT CASE WHEN o.user_id IN (
            -- users with more than one order
            SELECT user_id FROM orders GROUP BY user_id HAVING COUNT(*) > 1
        ) THEN o.user_id END)                                                            AS repeat_buyers,
        SUM(o.net_revenue)   AS revenue,
        SUM(o.margin_estimate) AS margin
    FROM orders o
    JOIN users u ON u.user_id = o.user_id
    JOIN channels c ON c.channel_id = u.channel_id
    GROUP BY c.channel_name
),
scored AS (
    SELECT
        sc.segment,
        ROUND(100.0 * so.purchasers / NULLIF(sc.customers, 0), 1)         AS conversion,
        ROUND(100.0 * so.repeat_buyers / NULLIF(so.purchasers, 0), 1)     AS retention,
        ROUND(so.revenue / NULLIF(sc.customers, 0), 2)                   AS ltv,
        ROUND(so.margin / NULLIF(so.revenue, 0) * 100, 1)                 AS margin_pct,
        ROUND(100.0 * sc.discount_acquired / NULLIF(sc.customers, 0), 1)  AS discount_adoption,
        -- Opportunity score = 30% conversion + 40% retention + 30% capped LTV
        (0.30 * 100.0 * so.purchasers / NULLIF(sc.customers, 0)
       + 0.40 * 100.0 * so.repeat_buyers / NULLIF(so.purchasers, 0)
       + 0.30 * LEAST(so.revenue / NULLIF(sc.customers, 0), 200))         AS score
    FROM seg_customers sc
    JOIN seg_orders so ON so.segment = sc.segment
)
SELECT
    segment,
    conversion,
    retention,
    ltv,
    margin_pct,
    discount_adoption,
    ROUND(score, 1) AS opportunity_score,
    NTILE(4) OVER (ORDER BY score DESC) AS quartile,
    CASE
        WHEN retention >= 40 AND conversion >= 35 THEN 'Retention Outlier'
        WHEN conversion < 18                       THEN 'Funnel Risk'
        WHEN discount_adoption > 60 AND retention < 25 THEN 'Discount Risk'
        WHEN ltv > 80                              THEN 'High Value'
        ELSE 'Stable'
    END AS tag
FROM scored
ORDER BY score DESC;`
  },
  {
    id: 'rolling-povp',
    module: 'Executive Overview',
    title: 'Period-over-Period & Rolling Trends',
    question: 'Is revenue quality trending up or down month over month?',
    why: 'Window functions produce month-over-month deltas and a three-month rolling average, letting leadership separate signal from noise without a separate BI tool.',
    sql: `-- Monthly revenue with month-over-month change and a three-month rolling
-- average, so leadership can tell real movement from noise.
WITH monthly AS (
    -- Roll all orders up to one row per month
    SELECT
        DATE_TRUNC('month', order_date)::date AS month,
        SUM(net_revenue)     AS net_revenue,
        SUM(margin_estimate) AS margin,
        COUNT(DISTINCT order_id) AS orders,
        COUNT(DISTINCT user_id)  AS buyers
    FROM orders
    GROUP BY 1
)
SELECT
    month,
    net_revenue,
    margin,
    ROUND(100.0 * margin / NULLIF(net_revenue, 0), 1) AS margin_pct,
    -- Change in dollars and percent versus the previous month
    ROUND(net_revenue - LAG(net_revenue) OVER (ORDER BY month), 0) AS mom_delta,
    ROUND(100.0 * (net_revenue - LAG(net_revenue) OVER (ORDER BY month))
          / NULLIF(LAG(net_revenue) OVER (ORDER BY month), 0), 1)  AS mom_pct,
    -- Three-month moving average to smooth the line
    ROUND(AVG(net_revenue) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 0) AS rev_3mo_avg
FROM monthly
ORDER BY month;`
  }
];
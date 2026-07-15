// Expert-level SQL powering each analytics module. These would run against the
// raw event/order/customer warehouse; the app simulates their output via the
// `computeAnalytics` backend function so the logic is identical and verifiable.

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
    question: 'Which month did each customer "belong" to, by signup vs. first purchase?',
    why: 'Every retention curve needs a fixed anchor. We define two cohort bases: signup cohort (when you got them) and first-purchase cohort (when they started paying). That lets us compare top-of-funnel reach against the quality of retention.',
    sql: `-- Assign each customer to a monthly cohort (two bases)
WITH first_purchase AS (
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
    DATE_TRUNC('month', u.signup_date)::date                  AS signup_cohort,
    fp.first_order_month                                        AS first_purchase_cohort,
    ch.channel_name,
    u.device_type,
    r.region,
    CASE WHEN SUM(o.discount_amount) > 0 THEN 1 ELSE 0 END     AS used_discount
FROM users u
LEFT JOIN first_purchase  fp  ON fp.user_id = u.user_id
LEFT JOIN channels       ch  ON ch.channel_id = u.channel_id
LEFT JOIN regions         r  ON r.region_id = u.region_id
LEFT JOIN orders          o  ON o.user_id = u.user_id
GROUP BY 1, 2, 3, 4, 5, 6, 7;`
  },
  {
    id: 'retention-matrix',
    module: 'Cohort Lab',
    title: 'Retention Matrix',
    question: 'What % of each cohort is still active N months after acquisition?',
    why: 'The retention triangle is the signature retention chart: rows = cohort, columns = period offset. Window functions + a generated period spine let every cell equal distinct active users divided by cohort size.',
    sql: `-- Classic retention triangle: cohort x period -> retention rate
WITH cohort_base AS (
    SELECT
        user_id,
        DATE_TRUNC('month', signup_date)::date AS cohort_month
    FROM users
),
active_months AS (
    SELECT
        cb.cohort_month,
        cb.user_id,
        DATE_TRUNC('month', o.order_date)::date AS active_month,
        -- period offset = months between the active month and the cohort anchor
        (DATE_PART('year',  AGE(o.order_date, cb.cohort_month)) * 12
        + DATE_PART('month', AGE(o.order_date, cb.cohort_month)))::int AS period
    FROM cohort_base cb
    JOIN orders o ON o.user_id = cb.user_id
),
retention AS (
    SELECT
        cohort_month,
        period,
        COUNT(DISTINCT user_id) AS retained_users
    FROM active_months
    WHERE period BETWEEN 0 AND 11
    GROUP BY cohort_month, period
),
cohort_size AS (
    SELECT cohort_month, COUNT(DISTINCT user_id) AS size
    FROM cohort_base GROUP BY cohort_month
)
SELECT
    r.cohort_month,
    r.period,
    r.retained_users,
    cs.size,
    ROUND(100.0 * r.retained_users / cs.size, 2) AS retention_rate
FROM retention r
JOIN cohort_size cs ON cs.cohort_month = r.cohort_month
ORDER BY r.cohort_month, r.period;`
  },
  {
    id: 'cohort-curves',
    module: 'Cohort Lab',
    title: 'Cohort Retention Curves',
    question: 'Do newer cohorts retain better than older ones (product improvement signal)?',
    why: 'Pivoting periods into columns lets you overlay curves and instantly see whether product changes lift the retention trajectory over time.',
    sql: `-- Pivot retention by period to compare cohort trajectories
WITH retention AS ( /* reuse retention triangle from above */ 
    SELECT cohort_month, period,
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
    question: 'How many users make it to each step of visit → purchase?',
    why: 'A sessionized funnel with a conditional stage ladder isolates drop-off between adjacent steps. The CASE ladder guarantees users are counted only if they cleared the prior step.',
    sql: `-- Step-wise funnel counts with conditional ladder logic
WITH session_funnel AS (
    SELECT
        s.session_id,
        s.user_id,
        c.channel_name,
        s.device_type,
        r.region,
        MAX(CASE WHEN e.event_name = 'visit'          THEN 1 ELSE 0 END) AS step_visit,
        MAX(CASE WHEN e.event_name = 'product_view'  THEN 1 ELSE 0 END) AS step_view,
        MAX(CASE WHEN e.event_name = 'add_to_cart'   THEN 1 ELSE 0 END) AS step_cart,
        MAX(CASE WHEN e.event_name = 'checkout_start'THEN 1 ELSE 0 END) AS step_checkout,
        MAX(CASE WHEN e.event_name = 'purchase'      THEN 1 ELSE 0 END) AS step_purchase
    FROM sessions s
    JOIN events   e ON e.session_id = s.session_id
    JOIN users    u ON u.user_id = s.user_id
    JOIN channels c ON c.channel_id = u.channel_id
    JOIN regions  r ON r.region_id = u.region_id
    GROUP BY 1, 2, 3, 4, 5
),
funnel_counts AS (
    SELECT
        COUNT(*)                                                                AS visits,
        SUM(step_view)                                                          AS views,
        SUM(CASE WHEN step_view = 1 THEN step_cart ELSE 0 END)                  AS carts,
        SUM(CASE WHEN step_cart = 1 THEN step_checkout ELSE 0 END)              AS checkouts,
        SUM(CASE WHEN step_checkout = 1 THEN step_purchase ELSE 0 END)          AS purchases
    FROM session_funnel
)
SELECT
    visits,
    views,
    ROUND(100.0 * views / visits, 2)        AS view_rate,
    ROUND(100.0 * carts / views, 2)         AS cart_rate,
    ROUND(100.0 * checkouts / carts, 2)     AS checkout_rate,
    ROUND(100.0 * purchases / checkouts, 2) AS purchase_rate,
    ROUND(100.0 * purchases / visits, 2)    AS end_to_end_conv
FROM funnel_counts;`
  },
  {
    id: 'funnel-segment',
    module: 'Funnel Lab',
    title: 'Funnel by Segment (channel / device / region)',
    question: 'Where does each segment leak most, and is mobile checkout the culprit?',
    why: 'Grouping the ladder by segment surfaces the bottleneck for each slice. Keep an eye on checkout to purchase, where device friction shows up.',
    sql: `-- Funnel conversion by any segment dimension
WITH segmented AS (
    SELECT
        c.channel_name AS segment,
        COUNT(DISTINCT s.session_id) AS visits,
        COUNT(DISTINCT CASE WHEN e.event_name='checkout_start' THEN s.session_id END) AS checkouts,
        COUNT(DISTINCT CASE WHEN e.event_name='purchase'       THEN s.session_id END) AS purchases
    FROM sessions s
    JOIN events e ON e.session_id = s.session_id
    JOIN users  u ON u.user_id = s.user_id
    JOIN channels c ON c.channel_id = u.channel_id
    GROUP BY c.channel_name
)
SELECT
    segment,
    visits,
    ROUND(100.0 * purchases / NULLIF(checkouts, 0), 2) AS checkout_to_purchase,
    ROUND(100.0 * purchases / NULLIF(visits, 0), 2)   AS end_to_end_conv,
    visits - purchases                                 AS users_lost
FROM segmented
ORDER BY end_to_end_conv DESC;`
  },
  {
    id: 'discount-impact',
    module: 'Revenue Lab',
    title: 'Discount Impact on Conversion & Margin Quality',
    question: 'Do discounts lift conversion but erode long-term margin and repeat behavior?',
    why: 'A discount-quality comparison groups customers by whether their first order was discounted, then measures conversion lift against margin, AOV, and repeat rates. The telltale sign: high conversion, low margin, low repeat.',
    sql: `-- Compare discounted vs full-price customers across the value chain
WITH cust_flags AS (
    SELECT
        u.user_id,
        u.signup_date,
        CASE WHEN MIN(o.discount_amount) > 0 THEN 'discount' ELSE 'full_price' END AS acq_segment
    FROM users u
    LEFT JOIN orders o ON o.user_id = u.user_id AND o.is_first_purchase = TRUE
    GROUP BY 1, 2
),
aggregated AS (
    SELECT
        cf.acq_segment,
        COUNT(DISTINCT cf.user_id)                                       AS customers,
        COUNT(DISTINCT o.order_id)                                       AS orders,
        SUM(o.gross_revenue)                                              AS gross_revenue,
        SUM(o.net_revenue)                                                AS net_revenue,
        SUM(o.discount_amount)                                            AS discount_amount,
        SUM(o.margin_estimate)                                            AS margin,
        AVG(o.net_revenue)                                                 AS aov
    FROM cust_flags cf
    LEFT JOIN orders o ON o.user_id = cf.user_id
    GROUP BY cf.acq_segment
)
SELECT
    acq_segment,
    customers,
    orders,
    ROUND(aov, 2)                                               AS aov,
    ROUND(100.0 * customers / SUM(customers) OVER (), 2)        AS customer_share,
    ROUND(100.0 * margin / NULLIF(gross_revenue, 0), 2)         AS margin_pct,
    ROUND(100.0 * discount_amount / NULLIF(gross_revenue,0),2) AS discount_depth,
    ROUND(1.0 * orders / NULLIF(customers, 0), 2)               AS orders_per_customer
FROM aggregated
ORDER BY acq_segment;`
  },
  {
    id: 'segment-rank',
    module: 'Segment Explorer',
    title: 'Risk / Opportunity Segment Ranking',
    question: 'Which segments deserve budget and which are bleeding value?',
    why: 'A composite opportunity score blends conversion, retention, and LTV; NTILE quartiles plus CASE tags instantly flag retention outliers, funnel risk, and discount-driven churn.',
    sql: `-- Rank segments with a composite opportunity score + risk tag
WITH seg_metrics AS (
    SELECT
        c.channel_name AS segment,
        COUNT(DISTINCT u.user_id)                                    AS customers,
        COUNT(DISTINCT CASE WHEN o.is_first_purchase = TRUE
                             THEN u.user_id END)                      AS purchasers,
        COUNT(DISTINCT CASE WHEN COUNT(o.order_id) > 1
                             THEN u.user_id END)                      AS repeat_buyers,
        SUM(o.net_revenue)                                            AS revenue,
        SUM(o.margin_estimate)                                         AS margin,
        SUM(CASE WHEN u.used_discount THEN 1 ELSE 0 END)             AS discount_acquired
    FROM users u
    JOIN channels c ON c.channel_id = u.channel_id
    LEFT JOIN orders o ON o.user_id = u.user_id
    GROUP BY c.channel_name
),
scored AS (
    SELECT
        segment,
        ROUND(100.0 * purchasers / NULLIF(customers,0), 1)            AS conversion,
        ROUND(100.0 * repeat_buyers / NULLIF(purchasers,0), 1)        AS retention,
        ROUND(revenue / NULLIF(customers,0), 2)                       AS ltv,
        ROUND(margin / NULLIF(revenue,0) * 100, 1)                    AS margin_pct,
        ROUND(100.0 * discount_acquired / NULLIF(customers,0), 1)     AS discount_adoption,
        -- composite: conversion 30% + retention 40% + capped LTV 30%
        (0.30 * 100.0*purchasers/NULLIF(customers,0)
       + 0.40 * 100.0*repeat_buyers/NULLIF(purchasers,0)
       + 0.30 * LEAST(revenue/NULLIF(customers,0), 200))              AS score
    FROM seg_metrics
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
        WHEN ltv > 80                               THEN 'High Value'
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
    why: 'Window functions produce MoM deltas and 3-month rolling averages so leadership can separate signal from noise without a separate BI tool.',
    sql: `-- Monthly revenue with MoM growth + 3-month rolling average
WITH monthly AS (
    SELECT
        DATE_TRUNC('month', order_date)::date AS month,
        SUM(net_revenue)        AS net_revenue,
        SUM(margin_estimate)    AS margin,
        COUNT(DISTINCT order_id) AS orders,
        COUNT(DISTINCT user_id)  AS buyers
    FROM orders
    GROUP BY 1
)
SELECT
    month,
    net_revenue,
    margin,
    ROUND(100.0 * margin / NULLIF(net_revenue,0), 1) AS margin_pct,
    ROUND(net_revenue - LAG(net_revenue) OVER (ORDER BY month), 0)  AS mom_delta,
    ROUND(100.0 * (net_revenue - LAG(net_revenue) OVER (ORDER BY month))
          / NULLIF(LAG(net_revenue) OVER (ORDER BY month),0), 1)    AS mom_pct,
    ROUND(AVG(net_revenue) OVER (ORDER BY month ROWS BETWEEN 2 PRECEDING AND CURRENT ROW), 0) AS rev_3mo_avg
FROM monthly
ORDER BY month;`
  }
];
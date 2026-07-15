import { createClientFromRequest } from 'npm:@base44/sdk@0.8.38';

const FLOW = ['visit', 'product_view', 'add_to_cart', 'checkout_start', 'purchase'];
const STAGE_LABEL = {
  visit: 'Visit',
  product_view: 'Product View',
  add_to_cart: 'Add to Cart',
  checkout_start: 'Checkout Start',
  purchase: 'Purchase'
};

function parseDate(s) { return s ? new Date(s) : null; }
function monthKey(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); }
function monthStartFromKey(k) { const [y, m] = k.split('-').map(Number); return new Date(y, m - 1, 1); }
function monthsBetween(a, b) { return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth()); }
function round(n, d = 2) { const p = Math.pow(10, d); return Math.round(n * p) / p; }

export default async function computeAnalytics(base44, params) {
  const { region, channel, device, discount, cohortType, cohortFilter, granularity } = params || {};
  const useFirstPurchase = cohortType === 'first_purchase';

  let customers = await base44.asServiceRole.entities.Customer.list(undefined, 1000);
  let orders = await base44.asServiceRole.entities.Order.list(undefined, 1000);
  let events = await base44.asServiceRole.entities.Event.list(undefined, 2000);

  // apply global filters to customer pool
  const custPass = (c) => {
    if (region && region !== 'all' && c.region !== region) return false;
    if (channel && channel !== 'all' && c.channel !== channel) return false;
    if (device && device !== 'all' && c.device_type !== device) return false;
    if (discount === 'yes' && !c.used_discount) return false;
    if (discount === 'no' && c.used_discount) return false;
    return true;
  };
  const filteredCustomers = customers.filter(custPass);
  const allowedCustIds = new Set(filteredCustomers.map(c => c.customer_id));

  orders = orders.filter(o => allowedCustIds.has(o.customer_id) && o.order_date);
  events = events.filter(e => e.customer_id && (allowedCustIds.has(e.customer_id) || e.event_name === 'visit'));
  // visits without customers are top-of-funnel; keep them for funnel rates if no customer filter narrows them.
  const hasCustomerDimFilter = (region && region !== 'all') || (channel && channel !== 'all') || (device && device !== 'all') || (discount && discount !== 'all');
  if (hasCustomerDimFilter) {
    events = events.filter(e => allowedCustIds.has(e.customer_id));
  }

  // ---- KPIs ----
  const totalCustomers = filteredCustomers.length;
  const purchasers = filteredCustomers.filter(c => (c.total_orders || 0) > 0);
  const totalOrders = orders.length;
  const grossRevenue = orders.reduce((s, o) => s + (o.gross_revenue || 0), 0);
  const netRevenue = orders.reduce((s, o) => s + (o.net_revenue || 0), 0);
  const discountAmount = orders.reduce((s, o) => s + (o.discount_amount || 0), 0);
  const margin = orders.reduce((s, o) => s + (o.margin_estimate || 0), 0);
  const aov = totalOrders ? netRevenue / totalOrders : 0;
  const marginPct = grossRevenue ? (margin / grossRevenue) * 100 : 0;
  const discountShare = grossRevenue ? (discountAmount / grossRevenue) * 100 : 0;
  const conversionRate = totalCustomers ? (purchasers.length / totalCustomers) * 100 : 0;
  const avgOrdersPerPurchaser = purchasers.length ? totalOrders / purchasers.length : 0;
  const repeatRate = purchasers.length ? (purchasers.filter(c => (c.total_orders || 0) > 1).length / purchasers.length) * 100 : 0;

  // ---- Cohort retention matrix ----
  const customerById = new Map(filteredCustomers.map(c => [c.customer_id, c]));
  const cohorts = new Map(); // cohortKey -> { customers: Set, size }
  for (const c of filteredCustomers) {
    const key = useFirstPurchase ? (c.first_purchase_cohort_month || null) : c.cohort_month;
    if (!key) continue;
    if (!cohorts.has(key)) cohorts.set(key, { size: 0, ids: new Set() });
    const co = cohorts.get(key);
    co.size++; co.ids.add(c.customer_id);
  }

  const orderByCustomer = new Map();
  for (const o of orders) {
    if (!orderByCustomer.has(o.customer_id)) orderByCustomer.set(o.customer_id, []);
    orderByCustomer.get(o.customer_id).push(monthKey(parseDate(o.order_date)));
  }

  const cohortKeys = [...cohorts.keys()].filter(Boolean).sort();
  const maxPeriod = 11;
  const matrix = cohortKeys.map(key => {
    const co = cohorts.get(key);
    const start = monthStartFromKey(key);
    const row = { cohort: key, size: co.size, type: useFirstPurchase ? 'first_purchase' : 'signup', values: [] };
    for (let p = 0; p <= maxPeriod; p++) {
      const targetDate = new Date(start.getFullYear(), start.getMonth() + p, 1);
      const targetKey = monthKey(targetDate);
      if (targetDate > new Date(2025, 2, 1)) { row.values.push(null); continue; }
      let retained = 0;
      for (const cid of co.ids) {
        const mo = orderByCustomer.get(cid);
        if (mo && mo.includes(targetKey)) retained++;
      }
      const rate = co.size ? (retained / co.size) * 100 : 0;
      row.values.push({ period: p, retained, rate: round(rate, 1), targetKey });
    }
    return row;
  });

  // cohort curves for chart
  const cohortCurves = matrix.map(m => ({ cohort: m.cohort, size: m.size, curve: m.values.map(v => v ? v.rate : null) }));

  // ---- Funnel ----
  const stageCounts = {};
  FLOW.forEach(s => stageCounts[s] = 0);
  for (const e of events) { if (stageCounts[e.event_name] !== undefined) stageCounts[e.event_name]++; }

  const funnelStages = FLOW.map((s, i) => {
    const prev = i === 0 ? stageCounts[FLOW[0]] : stageCounts[FLOW[i - 1]];
    const count = stageCounts[s];
    const startCount = stageCounts[FLOW[0]];
    return {
      key: s,
      label: STAGE_LABEL[s],
      count,
      stepConv: i === 0 ? 100 : round(prev ? (count / prev) * 100 : 0, 1),
      overallConv: round(startCount ? (count / startCount) * 100 : 0, 1),
      dropOff: i === 0 ? 0 : round(prev ? (1 - count / prev) * 100 : 0, 1),
      lost: i === 0 ? 0 : Math.max(0, prev - count)
    };
  });

  // funnel by segment dims
  function funnelByDim(dim) {
    const map = new Map();
    for (const e of events) {
      if (stageCounts[e.event_name] === undefined) continue;
      const v = e[dim];
      if (!v) continue;
      if (!map.has(v)) { const o = {}; FLOW.forEach(s => o[s] = 0); map.set(v, o); }
      map.get(v)[e.event_name]++;
    }
    return [...map.entries()].map(([seg, counts]) => {
      const start = counts.visit;
      const conv = start ? round((counts.purchase / start) * 100, 1) : 0;
      return {
        segment: seg,
        counts,
        conversion: conv,
        checkoutToPurchase: counts.checkout_start ? round((counts.purchase / counts.checkout_start) * 100, 1) : 0,
        cartToCheckout: counts.add_to_cart ? round((counts.checkout_start / counts.add_to_cart) * 100, 1) : 0
      };
    }).sort((a, b) => b.conversion - a.conversion);
  }
  const funnelByChannel = funnelByDim('channel');
  const funnelByDevice = funnelByDim('device_type');
  const funnelByRegion = funnelByDim('region');

  // ---- Revenue & discount impact ----
  const firstOrders = orders.filter(o => o.is_first_purchase);
  const discCustIds = new Set(filteredCustomers.filter(c => c.used_discount).map(c => c.customer_id));
  function revStats(ids) {
    const o = orders.filter(x => ids.has(x.customer_id));
    const g = o.reduce((s, x) => s + (x.gross_revenue || 0), 0);
    const n = o.reduce((s, x) => s + (x.net_revenue || 0), 0);
    const d = o.reduce((s, x) => s + (x.discount_amount || 0), 0);
    const m = o.reduce((s, x) => s + (x.margin_estimate || 0), 0);
    const custs = o.length ? new Set(o.map(x => x.customer_id)).size : 0;
    const repeat = [...ids].filter(cid => o.filter(x => x.customer_id === cid).length > 1).length;
    return {
      customers: custs,
      orders: o.length,
      grossRevenue: round(g),
      netRevenue: round(n),
      discountAmount: round(d),
      margin: round(m),
      marginPct: g ? round((m / g) * 100, 1) : 0,
      aov: o.length ? round(n / o.length, 2) : 0,
      discountDepth: g ? round((d / g) * 100, 1) : 0,
      repeatRate: custs ? round((repeat / custs) * 100, 1) : 0,
      avgOrders: custs ? round(o.length / custs, 2) : 0
    };
  }
  const discountImpact = {
    discount: revStats(discCustIds),
    fullPrice: revStats(new Set(filteredCustomers.filter(c => !c.used_discount).map(c => c.customer_id)))
  };

  // revenue by channel
  const revByChannel = new Map();
  for (const o of orders) {
    if (!revByChannel.has(o.channel)) revByChannel.set(o.channel, { gross: 0, net: 0, discount: 0, margin: 0, orders: 0 });
    const r = revByChannel.get(o.channel);
    r.gross += o.gross_revenue || 0; r.net += o.net_revenue || 0; r.discount += o.discount_amount || 0; r.margin += o.margin_estimate || 0; r.orders++;
  }
  const revenueByChannel = [...revByChannel.entries()].map(([seg, r]) => ({
    segment: seg,
    netRevenue: round(r.net),
    margin: round(r.margin),
    aov: r.orders ? round(r.net / r.orders, 2) : 0,
    discountShare: r.gross ? round((r.discount / r.gross) * 100, 1) : 0
  })).sort((a, b) => b.netRevenue - a.netRevenue);

  // ---- Segment intelligence ----
  function segmentTable(dim) {
    const groups = new Map();
    for (const c of filteredCustomers) {
      const v = c[dim];
      if (!v) continue;
      if (!groups.has(v)) groups.set(v, { customers: 0, purchasers: 0, repeat: 0, usedDiscount: 0, orders: 0, revenue: 0, margin: 0 });
      const g = groups.get(v);
      g.customers++;
      if ((c.total_orders || 0) > 0) g.purchasers++;
      if ((c.total_orders || 0) > 1) g.repeat++;
      if (c.used_discount) g.usedDiscount++;
      g.orders += c.total_orders || 0;
      g.revenue += c.total_revenue || 0;
    }
    // attach margin from orders
    const marginBySeg = new Map();
    for (const o of orders) {
      const v = o[dim];
      if (!v) continue;
      marginBySeg.set(v, (marginBySeg.get(v) || 0) + (o.margin_estimate || 0));
    }
    return [...groups.entries()].map(([seg, g]) => {
      const conversion = g.customers ? round((g.purchasers / g.customers) * 100, 1) : 0;
      const retention = g.purchasers ? round((g.repeat / g.purchasers) * 100, 1) : 0;
      const aov = g.orders ? round(g.revenue / g.orders, 2) : 0;
      const margin = round(marginBySeg.get(seg) || 0);
      const ltv = g.customers ? round(g.revenue / g.customers, 2) : 0;
      const discountAdoption = g.customers ? round((g.usedDiscount / g.customers) * 100, 1) : 0;
      // opportunity score: blend conversion, retention, ltv; risk if discountAdoption high & retention low
      const score = round(conversion * 0.3 + retention * 0.4 + Math.min(ltv / 2, 30) * 0.3, 1);
      let tag = 'Stable';
      if (retention >= 40 && conversion >= 35) tag = 'Retention Outlier';
      else if (conversion < 18) tag = 'Funnel Risk';
      else if (discountAdoption > 60 && retention < 25) tag = 'Discount Risk';
      else if (ltv > 80) tag = 'High Value';
      return { segment: seg, ...g, conversion, retention, aov, ltv, margin, discountAdoption, score, tag };
    }).sort((a, b) => b.score - a.score);
  }
  const segments = {
    channel: segmentTable('channel'),
    device: segmentTable('device_type'),
    region: segmentTable('region')
  };

  // period-1 cohort retention (month-1 stickiness) as the real repeat signal
  const m1Rates = matrix.map(m => m.values[1] && m.values[1].rate !== null ? m.values[1].rate : null).filter(r => r !== null);
  const avgM1Retention = m1Rates.length ? round(m1Rates.reduce((s, r) => s + r, 0) / m1Rates.length, 1) : 0;

  // ---- Cohort drill-down (channel mix + cohort-scoped funnel & revenue) ----
  const cohortDetail = {};
  for (const [key, co] of cohorts.entries()) {
    const ids = co.ids;
    const evIn = events.filter(e => ids.has(e.customer_id));
    const fc = {}; FLOW.forEach(s => fc[s] = 0); evIn.forEach(e => { if (fc[e.event_name] !== undefined) fc[e.event_name]++; });
    const fStages = FLOW.map((s, i) => {
      const prev = i === 0 ? fc[FLOW[0]] : fc[FLOW[i - 1]];
      return { key: s, label: STAGE_LABEL[s], count: fc[s], stepConv: i === 0 ? 100 : round(prev ? (fc[s] / prev) * 100 : 0, 1), overallConv: round(fc[FLOW[0]] ? (fc[s] / fc[FLOW[0]]) * 100 : 0, 1), dropOff: i === 0 ? 0 : round(prev ? (1 - fc[s] / prev) * 100 : 0, 1) };
    });
    const oIn = orders.filter(o => ids.has(o.customer_id));
    const channelMix = {};
    for (const cid of ids) { const c = customerById.get(cid); if (!c) continue; channelMix[c.channel] = (channelMix[c.channel] || 0) + 1; }
    const m1 = matrix.find(m => m.cohort === key)?.values?.[1];
    cohortDetail[key] = {
      size: co.size,
      m1Rate: m1 ? m1.rate : null,
      netRevenue: Math.round(oIn.reduce((s, o) => s + (o.net_revenue || 0), 0)),
      orders: oIn.length,
      aov: oIn.length ? Math.round(oIn.reduce((s, o) => s + (o.net_revenue || 0), 0) / oIn.length, 2) : 0,
      channelMix: Object.entries(channelMix).map(([seg, count]) => ({ seg, count })).sort((a, b) => b.count - a.count),
      funnel: fStages
    };
  }
  // ---- Recommendations ----
  const recs = [];
  const worstCheckoutDevice = [...funnelByDevice].sort((a, b) => (a.checkoutToPurchase || 0) - (b.checkoutToPurchase || 0))[0];
  if (worstCheckoutDevice) {
    recs.push({
      id: 'mobile-checkout',
      title: `Fix checkout on ${worstCheckoutDevice.segment}`,
      finding: `${worstCheckoutDevice.segment} goes from checkout to purchase only ${worstCheckoutDevice.checkoutToPurchase}% of the time. That's the widest leak in the funnel.`,
      action: 'Make mobile checkout easier: guest checkout, Apple/Google Pay, address autocomplete, fewer form fields.',
      impact: 'High',
      confidence: 'High',
      metric: `${worstCheckoutDevice.checkoutToPurchase}% checkout to purchase on ${worstCheckoutDevice.segment}`
    });
  }
  const discRisk = segments.channel.find(s => s.discountAdoption > 50 && s.retention < 28);
  if (discRisk) {
    recs.push({
      id: 'discount-discipline',
      title: `Pull back discounting on ${discRisk.segment}`,
      finding: `${discRisk.segment} buyers are ${discRisk.discountAdoption}% discount-acquired, but only ${discRisk.retention}% stick around. Quick conversion, quick churn.`,
      action: 'Move spend off blanket discounts and into lifecycle and loyalty for this channel. Cap promo depth at 15%.',
      impact: 'High',
      confidence: 'Medium',
      metric: `${discRisk.discountAdoption}% discount adoption · ${discRisk.retention}% retention`
    });
  }
  const bestChannel = segments.channel[0];
  if (bestChannel) {
    recs.push({
      id: 'scale-best',
      title: `Scale acquisition on ${bestChannel.segment}`,
      finding: `${bestChannel.segment} keeps ${bestChannel.retention}% of customers and pulls ${bestChannel.ltv} LTV. That's your healthiest base.`,
      action: 'Move paid budget toward this channel. Copy its onboarding flow into the weaker ones.',
      impact: 'Medium',
      confidence: 'High',
      metric: `${bestChannel.retention}% retention · ${bestChannel.ltv} LTV`
    });
  }
  const worstRegion = [...segments.region].sort((a, b) => a.conversion - b.conversion)[0];
  if (worstRegion) {
    recs.push({
      id: 'region-invest',
      title: `Look into ${worstRegion.segment}`,
      finding: `${worstRegion.segment} converts at just ${worstRegion.conversion}%, under the ${round(conversionRate)}% portfolio average.`,
      action: 'Check regional pricing, shipping cost, and localization. Run a 30-day look at checkout abandonment.',
      impact: 'Medium',
      confidence: 'Medium',
      metric: `${worstRegion.conversion}% conversion in ${worstRegion.segment}`
    });
  }
  recs.push({
    id: 'repeat-engine',
    title: 'Build a repeat-purchase engine',
    finding: `Month-1 retention averages ${avgM1Retention}%. Half of new buyers go quiet within 30 days of their first purchase.`,
    action: 'Set up post-purchase lifecycle flows at day 14 and 30. Put complementary products in order emails. Reward the second order.',
    impact: 'High',
    confidence: 'High',
    metric: `${avgM1Retention}% avg month-1 retention`
  });

  // ---- filter metadata ----
  const filterOptions = {
    regions: [...new Set(customers.map(c => c.region))].sort(),
    channels: [...new Set(customers.map(c => c.channel))].sort(),
    devices: [...new Set(customers.map(c => c.device_type))].sort()
  };

  return {
    kpis: {
      totalCustomers, totalOrders, grossRevenue: round(grossRevenue), netRevenue: round(netRevenue),
      discountAmount: round(discountAmount), margin: round(margin), aov: round(aov, 2),
      marginPct: round(marginPct, 1), discountShare: round(discountShare, 1), conversionRate: round(conversionRate, 1),
      avgOrdersPerPurchaser: round(avgOrdersPerPurchaser, 2), repeatRate: round(repeatRate, 1),
      purchasers: purchasers.length
    },
    cohorts: { matrix, curves: cohortCurves, cohortType: useFirstPurchase ? 'first_purchase' : 'signup' },
    funnel: { stages: funnelStages, byChannel: funnelByChannel, byDevice: funnelByDevice, byRegion: funnelByRegion,
      worstBottleneck: (() => { let worst=null; for(let i=1;i<funnelStages.length;i++){ if(!worst||funnelStages[i].dropOff>worst.dropOff) worst=funnelStages[i]; } return worst; })() },
    discountImpact, revenueByChannel,
    segments,
    cohortDetail,
    recommendations: recs,
    filterOptions,
    filters: { region, channel, device, discount, cohortType }
  };
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    // Public analytics endpoint: reads entity data via the service role, so no user auth required.
    let params = {};
    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}));
      params = body || {};
    }
    const result = await computeAnalytics(base44, params);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
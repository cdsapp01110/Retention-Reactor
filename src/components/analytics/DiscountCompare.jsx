import { fmtMoney, fmtPct, fmtNum } from '@/lib/analytics';

function Stat({ label, value, hint }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="num text-xl font-bold text-foreground mt-1">{value}</div>
      {hint && <div className="text-[11px] text-muted-foreground/70 mt-0.5">{hint}</div>}
    </div>
  );
}

export default function DiscountCompare({ data }) {
  if (!data) return null;
  const d = data.discount, f = data.fullPrice;
  const convLift = d.customers && f.customers ? null : null;
  const marginDelta = (f.marginPct - d.marginPct).toFixed(1);
  const repeatDelta = (f.repeatRate - d.repeatRate).toFixed(1);
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="glass rounded-2xl p-5 border-l-2 border-chart-4/60">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-heading font-semibold text-foreground">Discount-acquired</h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-chart-4/15 text-chart-4 border border-chart-4/20">promo-driven</span>
        </div>
        <div className="grid grid-cols-2 gap-y-4 gap-x-3">
          <Stat label="Customers" value={fmtNum(d.customers)} />
          <Stat label="AOV" value={fmtMoney(d.aov)} />
          <Stat label="Margin %" value={fmtPct(d.marginPct)} hint="lower quality" />
          <Stat label="Discount depth" value={fmtPct(d.discountDepth)} />
          <Stat label="Repeat rate" value={fmtPct(d.repeatRate)} />
          <Stat label="Avg orders" value={d.avgOrders} />
        </div>
      </div>
      <div className="glass rounded-2xl p-5 border-l-2 border-chart-3/60">
        <div className="flex items-center justify-between mb-4">
          <h4 className="font-heading font-semibold text-foreground">Full-price</h4>
          <span className="text-xs px-2 py-0.5 rounded-full bg-chart-3/15 text-chart-3 border border-chart-3/20">margin-healthy</span>
        </div>
        <div className="grid grid-cols-2 gap-y-4 gap-x-3">
          <Stat label="Customers" value={fmtNum(f.customers)} />
          <Stat label="AOV" value={fmtMoney(f.aov)} />
          <Stat label="Margin %" value={fmtPct(f.marginPct)} hint={`+${marginDelta}pp vs discount`} />
          <Stat label="Discount depth" value={fmtPct(f.discountDepth)} />
          <Stat label="Repeat rate" value={fmtPct(f.repeatRate)} hint={`+${repeatDelta}pp vs discount`} />
          <Stat label="Avg orders" value={f.avgOrders} />
        </div>
      </div>
    </div>
  );
}
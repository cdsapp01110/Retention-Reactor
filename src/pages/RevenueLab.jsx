import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useAnalyticsQuery, fmtMoney, fmtPct } from '@/lib/analytics';
import DiscountCompare from '@/components/analytics/DiscountCompare';
import KpiCard from '@/components/analytics/KpiCard';
import Skeleton, { PageHeader } from '@/components/ui/Skeleton';
import { DollarSign, Receipt, Percent, TrendingDown } from 'lucide-react';

export default function RevenueLab() {
  const { data, isLoading } = useAnalyticsQuery();
  if (isLoading || !data) return <div className="p-8"><PageHeader eyebrow="Module 03" title="Revenue & Discount Lab" /><Skeleton /></div>;
  const k = data.kpis;
  const d = data.discountImpact;
  const marginDelta = (d.fullPrice.marginPct - d.discount.marginPct).toFixed(1);
  const repeatDelta = (d.fullPrice.repeatRate - d.discount.repeatRate).toFixed(1);
  const channelColors = ['hsl(var(--chart-1))','hsl(var(--chart-2))','hsl(var(--chart-3))','hsl(var(--chart-4))','hsl(var(--chart-5))'];

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        eyebrow="Module 03 · Revenue & discount impact"
        title="Revenue & Discount Lab"
        subtitle="Does discounting buy short-term sales at the cost of margin and loyalty? Compare full-price and discount-acquired customers across the board."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard index={0} label="Net revenue" value={fmtMoney(k.netRevenue)} icon={DollarSign} accent="chart-3" />
        <KpiCard index={1} label="AOV" value={fmtMoney(k.aov)} icon={Receipt} accent="chart-2" />
        <KpiCard index={2} label="Margin %" value={fmtPct(k.marginPct)} icon={Percent} accent="chart-1" />
        <KpiCard index={3} label="Discount depth" value={fmtPct(k.discountShare)} icon={TrendingDown} accent="chart-4" />
      </div>

      <div className="mt-6">
        <h3 className="font-heading text-xl font-semibold mb-3">Discount vs full-price acquisition</h3>
        <DiscountCompare data={d} />
      </div>

      <div className="mt-4 rounded-xl border border-chart-4/25 bg-chart-4/5 px-5 py-4 text-sm text-foreground/85">
        <b className="text-chart-4">Here's the trade-off.</b> Discount customers convert faster, but their margin runs{' '}
        <b>{marginDelta}pp lower</b> and they repeat <b>{repeatDelta}pp less often</b>. It looks like growth. A lot of it isn't.
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-6">
        <div className="glass rounded-2xl p-5">
          <h3 className="font-heading font-semibold mb-4">Net revenue by channel</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={data.revenueByChannel} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} horizontal={false} />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickFormatter={v => '$' + v} />
              <YAxis type="category" dataKey="segment" stroke="hsl(var(--muted-foreground))" fontSize={11} width={110} />
              <Tooltip contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="netRevenue" radius={[0,6,6,0]}>
                {data.revenueByChannel.map((_, i) => <Cell key={i} fill={channelColors[i % channelColors.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="font-heading font-semibold mb-4">Margin vs discount depth by channel</h3>
          <div className="space-y-3 text-sm">
            {data.revenueByChannel.map((r, i) => (
              <div key={r.segment} className="flex items-center gap-3">
                <div className="w-28 truncate text-foreground/85">{r.segment}</div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between text-xs"><span className="text-chart-3">margin ${r.margin}</span><span className="text-chart-4">disc {fmtPct(r.discountShare)}</span></div>
                  <div className="flex gap-1 h-2">
                    <div className="h-full rounded-l bg-chart-3/70" style={{ width: `${Math.min(r.margin / 3000 * 100, 100)}%` }} />
                    <div className="h-full rounded-r bg-chart-4/60" style={{ width: `${r.discountShare * 3}%`, minWidth: 4 }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-muted-foreground">Green is margin, coral is discount depth. Channels with tall coral bars and thin green are shipping revenue at low quality.</p>
        </div>
      </div>
    </div>
  );
}
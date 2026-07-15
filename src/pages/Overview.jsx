import { Link } from 'react-router-dom';
import { Users, ShoppingCart, DollarSign, Percent, Repeat, TrendingDown, Receipt, Target } from 'lucide-react';
import { useAnalyticsQuery, fmtMoney, fmtPct, fmtNum } from '@/lib/analytics';
import { useFilters } from '@/lib/filters';
import KpiCard from '@/components/analytics/KpiCard';
import FunnelChart from '@/components/analytics/FunnelChart';
import RecommendationCard from '@/components/analytics/RecommendationCard';
import Skeleton, { PageHeader } from '@/components/ui/Skeleton';
import { ArrowRight } from 'lucide-react';

export default function Overview() {
  const { data, isLoading } = useAnalyticsQuery();
  const { filters } = useFilters();
  if (isLoading || !data) return (
    <div className="p-4 sm:p-6 lg:p-8"><PageHeader eyebrow="Executive" title="Overview" /><Skeleton lines={1} /></div>
  );
  const k = data.kpis;
  const exec = filters.mode === 'executive';
  const recs = data.recommendations.slice(0, 3);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        eyebrow={exec ? 'Executive mode' : 'Analyst mode'}
        title="Overview"
        subtitle="An overview how the business is performing. Use the filter bar to slice the model by region, channel, device, or discount."
      />

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard index={0} label="Customers" value={fmtNum(k.totalCustomers)} sub={`${fmtNum(k.purchasers)} converted · ${fmtPct(k.conversionRate)} conversion`} icon={Users} accent="chart-1" />
        <KpiCard index={1} label="Net revenue" value={fmtMoney(k.netRevenue)} sub={`${fmtPct(k.marginPct)} gross margin · ${fmtPct(k.discountShare)} discounted`} icon={DollarSign} accent="chart-3" />
        <KpiCard index={2} label="AOV" value={fmtMoney(k.aov)} sub={`${fmtNum(k.totalOrders)} orders · ${k.avgOrdersPerPurchaser} per buyer`} icon={Receipt} accent="chart-2" />
        <KpiCard index={3} label="Repeat rate" value={fmtPct(k.repeatRate)} sub={`${k.avgOrdersPerPurchaser} avg orders / purchaser`} icon={Repeat} accent="chart-5" />
      </div>

      {!exec && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          <KpiCard index={4} label="Gross revenue" value={fmtMoney(k.grossRevenue)} sub={`before ${fmtMoney(k.discountAmount)} in discounts`} icon={Target} accent="chart-4" />
          <KpiCard index={5} label="Margin %" value={fmtPct(k.marginPct)} sub="net-margin proxy" icon={Percent} accent="chart-3" />
          <KpiCard index={6} label="Discount depth" value={fmtPct(k.discountShare)} sub="share of gross eroded by promo" icon={TrendingDown} accent="chart-4" />
          <KpiCard index={7} label="Conversion" value={fmtPct(k.conversionRate)} sub="visitor → first purchase" icon={Users} accent="chart-1" />
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-5 mt-8">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading font-semibold">Funnel health</h3>
            <Link to="/funnel" className="text-xs text-primary inline-flex items-center gap-1 hover:underline">Open Funnel Lab <ArrowRight className="h-3 w-3" /></Link>
          </div>
          <FunnelChart stages={data.funnel.stages} />
          {data.funnel.worstBottleneck && (
            <div className="mt-4 text-sm rounded-xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-foreground/85">
              <b className="text-destructive">Worst leak:</b> {data.funnel.worstBottleneck.label}. {data.funnel.worstBottleneck.dropOff}% drop-off, {data.funnel.worstBottleneck.lost} users lost.
            </div>
          )}
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="font-heading font-semibold mb-4">Revenue quality</h3>
          <div className="space-y-3 text-sm">
            <Row label="Full-price margin" value={fmtPct(data.discountImpact.fullPrice.marginPct)} good />
            <Row label="Discount margin" value={fmtPct(data.discountImpact.discount.marginPct)} bad />
            <Row label="Full-price repeat" value={fmtPct(data.discountImpact.fullPrice.repeatRate)} good />
            <Row label="Discount repeat" value={fmtPct(data.discountImpact.discount.repeatRate)} bad />
            <p className="text-xs text-muted-foreground pt-2 border-t border-border">Discounts increase first-purchase conversion but reduce margin and repeat rates. A short-term gain with a long-term cost.</p>
          </div>
          <Link to="/revenue" className="mt-4 text-xs text-primary inline-flex items-center gap-1 hover:underline">Open Revenue Lab <ArrowRight className="h-3 w-3" /></Link>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="font-heading text-xl font-semibold mb-4">Top {recs.length} recommendations</h3>
        <div className="grid lg:grid-cols-3 gap-4">
          {recs.map((r, i) => <RecommendationCard key={r.id} rec={r} index={i} />)}
        </div>
        <Link to="/recommendations" className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline">See full action plan <ArrowRight className="h-3 w-3" /></Link>
      </div>
    </div>
  );
}

function Row({ label, value, good, bad }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-mono font-semibold ${good ? 'text-chart-3' : bad ? 'text-chart-4' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}
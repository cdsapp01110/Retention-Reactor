import { useState } from 'react';
import { useAnalyticsQuery, fmtMoney, fmtPct } from '@/lib/analytics';
import SegmentTable from '@/components/analytics/SegmentTable';
import Skeleton, { PageHeader } from '@/components/ui/Skeleton';
import { Star, AlertTriangle, TrendingUp } from 'lucide-react';

const DIMS = [
  { key: 'channel', label: 'Channel' },
  { key: 'device', label: 'Device' },
  { key: 'region', label: 'Region' }
];

export default function SegmentExplorer() {
  const { data, isLoading } = useAnalyticsQuery();
  const [dim, setDim] = useState('channel');
  if (isLoading || !data) return <div className="p-4 sm:p-6 lg:p-8"><PageHeader eyebrow="Module 04" title="Segment Explorer" /><Skeleton /></div>;

  const rows = data.segments[dim];
  const ranked = [...rows];
  const best = ranked[0];
  const worst = [...ranked].sort((a, b) => a.score - b.score)[0];
  const discRisk = ranked.find(r => r.tag === 'Discount Risk');

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        eyebrow="Module 04 · Segment intelligence"
        title="Segment Explorer"
        subtitle="Every segment is scored on conversion, retention, and LTV, then tagged for risk or opportunity. The ranking indicates where budget should be directed."
      />

      <div className="flex items-center gap-2 mb-6">
        {DIMS.map(d => (
          <button
            key={d.key}
            onClick={() => setDim(d.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${dim === d.key ? 'bg-primary text-primary-foreground' : 'glass text-muted-foreground hover:text-foreground'}`}
          >
            By {d.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4 mb-6">
        <Spotlight icon={Star} title="Best segment" name={best.segment} metric={`${best.retention}% retention · ${fmtMoney(best.ltv)} LTV`} accent="text-chart-3" tag="Retention Outlier" />
        <Spotlight icon={AlertTriangle} title="Worst segment" name={worst.segment} metric={`${worst.conversion}% conversion · score ${worst.score}`} accent="text-destructive" tag={worst.tag} />
        {discRisk
          ? <Spotlight icon={TrendingUp} title="Discount risk" name={discRisk.segment} metric={`${discRisk.discountAdoption}% disc · ${discRisk.retention}% retention`} accent="text-chart-4" tag="Discount Risk" />
          : <Spotlight icon={TrendingUp} title="High value" name={best.segment} metric={`${fmtMoney(best.ltv)} LTV`} accent="text-chart-2" tag="High Value" />}
      </div>

      <SegmentTable rows={rows} dimension={DIMS.find(d => d.key === dim).label} />

      <div className="mt-6 glass rounded-2xl p-5">
        <h3 className="font-heading font-semibold mb-3">Narrated insight</h3>
        <div className="space-y-3 text-sm text-foreground/85 leading-relaxed">
          <p><b className="text-chart-3">{best.segment}</b> is the healthiest segment, with high retention and strong LTV. Concentrate acquisition spend here and replicate its onboarding flow in weaker channels.</p>
          <p><b className="text-destructive">{worst.segment}</b> drags down the portfolio. The issue is {worst.conversion < 20 ? 'low conversion at the top of the funnel' : 'buyers purchase once and do not return'}. Run a diagnostic before investing further.</p>
          {discRisk && <p><b className="text-chart-4">{discRisk.segment}</b> over-indexes on discount-acquired customers who churn. Reduce promo depth and shift toward lifecycle CRM.</p>}
          <p className="text-xs text-muted-foreground pt-2 border-t border-border">Opportunity score weights conversion at 30%, retention at 40%, and capped LTV at 30%. Tags use rule-based thresholds; see the SQL Logic page for details.</p>
        </div>
      </div>
    </div>
  );
}

function Spotlight({ icon: Icon, title, name, metric, accent, tag }) {
  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{title}</span>
        <Icon className={`h-4 w-4 ${accent}`} />
      </div>
      <div className="font-heading text-xl font-bold">{name}</div>
      <div className="text-sm text-muted-foreground mt-1">{metric}</div>
      <span className="mt-3 inline-block text-[11px] px-2 py-0.5 rounded-full border border-border text-muted-foreground">{tag}</span>
    </div>
  );
}
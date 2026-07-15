import { useAnalyticsQuery } from '@/lib/analytics';
import RecommendationCard from '@/components/analytics/RecommendationCard';
import Skeleton, { PageHeader } from '@/components/ui/Skeleton';
import { ArrowUpRight } from 'lucide-react';

const NEXT_ANALYSES = [
  { q: 'Survival-curve churn model on each cohort', why: 'Replace the retention binary with a hazard function that forecasts LTV.' },
  { q: 'Channel-level CAC and payback integration', why: 'Tie acquisition cost to retention-quality LTV for a true ROAS figure.' },
  { q: 'Causal uplift: discount A/B holdout', why: 'Quantify how much discount revenue is incremental versus cannibalized.' },
  { q: 'Funnel attribution by session path', why: 'Multi-touch attribution to separate assist and convert channels.' }
];
const LIMITATIONS = [
  'Simulated, synthetic data designed to mirror real event and order systems. Patterns are illustrative, not from a live business.',
  'Margin is a proxy (category margin percentage), not a costed P&L, and net revenue ignores refunds and reversals.',
  'Cohorts are monthly, so weekly seasonality is smoothed out.',
  'Discount treatment is observational, not randomized, so no causal claim on conversion lift.'
];

export default function Recommendations() {
  const { data, isLoading } = useAnalyticsQuery();
  if (isLoading || !data) return <div className="p-8"><PageHeader eyebrow="Module 05" title="Action Plan" /><Skeleton /></div>;

  return (
    <div className="p-8 max-w-6xl mx-auto animate-fade-in">
      <PageHeader
        eyebrow="Module 05 · Recommendations engine"
        title="Evidence-based action plan"
        subtitle="Every initiative is generated from the live metrics in this app. The finding cites the exact metric that triggered it, followed by a concrete action, the projected impact, and a confidence level."
      />

      <div className="rounded-2xl border border-primary/25 bg-primary/5 px-5 py-4 mb-6 text-sm text-foreground/85">
        Priority reflects impact multiplied by confidence. High-impact, high-confidence initiatives come first. Medium-confidence items are paired with the diagnostic that would raise confidence.
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {data.recommendations.map((r, i) => <RecommendationCard key={r.id} rec={r} index={i} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-5 mt-8">
        <div className="glass rounded-2xl p-5">
          <h3 className="font-heading font-semibold mb-3">Prioritized initiatives</h3>
          <div className="space-y-2 text-sm">
            {data.recommendations
              .sort((a, b) => impactRank(b) - impactRank(a))
              .map((r, i) => (
                <div key={r.id} className="flex items-center gap-3 py-1.5 border-b border-border/60 last:border-0">
                  <span className="num text-lg font-bold text-primary w-6">{i + 1}</span>
                  <span className="flex-1 text-foreground/85">{r.title}</span>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full ${r.impact === 'High' ? 'bg-chart-4/15 text-chart-4' : r.impact === 'Medium' ? 'bg-chart-5/15 text-chart-5' : 'bg-muted text-muted-foreground'}`}>{r.impact}</span>
                  <span className="text-[11px] text-muted-foreground w-24 text-right">{r.confidence} conf.</span>
                </div>
              ))}
          </div>
        </div>
        <div className="glass rounded-2xl p-5">
          <h3 className="font-heading font-semibold mb-3 flex items-center gap-2">Next analyses to run <ArrowUpRight className="h-4 w-4 text-primary" /></h3>
          <div className="space-y-3 text-sm">
            {NEXT_ANALYSES.map(n => (
              <div key={n.q} className="border-b border-border/60 pb-2 last:border-0">
                <div className="font-medium text-foreground/90">{n.q}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{n.why}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="glass rounded-2xl p-5 mt-6">
        <h3 className="font-heading font-semibold mb-3">Limitations & cautions</h3>
        <ul className="space-y-1.5 text-sm text-muted-foreground list-none">
          {LIMITATIONS.map(l => <li key={l} className="flex gap-2"><span className="text-chart-4">·</span> {l}</li>)}
        </ul>
      </div>
    </div>
  );
}

function impactRank(r) {
  const i = r.impact === 'High' ? 2 : r.impact === 'Medium' ? 1 : 0;
  const c = r.confidence === 'High' ? 1.5 : r.confidence === 'Medium' ? 1 : 0.5;
  return i + c;
}
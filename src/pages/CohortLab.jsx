import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAnalyticsQuery, fmtMoney, fmtPct } from '@/lib/analytics';
import { useFilters } from '@/lib/filters';
import CohortHeatmap from '@/components/analytics/CohortHeatmap';
import FunnelChart from '@/components/analytics/FunnelChart';
import Skeleton, { PageHeader } from '@/components/ui/Skeleton';

function bundleQuarters(cohorts) {
  return cohorts.map(m => ({
    ...m,
    values: m.values.reduce((acc, v, i) => {
      if (!v) { acc.push(v); return acc; }
      const q = Math.floor(i / 3);
      if (q >= acc.length) acc.push({ period: q, retained: v.retained, rate: v.rate, _n: 1 });
      else {
        const cur = acc[q];
        cur.retained += v.retained; cur.rate = ((cur.rate || 0) * (cur._n) + v.rate) / (cur._n + 1); cur._n++;
      }
      return acc;
    }, []).map(v => v ? { period: v.period, retained: v.retained, rate: Math.round(v.rate * 10) / 10, targetKey: null } : null)
  }));
}

export default function CohortLab() {
  const { data, isLoading } = useAnalyticsQuery();
  const { filters } = useFilters();
  const [selected, setSelected] = useState(null);

  if (isLoading || !data) return <div className="p-8"><PageHeader eyebrow="Module 01" title="Cohort Lab" /><Skeleton /></div>;

  const cohorts = filters.granularity === 'quarter' ? bundleQuarters(data.cohorts.matrix) : data.cohorts.matrix;
  const maxPeriod = Math.max(...data.cohorts.matrix.map(c => c.values.filter(v => v).length - 1));
  const curveData = Array.from({ length: maxPeriod + 1 }, (_, p) => {
    const row = { period: filters.granularity === 'quarter' ? `Q${Math.floor(p / 3)}` : `M${p}` };
    data.cohorts.curves.forEach(c => { if (c.curve[p] != null) row[c.cohort] = c.curve[p]; });
    return row;
  });
  const palette = ['#265 89% 68%','chart-2','chart-3','chart-4','chart-5'];
  const detail = selected ? data.cohortDetail[selected] : null;
  const cohortTypeLabel = filters.cohortType === 'first_purchase' ? 'first-purchase' : 'signup';

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        eyebrow="Module 01 · Cohort retention"
        title="Cohort Lab"
        subtitle={`${cohortTypeLabel} cohorts, ${data.cohorts.matrix.length} monthly groups. Each cell shows the share of the cohort still active that many months after acquisition. Click a row to inspect its channels and funnel.`}
      />

      <div className="glass rounded-2xl p-5 overflow-x-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold">Retention heatmap</h3>
          <span className="text-xs text-muted-foreground">{filters.granularity === 'quarter' ? 'quarterly buckets' : 'monthly periods'}</span>
        </div>
        <CohortHeatmap cohorts={cohorts} onSelectCohort={setSelected} selectedCohort={selected} />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-6">
        <div className="glass rounded-2xl p-5 lg:col-span-2">
          <h3 className="font-heading font-semibold mb-4">Cohort retention curves</h3>
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={curveData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
              <XAxis dataKey="period" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: 12, fontSize: 12, color: 'hsl(var(--foreground))' }}
                labelStyle={{ color: 'hsl(var(--muted-foreground))' }}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {data.cohorts.curves.map((c, i) => {
                const isSel = selected === c.cohort;
                const color = isSel ? 'hsl(var(--primary))' : `hsl(${230 + i * 12} 70% 65%)`;
                return <Line key={c.cohort} type="monotone" dataKey={c.cohort} stroke={color} strokeWidth={isSel ? 3 : 1.2} dot={false} opacity={selected && !isSel ? 0.4 : 1} />;
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass rounded-2xl p-5">
          <h3 className="font-heading font-semibold mb-3">Cohort drill-down</h3>
          {detail ? (
            <>
              <div className="text-sm text-muted-foreground">{selected}</div>
              <div className="grid grid-cols-2 gap-3 my-4">
                <Metric label="Size" value={detail.size} />
                <Metric label="M1 retention" value={detail.m1Rate == null ? '—' : fmtPct(detail.m1Rate)} />
                <Metric label="Net revenue" value={fmtMoney(detail.netRevenue)} />
                <Metric label="AOV" value={fmtMoney(detail.aov)} />
              </div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Channel mix</div>
              <div className="space-y-1.5 mb-4">
                {detail.channelMix.map(cm => (
                  <div key={cm.seg} className="flex items-center gap-2 text-sm">
                    <div className="flex-1 truncate text-foreground/80">{cm.seg}</div>
                    <div className="w-24 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary" style={{ width: `${(cm.count / detail.size) * 100}%` }} />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground w-6 text-right">{cm.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground py-8 text-center">
              Select a cohort row to reveal its channel mix and funnel.
            </div>
          )}
        </div>
      </div>

      {detail && (
        <div className="glass rounded-2xl p-5 mt-6">
          <h3 className="font-heading font-semibold mb-4">Funnel for {selected}</h3>
          <FunnelChart stages={detail.funnel} />
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card/40 p-3">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className="num text-xl font-bold mt-1">{value}</div>
    </div>
  );
}
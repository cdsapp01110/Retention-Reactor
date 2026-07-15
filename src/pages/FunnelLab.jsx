import FunnelChart from '@/components/analytics/FunnelChart';
import { useAnalyticsQuery, fmtPct } from '@/lib/analytics';
import Skeleton, { PageHeader } from '@/components/ui/Skeleton';
import { Smartphone, Monitor, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

function CompareBars({ rows, metricLabel = 'End-to-end conversion', valueKey = 'conversion' }) {
  if (!rows || !rows.length) return null;
  const max = Math.max(...rows.map(r => r[valueKey] || 0)) || 1;
  return (
    <div className="space-y-2.5">
      {rows.map((r, i) => {
        const v = r[valueKey] || 0;
        return (
          <div key={i} className="flex items-center gap-3">
            <div className="w-32 text-sm text-foreground/85 truncate shrink-0">{r.segment || r._dim}</div>
            <div className="flex-1 h-6 rounded-md bg-muted/30 overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${(v / max) * 100}%` }} transition={{ delay: i * 0.05 }} className="h-full bg-primary/80 rounded-md" />
            </div>
            <span className="font-mono text-xs text-muted-foreground w-12 text-right">{fmtPct(v)}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function FunnelLab() {
  const { data, isLoading } = useAnalyticsQuery();
  if (isLoading || !data) return <div className="p-8"><PageHeader eyebrow="Module 02" title="Funnel Lab" /><Skeleton /></div>;
  const f = data.funnel;
  const mobile = f.byDevice.find(d => d.segment === 'Mobile');
  const desktop = f.byDevice.find(d => d.segment === 'Desktop');
  const paidAvg = avg([...f.byChannel].map(c => (data.segments.channel.find(s => s.segment === c.segment)?.conversion || 0)));
  const dl = data.segments;

  return (
    <div className="p-8 max-w-7xl mx-auto animate-fade-in">
      <PageHeader
        eyebrow="Module 02 · Funnel drop-off"
        title="Funnel Lab"
        subtitle="Watch people move from visit to purchase, one step at a time. See where they drop off, and which channel or device is to blame."
      />

      <div className="glass rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-5">Overall funnel</h3>
        <FunnelChart stages={f.stages} />
        {f.worstBottleneck && (
          <div className="mt-5 flex items-start gap-3 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm">
            <AlertTriangle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <b className="text-destructive">Biggest bottleneck:</b> {f.worstBottleneck.label} loses{' '}
              <b>{fmtPct(f.worstBottleneck.dropOff)}</b> of users ({f.worstBottleneck.lost} people). Only{' '}
              {fmtPct(f.worstBottleneck.stepConv)} make it through this step.
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <Callout icon={Smartphone} title="Mobile checkout" accent="chart-4" value={mobile ? fmtPct(mobile.checkoutToPurchase) : '—'} sub="checkout → purchase" />
        <Callout icon={Monitor} title="Desktop checkout" accent="chart-3" value={desktop ? fmtPct(desktop.checkoutToPurchase) : '—'} sub="checkout → purchase" />
      </div>

      <div className="grid lg:grid-cols-3 gap-5 mt-6">
        <Panel title="By channel">
          <CompareBars rows={f.byChannel} valueKey="conversion" />
        </Panel>
        <Panel title="By device">
          <CompareBars rows={f.byDevice} valueKey="conversion" />
        </Panel>
        <Panel title="By region">
          <CompareBars rows={f.byRegion} valueKey="conversion" />
        </Panel>
      </div>

      <div className="glass rounded-2xl p-6 mt-6">
        <h3 className="font-heading font-semibold mb-4">Checkout → purchase by device</h3>
        <CompareBars rows={f.byDevice.map(d => ({ segment: d.segment, conversion: d.checkoutToPurchase }))} valueKey="conversion" metricLabel="Checkout→Purchase" />
        <p className="mt-4 text-sm text-muted-foreground">
          Mobile checkout is the biggest leak you can actually fix. Get 10 more points out of mobile checkout-to-purchase and you add roughly {mobile ? Math.round((mobile.conversion - desktop?.conversion)) : 0} points to the whole funnel.
        </p>
      </div>
    </div>
  );
}

function avg(arr) { return arr.length ? Math.round(arr.reduce((s, n) => s + n, 0) / arr.length * 10) / 10 : 0; }

function Panel({ title, children }) {
  return (
    <div className="glass rounded-2xl p-5">
      <h4 className="font-heading font-semibold mb-4">{title}</h4>
      {children}
    </div>
  );
}

function Callout({ icon: Icon, title, value, sub, accent }) {
  return (
    <div className="glass rounded-2xl p-5 flex items-center gap-4">
      <div className={`h-12 w-12 rounded-xl bg-${accent}/10 border border-${accent}/20 flex items-center justify-center text-${accent}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <div className="text-xs text-muted-foreground uppercase tracking-wider">{title}</div>
        <div className={`num text-2xl font-bold text-foreground`}>{value}</div>
        <div className="text-xs text-muted-foreground/70">{sub}</div>
      </div>
    </div>
  );
}
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Database, CalendarRange, Filter, TrendingUp } from 'lucide-react';
import { useAnalyticsQuery, fmtMoney, fmtPct } from '@/lib/analytics';
import FunnelChart from '@/components/analytics/FunnelChart';
import PageMenu from '@/components/PageMenu';

export default function Landing() {
  const { data } = useAnalyticsQuery();
  const k = data?.kpis;
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -left-40 h-80 w-80 rounded-full bg-chart-2/15 blur-[120px] pointer-events-none" />

      <nav className="relative flex items-center justify-between px-4 sm:px-8 py-4 sm:py-5">
        <span className="font-heading font-bold tracking-tight">Retention Reactor</span>
        <PageMenu />
      </nav>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-8 pt-10 sm:pt-16 pb-20 sm:pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <h1 className="font-heading text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.02]">
            See what brings customers <span className="gradient-text">back</span>.<br />
            Find where shoppers <span className="text-muted-foreground">lose interest</span>.
          </h1>
          <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            A mock direct-to-consumer subscription brand, built as a portfolio case study. Its simulated customers span North America and skew toward urban professionals between 25 and 44. The dashboard shows which of those buyers return, where the funnel leaks, and how discounts affect revenue.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/cohorts" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 sm:px-5 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity text-sm sm:text-base">
              <CalendarRange className="h-4 w-4" /> Explore Cohorts <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/funnel" className="inline-flex items-center gap-2 glass px-4 sm:px-5 py-3 rounded-xl font-medium hover:bg-card/70 transition-colors text-sm sm:text-base">
              <Filter className="h-4 w-4" /> See Funnel Leaks
            </Link>
            <Link to="/sql" className="inline-flex items-center gap-2 glass px-4 sm:px-5 py-3 rounded-xl font-medium hover:bg-card/70 transition-colors text-sm sm:text-base">
              <Database className="h-4 w-4" /> View SQL Logic
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="mt-12 sm:mt-16 glass rounded-3xl p-5 sm:p-6 glow-violet"
        >
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <MiniStat label="Net revenue" value={k ? fmtMoney(k.netRevenue) : '—'} sub={`${k ? fmtPct(k.marginPct) : '—'} margin`} />
            <MiniStat label="Conversion" value={k ? fmtPct(k.conversionRate) : '—'} sub="visit → purchase" accent="chart-2" />
            <MiniStat label="Avg LTV" value={k ? fmtMoney(k.totalCustomers ? Math.round(k.netRevenue / k.totalCustomers) : 0) : '—'} sub={`${k ? k.totalOrders : '—'} orders`} accent="chart-3" />
          </div>
          <div className="border-t border-border pt-5">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" /> Funnel preview</div>
            {data ? <FunnelChart stages={data.funnel.stages} /> : <div className="h-40 animate-pulse rounded-xl bg-muted/30" />}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, sub, accent = 'chart-1' }) {
  return (
    <div className="rounded-2xl border border-border bg-card/40 p-4">
      <div className="text-xs text-muted-foreground uppercase tracking-wider">{label}</div>
      <div className={`num text-3xl font-bold mt-1 text-${accent}`}>{value}</div>
      <div className="text-xs text-muted-foreground/70 mt-0.5">{sub}</div>
    </div>
  );
}
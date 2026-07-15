import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Database, CalendarRange, Filter, Sparkles, TrendingUp } from 'lucide-react';
import { useAnalyticsQuery, fmtMoney, fmtPct } from '@/lib/analytics';
import FunnelChart from '@/components/analytics/FunnelChart';

export default function Landing() {
  const { data } = useAnalyticsQuery();
  const k = data?.kpis;
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden">
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="absolute -top-40 -right-40 h-96 w-96 rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 -left-40 h-80 w-80 rounded-full bg-chart-2/15 blur-[120px] pointer-events-none" />

      <nav className="relative flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg shadow-primary/30">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="font-heading font-bold tracking-tight">Retention Reactor</span>
        </div>
        <div className="flex items-center gap-2">
          <Link to="/login" className="text-sm text-muted-foreground hover:text-foreground px-3 py-1.5">Sign in</Link>
          <Link to="/register" className="text-sm font-medium bg-primary text-primary-foreground px-4 py-1.5 rounded-lg hover:opacity-90 transition-opacity">Get access</Link>
        </div>
      </nav>

      <div className="relative max-w-6xl mx-auto px-8 pt-16 pb-24">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <div className="inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full border border-border bg-card/40 backdrop-blur text-muted-foreground mb-6">
            <span className="h-1.5 w-1.5 rounded-full bg-chart-3 animate-pulse" />
            SQL-first product analytics · portfolio case study
          </div>
          <h1 className="font-heading text-5xl md:text-7xl font-bold tracking-tight leading-[1.02]">
            Retention, <span className="gradient-text">decoded</span>.<br />
            Where your funnel <span className="text-muted-foreground">bleeds</span>.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
            A decision-intelligence layer over an event & order warehouse. Cohort retention, funnel drop-off,
            and discount-driven revenue quality — every chart backed by queryable SQL, not a black-box BI export.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link to="/cohorts" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl font-medium hover:opacity-90 transition-opacity">
              <CalendarRange className="h-4 w-4" /> Explore Cohorts <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/funnel" className="inline-flex items-center gap-2 glass px-5 py-3 rounded-xl font-medium hover:bg-card/70 transition-colors">
              <Filter className="h-4 w-4" /> See Funnel Leaks
            </Link>
            <Link to="/sql" className="inline-flex items-center gap-2 glass px-5 py-3 rounded-xl font-medium hover:bg-card/70 transition-colors">
              <Database className="h-4 w-4" /> View SQL Logic
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
          className="mt-16 glass rounded-3xl p-6 glow-violet"
        >
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <MiniStat label="Net revenue" value={k ? fmtMoney(k.netRevenue) : '—'} sub={`${k ? fmtPct(k.marginPct) : '—'} margin`} />
            <MiniStat label="Conversion" value={k ? fmtPct(k.conversionRate) : '—'} sub="visit → purchase" accent="chart-2" />
            <MiniStat label="Avg LTV" value={k ? fmtMoney(k.totalCustomers ? Math.round(k.netRevenue / k.totalCustomers) : 0) : '—'} sub={`${k ? k.totalOrders : '—'} orders`} accent="chart-3" />
          </div>
          <div className="border-t border-border pt-5">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><TrendingUp className="h-3.5 w-3.5" /> Live funnel preview</div>
            {data ? <FunnelChart stages={data.funnel.stages} /> : <div className="h-40 animate-pulse rounded-xl bg-muted/30" />}
          </div>
        </motion.div>

        <div className="mt-10 grid md:grid-cols-3 gap-4 text-sm">
          {[
            ['Built on a real schema', 'users, sessions, events, orders, order_items, products, campaigns, channels, regions — modeled after a modern event store.'],
            ['SQL is the hero', 'Every module documents the CTEs, window functions, and CASE-logic that produce it. No hidden queries.'],
            ['Evidence over fluff', 'Each recommendation cites the exact metric that triggered it — defensible in a hiring panel.']
          ].map(([h, p]) => (
            <div key={h} className="glass rounded-2xl p-5">
              <h3 className="font-heading font-semibold text-foreground mb-1.5">{h}</h3>
              <p className="text-muted-foreground leading-relaxed">{p}</p>
            </div>
          ))}
        </div>
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
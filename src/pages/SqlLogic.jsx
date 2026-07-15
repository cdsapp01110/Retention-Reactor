import { useState } from 'react';
import SqlBlock from '@/components/analytics/SqlBlock';
import { SCHEMA, QUERIES } from '@/lib/sqlQueries';
import { PageHeader } from '@/components/ui/Skeleton';
import { ChevronDown, Database, Table2 } from 'lucide-react';

export default function SqlLogic() {
  return (
    <div className="p-8 max-w-5xl mx-auto animate-fade-in">
      <PageHeader
        eyebrow="The query layer"
        title="SQL Logic Showcase"
        subtitle="The charts elsewhere derive from queries like these: multiple CTEs, window functions, conditional funnels, and CASE logic. The app runs an analytics engine over the same data model, so the numbers match."
      />

      <div className="glass rounded-2xl p-6 mb-6">
        <h3 className="font-heading text-lg font-semibold mb-1 flex items-center gap-2"><Database className="h-5 w-5 text-primary" /> Analytical data model</h3>
        <p className="text-sm text-muted-foreground mb-5">A star-schema-style model: dimension tables describe customers, products, and geography; fact tables capture behavior and transactions.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {SCHEMA.map(t => (
            <div key={t.table} className="rounded-xl border border-border bg-card/40 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Table2 className={`h-4 w-4 ${t.kind === 'fact' ? 'text-chart-4' : 'text-chart-2'}`} />
                <span className="font-mono text-sm font-semibold text-foreground">{t.table}</span>
                <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded ${t.kind === 'fact' ? 'bg-chart-4/15 text-chart-4' : 'bg-chart-2/15 text-chart-2'}`}>{t.kind}</span>
              </div>
              <ul className="text-[11px] font-mono text-muted-foreground space-y-0.5 leading-relaxed">
                {t.fields.map(f => <li key={f}>· {f}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
          <span><span className="inline-block h-2 w-2 rounded-full bg-chart-2 mr-1" />dim = reference</span>
          <span><span className="inline-block h-2 w-2 rounded-full bg-chart-4 mr-1" />fact = events/transactions</span>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-6">
        {['Multiple CTEs', 'Window functions (LAG / NTILE)', 'Conditional funnel ladders', 'Cohort anchor logic', 'Period-over-period', 'CASE-based risk tagging'].map(p => (
          <div key={p} className="glass rounded-xl px-4 py-3 text-sm text-foreground/85 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" /> {p}
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {QUERIES.map((q, i) => <QueryPanel key={q.id} q={q} index={i} defaultOpen={i < 2} />)}
      </div>
    </div>
  );
}

function QueryPanel({ q, defaultOpen = false, index = 0 }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="glass rounded-2xl overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-5 py-4 text-left">
        <div>
          <div className="text-[11px] uppercase tracking-wider text-primary/70 font-medium">{q.module}</div>
          <div className="font-heading font-semibold text-foreground mt-0.5">{index + 1}. {q.title}</div>
          <div className="text-sm text-muted-foreground mt-1">{q.question}</div>
        </div>
        <ChevronDown className={`h-5 w-5 text-muted-foreground shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="px-5 pb-5 space-y-4 animate-fade-in">
          <div className="text-sm text-foreground/85 leading-relaxed rounded-xl border border-border bg-card/40 px-4 py-3">
            <span className="text-xs uppercase tracking-wider text-muted-foreground block mb-1">Why this query</span>
            {q.why}
          </div>
          <SqlBlock code={q.sql} title={`query_${q.id}.sql`} />
        </div>
      )}
    </div>
  );
}
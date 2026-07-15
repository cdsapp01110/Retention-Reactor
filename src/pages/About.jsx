import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/Skeleton';
import { ArrowRight } from 'lucide-react';

const SECTIONS = [
  { h: 'Business question', p: 'For a subscription-style e-commerce product: which customer cohorts retain best, where does the funnel leak by channel/device/region/discount, which segments create durable value, and what should leadership do next?' },
  { h: 'Methodology', p: 'I modeled a star-schema of users, sessions, events, orders, order_items, products, campaigns, channels, and regions, then built analytical logic — cohort assignment, retention matrices, conditional funnels, discount-quality comparison, and risk/opportunity ranking — expressed as SQL. The app runs an analytics engine that consumes this model and reproduces what those queries would return.' },
  { h: 'Key findings', p: 'Discount-acquired customers convert faster but carry materially lower margin and repeat rates. Mobile checkout completion is the single largest funnel leak. One channel cohort (Email) is a clear retention outlier worth scaling. Month-1 retention averages modestly — a repeat-purchase engine is the highest-leverage lifecycle investment.' },
  { h: 'Recommendations', p: 'Fix mobile checkout, curtail discounting on the promo-heaviest channel, reallocate paid spend toward the highest-retention channel, investigate the weakest region, and build a 14/30-day post-purchase lifecycle program. All are quantified in the Action Plan.' },
  { h: 'Limitations', p: 'Synthetic data, proxy margins, monthly cohorts, observational discount treatment. Detailed on the Action Plan page.' },
  { h: 'Next steps', p: 'Survival-churn modeling, CAC/LTV payback integration, a randomized discount holdout for causal lift, and multi-touch session attribution.' }
];

export default function About() {
  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        eyebrow="Portfolio context"
        title="About this case study"
        subtitle="A self-contained, SQL-first product analytics scenario built to demonstrate analytical thinking, product sense, and stakeholder-grade tooling."
      />

      <div className="glass rounded-2xl p-6 mb-6">
        <p className="text-foreground/90 leading-relaxed">
          This is a <b>simulated but realistic</b> product analytics scenario. The data model was designed to mirror
          real-world event, order, and customer systems — the analytical questions, SQL patterns, and recommendations
          are exactly what a senior product analyst would ship. The focus is <b>SQL-driven decision intelligence</b>:
          turning messy behavioral data into evidence and action, not just charts.
        </p>
      </div>

      <div className="space-y-4">
        {SECTIONS.map(s => (
          <div key={s.h} className="glass rounded-2xl p-5">
            <h3 className="font-heading font-semibold text-primary mb-2">{s.h}</h3>
            <p className="text-foreground/85 leading-relaxed">{s.p}</p>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 mt-6 grid sm:grid-cols-3 gap-4 text-center">
        <Stat n="288" label="simulated customers" />
        <Stat n="12" label="monthly cohorts" />
        <Stat n="8" label="documented SQL queries" />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link to="/sql" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-5 py-3 rounded-xl font-medium hover:opacity-90">Read the SQL logic <ArrowRight className="h-4 w-4" /></Link>
        <Link to="/overview" className="inline-flex items-center gap-2 glass px-5 py-3 rounded-xl font-medium hover:bg-card/70">Go to overview <ArrowRight className="h-4 w-4" /></Link>
      </div>
    </div>
  );
}

function Stat({ n, label }) {
  return (
    <div>
      <div className="num text-3xl font-bold gradient-text">{n}</div>
      <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{label}</div>
    </div>
  );
}
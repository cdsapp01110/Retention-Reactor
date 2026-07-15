import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/Skeleton';
import { ArrowRight } from 'lucide-react';

const SECTIONS = [
  { h: 'Business question', p: 'For a subscription-style e-commerce product: which customers actually stick around, where does the funnel leak by channel, device, region, and discount, which segments create lasting value, and what should leadership do next?' },
  { h: 'Methodology', p: 'I built a star schema with users, sessions, events, orders, order_items, products, campaigns, channels, and regions. Then I wrote the analytical logic as SQL: cohort assignment, retention matrices, conditional funnels, discount-quality comparison, and risk/opportunity ranking. The app runs an analytics engine that consumes the same model and reproduces what those queries return.' },
  { h: 'Key findings', p: 'Discount customers convert faster but carry much lower margin and repeat far less often. Mobile checkout is the biggest funnel leak. One channel (Email) is a clear retention outlier worth scaling. Month-1 retention is modest, so a repeat-purchase engine is the highest-leverage lifecycle bet.' },
  { h: 'Recommendations', p: 'Fix mobile checkout, pull back discounting on the promo-heaviest channel, move paid spend toward the best-retention channel, dig into the weakest region, and build a 14/30-day post-purchase lifecycle program. The Action Plan page puts numbers on all of it.' },
  { h: 'Limitations', p: 'Synthetic data, proxy margins, monthly cohorts, and observational discount treatment (no causal claim). The Action Plan page says more.' },
  { h: 'Next steps', p: 'Survival-churn modeling, CAC-to-LTV payback, a randomized discount holdout for real causal lift, and multi-touch session attribution.' }
];

export default function About() {
  return (
    <div className="p-8 max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        eyebrow="Portfolio context"
        title="About this case study"
        subtitle="A made-up but realistic analytics scenario. It shows how a product analyst turns messy behavioral data into evidence and action."
      />

      <div className="glass rounded-2xl p-6 mb-6">
        <p className="text-foreground/90 leading-relaxed">
          This is a made-up but realistic analytics scenario. The data model mirrors real event, order, and customer systems, and the questions, SQL patterns, and recommendations are what a senior product analyst would actually ship. The point is SQL-driven decision-making: turning behavior into evidence and action.
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
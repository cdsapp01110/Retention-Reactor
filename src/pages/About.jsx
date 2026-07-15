import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/Skeleton';
import { ArrowRight } from 'lucide-react';

const SOURCES = [
  { name: 'U.S. Census Bureau', desc: 'Population and household demographics by region', href: 'https://data.census.gov' },
  { name: 'Bureau of Economic Analysis', desc: 'Consumer spending and retail e-commerce', href: 'https://www.bea.gov' },
  { name: 'Statista', desc: 'E-commerce and subscription market benchmarks', href: 'https://www.statista.com' }
];

const SECTIONS = [
  { h: 'Business question', p: 'For a mock subscription-style e-commerce brand: which customers return, where the funnel leaks by channel, device, region, and discount, which segments create lasting value, and what should leadership do next.' },
  { h: 'Methodology', p: 'I modeled a star schema with users, sessions, events, orders, order_items, products, campaigns, channels, and regions. I then wrote the analytical logic as SQL: cohort assignment, retention matrices, conditional funnels, discount-quality comparison, and risk and opportunity ranking. The figures throughout this app come from running that same logic on the simulated data.' },
  { h: 'Key findings', p: 'Discount customers convert faster but carry materially lower margin and repeat far less often. Mobile checkout is the largest funnel leak. One channel (Email) is a clear retention outlier worth scaling. First-month retention is modest, so a repeat-purchase program is the highest-leverage lifecycle investment.' },
  { h: 'Recommendations', p: 'Fix mobile checkout, reduce discounting on the promo-heaviest channel, redirect paid spend toward the best-retention channel, investigate the weakest region, and build a post-purchase lifecycle program that fires on days 14 and 30. The Action Plan page quantifies each of these.' },
  { h: 'Limitations', p: 'Synthetic data, proxy margins, monthly cohorts, and observational discount treatment, so no causal claim on conversion lift. The Action Plan page details these further.' },
  { h: 'Next steps', p: 'Survival-churn modeling, cost-to-LTV payback, a randomized discount holdout for causal lift, and multi-touch session attribution.' }
];

export default function About() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto animate-fade-in">
      <PageHeader
        eyebrow="Portfolio context"
        title="About this case study"
        subtitle="A portfolio case study built on a mock subscription brand and simulated customers, showing how a product analyst turns behavioral data into evidence and action."
      />

      <div className="glass rounded-2xl p-6 mb-6">
        <p className="text-foreground/90 leading-relaxed">
          This is a portfolio case study, not a real business. The company, customers, orders, and events are entirely simulated. The data model mirrors the structure of real event, order, and customer systems, and the SQL patterns and recommendations reflect what a senior product analyst would produce. The objective is SQL-driven decision support: turning behavioral data into evidence and action.
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

      <div className="glass rounded-2xl p-6 mt-6">
        <h3 className="font-heading font-semibold text-primary mb-2">Sources</h3>
        <p className="text-foreground/85 leading-relaxed mb-4">
          The figures are synthetic and are not drawn from any source. The references below are publicly available datasets and reports describing the markets this mock business represents, so a reader can verify the context independently.
        </p>
        <ul className="space-y-3">
          {SOURCES.map(s => (
            <li key={s.name} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 text-sm">
              <span className="font-medium text-foreground min-w-[220px]">{s.name}</span>
              <span className="text-muted-foreground flex-1">{s.desc}</span>
              <a href={s.href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline whitespace-nowrap">{s.href.replace('https://', '')}</a>
            </li>
          ))}
        </ul>
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
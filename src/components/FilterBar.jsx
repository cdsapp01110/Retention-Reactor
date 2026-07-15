import { useFilters } from '@/lib/filters';
import { useAnalyticsQuery } from '@/lib/analytics';
import { RotateCcw } from 'lucide-react';

function Pills({ label, value, options, onSelect }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70 font-medium">{label}</span>
      <div className="flex items-center gap-1 bg-muted/30 rounded-lg p-0.5 border border-border">
        {options.map(opt => {
          const active = value === opt;
          return (
            <button
              key={opt}
              onClick={() => onSelect(opt)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${active ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {opt === 'all' ? 'All' : opt === 'yes' ? 'Discount' : opt === 'no' ? 'Full-price' : opt === 'signup' ? 'Signup' : opt === 'first_purchase' ? '1st Purchase' : opt === 'analyst' ? 'Analyst' : opt === 'executive' ? 'Executive' : opt === 'month' ? 'Month' : opt === 'quarter' ? 'Quarter' : opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function FilterBar() {
  const { filters, update, reset } = useFilters();
  const { data } = useAnalyticsQuery();
  const regions = data?.filterOptions?.regions || [];
  const channels = data?.filterOptions?.channels || [];
  const devices = data?.filterOptions?.devices || [];
  return (
    <div className="flex flex-wrap items-center gap-4 px-6 py-3 border-b border-border bg-background/60 backdrop-blur-xl sticky top-0 z-20">
      <Pills label="Region" value={filters.region} options={['all', ...regions]} onSelect={v => update({ region: v })} />
      <Pills label="Channel" value={filters.channel} options={['all', ...channels]} onSelect={v => update({ channel: v })} />
      <Pills label="Device" value={filters.device} options={['all', ...devices]} onSelect={v => update({ device: v })} />
      <Pills label="Discount" value={filters.discount} options={['all', 'yes', 'no']} onSelect={v => update({ discount: v })} />
      <div className="h-5 w-px bg-border" />
      <Pills label="Cohort" value={filters.cohortType} options={['signup', 'first_purchase']} onSelect={v => update({ cohortType: v })} />
      <Pills label="Mode" value={filters.mode} options={['analyst', 'executive']} onSelect={v => update({ mode: v })} />
      <Pills label="Granularity" value={filters.granularity} options={['month', 'quarter']} onSelect={v => update({ granularity: v })} />
      <button onClick={reset} className="ml-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
        <RotateCcw className="h-3.5 w-3.5" /> Reset
      </button>
    </div>
  );
}
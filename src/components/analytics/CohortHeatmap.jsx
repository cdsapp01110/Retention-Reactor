import { useState } from 'react';
import { fmtPct } from '@/lib/analytics';

function heatColor(rate) {
  if (rate == null) return { bg: 'hsl(var(--muted)/0.25)', txt: 'hsl(var(--muted-foreground)/0.4)' };
  // 0% -> dark slate, high -> bright teal
  const t = Math.max(0, Math.min(1, rate / 60));
  const hue = 198 - t * 24;        // 198 (slate blue) -> 174 (teal)
  const sat = 35 + t * 45;
  const light = 20 + t * 30;
  return {
    bg: `hsl(${hue} ${sat}% ${light}% / ${0.3 + t * 0.6})`,
    txt: light > 44 ? 'hsl(205 45% 7%)' : 'hsl(var(--foreground)/0.9)'
  };
}

export default function CohortHeatmap({ cohorts, onSelectCohort, selectedCohort }) {
  const [hover, setHover] = useState(null);
  if (!cohorts || !cohorts.length) return <div className="text-sm text-muted-foreground">No cohort data.</div>;
  const maxPeriod = Math.max(...cohorts.map(c => c.values.filter(v => v).length - 1));
  const periods = Array.from({ length: maxPeriod + 1 }, (_, i) => i);

  return (
    <div className="overflow-x-auto -mx-1 px-1">
      <table className="border-separate border-spacing-0 sm:border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="text-left text-muted-foreground font-medium pr-2 sm:pr-3 pb-2 sticky left-0 bg-background z-10">Cohort</th>
            <th className="text-muted-foreground font-medium pb-2 px-1 hidden sm:table-cell">Size</th>
            {periods.map(p => (
              <th key={p} className="text-muted-foreground font-medium pb-2 px-0 sm:px-1 text-center w-6 h-7 sm:w-14 sm:h-9">M{p}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {cohorts.map(row => {
            const label = row.cohort.slice(5,7) + "·" + row.cohort.slice(2,4);
            const isSelected = selectedCohort === row.cohort;
            return (
              <tr key={row.cohort}
                onClick={() => onSelectCohort?.(isSelected ? null : row.cohort)}
                className={`cursor-pointer transition-colors ${isSelected ? 'ring-1 ring-primary' : ''}`}
              >
                <td className={`pr-2 sm:pr-3 py-1 font-mono text-foreground sticky left-0 bg-background whitespace-nowrap text-[10px] sm:text-xs ${isSelected ? 'text-primary' : ''}`}>{label}</td>
                <td className="text-muted-foreground text-center px-1 font-mono hidden sm:table-cell">{row.size}</td>
                {row.values.map((v, i) => {
                  if (v == null) return <td key={i} className="w-6 h-7 sm:w-14 sm:h-9" />;
                  const c = heatColor(v.rate);
                  return (
                    <td
                      key={i}
                      onMouseEnter={() => setHover({ cohort: row.cohort, period: i, ...v })}
                      onMouseLeave={() => setHover(null)}
                      className="w-6 h-7 sm:w-14 sm:h-9 rounded-[3px] sm:rounded-md text-center font-mono text-[8px] sm:text-[11px] transition-transform hover:scale-110 hover:z-10 relative"
                      style={{ backgroundColor: c.bg, color: c.txt }}
                    >
                      {v.rate}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      {hover && (
        <div className="mt-3 text-xs text-muted-foreground glass rounded-lg px-3 py-2 inline-block">
          <span className="font-mono text-foreground">{hover.cohort}</span> · Period M{hover.period}:{' '}
          <b className="text-primary">{hover.retained}</b> retained ({fmtPct(hover.rate)})
        </div>
      )}
      <p className="mt-2 text-xs text-muted-foreground">Click a cohort row to inspect its channels and funnel. Cells above 60% retention saturate to teal.</p>
    </div>
  );
}
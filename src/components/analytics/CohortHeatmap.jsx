import { useState } from 'react';
import { fmtPct } from '@/lib/analytics';

function heatColor(rate) {
  if (rate == null) return { bg: 'hsl(var(--muted)/0.25)', txt: 'hsl(var(--muted-foreground)/0.4)' };
  // 0% -> muted blue-grey, 100% -> violet/cyan
  const t = Math.max(0, Math.min(1, rate / 60)); // saturate at 60% retention
  const hue = 255 - t * 70;        // 255 (indigo) -> 185 (cyan)
  const sat = 45 + t * 50;
  const light = 22 + t * 38;        // dark -> bright
  return {
    bg: `hsl(${hue} ${sat}% ${light}% / ${0.25 + t * 0.75})`,
    txt: light > 48 ? 'hsl(var(--background))' : 'hsl(var(--foreground)/0.85)'
  };
}

export default function CohortHeatmap({ cohorts, onSelectCohort, selectedCohort }) {
  const [hover, setHover] = useState(null);
  if (!cohorts || !cohorts.length) return <div className="text-sm text-muted-foreground">No cohort data.</div>;
  const maxPeriod = Math.max(...cohorts.map(c => c.values.filter(v => v).length - 1));
  const periods = Array.from({ length: maxPeriod + 1 }, (_, i) => i);

  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 text-xs">
        <thead>
          <tr>
            <th className="text-left text-muted-foreground font-medium pr-3 pb-2 sticky left-0 bg-background">Cohort</th>
            <th className="text-muted-foreground font-medium pb-2 px-1">Size</th>
            {periods.map(p => (
              <th key={p} className="text-muted-foreground font-medium pb-2 px-1 text-center w-14">M{p}</th>
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
                <td className={`pr-3 py-1 font-mono text-foreground sticky left-0 bg-background whitespace-nowrap ${isSelected ? 'text-primary' : ''}`}>{label}</td>
                <td className="text-muted-foreground text-center px-1 font-mono">{row.size}</td>
                {row.values.map((v, i) => {
                  if (v == null) return <td key={i} className="w-14 h-9" />;
                  const c = heatColor(v.rate);
                  return (
                    <td
                      key={i}
                      onMouseEnter={() => setHover({ cohort: row.cohort, period: i, ...v })}
                      onMouseLeave={() => setHover(null)}
                      className="w-14 h-9 rounded-md text-center font-mono text-[11px] transition-transform hover:scale-110 hover:z-10 relative"
                      style={{ backgroundColor: c.bg, color: c.txt }}
                    >
                      {v.rate}%
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
      <p className="mt-2 text-xs text-muted-foreground">Click a cohort row to filter downstream views. Cells above 60% retention saturate to cyan.</p>
    </div>
  );
}
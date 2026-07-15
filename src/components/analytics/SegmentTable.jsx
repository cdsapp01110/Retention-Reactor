import { fmtMoney, fmtPct } from '@/lib/analytics';
import { TrendingUp, TrendingDown, AlertTriangle, Star } from 'lucide-react';

const TAG_STYLE = {
  'Retention Outlier': { cls: 'text-chart-3 bg-chart-3/10 border-chart-3/20', icon: Star },
  'High Value': { cls: 'text-chart-2 bg-chart-2/10 border-chart-2/20', icon: TrendingUp },
  'Funnel Risk': { cls: 'text-destructive bg-destructive/10 border-destructive/20', icon: AlertTriangle },
  'Discount Risk': { cls: 'text-chart-4 bg-chart-4/10 border-chart-4/20', icon: AlertTriangle },
  'Stable': { cls: 'text-muted-foreground bg-muted/40 border-border', icon: TrendingDown }
};

export default function SegmentTable({ rows, dimension = 'Channel' }) {
  if (!rows || !rows.length) return <div className="text-sm text-muted-foreground">No segments.</div>;
  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-muted-foreground text-xs uppercase tracking-wider bg-muted/20">
            <th className="text-left px-4 py-2 font-medium">{dimension}</th>
            <th className="text-right px-3 py-2 font-medium">Cust</th>
            <th className="text-right px-3 py-2 font-medium">Conv</th>
            <th className="text-right px-3 py-2 font-medium">Retention</th>
            <th className="text-right px-3 py-2 font-medium">LTV</th>
            <th className="text-right px-3 py-2 font-medium">AOV</th>
            <th className="text-right px-3 py-2 font-medium">Disc%</th>
            <th className="text-right px-3 py-2 font-medium">Score</th>
            <th className="text-left px-3 py-2 font-medium">Tag</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(r => {
            const tag = TAG_STYLE[r.tag] || TAG_STYLE['Stable'];
            const TagIcon = tag.icon;
            return (
              <tr key={r.segment} className="border-t border-border hover:bg-muted/20 transition-colors">
                <td className="px-4 py-2.5 font-medium text-foreground">{r.segment}</td>
                <td className="px-3 py-2.5 text-right font-mono text-muted-foreground">{r.customers}</td>
                <td className="px-3 py-2.5 text-right font-mono">{r.conversion}%</td>
                <td className="px-3 py-2.5 text-right font-mono">{r.retention}%</td>
                <td className="px-3 py-2.5 text-right font-mono">{fmtMoney(r.ltv)}</td>
                <td className="px-3 py-2.5 text-right font-mono">{fmtMoney(r.aov)}</td>
                <td className="px-3 py-2.5 text-right font-mono">{r.discountAdoption}%</td>
                <td className="px-3 py-2.5 text-right font-mono text-primary font-semibold">{r.score}</td>
                <td className="px-3 py-2.5">
                  <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${tag.cls}`}>
                    <TagIcon className="h-3 w-3" /> {r.tag}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
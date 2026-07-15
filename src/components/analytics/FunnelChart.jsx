import { motion } from 'framer-motion';

export default function FunnelChart({ stages }) {
  if (!stages || !stages.length) return null;
  const max = Math.max(...stages.map(s => s.count)) || 1;
  const colors = ['chart-1','chart-2','chart-3','chart-4','chart-5'];
  return (
    <div className="space-y-2">
      {stages.map((s, i) => {
        const widthPct = (s.count / max) * 100;
        return (
          <motion.div key={s.key} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.08 }}>
            <div className="flex items-center gap-3">
              <div className="w-28 text-sm text-foreground/90 font-medium shrink-0">{s.label}</div>
              <div className="flex-1 h-10 rounded-lg bg-muted/30 overflow-hidden relative">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${widthPct}%` }}
                  transition={{ delay: i * 0.08, duration: 0.5, ease: 'easeOut' }}
                  className={`h-full rounded-lg bg-${colors[i]}/80 border border-${colors[i]}`}
                />
                <div className="absolute inset-0 flex items-center justify-between px-3 text-xs">
                  <span className="font-mono text-foreground/80">{s.count.toLocaleString()}</span>
                  <span className="font-mono text-foreground/60">{s.overallConv}%</span>
                </div>
              </div>
            </div>
            {i > 0 && (
              <div className="ml-28 text-[11px] text-destructive/80 mt-0.5 mb-1">
                ↘ {s.dropOff}% drop-off ({s.lost} lost) · {s.stepConv}% step conversion
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
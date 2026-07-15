import { motion } from 'framer-motion';
import { ArrowRight, Zap, ShieldCheck } from 'lucide-react';

const IMPACT = { High: 'text-chart-4 bg-chart-4/10 border-chart-4/20', Medium: 'text-chart-5 bg-chart-5/10 border-chart-5/20', Low: 'text-muted-foreground bg-muted/30 border-border' };
const CONF = { High: 'text-chart-3', Medium: 'text-chart-5', Low: 'text-muted-foreground' };

export default function RecommendationCard({ rec, index = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06, duration: 0.4 }}
      className="glass rounded-2xl p-5 hover:glow-violet transition-shadow group"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Zap className="h-4 w-4" />
          </div>
          <h4 className="font-heading font-semibold text-foreground text-lg leading-tight">{rec.title}</h4>
        </div>
        <span className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full border ${IMPACT[rec.impact] || IMPACT.Medium}`}>{rec.impact} impact</span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed mb-3"><b className="text-foreground/80">Finding:</b> {rec.finding}</p>
      <div className="flex items-start gap-2 text-sm text-foreground/85 leading-relaxed mb-4">
        <ArrowRight className="h-4 w-4 mt-0.5 text-primary shrink-0" />
        <span>{rec.action}</span>
      </div>
      <div className="flex items-center justify-between pt-3 border-t border-border/60">
        <span className="text-xs font-mono text-muted-foreground">{rec.metric}</span>
        <span className={`text-xs inline-flex items-center gap-1 ${CONF[rec.confidence] || CONF.Medium}`}>
          <ShieldCheck className="h-3 w-3" /> {rec.confidence} confidence
        </span>
      </div>
    </motion.div>
  );
}
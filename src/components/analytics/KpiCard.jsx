import { motion } from 'framer-motion';

export default function KpiCard({ label, value, sub, icon: Icon, accent = 'chart-1', trend, badge, index = 0 }) {
  const trendUp = trend === 'up';
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      className="glass rounded-2xl p-5 relative overflow-hidden group"
    >
      <div className={`absolute -right-6 -top-6 h-24 w-24 rounded-full bg-${accent}/10 blur-2xl group-hover:bg-${accent}/20 transition-colors`} />
      <div className="flex items-start justify-between relative">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        {Icon && (
          <div className={`h-8 w-8 rounded-lg bg-${accent}/10 border border-${accent}/20 flex items-center justify-center text-${accent}`}>
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
      <div className="num text-3xl font-bold mt-3 text-foreground">
        {value}
        {trend && (
          <span className={`ml-2 text-sm align-middle font-normal ${trendUp ? 'text-chart-3' : 'text-destructive'}`}>
            {trendUp ? '▲' : '▼'} {badge}
          </span>
        )}
      </div>
      {sub && <p className="mt-2 text-sm text-muted-foreground leading-snug">{sub}</p>}
    </motion.div>
  );
}
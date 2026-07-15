export default function Skeleton({ lines = 6, className = '' }) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="h-16 rounded-xl bg-muted/30 animate-pulse" style={{ width: `${70 + (i % 3) * 10}%` }} />
      ))}
    </div>
  );
}

export function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-6 animate-fade-in">
      {eyebrow && <div className="text-xs uppercase tracking-widest text-primary/80 font-medium mb-2">{eyebrow}</div>}
      <h1 className="font-heading text-3xl md:text-4xl font-bold tracking-tight text-foreground">{title}</h1>
      {subtitle && <p className="mt-2 text-muted-foreground max-w-2xl leading-relaxed">{subtitle}</p>}
    </div>
  );
}
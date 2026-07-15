import { NavLink } from 'react-router-dom';
import { LayoutDashboard, CalendarRange, Filter, DollarSign, Layers, Database, Lightbulb, Info } from 'lucide-react';

const NAV = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard, desc: 'Executive summary' },
  { to: '/cohorts', label: 'Cohort Lab', icon: CalendarRange, desc: 'Retention heatmap' },
  { to: '/funnel', label: 'Funnel Lab', icon: Filter, desc: 'Drop-off analysis' },
  { to: '/revenue', label: 'Revenue Lab', icon: DollarSign, desc: 'Discount impact' },
  { to: '/segments', label: 'Segment Explorer', icon: Layers, desc: 'Risk & opportunity' },
  { to: '/sql', label: 'SQL Logic', icon: Database, desc: 'The query layer' },
  { to: '/recommendations', label: 'Action Plan', icon: Lightbulb, desc: 'Recommendations' },
  { to: '/about', label: 'About', icon: Info, desc: 'Case study' }
];

export default function Sidebar({ onHome }) {
  return (
    <aside className="hidden lg:flex w-60 shrink-0 h-screen sticky top-0 border-r border-border bg-sidebar/60 backdrop-blur-xl flex-col">
      <button onClick={onHome} className="flex items-center gap-2.5 px-5 py-5 text-left group">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-chart-2 flex items-center justify-center shadow-lg shadow-primary/30">
          <span className="font-heading font-extrabold text-[13px] leading-none text-white italic tracking-tight">R/R</span>
        </div>
        <div>
          <div className="font-heading font-bold text-foreground leading-tight tracking-tight">Retention Reactor</div>
          <div className="text-[10px] text-muted-foreground uppercase tracking-widest">SQL analytics</div>
        </div>
      </button>
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {NAV.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${isActive ? 'bg-primary/10 text-primary border border-primary/20' : 'text-sidebar-foreground hover:bg-sidebar-accent border border-transparent'}`
            }
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <div className="flex flex-col">
              <span className="text-sm font-medium leading-tight">{item.label}</span>
              <span className="text-[10px] text-muted-foreground leading-tight">{item.desc}</span>
            </div>
          </NavLink>
        ))}
      </nav>
      <div className="p-3 border-t border-border">
        <div className="text-[10px] text-muted-foreground px-2 leading-relaxed">
          Simulated cohort of 288 customers · 12 months · 5 channels
        </div>
      </div>
    </aside>
  );
}
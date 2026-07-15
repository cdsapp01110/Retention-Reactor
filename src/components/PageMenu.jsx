import { Link } from 'react-router-dom';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Home, LayoutDashboard, CalendarRange, Filter, DollarSign, Layers, Database, Lightbulb, Info, Menu, ChevronDown } from 'lucide-react';

const PAGES = [
  { to: '/', label: 'Home', icon: Home },
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/cohorts', label: 'Cohort Lab', icon: CalendarRange },
  { to: '/funnel', label: 'Funnel Lab', icon: Filter },
  { to: '/revenue', label: 'Revenue Lab', icon: DollarSign },
  { to: '/segments', label: 'Segment Explorer', icon: Layers },
  { to: '/sql', label: 'SQL Logic', icon: Database },
  { to: '/recommendations', label: 'Action Plan', icon: Lightbulb },
  { to: '/about', label: 'About', icon: Info }
];

export default function PageMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="inline-flex items-center gap-2 text-sm font-medium glass px-3.5 py-1.5 rounded-lg hover:bg-card/70 transition-colors">
          <Menu className="h-4 w-4" /> Pages <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Jump to</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {PAGES.map(p => (
          <DropdownMenuItem asChild key={p.to}>
            <Link to={p.to} className="flex items-center gap-2.5">
              <p.icon className="h-4 w-4 text-primary" /> {p.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
import { Outlet, useNavigate } from 'react-router-dom';
import Sidebar from '@/components/Sidebar';
import FilterBar from '@/components/FilterBar';
import PageMenu from '@/components/PageMenu';
import { useTheme } from '@/lib/theme';
import { Sun, Moon } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar onHome={() => navigate('/')} />
      <div className="flex-1 min-w-0 flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 border-b border-border bg-background/60 backdrop-blur-xl">
          <PageMenu />
          <button
            onClick={toggle}
            className="inline-flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border border-border hover:bg-muted/40 transition-colors text-muted-foreground hover:text-foreground"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            {theme === 'dark' ? 'Light' : 'Dark'}
          </button>
        </div>
        <FilterBar />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
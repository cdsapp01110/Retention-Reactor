import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { ThemeProvider } from '@/lib/theme';
import { FilterProvider } from '@/lib/filters';
import Layout from '@/components/Layout';
import Landing from '@/pages/Landing';
import Overview from '@/pages/Overview';
import CohortLab from '@/pages/CohortLab';
import FunnelLab from '@/pages/FunnelLab';
import RevenueLab from '@/pages/RevenueLab';
import SegmentExplorer from '@/pages/SegmentExplorer';
import SqlLogic from '@/pages/SqlLogic';
import Recommendations from '@/pages/Recommendations';
import About from '@/pages/About';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<Layout />}>
        <Route path="/overview" element={<Overview />} />
        <Route path="/cohorts" element={<CohortLab />} />
        <Route path="/funnel" element={<FunnelLab />} />
        <Route path="/revenue" element={<RevenueLab />} />
        <Route path="/segments" element={<SegmentExplorer />} />
        <Route path="/sql" element={<SqlLogic />} />
        <Route path="/recommendations" element={<Recommendations />} />
        <Route path="/about" element={<About />} />
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <FilterProvider>
          <QueryClientProvider client={queryClientInstance}>
            <Router>
              <ScrollToTop />
              <AuthenticatedApp />
            </Router>
            <Toaster />
          </QueryClientProvider>
        </FilterProvider>
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App
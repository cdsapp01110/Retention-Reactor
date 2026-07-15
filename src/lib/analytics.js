import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useFilters } from '@/lib/filters';

export function useAnalyticsQuery() {
  const { queryKey, filters } = useFilters();
  return useQuery({
    queryKey: ['analytics', queryKey],
    queryFn: async () => {
      const res = await base44.functions.invoke('computeAnalytics', filters);
      return res.data;
    },
    staleTime: 60000
  });
}

export function fmtMoney(n) {
  if (n == null) return '—';
  return '$' + Math.round(n).toLocaleString('en-US');
}
export function fmtPct(n) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toFixed(1) + '%';
}
export function fmtNum(n) {
  if (n == null) return '—';
  return n.toLocaleString('en-US');
}
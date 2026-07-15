import { createContext, useContext, useMemo, useState } from 'react';

const DEFAULT = {
  region: 'all',
  channel: 'all',
  device: 'all',
  discount: 'all',
  cohortType: 'signup',
  granularity: 'month',
  mode: 'analyst'
};

const QUERY_KEYS = ['region', 'channel', 'device', 'discount', 'cohortType'];

const FilterContext = createContext();
export function FilterProvider({ children }) {
  const [filters, setFilters] = useState(DEFAULT);
  const update = (patch) => setFilters(f => ({ ...f, ...patch }));
  const reset = () => setFilters(DEFAULT);
  const queryKey = useMemo(() => QUERY_KEYS.map(k => filters[k]).join('|'), [filters]);
  const value = useMemo(() => ({ filters, setFilters, update, reset, queryKey }), [filters, queryKey]);
  return <FilterContext.Provider value={value}>{children}</FilterContext.Provider>;
}
export const useFilters = () => useContext(FilterContext);
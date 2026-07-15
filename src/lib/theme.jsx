import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('rr_theme') || 'dark');
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') { root.classList.remove('dark'); root.classList.add('light'); }
    else { root.classList.remove('light'); root.classList.add('dark'); }
    localStorage.setItem('rr_theme', theme);
  }, [theme]);
  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return <ThemeContext.Provider value={{ theme, toggle, setTheme }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
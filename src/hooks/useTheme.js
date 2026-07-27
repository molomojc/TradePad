import { useEffect, useState } from 'react';

const STORAGE_KEY = 'tradepad-theme';

function getInitialTheme() {
  if (typeof window === 'undefined') return 'dark';
  const savedTheme = window.localStorage.getItem(STORAGE_KEY);
  if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme;
  return 'dark';
}

export default function useTheme() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  return {
    theme,
    isLight: theme === 'light',
    toggleTheme: () => setTheme((current) => (current === 'light' ? 'dark' : 'light')),
    setTheme,
  };
}

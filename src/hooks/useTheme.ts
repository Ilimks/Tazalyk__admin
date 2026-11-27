import { useCallback, useEffect, useState } from 'react';

function remember(theme: string) {
  try {
    localStorage.setItem(THEME_KEY, theme);
    return true;
  } catch {
    return false;
  }
}

export type Theme = 'light' | 'dark';

const THEME_KEY = 'tazalyk_admin_theme';
const STATUS_BAR = { light: '#102382', dark: '#0f1420' } as const;

const readSaved = (): Theme | null => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    return saved === 'dark' || saved === 'light' ? saved : null;
  } catch {
    return null;
  }
};

const initialTheme = (): Theme => {
  const current = document.documentElement.dataset.theme;
  if (current === 'dark' || current === 'light') return current;
  return readSaved() ?? (window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', STATUS_BAR[theme]);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      remember(next);
      return next;
    });
  }, []);

  return { theme, toggleTheme };
};

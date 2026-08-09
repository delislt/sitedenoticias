'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

const STORAGE_KEY = 'sis-theme-v1';

function isTheme(value: string | null | undefined): value is Theme {
  return value === 'light' || value === 'dark';
}

function getStoredTheme(): Theme | null {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return isTheme(stored) ? stored : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): Theme {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const currentTheme = document.documentElement.dataset.theme;
    const initialTheme = isTheme(currentTheme) ? currentTheme : getStoredTheme() ?? getSystemTheme();

    applyTheme(initialTheme);
    setTheme(initialTheme);

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleSystemChange = (event: MediaQueryListEvent) => {
      if (getStoredTheme()) return;

      const systemTheme: Theme = event.matches ? 'dark' : 'light';
      applyTheme(systemTheme);
      setTheme(systemTheme);
    };

    mediaQuery.addEventListener('change', handleSystemChange);
    return () => mediaQuery.removeEventListener('change', handleSystemChange);
  }, []);

  function toggleTheme() {
    const currentTheme = theme ?? getSystemTheme();
    const nextTheme: Theme = currentTheme === 'dark' ? 'light' : 'dark';

    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // O tema ainda é aplicado durante esta visita quando o armazenamento está indisponível.
    }

    applyTheme(nextTheme);
    setTheme(nextTheme);
  }

  const label = theme === 'dark'
    ? 'Ativar modo claro'
    : theme === 'light'
      ? 'Ativar modo escuro'
      : 'Alternar tema de cores';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="theme-toggle flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
      aria-label={label}
      title={label}
      aria-pressed={theme === 'light'}
    >
      {theme === 'light' ? (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.8A8.5 8.5 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
        </svg>
      ) : (
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="12" cy="12" r="4" />
          <path strokeLinecap="round" d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.65 17.65l1.42 1.42M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.65 6.35l1.42-1.42" />
        </svg>
      )}
    </button>
  );
}

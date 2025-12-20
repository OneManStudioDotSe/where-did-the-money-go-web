import { useState, useEffect, useCallback } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme_mode';

function getSystemTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'system';
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // localStorage may be unavailable (e.g., private browsing)
  }
  return 'system';
}

function applyTheme(mode: ThemeMode) {
  const effectiveTheme = mode === 'system' ? getSystemTheme() : mode;

  if (effectiveTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function useDarkMode() {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredTheme());
  const [isDark, setIsDark] = useState<boolean>(() => {
    const storedMode = getStoredTheme();
    return storedMode === 'system' ? getSystemTheme() === 'dark' : storedMode === 'dark';
  });

  // Apply theme on mount and when mode changes
  useEffect(() => {
    applyTheme(mode);
    const effectiveTheme = mode === 'system' ? getSystemTheme() : mode;
    setIsDark(effectiveTheme === 'dark');
  }, [mode]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = () => {
      if (mode === 'system') {
        applyTheme('system');
        setIsDark(getSystemTheme() === 'dark');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  const setMode = useCallback((newMode: ThemeMode) => {
    setModeState(newMode);
    try {
      localStorage.setItem(STORAGE_KEY, newMode);
    } catch {
      // localStorage may be unavailable
    }
  }, []);

  const toggleDark = useCallback(() => {
    const newMode = isDark ? 'light' : 'dark';
    setMode(newMode);
  }, [isDark, setMode]);

  return {
    mode,
    isDark,
    setMode,
    toggleDark,
  };
}

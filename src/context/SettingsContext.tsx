import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import type { IconSetId } from '../config/icon-sets';
import { preloadIconSet } from '../config/icon-sets';
import { useDarkMode, type ThemeMode } from '../hooks/useDarkMode';

export interface AppSettings {
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'DD.MM.YYYY';
  monthStartDay: number;
  iconSet: IconSetId;
  theme: ThemeMode;
}

interface SettingsContextValue {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  isDark: boolean;
  toggleDark: () => void;
}

const STORAGE_KEY = 'app_settings';

const defaultSettings: AppSettings = {
  dateFormat: 'YYYY-MM-DD',
  monthStartDay: 1,
  iconSet: 'emoji',
  theme: 'system',
};

function loadStoredSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...defaultSettings, ...parsed };
    }
  } catch {
    // Ignore errors
  }
  return defaultSettings;
}

function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AppSettings>(() => loadStoredSettings());
  const { isDark, toggleDark, setMode } = useDarkMode();

  // Sync theme mode with settings
  useEffect(() => {
    setMode(settings.theme);
  }, [settings.theme, setMode]);

  // Preload icons when icon set changes
  useEffect(() => {
    if (settings.iconSet !== 'emoji') {
      preloadIconSet(settings.iconSet);
    }
  }, [settings.iconSet]);

  const updateSettings = useCallback((updates: Partial<AppSettings>) => {
    setSettings((prev) => {
      const newSettings = { ...prev, ...updates };
      saveSettings(newSettings);
      return newSettings;
    });
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, updateSettings, isDark, toggleDark }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}

export { defaultSettings };

import { useState, useEffect } from 'react';
import type { IconSetId } from '../config/icon-sets';
import { iconSetConfigs, getIconUrl, getCategoryEmoji } from '../config/icon-sets';
import type { ThemeMode } from '../hooks/useDarkMode';

export interface AppSettings {
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'DD.MM.YYYY';
  monthStartDay: number;
  iconSet: IconSetId;
  theme: ThemeMode;
}

const defaultSettings: AppSettings = {
  dateFormat: 'YYYY-MM-DD',
  monthStartDay: 1,
  iconSet: 'emoji',
  theme: 'system',
};

const STORAGE_KEY = 'app_settings';

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...defaultSettings, ...JSON.parse(stored) };
    }
  } catch {
    // Ignore errors, return defaults
  }
  return defaultSettings;
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
}

function IconPreview({ iconSet, categoryId }: { iconSet: IconSetId; categoryId: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const url = getIconUrl(iconSet, categoryId);
  const emoji = getCategoryEmoji(categoryId);

  useEffect(() => {
    setLoaded(false);
    setError(false);
  }, [iconSet, categoryId]);

  if (iconSet === 'emoji' || !url || error) {
    return <span className="text-xl">{emoji}</span>;
  }

  return (
    <span className="relative inline-flex items-center justify-center w-6 h-6">
      {!loaded && <span className="w-5 h-5 bg-gray-200 dark:bg-slate-600 rounded animate-pulse" />}
      <img
        src={url}
        alt=""
        className={`w-5 h-5 ${loaded ? 'opacity-100' : 'opacity-0 absolute'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
      />
    </span>
  );
}

export function SettingsPanel({ isOpen, onClose, settings, onSettingsChange }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = () => {
    saveSettings(localSettings);
    onSettingsChange(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(settings);
    onClose();
  };

  if (!isOpen) return null;

  const iconSets: IconSetId[] = ['emoji', 'icons8-3d', 'phosphor', 'openmoji'];
  const previewCategories = ['groceries', 'food_dining', 'transportation'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleCancel} />

      {/* Panel */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Theme Mode */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Theme
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['light', 'dark', 'system'] as ThemeMode[]).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, theme: mode })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      localSettings.theme === mode
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="text-2xl text-center mb-1">
                      {mode === 'light' && '☀️'}
                      {mode === 'dark' && '🌙'}
                      {mode === 'system' && '💻'}
                    </div>
                    <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center capitalize">
                      {mode}
                    </p>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                System follows your device's theme preference
              </p>
            </div>

            {/* Icon Set */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Icon Set
              </label>
              <div className="grid grid-cols-2 gap-3">
                {iconSets.map((setId) => {
                  const config = iconSetConfigs[setId];
                  return (
                    <button
                      key={setId}
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, iconSet: setId })}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        localSettings.iconSet === setId
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                          : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                      }`}
                    >
                      <div className="flex justify-center gap-1 mb-2">
                        {previewCategories.map((catId) => (
                          <div key={catId} className="flex items-center justify-center">
                            <IconPreview iconSet={setId} categoryId={catId} />
                          </div>
                        ))}
                      </div>
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                        {config.name}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-0.5">
                        {config.description}
                      </p>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                Choose how category icons are displayed throughout the app
              </p>
            </div>

            {/* Date Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Format
              </label>
              <select
                value={localSettings.dateFormat}
                onChange={(e) => setLocalSettings({ ...localSettings, dateFormat: e.target.value as AppSettings['dateFormat'] })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="YYYY-MM-DD">2025-12-19 (ISO)</option>
                <option value="DD/MM/YYYY">19/12/2025 (European)</option>
                <option value="MM/DD/YYYY">12/19/2025 (US)</option>
                <option value="DD.MM.YYYY">19.12.2025 (German)</option>
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                How dates are displayed throughout the app
              </p>
            </div>

            {/* Month Start Day */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Month Start Day
              </label>
              <select
                value={localSettings.monthStartDay}
                onChange={(e) => setLocalSettings({ ...localSettings, monthStartDay: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day === 1 ? '1st (Default)' : day === 25 ? '25th (Swedish salary)' : `${day}${getOrdinalSuffix(day)}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                When calculating monthly periods, start from this day instead of the 1st.
                Useful if your salary arrives on a specific date.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              Save Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

export { defaultSettings };

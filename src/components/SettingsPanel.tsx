import { useState, useEffect } from 'react';

export interface AppSettings {
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'DD.MM.YYYY';
  monthStartDay: number;
  iconSet: 'emoji' | 'minimal' | 'colorful';
}

const defaultSettings: AppSettings = {
  dateFormat: 'YYYY-MM-DD',
  monthStartDay: 1,
  iconSet: 'emoji',
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={handleCancel} />

      {/* Panel */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6">
            {/* Date Format */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Format
              </label>
              <select
                value={localSettings.dateFormat}
                onChange={(e) => setLocalSettings({ ...localSettings, dateFormat: e.target.value as AppSettings['dateFormat'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="YYYY-MM-DD">2025-12-19 (ISO)</option>
                <option value="DD/MM/YYYY">19/12/2025 (European)</option>
                <option value="MM/DD/YYYY">12/19/2025 (US)</option>
                <option value="DD.MM.YYYY">19.12.2025 (German)</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                How dates are displayed throughout the app
              </p>
            </div>

            {/* Month Start Day */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Month Start Day
              </label>
              <select
                value={localSettings.monthStartDay}
                onChange={(e) => setLocalSettings({ ...localSettings, monthStartDay: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day === 1 ? '1st (Default)' : day === 25 ? '25th (Swedish salary)' : `${day}${getOrdinalSuffix(day)}`}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                When calculating monthly periods, start from this day instead of the 1st.
                Useful if your salary arrives on a specific date.
              </p>
            </div>

            {/* Icon Set */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Icon Set
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, iconSet: 'emoji' })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    localSettings.iconSet === 'emoji'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl text-center mb-1">🛒 🍽️ 🚗</div>
                  <p className="text-xs font-medium text-gray-700 text-center">Emoji</p>
                </button>
                <button
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, iconSet: 'minimal' })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    localSettings.iconSet === 'minimal'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl text-center mb-1 text-gray-600">○ □ △</div>
                  <p className="text-xs font-medium text-gray-700 text-center">Minimal</p>
                  <p className="text-xs text-gray-400 text-center">(Coming)</p>
                </button>
                <button
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, iconSet: 'colorful' })}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    localSettings.iconSet === 'colorful'
                      ? 'border-primary-500 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="text-2xl text-center mb-1">
                    <span className="text-green-500">●</span>
                    <span className="text-orange-500">●</span>
                    <span className="text-blue-500">●</span>
                  </div>
                  <p className="text-xs font-medium text-gray-700 text-center">Colorful</p>
                  <p className="text-xs text-gray-400 text-center">(Coming)</p>
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Choose how category icons are displayed. Additional icon sets coming soon.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <button
              onClick={handleCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
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

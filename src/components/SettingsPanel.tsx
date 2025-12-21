import { useState, useEffect, useId } from 'react';
import type { IconSetId } from '../config/icon-sets';
import { iconSetConfigs, getIconUrl, getCategoryEmoji } from '../config/icon-sets';
import type { ThemeMode } from '../hooks/useDarkMode';
import type { BankId } from '../types/csv';
import { BANK_CONFIGS } from '../types/csv';
import { useFocusTrap } from '../hooks';
import type { AIProvider } from '../types/insights';

/** Subscription view variation */
export type SubscriptionViewVariation = 'list' | 'grid';

/** Subscription placement options */
export type SubscriptionPlacement = 'tab' | 'overview' | 'both';

export interface AppSettings {
  dateFormat: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'DD.MM.YYYY';
  monthStartDay: number;
  iconSet: IconSetId;
  theme: ThemeMode;
  /** Maximum number of transactions to import (default: 2000) */
  maxTransactionLimit: number;
  /** Preferred bank for CSV parsing optimizations */
  preferredBank: BankId | null;
  /** Subscription view variation: list (accordion) or grid (cards) */
  subscriptionViewVariation: SubscriptionViewVariation;
  /** Where to show subscriptions: tab, overview card, or both */
  subscriptionPlacement: SubscriptionPlacement;
  /** Number of transactions to show per page (default: 100) */
  transactionPageSize: number;
  /** AI provider for insights (openai or anthropic) */
  aiProvider: AIProvider | null;
  /** API key for the selected AI provider */
  aiApiKey: string;
}

const defaultSettings: AppSettings = {
  dateFormat: 'YYYY-MM-DD',
  monthStartDay: 1,
  iconSet: 'emoji',
  theme: 'system',
  maxTransactionLimit: 2000,
  preferredBank: null,
  subscriptionViewVariation: 'list',
  subscriptionPlacement: 'both',
  transactionPageSize: 100,
  aiProvider: null,
  aiApiKey: '',
};

const STORAGE_KEY = 'app_settings';

// Valid icon set IDs for migration from old values
const VALID_ICON_SETS: IconSetId[] = ['emoji', 'icons8-3d', 'lucide', 'openmoji'];

export function loadSettings(): AppSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Migrate old 'phosphor' icon set to 'lucide'
      if (parsed.iconSet && !VALID_ICON_SETS.includes(parsed.iconSet)) {
        parsed.iconSet = 'emoji'; // Fall back to default if invalid
      }
      return { ...defaultSettings, ...parsed };
    }
  } catch {
    // Ignore errors, return defaults
  }
  return defaultSettings;
}

export function saveSettings(settings: AppSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
}

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSettingsChange: (settings: AppSettings) => void;
  /** Number of subscriptions for display */
  subscriptionCount?: number;
  /** Callback to clear all subscriptions */
  onClearSubscriptions?: () => void;
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

export function SettingsPanel({ isOpen, onClose, settings, onSettingsChange, subscriptionCount = 0, onClearSubscriptions }: SettingsPanelProps) {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);

  // Accessibility: focus trap and escape key handling
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  const titleId = useId();

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

  const iconSets: IconSetId[] = ['emoji', 'icons8-3d', 'lucide', 'openmoji'];
  const previewCategories = ['groceries', 'food_dining', 'transportation'];

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 animate-fade-in" onClick={handleCancel} aria-hidden="true" />

      {/* Panel */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div ref={modalRef} className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-slate-700">
            <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-white">Settings</h2>
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
                Icon set
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

            {/* Import Settings Section */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Import settings
              </h3>

              {/* Transaction Limit */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transaction import limit
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="500"
                    max="10000"
                    step="500"
                    value={localSettings.maxTransactionLimit}
                    onChange={(e) => setLocalSettings({ ...localSettings, maxTransactionLimit: parseInt(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-900 dark:text-white min-w-[60px] text-right">
                    {localSettings.maxTransactionLimit.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Maximum transactions to import from a CSV file. Higher limits may slow down the app.
                </p>
              </div>

              {/* Preferred Bank */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preferred bank
                </label>
                <select
                  value={localSettings.preferredBank || ''}
                  onChange={(e) => setLocalSettings({ ...localSettings, preferredBank: (e.target.value || null) as BankId | null })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Auto-detect</option>
                  {Object.values(BANK_CONFIGS).map((bank) => (
                    <option key={bank.id} value={bank.id}>
                      {bank.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Select your bank to apply bank-specific parsing optimizations.
                </p>

                {/* Bank-specific optimizations info */}
                {localSettings.preferredBank && (
                  <div className="mt-3 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800">
                    <p className="text-xs font-medium text-primary-700 dark:text-primary-300 mb-2 flex items-center gap-1.5">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Optimizations for {BANK_CONFIGS[localSettings.preferredBank].name}
                    </p>

                    {/* Description */}
                    {BANK_CONFIGS[localSettings.preferredBank].optimizationDescription && (
                      <p className="text-xs text-primary-600 dark:text-primary-400 mb-2">
                        {BANK_CONFIGS[localSettings.preferredBank].optimizationDescription}
                      </p>
                    )}

                    {/* Before/After Examples */}
                    {BANK_CONFIGS[localSettings.preferredBank].examples &&
                     BANK_CONFIGS[localSettings.preferredBank].examples!.length > 0 && (
                      <div className="mt-2 space-y-1.5">
                        <p className="text-[10px] font-medium text-primary-500 dark:text-primary-400 uppercase tracking-wider">
                          Examples
                        </p>
                        {BANK_CONFIGS[localSettings.preferredBank].examples!.slice(0, 3).map((example, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-xs">
                            <span className="text-gray-500 dark:text-gray-400 font-mono text-[11px] bg-white/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded truncate max-w-[140px]" title={example.before}>
                              {example.before}
                            </span>
                            <svg className="w-3 h-3 text-primary-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                            </svg>
                            <span className="text-primary-700 dark:text-primary-300 font-medium font-mono text-[11px] bg-white/50 dark:bg-slate-800/50 px-1.5 py-0.5 rounded truncate max-w-[120px]" title={example.after}>
                              {example.after}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Subscription Settings Section */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Subscription display
              </h3>

              {/* View Variation */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  View style
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, subscriptionViewVariation: 'list' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      localSettings.subscriptionViewVariation === 'list'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Accordion list</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 text-center">Grouped by category</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, subscriptionViewVariation: 'grid' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      localSettings.subscriptionViewVariation === 'grid'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">Card grid</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 text-center">Compact cards</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Placement */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Placement
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, subscriptionPlacement: 'both' })}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      localSettings.subscriptionPlacement === 'both'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📍</span>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Both (Recommended)</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Show in Overview card + dedicated tab</p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, subscriptionPlacement: 'tab' })}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      localSettings.subscriptionPlacement === 'tab'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">📑</span>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Tab only</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Dedicated Subscriptions tab only</p>
                      </div>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, subscriptionPlacement: 'overview' })}
                    className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                      localSettings.subscriptionPlacement === 'overview'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">🏠</span>
                      <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Overview only</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Compact card in Overview tab only</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Clear Subscriptions */}
              {onClearSubscriptions && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Data management
                  </label>
                  {!showClearConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowClearConfirm(true)}
                      disabled={subscriptionCount === 0}
                      className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                        subscriptionCount === 0
                          ? 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 opacity-50 cursor-not-allowed'
                          : 'border-danger-200 dark:border-danger-800 hover:border-danger-300 dark:hover:border-danger-700 hover:bg-danger-50 dark:hover:bg-danger-900/20'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">🗑️</span>
                        <div>
                          <p className="text-sm font-medium text-danger-600 dark:text-danger-400">
                            Clear all subscriptions
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {subscriptionCount === 0
                              ? 'No subscriptions to clear'
                              : `Remove all ${subscriptionCount} saved subscription${subscriptionCount !== 1 ? 's' : ''}`}
                          </p>
                        </div>
                      </div>
                    </button>
                  ) : (
                    <div className="p-3 rounded-lg border-2 border-danger-300 dark:border-danger-700 bg-danger-50 dark:bg-danger-900/20">
                      <p className="text-sm font-medium text-danger-700 dark:text-danger-400 mb-3">
                        Are you sure? This will remove all {subscriptionCount} subscription{subscriptionCount !== 1 ? 's' : ''}.
                      </p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClearSubscriptions();
                            setShowClearConfirm(false);
                          }}
                          className="flex-1 px-3 py-2 bg-danger-600 text-white text-sm font-medium rounded-lg hover:bg-danger-700 transition-colors"
                        >
                          Yes, clear all
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowClearConfirm(false)}
                          className="flex-1 px-3 py-2 bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Display Settings Section */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                </svg>
                Display settings
              </h3>

              {/* Transaction Page Size */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Transactions per page
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 200, 500].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setLocalSettings({ ...localSettings, transactionPageSize: size })}
                      className={`p-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        localSettings.transactionPageSize === size
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                          : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-slate-500'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Number of transactions shown per page. Lower values improve scrolling performance.
                </p>
              </div>

              {/* Date Format */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Date format
                </label>
                <select
                  value={localSettings.dateFormat}
                  onChange={(e) => setLocalSettings({ ...localSettings, dateFormat: e.target.value as AppSettings['dateFormat'] })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="YYYY-MM-DD">2025-12-20 (ISO)</option>
                  <option value="DD/MM/YYYY">20/12/2025 (European)</option>
                  <option value="MM/DD/YYYY">12/20/2025 (US)</option>
                  <option value="DD.MM.YYYY">20.12.2025 (German)</option>
                </select>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  How dates are displayed throughout the app
                </p>
              </div>
            </div>

            {/* Month Start Day */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Month start day
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

            {/* AI Insights Section */}
            <div className="border-t border-gray-200 dark:border-slate-700 pt-6">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                AI insights (beta)
              </h3>

              {/* AI Provider */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  AI provider
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, aiProvider: 'openai' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      localSettings.aiProvider === 'openai'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-base font-semibold text-gray-700 dark:text-gray-300">OpenAI</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 text-center">GPT-4o mini</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, aiProvider: 'anthropic' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      localSettings.aiProvider === 'anthropic'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-base font-semibold text-gray-700 dark:text-gray-300">Anthropic</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 text-center">Claude 3.5 Haiku</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLocalSettings({ ...localSettings, aiProvider: 'gemini' })}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      localSettings.aiProvider === 'gemini'
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-base font-semibold text-gray-700 dark:text-gray-300">Gemini</span>
                      <span className="text-xs text-gray-400 dark:text-gray-500 text-center">2.0 Flash</span>
                    </div>
                  </button>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Select your preferred AI provider for spending insights. You'll need your own API key.
                </p>
              </div>

              {/* API Key */}
              {localSettings.aiProvider && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    API key
                  </label>
                  <div className="relative">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={localSettings.aiApiKey}
                      onChange={(e) => setLocalSettings({ ...localSettings, aiApiKey: e.target.value })}
                      placeholder={localSettings.aiProvider === 'openai' ? 'sk-...' : localSettings.aiProvider === 'anthropic' ? 'sk-ant-...' : 'AIza...'}
                      className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showApiKey ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Your API key is stored locally and never sent to our servers. Only used for direct API calls.
                  </p>
                  {localSettings.aiApiKey && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-success-600 dark:text-success-400">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      API key configured
                    </div>
                  )}
                </div>
              )}

              {/* No provider selected info */}
              {!localSettings.aiProvider && (
                <div className="p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Select an AI provider to enable spending insights. Your data is processed directly with the provider - nothing is stored on external servers.
                  </p>
                </div>
              )}
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
              Save settings
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

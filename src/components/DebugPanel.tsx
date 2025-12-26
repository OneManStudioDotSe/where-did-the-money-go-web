import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Transaction } from '../types/transaction';
import { getCategoryName, getSubcategoryName } from '../utils/category-service';

// ============================================
// Types
// ============================================

interface DebugPanelProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onClearTransactions?: () => void;
  onClearSubscriptions?: () => void;
  onClearSettings?: () => void;
  onForceError?: () => void;
}

interface StorageUsage {
  transactions: number;
  subscriptions: number;
  settings: number;
  mappingRules: number;
  subcategories: number;
  other: number;
  total: number;
}

interface RenderMetric {
  name: string;
  duration: number;
  timestamp: number;
}

interface MappingMatch {
  transactionId: string;
  description: string;
  matchedRule: string | null;
  categoryId: string | null;
  subcategoryId: string | null;
}

// ============================================
// Debug Context for Render Counting
// ============================================

// Global render metrics store
const renderMetrics: RenderMetric[] = [];
const renderCounts: Map<string, number> = new Map();
let verboseLogging = false;

export function trackRender(componentName: string) {
  const count = (renderCounts.get(componentName) || 0) + 1;
  renderCounts.set(componentName, count);
  if (verboseLogging) {
    console.log(`[Render] ${componentName} rendered (${count} times)`);
  }
}

export function trackMetric(name: string, duration: number) {
  renderMetrics.push({ name, duration, timestamp: Date.now() });
  if (renderMetrics.length > 100) {
    renderMetrics.shift(); // Keep last 100 metrics
  }
  if (verboseLogging) {
    console.log(`[Metric] ${name}: ${duration.toFixed(2)}ms`);
  }
}

export function setVerboseLogging(enabled: boolean) {
  verboseLogging = enabled;
  if (enabled) {
    console.log('[Debug] Verbose logging enabled');
  }
}

export function isVerboseLogging() {
  return verboseLogging;
}

// ============================================
// Utility Functions
// ============================================

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function getStorageSize(key: string): number {
  try {
    const item = localStorage.getItem(key);
    return item ? new Blob([item]).size : 0;
  } catch {
    return 0;
  }
}

function getStorageUsage(): StorageUsage {
  const transactions = getStorageSize('wdtmg_transactions');
  const subscriptions = getStorageSize('subscriptions');
  const settings = getStorageSize('app_settings');
  const mappingRules = getStorageSize('custom_mapping_rules');
  const subcategories = getStorageSize('custom_subcategories');

  // Calculate other localStorage usage
  let totalUsed = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      totalUsed += getStorageSize(key);
    }
  }

  const knownUsage = transactions + subscriptions + settings + mappingRules + subcategories;
  const other = totalUsed - knownUsage;

  return {
    transactions,
    subscriptions,
    settings,
    mappingRules,
    subcategories,
    other: Math.max(0, other),
    total: totalUsed,
  };
}

function getMemoryUsage(): { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } | null {
  // @ts-expect-error - memory API is non-standard
  if (performance.memory) {
    // @ts-expect-error - memory API is non-standard
    return performance.memory;
  }
  return null;
}

function getMappingMatches(transactions: Transaction[]): MappingMatch[] {
  // Get custom mapping rules
  let customRules: Array<{ pattern: string; categoryId: string; subcategoryId: string }> = [];
  try {
    const stored = localStorage.getItem('custom_mapping_rules');
    if (stored) {
      customRules = JSON.parse(stored);
    }
  } catch {
    // Ignore
  }

  return transactions.slice(0, 50).map(t => {
    // Check which rule matched
    const description = t.description.toLowerCase();
    let matchedRule: string | null = null;

    // Check custom rules first
    for (const rule of customRules) {
      if (description.includes(rule.pattern.toLowerCase())) {
        matchedRule = `Custom: "${rule.pattern}"`;
        break;
      }
    }

    // If no custom rule matched and transaction has a category, it was matched by default rules
    if (!matchedRule && t.categoryId) {
      matchedRule = 'Default mapping';
    }

    return {
      transactionId: t.id,
      description: t.description,
      matchedRule,
      categoryId: t.categoryId,
      subcategoryId: t.subcategoryId,
    };
  });
}

function generateDebugReport(
  transactions: Transaction[],
  storageUsage: StorageUsage,
  memoryUsage: ReturnType<typeof getMemoryUsage>,
  renderMetricsData: RenderMetric[],
  renderCountsData: Map<string, number>
): string {
  const report = {
    generatedAt: new Date().toISOString(),
    appVersion: '1.0.0',
    environment: {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screenSize: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      devicePixelRatio: window.devicePixelRatio,
    },
    storage: {
      usage: storageUsage,
      localStorageKeys: Array.from({ length: localStorage.length }, (_, i) => localStorage.key(i)),
    },
    memory: memoryUsage ? {
      usedHeap: formatBytes(memoryUsage.usedJSHeapSize),
      totalHeap: formatBytes(memoryUsage.totalJSHeapSize),
      heapLimit: formatBytes(memoryUsage.jsHeapSizeLimit),
    } : 'Not available',
    transactions: {
      total: transactions.length,
      categorized: transactions.filter(t => t.categoryId).length,
      uncategorized: transactions.filter(t => !t.categoryId).length,
      dateRange: transactions.length > 0 ? {
        earliest: transactions.reduce((min, t) => t.date < min ? t.date : min, transactions[0].date).toISOString(),
        latest: transactions.reduce((max, t) => t.date > max ? t.date : max, transactions[0].date).toISOString(),
      } : null,
      // Sanitized - no actual transaction data
    },
    performance: {
      recentMetrics: renderMetricsData.slice(-20).map(m => ({
        name: m.name,
        duration: `${m.duration.toFixed(2)}ms`,
        timestamp: new Date(m.timestamp).toISOString(),
      })),
      renderCounts: Object.fromEntries(renderCountsData),
    },
    settings: {
      // Only include non-sensitive settings
      hasCustomRules: localStorage.getItem('custom_mapping_rules') !== null,
      hasCustomSubcategories: localStorage.getItem('custom_subcategories') !== null,
    },
  };

  return JSON.stringify(report, null, 2);
}

// ============================================
// Collapsible Section Component
// ============================================

function DebugSection({
  title,
  icon,
  children,
  defaultOpen = false,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-200 dark:border-slate-700 last:border-b-0">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
          {icon}
          {title}
        </div>
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isOpen && (
        <div className="px-3 pb-3">
          {children}
        </div>
      )}
    </div>
  );
}

// ============================================
// Main Debug Panel Component
// ============================================

export function DebugPanel({
  isOpen,
  onClose,
  transactions,
  onClearTransactions,
  onClearSubscriptions,
  onClearSettings,
  onForceError,
}: DebugPanelProps) {
  const [activeTab, setActiveTab] = useState<'storage' | 'transactions' | 'performance' | 'tools'>('storage');
  const [storageUsage, setStorageUsage] = useState<StorageUsage | null>(null);
  const [memoryUsage, setMemoryUsage] = useState<ReturnType<typeof getMemoryUsage>>(null);
  const [isVerbose, setIsVerbose] = useState(verboseLogging);
  const [showJsonViewer, setShowJsonViewer] = useState(false);
  const [jsonViewerData, setJsonViewerData] = useState<string>('');
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [copiedJson, setCopiedJson] = useState(false);
  const [copiedReport, setCopiedReport] = useState(false);

  // Refresh storage and memory usage
  useEffect(() => {
    if (isOpen) {
      setStorageUsage(getStorageUsage());
      setMemoryUsage(getMemoryUsage());

      const interval = setInterval(() => {
        setStorageUsage(getStorageUsage());
        setMemoryUsage(getMemoryUsage());
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [isOpen]);

  // Mapping matches
  const mappingMatches = useMemo(() => {
    if (!isOpen) return [];
    return getMappingMatches(transactions);
  }, [transactions, isOpen]);

  // Transaction count warnings
  const warnings = useMemo(() => {
    const warns: string[] = [];
    if (transactions.length > 5000) {
      warns.push(`High transaction count (${transactions.length}) may impact performance`);
    }
    if (transactions.length > 8000) {
      warns.push('Consider clearing old transactions to improve performance');
    }
    if (storageUsage && storageUsage.total > 4 * 1024 * 1024) {
      warns.push(`localStorage usage is high (${formatBytes(storageUsage.total)})`);
    }
    return warns;
  }, [transactions.length, storageUsage]);

  const handleToggleVerbose = useCallback(() => {
    const newValue = !isVerbose;
    setIsVerbose(newValue);
    setVerboseLogging(newValue);
  }, [isVerbose]);

  const handleViewTransactionJson = useCallback((transaction: Transaction) => {
    setSelectedTransactionId(transaction.id);
    setJsonViewerData(JSON.stringify(transaction, (_key, value) => {
      if (value instanceof Date) {
        return value.toISOString();
      }
      return value;
    }, 2));
    setShowJsonViewer(true);
  }, []);

  const handleViewAllTransactionsJson = useCallback(() => {
    setSelectedTransactionId(null);
    const sanitizedTransactions = transactions.map(t => ({
      ...t,
      date: t.date.toISOString(),
    }));
    setJsonViewerData(JSON.stringify(sanitizedTransactions, null, 2));
    setShowJsonViewer(true);
  }, [transactions]);

  const handleCopyJson = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(jsonViewerData);
      setCopiedJson(true);
      setTimeout(() => setCopiedJson(false), 2000);
    } catch {
      console.error('Failed to copy to clipboard');
    }
  }, [jsonViewerData]);

  const handleExportDebugReport = useCallback(async () => {
    const report = generateDebugReport(
      transactions,
      storageUsage || getStorageUsage(),
      memoryUsage,
      renderMetrics,
      renderCounts
    );

    try {
      await navigator.clipboard.writeText(report);
      setCopiedReport(true);
      setTimeout(() => setCopiedReport(false), 2000);
    } catch {
      // Fallback: download as file
      const blob = new Blob([report], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `debug-report-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [transactions, storageUsage, memoryUsage]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-4 top-20 bottom-4 w-96 max-w-[calc(100vw-2rem)] bg-white dark:bg-slate-800 rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-amber-50 dark:bg-amber-900/20">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
            </svg>
            <h2 className="text-sm font-semibold text-amber-800 dark:text-amber-300">Debug Panel</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-amber-100 dark:hover:bg-amber-900/30 rounded transition-colors"
          >
            <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="px-4 py-2 bg-danger-50 dark:bg-danger-900/20 border-b border-danger-200 dark:border-danger-800">
            {warnings.map((warn, i) => (
              <p key={i} className="text-xs text-danger-700 dark:text-danger-400 flex items-center gap-1">
                <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                {warn}
              </p>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700">
          {(['storage', 'transactions', 'performance', 'tools'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-3 py-2 text-xs font-medium transition-colors ${
                activeTab === tab
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Storage Tab */}
          {activeTab === 'storage' && storageUsage && (
            <div className="p-4 space-y-4">
              {/* Storage Usage Bars */}
              <div className="space-y-3">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  localStorage Usage
                </h3>

                {/* Total Bar */}
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 dark:text-gray-400">Total</span>
                    <span className="font-mono text-gray-900 dark:text-white">{formatBytes(storageUsage.total)}</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary-500 transition-all"
                      style={{ width: `${Math.min(100, (storageUsage.total / (5 * 1024 * 1024)) * 100)}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">of ~5 MB browser limit</p>
                </div>

                {/* Individual Items */}
                {[
                  { label: 'Transactions', value: storageUsage.transactions, color: 'bg-blue-500' },
                  { label: 'Subscriptions', value: storageUsage.subscriptions, color: 'bg-green-500' },
                  { label: 'Settings', value: storageUsage.settings, color: 'bg-purple-500' },
                  { label: 'Mapping Rules', value: storageUsage.mappingRules, color: 'bg-orange-500' },
                  { label: 'Subcategories', value: storageUsage.subcategories, color: 'bg-pink-500' },
                  { label: 'Other', value: storageUsage.other, color: 'bg-gray-500' },
                ].map(item => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-xs text-gray-600 dark:text-gray-400 flex-1">{item.label}</span>
                    <span className="text-xs font-mono text-gray-900 dark:text-white">{formatBytes(item.value)}</span>
                  </div>
                ))}
              </div>

              {/* Memory Usage */}
              {memoryUsage && (
                <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                  <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                    Memory Usage (JS Heap)
                  </h3>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Used</span>
                      <span className="font-mono text-gray-900 dark:text-white">{formatBytes(memoryUsage.usedJSHeapSize)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Total Allocated</span>
                      <span className="font-mono text-gray-900 dark:text-white">{formatBytes(memoryUsage.totalJSHeapSize)}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-600 dark:text-gray-400">Limit</span>
                      <span className="font-mono text-gray-900 dark:text-white">{formatBytes(memoryUsage.jsHeapSizeLimit)}</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{ width: `${(memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {!memoryUsage && (
                <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                  <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                    Memory API not available in this browser
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div>
              <DebugSection
                title="Raw JSON Viewer"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>}
                defaultOpen
              >
                <div className="space-y-2">
                  <button
                    onClick={handleViewAllTransactionsJson}
                    className="w-full px-3 py-2 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg transition-colors"
                  >
                    View All Transactions ({transactions.length})
                  </button>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    Click a transaction row below to view individual JSON
                  </p>
                </div>
              </DebugSection>

              <DebugSection
                title="Category Mapping Debugger"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>}
              >
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {mappingMatches.map((match) => (
                    <div
                      key={match.transactionId}
                      onClick={() => {
                        const t = transactions.find(t => t.id === match.transactionId);
                        if (t) handleViewTransactionJson(t);
                      }}
                      className="p-2 bg-gray-50 dark:bg-slate-700/50 rounded text-xs cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      <p className="font-medium text-gray-900 dark:text-white truncate" title={match.description}>
                        {match.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px]">
                        <span className={`px-1.5 py-0.5 rounded ${
                          match.matchedRule?.startsWith('Custom')
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                            : match.matchedRule
                            ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                            : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-400'
                        }`}>
                          {match.matchedRule || 'No match'}
                        </span>
                        {match.categoryId && (
                          <span className="text-gray-500 dark:text-gray-400">
                            → {getCategoryName(match.categoryId)}
                            {match.subcategoryId && ` / ${getSubcategoryName(match.categoryId, match.subcategoryId)}`}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {mappingMatches.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">No transactions loaded</p>
                  )}
                  {transactions.length > 50 && (
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center pt-2">
                      Showing first 50 of {transactions.length} transactions
                    </p>
                  )}
                </div>
              </DebugSection>

              <DebugSection
                title="Transaction Stats"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
              >
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Total</span>
                    <span className="font-mono text-gray-900 dark:text-white">{transactions.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Categorized</span>
                    <span className="font-mono text-gray-900 dark:text-white">{transactions.filter(t => t.categoryId).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Uncategorized</span>
                    <span className="font-mono text-gray-900 dark:text-white">{transactions.filter(t => !t.categoryId).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">With Subscriptions</span>
                    <span className="font-mono text-gray-900 dark:text-white">{transactions.filter(t => t.isSubscription).length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">With Badges</span>
                    <span className="font-mono text-gray-900 dark:text-white">{transactions.filter(t => t.badges.length > 0).length}</span>
                  </div>
                </div>
              </DebugSection>
            </div>
          )}

          {/* Performance Tab */}
          {activeTab === 'performance' && (
            <div>
              <DebugSection
                title="Render Time Metrics"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                defaultOpen
              >
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {renderMetrics.slice(-20).reverse().map((metric, i) => (
                    <div key={i} className="flex justify-between text-xs py-1 border-b border-gray-100 dark:border-slate-700 last:border-0">
                      <span className="text-gray-600 dark:text-gray-400 truncate" title={metric.name}>{metric.name}</span>
                      <span className={`font-mono ${
                        metric.duration > 100 ? 'text-danger-600 dark:text-danger-400' :
                        metric.duration > 50 ? 'text-warning-600 dark:text-warning-400' :
                        'text-success-600 dark:text-success-400'
                      }`}>
                        {metric.duration.toFixed(1)}ms
                      </span>
                    </div>
                  ))}
                  {renderMetrics.length === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">No metrics recorded yet</p>
                  )}
                </div>
              </DebugSection>

              <DebugSection
                title="Component Render Counts"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
              >
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {Array.from(renderCounts.entries())
                    .sort((a, b) => b[1] - a[1])
                    .map(([name, count]) => (
                      <div key={name} className="flex justify-between text-xs py-1 border-b border-gray-100 dark:border-slate-700 last:border-0">
                        <span className="text-gray-600 dark:text-gray-400">{name}</span>
                        <span className={`font-mono ${
                          count > 50 ? 'text-danger-600 dark:text-danger-400' :
                          count > 20 ? 'text-warning-600 dark:text-warning-400' :
                          'text-gray-900 dark:text-white'
                        }`}>
                          {count}
                        </span>
                      </div>
                    ))}
                  {renderCounts.size === 0 && (
                    <p className="text-xs text-gray-400 dark:text-gray-500 italic">No renders tracked yet</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    renderCounts.clear();
                    setActiveTab('storage'); // Force re-render
                    setTimeout(() => setActiveTab('performance'), 0);
                  }}
                  className="mt-2 w-full px-3 py-1.5 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  Reset Counts
                </button>
              </DebugSection>

              <DebugSection
                title="Verbose Logging"
                icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>}
              >
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                      Console Logging
                    </span>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400">
                      Log renders and state changes to console
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={isVerbose}
                    onClick={handleToggleVerbose}
                    className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                      isVerbose ? 'bg-primary-600' : 'bg-gray-200 dark:bg-slate-600'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
                        isVerbose ? 'translate-x-4' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </label>
              </DebugSection>
            </div>
          )}

          {/* Tools Tab */}
          {activeTab === 'tools' && (
            <div className="p-4 space-y-4">
              {/* Reset Specific Features */}
              <div>
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                  Selective Reset
                </h3>
                <div className="space-y-2">
                  {onClearTransactions && (
                    <button
                      onClick={onClearTransactions}
                      className="w-full px-3 py-2 text-xs font-medium text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Clear Transactions Only
                    </button>
                  )}
                  {onClearSubscriptions && (
                    <button
                      onClick={onClearSubscriptions}
                      className="w-full px-3 py-2 text-xs font-medium text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Clear Subscriptions Only
                    </button>
                  )}
                  {onClearSettings && (
                    <button
                      onClick={onClearSettings}
                      className="w-full px-3 py-2 text-xs font-medium text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-slate-700/50 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      Reset Settings to Defaults
                    </button>
                  )}
                </div>
              </div>

              {/* Testing Tools */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                  Testing Tools
                </h3>
                <div className="space-y-2">
                  {onForceError && (
                    <button
                      onClick={onForceError}
                      className="w-full px-3 py-2 text-xs font-medium text-left text-danger-700 dark:text-danger-300 bg-danger-50 dark:bg-danger-900/30 hover:bg-danger-100 dark:hover:bg-danger-900/50 rounded-lg transition-colors flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      Force Error State
                    </button>
                  )}
                </div>
              </div>

              {/* Export */}
              <div className="pt-4 border-t border-gray-200 dark:border-slate-700">
                <h3 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">
                  Export
                </h3>
                <button
                  onClick={handleExportDebugReport}
                  className="w-full px-3 py-2 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {copiedReport ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied to Clipboard!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Export Debug Report
                    </>
                  )}
                </button>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-2 text-center">
                  Sanitized report (no personal transaction data)
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* JSON Viewer Modal */}
      {showJsonViewer && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-[60]"
            onClick={() => setShowJsonViewer(false)}
          />
          <div className="fixed inset-8 bg-white dark:bg-slate-800 rounded-xl shadow-2xl z-[70] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                {selectedTransactionId ? 'Transaction JSON' : `All Transactions (${transactions.length})`}
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyJson}
                  className="px-3 py-1.5 text-xs font-medium text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/30 hover:bg-primary-100 dark:hover:bg-primary-900/50 rounded transition-colors"
                >
                  {copiedJson ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => setShowJsonViewer(false)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-slate-700 rounded transition-colors"
                >
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-gray-800 dark:text-gray-200 bg-gray-50 dark:bg-slate-900">
              {jsonViewerData}
            </pre>
          </div>
        </>
      )}
    </>
  );
}

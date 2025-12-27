import { useState, useMemo, useId } from 'react';
import type { Transaction, Subscription } from '../types/transaction';
import { exportTransactions, getExportPreview, type ExportFormat, type ExportScope } from '../services/export-service';
import { exportToPdf } from '../services/pdf-export-service';
import { useFocusTrap } from '../hooks';
import { useToast } from '../context/ToastContext';
import { COPY_FEEDBACK_DURATION } from '../constants/timing';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
  subscriptions?: Subscription[];
}

type ExtendedExportFormat = ExportFormat | 'pdf';

export function ExportDialog({
  isOpen,
  onClose,
  transactions,
  filteredTransactions,
  subscriptions = [],
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExtendedExportFormat>('csv');
  const [scope, setScope] = useState<ExportScope>('all');
  const [includeRawData, setIncludeRawData] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [useDateRange, setUseDateRange] = useState(false);
  const [dateStart, setDateStart] = useState('');
  const [dateEnd, setDateEnd] = useState('');

  // Accessibility: focus trap and escape key handling
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  const titleId = useId();
  const toast = useToast();

  // Calculate min/max dates from transactions
  const dateRange = useMemo(() => {
    if (transactions.length === 0) return { min: '', max: '' };
    const dates = transactions.map((t) => t.date.getTime());
    const min = new Date(Math.min(...dates)).toISOString().split('T')[0];
    const max = new Date(Math.max(...dates)).toISOString().split('T')[0];
    return { min, max };
  }, [transactions]);

  // Filter transactions by date range if enabled
  const targetTransactions = useMemo(() => {
    let result = scope === 'filtered' ? filteredTransactions : transactions;

    if (useDateRange && dateStart && dateEnd) {
      const start = new Date(dateStart);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateEnd);
      end.setHours(23, 59, 59, 999);

      result = result.filter((t) => t.date >= start && t.date <= end);
    }

    return result;
  }, [scope, filteredTransactions, transactions, useDateRange, dateStart, dateEnd]);

  const preview = useMemo(() => {
    if (!showPreview || format === 'pdf') return '';
    return getExportPreview(targetTransactions, format as ExportFormat, scope, 3);
  }, [showPreview, targetTransactions, format, scope]);

  // Get full export content for copy to clipboard
  const fullExportContent = useMemo(() => {
    if (format === 'pdf') return '';
    return getExportPreview(targetTransactions, format as ExportFormat, scope, targetTransactions.length);
  }, [targetTransactions, format, scope]);

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(fullExportContent);
      setCopied(true);
      setTimeout(() => setCopied(false), COPY_FEEDBACK_DURATION);
    } catch {
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleExport = () => {
    if (format === 'pdf') {
      exportToPdf(targetTransactions, subscriptions, {
        title: 'Financial Report',
        dateRange:
          useDateRange && dateStart && dateEnd
            ? { start: new Date(dateStart), end: new Date(dateEnd) }
            : undefined,
        includeSummary: true,
        includeTransactions: scope !== 'summary',
        includeSubscriptions: subscriptions.length > 0,
      });
    } else {
      exportTransactions(targetTransactions, {
        format,
        scope,
        includeRawData,
      });
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 animate-fade-in" onClick={onClose} aria-hidden="true" />

      {/* Panel */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div ref={modalRef} className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full overflow-hidden animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </div>
              <div>
                <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-white">Export Transactions</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Download your data</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              aria-label="Close dialog"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-5">
            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Export Format
              </label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={() => setFormat('csv')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                    format === 'csv'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-500'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    format === 'csv' ? 'bg-primary-100 dark:bg-primary-800' : 'bg-gray-100 dark:bg-slate-700'
                  }`}>
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">CSV</span>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${format === 'csv' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                      CSV
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Spreadsheets</p>
                  </div>
                </button>

                <button
                  onClick={() => setFormat('json')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                    format === 'json'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-500'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    format === 'json' ? 'bg-primary-100 dark:bg-primary-800' : 'bg-gray-100 dark:bg-slate-700'
                  }`}>
                    <span className="text-sm font-bold text-gray-600 dark:text-gray-300">{'{}'}</span>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${format === 'json' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                      JSON
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Developers</p>
                  </div>
                </button>

                <button
                  onClick={() => setFormat('pdf')}
                  className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${
                    format === 'pdf'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-500'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    format === 'pdf' ? 'bg-primary-100 dark:bg-primary-800' : 'bg-gray-100 dark:bg-slate-700'
                  }`}>
                    <svg className={`w-5 h-5 ${format === 'pdf' ? 'text-primary-600' : 'text-gray-600 dark:text-gray-300'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className={`text-sm font-medium ${format === 'pdf' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                      PDF
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Report</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Scope Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                What to Export
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <input
                    type="radio"
                    name="scope"
                    value="all"
                    checked={scope === 'all'}
                    onChange={() => setScope('all')}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">All Transactions</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{transactions.length} transactions</p>
                  </div>
                </label>

                <label className={`flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors ${
                  filteredTransactions.length === transactions.length ? 'opacity-50' : ''
                }`}>
                  <input
                    type="radio"
                    name="scope"
                    value="filtered"
                    checked={scope === 'filtered'}
                    onChange={() => setScope('filtered')}
                    disabled={filteredTransactions.length === transactions.length}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">Filtered View</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {filteredTransactions.length === transactions.length
                        ? 'No filters active'
                        : `${filteredTransactions.length} transactions`}
                    </p>
                  </div>
                </label>

                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-slate-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                  <input
                    type="radio"
                    name="scope"
                    value="summary"
                    checked={scope === 'summary'}
                    onChange={() => setScope('summary')}
                    className="w-4 h-4 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">Summary Only</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Totals and category breakdown</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Custom Date Range */}
            <div>
              <label className="flex items-center gap-3 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={useDateRange}
                  onChange={(e) => {
                    setUseDateRange(e.target.checked);
                    if (e.target.checked && !dateStart && !dateEnd) {
                      setDateStart(dateRange.min);
                      setDateEnd(dateRange.max);
                    }
                  }}
                  className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Custom date range</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Export only transactions within specific dates</p>
                </div>
              </label>

              {useDateRange && (
                <div className="flex gap-3 ml-7">
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">From</label>
                    <input
                      type="date"
                      value={dateStart}
                      min={dateRange.min}
                      max={dateEnd || dateRange.max}
                      onChange={(e) => setDateStart(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">To</label>
                    <input
                      type="date"
                      value={dateEnd}
                      min={dateStart || dateRange.min}
                      max={dateRange.max}
                      onChange={(e) => setDateEnd(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Additional Options */}
            {scope !== 'summary' && format === 'json' && (
              <div>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeRawData}
                    onChange={(e) => setIncludeRawData(e.target.checked)}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Include raw CSV data</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Original bank data fields</p>
                  </div>
                </label>
              </div>
            )}

            {/* PDF Info */}
            {format === 'pdf' && (
              <div className="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-100 dark:border-primary-800">
                <div className="flex items-start gap-2">
                  <svg className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-primary-800 dark:text-primary-300">PDF Report</p>
                    <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                      A printable report will open in a new window. Use your browser's print dialog to save as PDF.
                      {subscriptions.length > 0 && ' Includes your recurring expenses summary.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Preview Toggle (not available for PDF) */}
            {format !== 'pdf' && (
              <div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="flex items-center gap-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                >
                  <svg className={`w-4 h-4 transition-transform ${showPreview ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                  {showPreview ? 'Hide preview' : 'Show preview'}
                </button>

                {showPreview && (
                  <div className="mt-3 relative">
                    <div className="p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 overflow-x-auto">
                      <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
                        {preview}
                      </pre>
                    </div>
                    <button
                      onClick={handleCopyToClipboard}
                      className="absolute top-2 right-2 p-1.5 rounded-md bg-white dark:bg-slate-700 border border-gray-200 dark:border-slate-600 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-600 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? (
                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {scope === 'summary'
                ? 'Summary report'
                : `${targetTransactions.length} transactions`}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              {format !== 'pdf' && (
                <button
                  onClick={handleCopyToClipboard}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                >
                  {copied ? (
                    <>
                      <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Copied!
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleExport}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                Export {format.toUpperCase()}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

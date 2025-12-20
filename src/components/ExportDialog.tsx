import { useState, useMemo, useId } from 'react';
import type { Transaction } from '../types/transaction';
import { exportTransactions, getExportPreview, type ExportFormat, type ExportScope } from '../services/export-service';
import { useFocusTrap } from '../hooks';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  filteredTransactions: Transaction[];
}

export function ExportDialog({
  isOpen,
  onClose,
  transactions,
  filteredTransactions,
}: ExportDialogProps) {
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [scope, setScope] = useState<ExportScope>('all');
  const [includeRawData, setIncludeRawData] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Accessibility: focus trap and escape key handling
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  const titleId = useId();

  const targetTransactions = scope === 'filtered' ? filteredTransactions : transactions;

  const preview = useMemo(() => {
    if (!showPreview) return '';
    return getExportPreview(targetTransactions, format, scope, 3);
  }, [showPreview, targetTransactions, format, scope]);

  const handleExport = () => {
    exportTransactions(targetTransactions, {
      format,
      scope,
      includeRawData,
    });
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
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setFormat('csv')}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    format === 'csv'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-500'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    format === 'csv' ? 'bg-primary-100 dark:bg-primary-800' : 'bg-gray-100 dark:bg-slate-700'
                  }`}>
                    <span className="text-lg font-bold text-gray-600 dark:text-gray-300">CSV</span>
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${format === 'csv' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                      CSV File
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Excel, Sheets</p>
                  </div>
                </button>

                <button
                  onClick={() => setFormat('json')}
                  className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    format === 'json'
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-1 ring-primary-500'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    format === 'json' ? 'bg-primary-100 dark:bg-primary-800' : 'bg-gray-100 dark:bg-slate-700'
                  }`}>
                    <span className="text-lg font-bold text-gray-600 dark:text-gray-300">{'{}'}</span>
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${format === 'json' ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'}`}>
                      JSON File
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Developers, APIs</p>
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

            {/* Preview Toggle */}
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
                <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 overflow-x-auto">
                  <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap font-mono">
                    {preview}
                  </pre>
                </div>
              )}
            </div>
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

import { useState, useMemo, useId } from 'react';
import type { Transaction, SuspiciousTransaction, SuspiciousType } from '../types/transaction';
import { getSuspiciousTypeLabel, getSuspiciousTypeIcon } from '../utils/transaction-validation';
import { getCategoryIcon, getCategoryColor } from '../utils/category-service';
import { toTitleCase } from '../utils/text-utils';
import { useFocusTrap } from '../hooks';

interface SuspiciousTransactionsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  suspiciousTransactions: SuspiciousTransaction[];
  transactions: Transaction[];
  onDismiss: (warningId: string) => void;
  onDismissAll: () => void;
  onViewTransaction: (transactionId: string) => void;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' kr';
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('sv-SE');
}

type FilterType = 'all' | SuspiciousType;

export function SuspiciousTransactionsDialog({
  isOpen,
  onClose,
  suspiciousTransactions,
  transactions,
  onDismiss,
  onDismissAll,
  onViewTransaction,
}: SuspiciousTransactionsDialogProps) {
  const [filter, setFilter] = useState<FilterType>('all');
  const [showDismissed, setShowDismissed] = useState(false);

  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  const titleId = useId();

  // Create transaction lookup map
  const transactionMap = useMemo(() => {
    const map = new Map<string, Transaction>();
    transactions.forEach(t => map.set(t.id, t));
    return map;
  }, [transactions]);

  // Filter suspicious transactions
  const filteredSuspicious = useMemo(() => {
    return suspiciousTransactions.filter(s => {
      if (!showDismissed && s.isDismissed) return false;
      if (filter !== 'all' && s.type !== filter) return false;
      return true;
    });
  }, [suspiciousTransactions, filter, showDismissed]);

  // Count by type (excluding dismissed)
  const counts = useMemo(() => {
    const c: Record<SuspiciousType | 'all', number> = {
      all: 0,
      exact_duplicate: 0,
      near_duplicate: 0,
      large_transaction: 0,
      unusual_for_merchant: 0,
    };
    suspiciousTransactions.forEach(s => {
      if (!s.isDismissed) {
        c[s.type]++;
        c.all++;
      }
    });
    return c;
  }, [suspiciousTransactions]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const getSeverityColor = (severity: 'high' | 'medium' | 'low'): string => {
    switch (severity) {
      case 'high':
        return 'text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20';
      case 'medium':
        return 'text-warning-600 dark:text-warning-400 bg-warning-50 dark:bg-warning-900/20';
      case 'low':
        return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-slate-700';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[85vh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-warning-600 dark:text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-white">
                  Review Suspicious Transactions
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {counts.all} potential issue{counts.all !== 1 ? 's' : ''} found
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                filter === 'all'
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                  : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
              }`}
            >
              All ({counts.all})
            </button>
            {counts.exact_duplicate > 0 && (
              <button
                onClick={() => setFilter('exact_duplicate')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                  filter === 'exact_duplicate'
                    ? 'bg-danger-100 dark:bg-danger-900/40 text-danger-700 dark:text-danger-300'
                    : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                }`}
              >
                <span>🔁</span> Duplicates ({counts.exact_duplicate})
              </button>
            )}
            {counts.near_duplicate > 0 && (
              <button
                onClick={() => setFilter('near_duplicate')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                  filter === 'near_duplicate'
                    ? 'bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-300'
                    : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                }`}
              >
                <span>📋</span> Possible ({counts.near_duplicate})
              </button>
            )}
            {counts.large_transaction > 0 && (
              <button
                onClick={() => setFilter('large_transaction')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                  filter === 'large_transaction'
                    ? 'bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300'
                    : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                }`}
              >
                <span>💰</span> Large ({counts.large_transaction})
              </button>
            )}
            {counts.unusual_for_merchant > 0 && (
              <button
                onClick={() => setFilter('unusual_for_merchant')}
                className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                  filter === 'unusual_for_merchant'
                    ? 'bg-warning-100 dark:bg-warning-900/40 text-warning-700 dark:text-warning-300'
                    : 'bg-white dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-600'
                }`}
              >
                <span>📈</span> Unusual ({counts.unusual_for_merchant})
              </button>
            )}

            <div className="flex-1" />

            <label className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showDismissed}
                onChange={(e) => setShowDismissed(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 dark:border-slate-600 text-primary-600 focus:ring-primary-500"
              />
              Show dismissed
            </label>
          </div>
        </div>

        {/* Transaction List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {filteredSuspicious.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
                All Clear!
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {showDismissed
                  ? 'No suspicious transactions match the current filter.'
                  : 'All suspicious transactions have been reviewed.'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredSuspicious.map((suspicious) => {
                const transaction = transactionMap.get(suspicious.transactionId);
                const relatedTransaction = suspicious.relatedTransactionId
                  ? transactionMap.get(suspicious.relatedTransactionId)
                  : null;

                if (!transaction) return null;

                const categoryIcon = getCategoryIcon(transaction.categoryId);
                const categoryColor = getCategoryColor(transaction.categoryId);

                return (
                  <div
                    key={`${suspicious.transactionId}-${suspicious.type}`}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      suspicious.isDismissed
                        ? 'opacity-50 border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50'
                        : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Category Icon */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                        style={{ backgroundColor: `${categoryColor}20` }}
                      >
                        {categoryIcon}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {toTitleCase(transaction.description)}
                            </h3>
                            <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                              <span>{formatDate(transaction.date)}</span>
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <div className="font-semibold text-gray-900 dark:text-white">
                              {formatAmount(transaction.amount)}
                            </div>
                          </div>
                        </div>

                        {/* Warning Badge and Reason */}
                        <div className="mt-3 flex items-start gap-2">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(suspicious.severity)}`}>
                            <span>{getSuspiciousTypeIcon(suspicious.type)}</span>
                            {getSuspiciousTypeLabel(suspicious.type)}
                          </span>
                          <span className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                            {suspicious.reason}
                          </span>
                        </div>

                        {/* Related Transaction */}
                        {relatedTransaction && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-xs">
                            <span className="text-gray-500 dark:text-gray-400">Related: </span>
                            <span className="text-gray-700 dark:text-gray-300">
                              {toTitleCase(relatedTransaction.description)} on {formatDate(relatedTransaction.date)}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-1 flex-shrink-0">
                        <button
                          onClick={() => onViewTransaction(transaction.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
                          title="View transaction"
                        >
                          View
                        </button>
                        {!suspicious.isDismissed && (
                          <button
                            onClick={() => onDismiss(`${suspicious.transactionId}|${suspicious.type}`)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-medium bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 hover:bg-success-200 dark:hover:bg-success-900/50 transition-colors"
                            title="Mark as reviewed"
                          >
                            OK
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Close
          </button>
          {counts.all > 0 && (
            <button
              onClick={onDismissAll}
              className="px-4 py-2 bg-success-600 hover:bg-success-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Mark All as Reviewed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

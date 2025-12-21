import { useId } from 'react';
import type { Transaction } from '../types/transaction';
import { getCategoryName, getSubcategoryName, getCategoryColor, getCategoryIcon } from '../utils/category-service';
import { toTitleCase } from '../utils/text-utils';
import { useFocusTrap } from '../hooks';

interface ApplyCategoryToSimilarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** The transaction being edited */
  originalTransaction: Transaction;
  /** Similar transactions that could also be updated */
  similarTransactions: Transaction[];
  /** The new category to apply */
  newCategoryId: string;
  newSubcategoryId: string;
  /** Called when user chooses to apply to just the original */
  onApplyToOne: () => void;
  /** Called when user chooses to apply to all similar */
  onApplyToAll: () => void;
  /** Loading state from parent */
  isSaving?: boolean;
}

function formatAmount(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? '-' : '+'}${formatted} kr`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('sv-SE', {
    month: 'short',
    day: 'numeric',
  });
}

export function ApplyCategoryToSimilarDialog({
  isOpen,
  onClose,
  originalTransaction,
  similarTransactions,
  newCategoryId,
  newSubcategoryId,
  onApplyToOne,
  onApplyToAll,
  isSaving = false,
}: ApplyCategoryToSimilarDialogProps) {
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  const titleId = useId();

  if (!isOpen) return null;

  const categoryName = getCategoryName(newCategoryId);
  const subcategoryName = getSubcategoryName(newCategoryId, newSubcategoryId);
  const categoryColor = getCategoryColor(newCategoryId);
  const categoryIcon = getCategoryIcon(newCategoryId);

  const totalCount = similarTransactions.length + 1; // +1 for original
  const totalAmount = [originalTransaction, ...similarTransactions]
    .reduce((sum, t) => sum + t.amount, 0);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 animate-fade-in" aria-hidden="true" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full animate-slide-up"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
                <svg
                  className="w-5 h-5 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-white">
                  Apply to similar transactions?
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Found {similarTransactions.length} other transaction{similarTransactions.length !== 1 ? 's' : ''} with the same description
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            {/* New Category */}
            <div className="mb-4 p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
              <p className="text-xs font-medium text-primary-600 dark:text-primary-400 mb-2">New category</p>
              <div className="flex items-center gap-2">
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                  style={{ backgroundColor: `${categoryColor}20` }}
                >
                  {categoryIcon}
                </span>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{categoryName}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{subcategoryName}</p>
                </div>
              </div>
            </div>

            {/* Transaction Description */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Description</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {toTitleCase(originalTransaction.description)}
              </p>
            </div>

            {/* Similar Transactions List */}
            <div className="mb-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Transactions to update ({totalCount} total)
              </p>
              <div className="max-h-40 overflow-y-auto border border-gray-200 dark:border-slate-700 rounded-lg">
                <div className="divide-y divide-gray-100 dark:divide-slate-700">
                  {/* Original transaction */}
                  <div className="flex items-center justify-between px-3 py-2 bg-primary-50/50 dark:bg-primary-900/10">
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-1.5 py-0.5 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded">
                        Current
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(originalTransaction.date)}
                      </span>
                    </div>
                    <span className={`text-sm font-medium ${
                      originalTransaction.amount < 0
                        ? 'text-gray-900 dark:text-white'
                        : 'text-success-600 dark:text-success-400'
                    }`}>
                      {formatAmount(originalTransaction.amount)}
                    </span>
                  </div>
                  {/* Similar transactions */}
                  {similarTransactions.slice(0, 5).map((t) => (
                    <div key={t.id} className="flex items-center justify-between px-3 py-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(t.date)}
                      </span>
                      <span className={`text-sm font-medium ${
                        t.amount < 0
                          ? 'text-gray-900 dark:text-white'
                          : 'text-success-600 dark:text-success-400'
                      }`}>
                        {formatAmount(t.amount)}
                      </span>
                    </div>
                  ))}
                  {similarTransactions.length > 5 && (
                    <div className="px-3 py-2 text-center text-sm text-gray-500 dark:text-gray-400">
                      ... and {similarTransactions.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Total */}
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
              <span className="text-sm text-gray-500 dark:text-gray-400">Total amount</span>
              <span className={`font-semibold ${
                totalAmount < 0
                  ? 'text-gray-900 dark:text-white'
                  : 'text-success-600 dark:text-success-400'
              }`}>
                {formatAmount(totalAmount)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl">
            <div className="flex flex-col gap-2">
              <button
                onClick={onApplyToAll}
                disabled={isSaving}
                className="w-full px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  `Apply to all ${totalCount} transactions`
                )}
              </button>
              <button
                onClick={onApplyToOne}
                disabled={isSaving}
                className="w-full px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg transition-colors inline-flex items-center justify-center gap-2"
              >
                {isSaving ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  'Apply to this one only'
                )}
              </button>
              <button
                onClick={onClose}
                disabled={isSaving}
                className="w-full px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

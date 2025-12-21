import { useState, useId, useMemo } from 'react';
import type { Transaction } from '../types/transaction';
import { getCategoryName, getSubcategoryName, getCategoryColor, getCategoryIcon } from '../utils/category-service';
import { CategorySelector } from './CategorySelector';
import { toTitleCase } from '../utils/text-utils';
import { useFocusTrap } from '../hooks';
import { ApplyCategoryToSimilarDialog } from './ApplyCategoryToSimilarDialog';
import { normalizeRecipientName } from '../utils/subscription-detection';

interface TransactionEditModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionId: string, categoryId: string, subcategoryId: string) => void;
  /** All transactions for detecting similar ones */
  allTransactions?: Transaction[];
  /** Callback for batch updating multiple transactions */
  onBatchSave?: (transactionIds: string[], categoryId: string, subcategoryId: string) => void;
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
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function TransactionEditModal({
  transaction,
  isOpen,
  onClose,
  onSave,
  allTransactions = [],
  onBatchSave,
}: TransactionEditModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    transaction.categoryId
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(
    transaction.subcategoryId
  );
  const [showSimilarDialog, setShowSimilarDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Find similar transactions (same normalized description, different category)
  const similarTransactions = useMemo(() => {
    if (!allTransactions.length) return [];

    const normalizedDescription = normalizeRecipientName(transaction.description);

    return allTransactions.filter(t => {
      // Exclude the current transaction
      if (t.id === transaction.id) return false;

      // Check if descriptions match after normalization
      const otherNormalized = normalizeRecipientName(t.description);
      if (otherNormalized !== normalizedDescription) return false;

      // Include if it has a different category or is uncategorized
      // (we want to update transactions that don't already have the new category)
      return true;
    });
  }, [allTransactions, transaction.id, transaction.description]);

  // Filter to only those that would actually change
  const transactionsToUpdate = useMemo(() => {
    if (!selectedCategoryId || !selectedSubcategoryId) return [];

    return similarTransactions.filter(t =>
      t.categoryId !== selectedCategoryId || t.subcategoryId !== selectedSubcategoryId
    );
  }, [similarTransactions, selectedCategoryId, selectedSubcategoryId]);

  if (!isOpen) return null;

  const currentCategoryName = getCategoryName(transaction.categoryId);
  const currentSubcategoryName = getSubcategoryName(
    transaction.categoryId,
    transaction.subcategoryId
  );
  const currentColor = getCategoryColor(transaction.categoryId);
  const currentIcon = getCategoryIcon(transaction.categoryId);

  const newCategoryName = selectedCategoryId ? getCategoryName(selectedCategoryId) : null;
  const newSubcategoryName =
    selectedCategoryId && selectedSubcategoryId
      ? getSubcategoryName(selectedCategoryId, selectedSubcategoryId)
      : null;
  const newColor = getCategoryColor(selectedCategoryId);
  const newIcon = getCategoryIcon(selectedCategoryId);

  const hasChanges =
    selectedCategoryId !== transaction.categoryId ||
    selectedSubcategoryId !== transaction.subcategoryId;

  const canSave = selectedCategoryId && selectedSubcategoryId;

  const handleSelect = (categoryId: string, subcategoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(subcategoryId);
  };

  const handleSave = () => {
    if (selectedCategoryId && selectedSubcategoryId) {
      // Check if there are similar transactions that could be updated
      if (transactionsToUpdate.length > 0 && onBatchSave) {
        // Show the similar transactions dialog
        setShowSimilarDialog(true);
      } else {
        // No similar transactions, just save normally
        setIsSaving(true);
        // Use requestAnimationFrame to ensure UI updates before potentially heavy operation
        requestAnimationFrame(() => {
          onSave(transaction.id, selectedCategoryId, selectedSubcategoryId);
          setIsSaving(false);
          onClose();
        });
      }
    }
  };

  const handleApplyToOne = () => {
    if (selectedCategoryId && selectedSubcategoryId) {
      setIsSaving(true);
      requestAnimationFrame(() => {
        onSave(transaction.id, selectedCategoryId, selectedSubcategoryId);
        setShowSimilarDialog(false);
        setIsSaving(false);
        onClose();
      });
    }
  };

  const handleApplyToAll = () => {
    if (selectedCategoryId && selectedSubcategoryId && onBatchSave) {
      setIsSaving(true);
      requestAnimationFrame(() => {
        // Get all transaction IDs (current + similar that need updating)
        const allIds = [transaction.id, ...transactionsToUpdate.map(t => t.id)];
        onBatchSave(allIds, selectedCategoryId, selectedSubcategoryId);
        setShowSimilarDialog(false);
        setIsSaving(false);
        onClose();
      });
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Accessibility: focus trap and escape key handling
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  const titleId = useId();

  return (
    <>
      <div
        className="fixed inset-0 z-50 overflow-y-auto"
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
            className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden animate-slide-up"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-white">Edit category</h2>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Transaction Info */}
            <div className="px-6 py-4 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-start gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{toTitleCase(transaction.description)}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{formatDate(transaction.date)}</p>
                </div>
                <div
                  className={`text-lg font-semibold ${
                    transaction.amount >= 0 ? 'text-success-600 dark:text-success-400' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {formatAmount(transaction.amount)}
                </div>
              </div>

              {/* Current Category */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Current:</span>
                {transaction.categoryId ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center text-sm"
                      style={{ backgroundColor: `${currentColor}20` }}
                    >
                      {currentIcon}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {currentCategoryName}
                      {currentSubcategoryName && (
                        <span className="text-gray-500 dark:text-gray-400"> › {currentSubcategoryName}</span>
                      )}
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-warning-600 dark:text-warning-400 italic">Uncategorized</span>
                )}
              </div>

              {/* New Category Preview */}
              {hasChanges && selectedCategoryId && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400">New:</span>
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center text-sm"
                      style={{ backgroundColor: `${newColor}20` }}
                    >
                      {newIcon}
                    </span>
                    <span className="text-sm font-medium text-primary-700 dark:text-primary-400">
                      {newCategoryName}
                      {newSubcategoryName && (
                        <span className="text-primary-500 dark:text-primary-300"> › {newSubcategoryName}</span>
                      )}
                    </span>
                  </div>
                </div>
              )}

              {/* Similar transactions hint */}
              {transactionsToUpdate.length > 0 && hasChanges && (
                <div className="mt-3 flex items-center gap-2 text-xs text-primary-600 dark:text-primary-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {transactionsToUpdate.length} similar transaction{transactionsToUpdate.length !== 1 ? 's' : ''} found
                </div>
              )}
            </div>

            {/* Category Selector */}
            <div className="px-6 py-4 overflow-y-auto max-h-[50vh]">
              <CategorySelector
                selectedCategoryId={selectedCategoryId}
                selectedSubcategoryId={selectedSubcategoryId}
                onSelect={handleSelect}
              />
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || !hasChanges || isSaving}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
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
                  'Save changes'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Similar Transactions Dialog */}
      {showSimilarDialog && selectedCategoryId && selectedSubcategoryId && (
        <ApplyCategoryToSimilarDialog
          isOpen={showSimilarDialog}
          onClose={() => setShowSimilarDialog(false)}
          originalTransaction={transaction}
          similarTransactions={transactionsToUpdate}
          newCategoryId={selectedCategoryId}
          newSubcategoryId={selectedSubcategoryId}
          onApplyToOne={handleApplyToOne}
          onApplyToAll={handleApplyToAll}
          isSaving={isSaving}
        />
      )}
    </>
  );
}

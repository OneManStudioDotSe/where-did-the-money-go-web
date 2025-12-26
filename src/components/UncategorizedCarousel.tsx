import { useState, useMemo, useEffect, useId } from 'react';
import type { Transaction } from '../types/transaction';
import { CategorySelector } from './CategorySelector';
import { getCategoryName, getSubcategoryName, getCategoryColor, getCategoryIcon } from '../utils/category-service';
import { toTitleCase } from '../utils/text-utils';
import { useFocusTrap } from '../hooks';

interface UncategorizedCarouselProps {
  transactions: Transaction[];
  isOpen: boolean;
  onClose: () => void;
  onCategorize: (transactionId: string, categoryId: string, subcategoryId: string) => void;
  onBatchCategorize?: (transactionIds: string[], categoryId: string, subcategoryId: string) => void;
}

const ITEMS_PER_PAGE = 10;

function formatAmount(amount: number): string {
  const formatted = Math.abs(amount).toLocaleString('sv-SE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${amount < 0 ? '-' : '+'}${formatted}`;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('sv-SE', {
    month: 'short',
    day: 'numeric',
  });
}

export function UncategorizedCarousel({
  transactions,
  isOpen,
  onClose,
  onCategorize,
  onBatchCategorize,
}: UncategorizedCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [pendingCategory, setPendingCategory] = useState<{
    categoryId: string;
    subcategoryId: string;
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showBatchConfirmation, setShowBatchConfirmation] = useState(false);
  const [batchTransactionIds, setBatchTransactionIds] = useState<string[]>([]);

  // Accessibility: focus trap and escape key handling
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  const titleId = useId();

  const uncategorizedTransactions = useMemo(
    () => transactions.filter((t) => !t.categoryId),
    [transactions]
  );

  const totalPages = Math.ceil(uncategorizedTransactions.length / ITEMS_PER_PAGE);
  const currentTransactions = uncategorizedTransactions.slice(
    currentPage * ITEMS_PER_PAGE,
    (currentPage + 1) * ITEMS_PER_PAGE
  );

  const selectedTransaction = selectedTransactionId
    ? uncategorizedTransactions.find((t) => t.id === selectedTransactionId)
    : null;

  // Find other uncategorized transactions with the same description
  const matchingTransactions = useMemo(() => {
    if (!selectedTransaction) return [];
    const selectedDesc = selectedTransaction.description.toLowerCase().trim();
    return uncategorizedTransactions.filter(
      (t) => t.id !== selectedTransaction.id &&
             t.description.toLowerCase().trim() === selectedDesc
    );
  }, [selectedTransaction, uncategorizedTransactions]);

  // Lock body scroll when dialog is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setShowBatchConfirmation(false);
      setBatchTransactionIds([]);
      setIsProcessing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTransactionSelect = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setPendingCategory(null);
    setShowBatchConfirmation(false);
  };

  const handleCategorySelect = (categoryId: string, subcategoryId: string) => {
    setPendingCategory({ categoryId, subcategoryId });
  };

  const handleConfirmCategory = () => {
    if (!selectedTransactionId || !pendingCategory) return;

    // Check if there are matching transactions
    if (matchingTransactions.length > 0 && onBatchCategorize) {
      // Show batch confirmation dialog
      setBatchTransactionIds([selectedTransactionId, ...matchingTransactions.map(t => t.id)]);
      setShowBatchConfirmation(true);
    } else {
      // Just categorize the single transaction
      applyCategory([selectedTransactionId]);
    }
  };

  const handleBatchConfirm = (applyToAll: boolean) => {
    if (!pendingCategory) return;

    if (applyToAll && onBatchCategorize) {
      applyCategory(batchTransactionIds);
    } else if (selectedTransactionId) {
      applyCategory([selectedTransactionId]);
    }
    setShowBatchConfirmation(false);
  };

  const applyCategory = (transactionIds: string[]) => {
    if (!pendingCategory) return;

    setIsProcessing(true);

    // Use setTimeout to allow UI to update before heavy operation
    setTimeout(() => {
      if (transactionIds.length === 1) {
        onCategorize(transactionIds[0], pendingCategory.categoryId, pendingCategory.subcategoryId);
      } else if (onBatchCategorize) {
        onBatchCategorize(transactionIds, pendingCategory.categoryId, pendingCategory.subcategoryId);
      }

      // Move to next uncategorized transaction
      const remainingTransactions = uncategorizedTransactions.filter(
        t => !transactionIds.includes(t.id)
      );

      if (remainingTransactions.length > 0) {
        setSelectedTransactionId(remainingTransactions[0].id);
        // Adjust page if needed
        const newIndex = remainingTransactions.findIndex(t => t.id === remainingTransactions[0].id);
        const newPage = Math.floor(newIndex / ITEMS_PER_PAGE);
        if (newPage !== currentPage) {
          setCurrentPage(newPage);
        }
      } else {
        setSelectedTransactionId(null);
      }

      setPendingCategory(null);
      setIsProcessing(false);
    }, 10);
  };

  const handleSkip = () => {
    const currentIndex = uncategorizedTransactions.findIndex((t) => t.id === selectedTransactionId);
    const nextTransaction = uncategorizedTransactions[currentIndex + 1];
    if (nextTransaction) {
      setSelectedTransactionId(nextTransaction.id);
    } else {
      // Go to next page or wrap around
      if (currentPage < totalPages - 1) {
        setCurrentPage(currentPage + 1);
        setSelectedTransactionId(null);
      } else {
        setCurrentPage(0);
        setSelectedTransactionId(uncategorizedTransactions[0]?.id || null);
      }
    }
    setPendingCategory(null);
    setShowBatchConfirmation(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && !isProcessing) {
      onClose();
    }
  };

  const handlePrevPage = () => {
    setCurrentPage(Math.max(0, currentPage - 1));
    setSelectedTransactionId(null);
    setPendingCategory(null);
    setShowBatchConfirmation(false);
  };

  const handleNextPage = () => {
    setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
    setSelectedTransactionId(null);
    setPendingCategory(null);
    setShowBatchConfirmation(false);
  };

  return (
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
        <div ref={modalRef} className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden animate-slide-up">
          {/* Loading Overlay */}
          {isProcessing && (
            <div className="absolute inset-0 z-50 bg-white/80 dark:bg-slate-800/80 flex items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-gray-600 dark:text-gray-400">Applying category...</p>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700 bg-warning-50 dark:bg-warning-900/20">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-warning-100 dark:bg-warning-900/50 flex items-center justify-center text-warning-600 dark:text-warning-400">
                  📦
                </span>
                Uncategorized transactions
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {uncategorizedTransactions.length} transaction{uncategorizedTransactions.length !== 1 ? 's' : ''} need categorization
              </p>
            </div>
            <button
              onClick={onClose}
              disabled={isProcessing}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
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

          {uncategorizedTransactions.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
                <svg className="w-8 h-8 text-success-600 dark:text-success-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">All done!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">All transactions have been categorized.</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row h-[70vh] md:h-[60vh]">
              {/* Transaction List - Top on mobile, Left Side on desktop */}
              <div className="w-full md:w-2/5 h-1/3 md:h-full border-b md:border-b-0 md:border-r border-gray-200 dark:border-slate-700 flex flex-col">
                {/* Pagination Header */}
                <div className="px-3 py-2 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0 || isProcessing}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {currentPage + 1}/{totalPages}
                    <span className="hidden sm:inline text-gray-400 dark:text-gray-500 ml-1">
                      ({uncategorizedTransactions.length})
                    </span>
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages - 1 || isProcessing}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Transaction Items - Compact */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  {currentTransactions.map((transaction) => {
                    const isSelected = selectedTransactionId === transaction.id;
                    return (
                      <button
                        key={transaction.id}
                        onClick={() => handleTransactionSelect(transaction.id)}
                        disabled={isProcessing}
                        className={`w-full px-3 py-1.5 text-left border-b border-gray-100 dark:border-slate-700 transition-colors disabled:opacity-50 ${
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-900/30 border-l-3 border-l-primary-500'
                            : 'hover:bg-gray-50 dark:hover:bg-slate-700/50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {toTitleCase(transaction.description)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                              {formatDate(transaction.date)}
                            </span>
                            <span
                              className={`text-xs font-medium ${
                                transaction.amount >= 0 ? 'text-success-600 dark:text-success-400' : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {formatAmount(transaction.amount)}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Selector - Bottom on mobile, Right Side on desktop */}
              <div className="w-full md:w-3/5 flex-1 md:h-full flex flex-col min-h-0">
                {selectedTransaction ? (
                  <>
                    {/* Selected Transaction Info - More compact */}
                    <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-200 dark:border-slate-700 flex-shrink-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate flex-1">
                          {toTitleCase(selectedTransaction.description)}
                        </p>
                        <span
                          className={`text-sm font-medium ml-2 ${
                            selectedTransaction.amount >= 0 ? 'text-success-600 dark:text-success-400' : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {formatAmount(selectedTransaction.amount)} kr
                        </span>
                      </div>

                      {/* Show matching transactions count */}
                      {matchingTransactions.length > 0 && (
                        <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">
                          +{matchingTransactions.length} more with same description
                        </p>
                      )}

                      {/* Pending Category Preview */}
                      {pendingCategory && (
                        <div className="mt-2 flex items-center gap-2 p-2 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                          <span
                            className="w-5 h-5 rounded flex items-center justify-center text-xs"
                            style={{
                              backgroundColor: `${getCategoryColor(pendingCategory.categoryId)}20`,
                            }}
                          >
                            {getCategoryIcon(pendingCategory.categoryId)}
                          </span>
                          <span className="text-xs font-medium text-primary-700 dark:text-primary-300">
                            {getCategoryName(pendingCategory.categoryId)}
                            <span className="text-primary-500 dark:text-primary-400">
                              {' '}› {getSubcategoryName(pendingCategory.categoryId, pendingCategory.subcategoryId)}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Batch Confirmation Dialog */}
                    {showBatchConfirmation && (
                      <div className="px-4 py-3 bg-primary-50 dark:bg-primary-900/20 border-b border-primary-200 dark:border-primary-800 flex-shrink-0">
                        <p className="text-sm text-primary-800 dark:text-primary-200 mb-3">
                          Found <span className="font-semibold">{matchingTransactions.length} other transaction{matchingTransactions.length !== 1 ? 's' : ''}</span> with the same description. Apply this category to all of them?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleBatchConfirm(true)}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                          >
                            Apply to all ({batchTransactionIds.length})
                          </button>
                          <button
                            onClick={() => handleBatchConfirm(false)}
                            className="flex-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-600 rounded-lg transition-colors"
                          >
                            Just this one
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Category Selector - Takes remaining space */}
                    <div className="flex-1 overflow-y-auto p-3 min-h-0">
                      <CategorySelector
                        selectedCategoryId={pendingCategory?.categoryId || null}
                        selectedSubcategoryId={pendingCategory?.subcategoryId || null}
                        onSelect={handleCategorySelect}
                        compact
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="px-4 py-2 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 flex items-center justify-between flex-shrink-0">
                      <button
                        onClick={handleSkip}
                        disabled={isProcessing}
                        className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
                      >
                        Skip
                      </button>
                      <button
                        onClick={handleConfirmCategory}
                        disabled={!pendingCategory || isProcessing || showBatchConfirmation}
                        className="px-4 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply Category
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-6">
                    <div>
                      <svg
                        className="w-10 h-10 mx-auto text-gray-300 dark:text-slate-600 mb-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"
                        />
                      </svg>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Select a transaction to categorize
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          {uncategorizedTransactions.length > 0 && (
            <div className="px-6 py-2 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50 flex items-center justify-between flex-shrink-0">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                <span className="font-medium text-gray-900 dark:text-white">{uncategorizedTransactions.length}</span> remaining
              </p>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors disabled:opacity-50"
              >
                Done for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

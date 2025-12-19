import { useState, useMemo } from 'react';
import type { Transaction } from '../types/transaction';
import { CategorySelector } from './CategorySelector';
import { getCategoryName, getSubcategoryName, getCategoryColor, getCategoryIcon } from '../utils/category-service';

interface UncategorizedCarouselProps {
  transactions: Transaction[];
  isOpen: boolean;
  onClose: () => void;
  onCategorize: (transactionId: string, categoryId: string, subcategoryId: string) => void;
}

const ITEMS_PER_PAGE = 10;

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

export function UncategorizedCarousel({
  transactions,
  isOpen,
  onClose,
  onCategorize,
}: UncategorizedCarouselProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
  const [pendingCategory, setPendingCategory] = useState<{
    categoryId: string;
    subcategoryId: string;
  } | null>(null);

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

  if (!isOpen) return null;

  const handleTransactionSelect = (transactionId: string) => {
    setSelectedTransactionId(transactionId);
    setPendingCategory(null);
  };

  const handleCategorySelect = (categoryId: string, subcategoryId: string) => {
    setPendingCategory({ categoryId, subcategoryId });
  };

  const handleConfirmCategory = () => {
    if (selectedTransactionId && pendingCategory) {
      onCategorize(selectedTransactionId, pendingCategory.categoryId, pendingCategory.subcategoryId);
      // Move to next uncategorized if available
      const currentIndex = uncategorizedTransactions.findIndex((t) => t.id === selectedTransactionId);
      const nextTransaction = uncategorizedTransactions[currentIndex + 1];
      if (nextTransaction) {
        setSelectedTransactionId(nextTransaction.id);
      } else if (uncategorizedTransactions.length > 1) {
        // Go back to first if we're at the end
        setSelectedTransactionId(uncategorizedTransactions[0]?.id || null);
      } else {
        setSelectedTransactionId(null);
      }
      setPendingCategory(null);
    }
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
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handlePrevPage = () => {
    setCurrentPage(Math.max(0, currentPage - 1));
    setSelectedTransactionId(null);
    setPendingCategory(null);
  };

  const handleNextPage = () => {
    setCurrentPage(Math.min(totalPages - 1, currentPage + 1));
    setSelectedTransactionId(null);
    setPendingCategory(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-warning-50">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-warning-100 flex items-center justify-center text-warning-600">
                  📦
                </span>
                Uncategorized Transactions
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {uncategorizedTransactions.length} transaction{uncategorizedTransactions.length !== 1 ? 's' : ''} need categorization
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
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
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-success-100 flex items-center justify-center">
                <svg className="w-8 h-8 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900">All done!</h3>
              <p className="text-sm text-gray-500 mt-1">All transactions have been categorized.</p>
              <button
                onClick={onClose}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          ) : (
            <div className="flex h-[70vh]">
              {/* Transaction List - Left Side */}
              <div className="w-1/2 border-r border-gray-200 flex flex-col">
                {/* Pagination Header */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                  <button
                    onClick={handlePrevPage}
                    disabled={currentPage === 0}
                    className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <span className="text-sm text-gray-600">
                    Page {currentPage + 1} of {totalPages}
                    <span className="text-gray-400 ml-2">
                      ({currentPage * ITEMS_PER_PAGE + 1}-{Math.min((currentPage + 1) * ITEMS_PER_PAGE, uncategorizedTransactions.length)} of {uncategorizedTransactions.length})
                    </span>
                  </span>
                  <button
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages - 1}
                    className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>

                {/* Transaction Items */}
                <div className="flex-1 overflow-y-auto">
                  {currentTransactions.map((transaction) => {
                    const isSelected = selectedTransactionId === transaction.id;
                    return (
                      <button
                        key={transaction.id}
                        onClick={() => handleTransactionSelect(transaction.id)}
                        className={`w-full px-4 py-3 text-left border-b border-gray-100 transition-colors ${
                          isSelected
                            ? 'bg-primary-50 border-l-4 border-l-primary-500'
                            : 'hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {transaction.description}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {formatDate(transaction.date)}
                            </p>
                          </div>
                          <div
                            className={`text-sm font-medium flex-shrink-0 ${
                              transaction.amount >= 0 ? 'text-success-600' : 'text-gray-900'
                            }`}
                          >
                            {formatAmount(transaction.amount)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category Selector - Right Side */}
              <div className="w-1/2 flex flex-col">
                {selectedTransaction ? (
                  <>
                    {/* Selected Transaction Info */}
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {selectedTransaction.description}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-gray-500">
                          {formatDate(selectedTransaction.date)}
                        </span>
                        <span
                          className={`text-sm font-medium ${
                            selectedTransaction.amount >= 0 ? 'text-success-600' : 'text-gray-900'
                          }`}
                        >
                          {formatAmount(selectedTransaction.amount)}
                        </span>
                      </div>

                      {/* Pending Category Preview */}
                      {pendingCategory && (
                        <div className="mt-3 flex items-center gap-2 p-2 bg-primary-50 rounded-lg">
                          <span
                            className="w-6 h-6 rounded flex items-center justify-center text-sm"
                            style={{
                              backgroundColor: `${getCategoryColor(pendingCategory.categoryId)}20`,
                            }}
                          >
                            {getCategoryIcon(pendingCategory.categoryId)}
                          </span>
                          <span className="text-sm font-medium text-primary-700">
                            {getCategoryName(pendingCategory.categoryId)}
                            <span className="text-primary-500">
                              {' '}› {getSubcategoryName(pendingCategory.categoryId, pendingCategory.subcategoryId)}
                            </span>
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Category Selector */}
                    <div className="flex-1 overflow-y-auto p-4">
                      <CategorySelector
                        selectedCategoryId={pendingCategory?.categoryId || null}
                        selectedSubcategoryId={pendingCategory?.subcategoryId || null}
                        onSelect={handleCategorySelect}
                        compact
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                      <button
                        onClick={handleSkip}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
                      >
                        Skip
                      </button>
                      <button
                        onClick={handleConfirmCategory}
                        disabled={!pendingCategory}
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Apply Category
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-center p-6">
                    <div>
                      <svg
                        className="w-12 h-12 mx-auto text-gray-300 mb-3"
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
                      <p className="text-sm text-gray-500">
                        Select a transaction from the list to categorize it
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          {uncategorizedTransactions.length > 0 && (
            <div className="px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
              <p className="text-sm text-gray-500">
                <span className="font-medium text-gray-900">{uncategorizedTransactions.length}</span> remaining
              </p>
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
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

import { useState } from 'react';
import type { Transaction } from '../types/transaction';
import { getCategoryName, getSubcategoryName, getCategoryColor, getCategoryIcon } from '../utils/category-service';
import { CategorySelector } from './CategorySelector';

interface TransactionEditModalProps {
  transaction: Transaction;
  isOpen: boolean;
  onClose: () => void;
  onSave: (transactionId: string, categoryId: string, subcategoryId: string) => void;
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
}: TransactionEditModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    transaction.categoryId
  );
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(
    transaction.subcategoryId
  );

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
      onSave(transaction.id, selectedCategoryId, selectedSubcategoryId);
      onClose();
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
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
        <div className="relative bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Edit Category</h2>
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

          {/* Transaction Info */}
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-start gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">{transaction.description}</p>
                <p className="text-sm text-gray-500 mt-1">{formatDate(transaction.date)}</p>
              </div>
              <div
                className={`text-lg font-semibold ${
                  transaction.amount >= 0 ? 'text-success-600' : 'text-gray-900'
                }`}
              >
                {formatAmount(transaction.amount)}
              </div>
            </div>

            {/* Current Category */}
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-gray-500">Current:</span>
              {transaction.categoryId ? (
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded flex items-center justify-center text-sm"
                    style={{ backgroundColor: `${currentColor}20` }}
                  >
                    {currentIcon}
                  </span>
                  <span className="text-sm font-medium text-gray-900">
                    {currentCategoryName}
                    {currentSubcategoryName && (
                      <span className="text-gray-500"> › {currentSubcategoryName}</span>
                    )}
                  </span>
                </div>
              ) : (
                <span className="text-sm text-warning-600 italic">Uncategorized</span>
              )}
            </div>

            {/* New Category Preview */}
            {hasChanges && selectedCategoryId && (
              <div className="mt-2 flex items-center gap-2">
                <span className="text-sm text-gray-500">New:</span>
                <div className="flex items-center gap-2">
                  <span
                    className="w-6 h-6 rounded flex items-center justify-center text-sm"
                    style={{ backgroundColor: `${newColor}20` }}
                  >
                    {newIcon}
                  </span>
                  <span className="text-sm font-medium text-primary-700">
                    {newCategoryName}
                    {newSubcategoryName && (
                      <span className="text-primary-500"> › {newSubcategoryName}</span>
                    )}
                  </span>
                </div>
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
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!canSave || !hasChanges}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

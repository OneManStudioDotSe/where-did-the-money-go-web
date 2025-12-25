import { useState, useId } from 'react';
import { useFocusTrap } from '../hooks';
import { CategorySelector } from './CategorySelector';

interface BulkCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedCount: number;
  onApply: (categoryId: string, subcategoryId: string) => void;
}

export function BulkCategoryModal({
  isOpen,
  onClose,
  selectedCount,
  onApply,
}: BulkCategoryModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);

  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  const titleId = useId();

  const handleSelect = (categoryId: string, subcategoryId: string) => {
    setSelectedCategoryId(categoryId);
    setSelectedSubcategoryId(subcategoryId);
  };

  const handleApply = () => {
    if (selectedCategoryId && selectedSubcategoryId) {
      onApply(selectedCategoryId, selectedSubcategoryId);
      // Reset selection for next use
      setSelectedCategoryId(null);
      setSelectedSubcategoryId(null);
    }
  };

  const handleClose = () => {
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
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
      <div className="fixed inset-0 bg-black/50 animate-fade-in" onClick={handleClose} aria-hidden="true" />

      {/* Panel */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div ref={modalRef} className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-lg w-full animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-slate-700">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-white">
                Bulk categorize
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Apply a category to {selectedCount} selected transaction{selectedCount !== 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            <CategorySelector
              selectedCategoryId={selectedCategoryId}
              selectedSubcategoryId={selectedSubcategoryId}
              onSelect={handleSelect}
            />
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedCategoryId && selectedSubcategoryId ? (
                <span className="text-primary-600 dark:text-primary-400 font-medium">
                  Category selected
                </span>
              ) : (
                'Select a category above'
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleApply}
                disabled={!selectedCategoryId || !selectedSubcategoryId}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:dark:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                Apply to {selectedCount} transaction{selectedCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

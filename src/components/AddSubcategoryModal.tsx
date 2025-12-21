import { useState, useId } from 'react';
import { defaultCategories } from '../data/categories';
import { addCustomSubcategory, subcategoryExists } from '../utils/category-service';
import { useFocusTrap } from '../hooks';

interface AddSubcategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubcategoryAdded: () => void;
  /** Pre-select a category (optional) */
  initialCategoryId?: string;
}

export function AddSubcategoryModal({
  isOpen,
  onClose,
  onSubcategoryAdded,
  initialCategoryId,
}: AddSubcategoryModalProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(
    initialCategoryId || defaultCategories[0]?.id || ''
  );
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);

  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  const titleId = useId();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();

    if (!trimmedName) {
      setError('Please enter a subcategory name');
      return;
    }

    if (!selectedCategoryId) {
      setError('Please select a category');
      return;
    }

    if (subcategoryExists(selectedCategoryId, trimmedName)) {
      setError('A subcategory with this name already exists');
      return;
    }

    addCustomSubcategory(selectedCategoryId, trimmedName);
    setName('');
    setError(null);
    onSubcategoryAdded();
    onClose();
  };

  const handleClose = () => {
    setName('');
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  const selectedCategory = defaultCategories.find((c) => c.id === selectedCategoryId);

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 animate-fade-in"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full animate-slide-up"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <h2
              id={titleId}
              className="text-lg font-semibold text-gray-900 dark:text-white"
            >
              Add custom subcategory
            </h2>
            <button
              onClick={handleClose}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <svg
                className="w-5 h-5 text-gray-500 dark:text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Category Selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Parent category
              </label>
              <div className="relative">
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 pl-10 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none cursor-pointer"
                >
                  {defaultCategories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </option>
                  ))}
                </select>
                {selectedCategory && (
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg pointer-events-none">
                    {selectedCategory.icon}
                  </span>
                )}
                <svg
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </div>

            {/* Subcategory Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subcategory name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., Farmer's Market"
                className={`w-full px-4 py-2.5 border rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  error
                    ? 'border-danger-500 dark:border-danger-400'
                    : 'border-gray-300 dark:border-slate-600'
                }`}
                autoFocus
                maxLength={50}
              />
              {error && (
                <p className="mt-1.5 text-sm text-danger-600 dark:text-danger-400">
                  {error}
                </p>
              )}
            </div>

            {/* Preview */}
            {name.trim() && selectedCategory && (
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  Preview
                </p>
                <div className="flex items-center gap-2">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${selectedCategory.color}20` }}
                  >
                    {selectedCategory.icon}
                  </span>
                  <span className="text-gray-900 dark:text-white">
                    {selectedCategory.name}
                  </span>
                  <svg
                    className="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <span
                    className="px-2 py-0.5 text-sm rounded-full"
                    style={{
                      backgroundColor: `${selectedCategory.color}15`,
                      color: selectedCategory.color,
                    }}
                  >
                    {name.trim()}
                  </span>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors animate-press"
              >
                Add subcategory
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

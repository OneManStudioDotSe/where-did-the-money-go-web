import { useState, useId } from 'react';
import type { CategoryMapping } from '../types/category';
import { addCustomMapping, getAllCategoriesWithCustomSubcategories, getCategoryIcon, getCategoryColor } from '../utils/category-service';
import { useFocusTrap } from '../hooks';

interface AddMappingRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRuleAdded: () => void;
  /** Pre-fill the pattern field (e.g., from a transaction description) */
  initialPattern?: string;
}

type MatchType = CategoryMapping['matchType'];

const MATCH_TYPES: { value: MatchType; label: string; description: string }[] = [
  { value: 'contains', label: 'Contains', description: 'Matches if description contains this text' },
  { value: 'starts_with', label: 'Starts with', description: 'Matches if description starts with this text' },
  { value: 'exact', label: 'Exact match', description: 'Matches only if description exactly equals this text' },
  { value: 'regex', label: 'Regex', description: 'Advanced: Use a regular expression pattern' },
];

export function AddMappingRuleModal({ isOpen, onClose, onRuleAdded, initialPattern = '' }: AddMappingRuleModalProps) {
  const [pattern, setPattern] = useState(initialPattern);
  const [matchType, setMatchType] = useState<MatchType>('contains');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [priority, setPriority] = useState(100);
  const [error, setError] = useState<string | null>(null);

  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  const titleId = useId();

  const categories = getAllCategoriesWithCustomSubcategories();
  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  const handleSubmit = () => {
    // Validation
    if (!pattern.trim()) {
      setError('Please enter a pattern to match');
      return;
    }
    if (!selectedCategoryId) {
      setError('Please select a category');
      return;
    }

    // Test regex if that's the match type
    if (matchType === 'regex') {
      try {
        new RegExp(pattern);
      } catch {
        setError('Invalid regular expression pattern');
        return;
      }
    }

    // Add the mapping
    addCustomMapping({
      pattern: pattern.trim(),
      matchType,
      categoryId: selectedCategoryId,
      subcategoryId: selectedSubcategoryId || selectedCategory?.subcategories[0]?.id || '',
      priority,
    });

    // Reset and close
    setPattern('');
    setMatchType('contains');
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setPriority(100);
    setError(null);

    onRuleAdded();
    onClose();
  };

  const handleClose = () => {
    setPattern('');
    setMatchType('contains');
    setSelectedCategoryId(null);
    setSelectedSubcategoryId(null);
    setPriority(100);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
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
            <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-white">
              Add Mapping Rule
            </h2>
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
          <div className="px-6 py-4 space-y-5">
            {/* Error message */}
            {error && (
              <div className="p-3 rounded-lg bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800">
                <p className="text-sm text-danger-700 dark:text-danger-400">{error}</p>
              </div>
            )}

            {/* Pattern */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Pattern to match
              </label>
              <input
                type="text"
                value={pattern}
                onChange={(e) => {
                  setPattern(e.target.value);
                  setError(null);
                }}
                placeholder="e.g., STARBUCKS or COFFEE"
                className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                The text to look for in transaction descriptions (case-insensitive)
              </p>
            </div>

            {/* Match Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Match type
              </label>
              <div className="grid grid-cols-2 gap-2">
                {MATCH_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setMatchType(type.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      matchType === type.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {type.label}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {type.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Category
              </label>
              <div className="grid grid-cols-4 gap-2 max-h-[180px] overflow-y-auto p-1">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategoryId(category.id);
                      setSelectedSubcategoryId(null);
                      setError(null);
                    }}
                    className={`p-2 rounded-lg border-2 flex flex-col items-center gap-1 transition-all ${
                      selectedCategoryId === category.id
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                        : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500'
                    }`}
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                      style={{ backgroundColor: `${getCategoryColor(category.id)}20` }}
                    >
                      {getCategoryIcon(category.id)}
                    </span>
                    <span className="text-[10px] text-gray-600 dark:text-gray-400 text-center leading-tight truncate w-full">
                      {category.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Subcategory Selection */}
            {selectedCategory && selectedCategory.subcategories.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subcategory
                </label>
                <div className="flex flex-wrap gap-2">
                  {selectedCategory.subcategories.map((sub) => (
                    <button
                      key={sub.id}
                      type="button"
                      onClick={() => setSelectedSubcategoryId(sub.id)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                        selectedSubcategoryId === sub.id
                          ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 ring-2 ring-primary-500'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-600'
                      }`}
                    >
                      {sub.name}
                      {sub.isCustom && (
                        <span className="ml-1 text-[10px] text-gray-400">(custom)</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Priority: {priority}
              </label>
              <input
                type="range"
                min="1"
                max="100"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Higher priority rules are checked first. Custom rules always take precedence over defaults.
              </p>
            </div>

            {/* Preview */}
            {pattern && selectedCategoryId && (
              <div className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Preview:</p>
                <div className="flex items-center gap-2">
                  <code className="px-2 py-1 bg-white dark:bg-slate-800 rounded text-sm font-mono text-gray-800 dark:text-gray-200">
                    {pattern}
                  </code>
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                  <span
                    className="w-6 h-6 rounded flex items-center justify-center text-sm"
                    style={{ backgroundColor: `${getCategoryColor(selectedCategoryId)}20` }}
                  >
                    {getCategoryIcon(selectedCategoryId)}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    {selectedCategory?.name}
                    {selectedSubcategoryId && (
                      <span className="text-gray-400 dark:text-gray-500">
                        {' / '}{selectedCategory?.subcategories.find(s => s.id === selectedSubcategoryId)?.name}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!pattern.trim() || !selectedCategoryId}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 dark:disabled:bg-slate-600 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              Add rule
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

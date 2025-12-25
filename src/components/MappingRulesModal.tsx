import { useState, useId } from 'react';
import type { CategoryMapping } from '../types/category';
import { getCustomMappings, removeCustomMapping } from '../utils/category-service';
import { getCategoryName, getSubcategoryName, getCategoryIcon, getCategoryColor } from '../utils/category-service';
import { useFocusTrap } from '../hooks';

interface MappingRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddRule: () => void;
  onRulesChange: () => void;
}

function formatMatchType(matchType: CategoryMapping['matchType']): string {
  switch (matchType) {
    case 'exact':
      return 'Exact match';
    case 'starts_with':
      return 'Starts with';
    case 'contains':
      return 'Contains';
    case 'regex':
      return 'Regex';
    default:
      return matchType;
  }
}

export function MappingRulesModal({ isOpen, onClose, onAddRule, onRulesChange }: MappingRulesModalProps) {
  const [rules, setRules] = useState<CategoryMapping[]>(() => getCustomMappings());
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onClose);
  const titleId = useId();

  const handleDelete = (id: string) => {
    removeCustomMapping(id);
    setRules(getCustomMappings());
    setDeleteConfirmId(null);
    onRulesChange();
  };

  const refreshRules = () => {
    setRules(getCustomMappings());
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
        <div ref={modalRef} className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full animate-slide-up">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-gray-200 dark:border-slate-700">
            <div>
              <h2 id={titleId} className="text-lg font-semibold text-gray-900 dark:text-white">
                Custom Mapping Rules
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Rules that automatically categorize transactions based on merchant names
              </p>
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
          <div className="px-6 py-4 max-h-[60vh] overflow-y-auto">
            {rules.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  No custom rules yet
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-sm mx-auto">
                  Create mapping rules to automatically categorize transactions from specific merchants.
                </p>
                <button
                  onClick={() => {
                    onAddRule();
                    // Refresh rules when modal reopens
                    setTimeout(refreshRules, 100);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add your first rule
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-lg border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 transition-colors"
                  >
                    {deleteConfirmId === rule.id ? (
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-danger-600 dark:text-danger-400">
                          Delete this rule?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(rule.id)}
                            className="px-3 py-1.5 text-xs font-medium bg-danger-600 text-white rounded-md hover:bg-danger-700 transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-3 py-1.5 text-xs font-medium bg-gray-200 dark:bg-slate-600 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-slate-500 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          {/* Pattern */}
                          <div className="flex items-center gap-2 mb-2">
                            <code className="px-2 py-1 bg-gray-100 dark:bg-slate-700 rounded text-sm font-mono text-gray-800 dark:text-gray-200 truncate max-w-[200px]">
                              {rule.pattern}
                            </code>
                            <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                              {formatMatchType(rule.matchType)}
                            </span>
                          </div>

                          {/* Arrow and Category */}
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                            </svg>
                            <div className="flex items-center gap-2">
                              <span
                                className="w-6 h-6 rounded flex items-center justify-center text-sm flex-shrink-0"
                                style={{ backgroundColor: `${getCategoryColor(rule.categoryId)}20` }}
                              >
                                {getCategoryIcon(rule.categoryId)}
                              </span>
                              <span className="text-sm text-gray-700 dark:text-gray-300">
                                {getCategoryName(rule.categoryId)}
                                {rule.subcategoryId && (
                                  <span className="text-gray-400 dark:text-gray-500">
                                    {' / '}{getSubcategoryName(rule.categoryId, rule.subcategoryId)}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Priority */}
                          <div className="mt-2">
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              Priority: {rule.priority}
                            </span>
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={() => setDeleteConfirmId(rule.id)}
                          className="p-2 text-gray-400 hover:text-danger-500 dark:hover:text-danger-400 transition-colors flex-shrink-0"
                          title="Delete rule"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {rules.length} rule{rules.length !== 1 ? 's' : ''}
            </p>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Close
              </button>
              {rules.length > 0 && (
                <button
                  onClick={() => {
                    onAddRule();
                    setTimeout(refreshRules, 100);
                  }}
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add rule
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

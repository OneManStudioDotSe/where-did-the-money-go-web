import { useState } from 'react';
import type { Category, CategoryMapping, Subcategory } from '../types';

interface CustomSubcategory {
  id: string;
  name: string;
  parentCategoryId: string;
}

interface CategoryWithCustom extends Omit<Category, 'subcategories'> {
  subcategories: Array<Subcategory & { isCustom?: boolean }>;
}

interface CategorySystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCategories: CategoryWithCustom[];
  customSubcategories: CustomSubcategory[];
  defaultCategoryMappings: CategoryMapping[];
  defaultCategories: Category[];
  totalSubcategories: number;
  onAddSubcategory: () => void;
  onDeleteCustomSubcategory: (id: string) => void;
}

type TabType = 'categories' | 'mappings';

export function CategorySystemModal({
  isOpen,
  onClose,
  allCategories,
  customSubcategories,
  defaultCategoryMappings,
  defaultCategories,
  totalSubcategories,
  onAddSubcategory,
  onDeleteCustomSubcategory,
}: CategorySystemModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('categories');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Category system</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {defaultCategories.length} categories • {totalSubcategories} subcategories • {defaultCategoryMappings.length} merchant mappings
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-slate-700 px-6">
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'categories'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Categories
              {customSubcategories.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400">
                  +{customSubcategories.length}
                </span>
              )}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('mappings')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'mappings'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Merchant mappings
              <span className="px-1.5 py-0.5 text-xs font-medium rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400">
                {defaultCategoryMappings.length}
              </span>
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-180px)]">
          {activeTab === 'categories' ? (
            /* Categories Tab */
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {allCategories.length} categories with {totalSubcategories} subcategories
                </p>
                <button
                  onClick={onAddSubcategory}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors animate-press"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add subcategory
                </button>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {allCategories.map((category) => (
                  <div
                    key={category.id}
                    className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        {category.icon}
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{category.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{category.subcategories.length} subcategories</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {category.subcategories.map((sub) => (
                        <span
                          key={sub.id}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-full ${sub.isCustom ? 'pr-1' : ''}`}
                          style={{
                            backgroundColor: `${category.color}15`,
                            color: category.color,
                          }}
                        >
                          {sub.name}
                          {sub.isCustom && (
                            <button
                              onClick={() => onDeleteCustomSubcategory(sub.id)}
                              className="ml-0.5 p-0.5 rounded-full hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                              title="Delete custom subcategory"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Merchant Mappings Tab */
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                These patterns are used to automatically categorize transactions based on their description.
              </p>
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="max-h-[calc(80vh-280px)] overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-700 sticky top-0">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Pattern</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Category</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Subcategory</th>
                        <th className="text-center px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Match Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {defaultCategoryMappings.map((mapping) => {
                        const category = defaultCategories.find(c => c.id === mapping.categoryId);
                        const subcategory = category?.subcategories.find(s => s.id === mapping.subcategoryId);
                        return (
                          <tr key={mapping.id} className="hover:bg-gray-50 dark:hover:bg-slate-700/30">
                            <td className="px-4 py-2">
                              <code className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-700 rounded text-xs font-mono text-gray-800 dark:text-gray-200">
                                {mapping.pattern}
                              </code>
                            </td>
                            <td className="px-4 py-2">
                              <div className="flex items-center gap-1.5">
                                <span className="text-sm">{category?.icon}</span>
                                <span className="text-gray-700 dark:text-gray-300">{category?.name || mapping.categoryId}</span>
                              </div>
                            </td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-400">
                              {subcategory?.name || mapping.subcategoryId}
                            </td>
                            <td className="px-4 py-2 text-center">
                              <span className={`px-2 py-0.5 text-xs rounded-full ${
                                mapping.matchType === 'exact'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                  : mapping.matchType === 'starts_with'
                                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                  : mapping.matchType === 'regex'
                                  ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-400'
                              }`}>
                                {mapping.matchType}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

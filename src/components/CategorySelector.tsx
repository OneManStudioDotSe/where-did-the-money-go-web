import { useState, useMemo } from 'react';
import { getAllCategoriesWithCustomSubcategories } from '../utils/category-service';
import type { Category } from '../types/category';

interface CategorySelectorProps {
  selectedCategoryId: string | null;
  selectedSubcategoryId: string | null;
  onSelect: (categoryId: string, subcategoryId: string) => void;
  compact?: boolean;
}

export function CategorySelector({
  selectedCategoryId,
  selectedSubcategoryId,
  onSelect,
  compact = false,
}: CategorySelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(selectedCategoryId);

  // Get all categories including custom subcategories
  const allCategories = useMemo(() => getAllCategoriesWithCustomSubcategories(), []);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return allCategories;

    const query = searchQuery.toLowerCase();
    return allCategories
      .map((category) => {
        const categoryMatches = category.name.toLowerCase().includes(query);
        const matchingSubcategories = category.subcategories.filter((sub) =>
          sub.name.toLowerCase().includes(query)
        );

        if (categoryMatches) {
          return category;
        } else if (matchingSubcategories.length > 0) {
          return {
            ...category,
            subcategories: matchingSubcategories,
          };
        }
        return null;
      })
      .filter((c): c is Category => c !== null);
  }, [searchQuery, allCategories]);

  const handleCategoryClick = (categoryId: string) => {
    if (expandedCategory === categoryId) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categoryId);
    }
  };

  const handleSubcategorySelect = (categoryId: string, subcategoryId: string) => {
    onSelect(categoryId, subcategoryId);
  };

  return (
    <div className={compact ? '' : 'space-y-3'}>
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
        />
      </div>

      {/* Category List */}
      <div className={`space-y-1 ${compact ? 'max-h-60' : 'max-h-80'} overflow-y-auto`}>
        {filteredCategories.map((category) => {
          const isExpanded = expandedCategory === category.id || searchQuery.trim() !== '';
          const isSelectedCategory = selectedCategoryId === category.id;

          return (
            <div key={category.id} className="border border-gray-200 dark:border-slate-600 rounded-lg overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => handleCategoryClick(category.id)}
                className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                  isSelectedCategory ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
              >
                <span
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {category.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">{category.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {category.subcategories.length} subcategories
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 text-gray-400 transition-transform ${
                    isExpanded ? 'rotate-180' : ''
                  }`}
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
              </button>

              {/* Subcategories */}
              {isExpanded && (
                <div className="border-t border-gray-100 dark:border-slate-600 bg-gray-50 dark:bg-slate-700/50 p-2">
                  <div className="grid grid-cols-2 gap-1">
                    {category.subcategories.map((subcategory) => {
                      const isSelected =
                        selectedCategoryId === category.id &&
                        selectedSubcategoryId === subcategory.id;

                      return (
                        <button
                          key={subcategory.id}
                          onClick={() => handleSubcategorySelect(category.id, subcategory.id)}
                          className={`px-3 py-2 text-sm rounded-md text-left transition-colors ${
                            isSelected
                              ? 'bg-primary-600 text-white'
                              : 'bg-white dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-slate-500'
                          }`}
                        >
                          <span className="flex items-center gap-1">
                            {subcategory.name}
                            {subcategory.isCustom && (
                              <span className={`text-[10px] px-1 py-0.5 rounded ${
                                isSelected
                                  ? 'bg-white/20 text-white'
                                  : 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                              }`}>
                                custom
                              </span>
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredCategories.length === 0 && (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="text-sm">No categories found for "{searchQuery}"</p>
          </div>
        )}
      </div>
    </div>
  );
}

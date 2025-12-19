import { useState } from 'react';
import type { TransactionFilters } from '../types/transaction';
import { defaultCategories } from '../data/categories';

interface FilterPanelProps {
  filters: TransactionFilters;
  onFiltersChange: (filters: TransactionFilters) => void;
  totalCount: number;
  filteredCount: number;
}

const defaultFilters: TransactionFilters = {
  categoryIds: [],
  dateRange: { start: null, end: null },
  amountRange: { min: null, max: null },
  searchQuery: '',
  showOnlyUncategorized: false,
  showOnlySubscriptions: false,
};

export function FilterPanel({
  filters,
  onFiltersChange,
  totalCount,
  filteredCount,
}: FilterPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveFilters =
    filters.categoryIds.length > 0 ||
    filters.dateRange.start !== null ||
    filters.dateRange.end !== null ||
    filters.amountRange.min !== null ||
    filters.amountRange.max !== null ||
    filters.searchQuery !== '' ||
    filters.showOnlyUncategorized ||
    filters.showOnlySubscriptions;

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, searchQuery: value });
  };

  const handleCategoryToggle = (categoryId: string) => {
    const newCategoryIds = filters.categoryIds.includes(categoryId)
      ? filters.categoryIds.filter((id) => id !== categoryId)
      : [...filters.categoryIds, categoryId];
    onFiltersChange({ ...filters, categoryIds: newCategoryIds });
  };

  const handleDateChange = (field: 'start' | 'end', value: string) => {
    const date = value ? new Date(value) : null;
    onFiltersChange({
      ...filters,
      dateRange: { ...filters.dateRange, [field]: date },
    });
  };

  const handleAmountChange = (field: 'min' | 'max', value: string) => {
    const amount = value ? parseFloat(value) : null;
    onFiltersChange({
      ...filters,
      amountRange: { ...filters.amountRange, [field]: amount },
    });
  };

  const handleToggleChange = (
    field: 'showOnlyUncategorized' | 'showOnlySubscriptions'
  ) => {
    onFiltersChange({ ...filters, [field]: !filters[field] });
  };

  const handleClearFilters = () => {
    onFiltersChange(defaultFilters);
  };

  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    return date.toISOString().split('T')[0];
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Search Bar + Toggle */}
      <div className="p-4">
        <div className="flex items-center gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
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
              placeholder="Search transactions..."
              value={filters.searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors"
            />
            {filters.searchQuery && (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Filter Toggle Button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
              isExpanded || hasActiveFilters
                ? 'border-primary-300 bg-primary-50 text-primary-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
              />
            </svg>
            Filters
            {hasActiveFilters && (
              <span className="w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                {[
                  filters.categoryIds.length > 0,
                  filters.dateRange.start || filters.dateRange.end,
                  filters.amountRange.min !== null || filters.amountRange.max !== null,
                  filters.showOnlyUncategorized,
                  filters.showOnlySubscriptions,
                ].filter(Boolean).length}
              </span>
            )}
          </button>

          {/* Results Count */}
          <div className="text-sm text-gray-500">
            {filteredCount === totalCount ? (
              <span>{totalCount} transactions</span>
            ) : (
              <span>
                <span className="font-medium text-gray-900">{filteredCount}</span> of{' '}
                {totalCount} transactions
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="border-t border-gray-200 p-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categories
              </label>
              <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-200 rounded-lg p-2">
                {defaultCategories.map((category) => (
                  <label
                    key={category.id}
                    className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filters.categoryIds.includes(category.id)}
                      onChange={() => handleCategoryToggle(category.id)}
                      className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                    />
                    <span
                      className="w-5 h-5 rounded flex items-center justify-center text-xs"
                      style={{ backgroundColor: `${category.color}20` }}
                    >
                      {category.icon}
                    </span>
                    <span className="text-sm text-gray-700">{category.name}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date Range
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">From</label>
                  <input
                    type="date"
                    value={formatDateForInput(filters.dateRange.start)}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">To</label>
                  <input
                    type="date"
                    value={formatDateForInput(filters.dateRange.end)}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Amount Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount Range (kr)
              </label>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={filters.amountRange.min ?? ''}
                    onChange={(e) => handleAmountChange('min', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Max</label>
                  <input
                    type="number"
                    placeholder="No limit"
                    value={filters.amountRange.max ?? ''}
                    onChange={(e) => handleAmountChange('max', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Quick Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Filters
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showOnlyUncategorized}
                    onChange={() => handleToggleChange('showOnlyUncategorized')}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm text-gray-700">Uncategorized only</span>
                    <p className="text-xs text-gray-500">Show transactions needing review</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.showOnlySubscriptions}
                    onChange={() => handleToggleChange('showOnlySubscriptions')}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <div>
                    <span className="text-sm text-gray-700">Subscriptions only</span>
                    <p className="text-xs text-gray-500">Show recurring payments</p>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Active Filters Summary & Clear */}
          {hasActiveFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200 flex items-center justify-between">
              <div className="flex flex-wrap gap-2">
                {filters.categoryIds.length > 0 && (
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                    {filters.categoryIds.length} categor{filters.categoryIds.length === 1 ? 'y' : 'ies'}
                  </span>
                )}
                {(filters.dateRange.start || filters.dateRange.end) && (
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                    Date range
                  </span>
                )}
                {(filters.amountRange.min !== null || filters.amountRange.max !== null) && (
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                    Amount range
                  </span>
                )}
                {filters.showOnlyUncategorized && (
                  <span className="px-2 py-1 bg-warning-100 text-warning-700 text-xs rounded-full">
                    Uncategorized
                  </span>
                )}
                {filters.showOnlySubscriptions && (
                  <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full">
                    Subscriptions
                  </span>
                )}
              </div>
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-600 hover:text-gray-900 font-medium"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export { defaultFilters };

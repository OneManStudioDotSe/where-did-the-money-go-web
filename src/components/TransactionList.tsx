import { useState, useMemo, useRef, useEffect } from 'react';
import type { Transaction, TransactionSortField, SortDirection } from '../types/transaction';
import { getCategoryName, getSubcategoryName, getCategoryColor, getCategoryIcon, getAllCategoriesWithCustomSubcategories } from '../utils/category-service';
import { TransactionBadges, Badge } from './ui/Badge';
import { toTitleCase } from '../utils/text-utils';
import { TransactionsEmptyState } from './ui/EmptyState';

/**
 * Props for the TransactionList component.
 */
interface TransactionListProps {
  /**
   * Array of transactions to display.
   */
  transactions: Transaction[];
  /**
   * Callback fired when a transaction row is clicked.
   * @param transaction - The clicked transaction
   */
  onTransactionClick?: (transaction: Transaction) => void;
  /**
   * Number of transactions per page.
   * @default 100
   */
  pageSize?: number;
  /**
   * Whether bulk editing mode is enabled.
   * When true, checkboxes are shown for multi-select.
   */
  bulkEditEnabled?: boolean;
  /**
   * Set of selected transaction IDs for bulk editing.
   */
  selectedIds?: Set<string>;
  /**
   * Callback fired when selection changes in bulk edit mode.
   * @param selectedIds - Updated set of selected transaction IDs
   */
  onSelectionChange?: (selectedIds: Set<string>) => void;
  /**
   * Callback fired when the bulk categorize button is clicked.
   */
  onBulkCategorize?: () => void;
  /**
   * Timestamp when the data was last updated/saved.
   */
  lastUpdated?: string | null;
  /**
   * Callback fired when a transaction's category is changed via inline editing.
   * @param transactionId - The ID of the transaction to update
   * @param categoryId - The new category ID
   * @param subcategoryId - The new subcategory ID
   */
  onCategoryChange?: (transactionId: string, categoryId: string, subcategoryId: string) => void;
  /**
   * ID of the largest expense transaction in the current view.
   * Used to show the "Largest" badge.
   */
  largestExpenseId?: string | null;
  /**
   * ID of the largest income transaction in the current view.
   * Used to show the "Largest" badge.
   */
  largestIncomeId?: string | null;
  /**
   * Whether debug mode is enabled.
   * When true, shows transaction IDs and additional debug info.
   */
  debugMode?: boolean;
}

interface SortState {
  field: TransactionSortField;
  direction: SortDirection;
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
    month: 'short',
    day: 'numeric',
  });
}

function formatDateCondensed(date: Date): string {
  return date.toLocaleDateString('sv-SE', {
    month: 'short',
    day: 'numeric',
  });
}

function SortIcon({ field, currentSort }: { field: TransactionSortField; currentSort: SortState }) {
  const isActive = currentSort.field === field;

  return (
    <span className={`inline-flex flex-col ml-1 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`}>
      <svg
        className={`w-3 h-3 -mb-1 ${isActive && currentSort.direction === 'asc' ? 'text-primary-600 dark:text-primary-400' : ''}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M5 10l5-5 5 5H5z" />
      </svg>
      <svg
        className={`w-3 h-3 ${isActive && currentSort.direction === 'desc' ? 'text-primary-600 dark:text-primary-400' : ''}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M5 10l5 5 5-5H5z" />
      </svg>
    </span>
  );
}

function InfoTooltip({ content }: { content: string }) {
  return (
    <div className="group/tooltip relative flex items-center justify-center">
      <button
        className="w-5 h-5 rounded-full flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </button>
      <div className="absolute z-50 hidden group-hover/tooltip:block bottom-full right-0 mb-2 px-3 py-2 text-xs text-white bg-gray-900 dark:bg-slate-700 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
        {content}
        <div className="absolute top-full right-2 -mt-1">
          <div className="border-4 border-transparent border-t-gray-900 dark:border-t-slate-700" />
        </div>
      </div>
    </div>
  );
}

/** Hover preview tooltip for transaction rows */
function HoverPreviewTooltip({
  description,
  categoryName,
  subcategoryName,
  amount,
  date
}: {
  description: string;
  categoryName: string | undefined;
  subcategoryName: string | undefined;
  amount: number;
  date: Date;
}) {
  return (
    <div className="absolute z-50 left-0 bottom-full mb-2 px-3 py-2 bg-gray-900 dark:bg-slate-700 rounded-lg shadow-lg pointer-events-none opacity-0 group-hover/row:opacity-100 transition-opacity duration-200 max-w-sm">
      <div className="text-xs text-white space-y-1">
        <p className="font-medium truncate" title={description}>{toTitleCase(description)}</p>
        <div className="flex items-center gap-2 text-gray-300">
          <span>{formatDate(date)}</span>
          <span>•</span>
          <span className={amount >= 0 ? 'text-green-400' : 'text-white'}>{formatAmount(amount)}</span>
        </div>
        <p className="text-gray-400">
          {categoryName || 'Uncategorized'}
          {subcategoryName && ` › ${subcategoryName}`}
        </p>
      </div>
      <div className="absolute top-full left-4 -mt-1">
        <div className="border-4 border-transparent border-t-gray-900 dark:border-t-slate-700" />
      </div>
    </div>
  );
}

/** Inline category dropdown for double-click editing */
function InlineCategoryDropdown({
  transactionId,
  currentCategoryId,
  currentSubcategoryId,
  onSelect,
  onClose,
}: {
  transactionId: string;
  currentCategoryId: string | null;
  currentSubcategoryId: string | null;
  onSelect: (transactionId: string, categoryId: string, subcategoryId: string) => void;
  onClose: () => void;
}) {
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategory, setExpandedCategory] = useState<string | null>(currentCategoryId);
  const allCategories = useMemo(() => getAllCategoriesWithCustomSubcategories(), []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on escape key
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return allCategories;
    const query = searchQuery.toLowerCase();
    return allCategories
      .map((category) => {
        const categoryMatches = category.name.toLowerCase().includes(query);
        const matchingSubcategories = category.subcategories.filter((sub) =>
          sub.name.toLowerCase().includes(query)
        );
        if (categoryMatches) return category;
        if (matchingSubcategories.length > 0) {
          return { ...category, subcategories: matchingSubcategories };
        }
        return null;
      })
      .filter((c) => c !== null);
  }, [searchQuery, allCategories]);

  const handleSubcategorySelect = (categoryId: string, subcategoryId: string) => {
    onSelect(transactionId, categoryId, subcategoryId);
    onClose();
  };

  return (
    <div
      ref={dropdownRef}
      className="absolute z-50 top-full left-0 mt-1 w-72 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-gray-200 dark:border-slate-600 animate-scale-in"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Search */}
      <div className="p-2 border-b border-gray-200 dark:border-slate-700">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search categories..."
          className="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          autoFocus
        />
      </div>

      {/* Category List */}
      <div className="max-h-64 overflow-y-auto p-1">
        {filteredCategories.map((category) => {
          if (!category) return null;
          const isExpanded = expandedCategory === category.id || searchQuery.trim() !== '';
          const isSelectedCategory = currentCategoryId === category.id;

          return (
            <div key={category.id} className="mb-1">
              <button
                onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 text-left rounded-md transition-colors ${
                  isSelectedCategory ? 'bg-primary-50 dark:bg-primary-900/30' : 'hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <span
                  className="w-6 h-6 rounded flex items-center justify-center text-sm flex-shrink-0"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  {category.icon}
                </span>
                <span className="flex-1 text-sm font-medium text-gray-900 dark:text-white truncate">
                  {category.name}
                </span>
                <svg
                  className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isExpanded && (
                <div className="ml-8 mt-1 space-y-0.5">
                  {category.subcategories.map((sub) => {
                    const isSelected = currentCategoryId === category.id && currentSubcategoryId === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSubcategorySelect(category.id, sub.id)}
                        className={`w-full px-2 py-1 text-left text-sm rounded transition-colors ${
                          isSelected
                            ? 'bg-primary-600 text-white'
                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                        }`}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const DEFAULT_PAGE_SIZE = 100;

/**
 * Formats a timestamp for display
 */
function formatLastUpdated(timestamp: string | null | undefined): string | null {
  if (!timestamp) return null;
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins !== 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    return date.toLocaleDateString('sv-SE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return null;
  }
}

export function TransactionList({
  transactions,
  onTransactionClick,
  pageSize = DEFAULT_PAGE_SIZE,
  bulkEditEnabled = false,
  selectedIds = new Set(),
  onSelectionChange,
  onBulkCategorize,
  lastUpdated,
  onCategoryChange,
  largestExpenseId,
  largestIncomeId,
  debugMode = false,
}: TransactionListProps) {
  const [sort, setSort] = useState<SortState>({ field: 'date', direction: 'desc' });
  const [isCondensed, setIsCondensed] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);

  // Pre-compute category names cache to avoid repeated lookups during sort
  const categoryNameCache = useMemo(() => {
    const cache = new Map<string | null, string>();
    transactions.forEach(t => {
      if (!cache.has(t.categoryId)) {
        cache.set(t.categoryId, getCategoryName(t.categoryId) || 'zzz');
      }
    });
    return cache;
  }, [transactions]);

  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      let comparison = 0;

      switch (sort.field) {
        case 'date':
          comparison = a.date.getTime() - b.date.getTime();
          break;
        case 'amount':
          comparison = Math.abs(a.amount) - Math.abs(b.amount);
          break;
        case 'category':
          // Use cached category names for faster sorting
          const catA = categoryNameCache.get(a.categoryId) || 'zzz';
          const catB = categoryNameCache.get(b.categoryId) || 'zzz';
          comparison = catA.localeCompare(catB, 'sv-SE');
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description, 'sv-SE');
          break;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [transactions, sort, categoryNameCache]);

  // Pagination calculations
  const totalPages = Math.ceil(sortedTransactions.length / pageSize);
  const paginatedTransactions = useMemo(() => {
    const start = currentPage * pageSize;
    return sortedTransactions.slice(start, start + pageSize);
  }, [sortedTransactions, currentPage, pageSize]);

  // Reset to first page when transactions change (e.g., filter applied)
  useMemo(() => {
    if (currentPage >= totalPages && totalPages > 0) {
      setCurrentPage(Math.max(0, totalPages - 1));
    }
  }, [currentPage, totalPages]);

  const handleSort = (field: TransactionSortField) => {
    // Reset to first page when sorting changes
    setCurrentPage(0);
    // Show loading state for large datasets
    if (transactions.length > 500) {
      setIsSorting(true);
      // Use requestAnimationFrame to allow UI to update before heavy computation
      requestAnimationFrame(() => {
        setSort((prev) => ({
          field,
          direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
        }));
        // Clear loading state after sort completes
        requestAnimationFrame(() => setIsSorting(false));
      });
    } else {
      setSort((prev) => ({
        field,
        direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
      }));
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Bulk selection handlers
  const handleToggleSelect = (transactionId: string) => {
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    onSelectionChange(newSelected);
  };

  const handleSelectAll = () => {
    if (!onSelectionChange) return;
    // Select all transactions on the current page
    const newSelected = new Set(selectedIds);
    paginatedTransactions.forEach(t => newSelected.add(t.id));
    onSelectionChange(newSelected);
  };

  const handleSelectNone = () => {
    if (!onSelectionChange) return;
    // Deselect all transactions on the current page
    const newSelected = new Set(selectedIds);
    paginatedTransactions.forEach(t => newSelected.delete(t.id));
    onSelectionChange(newSelected);
  };

  const handleClearAll = () => {
    if (!onSelectionChange) return;
    onSelectionChange(new Set());
  };

  // Count how many on current page are selected
  const selectedOnPage = paginatedTransactions.filter(t => selectedIds.has(t.id)).length;
  const allOnPageSelected = paginatedTransactions.length > 0 && selectedOnPage === paginatedTransactions.length;

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
        <TransactionsEmptyState />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden relative">
      {/* Sorting Loading Overlay */}
      {isSorting && (
        <div className="absolute inset-0 bg-white/50 dark:bg-slate-800/50 z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 rounded-lg shadow-lg border border-gray-200 dark:border-slate-600">
            <div className="w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600 dark:text-gray-300">Sorting...</span>
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          {/* Bulk selection controls */}
          {bulkEditEnabled && (
            <div className="flex items-center gap-2">
              <button
                onClick={allOnPageSelected ? handleSelectNone : handleSelectAll}
                className="flex items-center gap-1.5 px-2 py-1 text-xs rounded border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={allOnPageSelected}
                  onChange={() => {}}
                  className="w-3.5 h-3.5 rounded border-gray-300 dark:border-slate-500 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <span className="text-gray-600 dark:text-gray-400">
                  {allOnPageSelected ? 'Deselect page' : 'Select page'}
                </span>
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Clear all ({selectedIds.size})
                </button>
              )}
            </div>
          )}
          <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-3 flex-wrap">
            <span>
              {bulkEditEnabled && selectedIds.size > 0 ? (
                <span className="font-medium text-primary-600 dark:text-primary-400">
                  {selectedIds.size} selected
                </span>
              ) : totalPages > 1 ? (
                <>
                  Showing {currentPage * pageSize + 1}-{Math.min((currentPage + 1) * pageSize, sortedTransactions.length)} of {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}
                </>
              ) : (
                <>
                  {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}
                </>
              )}
            </span>
            {lastUpdated && formatLastUpdated(lastUpdated) && (
              <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Updated {formatLastUpdated(lastUpdated)}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Bulk categorize button */}
          {bulkEditEnabled && selectedIds.size > 0 && onBulkCategorize && (
            <button
              onClick={onBulkCategorize}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              Categorize ({selectedIds.size})
            </button>
          )}
          <button
            onClick={() => setIsCondensed(!isCondensed)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
              isCondensed
                ? 'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isCondensed ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              )}
            </svg>
            {isCondensed ? 'Condensed' : 'Expanded'}
          </button>
        </div>
      </div>

      {/* Header - Sticky */}
      <div className={`grid ${bulkEditEnabled ? 'grid-cols-13' : 'grid-cols-12'} gap-4 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-gray-400 sticky top-0 z-10`}>
        {bulkEditEnabled && (
          <div className="col-span-1 flex items-center">
            {/* Header checkbox space */}
          </div>
        )}
        <button
          onClick={() => handleSort('date')}
          className={`${isCondensed ? 'col-span-2' : 'col-span-2'} flex items-center text-left hover:text-gray-900 dark:hover:text-white transition-colors`}
        >
          <SortIcon field="date" currentSort={sort} />
          <span className="ml-1">Date</span>
        </button>
        <button
          onClick={() => handleSort('description')}
          className={`${bulkEditEnabled ? (isCondensed ? 'col-span-4' : 'col-span-3') : (isCondensed ? 'col-span-5' : 'col-span-4')} flex items-center text-left hover:text-gray-900 dark:hover:text-white transition-colors`}
        >
          <SortIcon field="description" currentSort={sort} />
          <span className="ml-1">Description</span>
        </button>
        <button
          onClick={() => handleSort('category')}
          className={`${isCondensed ? 'col-span-3' : 'col-span-3'} flex items-center text-left hover:text-gray-900 dark:hover:text-white transition-colors`}
        >
          <SortIcon field="category" currentSort={sort} />
          <span className="ml-1">Category</span>
        </button>
        <button
          onClick={() => handleSort('amount')}
          className={`${isCondensed ? 'col-span-2' : 'col-span-3'} flex items-center justify-end hover:text-gray-900 dark:hover:text-white transition-colors`}
        >
          <span className="mr-1">Amount</span>
          <SortIcon field="amount" currentSort={sort} />
        </button>
      </div>

      {/* Transactions */}
      <div className="divide-y divide-gray-100 dark:divide-slate-700">
        {paginatedTransactions.map((transaction) => {
          const categoryColor = getCategoryColor(transaction.categoryId);
          const categoryIcon = getCategoryIcon(transaction.categoryId);
          const categoryName = getCategoryName(transaction.categoryId);
          const subcategoryName = getSubcategoryName(
            transaction.categoryId,
            transaction.subcategoryId
          );

          const tooltipContent = `${formatDate(transaction.date)} | ${transaction.description} | ${categoryName || 'Uncategorized'}${subcategoryName ? ` > ${subcategoryName}` : ''} | ${formatAmount(transaction.amount)}`;

          const isSelected = selectedIds.has(transaction.id);

          if (isCondensed) {
            return (
              <div
                key={transaction.id}
                onClick={() => bulkEditEnabled ? handleToggleSelect(transaction.id) : onTransactionClick?.(transaction)}
                className={`grid ${bulkEditEnabled ? 'grid-cols-13' : 'grid-cols-12'} gap-2 px-4 py-1.5 items-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors animate-bounce-hover ${
                  onTransactionClick || bulkEditEnabled ? 'cursor-pointer' : ''
                } ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
              >
                {/* Checkbox */}
                {bulkEditEnabled && (
                  <div className="col-span-1 flex items-center">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => handleToggleSelect(transaction.id)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-4 h-4 rounded border-gray-300 dark:border-slate-500 text-primary-600 focus:ring-primary-500 cursor-pointer"
                    />
                  </div>
                )}

                {/* Date */}
                <div className="col-span-2 text-xs text-gray-500 dark:text-gray-400">
                  {formatDateCondensed(transaction.date)}
                </div>

                {/* Description */}
                <div className={`${bulkEditEnabled ? 'col-span-4' : 'col-span-4'} flex items-center gap-2`}>
                  <span className="text-sm text-gray-900 dark:text-white truncate">
                    {toTitleCase(transaction.description)}
                  </span>
                  <div className="flex items-center gap-1">
                    {transaction.id === largestExpenseId && (
                      <Badge type="largest-expense" showLabel={false} />
                    )}
                    {transaction.id === largestIncomeId && (
                      <Badge type="largest-income" showLabel={false} />
                    )}
                    <TransactionBadges
                      transaction={transaction}
                      showLabels={false}
                    />
                  </div>
                </div>

                {/* Category */}
                <div className="col-span-3">
                  {transaction.categoryId ? (
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-5 h-5 rounded flex items-center justify-center text-xs"
                        style={{ backgroundColor: `${categoryColor}20` }}
                      >
                        {categoryIcon}
                      </span>
                      <span className="text-xs text-gray-600 dark:text-gray-400 truncate">{categoryName}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 dark:text-gray-500">—</span>
                  )}
                </div>

                {/* Amount */}
                <div
                  className={`col-span-2 text-right text-sm font-medium ${
                    transaction.amount >= 0 ? 'text-success-600 dark:text-success-400' : 'text-gray-900 dark:text-white'
                  }`}
                >
                  {formatAmount(transaction.amount)}
                </div>

                {/* Info Icon */}
                <div className="col-span-1 flex justify-end">
                  <InfoTooltip content={tooltipContent} />
                </div>

                {/* Debug Info Row (condensed) */}
                {debugMode && (
                  <div className="col-span-full mt-1 pl-2 border-l-2 border-gray-200 dark:border-slate-600">
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[10px] font-mono text-gray-400 dark:text-gray-500">
                      <span>id: {transaction.id}</span>
                      <span>cat: {transaction.categoryId || 'null'}</span>
                      <span>sub: {transaction.subcategoryId || 'null'}</span>
                      {transaction.badges.length > 0 && (
                        <span>badges: [{transaction.badges.map(b => b.type).join(', ')}]</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          }

          const isEditing = editingTransactionId === transaction.id;

          return (
            <div
              key={transaction.id}
              onClick={() => bulkEditEnabled ? handleToggleSelect(transaction.id) : onTransactionClick?.(transaction)}
              className={`group/row relative grid ${bulkEditEnabled ? 'grid-cols-13' : 'grid-cols-12'} gap-2 px-4 py-3 items-center hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors animate-bounce-hover ${
                onTransactionClick || bulkEditEnabled ? 'cursor-pointer' : ''
              } ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}
            >
              {/* Hover Preview Tooltip */}
              <HoverPreviewTooltip
                description={transaction.description}
                categoryName={categoryName}
                subcategoryName={subcategoryName}
                amount={transaction.amount}
                date={transaction.date}
              />

              {/* Checkbox */}
              {bulkEditEnabled && (
                <div className="col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleToggleSelect(transaction.id)}
                    onClick={(e) => e.stopPropagation()}
                    className="w-4 h-4 rounded border-gray-300 dark:border-slate-500 text-primary-600 focus:ring-primary-500 cursor-pointer"
                  />
                </div>
              )}

              {/* Date */}
              <div className="col-span-2 text-sm text-gray-600 dark:text-gray-400">
                {formatDate(transaction.date)}
              </div>

              {/* Description */}
              <div className={bulkEditEnabled ? 'col-span-3' : 'col-span-4'}>
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {toTitleCase(transaction.description)}
                </p>
                {/* Badges */}
                <div className="flex items-center gap-1 mt-1">
                  {transaction.id === largestExpenseId && (
                    <Badge type="largest-expense" showLabel={false} />
                  )}
                  {transaction.id === largestIncomeId && (
                    <Badge type="largest-income" showLabel={false} />
                  )}
                  <TransactionBadges
                    transaction={transaction}
                    showLabels={false}
                  />
                </div>
              </div>

              {/* Category - Double-click to edit */}
              <div
                className="col-span-3 relative"
                onDoubleClick={(e) => {
                  e.stopPropagation();
                  if (onCategoryChange) {
                    setEditingTransactionId(transaction.id);
                  }
                }}
                title={onCategoryChange ? 'Double-click to change category' : undefined}
              >
                {transaction.categoryId ? (
                  <div className={`flex items-center gap-2 ${onCategoryChange ? 'hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-md px-1 -mx-1 py-0.5 -my-0.5 cursor-pointer' : ''}`}>
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center text-sm"
                      style={{ backgroundColor: `${categoryColor}20` }}
                    >
                      {categoryIcon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {categoryName}
                      </p>
                      {subcategoryName && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{subcategoryName}</p>
                      )}
                    </div>
                    {onCategoryChange && (
                      <svg className="w-3 h-3 text-gray-400 opacity-0 group-hover/row:opacity-100 transition-opacity flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    )}
                  </div>
                ) : (
                  <span className={`text-sm text-gray-400 dark:text-gray-500 italic ${onCategoryChange ? 'hover:text-primary-600 dark:hover:text-primary-400 cursor-pointer' : ''}`}>
                    Uncategorized
                  </span>
                )}

                {/* Inline Category Dropdown */}
                {isEditing && onCategoryChange && (
                  <InlineCategoryDropdown
                    transactionId={transaction.id}
                    currentCategoryId={transaction.categoryId}
                    currentSubcategoryId={transaction.subcategoryId}
                    onSelect={onCategoryChange}
                    onClose={() => setEditingTransactionId(null)}
                  />
                )}
              </div>

              {/* Amount */}
              <div
                className={`col-span-2 text-right text-sm font-medium ${
                  transaction.amount >= 0 ? 'text-success-600 dark:text-success-400' : 'text-gray-900 dark:text-white'
                }`}
              >
                {formatAmount(transaction.amount)}
              </div>

              {/* Info Icon */}
              <div className="col-span-1 flex justify-end">
                <InfoTooltip content={tooltipContent} />
              </div>

              {/* Debug Info Row (expanded) */}
              {debugMode && (
                <div className="col-span-full mt-2 pl-2 border-l-2 border-gray-200 dark:border-slate-600">
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-gray-400 dark:text-gray-500">
                    <span>id: {transaction.id}</span>
                    <span>categoryId: {transaction.categoryId || 'null'}</span>
                    <span>subcategoryId: {transaction.subcategoryId || 'null'}</span>
                    <span>amount: {transaction.amount}</span>
                    <span>date: {transaction.date.toISOString()}</span>
                    {transaction.isSubscription && <span className="text-primary-500">isSubscription: true</span>}
                    {transaction.badges.length > 0 && (
                      <span>badges: [{transaction.badges.map(b => b.type).join(', ')}]</span>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(0)}
              disabled={currentPage === 0}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="First page"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 0}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>

          {/* Page Numbers */}
          <div className="flex items-center gap-1">
            {(() => {
              const pages: (number | 'ellipsis')[] = [];
              const maxVisible = 5;

              if (totalPages <= maxVisible + 2) {
                // Show all pages if few enough
                for (let i = 0; i < totalPages; i++) pages.push(i);
              } else {
                // Always show first page
                pages.push(0);

                // Calculate range around current page
                let start = Math.max(1, currentPage - 1);
                let end = Math.min(totalPages - 2, currentPage + 1);

                // Adjust range to show at least 3 pages in the middle
                if (currentPage < 3) {
                  end = Math.min(totalPages - 2, 3);
                } else if (currentPage > totalPages - 4) {
                  start = Math.max(1, totalPages - 4);
                }

                // Add ellipsis or page after first
                if (start > 1) {
                  pages.push('ellipsis');
                }

                // Add middle pages
                for (let i = start; i <= end; i++) {
                  pages.push(i);
                }

                // Add ellipsis or page before last
                if (end < totalPages - 2) {
                  pages.push('ellipsis');
                }

                // Always show last page
                pages.push(totalPages - 1);
              }

              return pages.map((page, idx) => {
                if (page === 'ellipsis') {
                  return (
                    <span key={`ellipsis-${idx}`} className="px-2 text-gray-400 dark:text-gray-500">
                      ...
                    </span>
                  );
                }
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`min-w-[32px] h-8 px-2 rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
                    }`}
                  >
                    {page + 1}
                  </button>
                );
              });
            })()}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              onClick={() => handlePageChange(totalPages - 1)}
              disabled={currentPage === totalPages - 1}
              className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Last page"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

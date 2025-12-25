import { useState, useMemo, useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { Transaction, TransactionSortField, SortDirection } from '../types/transaction';
import { getCategoryName, getSubcategoryName, getCategoryColor, getCategoryIcon } from '../utils/category-service';
import { TransactionBadges } from './ui/Badge';
import { toTitleCase } from '../utils/text-utils';
import { TransactionsEmptyState } from './ui/EmptyState';

interface VirtualizedTransactionListProps {
  transactions: Transaction[];
  onTransactionClick?: (transaction: Transaction) => void;
  bulkEditEnabled?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onBulkCategorize?: () => void;
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

// Row height constants
const ROW_HEIGHT_CONDENSED = 40;
const ROW_HEIGHT_EXPANDED = 64;

export function VirtualizedTransactionList({
  transactions,
  onTransactionClick,
  bulkEditEnabled = false,
  selectedIds = new Set(),
  onSelectionChange,
  onBulkCategorize,
}: VirtualizedTransactionListProps) {
  const [sort, setSort] = useState<SortState>({ field: 'date', direction: 'desc' });
  const [isCondensed, setIsCondensed] = useState(false);
  const [isSorting, setIsSorting] = useState(false);
  const parentRef = useRef<HTMLDivElement>(null);

  const rowHeight = isCondensed ? ROW_HEIGHT_CONDENSED : ROW_HEIGHT_EXPANDED;

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

  // Virtual list configuration
  const virtualizer = useVirtualizer({
    count: sortedTransactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 10, // Render 10 extra items above/below viewport
  });

  const handleSort = useCallback((field: TransactionSortField) => {
    if (transactions.length > 500) {
      setIsSorting(true);
      requestAnimationFrame(() => {
        setSort((prev) => ({
          field,
          direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
        }));
        requestAnimationFrame(() => setIsSorting(false));
      });
    } else {
      setSort((prev) => ({
        field,
        direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
      }));
    }
  }, [transactions.length]);

  // Bulk selection handlers
  const handleToggleSelect = useCallback((transactionId: string) => {
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedIds);
    if (newSelected.has(transactionId)) {
      newSelected.delete(transactionId);
    } else {
      newSelected.add(transactionId);
    }
    onSelectionChange(newSelected);
  }, [selectedIds, onSelectionChange]);

  const handleSelectAll = useCallback(() => {
    if (!onSelectionChange) return;
    const newSelected = new Set(selectedIds);
    sortedTransactions.forEach(t => newSelected.add(t.id));
    onSelectionChange(newSelected);
  }, [selectedIds, sortedTransactions, onSelectionChange]);

  const handleSelectNone = useCallback(() => {
    if (!onSelectionChange) return;
    onSelectionChange(new Set());
  }, [onSelectionChange]);

  const allSelected = sortedTransactions.length > 0 && sortedTransactions.every(t => selectedIds.has(t.id));

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
        <TransactionsEmptyState />
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

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
          {bulkEditEnabled && (
            <div className="flex items-center gap-2">
              <button
                onClick={allSelected ? handleSelectNone : handleSelectAll}
                className="flex items-center gap-1.5 px-2 py-1 text-xs rounded border border-gray-300 dark:border-slate-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => {}}
                  className="w-3.5 h-3.5 rounded border-gray-300 dark:border-slate-500 text-primary-600 focus:ring-primary-500 cursor-pointer"
                />
                <span className="text-gray-600 dark:text-gray-400">
                  {allSelected ? 'Deselect all' : 'Select all'}
                </span>
              </button>
              {selectedIds.size > 0 && (
                <button
                  onClick={handleSelectNone}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  Clear ({selectedIds.size})
                </button>
              )}
            </div>
          )}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {bulkEditEnabled && selectedIds.size > 0 ? (
              <span className="font-medium text-primary-600 dark:text-primary-400">
                {selectedIds.size} selected
              </span>
            ) : (
              <>{sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}</>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
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

      {/* Header */}
      <div className={`grid ${bulkEditEnabled ? 'grid-cols-13' : 'grid-cols-12'} gap-4 px-4 py-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700 text-sm font-medium text-gray-600 dark:text-gray-400`}>
        {bulkEditEnabled && <div className="col-span-1" />}
        <button
          onClick={() => handleSort('date')}
          className="col-span-2 flex items-center text-left hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <SortIcon field="date" currentSort={sort} />
          <span className="ml-1">Date</span>
        </button>
        <button
          onClick={() => handleSort('description')}
          className={`${bulkEditEnabled ? 'col-span-4' : 'col-span-5'} flex items-center text-left hover:text-gray-900 dark:hover:text-white transition-colors`}
        >
          <SortIcon field="description" currentSort={sort} />
          <span className="ml-1">Description</span>
        </button>
        <button
          onClick={() => handleSort('category')}
          className="col-span-3 flex items-center text-left hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <SortIcon field="category" currentSort={sort} />
          <span className="ml-1">Category</span>
        </button>
        <button
          onClick={() => handleSort('amount')}
          className="col-span-2 flex items-center justify-end hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <span className="mr-1">Amount</span>
          <SortIcon field="amount" currentSort={sort} />
        </button>
      </div>

      {/* Virtualized Transaction List */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: `min(${sortedTransactions.length * rowHeight}px, 600px)` }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {virtualItems.map((virtualItem) => {
            const transaction = sortedTransactions[virtualItem.index];
            const categoryColor = getCategoryColor(transaction.categoryId);
            const categoryIcon = getCategoryIcon(transaction.categoryId);
            const categoryName = getCategoryName(transaction.categoryId);
            const subcategoryName = getSubcategoryName(
              transaction.categoryId,
              transaction.subcategoryId
            );
            const tooltipContent = `${formatDate(transaction.date)} | ${transaction.description} | ${categoryName || 'Uncategorized'}${subcategoryName ? ` > ${subcategoryName}` : ''} | ${formatAmount(transaction.amount)}`;
            const isSelected = selectedIds.has(transaction.id);

            return (
              <div
                key={transaction.id}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <div
                  onClick={() => bulkEditEnabled ? handleToggleSelect(transaction.id) : onTransactionClick?.(transaction)}
                  className={`grid ${bulkEditEnabled ? 'grid-cols-13' : 'grid-cols-12'} gap-2 px-4 items-center h-full hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border-b border-gray-100 dark:border-slate-700 ${
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
                  <div className="col-span-2 text-sm text-gray-600 dark:text-gray-400">
                    {isCondensed ? formatDateCondensed(transaction.date) : formatDate(transaction.date)}
                  </div>

                  {/* Description */}
                  <div className={`${bulkEditEnabled ? 'col-span-4' : 'col-span-5'} flex items-center gap-2`}>
                    <span className="text-sm text-gray-900 dark:text-white truncate">
                      {toTitleCase(transaction.description)}
                    </span>
                    <TransactionBadges
                      transaction={transaction}
                      showLabels={!isCondensed}
                    />
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
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Stats Footer */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700">
        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center justify-between">
          <span>Showing {sortedTransactions.length} transactions (virtualized)</span>
          <span>Scroll to view more</span>
        </div>
      </div>
    </div>
  );
}

import { useState, useMemo } from 'react';
import type { Transaction, TransactionSortField, SortDirection } from '../types/transaction';
import { getCategoryName, getSubcategoryName, getCategoryColor, getCategoryIcon } from '../utils/category-service';

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionClick?: (transaction: Transaction) => void;
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
    <span className={`inline-flex flex-col ml-1 ${isActive ? 'text-primary-600' : 'text-gray-400'}`}>
      <svg
        className={`w-3 h-3 -mb-1 ${isActive && currentSort.direction === 'asc' ? 'text-primary-600' : ''}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M5 10l5-5 5 5H5z" />
      </svg>
      <svg
        className={`w-3 h-3 ${isActive && currentSort.direction === 'desc' ? 'text-primary-600' : ''}`}
        fill="currentColor"
        viewBox="0 0 20 20"
      >
        <path d="M5 10l5 5 5-5H5z" />
      </svg>
    </span>
  );
}

function TooltipContent({ content }: { content: string }) {
  return (
    <div className="absolute z-50 hidden group-hover:block bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 text-xs text-white bg-gray-900 rounded-lg shadow-lg whitespace-nowrap pointer-events-none">
      {content}
      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
        <div className="border-4 border-transparent border-t-gray-900" />
      </div>
    </div>
  );
}

export function TransactionList({ transactions, onTransactionClick }: TransactionListProps) {
  const [sort, setSort] = useState<SortState>({ field: 'date', direction: 'desc' });
  const [isCondensed, setIsCondensed] = useState(false);

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
          const catA = getCategoryName(a.categoryId) || 'zzz';
          const catB = getCategoryName(b.categoryId) || 'zzz';
          comparison = catA.localeCompare(catB, 'sv-SE');
          break;
        case 'description':
          comparison = a.description.localeCompare(b.description, 'sv-SE');
          break;
      }

      return sort.direction === 'asc' ? comparison : -comparison;
    });
  }, [transactions, sort]);

  const handleSort = (field: TransactionSortField) => {
    setSort((prev) => ({
      field,
      direction: prev.field === field && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  if (transactions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p>No transactions to display</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <div className="text-sm text-gray-600">
          {sortedTransactions.length} transaction{sortedTransactions.length !== 1 ? 's' : ''}
        </div>
        <button
          onClick={() => setIsCondensed(!isCondensed)}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border transition-colors ${
            isCondensed
              ? 'border-primary-300 bg-primary-50 text-primary-700'
              : 'border-gray-200 text-gray-600 hover:bg-gray-100'
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

      {/* Header */}
      <div className={`grid ${isCondensed ? 'grid-cols-12' : 'grid-cols-12'} gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600`}>
        <button
          onClick={() => handleSort('date')}
          className={`${isCondensed ? 'col-span-2' : 'col-span-2'} flex items-center text-left hover:text-gray-900 transition-colors`}
        >
          <SortIcon field="date" currentSort={sort} />
          <span className="ml-1">Date</span>
        </button>
        <button
          onClick={() => handleSort('description')}
          className={`${isCondensed ? 'col-span-5' : 'col-span-4'} flex items-center text-left hover:text-gray-900 transition-colors`}
        >
          <SortIcon field="description" currentSort={sort} />
          <span className="ml-1">Description</span>
        </button>
        <button
          onClick={() => handleSort('category')}
          className={`${isCondensed ? 'col-span-3' : 'col-span-3'} flex items-center text-left hover:text-gray-900 transition-colors`}
        >
          <SortIcon field="category" currentSort={sort} />
          <span className="ml-1">Category</span>
        </button>
        <button
          onClick={() => handleSort('amount')}
          className={`${isCondensed ? 'col-span-2' : 'col-span-3'} flex items-center justify-end hover:text-gray-900 transition-colors`}
        >
          <span className="mr-1">Amount</span>
          <SortIcon field="amount" currentSort={sort} />
        </button>
      </div>

      {/* Transactions */}
      <div className="divide-y divide-gray-100">
        {sortedTransactions.map((transaction) => {
          const categoryColor = getCategoryColor(transaction.categoryId);
          const categoryIcon = getCategoryIcon(transaction.categoryId);
          const categoryName = getCategoryName(transaction.categoryId);
          const subcategoryName = getSubcategoryName(
            transaction.categoryId,
            transaction.subcategoryId
          );

          const tooltipContent = `${formatDate(transaction.date)} | ${transaction.description} | ${categoryName || 'Uncategorized'}${subcategoryName ? ` > ${subcategoryName}` : ''} | ${formatAmount(transaction.amount)}`;

          if (isCondensed) {
            return (
              <div
                key={transaction.id}
                onClick={() => onTransactionClick?.(transaction)}
                className={`group relative grid grid-cols-12 gap-4 px-4 py-1.5 items-center hover:bg-gray-50 transition-colors ${
                  onTransactionClick ? 'cursor-pointer' : ''
                }`}
              >
                <TooltipContent content={tooltipContent} />
                {/* Date */}
                <div className="col-span-2 text-xs text-gray-500">
                  {formatDateCondensed(transaction.date)}
                </div>

                {/* Description */}
                <div className="col-span-5 text-sm text-gray-900 truncate">
                  {transaction.description}
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
                      <span className="text-xs text-gray-600 truncate">{categoryName}</span>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">—</span>
                  )}
                </div>

                {/* Amount */}
                <div
                  className={`col-span-2 text-right text-sm font-medium ${
                    transaction.amount >= 0 ? 'text-success-600' : 'text-gray-900'
                  }`}
                >
                  {formatAmount(transaction.amount)}
                </div>
              </div>
            );
          }

          return (
            <div
              key={transaction.id}
              onClick={() => onTransactionClick?.(transaction)}
              className={`group relative grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50 transition-colors ${
                onTransactionClick ? 'cursor-pointer' : ''
              }`}
            >
              <TooltipContent content={tooltipContent} />
              {/* Date */}
              <div className="col-span-2 text-sm text-gray-600">
                {formatDate(transaction.date)}
              </div>

              {/* Description */}
              <div className="col-span-4">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {transaction.description}
                </p>
                {/* Badges */}
                {transaction.badges.length > 0 && (
                  <div className="flex gap-1 mt-1">
                    {transaction.badges.map((badge) => (
                      <span
                        key={badge.type}
                        className={`px-1.5 py-0.5 text-xs rounded-full ${
                          badge.type === 'income'
                            ? 'bg-success-500/10 text-success-600'
                            : badge.type === 'uncategorized'
                            ? 'bg-warning-500/10 text-warning-600'
                            : badge.type === 'high_value'
                            ? 'bg-danger-500/10 text-danger-600'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {badge.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Category */}
              <div className="col-span-3">
                {transaction.categoryId ? (
                  <div className="flex items-center gap-2">
                    <span
                      className="w-6 h-6 rounded flex items-center justify-center text-sm"
                      style={{ backgroundColor: `${categoryColor}20` }}
                    >
                      {categoryIcon}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {categoryName}
                      </p>
                      {subcategoryName && (
                        <p className="text-xs text-gray-500 truncate">{subcategoryName}</p>
                      )}
                    </div>
                  </div>
                ) : (
                  <span className="text-sm text-gray-400 italic">Uncategorized</span>
                )}
              </div>

              {/* Amount */}
              <div
                className={`col-span-3 text-right text-sm font-medium ${
                  transaction.amount >= 0 ? 'text-success-600' : 'text-gray-900'
                }`}
              >
                {formatAmount(transaction.amount)}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

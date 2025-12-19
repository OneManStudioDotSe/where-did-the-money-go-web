import type { Transaction } from '../types/transaction';
import { getCategoryName, getSubcategoryName, getCategoryColor, getCategoryIcon } from '../utils/category-service';

interface TransactionListProps {
  transactions: Transaction[];
  onTransactionClick?: (transaction: Transaction) => void;
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

export function TransactionList({ transactions, onTransactionClick }: TransactionListProps) {
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
      {/* Header */}
      <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 text-sm font-medium text-gray-600">
        <div className="col-span-2">Date</div>
        <div className="col-span-4">Description</div>
        <div className="col-span-3">Category</div>
        <div className="col-span-3 text-right">Amount</div>
      </div>

      {/* Transactions */}
      <div className="divide-y divide-gray-100">
        {transactions.map((transaction) => {
          const categoryColor = getCategoryColor(transaction.categoryId);
          const categoryIcon = getCategoryIcon(transaction.categoryId);
          const categoryName = getCategoryName(transaction.categoryId);
          const subcategoryName = getSubcategoryName(
            transaction.categoryId,
            transaction.subcategoryId
          );

          return (
            <div
              key={transaction.id}
              onClick={() => onTransactionClick?.(transaction)}
              className={`grid grid-cols-12 gap-4 px-4 py-3 items-center hover:bg-gray-50 transition-colors ${
                onTransactionClick ? 'cursor-pointer' : ''
              }`}
            >
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

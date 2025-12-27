import { useMemo, useState } from 'react';
import type { Transaction } from '../types/transaction';
import { getCategoryColor, getCategoryIcon, getCategoryName, getSubcategoryName } from '../utils/category-service';
import { toTitleCase } from '../utils/text-utils';

interface LargestTransactionsProps {
  transactions: Transaction[];
  className?: string;
}

type TransactionType = 'expenses' | 'income' | 'all';

function formatAmount(amount: number): string {
  return Math.abs(amount).toLocaleString('sv-SE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('sv-SE', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function LargestTransactions({ transactions, className = '' }: LargestTransactionsProps) {
  const [transactionType, setTransactionType] = useState<TransactionType>('expenses');
  const [showCount, setShowCount] = useState(10);

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    switch (transactionType) {
      case 'expenses':
        filtered = filtered.filter(t => t.amount < 0);
        break;
      case 'income':
        filtered = filtered.filter(t => t.amount > 0);
        break;
    }

    // Sort by absolute amount descending
    filtered.sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount));

    return filtered;
  }, [transactions, transactionType]);

  const displayedTransactions = filteredTransactions.slice(0, showCount);
  const maxAmount = displayedTransactions.length > 0 ? Math.abs(displayedTransactions[0].amount) : 0;

  // Calculate statistics
  const stats = useMemo(() => {
    if (filteredTransactions.length === 0) {
      return { total: 0, average: 0, median: 0, top10Percent: 0 };
    }

    const amounts = filteredTransactions.map(t => Math.abs(t.amount));
    const total = amounts.reduce((sum, a) => sum + a, 0);
    const average = total / amounts.length;

    // Median
    const sorted = [...amounts].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    // Top 10% contribution
    const top10Count = Math.max(1, Math.ceil(filteredTransactions.length * 0.1));
    const top10Total = amounts.slice(0, top10Count).reduce((sum, a) => sum + a, 0);
    const top10Percent = (top10Total / total) * 100;

    return { total, average, median, top10Percent };
  }, [filteredTransactions]);

  if (transactions.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <p>No transaction data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Type Filter */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => setTransactionType('expenses')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            transactionType === 'expenses'
              ? 'bg-danger-100 dark:bg-danger-900/40 text-danger-700 dark:text-danger-300'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          Largest Expenses
        </button>
        <button
          onClick={() => setTransactionType('income')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            transactionType === 'income'
              ? 'bg-success-100 dark:bg-success-900/40 text-success-700 dark:text-success-300'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          Largest Income
        </button>
        <button
          onClick={() => setTransactionType('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            transactionType === 'all'
              ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          All
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total ({filteredTransactions.length})</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {formatAmount(stats.total)} kr
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Average</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {formatAmount(stats.average)} kr
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Median</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">
            {formatAmount(stats.median)} kr
          </p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Top 10% Share</p>
          <p className="text-sm font-bold text-amber-700 dark:text-amber-300">
            {stats.top10Percent.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Transactions List */}
      <div className="space-y-2">
        {displayedTransactions.map((transaction, index) => {
          const isExpense = transaction.amount < 0;
          const barWidth = maxAmount > 0 ? (Math.abs(transaction.amount) / maxAmount) * 100 : 0;
          const categoryColor = getCategoryColor(transaction.categoryId);
          const categoryIcon = getCategoryIcon(transaction.categoryId);
          const categoryName = getCategoryName(transaction.categoryId);
          const subcategoryName = getSubcategoryName(transaction.categoryId, transaction.subcategoryId);

          return (
            <div
              key={transaction.id}
              className="bg-gray-50 dark:bg-slate-700/50 rounded-lg overflow-hidden hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              {/* Progress bar background */}
              <div className="relative">
                <div
                  className={`absolute inset-y-0 left-0 ${
                    isExpense ? 'bg-danger-100 dark:bg-danger-900/20' : 'bg-success-100 dark:bg-success-900/20'
                  }`}
                  style={{ width: `${barWidth}%` }}
                />

                <div className="relative p-3 flex items-center gap-3">
                  {/* Rank */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${
                    index < 3
                      ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                      : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-300'
                  }`}>
                    <span className="text-xs font-bold">{index + 1}</span>
                  </div>

                  {/* Category Icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: `${categoryColor}20` }}
                  >
                    <span className="text-lg">{categoryIcon}</span>
                  </div>

                  {/* Transaction Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {toTitleCase(transaction.description)}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(transaction.date)}
                      </span>
                      {categoryName !== 'Uncategorized' && (
                        <>
                          <span className="text-gray-300 dark:text-gray-600">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {categoryName}
                            {subcategoryName && ` › ${subcategoryName}`}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-right flex-shrink-0">
                    <p className={`text-base font-bold ${
                      isExpense ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'
                    }`}>
                      {isExpense ? '-' : '+'}{formatAmount(transaction.amount)} kr
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      {((Math.abs(transaction.amount) / stats.total) * 100).toFixed(1)}% of total
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {showCount < filteredTransactions.length && (
        <button
          onClick={() => setShowCount(prev => prev + 10)}
          className="w-full mt-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          Show more ({filteredTransactions.length - showCount} remaining)
        </button>
      )}

      {/* Amount Distribution */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Amount Distribution
        </h4>
        <div className="space-y-2">
          {[
            { label: '< 100 kr', min: 0, max: 100 },
            { label: '100-500 kr', min: 100, max: 500 },
            { label: '500-1,000 kr', min: 500, max: 1000 },
            { label: '1,000-5,000 kr', min: 1000, max: 5000 },
            { label: '5,000-10,000 kr', min: 5000, max: 10000 },
            { label: '> 10,000 kr', min: 10000, max: Infinity },
          ].map(bucket => {
            const count = filteredTransactions.filter(t => {
              const amount = Math.abs(t.amount);
              return amount >= bucket.min && amount < bucket.max;
            }).length;
            const percentage = filteredTransactions.length > 0 ? (count / filteredTransactions.length) * 100 : 0;

            return (
              <div key={bucket.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-28">{bucket.label}</span>
                <div className="flex-1 h-4 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary-500 rounded-full transition-all"
                    style={{ width: `${percentage}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 w-12 text-right">
                  {count}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pareto Insight */}
      <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="flex items-start gap-2">
          <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Pareto Principle
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              Your top 10% of transactions ({Math.ceil(filteredTransactions.length * 0.1)} transactions)
              account for <strong>{stats.top10Percent.toFixed(0)}%</strong> of total {transactionType === 'income' ? 'income' : 'spending'}.
              {stats.top10Percent > 50 && ' Consider reviewing these large transactions for potential savings.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useMemo, useState } from 'react';
import type { Transaction } from '../types/transaction';
import { getCategoryColor, getCategoryIcon } from '../utils/category-service';
import { toTitleCase } from '../utils/text-utils';

interface MerchantFrequencyProps {
  transactions: Transaction[];
  className?: string;
}

type SortBy = 'visits' | 'amount' | 'average';

interface MerchantStats {
  name: string;
  normalizedName: string;
  visits: number;
  totalAmount: number;
  averageAmount: number;
  lastVisit: Date;
  categoryId: string | null;
}

function formatAmount(amount: number): string {
  return Math.abs(amount).toLocaleString('sv-SE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function normalizeDescription(description: string): string {
  // Remove common prefixes and suffixes, dates, card numbers
  let normalized = description
    .toUpperCase()
    .replace(/KORTKÖP\s*\d*/gi, '')
    .replace(/\d{6}/g, '') // Remove 6-digit dates like 241227
    .replace(/\s+/g, ' ')
    .trim();

  return normalized;
}

export function MerchantFrequency({ transactions, className = '' }: MerchantFrequencyProps) {
  const [sortBy, setSortBy] = useState<SortBy>('visits');
  const [showCount, setShowCount] = useState(10);

  const merchantStats = useMemo(() => {
    const expenses = transactions.filter(t => t.amount < 0);
    const merchantMap = new Map<string, MerchantStats>();

    expenses.forEach(t => {
      const normalizedName = normalizeDescription(t.description);
      const existing = merchantMap.get(normalizedName);

      if (existing) {
        existing.visits += 1;
        existing.totalAmount += Math.abs(t.amount);
        existing.averageAmount = existing.totalAmount / existing.visits;
        if (t.date > existing.lastVisit) {
          existing.lastVisit = t.date;
          existing.name = t.description; // Keep the most recent description format
        }
      } else {
        merchantMap.set(normalizedName, {
          name: t.description,
          normalizedName,
          visits: 1,
          totalAmount: Math.abs(t.amount),
          averageAmount: Math.abs(t.amount),
          lastVisit: t.date,
          categoryId: t.categoryId,
        });
      }
    });

    return Array.from(merchantMap.values());
  }, [transactions]);

  const sortedMerchants = useMemo(() => {
    const sorted = [...merchantStats];

    switch (sortBy) {
      case 'visits':
        sorted.sort((a, b) => b.visits - a.visits);
        break;
      case 'amount':
        sorted.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
      case 'average':
        sorted.sort((a, b) => b.averageAmount - a.averageAmount);
        break;
    }

    return sorted.slice(0, showCount);
  }, [merchantStats, sortBy, showCount]);

  const maxVisits = Math.max(...sortedMerchants.map(m => m.visits));
  const maxAmount = Math.max(...sortedMerchants.map(m => m.totalAmount));

  // Calculate stats
  const totalMerchants = merchantStats.length;
  const frequentMerchants = merchantStats.filter(m => m.visits >= 5).length;
  const oneTimeMerchants = merchantStats.filter(m => m.visits === 1).length;
  const mostFrequent = merchantStats.reduce((max, m) => m.visits > max.visits ? m : max, merchantStats[0]);

  if (transactions.length === 0 || merchantStats.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <p>No transaction data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total Merchants</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{totalMerchants}</p>
        </div>
        <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-3">
          <p className="text-xs text-primary-600 dark:text-primary-400 mb-1">Frequent (5+)</p>
          <p className="text-lg font-bold text-primary-700 dark:text-primary-300">{frequentMerchants}</p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">One-time</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{oneTimeMerchants}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3">
          <p className="text-xs text-amber-600 dark:text-amber-400 mb-1">Most Frequent</p>
          <p className="text-sm font-bold text-amber-700 dark:text-amber-300 truncate" title={mostFrequent?.name}>
            {mostFrequent?.visits || 0}x
          </p>
        </div>
      </div>

      {/* Sort Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          <button
            onClick={() => setSortBy('visits')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              sortBy === 'visits'
                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            By Visits
          </button>
          <button
            onClick={() => setSortBy('amount')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              sortBy === 'amount'
                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            By Total
          </button>
          <button
            onClick={() => setSortBy('average')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              sortBy === 'average'
                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            By Avg
          </button>
        </div>
        <select
          value={showCount}
          onChange={(e) => setShowCount(Number(e.target.value))}
          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-700 dark:text-gray-300"
        >
          <option value={10}>Top 10</option>
          <option value={20}>Top 20</option>
          <option value={50}>Top 50</option>
        </select>
      </div>

      {/* Merchant List */}
      <div className="space-y-2">
        {sortedMerchants.map((merchant, index) => {
          const visitBarWidth = (merchant.visits / maxVisits) * 100;
          const amountBarWidth = (merchant.totalAmount / maxAmount) * 100;
          const categoryColor = getCategoryColor(merchant.categoryId);
          const categoryIcon = getCategoryIcon(merchant.categoryId);

          return (
            <div
              key={merchant.normalizedName}
              className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <div className="flex items-start gap-3">
                {/* Rank */}
                <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-slate-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-gray-600 dark:text-gray-300">
                    {index + 1}
                  </span>
                </div>

                {/* Category Icon */}
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${categoryColor}20` }}
                >
                  <span className="text-sm">{categoryIcon}</span>
                </div>

                {/* Merchant Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                    {toTitleCase(merchant.name)}
                  </p>
                  <div className="flex items-center gap-4 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {merchant.visits} visits
                    </span>
                    <span>~{formatAmount(merchant.averageAmount)} kr/visit</span>
                  </div>

                  {/* Progress bars */}
                  <div className="mt-2 space-y-1">
                    {sortBy === 'visits' && (
                      <div className="h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary-500 rounded-full"
                          style={{ width: `${visitBarWidth}%` }}
                        />
                      </div>
                    )}
                    {sortBy !== 'visits' && (
                      <div className="h-1.5 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-danger-500 rounded-full"
                          style={{ width: `${amountBarWidth}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {/* Total Amount */}
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white">
                    {formatAmount(merchant.totalAmount)} kr
                  </p>
                  <p className="text-[10px] text-gray-400 dark:text-gray-500">
                    {merchant.lastVisit.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Load More */}
      {showCount < merchantStats.length && (
        <button
          onClick={() => setShowCount(prev => Math.min(prev + 10, merchantStats.length))}
          className="w-full mt-4 py-2 text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
        >
          Show more ({merchantStats.length - showCount} remaining)
        </button>
      )}

      {/* Frequency Distribution */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-slate-700">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Visit Frequency Distribution
        </h4>
        <div className="grid grid-cols-5 gap-2">
          {[
            { label: '1x', count: merchantStats.filter(m => m.visits === 1).length },
            { label: '2-4x', count: merchantStats.filter(m => m.visits >= 2 && m.visits <= 4).length },
            { label: '5-9x', count: merchantStats.filter(m => m.visits >= 5 && m.visits <= 9).length },
            { label: '10-19x', count: merchantStats.filter(m => m.visits >= 10 && m.visits <= 19).length },
            { label: '20+', count: merchantStats.filter(m => m.visits >= 20).length },
          ].map(bucket => {
            const percentage = (bucket.count / totalMerchants) * 100;
            return (
              <div key={bucket.label} className="text-center">
                <div className="h-16 flex items-end justify-center mb-1">
                  <div
                    className="w-8 bg-primary-400 dark:bg-primary-500 rounded-t transition-all"
                    style={{ height: `${Math.max(percentage, 4)}%` }}
                  />
                </div>
                <p className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{bucket.label}</p>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{bucket.count}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

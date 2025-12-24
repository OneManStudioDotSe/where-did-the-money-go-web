import { useMemo, useState } from 'react';
import type { Transaction } from '../types/transaction';
import { MerchantsEmptyState } from './ui/EmptyState';

interface TopMerchantsProps {
  transactions: Transaction[];
  maxMerchants?: number;
}

interface MerchantData {
  name: string;
  totalSpent: number;
  transactionCount: number;
  averageAmount: number;
  lastTransaction: Date;
}

/**
 * Normalizes a merchant name by cleaning up common patterns from bank descriptions
 */
function normalizeMerchantName(description: string): string {
  // Remove common prefixes
  let normalized = description
    .replace(/^(KORTKÖP|RESERVATION|AUTOGIRO|ÖVERFÖRING|SWISH|E-HANDELSKÖP|UTLANDSBETALNING)\s+/i, '')
    .replace(/^(Kortköp|Kort köp|Betalning|Inköp)\s+/i, '');

  // Remove date patterns like /25-12-18 or 2025-12-18
  normalized = normalized.replace(/\s*\/?\d{2,4}-?\d{2}-?\d{2}\s*/g, ' ');

  // Remove card number fragments like *1234
  normalized = normalized.replace(/\s*\*\d{4}\s*/g, ' ');

  // Remove transaction reference numbers
  normalized = normalized.replace(/\s+\d{10,}\s*/g, ' ');

  // Remove trailing location codes like SE, SWE, SWEDEN
  normalized = normalized.replace(/\s+(SE|SWE|SWEDEN|Stockholm|Malmö|Göteborg)$/i, '');

  // Clean up extra whitespace
  normalized = normalized.trim().replace(/\s+/g, ' ');

  // Capitalize properly
  if (normalized.length > 0) {
    normalized = normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase();
  }

  return normalized || description;
}

/**
 * Groups similar merchant names together
 */
function groupSimilarMerchants(merchants: Map<string, MerchantData>): Map<string, MerchantData> {
  const grouped = new Map<string, MerchantData>();

  merchants.forEach((data, name) => {
    // Check if this merchant is similar to an existing one
    let foundMatch = false;

    grouped.forEach((existingData, existingName) => {
      // Check if names are similar (one contains the other, or share significant prefix)
      const nameLower = name.toLowerCase();
      const existingLower = existingName.toLowerCase();

      if (
        nameLower.includes(existingLower) ||
        existingLower.includes(nameLower) ||
        (nameLower.substring(0, 8) === existingLower.substring(0, 8) && nameLower.length >= 8)
      ) {
        // Merge into existing
        existingData.totalSpent += data.totalSpent;
        existingData.transactionCount += data.transactionCount;
        existingData.averageAmount = existingData.totalSpent / existingData.transactionCount;
        if (data.lastTransaction > existingData.lastTransaction) {
          existingData.lastTransaction = data.lastTransaction;
        }
        foundMatch = true;
      }
    });

    if (!foundMatch) {
      grouped.set(name, { ...data });
    }
  });

  return grouped;
}

function formatAmount(amount: number): string {
  return Math.abs(amount).toLocaleString('sv-SE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('sv-SE', {
    month: 'short',
    day: 'numeric',
  });
}

export function TopMerchants({ transactions, maxMerchants = 10 }: TopMerchantsProps) {
  const [sortBy, setSortBy] = useState<'amount' | 'count'>('amount');
  const [showAll, setShowAll] = useState(false);

  const merchantData = useMemo(() => {
    // Only analyze expenses (negative amounts)
    const expenses = transactions.filter((t) => t.amount < 0);

    if (expenses.length === 0) return [];

    const merchantMap = new Map<string, MerchantData>();

    expenses.forEach((t) => {
      const merchantName = normalizeMerchantName(t.description);

      // Skip generic descriptions
      if (
        merchantName.length < 3 ||
        /^\d+$/.test(merchantName) ||
        merchantName.toLowerCase() === 'other' ||
        merchantName.toLowerCase() === 'övrigt'
      ) {
        return;
      }

      const existing = merchantMap.get(merchantName);
      const amount = Math.abs(t.amount);

      if (existing) {
        existing.totalSpent += amount;
        existing.transactionCount += 1;
        existing.averageAmount = existing.totalSpent / existing.transactionCount;
        if (t.date > existing.lastTransaction) {
          existing.lastTransaction = t.date;
        }
      } else {
        merchantMap.set(merchantName, {
          name: merchantName,
          totalSpent: amount,
          transactionCount: 1,
          averageAmount: amount,
          lastTransaction: t.date,
        });
      }
    });

    // Group similar merchants
    const grouped = groupSimilarMerchants(merchantMap);

    // Convert to array and sort
    const merchants = Array.from(grouped.values());

    // Filter out merchants with only 1 transaction (likely one-off purchases)
    const significantMerchants = merchants.filter((m) => m.transactionCount >= 1);

    return significantMerchants;
  }, [transactions]);

  const sortedMerchants = useMemo(() => {
    const sorted = [...merchantData];
    if (sortBy === 'amount') {
      sorted.sort((a, b) => b.totalSpent - a.totalSpent);
    } else {
      sorted.sort((a, b) => b.transactionCount - a.transactionCount);
    }
    return sorted;
  }, [merchantData, sortBy]);

  const displayedMerchants = showAll ? sortedMerchants : sortedMerchants.slice(0, maxMerchants);
  const totalSpent = merchantData.reduce((sum, m) => sum + m.totalSpent, 0);

  if (merchantData.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <MerchantsEmptyState />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h3 className="font-medium text-gray-900 dark:text-white">Top Merchants</h3>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              ({merchantData.length} merchants)
            </span>
          </div>

          {/* Sort Toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden text-xs">
            <button
              onClick={() => setSortBy('amount')}
              className={`px-2 py-1 transition-colors ${
                sortBy === 'amount'
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              By amount
            </button>
            <button
              onClick={() => setSortBy('count')}
              className={`px-2 py-1 transition-colors border-l border-gray-200 dark:border-slate-600 ${
                sortBy === 'count'
                  ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                  : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              By visits
            </button>
          </div>
        </div>
      </div>

      {/* Merchants List */}
      <div className="p-4">
        <div className="space-y-2">
          {displayedMerchants.map((merchant, index) => {
            const percentage = totalSpent > 0 ? (merchant.totalSpent / totalSpent) * 100 : 0;
            const barWidth = Math.max(percentage, 2); // Minimum 2% width for visibility

            return (
              <div key={merchant.name} className="group">
                <div className="flex items-center gap-3">
                  {/* Rank */}
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                    index < 3
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400'
                  }`}>
                    {index + 1}
                  </span>

                  {/* Name & Stats */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {merchant.name}
                      </span>
                      <span className="text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                        {formatAmount(merchant.totalSpent)} kr
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary-500 dark:bg-primary-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    {/* Sub-stats */}
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                      <span>{merchant.transactionCount} {merchant.transactionCount === 1 ? 'transaction' : 'transactions'}</span>
                      <span>•</span>
                      <span>Avg {formatAmount(merchant.averageAmount)} kr</span>
                      <span>•</span>
                      <span>Last: {formatDate(merchant.lastTransaction)}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Show More/Less Button */}
        {sortedMerchants.length > maxMerchants && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full mt-4 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 transition-colors"
          >
            {showAll ? `Show less` : `Show all ${sortedMerchants.length} merchants`}
          </button>
        )}

        {/* Summary */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total merchants</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{merchantData.length}</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Total spent</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{formatAmount(totalSpent)} kr</p>
            </div>
            <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Avg per merchant</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">
                {formatAmount(merchantData.length > 0 ? totalSpent / merchantData.length : 0)} kr
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

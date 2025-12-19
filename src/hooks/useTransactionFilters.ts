import { useMemo } from 'react';
import type { Transaction, TransactionFilters } from '../types/transaction';

/**
 * Filters transactions based on the provided filter criteria
 */
export function filterTransactions(
  transactions: Transaction[],
  filters: TransactionFilters
): Transaction[] {
  return transactions.filter((transaction) => {
    // Search query filter (matches description)
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      const matchesSearch = transaction.description.toLowerCase().includes(query);
      if (!matchesSearch) return false;
    }

    // Category filter
    if (filters.categoryIds.length > 0) {
      if (!transaction.categoryId || !filters.categoryIds.includes(transaction.categoryId)) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange.start) {
      const startDate = new Date(filters.dateRange.start);
      startDate.setHours(0, 0, 0, 0);
      if (transaction.date < startDate) return false;
    }
    if (filters.dateRange.end) {
      const endDate = new Date(filters.dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      if (transaction.date > endDate) return false;
    }

    // Amount range filter (uses absolute value for filtering)
    const absAmount = Math.abs(transaction.amount);
    if (filters.amountRange.min !== null && absAmount < filters.amountRange.min) {
      return false;
    }
    if (filters.amountRange.max !== null && absAmount > filters.amountRange.max) {
      return false;
    }

    // Uncategorized filter
    if (filters.showOnlyUncategorized && transaction.categoryId !== null) {
      return false;
    }

    // Subscriptions filter
    if (filters.showOnlySubscriptions && !transaction.isSubscription) {
      return false;
    }

    return true;
  });
}

/**
 * Hook that returns filtered transactions based on current filters
 */
export function useTransactionFilters(
  transactions: Transaction[],
  filters: TransactionFilters
): {
  filteredTransactions: Transaction[];
  totalCount: number;
  filteredCount: number;
} {
  const filteredTransactions = useMemo(
    () => filterTransactions(transactions, filters),
    [transactions, filters]
  );

  return {
    filteredTransactions,
    totalCount: transactions.length,
    filteredCount: filteredTransactions.length,
  };
}

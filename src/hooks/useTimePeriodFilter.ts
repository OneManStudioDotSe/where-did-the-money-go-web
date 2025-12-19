import { useMemo } from 'react';
import type { Transaction } from '../types/transaction';

interface TimePeriod {
  type: 'day' | 'week' | 'month' | 'quarter' | 'year';
  start: Date;
  end: Date;
  label: string;
  shortLabel: string;
}

/**
 * Filters transactions based on the selected time period
 */
export function filterByTimePeriod(
  transactions: Transaction[],
  period: TimePeriod | null
): Transaction[] {
  if (!period) return transactions;

  return transactions.filter((transaction) => {
    const txDate = transaction.date;
    return txDate >= period.start && txDate <= period.end;
  });
}

/**
 * Hook that returns transactions filtered by time period
 */
export function useTimePeriodFilter(
  transactions: Transaction[],
  period: TimePeriod | null
): {
  periodFilteredTransactions: Transaction[];
  periodStats: {
    totalExpenses: number;
    totalIncome: number;
    netChange: number;
    transactionCount: number;
  };
} {
  const periodFilteredTransactions = useMemo(
    () => filterByTimePeriod(transactions, period),
    [transactions, period]
  );

  const periodStats = useMemo(() => {
    const expenses = periodFilteredTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const income = periodFilteredTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalExpenses: expenses,
      totalIncome: income,
      netChange: income - expenses,
      transactionCount: periodFilteredTransactions.length,
    };
  }, [periodFilteredTransactions]);

  return {
    periodFilteredTransactions,
    periodStats,
  };
}

export type { TimePeriod };

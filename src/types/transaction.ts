/**
 * Represents a single bank transaction
 */
export interface Transaction {
  /** Unique identifier (generated from row data) */
  id: string;
  /** Booking date - when the transaction was recorded */
  date: Date;
  /** Value date - when the money was actually transferred */
  valueDate: Date;
  /** Transaction amount: negative = expense, positive = income */
  amount: number;
  /** Original description from bank */
  description: string;
  /** Assigned category ID, null if uncategorized */
  categoryId: string | null;
  /** Assigned subcategory ID, null if uncategorized */
  subcategoryId: string | null;
  /** Whether this transaction is detected as a recurring subscription */
  isSubscription: boolean;
  /** Balance after this transaction */
  balance: number;
  /** Original verification/transaction number from bank */
  verificationNumber: string;
  /** Visual indicator badges */
  badges: TransactionBadge[];
  /** Original CSV row data for reference */
  rawData: Record<string, string>;
}

/**
 * Badge types for visual indicators on transactions
 */
export type TransactionBadgeType =
  | 'uncategorized'  // Needs manual categorization
  | 'subscription'   // Recurring payment
  | 'high_value'     // Above threshold amount
  | 'refund'         // Money returned
  | 'income';        // Positive amount

export interface TransactionBadge {
  type: TransactionBadgeType;
  label: string;
}

/**
 * Parsed CSV row before normalization
 */
export interface RawTransaction {
  bookingDate: string;
  valueDate: string;
  verificationNumber: string;
  text: string;
  amount: string;
  balance: string;
}

/**
 * Grouping options for transactions
 */
export type TransactionGrouping = 'day' | 'week' | 'month' | 'quarter' | 'year';

/**
 * Sort options for transaction lists
 */
export type TransactionSortField = 'date' | 'amount' | 'category' | 'description';
export type SortDirection = 'asc' | 'desc';

export interface TransactionSort {
  field: TransactionSortField;
  direction: SortDirection;
}

/**
 * Filter criteria for transactions
 */
export interface TransactionFilters {
  categoryIds: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  amountRange: {
    min: number | null;
    max: number | null;
  };
  searchQuery: string;
  showOnlyUncategorized: boolean;
  showOnlySubscriptions: boolean;
}

/**
 * Summary statistics for a set of transactions
 */
export interface TransactionSummary {
  totalExpenses: number;
  totalIncome: number;
  netAmount: number;
  transactionCount: number;
  averageExpense: number;
  largestExpense: Transaction | null;
  uncategorizedCount: number;
}

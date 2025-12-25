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
 * Type of recurring payment
 */
export type RecurringType =
  | 'subscription'      // Cancellable services (Netflix, Spotify, gym)
  | 'recurring_expense' // Regular recurring expenses
  | 'fixed_expense';    // Fixed expenses (loan, rent, insurance)

/**
 * Billing frequency for subscriptions
 */
export type BillingFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';

/**
 * Confidence level for detected subscriptions
 */
export type ConfidenceLevel = 'high' | 'medium' | 'low';

/**
 * Amount type for subscriptions
 */
export type AmountType = 'fixed' | 'variable';

/**
 * Breakdown of confidence score components
 */
export interface ConfidenceScoreBreakdown {
  /** Amount consistency score (0-30) */
  amountScore: number;
  /** Timing consistency score (0-30) */
  timingScore: number;
  /** Occurrence count score (0-20) */
  occurrenceScore: number;
  /** Pattern clarity score (0-20) */
  clarityScore: number;
}

/**
 * Badge types for visual indicators on transactions
 */
export type TransactionBadgeType =
  | 'uncategorized'      // Needs manual categorization
  | 'subscription'       // Cancellable recurring service
  | 'recurring_expense'  // Regular recurring expense
  | 'fixed_expense'      // Fixed expense (loan, rent, insurance)
  | 'high_value'         // Above threshold amount
  | 'refund'             // Money returned
  | 'income';            // Positive amount

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

/**
 * Detected subscription pattern from transaction analysis
 */
export interface DetectedSubscription {
  /** Unique identifier for this subscription */
  id: string;
  /** Normalized recipient name (from description) */
  recipientName: string;
  /** Average amount charged */
  averageAmount: number;
  /** Minimum amount charged */
  minAmount: number;
  /** Maximum amount charged */
  maxAmount: number;
  /** Most common day of month the payment occurs */
  commonDayOfMonth: number;
  /** Transaction IDs that belong to this subscription */
  transactionIds: string[];
  /** Number of occurrences found */
  occurrenceCount: number;
  /** Whether the user confirmed this as a recurring payment */
  isConfirmed: boolean | null;
  /** Type of recurring payment (subscription or recurring expense) */
  recurringType: RecurringType | null;
  /** Category ID if all transactions share the same category */
  categoryId: string | null;
  /** Subcategory ID if all transactions share the same subcategory */
  subcategoryId: string | null;
  /** First occurrence date */
  firstSeen: Date;
  /** Last occurrence date */
  lastSeen: Date;

  // Enhanced detection fields
  /** Confidence score (0-100) */
  confidence: number;
  /** Confidence level category */
  confidenceLevel: ConfidenceLevel;
  /** Detected billing frequency */
  billingFrequency: BillingFrequency;
  /** Expected billing day (day of week for weekly/biweekly, day of month otherwise) */
  expectedBillingDay: number;
  /** Amount variance as percentage */
  amountVariance: number;
  /** Whether amount is fixed or variable */
  amountType: AmountType;
  /** Predicted next payment date */
  nextExpectedDate: Date;
  /** Breakdown of confidence score components */
  scoreBreakdown: ConfidenceScoreBreakdown;
}

/**
 * Confirmed recurring payment stored in app state
 */
export interface Subscription {
  /** Unique identifier */
  id: string;
  /** Display name (recipient) */
  name: string;
  /** Custom name/alias set by user */
  customName?: string;
  /** Monthly amount */
  amount: number;
  /** Common billing day of month */
  billingDay: number;
  /** Type of recurring payment */
  recurringType: RecurringType;
  /** Category ID */
  categoryId: string | null;
  /** Subcategory ID */
  subcategoryId: string | null;
  /** Transaction IDs belonging to this subscription */
  transactionIds: string[];
  /** When subscription was first detected */
  createdAt: Date;
  /** Whether subscription is currently active */
  isActive: boolean;

  // Enhanced fields
  /** Confidence score (0-100) when detected */
  confidence?: number;
  /** Billing frequency */
  billingFrequency?: BillingFrequency;
  /** Amount type (fixed or variable) */
  amountType?: AmountType;
  /** Next expected payment date */
  nextExpectedDate?: Date;
}

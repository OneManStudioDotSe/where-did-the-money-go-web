/**
 * AI-powered spending insights types
 */

/**
 * Supported AI providers for insights
 */
export type AIProvider = 'openai' | 'anthropic' | 'gemini';

/**
 * AI provider configuration
 */
export interface AIProviderConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

/**
 * Category spending summary for AI analysis
 */
export interface CategorySpendingSummary {
  categoryName: string;
  totalAmount: number;
  transactionCount: number;
  percentageOfTotal: number;
  averageTransaction: number;
  /** Top merchants/descriptions in this category */
  topMerchants: Array<{
    name: string;
    amount: number;
    count: number;
  }>;
}

/**
 * Monthly spending trend
 */
export interface MonthlyTrend {
  month: string; // e.g., "2024-12"
  totalSpending: number;
  totalIncome: number;
  netFlow: number;
}

/**
 * Aggregated spending data for AI analysis
 * This is the data structure sent to the LLM
 */
export interface SpendingInsightsData {
  /** Analysis period */
  period: {
    startDate: string;
    endDate: string;
    totalDays: number;
  };
  /** Overall summary */
  summary: {
    totalSpending: number;
    totalIncome: number;
    netFlow: number;
    transactionCount: number;
    averageTransactionSize: number;
  };
  /** Spending breakdown by category */
  categoryBreakdown: CategorySpendingSummary[];
  /** Monthly trends (if multiple months of data) */
  monthlyTrends: MonthlyTrend[];
  /** Top spending items */
  topExpenses: Array<{
    description: string;
    amount: number;
    category: string;
    date: string;
  }>;
  /** Recurring expenses detected */
  recurringExpenses: Array<{
    description: string;
    averageAmount: number;
    frequency: string; // e.g., "monthly", "weekly"
    category: string;
  }>;
}

/**
 * AI-generated insight
 */
export interface AIInsight {
  id: string;
  type: 'saving_opportunity' | 'spending_pattern' | 'recommendation' | 'warning' | 'positive';
  title: string;
  description: string;
  /** Potential monthly savings if applicable */
  potentialSavings?: number;
  /** Related category if applicable */
  category?: string;
  /** Priority/importance (1-5, 5 being most important) */
  priority: number;
}

/**
 * Full AI insights response
 */
export interface AIInsightsResponse {
  generatedAt: string;
  insights: AIInsight[];
  summary: string;
  /** Raw response from AI (for debugging) */
  rawResponse?: string;
}

/**
 * State for the AI insights feature
 */
export interface AIInsightsState {
  isLoading: boolean;
  error: string | null;
  lastGenerated: string | null;
  insights: AIInsightsResponse | null;
}

import type { Transaction, Subscription } from '../types/transaction';
import type {
  SpendingInsightsData,
  CategorySpendingSummary,
  MonthlyTrend,
} from '../types/insights';
import { getCategoryName } from './category-service';

/**
 * Aggregate transaction data for AI analysis
 * This creates a privacy-preserving summary that can be sent to an LLM
 */
export function aggregateSpendingData(
  transactions: Transaction[],
  subscriptions: Subscription[] = []
): SpendingInsightsData {
  if (transactions.length === 0) {
    return createEmptyInsightsData();
  }

  // Sort transactions by date
  const sortedTransactions = [...transactions].sort(
    (a, b) => a.date.getTime() - b.date.getTime()
  );

  // Calculate period
  const startDate = sortedTransactions[0].date;
  const endDate = sortedTransactions[sortedTransactions.length - 1].date;
  const totalDays = Math.ceil(
    (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
  ) + 1;

  // Separate expenses and income
  const expenses = transactions.filter((t) => t.amount < 0);
  const income = transactions.filter((t) => t.amount > 0);

  const totalSpending = Math.abs(
    expenses.reduce((sum, t) => sum + t.amount, 0)
  );
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

  // Calculate summary
  const summary = {
    totalSpending,
    totalIncome,
    netFlow: totalIncome - totalSpending,
    transactionCount: transactions.length,
    averageTransactionSize:
      expenses.length > 0 ? totalSpending / expenses.length : 0,
  };

  // Category breakdown
  const categoryBreakdown = calculateCategoryBreakdown(expenses, totalSpending);

  // Monthly trends
  const monthlyTrends = calculateMonthlyTrends(transactions);

  // Top expenses
  const topExpenses = expenses
    .sort((a, b) => a.amount - b.amount) // Most negative first
    .slice(0, 10)
    .map((t) => ({
      description: t.description,
      amount: Math.abs(t.amount),
      category: getCategoryName(t.categoryId),
      date: t.date.toISOString().split('T')[0],
    }));

  // Recurring expenses from subscriptions
  const recurringExpenses = subscriptions
    .filter((s) => s.isActive)
    .map((s) => ({
      description: s.name,
      averageAmount: Math.abs(s.amount),
      frequency: 'monthly',
      category: getCategoryName(s.categoryId),
    }));

  return {
    period: {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalDays,
    },
    summary,
    categoryBreakdown,
    monthlyTrends,
    topExpenses,
    recurringExpenses,
  };
}

/**
 * Calculate spending breakdown by category
 */
function calculateCategoryBreakdown(
  expenses: Transaction[],
  totalSpending: number
): CategorySpendingSummary[] {
  const categoryMap = new Map<
    string,
    {
      transactions: Transaction[];
      total: number;
    }
  >();

  // Group by category
  for (const expense of expenses) {
    const categoryId = expense.categoryId || 'uncategorized';
    const existing = categoryMap.get(categoryId);

    if (existing) {
      existing.transactions.push(expense);
      existing.total += Math.abs(expense.amount);
    } else {
      categoryMap.set(categoryId, {
        transactions: [expense],
        total: Math.abs(expense.amount),
      });
    }
  }

  // Convert to summaries
  const summaries: CategorySpendingSummary[] = [];

  for (const [categoryId, data] of categoryMap) {
    const categoryName = getCategoryName(categoryId);
    const transactionCount = data.transactions.length;
    const totalAmount = data.total;

    // Calculate top merchants
    const merchantMap = new Map<string, { amount: number; count: number }>();
    for (const t of data.transactions) {
      const existing = merchantMap.get(t.description);
      if (existing) {
        existing.amount += Math.abs(t.amount);
        existing.count += 1;
      } else {
        merchantMap.set(t.description, {
          amount: Math.abs(t.amount),
          count: 1,
        });
      }
    }

    const topMerchants = Array.from(merchantMap.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    summaries.push({
      categoryName,
      totalAmount,
      transactionCount,
      percentageOfTotal: totalSpending > 0 ? (totalAmount / totalSpending) * 100 : 0,
      averageTransaction: transactionCount > 0 ? totalAmount / transactionCount : 0,
      topMerchants,
    });
  }

  // Sort by total amount descending
  return summaries.sort((a, b) => b.totalAmount - a.totalAmount);
}

/**
 * Calculate monthly spending trends
 */
function calculateMonthlyTrends(transactions: Transaction[]): MonthlyTrend[] {
  const monthMap = new Map<
    string,
    { spending: number; income: number }
  >();

  for (const t of transactions) {
    const monthKey = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    const existing = monthMap.get(monthKey);

    if (existing) {
      if (t.amount < 0) {
        existing.spending += Math.abs(t.amount);
      } else {
        existing.income += t.amount;
      }
    } else {
      monthMap.set(monthKey, {
        spending: t.amount < 0 ? Math.abs(t.amount) : 0,
        income: t.amount > 0 ? t.amount : 0,
      });
    }
  }

  return Array.from(monthMap.entries())
    .map(([month, data]) => ({
      month,
      totalSpending: data.spending,
      totalIncome: data.income,
      netFlow: data.income - data.spending,
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

/**
 * Create empty insights data structure
 */
function createEmptyInsightsData(): SpendingInsightsData {
  const today = new Date().toISOString().split('T')[0];
  return {
    period: {
      startDate: today,
      endDate: today,
      totalDays: 0,
    },
    summary: {
      totalSpending: 0,
      totalIncome: 0,
      netFlow: 0,
      transactionCount: 0,
      averageTransactionSize: 0,
    },
    categoryBreakdown: [],
    monthlyTrends: [],
    topExpenses: [],
    recurringExpenses: [],
  };
}

/**
 * Format spending data as a prompt-friendly string for the LLM
 */
export function formatDataForPrompt(data: SpendingInsightsData): string {
  const lines: string[] = [];

  lines.push('## Spending analysis data');
  lines.push('');
  lines.push(`**Period**: ${data.period.startDate} to ${data.period.endDate} (${data.period.totalDays} days)`);
  lines.push('');
  lines.push('### Summary');
  lines.push(`- Total spending: ${data.summary.totalSpending.toFixed(2)} SEK`);
  lines.push(`- Total income: ${data.summary.totalIncome.toFixed(2)} SEK`);
  lines.push(`- Net flow: ${data.summary.netFlow.toFixed(2)} SEK`);
  lines.push(`- Transaction count: ${data.summary.transactionCount}`);
  lines.push(`- Average expense: ${data.summary.averageTransactionSize.toFixed(2)} SEK`);
  lines.push('');

  if (data.categoryBreakdown.length > 0) {
    lines.push('### Spending by category');
    for (const cat of data.categoryBreakdown) {
      lines.push(
        `- **${cat.categoryName}**: ${cat.totalAmount.toFixed(2)} SEK (${cat.percentageOfTotal.toFixed(1)}%, ${cat.transactionCount} transactions)`
      );
      if (cat.topMerchants.length > 0) {
        const topMerchantList = cat.topMerchants
          .slice(0, 3)
          .map((m) => `${m.name}: ${m.amount.toFixed(0)} SEK`)
          .join(', ');
        lines.push(`  - Top: ${topMerchantList}`);
      }
    }
    lines.push('');
  }

  if (data.monthlyTrends.length > 1) {
    lines.push('### Monthly trends');
    for (const month of data.monthlyTrends) {
      lines.push(
        `- ${month.month}: Spent ${month.totalSpending.toFixed(0)} SEK, Earned ${month.totalIncome.toFixed(0)} SEK, Net ${month.netFlow.toFixed(0)} SEK`
      );
    }
    lines.push('');
  }

  if (data.topExpenses.length > 0) {
    lines.push('### Largest expenses');
    for (const expense of data.topExpenses.slice(0, 5)) {
      lines.push(
        `- ${expense.description}: ${expense.amount.toFixed(2)} SEK (${expense.category}, ${expense.date})`
      );
    }
    lines.push('');
  }

  if (data.recurringExpenses.length > 0) {
    lines.push('### Recurring expenses (subscriptions)');
    for (const recurring of data.recurringExpenses) {
      lines.push(
        `- ${recurring.description}: ~${recurring.averageAmount.toFixed(0)} SEK/${recurring.frequency} (${recurring.category})`
      );
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Build the full prompt for the AI
 */
export function buildInsightsPrompt(data: SpendingInsightsData): string {
  const dataSection = formatDataForPrompt(data);

  return `You are a helpful financial advisor analyzing personal spending data. Based on the data below, provide actionable insights and recommendations.

${dataSection}

Please analyze this spending data and provide:

1. **Key observations** (2-3 bullet points about spending patterns)
2. **Potential savings opportunities** (specific, actionable suggestions with estimated monthly savings if applicable)
3. **Positive habits** (what the user is doing well)
4. **Recommendations** (prioritized list of 2-3 specific actions to improve financial health)

Format your response as a JSON object with this structure:
{
  "summary": "A 1-2 sentence overall assessment",
  "insights": [
    {
      "type": "saving_opportunity" | "spending_pattern" | "recommendation" | "warning" | "positive",
      "title": "Short title",
      "description": "Detailed explanation",
      "potentialSavings": number or null,
      "category": "Related category name or null",
      "priority": 1-5 (5 = most important)
    }
  ]
}

Focus on practical, specific advice. Be encouraging but honest. All amounts are in SEK (Swedish Krona).`;
}

import type { Transaction, TransactionSummary } from '../types/transaction';
import { getCategoryName, getSubcategoryName } from '../utils/category-service';

export type ExportFormat = 'csv' | 'json';
export type ExportScope = 'all' | 'filtered' | 'summary';

export interface ExportOptions {
  format: ExportFormat;
  scope: ExportScope;
  includeRawData?: boolean;
  fileName?: string;
}

interface ExportableTransaction {
  id: string;
  date: string;
  valueDate: string;
  description: string;
  amount: number;
  balance: number;
  category: string | null;
  subcategory: string | null;
  verificationNumber: string;
  isSubscription: boolean;
}

/**
 * Convert a Transaction to an exportable format with resolved category names
 */
function toExportable(transaction: Transaction): ExportableTransaction {
  return {
    id: transaction.id,
    date: transaction.date.toISOString().split('T')[0],
    valueDate: transaction.valueDate.toISOString().split('T')[0],
    description: transaction.description,
    amount: transaction.amount,
    balance: transaction.balance,
    category: getCategoryName(transaction.categoryId),
    subcategory: getSubcategoryName(transaction.categoryId, transaction.subcategoryId),
    verificationNumber: transaction.verificationNumber,
    isSubscription: transaction.isSubscription,
  };
}

/**
 * Generate a summary object for export
 */
function generateSummary(transactions: Transaction[]): TransactionSummary & { categoryBreakdown: Record<string, { total: number; count: number }> } {
  const expenses = transactions.filter(t => t.amount < 0);
  const income = transactions.filter(t => t.amount >= 0);

  const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

  // Category breakdown
  const categoryBreakdown: Record<string, { total: number; count: number }> = {};
  transactions.forEach(t => {
    const categoryName = getCategoryName(t.categoryId) || 'Uncategorized';
    if (!categoryBreakdown[categoryName]) {
      categoryBreakdown[categoryName] = { total: 0, count: 0 };
    }
    categoryBreakdown[categoryName].total += t.amount;
    categoryBreakdown[categoryName].count += 1;
  });

  return {
    totalExpenses,
    totalIncome,
    netAmount: totalIncome - totalExpenses,
    transactionCount: transactions.length,
    averageExpense: expenses.length > 0 ? totalExpenses / expenses.length : 0,
    largestExpense: expenses.length > 0
      ? expenses.reduce((max, t) => Math.abs(t.amount) > Math.abs(max.amount) ? t : max, expenses[0])
      : null,
    uncategorizedCount: transactions.filter(t => !t.categoryId).length,
    categoryBreakdown,
  };
}

/**
 * Export transactions to CSV format
 */
function exportToCsv(transactions: Transaction[], includeRawData: boolean = false): string {
  const headers = [
    'Date',
    'Value Date',
    'Description',
    'Amount',
    'Balance',
    'Category',
    'Subcategory',
    'Verification Number',
    'Is Subscription',
  ];

  const rows = transactions.map(t => {
    const exportable = toExportable(t);
    return [
      exportable.date,
      exportable.valueDate,
      `"${exportable.description.replace(/"/g, '""')}"`, // Escape quotes in description
      exportable.amount.toFixed(2),
      exportable.balance.toFixed(2),
      exportable.category || '',
      exportable.subcategory || '',
      exportable.verificationNumber,
      exportable.isSubscription ? 'Yes' : 'No',
    ].join(';');
  });

  return [headers.join(';'), ...rows].join('\n');
}

/**
 * Export summary to CSV format
 */
function exportSummaryToCsv(transactions: Transaction[]): string {
  const summary = generateSummary(transactions);

  const lines = [
    'Transaction Summary',
    '',
    `Total Transactions;${summary.transactionCount}`,
    `Total Expenses;${summary.totalExpenses.toFixed(2)}`,
    `Total Income;${summary.totalIncome.toFixed(2)}`,
    `Net Amount;${summary.netAmount.toFixed(2)}`,
    `Average Expense;${summary.averageExpense.toFixed(2)}`,
    `Uncategorized;${summary.uncategorizedCount}`,
    '',
    'Category Breakdown',
    'Category;Total;Count',
  ];

  Object.entries(summary.categoryBreakdown)
    .sort((a, b) => a[1].total - b[1].total) // Sort by total (expenses first, negative)
    .forEach(([category, data]) => {
      lines.push(`${category};${data.total.toFixed(2)};${data.count}`);
    });

  return lines.join('\n');
}

/**
 * Export transactions to JSON format
 */
function exportToJson(transactions: Transaction[], includeRawData: boolean = false): string {
  const exportData = transactions.map(t => {
    const exportable = toExportable(t);
    if (includeRawData) {
      return { ...exportable, rawData: t.rawData };
    }
    return exportable;
  });

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export summary to JSON format
 */
function exportSummaryToJson(transactions: Transaction[]): string {
  const summary = generateSummary(transactions);
  return JSON.stringify(summary, null, 2);
}

/**
 * Trigger file download in the browser
 */
function downloadFile(content: string, fileName: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generate a default filename based on current date and format
 */
function generateFileName(format: ExportFormat, scope: ExportScope): string {
  const date = new Date().toISOString().split('T')[0];
  const scopeSuffix = scope === 'summary' ? '-summary' : scope === 'filtered' ? '-filtered' : '';
  return `transactions${scopeSuffix}-${date}.${format}`;
}

/**
 * Main export function
 */
export function exportTransactions(
  transactions: Transaction[],
  options: ExportOptions
): void {
  const { format, scope, includeRawData = false, fileName } = options;

  let content: string;
  let mimeType: string;

  if (scope === 'summary') {
    content = format === 'csv'
      ? exportSummaryToCsv(transactions)
      : exportSummaryToJson(transactions);
  } else {
    content = format === 'csv'
      ? exportToCsv(transactions, includeRawData)
      : exportToJson(transactions, includeRawData);
  }

  mimeType = format === 'csv' ? 'text/csv;charset=utf-8' : 'application/json';

  const finalFileName = fileName || generateFileName(format, scope);
  downloadFile(content, finalFileName, mimeType);
}

/**
 * Get export preview (first few rows) without triggering download
 */
export function getExportPreview(
  transactions: Transaction[],
  format: ExportFormat,
  scope: ExportScope,
  maxRows: number = 5
): string {
  const previewTransactions = transactions.slice(0, maxRows);

  if (scope === 'summary') {
    return format === 'csv'
      ? exportSummaryToCsv(transactions)
      : exportSummaryToJson(transactions);
  }

  return format === 'csv'
    ? exportToCsv(previewTransactions)
    : exportToJson(previewTransactions);
}

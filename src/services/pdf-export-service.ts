import type { Transaction, Subscription } from '../types/transaction';
import { getCategoryName, getSubcategoryName, getCategoryIcon } from '../utils/category-service';

interface PdfExportOptions {
  title?: string;
  dateRange?: { start: Date; end: Date };
  includeCharts?: boolean;
  includeSummary?: boolean;
  includeTransactions?: boolean;
  includeSubscriptions?: boolean;
}

interface CategorySummary {
  name: string;
  icon: string;
  total: number;
  count: number;
  percentage: number;
}

/**
 * Generate PDF content as printable HTML
 */
function generatePdfHtml(
  transactions: Transaction[],
  subscriptions: Subscription[],
  options: PdfExportOptions
): string {
  const {
    title = 'Financial Report',
    dateRange,
    includeSummary = true,
    includeTransactions = true,
    includeSubscriptions = true,
  } = options;

  const expenses = transactions.filter((t) => t.amount < 0);
  const income = transactions.filter((t) => t.amount > 0);
  const totalExpenses = Math.abs(expenses.reduce((sum, t) => sum + t.amount, 0));
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
  const netAmount = totalIncome - totalExpenses;

  // Calculate category breakdown
  const categoryMap = new Map<string, { total: number; count: number }>();
  expenses.forEach((t) => {
    const categoryName = getCategoryName(t.categoryId) || 'Uncategorized';
    const existing = categoryMap.get(categoryName) || { total: 0, count: 0 };
    existing.total += Math.abs(t.amount);
    existing.count += 1;
    categoryMap.set(categoryName, existing);
  });

  const categoryBreakdown: CategorySummary[] = [];
  categoryMap.forEach((data, name) => {
    const icon = getCategoryIcon(name === 'Uncategorized' ? null : name);
    categoryBreakdown.push({
      name,
      icon: icon || '📦',
      total: data.total,
      count: data.count,
      percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
    });
  });
  categoryBreakdown.sort((a, b) => b.total - a.total);

  // Format helpers
  const formatAmount = (amount: number) =>
    amount.toLocaleString('sv-SE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const formatDate = (date: Date) =>
    date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' });

  // Generate date range string
  const dateRangeStr = dateRange
    ? `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`
    : transactions.length > 0
      ? `${formatDate(new Date(Math.min(...transactions.map((t) => t.date.getTime()))))} - ${formatDate(new Date(Math.max(...transactions.map((t) => t.date.getTime()))))}`
      : 'No transactions';

  // Build HTML
  let html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.5;
      color: #1f2937;
      padding: 40px;
      max-width: 800px;
      margin: 0 auto;
    }
    h1 {
      font-size: 24px;
      font-weight: 700;
      margin-bottom: 4px;
      color: #111827;
    }
    h2 {
      font-size: 16px;
      font-weight: 600;
      margin: 24px 0 12px;
      color: #374151;
      border-bottom: 2px solid #e5e7eb;
      padding-bottom: 8px;
    }
    .subtitle {
      color: #6b7280;
      font-size: 14px;
      margin-bottom: 24px;
    }
    .generated {
      font-size: 11px;
      color: #9ca3af;
      margin-top: 4px;
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .summary-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }
    .summary-card.expense {
      background: #fef2f2;
      border-color: #fecaca;
    }
    .summary-card.income {
      background: #f0fdf4;
      border-color: #bbf7d0;
    }
    .summary-card.net {
      background: #eff6ff;
      border-color: #bfdbfe;
    }
    .summary-label {
      font-size: 11px;
      color: #6b7280;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .summary-value {
      font-size: 18px;
      font-weight: 700;
      margin-top: 4px;
    }
    .expense .summary-value {
      color: #dc2626;
    }
    .income .summary-value {
      color: #16a34a;
    }
    .net .summary-value {
      color: ${netAmount >= 0 ? '#16a34a' : '#dc2626'};
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 8px;
    }
    th, td {
      padding: 8px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f9fafb;
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      color: #6b7280;
    }
    td {
      font-size: 12px;
    }
    .text-right {
      text-align: right;
    }
    .amount-expense {
      color: #dc2626;
      font-weight: 500;
    }
    .amount-income {
      color: #16a34a;
      font-weight: 500;
    }
    .category-icon {
      margin-right: 8px;
    }
    .category-bar {
      height: 8px;
      background: #e5e7eb;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 4px;
    }
    .category-bar-fill {
      height: 100%;
      background: #3b82f6;
      border-radius: 4px;
    }
    .subscription-card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .subscription-name {
      font-weight: 600;
    }
    .subscription-details {
      font-size: 11px;
      color: #6b7280;
      margin-top: 2px;
    }
    .subscription-amount {
      font-weight: 700;
      color: #dc2626;
    }
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 10px;
      color: #9ca3af;
    }
    @media print {
      body {
        padding: 20px;
      }
      .no-print {
        display: none;
      }
    }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <p class="subtitle">${dateRangeStr}</p>
  <p class="generated">Generated on ${formatDate(new Date())}</p>
`;

  // Summary Section
  if (includeSummary) {
    html += `
  <h2>Summary</h2>
  <div class="summary-grid">
    <div class="summary-card">
      <div class="summary-label">Transactions</div>
      <div class="summary-value">${transactions.length}</div>
    </div>
    <div class="summary-card expense">
      <div class="summary-label">Total Expenses</div>
      <div class="summary-value">-${formatAmount(totalExpenses)} kr</div>
    </div>
    <div class="summary-card income">
      <div class="summary-label">Total Income</div>
      <div class="summary-value">+${formatAmount(totalIncome)} kr</div>
    </div>
    <div class="summary-card net">
      <div class="summary-label">Net Change</div>
      <div class="summary-value">${netAmount >= 0 ? '+' : ''}${formatAmount(netAmount)} kr</div>
    </div>
  </div>

  <h2>Spending by Category</h2>
  <table>
    <thead>
      <tr>
        <th>Category</th>
        <th class="text-right">Amount</th>
        <th class="text-right">%</th>
        <th class="text-right">Transactions</th>
      </tr>
    </thead>
    <tbody>
      ${categoryBreakdown.map((cat) => `
      <tr>
        <td><span class="category-icon">${cat.icon}</span>${cat.name}</td>
        <td class="text-right amount-expense">-${formatAmount(cat.total)} kr</td>
        <td class="text-right">${cat.percentage.toFixed(1)}%</td>
        <td class="text-right">${cat.count}</td>
      </tr>
      `).join('')}
    </tbody>
  </table>
`;
  }

  // Subscriptions Section
  if (includeSubscriptions && subscriptions.length > 0) {
    const monthlyTotal = subscriptions.reduce((sum, s) => sum + Math.abs(s.amount), 0);
    html += `
  <h2>Recurring Expenses</h2>
  <p style="margin-bottom: 12px; color: #6b7280;">
    ${subscriptions.length} recurring expenses totaling approximately ${formatAmount(monthlyTotal)} kr/month
  </p>
  ${subscriptions.map((sub) => `
  <div class="subscription-card">
    <div>
      <div class="subscription-name">${sub.name}</div>
      <div class="subscription-details">
        ${getCategoryName(sub.categoryId) || 'Uncategorized'} • ${sub.recurringType.replace('_', ' ')}
      </div>
    </div>
    <div class="subscription-amount">-${formatAmount(Math.abs(sub.amount))} kr</div>
  </div>
  `).join('')}
`;
  }

  // Transactions Table
  if (includeTransactions && transactions.length > 0) {
    // Limit to 100 transactions for PDF
    const displayTransactions = transactions.slice(0, 100);
    html += `
  <h2>Transactions</h2>
  ${transactions.length > 100 ? `<p style="margin-bottom: 12px; color: #6b7280;">Showing first 100 of ${transactions.length} transactions</p>` : ''}
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Description</th>
        <th>Category</th>
        <th class="text-right">Amount</th>
      </tr>
    </thead>
    <tbody>
      ${displayTransactions.map((t) => `
      <tr>
        <td>${formatDate(t.date)}</td>
        <td>${t.description.substring(0, 40)}${t.description.length > 40 ? '...' : ''}</td>
        <td>${getCategoryName(t.categoryId) || 'Uncategorized'}${t.subcategoryId ? ` / ${getSubcategoryName(t.categoryId, t.subcategoryId)}` : ''}</td>
        <td class="text-right ${t.amount < 0 ? 'amount-expense' : 'amount-income'}">
          ${t.amount < 0 ? '-' : '+'}${formatAmount(Math.abs(t.amount))} kr
        </td>
      </tr>
      `).join('')}
    </tbody>
  </table>
`;
  }

  // Footer
  html += `
  <div class="footer">
    Generated by Where Did The Money Go? • ${new Date().toISOString()}
  </div>
</body>
</html>
`;

  return html;
}

/**
 * Export transactions as a PDF (opens print dialog with styled HTML)
 */
export function exportToPdf(
  transactions: Transaction[],
  subscriptions: Subscription[] = [],
  options: PdfExportOptions = {}
): void {
  const html = generatePdfHtml(transactions, subscriptions, options);

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow pop-ups to generate PDF reports');
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();

  // Wait for content to load, then trigger print
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
  };
}

/**
 * Get PDF preview HTML (for display in modal)
 */
export function getPdfPreviewHtml(
  transactions: Transaction[],
  subscriptions: Subscription[] = [],
  options: PdfExportOptions = {}
): string {
  return generatePdfHtml(transactions, subscriptions, options);
}

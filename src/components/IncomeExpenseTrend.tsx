import { useMemo } from 'react';
import type { Transaction } from '../types/transaction';

interface IncomeExpenseTrendProps {
  transactions: Transaction[];
  className?: string;
}

interface MonthData {
  month: string;
  shortMonth: string;
  year: number;
  income: number;
  expenses: number;
  net: number;
  savingsRate: number;
}

function formatAmount(amount: number): string {
  return Math.abs(amount).toLocaleString('sv-SE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function IncomeExpenseTrend({ transactions, className = '' }: IncomeExpenseTrendProps) {
  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { income: number; expenses: number }>();

    transactions.forEach(t => {
      const key = `${t.date.getFullYear()}-${String(t.date.getMonth()).padStart(2, '0')}`;
      const existing = monthMap.get(key) || { income: 0, expenses: 0 };

      if (t.amount > 0) {
        existing.income += t.amount;
      } else {
        existing.expenses += Math.abs(t.amount);
      }

      monthMap.set(key, existing);
    });

    // Convert to array and sort by date
    const data: MonthData[] = Array.from(monthMap.entries())
      .map(([key, values]) => {
        const [year, month] = key.split('-').map(Number);
        const net = values.income - values.expenses;
        const savingsRate = values.income > 0 ? (net / values.income) * 100 : 0;

        return {
          month: `${MONTH_NAMES[month]} ${year}`,
          shortMonth: MONTH_NAMES[month],
          year,
          income: values.income,
          expenses: values.expenses,
          net,
          savingsRate,
        };
      })
      .sort((a, b) => {
        const [aYear, aMonth] = [a.year, MONTH_NAMES.indexOf(a.shortMonth)];
        const [bYear, bMonth] = [b.year, MONTH_NAMES.indexOf(b.shortMonth)];
        return aYear !== bYear ? aYear - bYear : aMonth - bMonth;
      })
      .slice(-12); // Last 12 months

    // Calculate max for scaling
    const maxValue = Math.max(
      ...data.map(d => Math.max(d.income, d.expenses))
    );

    // Calculate averages
    const avgIncome = data.length > 0 ? data.reduce((sum, d) => sum + d.income, 0) / data.length : 0;
    const avgExpenses = data.length > 0 ? data.reduce((sum, d) => sum + d.expenses, 0) / data.length : 0;
    const avgSavingsRate = data.length > 0 ? data.reduce((sum, d) => sum + d.savingsRate, 0) / data.length : 0;

    return { data, maxValue, avgIncome, avgExpenses, avgSavingsRate };
  }, [transactions]);

  if (transactions.length === 0 || monthlyData.data.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <p>No transaction data available</p>
      </div>
    );
  }

  const chartHeight = 200;
  const barWidth = Math.min(30, (100 / monthlyData.data.length) - 2);

  return (
    <div className={className}>
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-3">
          <p className="text-xs text-success-600 dark:text-success-400 mb-1">Avg Monthly Income</p>
          <p className="text-lg font-bold text-success-700 dark:text-success-300">
            {formatAmount(monthlyData.avgIncome)} kr
          </p>
        </div>
        <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-3">
          <p className="text-xs text-danger-600 dark:text-danger-400 mb-1">Avg Monthly Expenses</p>
          <p className="text-lg font-bold text-danger-700 dark:text-danger-300">
            {formatAmount(monthlyData.avgExpenses)} kr
          </p>
        </div>
        <div className={`border rounded-lg p-3 ${
          monthlyData.avgSavingsRate >= 0
            ? 'bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800'
            : 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
        }`}>
          <p className={`text-xs mb-1 ${
            monthlyData.avgSavingsRate >= 0
              ? 'text-primary-600 dark:text-primary-400'
              : 'text-warning-600 dark:text-warning-400'
          }`}>Avg Savings Rate</p>
          <p className={`text-lg font-bold ${
            monthlyData.avgSavingsRate >= 0
              ? 'text-primary-700 dark:text-primary-300'
              : 'text-warning-700 dark:text-warning-300'
          }`}>
            {monthlyData.avgSavingsRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Bar Chart */}
      <div className="relative mb-4">
        <div className="flex items-end justify-between gap-1" style={{ height: chartHeight }}>
          {monthlyData.data.map((month, index) => {
            const incomeHeight = monthlyData.maxValue > 0 ? (month.income / monthlyData.maxValue) * 100 : 0;
            const expenseHeight = monthlyData.maxValue > 0 ? (month.expenses / monthlyData.maxValue) * 100 : 0;

            return (
              <div
                key={index}
                className="flex-1 flex flex-col items-center gap-1"
                style={{ maxWidth: `${barWidth}%` }}
              >
                {/* Bars container */}
                <div className="w-full flex gap-0.5 items-end" style={{ height: chartHeight - 24 }}>
                  {/* Income bar */}
                  <div
                    className="flex-1 bg-success-400 dark:bg-success-500 rounded-t transition-all hover:bg-success-500 dark:hover:bg-success-400"
                    style={{ height: `${incomeHeight}%`, minHeight: month.income > 0 ? '4px' : '0' }}
                    title={`Income: ${formatAmount(month.income)} kr`}
                  />
                  {/* Expense bar */}
                  <div
                    className="flex-1 bg-danger-400 dark:bg-danger-500 rounded-t transition-all hover:bg-danger-500 dark:hover:bg-danger-400"
                    style={{ height: `${expenseHeight}%`, minHeight: month.expenses > 0 ? '4px' : '0' }}
                    title={`Expenses: ${formatAmount(month.expenses)} kr`}
                  />
                </div>
                {/* Month label */}
                <span className="text-[10px] text-gray-500 dark:text-gray-400 truncate w-full text-center">
                  {month.shortMonth}
                </span>
              </div>
            );
          })}
        </div>

        {/* Y-axis reference lines */}
        <div className="absolute left-0 right-0 top-0 bottom-6 pointer-events-none">
          <div className="absolute top-0 left-0 right-0 border-t border-dashed border-gray-200 dark:border-slate-600" />
          <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-gray-200 dark:border-slate-600" />
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-success-400 dark:bg-success-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Income</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-danger-400 dark:bg-danger-500" />
          <span className="text-xs text-gray-600 dark:text-gray-400">Expenses</span>
        </div>
      </div>

      {/* Net/Savings Rate Trend Line */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Monthly Savings Rate Trend
        </h4>
        <div className="space-y-2">
          {monthlyData.data.map((month, index) => {
            const isPositive = month.savingsRate >= 0;
            const barWidth = Math.min(Math.abs(month.savingsRate), 100);

            return (
              <div key={index} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 dark:text-gray-400 w-12">
                  {month.shortMonth}
                </span>
                <div className="flex-1 flex items-center">
                  {/* Negative side */}
                  <div className="w-1/2 flex justify-end">
                    {!isPositive && (
                      <div
                        className="h-4 bg-danger-400 dark:bg-danger-500 rounded-l"
                        style={{ width: `${barWidth}%` }}
                      />
                    )}
                  </div>
                  {/* Center line */}
                  <div className="w-px h-4 bg-gray-300 dark:bg-slate-600" />
                  {/* Positive side */}
                  <div className="w-1/2">
                    {isPositive && (
                      <div
                        className="h-4 bg-success-400 dark:bg-success-500 rounded-r"
                        style={{ width: `${barWidth}%` }}
                      />
                    )}
                  </div>
                </div>
                <span className={`text-xs font-medium w-12 text-right ${
                  isPositive ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                }`}>
                  {month.savingsRate.toFixed(0)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Monthly Breakdown Table */}
      <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mt-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          Monthly Breakdown
        </h4>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-slate-700">
                <th className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Month</th>
                <th className="text-right py-2 px-2 font-medium text-success-600 dark:text-success-400">Income</th>
                <th className="text-right py-2 px-2 font-medium text-danger-600 dark:text-danger-400">Expenses</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Net</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500 dark:text-gray-400">Savings %</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData.data.map((month, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-slate-700/50">
                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300">{month.month}</td>
                  <td className="py-2 px-2 text-right text-success-600 dark:text-success-400">
                    +{formatAmount(month.income)}
                  </td>
                  <td className="py-2 px-2 text-right text-danger-600 dark:text-danger-400">
                    -{formatAmount(month.expenses)}
                  </td>
                  <td className={`py-2 px-2 text-right font-medium ${
                    month.net >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                  }`}>
                    {month.net >= 0 ? '+' : ''}{formatAmount(month.net)}
                  </td>
                  <td className={`py-2 px-2 text-right ${
                    month.savingsRate >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
                  }`}>
                    {month.savingsRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

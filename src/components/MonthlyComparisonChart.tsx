import { useState, useMemo } from 'react';
import type { Transaction } from '../types/transaction';

interface MonthlyComparisonChartProps {
  transactions: Transaction[];
  maxMonths?: number;
}

interface MonthData {
  key: string;
  label: string;
  shortLabel: string;
  year: number;
  month: number;
  expenses: number;
  income: number;
  net: number;
  transactionCount: number;
}

function formatAmount(amount: number): string {
  return Math.abs(amount).toLocaleString('sv-SE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function formatCompactAmount(amount: number): string {
  const absAmount = Math.abs(amount);
  if (absAmount >= 1000000) {
    return (absAmount / 1000000).toFixed(1) + 'M';
  }
  if (absAmount >= 1000) {
    return (absAmount / 1000).toFixed(0) + 'k';
  }
  return absAmount.toFixed(0);
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const MONTH_SHORT_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

export function MonthlyComparisonChart({ transactions, maxMonths = 6 }: MonthlyComparisonChartProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [showIncome, setShowIncome] = useState(false);

  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, MonthData>();

    transactions.forEach((t) => {
      const year = t.date.getFullYear();
      const month = t.date.getMonth();
      const key = `${year}-${month.toString().padStart(2, '0')}`;

      if (!monthMap.has(key)) {
        monthMap.set(key, {
          key,
          label: `${MONTH_NAMES[month]} ${year}`,
          shortLabel: `${MONTH_SHORT_NAMES[month]} '${year.toString().slice(-2)}`,
          year,
          month,
          expenses: 0,
          income: 0,
          net: 0,
          transactionCount: 0,
        });
      }

      const data = monthMap.get(key)!;
      data.transactionCount += 1;

      if (t.amount < 0) {
        data.expenses += Math.abs(t.amount);
      } else {
        data.income += t.amount;
      }
      data.net = data.income - data.expenses;
    });

    // Sort by date descending and take most recent months
    const sortedMonths = Array.from(monthMap.values())
      .sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return b.month - a.month;
      })
      .slice(0, maxMonths)
      .reverse(); // Show oldest to newest left to right

    return sortedMonths;
  }, [transactions, maxMonths]);

  const { maxExpense, maxIncome, avgExpense } = useMemo(() => {
    const maxExp = Math.max(...monthlyData.map(m => m.expenses), 1);
    const maxInc = Math.max(...monthlyData.map(m => m.income), 1);
    const avgExp = monthlyData.length > 0
      ? monthlyData.reduce((sum, m) => sum + m.expenses, 0) / monthlyData.length
      : 0;
    return { maxExpense: maxExp, maxIncome: maxInc, avgExpense: avgExp };
  }, [monthlyData]);

  const chartHeight = 180;
  const barAreaHeight = chartHeight - 20;
  const maxValue = showIncome ? Math.max(maxExpense, maxIncome) : maxExpense;

  if (monthlyData.length < 2) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        <p className="text-sm">Need at least 2 months of data for comparison</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Header with toggle */}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Monthly Comparison
          <span className="text-gray-400 dark:text-gray-500 font-normal ml-2">
            ({monthlyData.length} months)
          </span>
        </h4>
        <button
          onClick={() => setShowIncome(!showIncome)}
          className={`text-xs px-2 py-1 rounded-md transition-colors ${
            showIncome
              ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300'
              : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
          }`}
        >
          {showIncome ? 'Showing Income' : 'Show Income'}
        </button>
      </div>

      {/* Chart */}
      <div className="flex overflow-x-auto">
        {/* Y-axis labels */}
        <div
          className="flex flex-col justify-between text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 text-right pr-1 sm:pr-2 py-1 flex-shrink-0"
          style={{ height: barAreaHeight }}
        >
          <span className="leading-none">{formatCompactAmount(maxValue)}</span>
          <span className="leading-none">{formatCompactAmount(maxValue / 2)}</span>
          <span className="leading-none">0</span>
        </div>

        {/* Chart area */}
        <div className="flex-1 min-w-0">
          {/* Y-axis line */}
          <div className="relative border-l border-gray-200 dark:border-slate-600" style={{ height: barAreaHeight }}>
            {/* Horizontal grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              <div className="border-t border-gray-100 dark:border-slate-700 w-full" />
              <div className="border-t border-gray-100 dark:border-slate-700 border-dashed w-full" />
              <div className="border-t border-gray-200 dark:border-slate-600 w-full" />
            </div>

            {/* Average line */}
            {!showIncome && avgExpense > 0 && (
              <div
                className="absolute left-0 right-0 border-t-2 border-dashed border-warning-400 dark:border-warning-500 pointer-events-none z-10"
                style={{
                  top: `${100 - (avgExpense / maxValue) * 100}%`
                }}
              >
                <span className="absolute -top-3 right-0 text-[9px] sm:text-[10px] text-warning-600 dark:text-warning-400 bg-white dark:bg-slate-800 px-1 rounded">
                  avg
                </span>
              </div>
            )}

            {/* Bars */}
            <div className="flex items-end justify-around gap-1 sm:gap-2 h-full px-1 sm:px-2">
              {monthlyData.map((month, index) => {
                const expenseHeight = maxValue > 0 ? (month.expenses / maxValue) * (barAreaHeight - 10) : 0;
                const incomeHeight = maxValue > 0 ? (month.income / maxValue) * (barAreaHeight - 10) : 0;
                const isHovered = hoveredIndex === index;
                const isAboveAvg = month.expenses > avgExpense;

                return (
                  <div
                    key={month.key}
                    className="flex flex-col items-center relative flex-1 max-w-[70px]"
                    onMouseEnter={() => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                    onClick={() => setHoveredIndex(isHovered ? null : index)}
                  >
                    {/* Tooltip */}
                    {isHovered && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-2 py-1.5 bg-gray-900 dark:bg-slate-700 text-white text-xs rounded shadow-lg whitespace-nowrap z-20">
                        <p className="font-medium mb-1">{month.label}</p>
                        <p className="text-danger-300">Expenses: {formatAmount(month.expenses)} kr</p>
                        {showIncome && <p className="text-success-300">Income: {formatAmount(month.income)} kr</p>}
                        <p className={month.net >= 0 ? 'text-success-300' : 'text-danger-300'}>
                          Net: {month.net >= 0 ? '+' : ''}{formatAmount(month.net)} kr
                        </p>
                        <p className="text-gray-400 text-[10px] mt-0.5">{month.transactionCount} transactions</p>
                      </div>
                    )}

                    {/* Bars container */}
                    <div className="flex gap-0.5 sm:gap-1 items-end">
                      {/* Expense bar */}
                      <div
                        className="w-4 sm:w-6 rounded-t-sm transition-all duration-300"
                        style={{
                          height: `${expenseHeight}px`,
                          backgroundColor: isAboveAvg && !showIncome
                            ? 'rgb(239 68 68)' // red-500 for above average
                            : 'rgb(244 114 182)', // pink-400
                          opacity: isHovered ? 1 : 0.85,
                          transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                          transformOrigin: 'bottom',
                        }}
                      />

                      {/* Income bar (when toggled) */}
                      {showIncome && (
                        <div
                          className="w-4 sm:w-6 rounded-t-sm transition-all duration-300"
                          style={{
                            height: `${incomeHeight}px`,
                            backgroundColor: 'rgb(34 197 94)', // green-500
                            opacity: isHovered ? 1 : 0.85,
                            transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                            transformOrigin: 'bottom',
                          }}
                        />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex justify-around gap-1 sm:gap-2 mt-2 px-1 sm:px-2">
            {monthlyData.map((month) => (
              <div
                key={`label-${month.key}`}
                className="flex-1 max-w-[70px] text-center min-w-0"
              >
                <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 block truncate">
                  {month.shortLabel}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-pink-400" />
          <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Expenses</span>
        </div>
        {showIncome && (
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm bg-green-500" />
            <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Income</span>
          </div>
        )}
        {!showIncome && (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-sm bg-red-500" />
              <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Above avg</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-6 border-t-2 border-dashed border-warning-400" />
              <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400">Average</span>
            </div>
          </>
        )}
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2 border-t border-gray-100 dark:border-slate-700">
        <div className="text-center p-2 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-100 dark:border-slate-600">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5">Avg Monthly</p>
          <p className="text-sm sm:text-base font-bold text-gray-900 dark:text-white">
            {formatAmount(avgExpense)} kr
          </p>
        </div>
        <div className="text-center p-2 bg-danger-50 dark:bg-danger-900/30 rounded-lg border border-danger-100 dark:border-danger-800/50">
          <p className="text-[10px] sm:text-xs text-danger-600 dark:text-danger-400 mb-0.5">Highest</p>
          <p className="text-sm sm:text-base font-bold text-danger-700 dark:text-danger-300">
            {formatAmount(maxExpense)} kr
          </p>
        </div>
        <div className="text-center p-2 bg-success-50 dark:bg-success-900/30 rounded-lg border border-success-100 dark:border-success-800/50">
          <p className="text-[10px] sm:text-xs text-success-600 dark:text-success-400 mb-0.5">Lowest</p>
          <p className="text-sm sm:text-base font-bold text-success-700 dark:text-success-300">
            {formatAmount(Math.min(...monthlyData.map(m => m.expenses)))} kr
          </p>
        </div>
      </div>
    </div>
  );
}

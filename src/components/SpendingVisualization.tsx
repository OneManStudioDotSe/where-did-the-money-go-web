import React, { useState, useMemo } from 'react';
import type { Transaction } from '../types/transaction';
import type { TimePeriod } from './TimePeriodSelector';
import { getCategoryName, getCategoryColor, getCategoryIcon, getSubcategoryName } from '../utils/category-service';
import { ChartEmptyState } from './ui/EmptyState';
import { MonthlyComparisonChart } from './MonthlyComparisonChart';

interface SpendingVisualizationProps {
  transactions: Transaction[];
  selectedPeriod: TimePeriod | null;
  allTransactions: Transaction[]; // For calculating trends/averages
}

interface DailySpending {
  date: Date;
  total: number;
  count: number;
}

type ChartType = 'bar' | 'bar-vertical' | 'donut';

interface CategoryTotal {
  categoryId: string | null;
  name: string;
  icon: string;
  color: string;
  total: number;
  count: number;
  percentage: number;
  subcategories: SubcategoryTotal[];
}

interface SubcategoryTotal {
  subcategoryId: string | null;
  name: string;
  total: number;
  count: number;
  percentage: number;
}


function formatAmount(amount: number): string {
  return Math.abs(amount).toLocaleString('sv-SE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

function calculateCategoryTotals(transactions: Transaction[]): CategoryTotal[] {
  const expenses = transactions.filter((t) => t.amount < 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const categoryMap = new Map<string | null, { total: number; count: number; transactions: Transaction[] }>();

  expenses.forEach((t) => {
    const existing = categoryMap.get(t.categoryId) || { total: 0, count: 0, transactions: [] };
    existing.total += Math.abs(t.amount);
    existing.count += 1;
    existing.transactions.push(t);
    categoryMap.set(t.categoryId, existing);
  });

  const categories: CategoryTotal[] = [];

  categoryMap.forEach((data, categoryId) => {
    // Calculate subcategory totals
    const subcategoryMap = new Map<string | null, { total: number; count: number }>();
    data.transactions.forEach((t) => {
      const existing = subcategoryMap.get(t.subcategoryId) || { total: 0, count: 0 };
      existing.total += Math.abs(t.amount);
      existing.count += 1;
      subcategoryMap.set(t.subcategoryId, existing);
    });

    const subcategories: SubcategoryTotal[] = [];
    subcategoryMap.forEach((subData, subcategoryId) => {
      subcategories.push({
        subcategoryId,
        name: getSubcategoryName(categoryId, subcategoryId) || 'Other',
        total: subData.total,
        count: subData.count,
        percentage: data.total > 0 ? (subData.total / data.total) * 100 : 0,
      });
    });

    // Sort subcategories by total
    subcategories.sort((a, b) => b.total - a.total);

    categories.push({
      categoryId,
      name: getCategoryName(categoryId),
      icon: getCategoryIcon(categoryId),
      color: getCategoryColor(categoryId),
      total: data.total,
      count: data.count,
      percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0,
      subcategories,
    });
  });

  // Sort by total descending
  categories.sort((a, b) => b.total - a.total);

  return categories;
}

function DonutChart({ categories, size = 200 }: { categories: CategoryTotal[]; size?: number }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const total = categories.reduce((sum, c) => sum + c.total, 0);
  const centerX = size / 2;
  const centerY = size / 2;
  const radius = size * 0.4;
  const innerRadius = size * 0.25;

  let currentAngle = -Math.PI / 2; // Start from top

  const segments = categories.map((category, index) => {
    const angle = (category.total / total) * 2 * Math.PI;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const x1Inner = centerX + innerRadius * Math.cos(endAngle);
    const y1Inner = centerY + innerRadius * Math.sin(endAngle);
    const x2Inner = centerX + innerRadius * Math.cos(startAngle);
    const y2Inner = centerY + innerRadius * Math.sin(startAngle);

    const d = `
      M ${x1} ${y1}
      A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}
      L ${x1Inner} ${y1Inner}
      A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x2Inner} ${y2Inner}
      Z
    `;

    const isHovered = hoveredIndex === index;

    return (
      <path
        key={category.categoryId || 'uncategorized'}
        d={d}
        fill={category.color}
        stroke="white"
        strokeWidth={2}
        onMouseEnter={() => setHoveredIndex(index)}
        onMouseLeave={() => setHoveredIndex(null)}
        className={`transition-transform origin-center ${isHovered ? 'brightness-110' : ''}`}
        style={{
          transform: isHovered ? 'scale(1.03)' : 'scale(1)',
          transformOrigin: `${centerX}px ${centerY}px`,
        }}
      />
    );
  });

  const hoveredCategory = hoveredIndex !== null ? categories[hoveredIndex] : null;

  return (
    <div className="relative">
      <svg width={size} height={size} className="overflow-visible">
        {segments}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center">
          {hoveredCategory ? (
            <>
              <p className="text-2xl">{hoveredCategory.icon}</p>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{hoveredCategory.percentage.toFixed(1)}%</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{formatAmount(hoveredCategory.total)} kr</p>
              <p className="text-xs text-gray-400 dark:text-gray-500">{hoveredCategory.count} txn</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-900 dark:text-white">Total</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">{formatAmount(total)} kr</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BarChart({ categories, maxBars = 10 }: { categories: CategoryTotal[]; maxBars?: number }) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const displayCategories = categories.slice(0, maxBars);
  const maxValue = displayCategories.length > 0 ? Math.max(...displayCategories.map((c) => c.total)) : 0;

  const handleCategoryClick = (categoryId: string | null) => {
    const key = categoryId || 'uncategorized';
    setExpandedCategory(expandedCategory === key ? null : key);
  };

  return (
    <div className="space-y-2">
      {displayCategories.map((category) => {
        const barWidth = maxValue > 0 ? (category.total / maxValue) * 100 : 0;
        const categoryKey = category.categoryId || 'uncategorized';
        const isExpanded = expandedCategory === categoryKey;
        const hasSubcategories = category.subcategories.length > 1;

        return (
          <div key={categoryKey}>
            <div
              className={`group ${hasSubcategories ? 'cursor-pointer' : ''}`}
              onClick={() => hasSubcategories && handleCategoryClick(category.categoryId)}
            >
              <div className="flex items-center gap-2 mb-1">
                {hasSubcategories && (
                  <svg
                    className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                )}
                {!hasSubcategories && <span className="w-4 flex-shrink-0" />}
                <span className="text-lg">{category.icon}</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex-1 truncate">
                  {category.name}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{category.percentage.toFixed(1)}%</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white min-w-[80px] text-right">
                  {formatAmount(category.total)} kr
                </span>
              </div>
              <div className="h-6 bg-gray-100 dark:bg-slate-700 rounded-lg overflow-hidden ml-5">
                <div
                  className="h-full rounded-lg transition-all duration-500 ease-out group-hover:brightness-110 flex items-center justify-end pr-2 animate-bar-grow"
                  style={{
                    width: `${barWidth}%`,
                    backgroundColor: category.color,
                    minWidth: barWidth > 0 ? '20px' : '0',
                  }}
                >
                  {barWidth > 15 && (
                    <span className="text-xs font-medium text-white">
                      {category.count} txn
                    </span>
                  )}
                </div>
              </div>
            </div>
            {/* Subcategory drill-down */}
            {isExpanded && (
              <div className="ml-9 mt-2 space-y-1.5 pb-2 border-l-2 border-gray-200 dark:border-slate-600 pl-3 animate-slide-down">
                {category.subcategories.map((sub) => {
                  const subBarWidth = category.total > 0 ? (sub.total / category.total) * 100 : 0;
                  return (
                    <div key={sub.subcategoryId || 'other'}>
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">
                          {sub.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{sub.percentage.toFixed(1)}%</span>
                        <span className="text-xs font-medium text-gray-700 dark:text-gray-300 min-w-[70px] text-right">
                          {formatAmount(sub.total)} kr
                        </span>
                      </div>
                      <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500 ease-out"
                          style={{
                            width: `${subBarWidth}%`,
                            backgroundColor: category.color,
                            opacity: 0.7,
                            minWidth: subBarWidth > 0 ? '10px' : '0',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VerticalBarChart({ categories, maxBars = 8 }: { categories: CategoryTotal[]; maxBars?: number }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  // Show fewer bars on mobile
  const displayCategories = categories.slice(0, maxBars);
  const maxValue = displayCategories.length > 0 ? Math.max(...displayCategories.map((c) => c.total)) : 0;
  const chartHeight = 180;
  const barAreaHeight = chartHeight - 20; // Leave room for icons

  return (
    <div className="flex overflow-x-auto">
      {/* Y-axis labels - vertical on left */}
      <div className="flex flex-col justify-between text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 text-right pr-1 sm:pr-2 py-1 flex-shrink-0" style={{ height: barAreaHeight }}>
        <span className="leading-none">{formatAmount(maxValue)}</span>
        <span className="leading-none">{formatAmount(maxValue / 2)}</span>
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

          {/* Bars */}
          <div className="flex items-end justify-around gap-1 sm:gap-2 h-full px-1 sm:px-2">
            {displayCategories.map((category, index) => {
              const barHeight = maxValue > 0 ? (category.total / maxValue) * (barAreaHeight - 10) : 0;
              const isHovered = hoveredIndex === index;

              return (
                <div
                  key={category.categoryId || 'uncategorized'}
                  className="flex flex-col items-center relative flex-1 max-w-[56px]"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  onClick={() => setHoveredIndex(isHovered ? null : index)}
                >
                  {/* Tooltip on hover/tap */}
                  {isHovered && (
                    <div className="absolute bottom-full mb-2 px-2 py-1 bg-gray-900 dark:bg-slate-700 text-white text-xs rounded shadow-lg whitespace-nowrap z-10 max-w-[200px]">
                      <div className="font-medium truncate">{category.name}</div>
                      <div>{formatAmount(category.total)} kr ({category.percentage.toFixed(1)}%)</div>
                      <div className="text-gray-300">{category.count} transaction{category.count !== 1 ? 's' : ''}</div>
                    </div>
                  )}
                  {/* Bar */}
                  <div
                    className="w-full max-w-[40px] sm:max-w-[56px] rounded-t-md transition-all duration-300"
                    style={{
                      height: `${barHeight}px`,
                      backgroundColor: category.color,
                      opacity: isHovered ? 1 : 0.85,
                      transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                      transformOrigin: 'bottom',
                    }}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* X-axis icons with labels */}
        <div className="flex justify-around gap-1 sm:gap-2 mt-2 px-1 sm:px-2">
          {displayCategories.map((category) => (
            <div key={category.categoryId || 'uncategorized-icon'} className="flex-1 max-w-[56px] flex flex-col items-center min-w-0">
              <span className="text-base sm:text-lg">{category.icon}</span>
              <span className="text-[10px] sm:text-xs font-medium text-gray-600 dark:text-gray-300 truncate w-full text-center mt-0.5 sm:mt-1" title={category.name}>
                {category.name.length > 6 ? category.name.slice(0, 5) + '…' : category.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function TrendSection({
  transactions,
  selectedPeriod,
  allTransactions,
}: {
  transactions: Transaction[];
  selectedPeriod: TimePeriod | null;
  allTransactions: Transaction[];
}) {
  const trendData = useMemo(() => {
    if (!selectedPeriod) return null;

    const expenses = transactions.filter((t) => t.amount < 0);
    const currentTotal = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const currentCount = expenses.length;

    // Calculate average for same period type across all data
    const allExpenses = allTransactions.filter((t) => t.amount < 0);

    // Group all transactions by the same period type
    const periodTotals: number[] = [];
    const periodCounts: number[] = [];

    if (selectedPeriod.type === 'month') {
      const monthMap = new Map<string, { total: number; count: number }>();
      allExpenses.forEach((t) => {
        const key = `${t.date.getFullYear()}-${t.date.getMonth()}`;
        const existing = monthMap.get(key) || { total: 0, count: 0 };
        existing.total += Math.abs(t.amount);
        existing.count += 1;
        monthMap.set(key, existing);
      });
      monthMap.forEach((v) => {
        periodTotals.push(v.total);
        periodCounts.push(v.count);
      });
    } else if (selectedPeriod.type === 'week') {
      const weekMap = new Map<string, { total: number; count: number }>();
      allExpenses.forEach((t) => {
        const weekStart = new Date(t.date);
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        const key = weekStart.toISOString().split('T')[0];
        const existing = weekMap.get(key) || { total: 0, count: 0 };
        existing.total += Math.abs(t.amount);
        existing.count += 1;
        weekMap.set(key, existing);
      });
      weekMap.forEach((v) => {
        periodTotals.push(v.total);
        periodCounts.push(v.count);
      });
    } else if (selectedPeriod.type === 'day') {
      const dayMap = new Map<string, { total: number; count: number }>();
      allExpenses.forEach((t) => {
        const key = t.date.toISOString().split('T')[0];
        const existing = dayMap.get(key) || { total: 0, count: 0 };
        existing.total += Math.abs(t.amount);
        existing.count += 1;
        dayMap.set(key, existing);
      });
      dayMap.forEach((v) => {
        periodTotals.push(v.total);
        periodCounts.push(v.count);
      });
    } else if (selectedPeriod.type === 'quarter') {
      const quarterMap = new Map<string, { total: number; count: number }>();
      allExpenses.forEach((t) => {
        const quarter = Math.floor(t.date.getMonth() / 3);
        const key = `${t.date.getFullYear()}-Q${quarter}`;
        const existing = quarterMap.get(key) || { total: 0, count: 0 };
        existing.total += Math.abs(t.amount);
        existing.count += 1;
        quarterMap.set(key, existing);
      });
      quarterMap.forEach((v) => {
        periodTotals.push(v.total);
        periodCounts.push(v.count);
      });
    } else if (selectedPeriod.type === 'year') {
      const yearMap = new Map<string, { total: number; count: number }>();
      allExpenses.forEach((t) => {
        const key = t.date.getFullYear().toString();
        const existing = yearMap.get(key) || { total: 0, count: 0 };
        existing.total += Math.abs(t.amount);
        existing.count += 1;
        yearMap.set(key, existing);
      });
      yearMap.forEach((v) => {
        periodTotals.push(v.total);
        periodCounts.push(v.count);
      });
    }

    const avgTotal = periodTotals.length > 0 ? periodTotals.reduce((a, b) => a + b, 0) / periodTotals.length : 0;
    const avgCount = periodCounts.length > 0 ? periodCounts.reduce((a, b) => a + b, 0) / periodCounts.length : 0;

    const totalDiff = avgTotal > 0 ? ((currentTotal - avgTotal) / avgTotal) * 100 : 0;
    const countDiff = avgCount > 0 ? ((currentCount - avgCount) / avgCount) * 100 : 0;

    // Daily average for this period
    const daysDiff = Math.ceil((selectedPeriod.end.getTime() - selectedPeriod.start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    const dailyAvg = daysDiff > 0 ? currentTotal / daysDiff : 0;

    return {
      currentTotal,
      currentCount,
      avgTotal,
      avgCount,
      totalDiff,
      countDiff,
      dailyAvg,
      periodCount: periodTotals.length,
    };
  }, [transactions, selectedPeriod, allTransactions]);

  if (!selectedPeriod || !trendData) {
    return (
      <div className="text-center py-6 text-gray-500 dark:text-gray-400">
        <p className="text-sm">Select a time period to see trends and averages</p>
      </div>
    );
  }

  const periodLabel = {
    day: 'Daily',
    week: 'Weekly',
    month: 'Monthly',
    quarter: 'Quarterly',
    year: 'Yearly',
  }[selectedPeriod.type];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {/* Current Period Total */}
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">This {selectedPeriod.type}</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{formatAmount(trendData.currentTotal)} kr</p>
          <div className="flex items-center gap-1 mt-1">
            {trendData.totalDiff !== 0 && (
              <span
                className={`text-xs font-medium ${
                  trendData.totalDiff > 0 ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'
                }`}
              >
                {trendData.totalDiff > 0 ? '↑' : '↓'} {Math.abs(trendData.totalDiff).toFixed(1)}%
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">vs avg</span>
          </div>
        </div>

        {/* Average */}
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{periodLabel} Average</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{formatAmount(trendData.avgTotal)} kr</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Based on {trendData.periodCount} {selectedPeriod.type}s
          </p>
        </div>

        {/* Transaction Count */}
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Transactions</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{trendData.currentCount}</p>
          <div className="flex items-center gap-1 mt-1">
            {trendData.countDiff !== 0 && (
              <span
                className={`text-xs font-medium ${
                  trendData.countDiff > 0 ? 'text-danger-600 dark:text-danger-400' : 'text-success-600 dark:text-success-400'
                }`}
              >
                {trendData.countDiff > 0 ? '↑' : '↓'} {Math.abs(trendData.countDiff).toFixed(1)}%
              </span>
            )}
            <span className="text-xs text-gray-400 dark:text-gray-500">vs avg {trendData.avgCount.toFixed(0)}</span>
          </div>
        </div>

        {/* Daily Average */}
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Daily Average</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{formatAmount(trendData.dailyAvg)} kr</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">This period</p>
        </div>
      </div>
    </div>
  );
}

/** Spending calendar showing daily totals */
function SpendingCalendar({ transactions }: { transactions: Transaction[] }) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Start with the most recent transaction month, or current month
    if (transactions.length > 0) {
      const sorted = [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());
      return new Date(sorted[0].date.getFullYear(), sorted[0].date.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  // Calculate daily spending for the current month
  const dailySpending = useMemo(() => {
    const map = new Map<string, DailySpending>();
    const expenses = transactions.filter(t => t.amount < 0);

    expenses.forEach(t => {
      const dateKey = t.date.toISOString().split('T')[0];
      const existing = map.get(dateKey) || { date: t.date, total: 0, count: 0 };
      existing.total += Math.abs(t.amount);
      existing.count += 1;
      map.set(dateKey, existing);
    });

    return map;
  }, [transactions]);

  // Get max spending for color scaling
  const maxSpending = useMemo(() => {
    let max = 0;
    dailySpending.forEach(d => {
      if (d.total > max) max = d.total;
    });
    return max;
  }, [dailySpending]);

  // Generate calendar days for current month
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay(); // 0 = Sunday

    // Adjust for Monday start (0 = Monday, 6 = Sunday)
    const adjustedStartDay = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const days: (Date | null)[] = [];

    // Add empty slots for days before the first day of month
    for (let i = 0; i < adjustedStartDay; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    return days;
  }, [currentMonth]);

  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const goToPrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const getSpendingIntensity = (amount: number): string => {
    if (amount === 0 || maxSpending === 0) return 'bg-gray-100 dark:bg-slate-700';
    const ratio = amount / maxSpending;
    if (ratio < 0.25) return 'bg-primary-100 dark:bg-primary-900/30';
    if (ratio < 0.5) return 'bg-primary-200 dark:bg-primary-800/40';
    if (ratio < 0.75) return 'bg-primary-300 dark:bg-primary-700/50';
    return 'bg-primary-400 dark:bg-primary-600/60';
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Daily Spending</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[120px] text-center">
            {monthLabel}
          </span>
          <button
            onClick={goToNextMonth}
            className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
          <div key={day} className="text-[10px] text-center text-gray-400 dark:text-gray-500 font-medium py-1">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, index) => {
          if (!day) {
            return <div key={`empty-${index}`} className="aspect-square" />;
          }

          const dateKey = day.toISOString().split('T')[0];
          const spending = dailySpending.get(dateKey);
          const amount = spending?.total || 0;
          const isToday = day.getTime() === today.getTime();

          return (
            <div
              key={dateKey}
              className={`aspect-square rounded-md flex flex-col items-center justify-center relative group cursor-default ${getSpendingIntensity(amount)} ${isToday ? 'ring-2 ring-primary-500' : ''}`}
              title={amount > 0 ? `${formatAmount(amount)} kr (${spending?.count} transactions)` : 'No spending'}
            >
              <span className={`text-[10px] ${amount > 0 ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'}`}>
                {day.getDate()}
              </span>
              {amount > 0 && (
                <span className="text-[8px] font-medium text-gray-600 dark:text-gray-300 truncate max-w-full px-0.5">
                  {amount >= 1000 ? `${(amount / 1000).toFixed(0)}k` : formatAmount(amount)}
                </span>
              )}

              {/* Tooltip on hover */}
              {amount > 0 && (
                <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 dark:bg-slate-600 text-white text-xs rounded shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                  {formatAmount(amount)} kr
                  <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
                    <div className="border-4 border-transparent border-t-gray-900 dark:border-t-slate-600" />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-2">
        <span className="text-[10px] text-gray-400">Less</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-slate-700" />
          <div className="w-3 h-3 rounded-sm bg-primary-100 dark:bg-primary-900/30" />
          <div className="w-3 h-3 rounded-sm bg-primary-200 dark:bg-primary-800/40" />
          <div className="w-3 h-3 rounded-sm bg-primary-300 dark:bg-primary-700/50" />
          <div className="w-3 h-3 rounded-sm bg-primary-400 dark:bg-primary-600/60" />
        </div>
        <span className="text-[10px] text-gray-400">More</span>
      </div>
    </div>
  );
}

function CategoryTotalsTable({
  categories,
  previousMonthCategories,
}: {
  categories: CategoryTotal[];
  previousMonthCategories?: Map<string | null, number>;
}) {
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const toggleExpand = (categoryId: string | null) => {
    const key = categoryId || 'uncategorized';
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <div>

      <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-slate-700/50">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Category</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400">Amount</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400">%</th>
              {previousMonthCategories && (
                <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400">vs Last</th>
              )}
              <th className="text-right px-3 py-2 font-medium text-gray-600 dark:text-gray-400">#</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
            {categories.map((category) => {
              const key = category.categoryId || 'uncategorized';
              const isExpanded = expandedCategories.has(key);
              const hasSubcategories = category.subcategories.length > 1;

              // Calculate percentage change from last month
              const prevTotal = previousMonthCategories?.get(category.categoryId) || 0;
              const percentChange = prevTotal > 0
                ? ((category.total - prevTotal) / prevTotal) * 100
                : category.total > 0 ? 100 : 0;

              return (
                <React.Fragment key={key}>
                  <tr
                    className={`hover:bg-gray-50 dark:hover:bg-slate-700/50 ${hasSubcategories ? 'cursor-pointer' : ''}`}
                    onClick={() => hasSubcategories && toggleExpand(category.categoryId)}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {hasSubcategories && (
                          <svg
                            className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        )}
                        {!hasSubcategories && <span className="w-4" />}
                        <span
                          className="w-6 h-6 rounded flex items-center justify-center text-sm"
                          style={{ backgroundColor: `${category.color}20` }}
                        >
                          {category.icon}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900 dark:text-white">
                      {formatAmount(category.total)} kr
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600 dark:text-gray-400">
                      {category.percentage.toFixed(1)}%
                    </td>
                    {previousMonthCategories && (
                      <td className="px-3 py-2 text-right">
                        {prevTotal > 0 || category.total > 0 ? (
                          <span className={`text-xs font-medium ${
                            percentChange > 0 ? 'text-danger-600 dark:text-danger-400' : percentChange < 0 ? 'text-success-600 dark:text-success-400' : 'text-gray-400'
                          }`}>
                            {percentChange > 0 ? '↑' : percentChange < 0 ? '↓' : '–'}
                            {percentChange !== 0 && ` ${Math.abs(percentChange).toFixed(0)}%`}
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">–</span>
                        )}
                      </td>
                    )}
                    <td className="px-3 py-2 text-right text-gray-500 dark:text-gray-400">{category.count}</td>
                  </tr>
                  {isExpanded &&
                    category.subcategories.map((sub) => (
                      <tr key={`${key}-${sub.subcategoryId}`} className="bg-gray-50/50 dark:bg-slate-700/30">
                        <td className="px-3 py-1.5 pl-14">
                          <span className="text-gray-600 dark:text-gray-400">{sub.name}</span>
                        </td>
                        <td className="px-3 py-1.5 text-right text-gray-700 dark:text-gray-300">
                          {formatAmount(sub.total)} kr
                        </td>
                        <td className="px-3 py-1.5 text-right text-gray-500 dark:text-gray-400 text-xs">
                          {sub.percentage.toFixed(1)}%
                        </td>
                        <td className="px-3 py-1.5 text-right text-gray-400 dark:text-gray-500">{sub.count}</td>
                      </tr>
                    ))}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function SpendingVisualization({
  transactions,
  selectedPeriod,
  allTransactions,
}: SpendingVisualizationProps) {
  const [chartType, setChartType] = useState<ChartType>('bar-vertical');

  const categoryTotals = useMemo(() => calculateCategoryTotals(transactions), [transactions]);

  // Memoize expensive expense/income calculations
  const { totalExpenses, totalIncome, dailyAverage } = useMemo(() => {
    const exp = transactions.filter((t) => t.amount < 0);
    const inc = transactions.filter((t) => t.amount > 0);
    const totalExp = exp.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate daily average based on date range
    let days = 1;
    if (transactions.length > 0) {
      const dates = transactions.map(t => t.date.getTime());
      const minDate = Math.min(...dates);
      const maxDate = Math.max(...dates);
      days = Math.max(1, Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24)) + 1);
    }

    return {
      totalExpenses: totalExp,
      totalIncome: inc.reduce((sum, t) => sum + t.amount, 0),
      dailyAverage: totalExp / days,
    };
  }, [transactions]);

  // Calculate previous month category totals for comparison
  const previousMonthCategories = useMemo(() => {
    if (!selectedPeriod) return undefined;

    // Get the previous month's date range
    const prevMonthStart = new Date(selectedPeriod.start);
    prevMonthStart.setMonth(prevMonthStart.getMonth() - 1);
    const prevMonthEnd = new Date(selectedPeriod.end);
    prevMonthEnd.setMonth(prevMonthEnd.getMonth() - 1);

    // Filter transactions from previous month
    const prevTransactions = allTransactions.filter(t =>
      t.amount < 0 &&
      t.date >= prevMonthStart &&
      t.date <= prevMonthEnd
    );

    if (prevTransactions.length === 0) return undefined;

    // Calculate category totals for previous month
    const map = new Map<string | null, number>();
    prevTransactions.forEach(t => {
      const current = map.get(t.categoryId) || 0;
      map.set(t.categoryId, current + Math.abs(t.amount));
    });

    return map;
  }, [allTransactions, selectedPeriod]);

  if (transactions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <ChartEmptyState />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900 dark:text-white">Spending Analysis</h3>
          <div className="flex items-center gap-2">
            {/* Chart Type Toggle */}
            <div className="flex rounded-lg border border-gray-200 dark:border-slate-600 overflow-hidden">
              <button
                onClick={() => setChartType('bar')}
                className={`p-1.5 transition-colors ${
                  chartType === 'bar'
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
                title="Horizontal bar chart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h10M4 18h14"
                  />
                </svg>
              </button>
              <button
                onClick={() => setChartType('bar-vertical')}
                className={`p-1.5 transition-colors border-l border-gray-200 dark:border-slate-600 ${
                  chartType === 'bar-vertical'
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
                title="Vertical bar chart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </button>
              <button
                onClick={() => setChartType('donut')}
                className={`p-1.5 transition-colors border-l border-gray-200 dark:border-slate-600 ${
                  chartType === 'donut'
                    ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : 'bg-white dark:bg-slate-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
                }`}
                title="Donut chart"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
                  />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
          <div className="text-center p-2 sm:p-3 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
            <p className="text-[10px] sm:text-xs text-danger-600 dark:text-danger-400 mb-0.5 sm:mb-1">Expenses</p>
            <p className="text-sm sm:text-lg font-bold text-danger-700 dark:text-danger-400">-{formatAmount(totalExpenses)}</p>
          </div>
          <div className="text-center p-2 sm:p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
            <p className="text-[10px] sm:text-xs text-success-600 dark:text-success-400 mb-0.5 sm:mb-1">Income</p>
            <p className="text-sm sm:text-lg font-bold text-success-700 dark:text-success-400">+{formatAmount(totalIncome)}</p>
          </div>
          <div className={`text-center p-2 sm:p-3 rounded-lg ${totalIncome - totalExpenses >= 0 ? 'bg-success-50 dark:bg-success-900/20' : 'bg-danger-50 dark:bg-danger-900/20'}`}>
            <p className={`text-[10px] sm:text-xs mb-0.5 sm:mb-1 ${totalIncome - totalExpenses >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
              Net
            </p>
            <p className={`text-sm sm:text-lg font-bold ${totalIncome - totalExpenses >= 0 ? 'text-success-700 dark:text-success-400' : 'text-danger-700 dark:text-danger-400'}`}>
              {totalIncome - totalExpenses >= 0 ? '+' : ''}{formatAmount(totalIncome - totalExpenses)}
            </p>
          </div>
          <div className="text-center p-2 sm:p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
            <p className="text-[10px] sm:text-xs text-primary-600 dark:text-primary-400 mb-0.5 sm:mb-1">Daily Avg</p>
            <p className="text-sm sm:text-lg font-bold text-primary-700 dark:text-primary-400">~{formatAmount(dailyAverage)} kr</p>
          </div>
        </div>

        {/* Chart */}
        {categoryTotals.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Expenses by Category
              <span className="text-gray-400 dark:text-gray-500 font-normal ml-2">({categoryTotals.length} categories)</span>
            </h4>
            {chartType === 'bar' && <BarChart categories={categoryTotals} />}
            {chartType === 'bar-vertical' && <VerticalBarChart categories={categoryTotals} />}
            {chartType === 'donut' && (
              <div className="flex justify-center">
                <DonutChart categories={categoryTotals} size={220} />
              </div>
            )}
          </div>
        )}

        {/* Legend for Donut */}
        {chartType === 'donut' && categoryTotals.length > 0 && (
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            {categoryTotals.slice(0, 8).map((category) => (
              <div key={category.categoryId || 'uncategorized'} className="flex items-center gap-1.5">
                <span className="text-base">{category.icon}</span>
                <span className="text-xs text-gray-600 dark:text-gray-400">{category.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Trends & Averages Section */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mb-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Trends & Averages
          </h4>
          <TrendSection
            transactions={transactions}
            selectedPeriod={selectedPeriod}
            allTransactions={allTransactions}
          />
        </div>

        {/* Spending Calendar */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mb-4">
          <SpendingCalendar transactions={allTransactions} />
        </div>

        {/* Monthly Comparison Chart */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-4 mb-4">
          <MonthlyComparisonChart transactions={allTransactions} maxMonths={6} />
        </div>

        {/* Category Totals Table */}
        <div className="border-t border-gray-200 dark:border-slate-700 pt-4">
          <CategoryTotalsTable
            categories={categoryTotals}
            previousMonthCategories={previousMonthCategories}
          />
        </div>
      </div>
    </div>
  );
}

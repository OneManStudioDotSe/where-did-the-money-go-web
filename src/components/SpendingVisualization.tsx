import { useState, useMemo } from 'react';
import type { Transaction } from '../types/transaction';
import type { TimePeriod } from './TimePeriodSelector';
import { getCategoryName, getCategoryColor, getCategoryIcon, getSubcategoryName } from '../utils/category-service';

interface SpendingVisualizationProps {
  transactions: Transaction[];
  selectedPeriod: TimePeriod | null;
  allTransactions: Transaction[]; // For calculating trends/averages
}

type ChartType = 'bar' | 'bar-vertical' | 'donut';
type ViewMode = 'category' | 'subcategory';

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
              <p className="text-sm font-medium text-gray-900">{hoveredCategory.percentage.toFixed(1)}%</p>
              <p className="text-xs text-gray-500">{formatAmount(hoveredCategory.total)} kr</p>
            </>
          ) : (
            <>
              <p className="text-sm font-medium text-gray-900">Total</p>
              <p className="text-lg font-bold text-gray-900">{formatAmount(total)} kr</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function BarChart({ categories, maxBars = 10 }: { categories: CategoryTotal[]; maxBars?: number }) {
  const displayCategories = categories.slice(0, maxBars);
  const maxValue = Math.max(...displayCategories.map((c) => c.total));

  return (
    <div className="space-y-2">
      {displayCategories.map((category) => {
        const barWidth = maxValue > 0 ? (category.total / maxValue) * 100 : 0;

        return (
          <div key={category.categoryId || 'uncategorized'} className="group">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{category.icon}</span>
              <span className="text-sm font-medium text-gray-700 flex-1 truncate">
                {category.name}
              </span>
              <span className="text-sm text-gray-500">{category.percentage.toFixed(1)}%</span>
              <span className="text-sm font-semibold text-gray-900 min-w-[80px] text-right">
                {formatAmount(category.total)} kr
              </span>
            </div>
            <div className="h-6 bg-gray-100 rounded-lg overflow-hidden">
              <div
                className="h-full rounded-lg transition-all duration-300 group-hover:brightness-110 flex items-center justify-end pr-2"
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
        );
      })}
    </div>
  );
}

function VerticalBarChart({ categories, maxBars = 8 }: { categories: CategoryTotal[]; maxBars?: number }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const displayCategories = categories.slice(0, maxBars);
  const maxValue = Math.max(...displayCategories.map((c) => c.total));
  const chartHeight = 180;

  return (
    <div>
      <div className="flex items-end justify-center gap-2" style={{ height: chartHeight }}>
        {displayCategories.map((category, index) => {
          const barHeight = maxValue > 0 ? (category.total / maxValue) * (chartHeight - 30) : 0;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={category.categoryId || 'uncategorized'}
              className="flex flex-col items-center"
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
            >
              {/* Tooltip on hover */}
              {isHovered && (
                <div className="absolute -mt-16 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-lg whitespace-nowrap z-10">
                  {category.name}: {formatAmount(category.total)} kr ({category.percentage.toFixed(1)}%)
                </div>
              )}
              {/* Bar */}
              <div
                className="w-8 rounded-t-md transition-all duration-300"
                style={{
                  height: `${barHeight}px`,
                  backgroundColor: category.color,
                  opacity: isHovered ? 1 : 0.85,
                  transform: isHovered ? 'scaleY(1.02)' : 'scaleY(1)',
                  transformOrigin: 'bottom',
                }}
              />
              {/* Icon */}
              <div className="mt-2 text-base">{category.icon}</div>
            </div>
          );
        })}
      </div>
      {/* Y-axis labels */}
      <div className="flex justify-between text-xs text-gray-400 mt-2 px-4">
        <span>0</span>
        <span>{formatAmount(maxValue / 2)} kr</span>
        <span>{formatAmount(maxValue)} kr</span>
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
      <div className="text-center py-6 text-gray-500">
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
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">This {selectedPeriod.type}</p>
          <p className="text-lg font-bold text-gray-900">{formatAmount(trendData.currentTotal)} kr</p>
          <div className="flex items-center gap-1 mt-1">
            {trendData.totalDiff !== 0 && (
              <span
                className={`text-xs font-medium ${
                  trendData.totalDiff > 0 ? 'text-danger-600' : 'text-success-600'
                }`}
              >
                {trendData.totalDiff > 0 ? '↑' : '↓'} {Math.abs(trendData.totalDiff).toFixed(1)}%
              </span>
            )}
            <span className="text-xs text-gray-400">vs avg</span>
          </div>
        </div>

        {/* Average */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">{periodLabel} Average</p>
          <p className="text-lg font-bold text-gray-900">{formatAmount(trendData.avgTotal)} kr</p>
          <p className="text-xs text-gray-400 mt-1">
            Based on {trendData.periodCount} {selectedPeriod.type}s
          </p>
        </div>

        {/* Transaction Count */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Transactions</p>
          <p className="text-lg font-bold text-gray-900">{trendData.currentCount}</p>
          <div className="flex items-center gap-1 mt-1">
            {trendData.countDiff !== 0 && (
              <span
                className={`text-xs font-medium ${
                  trendData.countDiff > 0 ? 'text-danger-600' : 'text-success-600'
                }`}
              >
                {trendData.countDiff > 0 ? '↑' : '↓'} {Math.abs(trendData.countDiff).toFixed(1)}%
              </span>
            )}
            <span className="text-xs text-gray-400">vs avg {trendData.avgCount.toFixed(0)}</span>
          </div>
        </div>

        {/* Daily Average */}
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-xs text-gray-500 mb-1">Daily Average</p>
          <p className="text-lg font-bold text-gray-900">{formatAmount(trendData.dailyAvg)} kr</p>
          <p className="text-xs text-gray-400 mt-1">This period</p>
        </div>
      </div>
    </div>
  );
}

function CategoryTotalsTable({
  categories,
  viewMode,
  onViewModeChange,
}: {
  categories: CategoryTotal[];
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
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
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-700">Category Breakdown</h4>
        <div className="flex rounded-lg border border-gray-200 overflow-hidden">
          <button
            onClick={() => onViewModeChange('category')}
            className={`px-3 py-1 text-xs font-medium transition-colors ${
              viewMode === 'category'
                ? 'bg-primary-50 text-primary-700'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Categories
          </button>
          <button
            onClick={() => onViewModeChange('subcategory')}
            className={`px-3 py-1 text-xs font-medium transition-colors border-l border-gray-200 ${
              viewMode === 'subcategory'
                ? 'bg-primary-50 text-primary-700'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Subcategories
          </button>
        </div>
      </div>

      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-gray-600">Category</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600">Amount</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600">%</th>
              <th className="text-right px-3 py-2 font-medium text-gray-600">#</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {categories.map((category) => {
              const key = category.categoryId || 'uncategorized';
              const isExpanded = expandedCategories.has(key);
              const hasSubcategories = category.subcategories.length > 1;

              return (
                <>
                  <tr
                    key={key}
                    className={`hover:bg-gray-50 ${hasSubcategories ? 'cursor-pointer' : ''}`}
                    onClick={() => hasSubcategories && toggleExpand(category.categoryId)}
                  >
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-2">
                        {hasSubcategories && (
                          <svg
                            className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
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
                        <span className="font-medium text-gray-900">{category.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-900">
                      {formatAmount(category.total)} kr
                    </td>
                    <td className="px-3 py-2 text-right text-gray-600">
                      {category.percentage.toFixed(1)}%
                    </td>
                    <td className="px-3 py-2 text-right text-gray-500">{category.count}</td>
                  </tr>
                  {isExpanded &&
                    viewMode === 'subcategory' &&
                    category.subcategories.map((sub) => (
                      <tr key={`${key}-${sub.subcategoryId}`} className="bg-gray-50/50">
                        <td className="px-3 py-1.5 pl-14">
                          <span className="text-gray-600">{sub.name}</span>
                        </td>
                        <td className="px-3 py-1.5 text-right text-gray-700">
                          {formatAmount(sub.total)} kr
                        </td>
                        <td className="px-3 py-1.5 text-right text-gray-500 text-xs">
                          {sub.percentage.toFixed(1)}%
                        </td>
                        <td className="px-3 py-1.5 text-right text-gray-400">{sub.count}</td>
                      </tr>
                    ))}
                </>
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
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [viewMode, setViewMode] = useState<ViewMode>('category');

  const categoryTotals = useMemo(() => calculateCategoryTotals(transactions), [transactions]);

  const expenses = transactions.filter((t) => t.amount < 0);
  const income = transactions.filter((t) => t.amount > 0);
  const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);

  if (transactions.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center py-8 text-gray-500">
          <svg
            className="w-16 h-16 mx-auto mb-4 text-gray-300"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
          <p>No transactions to visualize</p>
          <p className="text-sm mt-1">Select a time period with transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-gray-900">Spending Analysis</h3>
          <div className="flex items-center gap-2">
            {/* Chart Type Toggle */}
            <div className="flex rounded-lg border border-gray-200 overflow-hidden">
              <button
                onClick={() => setChartType('bar')}
                className={`p-1.5 transition-colors ${
                  chartType === 'bar'
                    ? 'bg-primary-50 text-primary-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="Horizontal Bar Chart"
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
                className={`p-1.5 transition-colors border-l border-gray-200 ${
                  chartType === 'bar-vertical'
                    ? 'bg-primary-50 text-primary-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="Vertical Bar Chart"
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
                className={`p-1.5 transition-colors border-l border-gray-200 ${
                  chartType === 'donut'
                    ? 'bg-primary-50 text-primary-700'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
                title="Donut Chart"
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

      <div className="p-4">
        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="text-center p-3 bg-danger-50 rounded-lg">
            <p className="text-xs text-danger-600 mb-1">Expenses</p>
            <p className="text-lg font-bold text-danger-700">-{formatAmount(totalExpenses)} kr</p>
          </div>
          <div className="text-center p-3 bg-success-50 rounded-lg">
            <p className="text-xs text-success-600 mb-1">Income</p>
            <p className="text-lg font-bold text-success-700">+{formatAmount(totalIncome)} kr</p>
          </div>
          <div className={`text-center p-3 rounded-lg ${totalIncome - totalExpenses >= 0 ? 'bg-success-50' : 'bg-danger-50'}`}>
            <p className={`text-xs mb-1 ${totalIncome - totalExpenses >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
              Net
            </p>
            <p className={`text-lg font-bold ${totalIncome - totalExpenses >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
              {totalIncome - totalExpenses >= 0 ? '+' : ''}{formatAmount(totalIncome - totalExpenses)} kr
            </p>
          </div>
        </div>

        {/* Chart */}
        {categoryTotals.length > 0 && (
          <div className="mb-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">
              Expenses by Category
              <span className="text-gray-400 font-normal ml-2">({categoryTotals.length} categories)</span>
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
          <div className="flex flex-wrap gap-2 justify-center mb-6">
            {categoryTotals.slice(0, 8).map((category) => (
              <div key={category.categoryId || 'uncategorized'} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-sm"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-xs text-gray-600">{category.name}</span>
              </div>
            ))}
          </div>
        )}

        {/* Trends & Averages Section */}
        <div className="border-t border-gray-200 pt-4 mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Trends & Averages
          </h4>
          <TrendSection
            transactions={transactions}
            selectedPeriod={selectedPeriod}
            allTransactions={allTransactions}
          />
        </div>

        {/* Category Totals Table */}
        <div className="border-t border-gray-200 pt-4">
          <CategoryTotalsTable
            categories={categoryTotals}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>
      </div>
    </div>
  );
}

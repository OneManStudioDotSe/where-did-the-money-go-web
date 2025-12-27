import { useMemo } from 'react';
import type { Transaction } from '../types/transaction';

interface DayOfWeekAnalysisProps {
  transactions: Transaction[];
  className?: string;
}

interface DayStats {
  day: string;
  shortDay: string;
  total: number;
  count: number;
  average: number;
  percentage: number;
}

function formatAmount(amount: number): string {
  return Math.abs(amount).toLocaleString('sv-SE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function DayOfWeekAnalysis({ transactions, className = '' }: DayOfWeekAnalysisProps) {
  const dayStats = useMemo(() => {
    const expenses = transactions.filter(t => t.amount < 0);

    // Initialize stats for each day
    const stats: DayStats[] = DAYS.map((day, index) => ({
      day,
      shortDay: SHORT_DAYS[index],
      total: 0,
      count: 0,
      average: 0,
      percentage: 0,
    }));

    // Aggregate expenses by day of week
    expenses.forEach(t => {
      const dayIndex = t.date.getDay();
      stats[dayIndex].total += Math.abs(t.amount);
      stats[dayIndex].count += 1;
    });

    // Calculate totals and percentages
    const totalExpenses = stats.reduce((sum, s) => sum + s.total, 0);
    const maxTotal = Math.max(...stats.map(s => s.total));

    stats.forEach(s => {
      s.average = s.count > 0 ? s.total / s.count : 0;
      s.percentage = totalExpenses > 0 ? (s.total / totalExpenses) * 100 : 0;
    });

    // Reorder to start from Monday
    const mondayFirst = [...stats.slice(1), stats[0]];

    return {
      days: mondayFirst,
      maxTotal,
      totalExpenses,
      busiestDay: mondayFirst.reduce((max, s) => s.total > max.total ? s : max, mondayFirst[0]),
      quietestDay: mondayFirst.reduce((min, s) => s.total < min.total ? s : min, mondayFirst[0]),
    };
  }, [transactions]);

  const getIntensityColor = (total: number): string => {
    if (dayStats.maxTotal === 0) return 'bg-gray-100 dark:bg-slate-700';
    const ratio = total / dayStats.maxTotal;
    if (ratio < 0.2) return 'bg-emerald-100 dark:bg-emerald-900/30';
    if (ratio < 0.4) return 'bg-emerald-200 dark:bg-emerald-800/40';
    if (ratio < 0.6) return 'bg-amber-200 dark:bg-amber-800/40';
    if (ratio < 0.8) return 'bg-orange-300 dark:bg-orange-700/50';
    return 'bg-rose-400 dark:bg-rose-600/60';
  };

  const getTextColor = (total: number): string => {
    if (dayStats.maxTotal === 0) return 'text-gray-600 dark:text-gray-400';
    const ratio = total / dayStats.maxTotal;
    if (ratio < 0.6) return 'text-gray-700 dark:text-gray-200';
    return 'text-gray-900 dark:text-white';
  };

  if (transactions.length === 0) {
    return (
      <div className={`text-center py-8 text-gray-500 dark:text-gray-400 ${className}`}>
        <p>No transaction data available</p>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Heatmap Grid */}
      <div className="grid grid-cols-7 gap-2 mb-6">
        {dayStats.days.map((stat) => (
          <div
            key={stat.day}
            className={`aspect-square rounded-lg ${getIntensityColor(stat.total)} flex flex-col items-center justify-center p-2 transition-all hover:scale-105`}
          >
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {stat.shortDay}
            </span>
            <span className={`text-sm font-bold ${getTextColor(stat.total)}`}>
              {formatAmount(stat.total)}
            </span>
            <span className="text-[10px] text-gray-500 dark:text-gray-400">
              {stat.count} txn
            </span>
          </div>
        ))}
      </div>

      {/* Bar Chart */}
      <div className="space-y-2 mb-6">
        {dayStats.days.map((stat) => {
          const barWidth = dayStats.maxTotal > 0 ? (stat.total / dayStats.maxTotal) * 100 : 0;
          const isBusiest = stat.day === dayStats.busiestDay.day;
          const isQuietest = stat.day === dayStats.quietestDay.day && stat.total > 0;

          return (
            <div key={stat.day} className="flex items-center gap-3">
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 w-8">
                {stat.shortDay}
              </span>
              <div className="flex-1 h-6 bg-gray-100 dark:bg-slate-700 rounded overflow-hidden">
                <div
                  className={`h-full rounded transition-all duration-500 flex items-center justify-end pr-2 ${
                    isBusiest
                      ? 'bg-rose-500 dark:bg-rose-500'
                      : isQuietest
                        ? 'bg-emerald-500 dark:bg-emerald-500'
                        : 'bg-primary-500 dark:bg-primary-500'
                  }`}
                  style={{ width: `${barWidth}%`, minWidth: barWidth > 0 ? '40px' : '0' }}
                >
                  {barWidth > 20 && (
                    <span className="text-xs font-medium text-white">
                      {stat.percentage.toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>
              <span className="text-xs font-semibold text-gray-900 dark:text-white w-20 text-right">
                {formatAmount(stat.total)} kr
              </span>
            </div>
          );
        })}
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-3">
          <p className="text-xs text-rose-600 dark:text-rose-400 mb-1">Highest Spending Day</p>
          <p className="text-base font-bold text-rose-700 dark:text-rose-300">
            {dayStats.busiestDay.day}
          </p>
          <p className="text-xs text-rose-500 dark:text-rose-400">
            {formatAmount(dayStats.busiestDay.total)} kr ({dayStats.busiestDay.percentage.toFixed(1)}%)
          </p>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-1">Lowest Spending Day</p>
          <p className="text-base font-bold text-emerald-700 dark:text-emerald-300">
            {dayStats.quietestDay.day}
          </p>
          <p className="text-xs text-emerald-500 dark:text-emerald-400">
            {formatAmount(dayStats.quietestDay.total)} kr ({dayStats.quietestDay.percentage.toFixed(1)}%)
          </p>
        </div>
      </div>

      {/* Weekend vs Weekday comparison */}
      <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Weekdays (Mon-Fri)</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatAmount(dayStats.days.slice(0, 5).reduce((sum, s) => sum + s.total, 0))} kr
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500 dark:text-gray-400">Weekend (Sat-Sun)</p>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {formatAmount(dayStats.days.slice(5).reduce((sum, s) => sum + s.total, 0))} kr
            </p>
          </div>
        </div>
        <div className="mt-2 h-2 bg-gray-200 dark:bg-slate-600 rounded-full overflow-hidden flex">
          {(() => {
            const weekdayTotal = dayStats.days.slice(0, 5).reduce((sum, s) => sum + s.total, 0);
            const weekendTotal = dayStats.days.slice(5).reduce((sum, s) => sum + s.total, 0);
            const total = weekdayTotal + weekendTotal;
            const weekdayPct = total > 0 ? (weekdayTotal / total) * 100 : 50;
            return (
              <>
                <div
                  className="h-full bg-primary-500"
                  style={{ width: `${weekdayPct}%` }}
                />
                <div
                  className="h-full bg-amber-500"
                  style={{ width: `${100 - weekdayPct}%` }}
                />
              </>
            );
          })()}
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-primary-600 dark:text-primary-400">
            {((dayStats.days.slice(0, 5).reduce((sum, s) => sum + s.total, 0) / dayStats.totalExpenses) * 100).toFixed(0)}% weekdays
          </span>
          <span className="text-[10px] text-amber-600 dark:text-amber-400">
            {((dayStats.days.slice(5).reduce((sum, s) => sum + s.total, 0) / dayStats.totalExpenses) * 100).toFixed(0)}% weekend
          </span>
        </div>
      </div>
    </div>
  );
}

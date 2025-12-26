import { useState, useMemo } from 'react';
import type { Transaction } from '../types/transaction';

interface SpendingCalendarProps {
  transactions: Transaction[];
  className?: string;
}

interface DailySpending {
  date: Date;
  total: number;
  count: number;
}

function formatAmount(amount: number): string {
  return Math.abs(amount).toLocaleString('sv-SE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Spending calendar showing daily totals in a heatmap-style grid */
export function SpendingCalendar({ transactions, className = '' }: SpendingCalendarProps) {
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

  // Calculate total and average for the displayed month
  const monthStats = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    let total = 0;
    let daysWithSpending = 0;

    dailySpending.forEach((spending, dateKey) => {
      const date = new Date(dateKey);
      if (date.getFullYear() === year && date.getMonth() === month) {
        total += spending.total;
        daysWithSpending++;
      }
    });

    return {
      total,
      daysWithSpending,
      average: daysWithSpending > 0 ? total / daysWithSpending : 0,
    };
  }, [dailySpending, currentMonth]);

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

  const goToToday = () => {
    setCurrentMonth(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
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

  const isCurrentMonth = currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth();

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Spending Calendar
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Daily spending heatmap
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrevMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            title="Previous month"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              isCurrentMonth
                ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
            title="Go to current month"
          >
            Today
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            title="Next month"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Month label */}
      <div className="text-center mb-4">
        <span className="text-base font-medium text-gray-700 dark:text-gray-300">
          {monthLabel}
        </span>
      </div>

      {/* Month stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Month Total</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatAmount(monthStats.total)} kr
          </p>
        </div>
        <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
          <p className="text-xs text-gray-500 dark:text-gray-400">Daily Average</p>
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {formatAmount(monthStats.average)} kr
          </p>
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
      <div className="flex items-center justify-end gap-2 mt-4">
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

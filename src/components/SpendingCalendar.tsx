import { useState, useMemo, useEffect } from 'react';
import type { Transaction } from '../types/transaction';
import { getCategoryName, getSubcategoryName, getCategoryColor, getCategoryIcon } from '../utils/category-service';
import { toTitleCase } from '../utils/text-utils';

interface SpendingCalendarProps {
  transactions: Transaction[];
  className?: string;
  /** Optional: sync with external month selection (e.g., from TimePeriodSelector) */
  selectedMonth?: Date;
  /** Hide the internal header (title, subtitle) when used inside another card */
  hideHeader?: boolean;
}

interface DailySpending {
  date: Date;
  total: number;
  count: number;
  transactions: Transaction[];
}

function formatAmount(amount: number): string {
  return Math.abs(amount).toLocaleString('sv-SE', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

/** Spending calendar showing daily totals in a heatmap-style grid */
export function SpendingCalendar({ transactions, className = '', selectedMonth: externalMonth, hideHeader = false }: SpendingCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    // Use external month if provided, otherwise start with the most recent transaction month
    if (externalMonth) {
      return new Date(externalMonth.getFullYear(), externalMonth.getMonth(), 1);
    }
    if (transactions.length > 0) {
      const sorted = [...transactions].sort((a, b) => b.date.getTime() - a.date.getTime());
      return new Date(sorted[0].date.getFullYear(), sorted[0].date.getMonth(), 1);
    }
    return new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  });

  // State for day detail dialog
  const [selectedDay, setSelectedDay] = useState<DailySpending | null>(null);

  // Sync with external month selection
  useEffect(() => {
    if (externalMonth) {
      setCurrentMonth(new Date(externalMonth.getFullYear(), externalMonth.getMonth(), 1));
    }
  }, [externalMonth]);

  // Calculate daily spending for ALL transactions (not just current month)
  // This ensures proper color scaling across months
  const dailySpending = useMemo(() => {
    const map = new Map<string, DailySpending>();
    const expenses = transactions.filter(t => t.amount < 0);

    expenses.forEach(t => {
      const dateKey = t.date.toISOString().split('T')[0];
      const existing = map.get(dateKey) || { date: t.date, total: 0, count: 0, transactions: [] };
      existing.total += Math.abs(t.amount);
      existing.count += 1;
      existing.transactions.push(t);
      map.set(dateKey, existing);
    });

    return map;
  }, [transactions]);

  // Get max spending for the CURRENT MONTH only (for proper color scaling)
  const maxSpendingThisMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    let max = 0;

    dailySpending.forEach((d, dateKey) => {
      const date = new Date(dateKey);
      if (date.getFullYear() === year && date.getMonth() === month) {
        if (d.total > max) max = d.total;
      }
    });

    return max;
  }, [dailySpending, currentMonth]);

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
    if (amount === 0 || maxSpendingThisMonth === 0) return 'bg-gray-50 dark:bg-slate-700/50';
    const ratio = amount / maxSpendingThisMonth;
    if (ratio < 0.2) return 'bg-rose-100 dark:bg-rose-900/30';
    if (ratio < 0.4) return 'bg-rose-200 dark:bg-rose-800/40';
    if (ratio < 0.6) return 'bg-rose-300 dark:bg-rose-700/50';
    if (ratio < 0.8) return 'bg-rose-400 dark:bg-rose-600/60';
    return 'bg-rose-500 dark:bg-rose-500/70';
  };

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const isCurrentMonth = currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() === today.getMonth();

  const handleDayClick = (day: Date) => {
    const dateKey = day.toISOString().split('T')[0];
    const spending = dailySpending.get(dateKey);
    if (spending && spending.count > 0) {
      setSelectedDay(spending);
    }
  };

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-slate-700 ${className}`}>
      {/* Header - only show if not hidden */}
      {!hideHeader && (
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Spending Calendar
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Daily spending heatmap
            </p>
          </div>
        </div>
      )}

      {/* Month navigation and label */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPrevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
          title="Previous month"
        >
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <span className="text-base font-medium text-gray-700 dark:text-gray-300">
            {monthLabel}
          </span>
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
        </div>
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
          const hasSpending = amount > 0;

          return (
            <button
              key={dateKey}
              onClick={() => handleDayClick(day)}
              disabled={!hasSpending}
              className={`aspect-square rounded-md relative transition-all ${getSpendingIntensity(amount)} ${
                isToday ? 'ring-2 ring-primary-500' : ''
              } ${hasSpending ? 'cursor-pointer hover:ring-2 hover:ring-gray-400 dark:hover:ring-gray-500' : 'cursor-default'}`}
            >
              {/* Day number - top left */}
              <span className={`absolute top-0.5 left-1 text-[10px] font-medium ${
                hasSpending ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'
              }`}>
                {day.getDate()}
              </span>

              {/* Amount - centered and larger */}
              {hasSpending && (
                <span className="absolute inset-0 flex items-center justify-center pt-2 text-[11px] font-bold text-gray-800 dark:text-gray-100">
                  {formatAmount(amount)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-2 mt-4">
        <span className="text-[10px] text-gray-400">Less</span>
        <div className="flex gap-0.5">
          <div className="w-3 h-3 rounded-sm bg-gray-50 dark:bg-slate-700/50" />
          <div className="w-3 h-3 rounded-sm bg-rose-100 dark:bg-rose-900/30" />
          <div className="w-3 h-3 rounded-sm bg-rose-200 dark:bg-rose-800/40" />
          <div className="w-3 h-3 rounded-sm bg-rose-300 dark:bg-rose-700/50" />
          <div className="w-3 h-3 rounded-sm bg-rose-400 dark:bg-rose-600/60" />
          <div className="w-3 h-3 rounded-sm bg-rose-500 dark:bg-rose-500/70" />
        </div>
        <span className="text-[10px] text-gray-400">More</span>
      </div>

      {/* Day Detail Dialog */}
      {selectedDay && (
        <DayDetailDialog
          spending={selectedDay}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </div>
  );
}

// Day Detail Dialog Component
interface DayDetailDialogProps {
  spending: DailySpending;
  onClose: () => void;
}

function DayDetailDialog({ spending, onClose }: DayDetailDialogProps) {
  const dateLabel = spending.date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  // Sort transactions by amount (largest first)
  const sortedTransactions = [...spending.transactions].sort(
    (a, b) => Math.abs(b.amount) - Math.abs(a.amount)
  );

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-700/50">
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white">
              {dateLabel}
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {spending.count} transaction{spending.count !== 1 ? 's' : ''} • {formatAmount(spending.total)} kr total
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Transactions list */}
        <div className="max-h-[60vh] overflow-y-auto p-4">
          <div className="space-y-2">
            {sortedTransactions.map((transaction) => {
              const categoryColor = transaction.categoryId ? getCategoryColor(transaction.categoryId) : '#9ca3af';
              const categoryIcon = transaction.categoryId ? getCategoryIcon(transaction.categoryId) : '📦';
              const categoryName = transaction.categoryId ? getCategoryName(transaction.categoryId) : 'Uncategorized';
              const subcategoryName = transaction.subcategoryId && transaction.categoryId
                ? getSubcategoryName(transaction.categoryId, transaction.subcategoryId)
                : null;

              return (
                <div
                  key={transaction.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                >
                  {/* Category icon */}
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                    style={{ backgroundColor: `${categoryColor}20` }}
                  >
                    {categoryIcon}
                  </div>

                  {/* Description and category */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {toTitleCase(transaction.description)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                      {categoryName}
                      {subcategoryName && <span className="text-gray-400 dark:text-gray-500"> › {subcategoryName}</span>}
                    </p>
                  </div>

                  {/* Amount */}
                  <span className="text-sm font-semibold text-gray-900 dark:text-white flex-shrink-0">
                    {formatAmount(Math.abs(transaction.amount))} kr
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

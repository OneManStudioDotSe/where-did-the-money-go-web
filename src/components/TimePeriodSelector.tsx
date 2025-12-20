import { useState, useMemo, useEffect } from 'react';
import type { Transaction, TransactionGrouping } from '../types/transaction';

interface TimePeriod {
  type: TransactionGrouping;
  start: Date;
  end: Date;
  label: string;
  shortLabel: string;
}

interface TimePeriodSelectorProps {
  transactions: Transaction[];
  onPeriodChange: (period: TimePeriod | null) => void;
  selectedPeriod: TimePeriod | null;
}

const periodTypeConfig: Record<TransactionGrouping, { icon: string; label: string }> = {
  day: { icon: '📅', label: 'Day' },
  week: { icon: '📆', label: 'Week' },
  month: { icon: '🗓️', label: 'Month' },
  quarter: { icon: '📊', label: 'Quarter' },
  year: { icon: '📈', label: 'Year' },
};

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getQuarter(date: Date): number {
  return Math.floor(date.getMonth() / 3) + 1;
}

function formatSwedishDate(date: Date): string {
  return date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' });
}

function getAdjustedMonth(date: Date, monthStartDay: number): { month: number; year: number } {
  // If the date is before the month start day, it belongs to the previous month
  if (date.getDate() < monthStartDay) {
    const prevMonth = date.getMonth() === 0 ? 11 : date.getMonth() - 1;
    const prevYear = date.getMonth() === 0 ? date.getFullYear() - 1 : date.getFullYear();
    return { month: prevMonth, year: prevYear };
  }
  return { month: date.getMonth(), year: date.getFullYear() };
}

function getPeriodsFromTransactions(
  transactions: Transaction[],
  type: TransactionGrouping,
  monthStartDay: number = 1
): TimePeriod[] {
  if (transactions.length === 0) return [];

  const periodsMap = new Map<string, TimePeriod>();

  transactions.forEach((t) => {
    const date = t.date;
    let key: string;
    let start: Date;
    let end: Date;
    let label: string;
    let shortLabel: string;

    switch (type) {
      case 'day': {
        key = date.toISOString().split('T')[0];
        start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
        label = formatSwedishDate(date);
        shortLabel = date.toLocaleDateString('sv-SE', { day: 'numeric', month: 'short' });
        break;
      }
      case 'week': {
        const weekNum = getWeekNumber(date);
        const year = date.getFullYear();
        key = `${year}-W${weekNum.toString().padStart(2, '0')}`;
        // Get Monday of this week
        const dayOfWeek = date.getDay() || 7;
        start = new Date(date);
        start.setDate(date.getDate() - dayOfWeek + 1);
        start.setHours(0, 0, 0, 0);
        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
        label = `Week ${weekNum}, ${year}`;
        shortLabel = `W${weekNum}`;
        break;
      }
      case 'month': {
        // Use adjusted month based on custom start day
        const adjusted = getAdjustedMonth(date, monthStartDay);
        key = `${adjusted.year}-${(adjusted.month + 1).toString().padStart(2, '0')}`;

        // Start date: monthStartDay of the adjusted month
        start = new Date(adjusted.year, adjusted.month, monthStartDay);
        start.setHours(0, 0, 0, 0);

        // End date: day before monthStartDay of the next month
        const nextMonth = adjusted.month === 11 ? 0 : adjusted.month + 1;
        const nextYear = adjusted.month === 11 ? adjusted.year + 1 : adjusted.year;
        end = new Date(nextYear, nextMonth, monthStartDay - 1);
        end.setHours(23, 59, 59, 999);

        // Label shows the month name
        const labelDate = new Date(adjusted.year, adjusted.month, 15);
        label = labelDate.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' });
        if (monthStartDay !== 1) {
          label += ` (${monthStartDay}th)`;
        }
        shortLabel = labelDate.toLocaleDateString('sv-SE', { month: 'short' });
        break;
      }
      case 'quarter': {
        const quarter = getQuarter(date);
        const year = date.getFullYear();
        key = `${year}-Q${quarter}`;
        start = new Date(year, (quarter - 1) * 3, 1);
        end = new Date(year, quarter * 3, 0, 23, 59, 59, 999);
        label = `Q${quarter} ${year}`;
        shortLabel = `Q${quarter}`;
        break;
      }
      case 'year': {
        const year = date.getFullYear();
        key = year.toString();
        start = new Date(year, 0, 1);
        end = new Date(year, 11, 31, 23, 59, 59, 999);
        label = year.toString();
        shortLabel = year.toString();
        break;
      }
    }

    if (!periodsMap.has(key)) {
      periodsMap.set(key, { type, start, end, label, shortLabel });
    }
  });

  // Sort by start date (most recent first)
  return Array.from(periodsMap.values()).sort((a, b) => b.start.getTime() - a.start.getTime());
}

export function TimePeriodSelector({
  transactions,
  onPeriodChange,
  selectedPeriod,
}: TimePeriodSelectorProps) {
  // Initialize activePeriodType from selectedPeriod to persist across tab switches
  const [activePeriodType, setActivePeriodType] = useState<TransactionGrouping | null>(
    selectedPeriod?.type ?? null
  );
  const [monthStartDay, setMonthStartDay] = useState<number>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('period-month-start-day');
    return saved ? parseInt(saved, 10) : 1;
  });
  const [showSettings, setShowSettings] = useState(false);

  // Sync activePeriodType when selectedPeriod changes (e.g., when switching tabs)
  useEffect(() => {
    if (selectedPeriod) {
      setActivePeriodType(selectedPeriod.type);
    }
  }, [selectedPeriod]);

  const availablePeriods = useMemo(() => {
    if (!activePeriodType) return [];
    return getPeriodsFromTransactions(transactions, activePeriodType, monthStartDay);
  }, [transactions, activePeriodType, monthStartDay]);

  const handlePeriodTypeClick = (type: TransactionGrouping) => {
    if (activePeriodType === type) {
      // Toggle off
      setActivePeriodType(null);
      onPeriodChange(null);
    } else {
      setActivePeriodType(type);
      // Don't auto-select, let user pick
    }
  };

  const handlePeriodSelect = (period: TimePeriod) => {
    if (
      selectedPeriod &&
      selectedPeriod.start.getTime() === period.start.getTime() &&
      selectedPeriod.end.getTime() === period.end.getTime()
    ) {
      // Deselect
      onPeriodChange(null);
    } else {
      onPeriodChange(period);
    }
  };

  const handleClearPeriod = () => {
    setActivePeriodType(null);
    onPeriodChange(null);
  };

  const handleMonthStartDayChange = (day: number) => {
    setMonthStartDay(day);
    localStorage.setItem('period-month-start-day', day.toString());
    // Clear selection when changing the start day
    if (selectedPeriod?.type === 'month') {
      onPeriodChange(null);
    }
  };

  // Calculate transaction counts per period type for preview
  const periodTypeCounts = useMemo(() => {
    const counts: Record<TransactionGrouping, number> = {
      day: 0,
      week: 0,
      month: 0,
      quarter: 0,
      year: 0,
    };

    const types: TransactionGrouping[] = ['day', 'week', 'month', 'quarter', 'year'];
    types.forEach((type) => {
      counts[type] = getPeriodsFromTransactions(transactions, type, monthStartDay).length;
    });

    return counts;
  }, [transactions, monthStartDay]);

  // Calculate totals for selected period
  const periodTotals = useMemo(() => {
    if (!selectedPeriod) return null;

    const periodTransactions = transactions.filter(
      (t) => t.date >= selectedPeriod.start && t.date <= selectedPeriod.end
    );

    const expenses = periodTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const income = periodTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      expenses,
      income,
      net: income - expenses,
      count: periodTransactions.length,
    };
  }, [transactions, selectedPeriod]);

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 mb-6">
      {/* Period Type Selector */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 dark:text-white">View by Time Period</h3>
          {selectedPeriod && (
            <button
              onClick={handleClearPeriod}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
            >
              Clear selection
            </button>
          )}
        </div>

        {/* Period Type Buttons + Settings Button (inline) */}
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(periodTypeConfig) as TransactionGrouping[]).map((type) => {
            const config = periodTypeConfig[type];
            const isActive = activePeriodType === type;
            const count = periodTypeCounts[type];

            return (
              <button
                key={type}
                onClick={() => handlePeriodTypeClick(type)}
                disabled={count === 0}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
                  isActive
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                    : count === 0
                    ? 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                    : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-lg">{config.icon}</span>
                <span className="font-medium">{config.label}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-primary-200 dark:bg-primary-800 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}

          {/* Settings Button (inline with period buttons) */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border transition-all ${
              showSettings
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
            }`}
            title="Period settings"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-medium">Settings</span>
          </button>
        </div>

        {/* Settings Panel (collapsible) */}
        {showSettings && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Month Start Day</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Swedish salary is typically paid on the 25th. Set when your month "begins".
                </p>
              </div>
              <select
                value={monthStartDay}
                onChange={(e) => handleMonthStartDayChange(parseInt(e.target.value, 10))}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none"
              >
                {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => (
                  <option key={day} value={day}>
                    {day === 1 ? '1st (default)' : day === 25 ? '25th (Swedish salary)' : `${day}${day === 2 ? 'nd' : day === 3 ? 'rd' : 'th'}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Period Selection Dropdown */}
      {activePeriodType && availablePeriods.length > 0 && (
        <div className="border-t border-gray-200 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
            Select a {periodTypeConfig[activePeriodType].label.toLowerCase()} to view:
          </p>
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
            {availablePeriods.map((period, index) => {
              const isSelected =
                selectedPeriod &&
                selectedPeriod.start.getTime() === period.start.getTime() &&
                selectedPeriod.end.getTime() === period.end.getTime();

              return (
                <button
                  key={index}
                  onClick={() => handlePeriodSelect(period)}
                  className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-500 text-white'
                      : 'border-gray-200 dark:border-slate-600 hover:border-primary-300 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/30 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {period.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Period Info with Large Numbers */}
      {selectedPeriod && periodTotals && (
        <div className="border-t border-gray-200 dark:border-slate-700 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/30">
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{periodTypeConfig[selectedPeriod.type].icon}</span>
                <div>
                  <p className="font-semibold text-primary-900 dark:text-primary-100 text-lg">{selectedPeriod.label}</p>
                  <p className="text-xs text-primary-700 dark:text-primary-300">
                    {formatSwedishDate(selectedPeriod.start)} — {formatSwedishDate(selectedPeriod.end)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => onPeriodChange(null)}
                className="p-2 hover:bg-primary-200 dark:hover:bg-primary-800/50 rounded-lg transition-colors"
              >
                <svg
                  className="w-5 h-5 text-primary-600 dark:text-primary-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Large Period Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Transactions</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{periodTotals.count}</p>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Expenses</p>
                <p className="text-2xl font-bold text-danger-600 dark:text-danger-400">
                  -{periodTotals.expenses.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kr
                </p>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Income</p>
                <p className="text-2xl font-bold text-success-600 dark:text-success-400">
                  +{periodTotals.income.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kr
                </p>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Net</p>
                <p className={`text-2xl font-bold ${periodTotals.net >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                  {periodTotals.net >= 0 ? '+' : ''}{periodTotals.net.toLocaleString('sv-SE', { maximumFractionDigits: 0 })} kr
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export type { TimePeriod };

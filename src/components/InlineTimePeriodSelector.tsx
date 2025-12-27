import { useState, useMemo, useEffect, useRef } from 'react';
import type { Transaction, TransactionGrouping } from '../types/transaction';

interface TimePeriod {
  type: TransactionGrouping;
  start: Date;
  end: Date;
  label: string;
  shortLabel: string;
}

interface InlineTimePeriodSelectorProps {
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
  return date.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' });
}

function getSalaryPeriod(date: Date, monthStartDay: number): { periodMonth: number; periodYear: number } {
  const day = date.getDate();
  const month = date.getMonth();
  const year = date.getFullYear();

  if (monthStartDay === 1) {
    return { periodMonth: month, periodYear: year };
  }

  if (day < monthStartDay) {
    return { periodMonth: month, periodYear: year };
  } else {
    const nextMonth = month + 1;
    if (nextMonth > 11) {
      return { periodMonth: 0, periodYear: year + 1 };
    }
    return { periodMonth: nextMonth, periodYear: year };
  }
}

function getSalaryPeriodDates(periodMonth: number, periodYear: number, monthStartDay: number): { start: Date; end: Date } {
  if (monthStartDay === 1) {
    const start = new Date(periodYear, periodMonth, 1);
    start.setHours(0, 0, 0, 0);
    const end = new Date(periodYear, periodMonth + 1, 0);
    end.setHours(23, 59, 59, 999);
    return { start, end };
  }

  let startMonth = periodMonth - 1;
  let startYear = periodYear;
  if (startMonth < 0) {
    startMonth = 11;
    startYear = periodYear - 1;
  }

  const start = new Date(startYear, startMonth, monthStartDay);
  start.setHours(0, 0, 0, 0);

  const end = new Date(periodYear, periodMonth, monthStartDay - 1);
  end.setHours(23, 59, 59, 999);

  return { start, end };
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
        const { periodMonth, periodYear } = getSalaryPeriod(date, monthStartDay);
        key = `${periodYear}-${(periodMonth + 1).toString().padStart(2, '0')}`;
        const dates = getSalaryPeriodDates(periodMonth, periodYear, monthStartDay);
        start = dates.start;
        end = dates.end;
        const labelDate = new Date(periodYear, periodMonth, 15);
        label = labelDate.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' });
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

  return Array.from(periodsMap.values()).sort((a, b) => b.start.getTime() - a.start.getTime());
}

export function InlineTimePeriodSelector({
  transactions,
  onPeriodChange,
  selectedPeriod,
}: InlineTimePeriodSelectorProps) {
  const [activeType, setActiveType] = useState<TransactionGrouping>('month');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const [monthStartDay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('period-month-start-day');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  // Precompute all periods
  const allPeriods = useMemo(() => {
    const types: TransactionGrouping[] = ['day', 'week', 'month', 'quarter', 'year'];
    const result: Record<TransactionGrouping, TimePeriod[]> = {
      day: [],
      week: [],
      month: [],
      quarter: [],
      year: [],
    };
    types.forEach(type => {
      result[type] = getPeriodsFromTransactions(transactions, type, monthStartDay);
    });
    return result;
  }, [transactions, monthStartDay]);

  // Calculate period stats when period is selected
  const periodStats = useMemo(() => {
    if (!selectedPeriod) return null;

    const periodTransactions = transactions.filter(
      (t) => t.date >= selectedPeriod.start && t.date <= selectedPeriod.end && !t.isExcluded
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

  const handlePeriodSelect = (period: TimePeriod) => {
    if (
      selectedPeriod &&
      selectedPeriod.start.getTime() === period.start.getTime() &&
      selectedPeriod.end.getTime() === period.end.getTime()
    ) {
      onPeriodChange(null);
    } else {
      onPeriodChange(period);
    }
  };

  // Sync activeType with selectedPeriod type
  useEffect(() => {
    if (selectedPeriod) {
      setActiveType(selectedPeriod.type);
    }
  }, [selectedPeriod]);

  const activePeriods = allPeriods[activeType];
  const visiblePeriods = activePeriods.slice(0, 12); // Show recent periods

  if (transactions.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
      {/* Header with period type tabs */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
        <div className="flex items-center gap-1">
          {(Object.keys(periodTypeConfig) as TransactionGrouping[]).map((type) => {
            const config = periodTypeConfig[type];
            const count = allPeriods[type].length;
            const isActive = activeType === type;

            return (
              <button
                key={type}
                onClick={() => count > 0 && setActiveType(type)}
                disabled={count === 0}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-all flex items-center gap-1 ${
                  isActive
                    ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                    : count === 0
                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
                }`}
              >
                <span className="hidden sm:inline">{config.icon}</span>
                <span>{config.label}</span>
              </button>
            );
          })}
        </div>

        {selectedPeriod && (
          <button
            onClick={() => onPeriodChange(null)}
            className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 flex items-center gap-1"
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* Period selection row */}
      <div className="p-3">
        <div
          ref={scrollContainerRef}
          className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin"
        >
          {visiblePeriods.map((period) => {
            const isSelected = selectedPeriod &&
              selectedPeriod.start.getTime() === period.start.getTime();

            return (
              <button
                key={`${period.type}-${period.start.getTime()}`}
                onClick={() => handlePeriodSelect(period)}
                className={`flex-shrink-0 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-primary-500 text-white shadow-sm'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/40 hover:text-primary-700 dark:hover:text-primary-300'
                }`}
              >
                {period.shortLabel}
              </button>
            );
          })}
          {activePeriods.length > 12 && (
            <span className="flex-shrink-0 px-2 py-2 text-xs text-gray-400 dark:text-gray-500">
              +{activePeriods.length - 12}
            </span>
          )}
        </div>
      </div>

      {/* Selected period info */}
      {selectedPeriod && periodStats && (
        <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-primary-100/50 dark:from-primary-900/20 dark:to-primary-800/10 border-t border-primary-100 dark:border-primary-900/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl">{periodTypeConfig[selectedPeriod.type].icon}</span>
              <div>
                <p className="font-semibold text-primary-900 dark:text-primary-100">{selectedPeriod.label}</p>
                <p className="text-xs text-primary-600 dark:text-primary-400">
                  {formatSwedishDate(selectedPeriod.start)} — {formatSwedishDate(selectedPeriod.end)} • {periodStats.count} transactions
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Income</p>
                <p className="font-semibold text-success-600 dark:text-success-400">
                  +{periodStats.income.toLocaleString('sv-SE', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 dark:text-gray-400">Expenses</p>
                <p className="font-semibold text-danger-600 dark:text-danger-400">
                  -{periodStats.expenses.toLocaleString('sv-SE', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="text-right pl-2 border-l border-primary-200 dark:border-primary-800">
                <p className="text-xs text-gray-500 dark:text-gray-400">Net</p>
                <p className={`font-bold ${periodStats.net >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                  {periodStats.net >= 0 ? '+' : ''}{periodStats.net.toLocaleString('sv-SE', { maximumFractionDigits: 0 })}
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

import { useState, useMemo, useEffect, useRef } from 'react';
import type { Transaction, TransactionGrouping } from '../types/transaction';

interface TimePeriod {
  type: TransactionGrouping;
  start: Date;
  end: Date;
  label: string;
  shortLabel: string;
}

interface CompactTimePeriodSelectorProps {
  transactions: Transaction[];
  onPeriodChange: (period: TimePeriod | null) => void;
  selectedPeriod: TimePeriod | null;
}

const periodTypeConfig: Record<TransactionGrouping, { icon: string; label: string; shortLabel: string }> = {
  day: { icon: '📅', label: 'Day', shortLabel: 'D' },
  week: { icon: '📆', label: 'Week', shortLabel: 'W' },
  month: { icon: '🗓️', label: 'Month', shortLabel: 'M' },
  quarter: { icon: '📊', label: 'Quarter', shortLabel: 'Q' },
  year: { icon: '📈', label: 'Year', shortLabel: 'Y' },
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

export function CompactTimePeriodSelector({
  transactions,
  onPeriodChange,
  selectedPeriod,
}: CompactTimePeriodSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeType, setActiveType] = useState<TransactionGrouping>('month');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const [monthStartDay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('period-month-start-day');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

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
    setIsOpen(false);
  };

  const handleClearPeriod = () => {
    onPeriodChange(null);
    setIsOpen(false);
  };

  const activePeriods = allPeriods[activeType];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md transition-colors ${
          selectedPeriod
            ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 border border-primary-300 dark:border-primary-700'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700'
        }`}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        {selectedPeriod ? (
          <span className="font-medium max-w-[120px] truncate">{selectedPeriod.shortLabel}</span>
        ) : (
          <span>Period</span>
        )}
        <svg className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-0 top-full mt-1 z-50 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden min-w-[280px] animate-slide-down"
        >
          {/* Period Type Tabs */}
          <div className="flex border-b border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50">
            {(Object.keys(periodTypeConfig) as TransactionGrouping[]).map((type) => {
              const config = periodTypeConfig[type];
              const count = allPeriods[type].length;
              const isActive = activeType === type;

              return (
                <button
                  key={type}
                  onClick={() => setActiveType(type)}
                  disabled={count === 0}
                  className={`flex-1 px-2 py-2 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 border-b-2 border-primary-500'
                      : count === 0
                      ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                  title={config.label}
                >
                  {config.shortLabel}
                </button>
              );
            })}
          </div>

          {/* Period List */}
          <div className="max-h-[240px] overflow-y-auto p-2">
            {selectedPeriod && (
              <button
                onClick={handleClearPeriod}
                className="w-full mb-2 px-3 py-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-md transition-colors text-left"
              >
                Clear selection
              </button>
            )}
            <div className="grid grid-cols-3 gap-1">
              {activePeriods.slice(0, 24).map((period) => {
                const isSelected = selectedPeriod &&
                  selectedPeriod.start.getTime() === period.start.getTime();

                return (
                  <button
                    key={`${period.type}-${period.start.getTime()}`}
                    onClick={() => handlePeriodSelect(period)}
                    className={`px-2 py-1.5 rounded text-xs font-medium transition-all text-center ${
                      isSelected
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/40'
                    }`}
                    title={period.label}
                  >
                    {period.shortLabel}
                  </button>
                );
              })}
            </div>
            {activePeriods.length > 24 && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-2">
                +{activePeriods.length - 24} more periods
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export type { TimePeriod };

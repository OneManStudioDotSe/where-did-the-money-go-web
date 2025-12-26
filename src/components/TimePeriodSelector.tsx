import { useState, useMemo, useEffect, useRef } from 'react';
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

// Popover component for period selection
interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
}

function Popover({ isOpen, onClose, anchorRef, children }: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 mt-2 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden animate-slide-down"
    >
      {children}
    </div>
  );
}

// Day Picker with Calendar
interface DayPickerProps {
  periods: TimePeriod[];
  selectedPeriod: TimePeriod | null;
  onSelect: (period: TimePeriod) => void;
  onClose: () => void;
}

function DayPicker({ periods, selectedPeriod, onSelect, onClose }: DayPickerProps) {
  // Group days by month
  const daysByMonth = useMemo(() => {
    const grouped = new Map<string, TimePeriod[]>();
    periods.forEach(period => {
      const monthKey = `${period.start.getFullYear()}-${period.start.getMonth()}`;
      if (!grouped.has(monthKey)) {
        grouped.set(monthKey, []);
      }
      grouped.get(monthKey)!.push(period);
    });
    return grouped;
  }, [periods]);

  const months = Array.from(daysByMonth.keys()).sort((a, b) => b.localeCompare(a));
  const [activeMonth, setActiveMonth] = useState(months[0] || '');

  const activeDays = daysByMonth.get(activeMonth) || [];
  const [year, month] = activeMonth.split('-').map(Number);
  const monthLabel = activeMonth ? new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    if (!activeMonth) return [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1; // Monday start

    const days: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  }, [activeMonth, year, month]);

  const periodsByDate = useMemo(() => {
    const map = new Map<string, TimePeriod>();
    activeDays.forEach(p => {
      map.set(p.start.toISOString().split('T')[0], p);
    });
    return map;
  }, [activeDays]);

  return (
    <div className="w-72 p-3">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            const idx = months.indexOf(activeMonth);
            if (idx < months.length - 1) setActiveMonth(months[idx + 1]);
          }}
          disabled={months.indexOf(activeMonth) >= months.length - 1}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-900 dark:text-white">{monthLabel}</span>
        <button
          onClick={() => {
            const idx = months.indexOf(activeMonth);
            if (idx > 0) setActiveMonth(months[idx - 1]);
          }}
          disabled={months.indexOf(activeMonth) <= 0}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Day Headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <div key={d} className="text-[10px] text-center text-gray-400 dark:text-gray-500 font-medium py-1">{d}</div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((day, idx) => {
          if (!day) return <div key={`empty-${idx}`} className="w-8 h-8" />;

          const dateKey = day.toISOString().split('T')[0];
          const period = periodsByDate.get(dateKey);
          const isSelected = selectedPeriod && period &&
            selectedPeriod.start.getTime() === period.start.getTime();
          const hasData = !!period;

          return (
            <button
              key={dateKey}
              onClick={() => {
                if (period) {
                  onSelect(period);
                  onClose();
                }
              }}
              disabled={!hasData}
              className={`w-8 h-8 rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-primary-500 text-white'
                  : hasData
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800/50'
                  : 'text-gray-300 dark:text-gray-600 cursor-default'
              }`}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// Week Picker - organized by month
interface WeekPickerProps {
  periods: TimePeriod[];
  selectedPeriod: TimePeriod | null;
  onSelect: (period: TimePeriod) => void;
  onClose: () => void;
}

const MONTH_SHORT_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function WeekPicker({ periods, selectedPeriod, onSelect, onClose }: WeekPickerProps) {
  // Group weeks by year and month
  const weeksByYearAndMonth = useMemo(() => {
    const grouped = new Map<string, TimePeriod[]>();
    periods.forEach(period => {
      const year = period.start.getFullYear();
      const month = period.start.getMonth();
      const key = `${year}-${month}`;
      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key)!.push(period);
    });
    return grouped;
  }, [periods]);

  // Get unique years
  const years = useMemo(() => {
    const yearsSet = new Set<number>();
    periods.forEach(period => yearsSet.add(period.start.getFullYear()));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [periods]);

  const [activeYear, setActiveYear] = useState(years[0] || new Date().getFullYear());

  // Get months for the active year (in reverse order - newest first)
  const monthsInYear = useMemo(() => {
    const months: number[] = [];
    for (let m = 11; m >= 0; m--) {
      const key = `${activeYear}-${m}`;
      if (weeksByYearAndMonth.has(key)) {
        months.push(m);
      }
    }
    return months;
  }, [activeYear, weeksByYearAndMonth]);

  return (
    <div className="w-80 p-3">
      {/* Year Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            const idx = years.indexOf(activeYear);
            if (idx < years.length - 1) setActiveYear(years[idx + 1]);
          }}
          disabled={years.indexOf(activeYear) >= years.length - 1}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-900 dark:text-white">{activeYear}</span>
        <button
          onClick={() => {
            const idx = years.indexOf(activeYear);
            if (idx > 0) setActiveYear(years[idx - 1]);
          }}
          disabled={years.indexOf(activeYear) <= 0}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Weeks organized by month */}
      <div className="space-y-2 max-h-72 overflow-y-auto">
        {monthsInYear.map(month => {
          const key = `${activeYear}-${month}`;
          const weeksInMonth = weeksByYearAndMonth.get(key) || [];
          // Sort weeks by week number (descending - newest first)
          const sortedWeeks = [...weeksInMonth].sort((a, b) => b.start.getTime() - a.start.getTime());

          return (
            <div key={key} className="flex items-start gap-2">
              <span className="text-[10px] text-gray-400 dark:text-gray-500 w-8 flex-shrink-0 pt-2 font-medium">
                {MONTH_SHORT_NAMES[month]}
              </span>
              <div className="flex-1 flex flex-wrap gap-1.5">
                {sortedWeeks.map(period => {
                  const isSelected = selectedPeriod &&
                    selectedPeriod.start.getTime() === period.start.getTime();
                  const weekNum = getWeekNumber(period.start);

                  return (
                    <button
                      key={period.label}
                      onClick={() => {
                        onSelect(period);
                        onClose();
                      }}
                      className={`px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                        isSelected
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/40'
                      }`}
                      title={`${formatSwedishDate(period.start)} - ${formatSwedishDate(period.end)}`}
                    >
                      W{weekNum}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Month Picker with Quarters
interface MonthPickerProps {
  periods: TimePeriod[];
  selectedPeriod: TimePeriod | null;
  onSelect: (period: TimePeriod) => void;
  onClose: () => void;
}

function MonthPicker({ periods, selectedPeriod, onSelect, onClose }: MonthPickerProps) {
  const monthsByYear = useMemo(() => {
    const grouped = new Map<number, TimePeriod[]>();
    periods.forEach(period => {
      const year = period.start.getFullYear();
      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      grouped.get(year)!.push(period);
    });
    return grouped;
  }, [periods]);

  const years = Array.from(monthsByYear.keys()).sort((a, b) => b - a);
  const [activeYear, setActiveYear] = useState(years[0] || new Date().getFullYear());
  const activeMonths = monthsByYear.get(activeYear) || [];

  // Create a map for quick lookup
  const monthMap = useMemo(() => {
    const map = new Map<number, TimePeriod>();
    activeMonths.forEach(p => {
      map.set(p.start.getMonth(), p);
    });
    return map;
  }, [activeMonths]);

  const quarters = [
    { label: 'Q1', months: [0, 1, 2], names: ['Jan', 'Feb', 'Mar'] },
    { label: 'Q2', months: [3, 4, 5], names: ['Apr', 'May', 'Jun'] },
    { label: 'Q3', months: [6, 7, 8], names: ['Jul', 'Aug', 'Sep'] },
    { label: 'Q4', months: [9, 10, 11], names: ['Oct', 'Nov', 'Dec'] },
  ];

  return (
    <div className="w-72 p-3">
      {/* Year Navigation */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => {
            const idx = years.indexOf(activeYear);
            if (idx < years.length - 1) setActiveYear(years[idx + 1]);
          }}
          disabled={years.indexOf(activeYear) >= years.length - 1}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-900 dark:text-white">{activeYear}</span>
        <button
          onClick={() => {
            const idx = years.indexOf(activeYear);
            if (idx > 0) setActiveYear(years[idx - 1]);
          }}
          disabled={years.indexOf(activeYear) <= 0}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-700 disabled:opacity-30"
        >
          <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Months organized by quarter */}
      <div className="space-y-2">
        {quarters.map(quarter => (
          <div key={quarter.label} className="flex items-center gap-2">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 w-6 flex-shrink-0">{quarter.label}</span>
            <div className="flex-1 grid grid-cols-3 gap-1.5">
              {quarter.months.map((monthIdx, i) => {
                const period = monthMap.get(monthIdx);
                const isSelected = selectedPeriod && period &&
                  selectedPeriod.start.getTime() === period.start.getTime();
                const hasData = !!period;

                return (
                  <button
                    key={monthIdx}
                    onClick={() => {
                      if (period) {
                        onSelect(period);
                        onClose();
                      }
                    }}
                    disabled={!hasData}
                    className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-primary-500 text-white'
                        : hasData
                        ? 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/40'
                        : 'bg-gray-50 dark:bg-slate-800 text-gray-300 dark:text-gray-600 cursor-default'
                    }`}
                  >
                    {quarter.names[i]}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Quarter Picker
interface QuarterPickerProps {
  periods: TimePeriod[];
  selectedPeriod: TimePeriod | null;
  onSelect: (period: TimePeriod) => void;
  onClose: () => void;
}

function QuarterPicker({ periods, selectedPeriod, onSelect, onClose }: QuarterPickerProps) {
  const quartersByYear = useMemo(() => {
    const grouped = new Map<number, TimePeriod[]>();
    periods.forEach(period => {
      const year = period.start.getFullYear();
      if (!grouped.has(year)) {
        grouped.set(year, []);
      }
      grouped.get(year)!.push(period);
    });
    return grouped;
  }, [periods]);

  const years = Array.from(quartersByYear.keys()).sort((a, b) => b - a);

  return (
    <div className="w-64 p-3 max-h-72 overflow-y-auto">
      {years.map(year => {
        const yearQuarters = quartersByYear.get(year) || [];
        return (
          <div key={year} className="mb-3 last:mb-0">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">{year}</div>
            <div className="grid grid-cols-4 gap-1.5">
              {yearQuarters.sort((a, b) => b.start.getTime() - a.start.getTime()).map(period => {
                const isSelected = selectedPeriod &&
                  selectedPeriod.start.getTime() === period.start.getTime();

                return (
                  <button
                    key={period.label}
                    onClick={() => {
                      onSelect(period);
                      onClose();
                    }}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/40'
                    }`}
                  >
                    {period.shortLabel}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Year Picker
interface YearPickerProps {
  periods: TimePeriod[];
  selectedPeriod: TimePeriod | null;
  onSelect: (period: TimePeriod) => void;
  onClose: () => void;
}

function YearPicker({ periods, selectedPeriod, onSelect, onClose }: YearPickerProps) {
  return (
    <div className="p-3">
      <div className="flex flex-wrap gap-1.5 max-w-64">
        {periods.map(period => {
          const isSelected = selectedPeriod &&
            selectedPeriod.start.getTime() === period.start.getTime();

          return (
            <button
              key={period.label}
              onClick={() => {
                onSelect(period);
                onClose();
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isSelected
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300 hover:bg-primary-100 dark:hover:bg-primary-900/40'
              }`}
            >
              {period.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function TimePeriodSelector({
  transactions,
  onPeriodChange,
  selectedPeriod,
}: TimePeriodSelectorProps) {
  const [openPicker, setOpenPicker] = useState<TransactionGrouping | null>(null);
  const [monthStartDay, setMonthStartDay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('period-month-start-day');
      return saved ? parseInt(saved, 10) : 1;
    } catch {
      return 1;
    }
  });
  const [showSettings, setShowSettings] = useState(false);

  const buttonRefs = {
    day: useRef<HTMLButtonElement>(null),
    week: useRef<HTMLButtonElement>(null),
    month: useRef<HTMLButtonElement>(null),
    quarter: useRef<HTMLButtonElement>(null),
    year: useRef<HTMLButtonElement>(null),
  };

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
  };

  const handleClearPeriod = () => {
    onPeriodChange(null);
  };

  const handleMonthStartDayChange = (day: number) => {
    setMonthStartDay(day);
    try {
      localStorage.setItem('period-month-start-day', day.toString());
    } catch {
      // localStorage may be unavailable
    }
    if (selectedPeriod?.type === 'month') {
      onPeriodChange(null);
    }
  };

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
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900 dark:text-white">View by Time Period</h3>
          <div className="flex items-center gap-2">
            {selectedPeriod && (
              <button
                onClick={handleClearPeriod}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              >
                Clear
              </button>
            )}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 rounded-lg transition-colors ${
                showSettings
                  ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                  : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500 dark:text-gray-400'
              }`}
              title="Period settings"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Period Type Buttons with Popovers */}
        <div className="flex flex-wrap items-center gap-2">
          {(Object.keys(periodTypeConfig) as TransactionGrouping[]).map((type) => {
            const config = periodTypeConfig[type];
            const periods = allPeriods[type];
            const count = periods.length;
            const isActive = openPicker === type;
            const isSelected = selectedPeriod?.type === type;

            return (
              <div key={type} className="relative">
                <button
                  ref={buttonRefs[type]}
                  onClick={() => {
                    if (count > 0) {
                      setOpenPicker(openPicker === type ? null : type);
                    }
                  }}
                  disabled={count === 0}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm transition-all ${
                    isSelected
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : isActive
                      ? 'border-primary-300 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                      : count === 0
                      ? 'border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                      : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <span>{config.icon}</span>
                  <span className="font-medium">{config.label}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                    isSelected || isActive
                      ? 'bg-primary-200 dark:bg-primary-800 text-primary-700 dark:text-primary-300'
                      : 'bg-gray-100 dark:bg-slate-600 text-gray-500 dark:text-gray-400'
                  }`}>
                    {count}
                  </span>
                  {count > 0 && (
                    <svg className={`w-3 h-3 transition-transform ${isActive ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  )}
                </button>

                <Popover
                  isOpen={openPicker === type}
                  onClose={() => setOpenPicker(null)}
                  anchorRef={buttonRefs[type]}
                >
                  {type === 'day' && (
                    <DayPicker
                      periods={periods}
                      selectedPeriod={selectedPeriod}
                      onSelect={handlePeriodSelect}
                      onClose={() => setOpenPicker(null)}
                    />
                  )}
                  {type === 'week' && (
                    <WeekPicker
                      periods={periods}
                      selectedPeriod={selectedPeriod}
                      onSelect={handlePeriodSelect}
                      onClose={() => setOpenPicker(null)}
                    />
                  )}
                  {type === 'month' && (
                    <MonthPicker
                      periods={periods}
                      selectedPeriod={selectedPeriod}
                      onSelect={handlePeriodSelect}
                      onClose={() => setOpenPicker(null)}
                    />
                  )}
                  {type === 'quarter' && (
                    <QuarterPicker
                      periods={periods}
                      selectedPeriod={selectedPeriod}
                      onSelect={handlePeriodSelect}
                      onClose={() => setOpenPicker(null)}
                    />
                  )}
                  {type === 'year' && (
                    <YearPicker
                      periods={periods}
                      selectedPeriod={selectedPeriod}
                      onSelect={handlePeriodSelect}
                      onClose={() => setOpenPicker(null)}
                    />
                  )}
                </Popover>
              </div>
            );
          })}
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg border border-gray-200 dark:border-slate-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Month Start Day</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Swedish salary is typically paid on the 25th
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

      {/* Selected Period Info */}
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
                <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Period Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2 sm:p-3 text-center">
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Transactions</p>
                <p className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">{periodTotals.count}</p>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2 sm:p-3 text-center">
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Expenses</p>
                <p className="text-lg sm:text-2xl font-bold text-danger-600 dark:text-danger-400">
                  -{periodTotals.expenses.toLocaleString('sv-SE', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2 sm:p-3 text-center">
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Income</p>
                <p className="text-lg sm:text-2xl font-bold text-success-600 dark:text-success-400">
                  +{periodTotals.income.toLocaleString('sv-SE', { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-white/60 dark:bg-slate-800/60 rounded-lg p-2 sm:p-3 text-center">
                <p className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 mb-0.5 sm:mb-1">Net</p>
                <p className={`text-lg sm:text-2xl font-bold ${periodTotals.net >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                  {periodTotals.net >= 0 ? '+' : ''}{periodTotals.net.toLocaleString('sv-SE', { maximumFractionDigits: 0 })}
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

import { useState, useMemo, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import type { Transaction, TransactionGrouping } from '../types/transaction';

export interface TimePeriod {
  type: TransactionGrouping;
  start: Date;
  end: Date;
  label: string;
  shortLabel: string;
}

interface EnhancedTimePeriodSelectorProps {
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

function formatSwedishDateFull(date: Date): string {
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
        label = formatSwedishDateFull(date);
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

// Popover component for period selection - uses portal to avoid clipping
interface PopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  children: React.ReactNode;
}

function Popover({ isOpen, onClose, anchorRef, children }: PopoverProps) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  // Calculate position based on anchor element
  useEffect(() => {
    if (!isOpen || !anchorRef.current) return;

    const updatePosition = () => {
      if (!anchorRef.current) return;

      const anchorRect = anchorRef.current.getBoundingClientRect();
      const popoverHeight = popoverRef.current?.offsetHeight || 300;
      const popoverWidth = popoverRef.current?.offsetWidth || 300;

      // Calculate position - prefer below and aligned to right edge
      let top = anchorRect.bottom + 8;
      let left = anchorRect.right - popoverWidth;

      // Ensure it doesn't go off the left edge
      if (left < 8) {
        left = 8;
      }

      // Ensure it doesn't go off the right edge
      if (left + popoverWidth > window.innerWidth - 8) {
        left = window.innerWidth - popoverWidth - 8;
      }

      // If it would go below the viewport, show it above the anchor
      if (top + popoverHeight > window.innerHeight - 8) {
        top = anchorRect.top - popoverHeight - 8;
      }

      // Ensure it doesn't go above the viewport
      if (top < 8) {
        top = 8;
      }

      setPosition({ top, left });
    };

    updatePosition();

    // Recalculate on scroll or resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [isOpen, anchorRef]);

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

  return createPortal(
    <div
      ref={popoverRef}
      style={{
        position: 'fixed',
        top: position.top,
        left: position.left,
        zIndex: 9999,
      }}
      className="bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-gray-200 dark:border-slate-700 overflow-hidden animate-slide-down"
    >
      {children}
    </div>,
    document.body
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

  const calendarDays = useMemo(() => {
    if (!activeMonth) return [];
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDay.getDay() === 0 ? 6 : firstDay.getDay() - 1;

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

      <div className="grid grid-cols-7 gap-1 mb-1">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
          <div key={d} className="text-[10px] text-center text-gray-400 dark:text-gray-500 font-medium py-1">{d}</div>
        ))}
      </div>

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

  const years = useMemo(() => {
    const yearsSet = new Set<number>();
    periods.forEach(period => yearsSet.add(period.start.getFullYear()));
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [periods]);

  const [activeYear, setActiveYear] = useState(years[0] || new Date().getFullYear());

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

      <div className="space-y-2 max-h-72 overflow-y-auto">
        {monthsInYear.map(month => {
          const key = `${activeYear}-${month}`;
          const weeksInMonth = weeksByYearAndMonth.get(key) || [];
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
                      title={`${formatSwedishDateFull(period.start)} - ${formatSwedishDateFull(period.end)}`}
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

export function EnhancedTimePeriodSelector({
  transactions,
  onPeriodChange,
  selectedPeriod,
}: EnhancedTimePeriodSelectorProps) {
  const [openPicker, setOpenPicker] = useState<TransactionGrouping | null>(null);

  const buttonRefs = {
    day: useRef<HTMLButtonElement>(null),
    week: useRef<HTMLButtonElement>(null),
    month: useRef<HTMLButtonElement>(null),
    quarter: useRef<HTMLButtonElement>(null),
    year: useRef<HTMLButtonElement>(null),
  };

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

  if (transactions.length === 0) return null;

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden h-fit">
      {/* Header with period type buttons */}
      <div className="px-3 py-2.5 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-700">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1 flex-wrap">
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
                    className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-primary-500 text-white'
                        : isActive
                        ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                        : count === 0
                        ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="hidden sm:inline">{config.icon}</span>
                    <span>{config.label}</span>
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

          {selectedPeriod && (
            <button
              onClick={() => onPeriodChange(null)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors flex-shrink-0"
              title="Clear selection"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Selected period info */}
      {selectedPeriod && periodStats ? (
        <div className="px-3 py-2.5">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">{periodTypeConfig[selectedPeriod.type].icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{selectedPeriod.label}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400">
                {formatSwedishDate(selectedPeriod.start)} — {formatSwedishDate(selectedPeriod.end)} · {periodStats.count} txns
              </p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-1.5">
            <div className="text-center p-1.5 bg-success-50 dark:bg-success-900/20 rounded-lg">
              <p className="text-[9px] text-success-600 dark:text-success-400 uppercase tracking-wide">Income</p>
              <p className="text-[11px] font-semibold text-success-700 dark:text-success-300">
                +{periodStats.income.toLocaleString('sv-SE', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="text-center p-1.5 bg-danger-50 dark:bg-danger-900/20 rounded-lg">
              <p className="text-[9px] text-danger-600 dark:text-danger-400 uppercase tracking-wide">Expenses</p>
              <p className="text-[11px] font-semibold text-danger-700 dark:text-danger-300">
                -{periodStats.expenses.toLocaleString('sv-SE', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className={`text-center p-1.5 rounded-lg ${
              periodStats.net >= 0
                ? 'bg-success-50 dark:bg-success-900/20'
                : 'bg-danger-50 dark:bg-danger-900/20'
            }`}>
              <p className={`text-[9px] uppercase tracking-wide ${
                periodStats.net >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'
              }`}>Net</p>
              <p className={`text-[11px] font-bold ${
                periodStats.net >= 0 ? 'text-success-700 dark:text-success-300' : 'text-danger-700 dark:text-danger-300'
              }`}>
                {periodStats.net >= 0 ? '+' : ''}{periodStats.net.toLocaleString('sv-SE', { maximumFractionDigits: 0 })}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="px-3 py-3 text-center">
          <p className="text-xs text-gray-500 dark:text-gray-400">Select a time period to filter</p>
        </div>
      )}
    </div>
  );
}

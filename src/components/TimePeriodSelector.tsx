import { useState, useMemo } from 'react';
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

function getPeriodsFromTransactions(
  transactions: Transaction[],
  type: TransactionGrouping
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
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
        start = new Date(date.getFullYear(), date.getMonth(), 1);
        end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
        label = date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'long' });
        shortLabel = date.toLocaleDateString('sv-SE', { month: 'short' });
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
  const [activePeriodType, setActivePeriodType] = useState<TransactionGrouping | null>(null);

  const availablePeriods = useMemo(() => {
    if (!activePeriodType) return [];
    return getPeriodsFromTransactions(transactions, activePeriodType);
  }, [transactions, activePeriodType]);

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
      counts[type] = getPeriodsFromTransactions(transactions, type).length;
    });

    return counts;
  }, [transactions]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Period Type Selector */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-gray-900">View by Time Period</h3>
          {selectedPeriod && (
            <button
              onClick={handleClearPeriod}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Clear selection
            </button>
          )}
        </div>

        {/* Period Type Buttons */}
        <div className="flex flex-wrap gap-2">
          {(Object.keys(periodTypeConfig) as TransactionGrouping[]).map((type) => {
            const config = periodTypeConfig[type];
            const isActive = activePeriodType === type;
            const count = periodTypeCounts[type];

            return (
              <button
                key={type}
                onClick={() => handlePeriodTypeClick(type)}
                disabled={count === 0}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                  isActive
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : count === 0
                    ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                }`}
              >
                <span className="text-lg">{config.icon}</span>
                <span className="font-medium">{config.label}</span>
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-primary-200 text-primary-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Period Selection Dropdown */}
      {activePeriodType && availablePeriods.length > 0 && (
        <div className="border-t border-gray-200 p-4">
          <p className="text-sm text-gray-500 mb-3">
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
                      : 'border-gray-200 hover:border-primary-300 hover:bg-primary-50 text-gray-700'
                  }`}
                >
                  {period.label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Selected Period Info */}
      {selectedPeriod && (
        <div className="border-t border-gray-200 px-4 py-3 bg-primary-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">{periodTypeConfig[selectedPeriod.type].icon}</span>
              <div>
                <p className="font-medium text-primary-900">{selectedPeriod.label}</p>
                <p className="text-xs text-primary-700">
                  {formatSwedishDate(selectedPeriod.start)} — {formatSwedishDate(selectedPeriod.end)}
                </p>
              </div>
            </div>
            <button
              onClick={() => onPeriodChange(null)}
              className="p-1 hover:bg-primary-100 rounded transition-colors"
            >
              <svg
                className="w-5 h-5 text-primary-600"
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
        </div>
      )}
    </div>
  );
}

export type { TimePeriod };

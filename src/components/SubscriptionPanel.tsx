import { useState, useMemo } from 'react';
import type { Subscription, Transaction, RecurringType } from '../types/transaction';
import { SubscriptionList } from './SubscriptionList';
import { SubscriptionGrid } from './SubscriptionGrid';
import { getCategoryIcon, getCategoryColor } from '../utils/category-service';
import { RecurringEmptyState } from './ui/EmptyState';

type SortOption = 'name' | 'amount' | 'day';
type SortDirection = 'asc' | 'desc';

interface UpcomingPayment {
  subscription: Subscription;
  dueDate: Date;
  daysUntil: number;
}

/**
 * Calculate the next payment date based on billing day
 */
function getNextPaymentDate(billingDay: number): Date {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  let nextDate: Date;
  if (currentDay < billingDay) {
    // Payment is this month
    nextDate = new Date(currentYear, currentMonth, billingDay);
  } else {
    // Payment is next month
    nextDate = new Date(currentYear, currentMonth + 1, billingDay);
  }

  // Handle edge case where billing day doesn't exist in the month
  // (e.g., billing day 31 in a month with 30 days)
  if (nextDate.getDate() !== billingDay) {
    // Go to the last day of the previous month
    nextDate = new Date(currentYear, currentMonth + 2, 0);
  }

  return nextDate;
}

/**
 * Get upcoming payments in the next N days
 */
function getUpcomingPayments(subscriptions: Subscription[], daysAhead: number = 14): UpcomingPayment[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming: UpcomingPayment[] = [];

  for (const sub of subscriptions) {
    if (!sub.isActive) continue;

    const dueDate = getNextPaymentDate(sub.billingDay);
    const diffTime = dueDate.getTime() - today.getTime();
    const daysUntil = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (daysUntil >= 0 && daysUntil <= daysAhead) {
      upcoming.push({ subscription: sub, dueDate, daysUntil });
    }
  }

  // Sort by days until due (soonest first)
  return upcoming.sort((a, b) => a.daysUntil - b.daysUntil);
}

type ViewMode = 'list' | 'grid';

interface SubscriptionPanelProps {
  subscriptions: Subscription[];
  transactions: Transaction[];
  onSubscriptionClick?: (subscription: Subscription) => void;
  /** Callback when user wants to edit a subscription */
  onEditSubscription?: (subscription: Subscription) => void;
  /** Whether to show in compact mode (for card placement in overview) */
  compact?: boolean;
  /** View mode from settings - when provided, hides the toggle and uses this mode */
  viewMode?: ViewMode;
}

/**
 * Wrapper component that allows switching between Variation A (Accordion List)
 * and Variation B (Card Grid)
 */
export function SubscriptionPanel({
  subscriptions,
  transactions,
  onSubscriptionClick,
  onEditSubscription,
  compact = false,
  viewMode: externalViewMode,
}: SubscriptionPanelProps) {
  const [internalViewMode, setInternalViewMode] = useState<ViewMode>('list');

  // Filter state - which types to show
  const [typeFilters, setTypeFilters] = useState<Set<RecurringType>>(
    new Set(['subscription', 'recurring_expense', 'fixed_expense'])
  );

  // Sort state
  const [sortBy, setSortBy] = useState<SortOption>('name');
  const [sortDir, setSortDir] = useState<SortDirection>('asc');

  // Use external view mode if provided, otherwise use internal state
  const viewMode = externalViewMode ?? internalViewMode;
  const setViewMode = setInternalViewMode;

  // Toggle a type filter
  const toggleTypeFilter = (type: RecurringType) => {
    setTypeFilters(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        // Don't allow removing all filters
        if (next.size > 1) {
          next.delete(type);
        }
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Cycle sort option
  const handleSort = (option: SortOption) => {
    if (sortBy === option) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(option);
      setSortDir('asc');
    }
  };

  // Filter and sort subscriptions
  const filteredAndSortedSubscriptions = useMemo(() => {
    let result = subscriptions.filter(s => typeFilters.has(s.recurringType));

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'sv-SE');
          break;
        case 'amount':
          comparison = a.amount - b.amount;
          break;
        case 'day':
          comparison = a.billingDay - b.billingDay;
          break;
      }
      return sortDir === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [subscriptions, typeFilters, sortBy, sortDir]);

  // Count by type for filter buttons
  const subscriptionCount = subscriptions.filter(s => s.recurringType === 'subscription').length;
  const recurringCount = subscriptions.filter(s => s.recurringType === 'recurring_expense').length;
  const fixedCount = subscriptions.filter(s => s.recurringType === 'fixed_expense').length;

  return (
    <div className={compact ? '' : 'space-y-4'}>
      {/* Header with View Toggle - toggle hidden when external viewMode is provided (controlled by settings) */}
      {!compact && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recurring Payments
            </h2>
            {!externalViewMode && (
              <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-700 rounded-lg">
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                    </svg>
                    List
                  </span>
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                    Grid
                  </span>
                </button>
              </div>
            )}
          </div>

          {/* Filter and Sort Controls */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {/* Type Filters */}
            <span className="text-gray-500 dark:text-gray-400">Show:</span>
            {subscriptionCount > 0 && (
              <button
                onClick={() => toggleTypeFilter('subscription')}
                className={`px-2 py-1 rounded-full transition-colors ${
                  typeFilters.has('subscription')
                    ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500'
                }`}
              >
                Subs ({subscriptionCount})
              </button>
            )}
            {recurringCount > 0 && (
              <button
                onClick={() => toggleTypeFilter('recurring_expense')}
                className={`px-2 py-1 rounded-full transition-colors ${
                  typeFilters.has('recurring_expense')
                    ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500'
                }`}
              >
                Recurring ({recurringCount})
              </button>
            )}
            {fixedCount > 0 && (
              <button
                onClick={() => toggleTypeFilter('fixed_expense')}
                className={`px-2 py-1 rounded-full transition-colors ${
                  typeFilters.has('fixed_expense')
                    ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500'
                }`}
              >
                Fixed ({fixedCount})
              </button>
            )}

            <span className="mx-1 text-gray-300 dark:text-gray-600">|</span>

            {/* Sort Options */}
            <span className="text-gray-500 dark:text-gray-400">Sort:</span>
            <button
              onClick={() => handleSort('name')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                sortBy === 'name'
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Name
              {sortBy === 'name' && (
                <svg className={`w-3 h-3 ${sortDir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
            <button
              onClick={() => handleSort('amount')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                sortBy === 'amount'
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Amount
              {sortBy === 'amount' && (
                <svg className={`w-3 h-3 ${sortDir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
            <button
              onClick={() => handleSort('day')}
              className={`px-2 py-1 rounded transition-colors flex items-center gap-1 ${
                sortBy === 'day'
                  ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              Day
              {sortBy === 'day' && (
                <svg className={`w-3 h-3 ${sortDir === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                </svg>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      {viewMode === 'list' ? (
        <SubscriptionList
          subscriptions={filteredAndSortedSubscriptions}
          transactions={transactions}
          onSubscriptionClick={onSubscriptionClick}
          onEditSubscription={onEditSubscription}
        />
      ) : (
        <SubscriptionGrid
          subscriptions={filteredAndSortedSubscriptions}
          transactions={transactions}
          onSubscriptionClick={onSubscriptionClick}
          onEditSubscription={onEditSubscription}
        />
      )}
    </div>
  );
}

/**
 * Compact card version for Overview tab (Option 3)
 */
export function SubscriptionCard({
  subscriptions,
  transactions: _transactions,
  onViewAll,
}: {
  subscriptions: Subscription[];
  transactions: Transaction[];
  onViewAll?: () => void;
}) {
  const [showUpcoming, setShowUpcoming] = useState(true);

  const totalMonthly = subscriptions
    .filter(s => s.isActive)
    .reduce((sum, s) => sum + s.amount, 0);

  const formatAmount = (amount: number) =>
    amount.toLocaleString('sv-SE', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' kr';

  // Get upcoming payments in the next 14 days
  const upcomingPayments = useMemo(
    () => getUpcomingPayments(subscriptions, 14),
    [subscriptions]
  );

  // Get top 4 subscriptions by amount
  const topSubscriptions = [...subscriptions]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  if (subscriptions.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recurring Payments
          </h3>
        </div>
        <RecurringEmptyState />
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Recurring Payments
        </h3>
        {onViewAll && (
          <button
            onClick={onViewAll}
            className="text-sm text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 font-medium"
          >
            View all
          </button>
        )}
      </div>

      {/* Summary */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 mb-4 border border-primary-200 dark:border-primary-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-primary-600 dark:text-primary-400 uppercase tracking-wide">
              Monthly Total
            </div>
            <div className="text-2xl font-bold text-primary-900 dark:text-primary-100">
              {formatAmount(totalMonthly)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-primary-600 dark:text-primary-400">
              {subscriptions.length} active
            </div>
          </div>
        </div>
      </div>

      {/* Toggle between Top Subscriptions and Upcoming Payments */}
      <div className="flex gap-1 mb-3 p-0.5 bg-gray-100 dark:bg-slate-700 rounded-lg">
        <button
          onClick={() => setShowUpcoming(false)}
          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
            !showUpcoming
              ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Top
        </button>
        <button
          onClick={() => setShowUpcoming(true)}
          className={`flex-1 px-2 py-1.5 text-xs font-medium rounded transition-colors flex items-center justify-center gap-1 ${
            showUpcoming
              ? 'bg-white dark:bg-slate-600 text-gray-900 dark:text-white shadow-sm'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          Upcoming
          {upcomingPayments.length > 0 && (
            <span className={`px-1.5 py-0.5 text-[10px] rounded-full ${
              showUpcoming
                ? 'bg-warning-100 dark:bg-warning-900/50 text-warning-700 dark:text-warning-300'
                : 'bg-gray-200 dark:bg-slate-600 text-gray-600 dark:text-gray-400'
            }`}>
              {upcomingPayments.length}
            </span>
          )}
        </button>
      </div>

      {/* Content based on toggle */}
      {showUpcoming ? (
        /* Upcoming Payments */
        upcomingPayments.length > 0 ? (
          <div className="space-y-2">
            {upcomingPayments.slice(0, 4).map((payment) => {
              const icon = getCategoryIcon(payment.subscription.categoryId);
              const color = getCategoryColor(payment.subscription.categoryId);
              const isToday = payment.daysUntil === 0;
              const isTomorrow = payment.daysUntil === 1;
              const isThisWeek = payment.daysUntil <= 7;

              return (
                <div
                  key={payment.subscription.id}
                  className={`p-3 rounded-lg border ${
                    isToday
                      ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
                      : isTomorrow
                      ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
                      : 'bg-gray-50 dark:bg-slate-700/50 border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded flex items-center justify-center text-sm flex-shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      {icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {payment.subscription.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatAmount(payment.subscription.amount)}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-xs font-medium ${
                        isToday
                          ? 'text-danger-600 dark:text-danger-400'
                          : isTomorrow
                          ? 'text-warning-600 dark:text-warning-400'
                          : isThisWeek
                          ? 'text-primary-600 dark:text-primary-400'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}>
                        {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : `${payment.daysUntil}d`}
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">
                        {payment.dueDate.toLocaleDateString('sv-SE', { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {upcomingPayments.length > 4 && (
              <div className="text-center">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  +{upcomingPayments.length - 4} more in next 14 days
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500 dark:text-gray-400">
            <svg className="w-8 h-8 mx-auto mb-2 text-gray-300 dark:text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-xs">No payments in the next 14 days</p>
          </div>
        )
      ) : (
        /* Top Subscriptions Mini Grid */
        <>
          <div className="grid grid-cols-2 gap-2">
            {topSubscriptions.map((sub) => {
              const icon = getCategoryIcon(sub.categoryId);
              const color = getCategoryColor(sub.categoryId);

              return (
                <div
                  key={sub.id}
                  className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-7 h-7 rounded flex items-center justify-center text-sm flex-shrink-0"
                      style={{ backgroundColor: `${color}20` }}
                    >
                      {icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium text-gray-900 dark:text-white truncate">
                        {sub.name}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {formatAmount(sub.amount)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Show more hint (only for top subscriptions view) */}
      {!showUpcoming && subscriptions.length > 4 && (
        <div className="mt-3 text-center">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            +{subscriptions.length - 4} more subscription{subscriptions.length - 4 !== 1 ? 's' : ''}
          </span>
        </div>
      )}
    </div>
  );
}

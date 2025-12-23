import { useState, useMemo } from 'react';
import type { Subscription, Transaction } from '../types/transaction';
import { getCategoryName, getSubcategoryName, getCategoryIcon, getCategoryColor } from '../utils/category-service';
import { calculateMonthlySubscriptionCost } from '../utils/subscription-detection';
import { toTitleCase } from '../utils/text-utils';

interface SubscriptionListProps {
  subscriptions: Subscription[];
  transactions: Transaction[];
  onSubscriptionClick?: (subscription: Subscription) => void;
  onEditSubscription?: (subscription: Subscription) => void;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' kr';
}

function getOrdinalSuffix(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

interface GroupedSubscriptions {
  subcategoryId: string | null;
  categoryId: string | null;
  subcategoryName: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  subscriptions: Subscription[];
  totalMonthly: number;
}

/**
 * Variation A: Grouped Accordion List
 * Subscriptions grouped by subcategory in expandable accordion sections
 */
export function SubscriptionList({
  subscriptions,
  transactions,
  onSubscriptionClick,
  onEditSubscription
}: SubscriptionListProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['uncategorized']));
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  // Pre-compute transaction lookup map for O(1) access
  const transactionMap = useMemo(() => {
    const map = new Map<string, Transaction>();
    transactions.forEach(t => map.set(t.id, t));
    return map;
  }, [transactions]);

  // Pre-compute last payment for each subscription
  const lastPaymentMap = useMemo(() => {
    const map = new Map<string, Transaction | null>();
    subscriptions.forEach(sub => {
      const subTransactions = sub.transactionIds
        .map(id => transactionMap.get(id))
        .filter((t): t is Transaction => t !== undefined)
        .sort((a, b) => b.date.getTime() - a.date.getTime());
      map.set(sub.id, subTransactions[0] || null);
    });
    return map;
  }, [subscriptions, transactionMap]);

  // Group subscriptions by subcategory
  const groupedSubscriptions = useMemo(() => {
    const groups = new Map<string, GroupedSubscriptions>();

    for (const sub of subscriptions) {
      const key = sub.subcategoryId || sub.categoryId || 'uncategorized';
      const existing = groups.get(key);

      if (existing) {
        existing.subscriptions.push(sub);
        existing.totalMonthly += sub.amount;
      } else {
        const categoryName = getCategoryName(sub.categoryId) || 'Uncategorized';
        const subcategoryName = getSubcategoryName(sub.categoryId, sub.subcategoryId) || categoryName;

        groups.set(key, {
          subcategoryId: sub.subcategoryId,
          categoryId: sub.categoryId,
          subcategoryName,
          categoryName,
          categoryIcon: getCategoryIcon(sub.categoryId),
          categoryColor: getCategoryColor(sub.categoryId),
          subscriptions: [sub],
          totalMonthly: sub.amount,
        });
      }
    }

    // Sort groups by total monthly cost (highest first)
    return Array.from(groups.values()).sort((a, b) => b.totalMonthly - a.totalMonthly);
  }, [subscriptions]);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const handleSubscriptionClick = (sub: Subscription) => {
    setSelectedSubscription(selectedSubscription?.id === sub.id ? null : sub);
    onSubscriptionClick?.(sub);
  };

  const totalMonthly = calculateMonthlySubscriptionCost(subscriptions);

  if (subscriptions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        <svg
          className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-slate-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
          />
        </svg>
        <p className="font-medium">No subscriptions detected</p>
        <p className="text-sm mt-1">Import transactions to detect recurring payments</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4 border border-primary-200 dark:border-primary-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-primary-700 dark:text-primary-300">
              Monthly Recurring
            </h3>
            <p className="text-2xl font-bold text-primary-900 dark:text-primary-100 mt-1">
              {formatAmount(totalMonthly)}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm text-primary-600 dark:text-primary-400">
              {subscriptions.length} active
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap justify-end">
              {subscriptions.filter(s => s.recurringType === 'subscription').length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                  {subscriptions.filter(s => s.recurringType === 'subscription').length} subs
                </span>
              )}
              {subscriptions.filter(s => s.recurringType === 'recurring_expense').length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                  {subscriptions.filter(s => s.recurringType === 'recurring_expense').length} recurring
                </span>
              )}
              {subscriptions.filter(s => s.recurringType === 'fixed_expense').length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  {subscriptions.filter(s => s.recurringType === 'fixed_expense').length} fixed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Grouped Accordion */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
        {groupedSubscriptions.map((group) => {
          const groupKey = group.subcategoryId || group.categoryId || 'uncategorized';
          const isExpanded = expandedGroups.has(groupKey);

          return (
            <div key={groupKey} className="border-b border-gray-100 dark:border-slate-700 last:border-b-0">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(groupKey)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                    style={{ backgroundColor: `${group.categoryColor}20` }}
                  >
                    {group.categoryIcon}
                  </span>
                  <div className="text-left">
                    <div className="font-medium text-gray-900 dark:text-white">
                      {group.subcategoryName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {group.subscriptions.length} subscription{group.subscriptions.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-medium text-gray-900 dark:text-white">
                    {formatAmount(group.totalMonthly)}
                  </span>
                  <svg
                    className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="px-4 pb-3 space-y-2">
                  {group.subscriptions.map((sub) => {
                    const isSelected = selectedSubscription?.id === sub.id;
                    const lastPayment = lastPaymentMap.get(sub.id) || null;

                    return (
                      <div
                        key={sub.id}
                        onClick={() => handleSubscriptionClick(sub)}
                        className={`ml-11 p-3 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800'
                            : 'bg-gray-50 dark:bg-slate-700/50 border border-transparent hover:border-gray-200 dark:hover:border-slate-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-white">
                              {toTitleCase(sub.name)}
                            </span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                              sub.recurringType === 'subscription'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                : sub.recurringType === 'fixed_expense'
                                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            }`}>
                              {sub.recurringType === 'subscription' ? 'Sub' : sub.recurringType === 'fixed_expense' ? 'Fixed' : 'Recurring'}
                            </span>
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {formatAmount(sub.amount)}
                          </span>
                        </div>

                        {/* Expanded details */}
                        {isSelected && (
                          <div className="mt-3 pt-3 border-t border-primary-200 dark:border-primary-700 space-y-2 text-sm">
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                              <span>Type</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                sub.recurringType === 'subscription'
                                  ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                                  : sub.recurringType === 'fixed_expense'
                                  ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'
                                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                              }`}>
                                {sub.recurringType === 'subscription' ? 'Subscription' : sub.recurringType === 'fixed_expense' ? 'Fixed expense' : 'Recurring expense'}
                              </span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                              <span>Billing day</span>
                              <span className="text-gray-900 dark:text-white">
                                {sub.billingDay}{getOrdinalSuffix(sub.billingDay)} of month
                              </span>
                            </div>
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                              <span>Payments recorded</span>
                              <span className="text-gray-900 dark:text-white">
                                {sub.transactionIds.length}
                              </span>
                            </div>
                            {lastPayment && (
                              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                                <span>Last payment</span>
                                <span className="text-gray-900 dark:text-white">
                                  {lastPayment.date.toLocaleDateString('sv-SE')}
                                </span>
                              </div>
                            )}
                            <div className="flex justify-between text-gray-600 dark:text-gray-400">
                              <span>Yearly cost</span>
                              <span className="font-medium text-gray-900 dark:text-white">
                                {formatAmount(sub.amount * 12)}
                              </span>
                            </div>
                            {/* Edit Button */}
                            {onEditSubscription && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onEditSubscription(sub);
                                }}
                                className="w-full mt-2 px-3 py-2 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors flex items-center justify-center gap-2"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                                Edit Subscription
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

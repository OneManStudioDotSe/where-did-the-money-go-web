import { useState } from 'react';
import type { DetectedSubscription, RecurringType } from '../types/transaction';
import { getCategoryName, getSubcategoryName, getCategoryIcon, getCategoryColor } from '../utils/category-service';
import { toTitleCase } from '../utils/text-utils';

interface SubscriptionConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmedWithTypes: Array<{ id: string; type: RecurringType }>, rejectedIds: string[]) => void;
  detectedSubscriptions: DetectedSubscription[];
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

type DecisionType = RecurringType | 'skip' | null;

export function SubscriptionConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  detectedSubscriptions,
}: SubscriptionConfirmationDialogProps) {
  // Track decision for each subscription: 'subscription', 'recurring_expense', 'skip', or null (undecided)
  const [decisions, setDecisions] = useState<Record<string, DecisionType>>(() => {
    const initial: Record<string, DecisionType> = {};
    detectedSubscriptions.forEach(s => {
      initial[s.id] = null;
    });
    return initial;
  });

  if (!isOpen || detectedSubscriptions.length === 0) return null;

  const handleSetType = (id: string, type: DecisionType) => {
    setDecisions(prev => ({
      ...prev,
      [id]: prev[id] === type ? null : type,
    }));
  };

  const handleSelectAllAsSubscription = () => {
    const newDecisions: Record<string, DecisionType> = {};
    detectedSubscriptions.forEach(s => {
      newDecisions[s.id] = 'subscription';
    });
    setDecisions(newDecisions);
  };

  const handleSelectAllAsRecurring = () => {
    const newDecisions: Record<string, DecisionType> = {};
    detectedSubscriptions.forEach(s => {
      newDecisions[s.id] = 'recurring_expense';
    });
    setDecisions(newDecisions);
  };

  const handleClearAll = () => {
    const newDecisions: Record<string, DecisionType> = {};
    detectedSubscriptions.forEach(s => {
      newDecisions[s.id] = null;
    });
    setDecisions(newDecisions);
  };

  const handleSubmit = () => {
    const confirmedWithTypes: Array<{ id: string; type: RecurringType }> = [];
    const rejectedIds: string[] = [];

    for (const [id, decision] of Object.entries(decisions)) {
      if (decision === 'subscription' || decision === 'recurring_expense') {
        confirmedWithTypes.push({ id, type: decision });
      } else if (decision === 'skip') {
        rejectedIds.push(id);
      }
      // null decisions are ignored
    }

    onConfirm(confirmedWithTypes, rejectedIds);
  };

  const subscriptionCount = Object.values(decisions).filter(d => d === 'subscription').length;
  const recurringCount = Object.values(decisions).filter(d => d === 'recurring_expense').length;
  const confirmedCount = subscriptionCount + recurringCount;

  const totalMonthly = detectedSubscriptions
    .filter(s => decisions[s.id] === 'subscription' || decisions[s.id] === 'recurring_expense')
    .reduce((sum, s) => sum + s.averageAmount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center">
              <svg className="w-5 h-5 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Recurring Payments Detected
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Classify each as a subscription or recurring expense
              </p>
            </div>
          </div>
        </div>

        {/* Summary Bar */}
        <div className="px-6 py-3 bg-gray-50 dark:bg-slate-800/50 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-3">
              <span>
                <span className="font-medium text-primary-600 dark:text-primary-400">{confirmedCount}</span> selected
              </span>
              {subscriptionCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300">
                  {subscriptionCount} subscription{subscriptionCount !== 1 ? 's' : ''}
                </span>
              )}
              {recurringCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                  {recurringCount} recurring
                </span>
              )}
              {confirmedCount > 0 && (
                <span className="text-gray-400 dark:text-gray-500">
                  = <span className="font-medium text-gray-900 dark:text-white">{formatAmount(totalMonthly)}/mo</span>
                </span>
              )}
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleSelectAllAsSubscription}
                className="text-xs px-2 py-1 rounded bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 hover:bg-primary-200 dark:hover:bg-primary-900/50 transition-colors"
                title="Mark all as subscriptions"
              >
                All Sub
              </button>
              <button
                onClick={handleSelectAllAsRecurring}
                className="text-xs px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
                title="Mark all as recurring expenses"
              >
                All Recurring
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs px-2 py-1 rounded bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Subscription List */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="space-y-3">
            {detectedSubscriptions.map((subscription) => {
              const decision = decisions[subscription.id];
              const categoryName = getCategoryName(subscription.categoryId);
              const subcategoryName = getSubcategoryName(subscription.categoryId, subscription.subcategoryId);
              const categoryIcon = getCategoryIcon(subscription.categoryId);
              const categoryColor = getCategoryColor(subscription.categoryId);

              return (
                <div
                  key={subscription.id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    decision === 'subscription'
                      ? 'border-primary-500 dark:border-primary-400 bg-primary-50 dark:bg-primary-900/30'
                      : decision === 'recurring_expense'
                      ? 'border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-900/30'
                      : decision === 'skip'
                      ? 'border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-800/50 opacity-50'
                      : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Category Icon */}
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                      style={{ backgroundColor: `${categoryColor}20` }}
                    >
                      {categoryIcon}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className={`font-medium truncate ${
                            decision === 'subscription'
                              ? 'text-primary-900 dark:text-white'
                              : decision === 'recurring_expense'
                              ? 'text-amber-900 dark:text-white'
                              : 'text-gray-900 dark:text-white'
                          }`}>
                            {toTitleCase(subscription.recipientName)}
                          </h3>
                          <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                            {categoryName && (
                              <span className="flex items-center gap-1">
                                {categoryName}
                                {subcategoryName && (
                                  <span className="text-gray-400 dark:text-gray-500">
                                    &gt; {subcategoryName}
                                  </span>
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {formatAmount(subscription.averageAmount)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            per month
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {subscription.commonDayOfMonth}{getOrdinalSuffix(subscription.commonDayOfMonth)} of month
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {subscription.occurrenceCount} payments
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons - 3 options */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => handleSetType(subscription.id, 'subscription')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          decision === 'subscription'
                            ? 'bg-primary-500 text-white'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/30 hover:text-primary-600 dark:hover:text-primary-400'
                        }`}
                        title="Cancellable service (Netflix, Spotify, gym)"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Subscription
                      </button>
                      <button
                        onClick={() => handleSetType(subscription.id, 'recurring_expense')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          decision === 'recurring_expense'
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400'
                        }`}
                        title="Fixed expense (loan, rent, insurance)"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Recurring
                      </button>
                      <button
                        onClick={() => handleSetType(subscription.id, 'skip')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                          decision === 'skip'
                            ? 'bg-gray-500 text-white'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                        title="Skip this payment"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Skip
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            Skip for now
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Confirm Selection
          </button>
        </div>
      </div>
    </div>
  );
}

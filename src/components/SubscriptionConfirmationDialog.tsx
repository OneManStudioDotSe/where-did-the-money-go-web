import { useState } from 'react';
import type { DetectedSubscription, RecurringType, Transaction } from '../types/transaction';
import { getCategoryName, getSubcategoryName, getCategoryIcon, getCategoryColor } from '../utils/category-service';
import { getBillingFrequencyLabel, getBillingDayLabel } from '../utils/subscription-detection';
import { toTitleCase } from '../utils/text-utils';

interface SubscriptionConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (confirmedWithTypes: Array<{ id: string; type: RecurringType }>, rejectedIds: string[]) => void;
  detectedSubscriptions: DetectedSubscription[];
  transactions: Transaction[];
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' kr';
}

type DecisionType = RecurringType | 'skip' | null;

export function SubscriptionConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  detectedSubscriptions,
  transactions,
}: SubscriptionConfirmationDialogProps) {
  // Track decision for each subscription: 'subscription', 'recurring_expense', 'skip', or null (undecided)
  const [decisions, setDecisions] = useState<Record<string, DecisionType>>(() => {
    const initial: Record<string, DecisionType> = {};
    detectedSubscriptions.forEach(s => {
      initial[s.id] = null;
    });
    return initial;
  });

  // Track which subscriptions have their transaction preview expanded
  const [expandedPreviews, setExpandedPreviews] = useState<Set<string>>(new Set());

  const togglePreview = (id: string) => {
    setExpandedPreviews(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Create a map of transaction ID to transaction for quick lookup
  const transactionMap = new Map(transactions.map(t => [t.id, t]));

  if (!isOpen || detectedSubscriptions.length === 0) return null;

  const handleSetType = (id: string, type: DecisionType) => {
    setDecisions(prev => ({
      ...prev,
      [id]: prev[id] === type ? null : type,
    }));
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
      if (decision === 'subscription' || decision === 'recurring_expense' || decision === 'fixed_expense') {
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
  const fixedCount = Object.values(decisions).filter(d => d === 'fixed_expense').length;
  const confirmedCount = subscriptionCount + recurringCount + fixedCount;

  const totalMonthly = detectedSubscriptions
    .filter(s => decisions[s.id] === 'subscription' || decisions[s.id] === 'recurring_expense' || decisions[s.id] === 'fixed_expense')
    .reduce((sum, s) => sum + s.averageAmount, 0);

  // Helper to format amount range
  const formatAmountRange = (min: number, max: number): string => {
    if (Math.abs(min - max) < 1) {
      return formatAmount(min);
    }
    return `${formatAmount(min)} - ${formatAmount(max)}`;
  };

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
            <div className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-3 flex-wrap">
              <span>
                <span className="font-medium text-primary-600 dark:text-primary-400">{confirmedCount}</span> selected
              </span>
              {subscriptionCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                  {subscriptionCount} sub
                </span>
              )}
              {recurringCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                  {recurringCount} recurring
                </span>
              )}
              {fixedCount > 0 && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                  {fixedCount} fixed
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
                      ? 'border-purple-500 dark:border-purple-400 bg-purple-50 dark:bg-purple-900/30'
                      : decision === 'recurring_expense'
                      ? 'border-amber-500 dark:border-amber-400 bg-amber-50 dark:bg-amber-900/30'
                      : decision === 'fixed_expense'
                      ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/30'
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
                              ? 'text-purple-900 dark:text-white'
                              : decision === 'recurring_expense'
                              ? 'text-amber-900 dark:text-white'
                              : decision === 'fixed_expense'
                              ? 'text-blue-900 dark:text-white'
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
                            {formatAmountRange(subscription.minAmount, subscription.maxAmount)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            per month
                          </div>
                        </div>
                      </div>

                      {/* Details */}
                      <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-gray-500 dark:text-gray-400">
                        {/* Confidence badge */}
                        <span className={`px-1.5 py-0.5 rounded-full font-medium ${
                          subscription.confidence >= 75
                            ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400'
                            : subscription.confidence >= 50
                            ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400'
                            : 'bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-400'
                        }`}>
                          {subscription.confidence}% confidence
                        </span>
                        {/* Frequency badge */}
                        <span className="px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300">
                          {getBillingFrequencyLabel(subscription.billingFrequency)}
                        </span>
                        <span className="flex items-center gap-1">
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {getBillingDayLabel(subscription.expectedBillingDay, subscription.billingFrequency)}
                        </span>
                        <button
                          onClick={() => togglePreview(subscription.id)}
                          className="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                          {subscription.occurrenceCount} payments
                          <svg
                            className={`w-3 h-3 transition-transform ${expandedPreviews.has(subscription.id) ? 'rotate-180' : ''}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      </div>

                      {/* Expandable Transaction Preview */}
                      {expandedPreviews.has(subscription.id) && (
                        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-slate-600">
                          <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                            Transaction History
                          </div>
                          <div className="space-y-1.5 max-h-40 overflow-y-auto">
                            {subscription.transactionIds
                              .map(id => transactionMap.get(id))
                              .filter((t): t is Transaction => t !== undefined)
                              .sort((a, b) => b.date.getTime() - a.date.getTime())
                              .map(transaction => (
                                <div
                                  key={transaction.id}
                                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded bg-gray-50 dark:bg-slate-700/50"
                                >
                                  <div className="flex-1 min-w-0">
                                    <div className="text-gray-600 dark:text-gray-300 truncate" title={transaction.description}>
                                      {transaction.description}
                                    </div>
                                    <div className="text-gray-400 dark:text-gray-500">
                                      {transaction.date.toLocaleDateString('sv-SE')}
                                    </div>
                                  </div>
                                  <div className="text-right flex-shrink-0 ml-2">
                                    <span className="font-medium text-gray-700 dark:text-gray-200">
                                      {formatAmount(transaction.amount)}
                                    </span>
                                  </div>
                                </div>
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons - 4 options */}
                    <div className="flex flex-col gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleSetType(subscription.id, 'subscription')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                          decision === 'subscription'
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 hover:text-purple-600 dark:hover:text-purple-400'
                        }`}
                        title="Cancellable service (Netflix, Spotify, gym)"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        Sub
                      </button>
                      <button
                        onClick={() => handleSetType(subscription.id, 'recurring_expense')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                          decision === 'recurring_expense'
                            ? 'bg-amber-500 text-white'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:text-amber-600 dark:hover:text-amber-400'
                        }`}
                        title="Regular recurring expense"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Recurring
                      </button>
                      <button
                        onClick={() => handleSetType(subscription.id, 'fixed_expense')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                          decision === 'fixed_expense'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400'
                        }`}
                        title="Fixed expense (loan, rent, insurance)"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        Fixed
                      </button>
                      <button
                        onClick={() => handleSetType(subscription.id, 'skip')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors ${
                          decision === 'skip'
                            ? 'bg-gray-500 text-white'
                            : 'bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-600 hover:text-gray-600 dark:hover:text-gray-300'
                        }`}
                        title="Skip this payment"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

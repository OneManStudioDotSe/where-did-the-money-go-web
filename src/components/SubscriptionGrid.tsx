import { useState, useMemo } from 'react';
import type { Subscription, Transaction } from '../types/transaction';
import { getCategoryName, getSubcategoryName, getCategoryIcon, getCategoryColor } from '../utils/category-service';
import { calculateMonthlySubscriptionCost } from '../utils/subscription-detection';
import { toTitleCase } from '../utils/text-utils';
import { RecurringEmptyState } from './ui/EmptyState';

interface SubscriptionGridProps {
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

/**
 * Variation B: Card Grid
 * Each subscription as a compact card in a responsive grid
 */
export function SubscriptionGrid({
  subscriptions,
  transactions,
  onSubscriptionClick,
  onEditSubscription
}: SubscriptionGridProps) {
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);

  // Pre-compute transaction lookup map for O(1) access
  const transactionMap = useMemo(() => {
    const map = new Map<string, Transaction>();
    transactions.forEach(t => map.set(t.id, t));
    return map;
  }, [transactions]);

  // Pre-compute transactions for selected subscription
  const selectedTransactions = useMemo(() => {
    if (!selectedSubscription) return [];
    return selectedSubscription.transactionIds
      .map(id => transactionMap.get(id))
      .filter((t): t is Transaction => t !== undefined)
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [selectedSubscription, transactionMap]);

  const handleCardClick = (sub: Subscription) => {
    setSelectedSubscription(selectedSubscription?.id === sub.id ? null : sub);
    onSubscriptionClick?.(sub);
  };

  const closeModal = () => {
    setSelectedSubscription(null);
  };

  const totalMonthly = calculateMonthlySubscriptionCost(subscriptions);

  if (subscriptions.length === 0) {
    return <RecurringEmptyState />;
  }

  // Get details for selected subscription (using pre-computed transactions)
  const selectedDetails = useMemo(() => {
    if (!selectedSubscription) return null;
    return {
      sub: selectedSubscription,
      categoryName: getCategoryName(selectedSubscription.categoryId) || 'Uncategorized',
      subcategoryName: getSubcategoryName(selectedSubscription.categoryId, selectedSubscription.subcategoryId),
      categoryIcon: getCategoryIcon(selectedSubscription.categoryId),
      categoryColor: getCategoryColor(selectedSubscription.categoryId),
      transactions: selectedTransactions,
    };
  }, [selectedSubscription, selectedTransactions]);

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
            <div className="flex items-center gap-2 mt-1">
              {subscriptions.filter(s => s.recurringType === 'subscription').length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                  {subscriptions.filter(s => s.recurringType === 'subscription').length} subscriptions
                </span>
              )}
              {subscriptions.filter(s => s.recurringType === 'fixed').length > 0 && (
                <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                  {subscriptions.filter(s => s.recurringType === 'fixed').length} fixed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {subscriptions.map((sub) => {
          const categoryIcon = getCategoryIcon(sub.categoryId);
          const categoryColor = getCategoryColor(sub.categoryId);
          const isSelected = selectedSubscription?.id === sub.id;

          return (
            <div
              key={sub.id}
              onClick={() => handleCardClick(sub)}
              className={`p-4 rounded-xl border-2 cursor-pointer transition-all animate-card-hover ${
                isSelected
                  ? 'border-primary-500 dark:border-primary-600 bg-primary-50 dark:bg-primary-900/20 shadow-md'
                  : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-gray-300 dark:hover:border-slate-600'
              }`}
            >
              {/* Icon and Name */}
              <div className="flex items-start gap-3">
                <div className="relative flex-shrink-0">
                  <span
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                    style={{ backgroundColor: `${categoryColor}20` }}
                  >
                    {categoryIcon}
                  </span>
                  {/* Type indicator dot */}
                  <span
                    className={`absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${
                      sub.recurringType === 'subscription'
                        ? 'bg-purple-500'
                        : 'bg-amber-500'
                    }`}
                    title={sub.recurringType === 'subscription' ? 'Subscription' : 'Recurring expense'}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white text-sm truncate">
                    {toTitleCase(sub.name)}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    Day {sub.billingDay}
                  </p>
                </div>
              </div>

              {/* Amount */}
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-slate-700">
                <div className="text-lg font-bold text-gray-900 dark:text-white">
                  {formatAmount(sub.amount)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  per month
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detail Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 animate-fade-in" onClick={closeModal}>
          <div
            className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <span
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                  style={{ backgroundColor: `${selectedDetails.categoryColor}20` }}
                >
                  {selectedDetails.categoryIcon}
                </span>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {toTitleCase(selectedDetails.sub.name)}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {selectedDetails.categoryName}
                    {selectedDetails.subcategoryName && ` › ${selectedDetails.subcategoryName}`}
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content - Horizontal Layout */}
            <div className="px-6 py-4">
              <div className="flex gap-6">
                {/* Left Side - Subscription Information */}
                <div className="flex-1 space-y-4">
                  {/* Cost Information */}
                  <div className="bg-primary-50 dark:bg-primary-900/20 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                          Monthly
                        </div>
                        <div className="text-2xl font-bold text-primary-900 dark:text-primary-100">
                          {formatAmount(selectedDetails.sub.amount)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-primary-600 dark:text-primary-400 uppercase tracking-wide">
                          Yearly
                        </div>
                        <div className="text-2xl font-bold text-primary-900 dark:text-primary-100">
                          {formatAmount(selectedDetails.sub.amount * 12)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</div>
                        <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                          selectedDetails.sub.recurringType === 'subscription'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400'
                            : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                        }`}>
                          {selectedDetails.sub.recurringType === 'subscription' ? 'Subscription' : 'Recurring'}
                        </span>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Billing Day</div>
                        <div className="font-medium text-gray-900 dark:text-white mt-1">
                          {selectedDetails.sub.billingDay}{getOrdinalSuffix(selectedDetails.sub.billingDay)} of month
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total Payments</div>
                        <div className="font-medium text-gray-900 dark:text-white mt-1">
                          {selectedDetails.sub.transactionIds.length}
                        </div>
                      </div>
                      {selectedDetails.transactions[0] && (
                        <div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last Paid</div>
                          <div className="font-medium text-gray-900 dark:text-white mt-1">
                            {selectedDetails.transactions[0].date.toLocaleDateString('sv-SE')}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit Button */}
                  {onEditSubscription && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeModal();
                        onEditSubscription(selectedDetails.sub);
                      }}
                      className="w-full px-4 py-2.5 text-sm font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit Subscription
                    </button>
                  )}
                </div>

                {/* Right Side - Transactions List */}
                <div className="w-72 flex-shrink-0">
                  <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-3">
                    Payment History ({selectedDetails.transactions.length})
                  </h4>
                  {selectedDetails.transactions.length > 0 ? (
                    <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                      {selectedDetails.transactions.map((t) => (
                        <div
                          key={t.id}
                          className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg text-sm"
                        >
                          <span className="text-gray-600 dark:text-gray-400">
                            {t.date.toLocaleDateString('sv-SE', { year: 'numeric', month: 'short', day: 'numeric' })}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {formatAmount(Math.abs(t.amount))}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400 dark:text-gray-500">
                      <p className="text-sm">No payments recorded</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

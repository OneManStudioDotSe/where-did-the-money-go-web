import { useState, useEffect } from 'react';
import type { Subscription } from '../types/transaction';
import { getCategoryName, getSubcategoryName, getCategoryIcon, getCategoryColor } from '../utils/category-service';

interface SubscriptionEditModalProps {
  subscription: Subscription | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (subscription: Subscription) => void;
  onDelete: (subscriptionId: string) => void;
}

function formatAmount(amount: number): string {
  return amount.toLocaleString('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' kr';
}

export function SubscriptionEditModal({
  subscription,
  isOpen,
  onClose,
  onSave,
  onDelete,
}: SubscriptionEditModalProps) {
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Sync form state when subscription changes
  useEffect(() => {
    if (subscription) {
      setName(subscription.name);
      setAmount(subscription.amount.toFixed(2));
      setIsActive(subscription.isActive);
      setShowDeleteConfirm(false);
    }
  }, [subscription]);

  if (!isOpen || !subscription) return null;

  const categoryName = getCategoryName(subscription.categoryId) || 'Uncategorized';
  const subcategoryName = getSubcategoryName(subscription.categoryId, subscription.subcategoryId);
  const categoryIcon = getCategoryIcon(subscription.categoryId);
  const categoryColor = getCategoryColor(subscription.categoryId);

  const handleSave = () => {
    const parsedAmount = parseFloat(amount.replace(',', '.'));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return;
    }

    onSave({
      ...subscription,
      name: name.trim() || subscription.name,
      amount: parsedAmount,
      isActive,
    });
    onClose();
  };

  const handleDelete = () => {
    onDelete(subscription.id);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const hasChanges =
    name !== subscription.name ||
    parseFloat(amount.replace(',', '.')) !== subscription.amount ||
    isActive !== subscription.isActive;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={handleBackdropClick}
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <span
              className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
              style={{ backgroundColor: `${categoryColor}20` }}
            >
              {categoryIcon}
            </span>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Edit Subscription
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {categoryName}
                {subcategoryName && ` > ${subcategoryName}`}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 py-4 space-y-4">
          {/* Name Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="Subscription name"
            />
          </div>

          {/* Amount Field */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Monthly Amount (kr)
            </label>
            <input
              type="text"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors"
              placeholder="0.00"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Yearly: {formatAmount(parseFloat(amount.replace(',', '.') || '0') * 12)}
            </p>
          </div>

          {/* Status Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Status
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setIsActive(true)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400 border-2 border-success-500'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:border-gray-300 dark:hover:border-slate-500'
                }`}
              >
                Active
              </button>
              <button
                onClick={() => setIsActive(false)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  !isActive
                    ? 'bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400 border-2 border-warning-500'
                    : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 border-2 border-transparent hover:border-gray-300 dark:hover:border-slate-500'
                }`}
              >
                Paused
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {isActive
                ? 'This subscription is included in monthly totals'
                : 'This subscription is excluded from monthly totals'}
            </p>
          </div>

          {/* Info */}
          <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Billing day</span>
              <span className="text-gray-900 dark:text-white">{subscription.billingDay}th of month</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500 dark:text-gray-400">Total payments</span>
              <span className="text-gray-900 dark:text-white">{subscription.transactionIds.length}</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-slate-700 space-y-3">
          {/* Delete Confirmation */}
          {showDeleteConfirm ? (
            <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-3">
              <p className="text-sm text-danger-700 dark:text-danger-400 mb-3">
                Are you sure you want to delete this subscription? This cannot be undone.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleDelete}
                  className="flex-1 px-3 py-2 bg-danger-600 text-white text-sm font-medium rounded-lg hover:bg-danger-700 transition-colors"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 text-danger-600 dark:text-danger-400 text-sm font-medium hover:bg-danger-50 dark:hover:bg-danger-900/20 rounded-lg transition-colors"
              >
                Delete
              </button>
              <div className="flex-1" />
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!hasChanges}
                className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Save Changes
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

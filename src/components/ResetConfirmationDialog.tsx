import { useEffect } from 'react';

interface ResetConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onResetKeepSubscriptions: () => void;
  onResetEverything: () => void;
  subscriptionCount: number;
}

export function ResetConfirmationDialog({
  isOpen,
  onClose,
  onResetKeepSubscriptions,
  onResetEverything,
  subscriptionCount,
}: ResetConfirmationDialogProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-md w-full p-6">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-warning-600 dark:text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Start over?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                This will clear all transaction data from the current session.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                You have <span className="font-medium text-primary-600 dark:text-primary-400">{subscriptionCount} saved subscription{subscriptionCount !== 1 ? 's' : ''}</span> that will be kept for your next import, unless you choose to reset them too.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <button
              onClick={onResetKeepSubscriptions}
              className="w-full px-4 py-2.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              Keep subscriptions & start over
            </button>
            <button
              onClick={onResetEverything}
              className="w-full px-4 py-2.5 text-sm font-medium text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 border border-danger-300 dark:border-danger-700 rounded-lg transition-colors"
            >
              Reset everything (including subscriptions)
            </button>
            <button
              onClick={onClose}
              className="w-full px-4 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

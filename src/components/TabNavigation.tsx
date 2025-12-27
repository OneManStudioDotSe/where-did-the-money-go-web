import type { Transaction } from '../types/transaction';
import { EnhancedTimePeriodSelector } from './EnhancedTimePeriodSelector';
import type { TimePeriod } from './EnhancedTimePeriodSelector';

export type DashboardTab = 'overview' | 'transactions' | 'subscriptions' | 'reports' | 'insights';

export type { TimePeriod };

interface TabNavigationProps {
  activeTab: DashboardTab;
  onTabChange: (tab: DashboardTab) => void;
  showSubscriptionsTab: boolean;
  subscriptionCount: number;
  isPending: boolean;
  transactions?: Transaction[];
  selectedPeriod?: TimePeriod | null;
  onPeriodChange?: (period: TimePeriod | null) => void;
}

export function TabNavigation({
  activeTab,
  onTabChange,
  showSubscriptionsTab,
  subscriptionCount,
  isPending,
  transactions = [],
  selectedPeriod = null,
  onPeriodChange,
}: TabNavigationProps) {
  const baseClasses = 'px-4 py-2.5 text-sm font-medium rounded-lg transition-all';
  const activeClasses = 'bg-white dark:bg-slate-700 text-gray-900 dark:text-white shadow-sm';
  const inactiveClasses = 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-white/50 dark:hover:bg-slate-700/50';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
      {/* Tabs - 3/5 width */}
      <div className="lg:col-span-3 flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl w-fit h-fit">
        <button
          onClick={() => onTabChange('overview')}
          className={`${baseClasses} ${activeTab === 'overview' ? activeClasses : inactiveClasses}`}
        >
          Overview
        </button>
        <button
          onClick={() => onTabChange('transactions')}
          className={`${baseClasses} ${activeTab === 'transactions' ? activeClasses : inactiveClasses}`}
        >
          Transactions
        </button>
        {showSubscriptionsTab && (
          <button
            onClick={() => onTabChange('subscriptions')}
            className={`${baseClasses} flex items-center gap-2 ${activeTab === 'subscriptions' ? activeClasses : inactiveClasses}`}
          >
            Recurring
            {subscriptionCount > 0 && (
              <span className="px-1.5 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full">
                {subscriptionCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => onTabChange('reports')}
          className={`${baseClasses} flex items-center gap-1.5 ${activeTab === 'reports' ? activeClasses : inactiveClasses}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Reports
        </button>
        <button
          onClick={() => onTabChange('insights')}
          className={`${baseClasses} flex items-center gap-1.5 ${activeTab === 'insights' ? activeClasses : inactiveClasses}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          Insights
        </button>
        {/* Loading indicator */}
        {isPending && (
          <div className="ml-1 flex items-center px-2">
            <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Time Period Selector - 2/5 width */}
      {transactions.length > 0 && onPeriodChange && (
        <div className="lg:col-span-2">
          <EnhancedTimePeriodSelector
            transactions={transactions}
            selectedPeriod={selectedPeriod}
            onPeriodChange={onPeriodChange}
          />
        </div>
      )}
    </div>
  );
}

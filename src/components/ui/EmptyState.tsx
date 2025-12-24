import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'compact';
}

const defaultIcons = {
  transactions: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
    </svg>
  ),
  recurring: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  chart: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  ),
  search: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
  ),
  filter: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
  ),
  insights: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
  ),
  merchants: (
    <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    </svg>
  ),
};

export function EmptyState({ icon, title, description, action, variant = 'default' }: EmptyStateProps) {
  const isCompact = variant === 'compact';

  return (
    <div className={`flex flex-col items-center justify-center text-center ${isCompact ? 'py-8' : 'py-12'}`}>
      <div className={`text-gray-300 dark:text-slate-600 ${isCompact ? 'mb-3' : 'mb-4'}`}>
        {icon || defaultIcons.transactions}
      </div>
      <h3 className={`font-medium text-gray-900 dark:text-white ${isCompact ? 'text-sm' : 'text-base'}`}>
        {title}
      </h3>
      {description && (
        <p className={`text-gray-500 dark:text-gray-400 mt-1 max-w-sm ${isCompact ? 'text-xs' : 'text-sm'}`}>
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className={`mt-4 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors ${isCompact ? 'text-xs' : 'text-sm'}`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

// Pre-built empty states for common scenarios
export function TransactionsEmptyState({ hasFilters, onClearFilters }: { hasFilters?: boolean; onClearFilters?: () => void }) {
  if (hasFilters) {
    return (
      <EmptyState
        icon={defaultIcons.filter}
        title="No matching transactions"
        description="Try adjusting your filters to see more results"
        action={onClearFilters ? { label: 'Clear Filters', onClick: onClearFilters } : undefined}
      />
    );
  }

  return (
    <EmptyState
      icon={defaultIcons.transactions}
      title="No transactions yet"
      description="Upload a CSV file to see your transactions here"
    />
  );
}

export function RecurringEmptyState() {
  return (
    <EmptyState
      icon={defaultIcons.recurring}
      title="No recurring payments"
      description="Recurring payments will appear here once detected from your transactions"
    />
  );
}

export function ChartEmptyState() {
  return (
    <EmptyState
      icon={defaultIcons.chart}
      title="No data to display"
      description="Upload transactions to see spending visualizations"
      variant="compact"
    />
  );
}

export function SearchEmptyState({ query }: { query: string }) {
  return (
    <EmptyState
      icon={defaultIcons.search}
      title="No results found"
      description={`No transactions match "${query}"`}
      variant="compact"
    />
  );
}

export function MerchantsEmptyState() {
  return (
    <EmptyState
      icon={defaultIcons.merchants}
      title="No merchant data"
      description="Merchant analysis will appear once you have transactions"
      variant="compact"
    />
  );
}

export function InsightsEmptyState() {
  return (
    <EmptyState
      icon={defaultIcons.insights}
      title="No insights available"
      description="Upload transactions to get AI-powered spending insights"
    />
  );
}

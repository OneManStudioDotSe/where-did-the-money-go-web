import { useState } from 'react';

export type BadgeType = 'uncategorized' | 'subscription' | 'recurring_expense' | 'high-value' | 'suspicious' | 'largest-expense' | 'largest-income';

interface BadgeConfig {
  label: string;
  icon: React.ReactNode;
  bgColor: string;
  textColor: string;
  tooltip: string;
}

const badgeConfigs: Record<BadgeType, BadgeConfig> = {
  uncategorized: {
    label: 'Uncategorized',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgColor: 'bg-warning-100 dark:bg-warning-900/30',
    textColor: 'text-warning-700 dark:text-warning-400',
    tooltip: 'This transaction needs to be categorized',
  },
  subscription: {
    label: 'Subscription',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-700 dark:text-purple-400',
    tooltip: 'Cancellable subscription (Netflix, Spotify, gym)',
  },
  recurring_expense: {
    label: 'Recurring',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    ),
    bgColor: 'bg-amber-100 dark:bg-amber-900/30',
    textColor: 'text-amber-700 dark:text-amber-400',
    tooltip: 'Fixed recurring expense (loan, rent, insurance)',
  },
  'high-value': {
    label: 'High Value',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    tooltip: 'Transaction above threshold amount',
  },
  suspicious: {
    label: 'Review',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    textColor: 'text-orange-700 dark:text-orange-400',
    tooltip: 'Potentially suspicious - duplicate, unusual amount, or pattern anomaly',
  },
  'largest-expense': {
    label: 'Largest',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
      </svg>
    ),
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
    tooltip: 'Largest expense in the current view',
  },
  'largest-income': {
    label: 'Largest',
    icon: (
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
      </svg>
    ),
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    tooltip: 'Largest income in the current view',
  },
};

interface BadgeProps {
  type: BadgeType;
  showLabel?: boolean;
  className?: string;
}

export function Badge({ type, showLabel = true, className = '' }: BadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = badgeConfigs[type];

  const isPulsing = type === 'uncategorized' || type === 'suspicious';

  return (
    <div className="relative inline-block">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${isPulsing ? 'animate-pulse-subtle' : ''} ${className}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {config.icon}
        {showLabel && <span>{config.label}</span>}
      </span>

      {/* Tooltip */}
      {showTooltip && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 dark:bg-slate-700 rounded shadow-lg whitespace-nowrap">
          {config.tooltip}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-900 dark:border-t-slate-700" />
        </div>
      )}
    </div>
  );
}

// Type for transaction badge from the transaction type
interface TransactionBadgeInput {
  type: string;
  label: string;
}

// Utility function to determine which badges a transaction should have
export function getTransactionBadges(
  transaction: {
    categoryId: string | null;
    amount: number;
    badges?: TransactionBadgeInput[];
  },
  highValueThreshold: number = 5000
): BadgeType[] {
  const badges: BadgeType[] = [];

  // Check for uncategorized
  if (!transaction.categoryId) {
    badges.push('uncategorized');
  }

  // Check for subscription, recurring expense, or suspicious from transaction badges
  if (transaction.badges) {
    for (const badge of transaction.badges) {
      if (badge.type === 'subscription' && !badges.includes('subscription')) {
        badges.push('subscription');
      } else if (badge.type === 'recurring_expense' && !badges.includes('recurring_expense')) {
        badges.push('recurring_expense');
      } else if (badge.type === 'suspicious' && !badges.includes('suspicious')) {
        badges.push('suspicious');
      }
    }
  }

  // Check for high value (absolute amount above threshold)
  if (Math.abs(transaction.amount) >= highValueThreshold) {
    badges.push('high-value');
  }

  return badges;
}

// Component to render multiple badges for a transaction
interface TransactionBadgesProps {
  transaction: {
    categoryId: string | null;
    amount: number;
    badges?: TransactionBadgeInput[];
  };
  highValueThreshold?: number;
  showLabels?: boolean;
  className?: string;
}

export function TransactionBadges({
  transaction,
  highValueThreshold = 5000,
  showLabels = false,
  className = '',
}: TransactionBadgesProps) {
  const badges = getTransactionBadges(transaction, highValueThreshold);

  if (badges.length === 0) return null;

  return (
    <div className={`flex flex-wrap gap-1 ${className}`}>
      {badges.map((type) => (
        <Badge key={type} type={type} showLabel={showLabels} />
      ))}
    </div>
  );
}

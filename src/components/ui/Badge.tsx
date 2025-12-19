import { useState } from 'react';

export type BadgeType = 'uncategorized' | 'subscription' | 'high-value';

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
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    ),
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
    textColor: 'text-purple-700 dark:text-purple-400',
    tooltip: 'Recurring subscription payment',
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
};

interface BadgeProps {
  type: BadgeType;
  showLabel?: boolean;
  className?: string;
}

export function Badge({ type, showLabel = true, className = '' }: BadgeProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const config = badgeConfigs[type];

  return (
    <div className="relative inline-block">
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
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

// Utility function to determine which badges a transaction should have
export function getTransactionBadges(
  transaction: { categoryId: string | null; isSubscription?: boolean; amount: number },
  highValueThreshold: number = 5000
): BadgeType[] {
  const badges: BadgeType[] = [];

  // Check for uncategorized
  if (!transaction.categoryId) {
    badges.push('uncategorized');
  }

  // Check for subscription
  if (transaction.isSubscription) {
    badges.push('subscription');
  }

  // Check for high value (absolute amount above threshold)
  if (Math.abs(transaction.amount) >= highValueThreshold) {
    badges.push('high-value');
  }

  return badges;
}

// Component to render multiple badges for a transaction
interface TransactionBadgesProps {
  transaction: { categoryId: string | null; isSubscription?: boolean; amount: number };
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

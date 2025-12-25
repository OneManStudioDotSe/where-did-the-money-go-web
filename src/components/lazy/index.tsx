/**
 * Lazy-loaded components for improved initial bundle size and performance
 * These components are loaded on-demand when first rendered
 */

import { lazy, Suspense } from 'react';
import { ChartSkeleton } from '../ui/Skeleton';
import type { Transaction, Subscription } from '../../types/transaction';
import type { TimePeriod } from '../TimePeriodSelector';
import type { SubscriptionViewVariation } from '../SettingsPanel';
import type { AIProvider } from '../../types/insights';

// Type definitions for lazy component props
interface SpendingVisualizationProps {
  transactions: Transaction[];
  selectedPeriod: TimePeriod | null;
  allTransactions: Transaction[];
}

interface MonthlyComparisonChartProps {
  transactions: Transaction[];
  maxMonths?: number;
}

interface TopMerchantsProps {
  transactions: Transaction[];
  maxMerchants?: number;
}

interface AIInsightsPanelProps {
  transactions: Transaction[];
  subscriptions: Subscription[];
  aiProvider: AIProvider | null;
  aiApiKey: string;
  onOpenSettings: () => void;
}

interface SubscriptionPanelProps {
  subscriptions: Subscription[];
  transactions: Transaction[];
  onSubscriptionClick?: (subscription: Subscription) => void;
  onEditSubscription?: (subscription: Subscription) => void;
  compact?: boolean;
  viewMode?: SubscriptionViewVariation;
}

interface VirtualizedTransactionListProps {
  transactions: Transaction[];
  onTransactionClick?: (transaction: Transaction) => void;
  bulkEditEnabled?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (selectedIds: Set<string>) => void;
  onBulkCategorize?: () => void;
}

// Generic loading fallback for charts
function ChartLoadingFallback() {
  return <ChartSkeleton />;
}

// Generic loading fallback for panels/modals
function PanelLoadingFallback() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
        <div className="h-32 bg-gray-200 dark:bg-slate-700 rounded" />
        <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
      </div>
    </div>
  );
}

// Transaction list loading fallback
function TransactionListLoadingFallback() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6">
      <div className="animate-pulse space-y-3">
        {[...Array(10)].map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-20" />
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded flex-1" />
            <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Lazy components with explicit type definitions
const LazySpendingVisualizationComponent = lazy(() =>
  import('../SpendingVisualization').then(m => ({ default: m.SpendingVisualization }))
);

const LazyMonthlyComparisonChartComponent = lazy(() =>
  import('../MonthlyComparisonChart').then(m => ({ default: m.MonthlyComparisonChart }))
);

const LazyTopMerchantsComponent = lazy(() =>
  import('../TopMerchants').then(m => ({ default: m.TopMerchants }))
);

const LazyAIInsightsPanelComponent = lazy(() =>
  import('../AIInsightsPanel').then(m => ({ default: m.AIInsightsPanel }))
);

const LazySubscriptionPanelComponent = lazy(() =>
  import('../SubscriptionPanel').then(m => ({ default: m.SubscriptionPanel }))
);

const LazyVirtualizedTransactionListComponent = lazy(() =>
  import('../VirtualizedTransactionList').then(m => ({ default: m.VirtualizedTransactionList }))
);

// Exported wrapper components with Suspense
export function LazySpendingVisualization(props: SpendingVisualizationProps) {
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <LazySpendingVisualizationComponent {...props} />
    </Suspense>
  );
}

export function LazyMonthlyComparisonChart(props: MonthlyComparisonChartProps) {
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <LazyMonthlyComparisonChartComponent {...props} />
    </Suspense>
  );
}

export function LazyTopMerchants(props: TopMerchantsProps) {
  return (
    <Suspense fallback={<ChartLoadingFallback />}>
      <LazyTopMerchantsComponent {...props} />
    </Suspense>
  );
}

export function LazyAIInsightsPanel(props: AIInsightsPanelProps) {
  return (
    <Suspense fallback={<PanelLoadingFallback />}>
      <LazyAIInsightsPanelComponent {...props} />
    </Suspense>
  );
}

export function LazySubscriptionPanel(props: SubscriptionPanelProps) {
  return (
    <Suspense fallback={<PanelLoadingFallback />}>
      <LazySubscriptionPanelComponent {...props} />
    </Suspense>
  );
}

export function LazyVirtualizedTransactionList(props: VirtualizedTransactionListProps) {
  return (
    <Suspense fallback={<TransactionListLoadingFallback />}>
      <LazyVirtualizedTransactionListComponent {...props} />
    </Suspense>
  );
}

export { FileUpload } from './FileUpload';
export { TransactionList } from './TransactionList';
export { FilterPanel, defaultFilters } from './FilterPanel';
export { ProjectRoadmap } from './ProjectRoadmap';
export { TimePeriodSelector } from './TimePeriodSelector';
export { SpendingVisualization } from './SpendingVisualization';
export { SettingsPanel, loadSettings, saveSettings, defaultSettings as defaultAppSettings } from './SettingsPanel';
export { CategorySelector } from './CategorySelector';
export { TransactionEditModal } from './TransactionEditModal';
export { UncategorizedCarousel } from './UncategorizedCarousel';
export { DarkModeToggle } from './DarkModeToggle';
export { CsvConfirmationDialog } from './CsvConfirmationDialog';
export { ExportDialog } from './ExportDialog';
export { SubscriptionConfirmationDialog } from './SubscriptionConfirmationDialog';
export { SubscriptionList } from './SubscriptionList';
export { SubscriptionGrid } from './SubscriptionGrid';
export { SubscriptionPanel, SubscriptionCard } from './SubscriptionPanel';
export { SubscriptionEditModal } from './SubscriptionEditModal';
export { ErrorBoundary } from './ErrorBoundary';
export { SectionErrorBoundary } from './SectionErrorBoundary';
export { TopMerchants } from './TopMerchants';
export { MonthlyComparisonChart } from './MonthlyComparisonChart';
export { MappingRulesModal } from './MappingRulesModal';
export { AddMappingRuleModal } from './AddMappingRuleModal';
export { BulkCategoryModal } from './BulkCategoryModal';
export { SuspiciousTransactionsDialog } from './SuspiciousTransactionsDialog';
export { OnboardingModal } from './OnboardingModal';
export { DebugPanel, trackRender, trackMetric, setVerboseLogging, isVerboseLogging } from './DebugPanel';
export { SpendingCalendar } from './SpendingCalendar';
export { ReportsPanel } from './ReportsPanel';
export { TipsCarousel } from './TipsCarousel';
export { ResetConfirmationDialog } from './ResetConfirmationDialog';
export { TabNavigation } from './TabNavigation';
export type { DashboardTab } from './TabNavigation';
export type { TimePeriod } from './TimePeriodSelector';
export type { AppSettings, SubscriptionViewVariation, SubscriptionPlacement } from './SettingsPanel';

// Layout components
export { Header } from './layout/Header';
export { Footer } from './layout/Footer';
export { MobileMenu } from './layout/MobileMenu';

// UI components
export { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
export { CategoryIcon } from './ui/CategoryIcon';
export { Badge, TransactionBadges, getTransactionBadges } from './ui/Badge';
export type { BadgeType } from './ui/Badge';
export { Skeleton, TransactionListSkeleton, DashboardSkeleton, ChartSkeleton, StatCardSkeleton } from './ui/Skeleton';
export { LoadingOverlay } from './ui/LoadingOverlay';
export { EmptyState, TransactionsEmptyState, RecurringEmptyState, ChartEmptyState, SearchEmptyState, MerchantsEmptyState, InsightsEmptyState } from './ui/EmptyState';

// Virtualized components for large datasets
export { VirtualizedTransactionList } from './VirtualizedTransactionList';

// Lazy-loaded components for code splitting
export {
  LazySpendingVisualization,
  LazyMonthlyComparisonChart,
  LazyTopMerchants,
  LazyAIInsightsPanel,
  LazySubscriptionPanel,
  LazyVirtualizedTransactionList,
} from './lazy';

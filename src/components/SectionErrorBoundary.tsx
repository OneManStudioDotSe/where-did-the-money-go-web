import { Component, type ErrorInfo, type ReactNode } from 'react';

type SectionType =
  | 'visualization'
  | 'transactions'
  | 'subscriptions'
  | 'insights'
  | 'filters'
  | 'merchants'
  | 'time-period'
  | 'general';

interface Props {
  children: ReactNode;
  section: SectionType;
  onRetry?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

const sectionInfo: Record<SectionType, { title: string; icon: string; description: string }> = {
  visualization: {
    title: 'Spending Analysis',
    icon: '📊',
    description: 'The spending charts could not be displayed.',
  },
  transactions: {
    title: 'Transaction List',
    icon: '📋',
    description: 'The transaction list could not be loaded.',
  },
  subscriptions: {
    title: 'Recurring Expenses',
    icon: '🔄',
    description: 'The recurring expenses section could not be displayed.',
  },
  insights: {
    title: 'AI Insights',
    icon: '💡',
    description: 'The insights panel could not be loaded.',
  },
  filters: {
    title: 'Filters',
    icon: '🔍',
    description: 'The filter panel could not be displayed.',
  },
  merchants: {
    title: 'Top Merchants',
    icon: '🏪',
    description: 'The merchants analysis could not be loaded.',
  },
  'time-period': {
    title: 'Time Period',
    icon: '📅',
    description: 'The time period selector could not be displayed.',
  },
  general: {
    title: 'Section',
    icon: '⚠️',
    description: 'This section could not be displayed.',
  },
};

export class SectionErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`SectionErrorBoundary [${this.props.section}] caught an error:`, error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  public render() {
    if (this.state.hasError) {
      const info = sectionInfo[this.props.section];

      return (
        <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center flex-shrink-0">
              <span className="text-2xl">{info.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {info.title} unavailable
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {info.description} The rest of the app should still work normally.
              </p>

              {this.state.error && (
                <details className="mt-3">
                  <summary className="text-xs text-gray-500 dark:text-gray-400 cursor-pointer hover:text-gray-700 dark:hover:text-gray-300">
                    Show error details
                  </summary>
                  <pre className="mt-2 p-2 bg-gray-100 dark:bg-slate-700 rounded text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-24">
                    {this.state.error.message}
                  </pre>
                </details>
              )}

              <button
                onClick={this.handleRetry}
                className="mt-4 px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors inline-flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

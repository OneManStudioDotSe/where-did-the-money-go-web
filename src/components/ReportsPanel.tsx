import { useState } from 'react';
import type { Transaction } from '../types/transaction';
import { TopMerchants } from './TopMerchants';
import { MonthlyComparisonChart } from './MonthlyComparisonChart';
import { SpendingCalendar } from './SpendingCalendar';
import { SectionErrorBoundary } from './SectionErrorBoundary';

interface ReportsPanelProps {
  transactions: Transaction[];
  onExport: () => void;
}

type ReportSection = 'calendar' | 'merchants' | 'comparison';

export function ReportsPanel({ transactions, onExport }: ReportsPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Set<ReportSection>>(
    new Set(['calendar', 'merchants', 'comparison'])
  );

  const toggleSection = (section: ReportSection) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const hasTransactions = transactions.length > 0;

  if (!hasTransactions) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-gray-100 dark:border-slate-700 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-slate-700 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Data for Reports
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Upload a CSV file or load demo data to see your spending reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Export Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Reports & Analytics
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Detailed spending analysis and visualizations
          </p>
        </div>
        <button
          onClick={onExport}
          className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white text-sm font-medium rounded-lg transition-all active:scale-[0.98]"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Data
        </button>
      </div>

      {/* Quick Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <QuickStat
          label="Total Transactions"
          value={transactions.length.toString()}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <QuickStat
          label="Date Range"
          value={getDateRangeLabel(transactions)}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
        />
        <QuickStat
          label="Unique Merchants"
          value={getUniqueMerchants(transactions).toString()}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
        <QuickStat
          label="Avg per Day"
          value={`${getAveragePerDay(transactions)} kr`}
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          }
        />
      </div>

      {/* Reports Grid - 2 columns on laptop, 1 on mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
        {/* Spending Calendar Section */}
        <ReportCard
          title="Spending Calendar"
          subtitle="Daily spending heatmap"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          }
          isExpanded={expandedSections.has('calendar')}
          onToggle={() => toggleSection('calendar')}
        >
          <SectionErrorBoundary section="spending-calendar">
            <SpendingCalendar transactions={transactions} className="shadow-none border-0 p-0" />
          </SectionErrorBoundary>
        </ReportCard>

        {/* Top Merchants Section */}
        <ReportCard
          title="Top Merchants"
          subtitle="Where you spend the most"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
          isExpanded={expandedSections.has('merchants')}
          onToggle={() => toggleSection('merchants')}
        >
          <SectionErrorBoundary section="top-merchants">
            <TopMerchants transactions={transactions} />
          </SectionErrorBoundary>
        </ReportCard>

        {/* Monthly Comparison Section - Full width on larger screens */}
        <div className="lg:col-span-2">
          <ReportCard
            title="Monthly Comparison"
            subtitle="Compare spending across months"
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
            isExpanded={expandedSections.has('comparison')}
            onToggle={() => toggleSection('comparison')}
          >
            <SectionErrorBoundary section="monthly-comparison">
              <MonthlyComparisonChart transactions={transactions} maxMonths={12} />
            </SectionErrorBoundary>
          </ReportCard>
        </div>
      </div>
    </div>
  );
}

// Helper components

interface QuickStatProps {
  label: string;
  value: string;
  icon: React.ReactNode;
}

function QuickStat({ label, value, icon }: QuickStatProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-3 sm:p-4 shadow-sm border border-gray-100 dark:border-slate-700">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 flex-shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">{label}</p>
          <p className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface ReportCardProps {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  isExpanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function ReportCard({ title, subtitle, icon, isExpanded, onToggle, children }: ReportCardProps) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 overflow-hidden h-fit">
      <button
        onClick={onToggle}
        className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg bg-gray-100 dark:bg-slate-700 flex items-center justify-center text-gray-600 dark:text-gray-400 flex-shrink-0">
            {icon}
          </div>
          <div className="text-left min-w-0">
            <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white truncate">{title}</h3>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 truncate">{subtitle}</p>
          </div>
        </div>
        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 flex-shrink-0 ml-2 ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {isExpanded && (
        <div className="px-4 sm:px-6 pb-4 sm:pb-6 animate-slide-down">
          {children}
        </div>
      )}
    </div>
  );
}

// Helper functions

function getDateRangeLabel(transactions: Transaction[]): string {
  if (transactions.length === 0) return 'No data';

  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());
  const first = sorted[0].date;
  const last = sorted[sorted.length - 1].date;

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });

  if (first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear()) {
    return formatDate(first);
  }

  return `${formatDate(first)} - ${formatDate(last)}`;
}

function getUniqueMerchants(transactions: Transaction[]): number {
  const merchants = new Set<string>();
  transactions.forEach(t => {
    if (t.description) {
      // Normalize merchant names
      const normalized = t.description.toLowerCase().trim();
      merchants.add(normalized);
    }
  });
  return merchants.size;
}

function getAveragePerDay(transactions: Transaction[]): string {
  if (transactions.length === 0) return '0';

  const expenses = transactions.filter(t => t.amount < 0);
  if (expenses.length === 0) return '0';

  // Get unique days with expenses
  const uniqueDays = new Set<string>();
  expenses.forEach(t => {
    uniqueDays.add(t.date.toISOString().split('T')[0]);
  });

  const totalExpenses = expenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const avgPerDay = totalExpenses / uniqueDays.size;

  return avgPerDay.toLocaleString('sv-SE', { maximumFractionDigits: 0 });
}

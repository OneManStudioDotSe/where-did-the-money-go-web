import { useState } from 'react';

interface Step {
  name: string;
  completed: boolean;
}

interface Phase {
  id: string;
  name: string;
  icon: string;
  status: 'completed' | 'in_progress' | 'upcoming';
  progress: number;
  description: string;
  steps: Step[];
}

const projectPhases: Phase[] = [
  {
    id: 'phase1',
    name: 'Foundation',
    icon: '🏗️',
    status: 'completed',
    progress: 100,
    description: 'Project setup, core data models, and sample data',
    steps: [
      { name: 'Vite + React + TypeScript setup', completed: true },
      { name: 'Tailwind CSS 4 configuration', completed: true },
      { name: 'Folder structure (components, utils, hooks, data, types)', completed: true },
      { name: 'Transaction & Category TypeScript interfaces', completed: true },
      { name: 'Sample CSV data for development', completed: true },
    ],
  },
  {
    id: 'phase2',
    name: 'Data Processing',
    icon: '⚙️',
    status: 'completed',
    progress: 100,
    description: 'CSV parsing, column detection, and transaction normalization',
    steps: [
      { name: 'CSV parser with BOM handling', completed: true },
      { name: 'Auto-detection of column types', completed: true },
      { name: 'Swedish header name recognition', completed: true },
      { name: 'Transaction normalization and ID generation', completed: true },
      { name: 'Error handling for invalid formats', completed: true },
      { name: 'CSV import confirmation dialog with preview', completed: true },
    ],
  },
  {
    id: 'phase3',
    name: 'Category System',
    icon: '🏷️',
    status: 'completed',
    progress: 100,
    description: 'Category management and automatic transaction mapping',
    steps: [
      { name: '13 default categories with 51 subcategories', completed: true },
      { name: '183 Swedish merchant pattern mappings', completed: true },
      { name: 'Priority-based pattern matching engine', completed: true },
      { name: 'localStorage persistence for custom mappings', completed: true },
      { name: 'Manual category re-assignment UI', completed: true },
      { name: 'Uncategorized transactions carousel', completed: true },
    ],
  },
  {
    id: 'phase4',
    name: 'Core UI',
    icon: '🎨',
    status: 'completed',
    progress: 100,
    description: 'Application layout and primary interface components',
    steps: [
      { name: 'File upload with drag & drop', completed: true },
      { name: 'Transaction list with category badges', completed: true },
      { name: 'Summary statistics display', completed: true },
      { name: 'Demo mode with sample data', completed: true },
      { name: 'Filter by category, date, amount, search', completed: true },
      { name: 'Sort controls (date, amount, category)', completed: true },
      { name: 'Start Over reset button in header', completed: true },
      { name: 'Badge system (uncategorized, subscription, high-value)', completed: true },
    ],
  },
  {
    id: 'phase5',
    name: 'Visualizations',
    icon: '📊',
    status: 'completed',
    progress: 100,
    description: 'Charts and graphical data representations',
    steps: [
      { name: 'Bar chart for category breakdown', completed: true },
      { name: 'Donut chart for spending distribution', completed: true },
      { name: 'Interactive chart type toggle', completed: true },
      { name: 'Category/subcategory totals table', completed: true },
    ],
  },
  {
    id: 'phase6',
    name: 'Smart Features',
    icon: '🧠',
    status: 'in_progress',
    progress: 75,
    description: 'Intelligent transaction analysis and grouping',
    steps: [
      { name: 'Time-based grouping (day, week, month, quarter, year)', completed: true },
      { name: 'Trends and averages comparison', completed: true },
      { name: 'Category totals and summaries', completed: true },
      { name: 'Subscription detection algorithm', completed: false },
    ],
  },
  {
    id: 'phase7',
    name: 'User Customization',
    icon: '⚙️',
    status: 'in_progress',
    progress: 70,
    description: 'Personalization and export options',
    steps: [
      { name: 'File upload flow with confirmation', completed: true },
      { name: 'Custom month start day setting', completed: true },
      { name: 'Settings panel (date format, icon set)', completed: true },
      { name: 'Custom category creation UI', completed: false },
      { name: 'Export to CSV/JSON', completed: false },
    ],
  },
  {
    id: 'phase8',
    name: 'UI Themes & Icons',
    icon: '🎨',
    status: 'completed',
    progress: 100,
    description: 'Multiple icon sets and UI customization options',
    steps: [
      { name: '4 icon sets (Emoji, Icons8 3D, Phosphor, OpenMoji)', completed: true },
      { name: 'Dark mode with system preference support', completed: true },
      { name: 'Teal color theme', completed: true },
      { name: 'Enhanced card styling with hover effects', completed: true },
      { name: 'Header with navigation and responsive menu', completed: true },
      { name: 'Footer with links', completed: true },
      { name: 'Responsive design (mobile/tablet/desktop)', completed: true },
    ],
  },
  {
    id: 'phase9',
    name: 'AI Insights',
    icon: '✨',
    status: 'upcoming',
    progress: 0,
    description: 'Intelligent spending analysis and recommendations',
    steps: [
      { name: 'Spending pattern analysis', completed: false },
      { name: 'Anomaly detection', completed: false },
      { name: 'Savings recommendations', completed: false },
      { name: 'Insight cards UI', completed: false },
    ],
  },
];

function getStatusColor(status: Phase['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-success-500';
    case 'in_progress':
      return 'bg-primary-500';
    case 'upcoming':
      return 'bg-gray-300 dark:bg-slate-600';
  }
}

function getStatusText(status: Phase['status']): string {
  switch (status) {
    case 'completed':
      return 'Completed';
    case 'in_progress':
      return 'In Progress';
    case 'upcoming':
      return 'Upcoming';
  }
}

function getStatusBadgeStyle(status: Phase['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400';
    case 'in_progress':
      return 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400';
    case 'upcoming':
      return 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400';
  }
}

export function ProjectRoadmap() {
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);

  const togglePhase = (phaseId: string) => {
    setExpandedPhase(expandedPhase === phaseId ? null : phaseId);
  };

  const completedPhases = projectPhases.filter((p) => p.status === 'completed').length;
  const totalProgress = Math.round(
    projectPhases.reduce((sum, p) => sum + p.progress, 0) / projectPhases.length
  );

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Development Roadmap</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {completedPhases} of {projectPhases.length} phases completed • {totalProgress}% overall
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-success-500"></div>
            <span className="text-gray-600 dark:text-gray-400">Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-primary-500"></div>
            <span className="text-gray-600 dark:text-gray-400">In Progress</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-slate-600"></div>
            <span className="text-gray-600 dark:text-gray-400">Upcoming</span>
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-success-500 to-primary-500 transition-all duration-500"
            style={{ width: `${totalProgress}%` }}
          />
        </div>
      </div>

      {/* Phase Cards - Responsive grid: 1 column on mobile, 2 columns on larger screens */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {projectPhases.map((phase) => (
          <div
            key={phase.id}
            className={`border rounded-lg transition-all ${
              expandedPhase === phase.id
                ? 'border-primary-300 dark:border-primary-600 shadow-sm'
                : 'border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
            }`}
          >
            {/* Phase Header */}
            <button
              onClick={() => togglePhase(phase.id)}
              className="w-full p-4 flex items-center gap-4 text-left"
            >
              {/* Status Indicator */}
              <div className={`w-3 h-3 rounded-full ${getStatusColor(phase.status)}`} />

              {/* Icon */}
              <span className="text-xl">{phase.icon}</span>

              {/* Name & Description */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-medium text-gray-900 dark:text-white">{phase.name}</h3>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadgeStyle(
                      phase.status
                    )}`}
                  >
                    {getStatusText(phase.status)}
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{phase.description}</p>
              </div>

              {/* Progress */}
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      phase.status === 'completed' ? 'bg-success-500' : 'bg-primary-500'
                    }`}
                    style={{ width: `${phase.progress}%` }}
                  />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 w-10 text-right">{phase.progress}%</span>
              </div>

              {/* Expand Icon */}
              <svg
                className={`w-5 h-5 text-gray-400 transition-transform ${
                  expandedPhase === phase.id ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {/* Expanded Steps */}
            {expandedPhase === phase.id && (
              <div className="px-4 pb-4 pt-0">
                <div className="border-t border-gray-100 dark:border-slate-700 pt-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                    Steps ({phase.steps.filter((s) => s.completed).length}/{phase.steps.length}{' '}
                    completed)
                  </p>
                  <div className="space-y-2">
                    {phase.steps.map((step, index) => (
                      <div key={index} className="flex items-center gap-3">
                        {step.completed ? (
                          <svg
                            className="w-5 h-5 text-success-500 flex-shrink-0"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                              clipRule="evenodd"
                            />
                          </svg>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-300 dark:border-slate-600 flex-shrink-0" />
                        )}
                        <span
                          className={`text-sm ${
                            step.completed ? 'text-gray-600 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'
                          }`}
                        >
                          {step.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

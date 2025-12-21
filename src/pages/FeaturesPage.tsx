import { Card } from '../components/ui/Card';

const features = [
  {
    icon: '🔒',
    title: 'Privacy first',
    description:
      'Your financial data never leaves your browser. No accounts, no servers, no data collection. Everything runs locally on your device.',
  },
  {
    icon: '📊',
    title: 'Visual analytics',
    description:
      'Beautiful charts and visualizations help you understand your spending patterns at a glance. Bar charts, donut charts, and detailed breakdowns.',
  },
  {
    icon: '🏷️',
    title: 'Smart categorization',
    description:
      '183 Swedish merchant pattern mappings automatically categorize your transactions. 13 categories with 51 subcategories cover all spending types.',
  },
  {
    icon: '📅',
    title: 'Flexible time periods',
    description:
      'View your spending by day, week, month, quarter, or year. Set a custom month start day to align with your salary date.',
  },
  {
    icon: '🔍',
    title: 'Powerful filtering',
    description:
      'Filter transactions by category, date range, amount, or search text. Find exactly what you need instantly.',
  },
  {
    icon: '🎨',
    title: 'Customizable icons',
    description:
      'Choose from 4 icon sets: Emoji, 3D Fluency, Phosphor, or OpenMoji. Pick the style that suits your preference.',
  },
  {
    icon: '🌙',
    title: 'Dark mode',
    description:
      'Easy on the eyes with full dark mode support. Automatically follows your system preference or set it manually.',
  },
  {
    icon: '📱',
    title: 'Responsive design',
    description:
      'Works great on desktop, tablet, and mobile. Your expense tracking goes wherever you do.',
  },
  {
    icon: '🇸🇪',
    title: 'Swedish bank support',
    description:
      'Optimized for Swedish bank CSV exports (Swedbank, SEB format). Auto-detects columns and handles Swedish date formats.',
  },
  {
    icon: '✏️',
    title: 'Manual overrides',
    description:
      'Click any transaction to change its category. Your manual categorizations are remembered for future imports.',
  },
  {
    icon: '📦',
    title: 'Uncategorized workflow',
    description:
      'Dedicated carousel for handling uncategorized transactions. Quickly categorize batches of transactions with ease.',
  },
  {
    icon: '💾',
    title: 'Persistent settings',
    description:
      'Your preferences and custom category mappings are saved locally. Come back anytime and pick up where you left off.',
  },
];

export function FeaturesPage() {
  return (
    <div className="max-w-6xl mx-auto py-12 px-4">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Features</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Everything you need to understand your spending habits, without compromising your privacy.
        </p>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <Card key={index} variant="elevated" padding="lg">
            <div className="text-3xl mb-3">{feature.icon}</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {feature.title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm">{feature.description}</p>
          </Card>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 text-center">
        <Card variant="default" padding="lg" className="bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-800">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Ready to track your expenses?
          </h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Upload your bank export CSV and start analyzing your spending today.
          </p>
          <a
            href="#/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
          >
            Get started
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </Card>
      </div>
    </div>
  );
}

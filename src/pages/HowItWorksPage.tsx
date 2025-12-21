import { Card } from '../components/ui/Card';

const steps = [
  {
    number: 1,
    title: 'Export your bank data',
    description:
      'Log in to your online banking and download a CSV export of your transactions. Most Swedish banks (Swedbank, SEB, etc.) support this.',
    details: [
      'Go to your bank\'s transaction history',
      'Select the date range you want to analyze',
      'Export as CSV (Excel format also works)',
      'Save the file to your computer',
    ],
  },
  {
    number: 2,
    title: 'Upload to the app',
    description:
      'Simply drag and drop your CSV file into the app, or click to browse. Your data stays completely local.',
    details: [
      'Drop the file onto the upload area',
      'The app detects columns automatically',
      'Swedish date formats and headers are recognized',
      'No data is ever sent to any server',
    ],
  },
  {
    number: 3,
    title: 'Review categorization',
    description:
      'Transactions are automatically categorized based on 183+ Swedish merchant patterns. You can adjust any categorization manually.',
    details: [
      'Most transactions are categorized automatically',
      'Click any transaction to change its category',
      'Uncategorized items appear in a dedicated section',
      'Your manual changes are remembered',
    ],
  },
  {
    number: 4,
    title: 'Analyze your spending',
    description:
      'Explore interactive charts, filter by category or date, and discover insights about your spending habits.',
    details: [
      'View spending by category with charts',
      'Filter by time period, category, or amount',
      'Compare spending across different periods',
      'Find patterns and potential savings',
    ],
  },
];

const tips = [
  {
    icon: '💡',
    title: 'Try demo mode',
    description:
      'Not ready to upload your own data? Click "Load Demo Data" to explore the app with sample transactions.',
  },
  {
    icon: '📅',
    title: 'Set your salary day',
    description:
      'If you get paid on the 25th, change the month start day in Settings to see spending aligned with your pay periods.',
  },
  {
    icon: '🔄',
    title: 'Regular exports',
    description:
      'Export your bank data monthly and upload to track spending trends over time.',
  },
];

export function HowItWorksPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      {/* Hero */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">How it works</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Get started in minutes. No sign-up required, no data leaves your device.
        </p>
      </div>

      {/* Steps */}
      <div className="space-y-8 mb-16">
        {steps.map((step, index) => (
          <Card key={index} variant="default" padding="none">
            <div className="flex flex-col md:flex-row">
              {/* Step Number */}
              <div className="md:w-20 flex items-center justify-center p-6 bg-primary-50 dark:bg-primary-900/30 md:rounded-l-xl">
                <div className="w-12 h-12 rounded-full bg-primary-600 text-white flex items-center justify-center text-xl font-bold">
                  {step.number}
                </div>
              </div>

              {/* Content */}
              <div className="flex-1 p-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">{step.description}</p>

                <ul className="space-y-2">
                  {step.details.map((detail, detailIndex) => (
                    <li key={detailIndex} className="flex items-start gap-2">
                      <svg
                        className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span className="text-sm text-gray-600 dark:text-gray-400">{detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Tips Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">
          Pro tips
        </h2>
        <div className="grid md:grid-cols-3 gap-6">
          {tips.map((tip, index) => (
            <Card key={index} variant="elevated" padding="md">
              <div className="text-2xl mb-2">{tip.icon}</div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{tip.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{tip.description}</p>
            </Card>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="text-center">
        <a
          href="#/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors"
        >
          Start tracking now
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}

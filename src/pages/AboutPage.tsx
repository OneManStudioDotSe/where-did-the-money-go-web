import { Card } from '../components/ui/Card';

export function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/25">
          <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          About This App
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          A personal project born from frustration with traditional expense trackers.
        </p>
      </div>

      {/* Story */}
      <Card variant="default" padding="lg" className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">The Story</h2>
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>
            "Where Did The Money Go?" started as a simple question I kept asking myself at the end
            of every month. Despite earning a reasonable salary, money seemed to disappear without
            a trace.
          </p>
          <p>
            Existing expense trackers either required linking my bank account (a privacy nightmare),
            demanded manual entry for every transaction (too tedious), or charged monthly fees for
            basic features.
          </p>
          <p>
            I wanted something different: a tool that respects privacy, works with Swedish banks,
            and actually helps understand spending patterns without the overhead.
          </p>
        </div>
      </Card>

      {/* Philosophy */}
      <Card variant="default" padding="lg" className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Philosophy</h2>
        <div className="space-y-6">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-success-100 dark:bg-success-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-success-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Privacy by Design</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                No backend servers, no data collection, no accounts. Your financial data is yours
                alone.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Simple & Fast</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                No installation, no configuration. Upload a CSV and get insights in seconds.
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-lg bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Actionable Insights</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Not just pretty charts, but real understanding of where your money goes.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* Tech Stack */}
      <Card variant="default" padding="lg" className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Technology</h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Built with modern web technologies for performance and reliability:
        </p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { name: 'React 19', desc: 'UI framework' },
            { name: 'TypeScript', desc: 'Type safety' },
            { name: 'Tailwind CSS 4', desc: 'Styling' },
            { name: 'Vite', desc: 'Build tool' },
          ].map((tech) => (
            <div
              key={tech.name}
              className="p-3 rounded-lg bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600"
            >
              <p className="font-medium text-gray-900 dark:text-white">{tech.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{tech.desc}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Contact */}
      <Card variant="elevated" padding="lg" className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Questions?</h2>
        <p className="text-gray-600 dark:text-gray-300">
          This is an open source project. Feel free to explore, contribute, or report issues.
        </p>
      </Card>
    </div>
  );
}

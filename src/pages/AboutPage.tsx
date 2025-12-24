import { Card } from '../components/ui/Card';
import { Logo } from '../components/ui/Logo';

export function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <Logo size="lg" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
          About this app
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

      {/* Contact / Feedback */}
      <Card variant="default" padding="lg" className="mb-8">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Feedback & Support</h2>
        <div className="space-y-4 text-gray-600 dark:text-gray-300">
          <p>
            This is an open-source project and your feedback is valuable. If you encounter any issues,
            have suggestions for improvements, or want to contribute:
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://github.com/anthropics/claude-code/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
              </svg>
              Report an Issue
            </a>
            <a
              href="mailto:feedback@example.com"
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Send Feedback
            </a>
          </div>
        </div>
      </Card>

      {/* Open Source Note */}
      <div className="text-center text-sm text-gray-500 dark:text-gray-400">
        <p>
          Made with care for your financial privacy.
        </p>
        <p className="mt-1">
          No tracking, no analytics, no data collection.
        </p>
      </div>
    </div>
  );
}

import { Card } from '../components/ui/Card';

export function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-success-100 dark:bg-success-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-success-600" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Privacy Policy</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Your privacy is not just a feature—it's the foundation of this app.
        </p>
      </div>

      {/* TL;DR */}
      <Card variant="elevated" padding="lg" className="mb-8 bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800">
        <h2 className="text-lg font-semibold text-success-800 dark:text-success-300 mb-2">
          TL;DR: We don't collect any data
        </h2>
        <p className="text-success-700 dark:text-success-400">
          Your financial data never leaves your browser. There are no servers, no accounts, no
          analytics, and no tracking. Everything runs locally on your device.
        </p>
      </Card>

      {/* Details */}
      <div className="space-y-6">
        <Card variant="default" padding="lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Data Processing
          </h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <p>
              When you upload a CSV file, the data is processed entirely within your web browser
              using JavaScript. The file is read, parsed, and analyzed without ever being sent to
              any external server.
            </p>
            <p>
              This approach ensures that your financial transactions, account balances, and spending
              patterns remain completely private.
            </p>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Local Storage
          </h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <p>The app stores the following data in your browser's localStorage:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>App settings:</strong> Your preferences like date format, theme, and icon
                set selection
              </li>
              <li>
                <strong>Custom category mappings:</strong> When you manually categorize a
                transaction, that mapping is saved locally
              </li>
            </ul>
            <p>
              This data is stored only on your device and is never transmitted anywhere. You can
              clear it at any time by clearing your browser's site data.
            </p>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            No Tracking
          </h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <p>This application does not use:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Google Analytics or any other analytics service</li>
              <li>Cookies for tracking purposes</li>
              <li>Third-party scripts that collect data</li>
              <li>User accounts or authentication systems</li>
              <li>Backend servers or databases</li>
            </ul>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            External Resources
          </h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <p>
              The only external resources loaded are icon sets from CDN (Content Delivery Network)
              providers when you select an icon set other than Emoji:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Icons8 3D Fluency icons (if selected)</li>
              <li>Phosphor icons (if selected)</li>
              <li>OpenMoji icons (if selected)</li>
            </ul>
            <p>
              These CDN providers may log standard web server access logs, but they don't receive
              any of your financial data. If you prefer maximum privacy, use the default Emoji icon
              set which requires no external resources.
            </p>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Your Rights</h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <p>Since we don't collect any data, there's nothing to:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Request access to</li>
              <li>Request deletion of</li>
              <li>Export</li>
              <li>Correct or update</li>
            </ul>
            <p>Your data is yours, fully under your control, stored only on your device.</p>
          </div>
        </Card>
      </div>

      {/* Last Updated */}
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-8">
        Last updated: December 2025
      </p>
    </div>
  );
}

import { Card } from '../components/ui/Card';

export function DisclaimerPage() {
  return (
    <div className="max-w-3xl mx-auto py-12 px-4">
      {/* Hero */}
      <div className="text-center mb-12">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-warning-100 dark:bg-warning-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Disclaimer</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300">
          Important information about using this application.
        </p>
      </div>

      {/* Disclaimers */}
      <div className="space-y-6">
        <Card variant="default" padding="lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Not Financial Advice
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            This application is a personal expense tracking tool intended for informational purposes
            only. Nothing in this application constitutes financial, investment, legal, or tax
            advice. Always consult with qualified professionals before making financial decisions.
          </p>
        </Card>

        <Card variant="default" padding="lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Accuracy of Data
          </h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <p>
              The accuracy of the analysis depends on the quality of the data you provide. The
              application:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>Relies on CSV exports from your bank, which may contain errors</li>
              <li>Uses automated categorization that may not always be accurate</li>
              <li>May not recognize all transaction types or merchants</li>
              <li>Cannot verify the completeness of your bank export</li>
            </ul>
            <p>
              Always verify important financial information directly with your bank or financial
              institution.
            </p>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            No Warranty
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            This application is provided "as is" without warranty of any kind, express or implied.
            The developers do not warrant that the application will be error-free, uninterrupted, or
            meet your specific requirements. Use at your own risk.
          </p>
        </Card>

        <Card variant="default" padding="lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Limitation of Liability
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            In no event shall the developers be liable for any direct, indirect, incidental,
            special, consequential, or punitive damages arising out of or related to your use of
            this application, including but not limited to financial losses, data loss, or business
            interruption.
          </p>
        </Card>

        <Card variant="default" padding="lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Third-Party Services
          </h2>
          <div className="space-y-4 text-gray-600 dark:text-gray-300">
            <p>
              This application may load icons from third-party CDN providers. We are not responsible
              for:
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>The availability of these external services</li>
              <li>Any changes to these services</li>
              <li>The privacy practices of these providers</li>
            </ul>
          </div>
        </Card>

        <Card variant="default" padding="lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Browser Compatibility
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            This application is designed for modern web browsers. Older browsers may not support all
            features. For the best experience, use the latest version of Chrome, Firefox, Safari, or
            Edge.
          </p>
        </Card>

        <Card variant="default" padding="lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Changes to This Disclaimer
          </h2>
          <p className="text-gray-600 dark:text-gray-300">
            This disclaimer may be updated from time to time. Continued use of the application after
            any changes constitutes acceptance of the updated disclaimer.
          </p>
        </Card>
      </div>

      {/* Last Updated */}
      <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-8">
        Last updated: December 2025
      </p>
    </div>
  );
}

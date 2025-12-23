interface AdPlaceholderProps {
  position: 'left' | 'right';
}

const sampleAds = {
  left: [
    {
      title: 'Premium Analytics',
      description: 'Unlock advanced spending insights and AI-powered recommendations',
      cta: 'Learn More',
      color: 'primary',
    },
    {
      title: 'Budget Pro',
      description: 'Set goals and track your progress with smart alerts',
      cta: 'Try Free',
      color: 'success',
    },
  ],
  right: [
    {
      title: 'Export to Excel',
      description: 'Professional reports for your accountant or tax filing',
      cta: 'Upgrade',
      color: 'warning',
    },
    {
      title: 'Multi-Account Sync',
      description: 'Connect all your Swedish bank accounts in one view',
      cta: 'Coming Soon',
      color: 'gray',
    },
  ],
};

const colorClasses = {
  primary: {
    bg: 'bg-primary-50 dark:bg-primary-900/20',
    border: 'border-primary-200 dark:border-primary-800',
    title: 'text-primary-700 dark:text-primary-300',
    cta: 'bg-primary-600 hover:bg-primary-700 text-white',
  },
  success: {
    bg: 'bg-success-50 dark:bg-success-900/20',
    border: 'border-success-200 dark:border-success-800',
    title: 'text-success-700 dark:text-success-300',
    cta: 'bg-success-600 hover:bg-success-700 text-white',
  },
  warning: {
    bg: 'bg-warning-50 dark:bg-warning-900/20',
    border: 'border-warning-200 dark:border-warning-800',
    title: 'text-warning-700 dark:text-warning-300',
    cta: 'bg-warning-600 hover:bg-warning-700 text-white',
  },
  gray: {
    bg: 'bg-gray-50 dark:bg-slate-800',
    border: 'border-gray-200 dark:border-slate-700',
    title: 'text-gray-700 dark:text-gray-300',
    cta: 'bg-gray-400 dark:bg-slate-600 text-white cursor-not-allowed',
  },
};

export function AdPlaceholder({ position }: AdPlaceholderProps) {
  const ads = sampleAds[position];

  return (
    <div className="hidden xl:flex flex-col gap-4 w-44 xl:w-48 flex-shrink-0 sticky top-32 self-start h-fit">
      {ads.map((ad, index) => {
        const colors = colorClasses[ad.color as keyof typeof colorClasses];
        return (
          <div
            key={index}
            className={`${colors.bg} ${colors.border} border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow`}
          >
            {/* Ad Label */}
            <div className="flex items-center gap-1 mb-2">
              <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 font-medium">
                Ad
              </span>
            </div>

            {/* Content */}
            <h4 className={`text-sm font-semibold ${colors.title} mb-1`}>
              {ad.title}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
              {ad.description}
            </p>

            {/* CTA Button */}
            <button
              className={`w-full px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${colors.cta}`}
              disabled={ad.color === 'gray'}
            >
              {ad.cta}
            </button>
          </div>
        );
      })}

      {/* Placeholder for future ads */}
      <div className="border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-xl p-4 text-center">
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Your ad here
        </p>
        <p className="text-[10px] text-gray-300 dark:text-gray-600 mt-1">
          Contact us
        </p>
      </div>
    </div>
  );
}

import { useState, useId } from 'react';
import { useFocusTrap } from '../hooks';

/**
 * Onboarding step definition
 */
interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  illustration?: React.ReactNode;
}

/**
 * Define the onboarding steps
 * This is where you can easily customize the tour content
 */
const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Where Did The Money Go?',
    description: 'Track and analyze your spending with ease. This quick tour will show you how to get started.',
    icon: '👋',
  },
  {
    id: 'upload',
    title: 'Upload Your Bank Statement',
    description: 'Export a CSV file from your bank and upload it here. We support Swedish banks like Swedbank, SEB, Handelsbanken, and more. Your data never leaves your device.',
    icon: '📤',
  },
  {
    id: 'categories',
    title: 'Automatic Categorization',
    description: 'Transactions are automatically categorized based on merchant names. You can also create custom mapping rules for merchants we don\'t recognize.',
    icon: '🏷️',
  },
  {
    id: 'subscriptions',
    title: 'Subscription Detection',
    description: 'We automatically detect recurring payments like Netflix, Spotify, and gym memberships. Review and confirm them to track your monthly commitments.',
    icon: '🔄',
  },
  {
    id: 'insights',
    title: 'Visualize Your Spending',
    description: 'See where your money goes with charts, top merchants analysis, and monthly comparisons. Filter by time period to focus on specific months.',
    icon: '📊',
  },
  {
    id: 'settings',
    title: 'Customize Your Experience',
    description: 'Click the gear icon to access settings. Enable features like bulk editing, custom mapping rules, and AI-powered insights.',
    icon: '⚙️',
  },
];

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
  onSkip: () => void;
}

export function OnboardingModal({ isOpen, onComplete, onSkip }: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const modalRef = useFocusTrap<HTMLDivElement>(isOpen, onSkip);
  const titleId = useId();

  if (!isOpen) return null;

  const step = ONBOARDING_STEPS[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === ONBOARDING_STEPS.length - 1;
  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (!isFirstStep) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    onSkip();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      // Don't close on backdrop click during onboarding
      // User must explicitly skip or complete
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60"
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <div
        ref={modalRef}
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress bar */}
        <div className="h-1 bg-gray-200 dark:bg-slate-700">
          <div
            className="h-full bg-primary-500 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-1.5">
              {ONBOARDING_STEPS.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentStep(index)}
                  className={`w-2 h-2 rounded-full transition-all ${
                    index === currentStep
                      ? 'w-6 bg-primary-500'
                      : index < currentStep
                      ? 'bg-primary-300 dark:bg-primary-700'
                      : 'bg-gray-300 dark:bg-slate-600'
                  }`}
                  aria-label={`Go to step ${index + 1}`}
                />
              ))}
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">
              {currentStep + 1} / {ONBOARDING_STEPS.length}
            </span>
          </div>

          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 rounded-full bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-4xl">
              {step.icon}
            </div>
          </div>

          {/* Title and description */}
          <h2
            id={titleId}
            className="text-xl font-semibold text-gray-900 dark:text-white text-center mb-3"
          >
            {step.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-center leading-relaxed">
            {step.description}
          </p>

          {/* Illustration placeholder */}
          {step.illustration && (
            <div className="mt-6">
              {step.illustration}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-8 py-4 bg-gray-50 dark:bg-slate-800/50 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            Skip tour
          </button>

          <div className="flex items-center gap-3">
            {!isFirstStep && (
              <button
                onClick={handlePrevious}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Back
              </button>
            )}
            <button
              onClick={handleNext}
              className="px-6 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors"
            >
              {isLastStep ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

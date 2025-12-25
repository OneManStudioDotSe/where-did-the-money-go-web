import { useState, useCallback, useEffect } from 'react';

/**
 * Onboarding state stored in localStorage
 */
interface OnboardingState {
  /** Whether the user has completed the onboarding tour */
  hasCompletedOnboarding: boolean;
  /** Timestamp when onboarding was completed */
  completedAt?: number;
  /** Version of onboarding completed (for future updates) */
  version: number;
}

const STORAGE_KEY = 'onboarding_state';
const CURRENT_VERSION = 1;

/**
 * Get onboarding state from localStorage
 */
function getOnboardingState(): OnboardingState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        hasCompletedOnboarding: parsed.hasCompletedOnboarding ?? false,
        completedAt: parsed.completedAt,
        version: parsed.version ?? 1,
      };
    }
  } catch {
    // Ignore errors
  }
  return {
    hasCompletedOnboarding: false,
    version: CURRENT_VERSION,
  };
}

/**
 * Save onboarding state to localStorage
 */
function saveOnboardingState(state: OnboardingState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error('Failed to save onboarding state:', error);
  }
}

/**
 * Hook for managing onboarding tour state
 *
 * This hook is designed to be implementation-agnostic - you can swap
 * the actual onboarding UI component without changing this hook.
 */
export function useOnboarding() {
  const [state, setState] = useState<OnboardingState>(() => getOnboardingState());
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Check if we should show onboarding on mount
  useEffect(() => {
    if (!state.hasCompletedOnboarding) {
      // Small delay to let the app render first
      const timer = setTimeout(() => {
        setIsOnboardingOpen(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [state.hasCompletedOnboarding]);

  /**
   * Mark onboarding as completed
   */
  const completeOnboarding = useCallback(() => {
    const newState: OnboardingState = {
      hasCompletedOnboarding: true,
      completedAt: Date.now(),
      version: CURRENT_VERSION,
    };
    setState(newState);
    saveOnboardingState(newState);
    setIsOnboardingOpen(false);
  }, []);

  /**
   * Skip onboarding (same as completing for now)
   */
  const skipOnboarding = useCallback(() => {
    completeOnboarding();
  }, [completeOnboarding]);

  /**
   * Reset onboarding state (for settings toggle)
   */
  const resetOnboarding = useCallback(() => {
    const newState: OnboardingState = {
      hasCompletedOnboarding: false,
      version: CURRENT_VERSION,
    };
    setState(newState);
    saveOnboardingState(newState);
  }, []);

  /**
   * Manually trigger onboarding (e.g., from help menu)
   */
  const startOnboarding = useCallback(() => {
    setIsOnboardingOpen(true);
  }, []);

  /**
   * Close onboarding without marking as completed
   */
  const closeOnboarding = useCallback(() => {
    setIsOnboardingOpen(false);
  }, []);

  return {
    /** Whether onboarding has been completed */
    hasCompletedOnboarding: state.hasCompletedOnboarding,
    /** Whether the onboarding modal is currently open */
    isOnboardingOpen,
    /** Mark onboarding as completed */
    completeOnboarding,
    /** Skip onboarding */
    skipOnboarding,
    /** Reset onboarding state (show again next time) */
    resetOnboarding,
    /** Manually start onboarding */
    startOnboarding,
    /** Close onboarding modal */
    closeOnboarding,
  };
}

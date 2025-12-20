import { useEffect, useRef, type RefObject } from 'react';

/**
 * Hook to trap focus within a container element (useful for modals)
 * Also handles Escape key to close and restores focus on unmount
 */
export function useFocusTrap<T extends HTMLElement>(
  isActive: boolean,
  onClose?: () => void
): RefObject<T | null> {
  const containerRef = useRef<T | null>(null);
  const previousActiveElement = useRef<Element | null>(null);

  useEffect(() => {
    if (!isActive) return;

    // Store currently focused element to restore later
    previousActiveElement.current = document.activeElement;

    const container = containerRef.current;
    if (!container) return;

    // Get all focusable elements
    const getFocusableElements = () => {
      return container.querySelectorAll<HTMLElement>(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
    };

    // Focus first element
    const focusableElements = getFocusableElements();
    if (focusableElements.length > 0) {
      // Small delay to ensure DOM is ready
      requestAnimationFrame(() => {
        focusableElements[0]?.focus();
      });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      // Handle Escape key
      if (e.key === 'Escape' && onClose) {
        e.preventDefault();
        onClose();
        return;
      }

      // Handle Tab key for focus trap
      if (e.key === 'Tab') {
        const focusable = getFocusableElements();
        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: if on first element, go to last
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement?.focus();
          }
        } else {
          // Tab: if on last element, go to first
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previously focused element
      if (previousActiveElement.current instanceof HTMLElement) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive, onClose]);

  return containerRef;
}

import { useEffect, useCallback } from 'react';

/**
 * Keyboard shortcut configuration
 */
interface KeyboardShortcut {
  /** Key code (e.g., 'f', 's', 'e') */
  key: string;
  /** Whether Ctrl (or Cmd on Mac) must be pressed */
  ctrl?: boolean;
  /** Whether Shift must be pressed */
  shift?: boolean;
  /** Whether Alt must be pressed */
  alt?: boolean;
  /** Action to perform when shortcut is triggered */
  action: () => void;
  /** Description of the shortcut for help display */
  description: string;
}

/**
 * Props for the useKeyboardShortcuts hook
 */
interface UseKeyboardShortcutsProps {
  /** Array of keyboard shortcuts to register */
  shortcuts: KeyboardShortcut[];
  /** Whether shortcuts are enabled (default: true) */
  enabled?: boolean;
}

/**
 * Hook to register global keyboard shortcuts
 *
 * @example
 * ```tsx
 * useKeyboardShortcuts({
 *   shortcuts: [
 *     { key: 'f', ctrl: true, action: () => setShowSearch(true), description: 'Open search' },
 *     { key: 's', ctrl: true, action: () => setShowSettings(true), description: 'Open settings' },
 *   ],
 * });
 * ```
 */
export function useKeyboardShortcuts({ shortcuts, enabled = true }: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't trigger shortcuts when typing in input fields
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const ctrlOrCmd = event.ctrlKey || event.metaKey;

      for (const shortcut of shortcuts) {
        const keyMatch = key === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? ctrlOrCmd : !ctrlOrCmd;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

/**
 * Get formatted shortcut key display (e.g., "Ctrl+F" or "⌘F")
 */
export function formatShortcut(shortcut: Pick<KeyboardShortcut, 'key' | 'ctrl' | 'shift' | 'alt'>): string {
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  const parts: string[] = [];

  if (shortcut.ctrl) {
    parts.push(isMac ? '⌘' : 'Ctrl');
  }
  if (shortcut.alt) {
    parts.push(isMac ? '⌥' : 'Alt');
  }
  if (shortcut.shift) {
    parts.push('Shift');
  }
  parts.push(shortcut.key.toUpperCase());

  return parts.join(isMac ? '' : '+');
}

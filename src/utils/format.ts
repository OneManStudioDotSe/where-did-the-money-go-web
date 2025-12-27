/**
 * Formatting utilities for consistent number and currency display
 */

/**
 * Format an amount for display in Swedish krona (SEK)
 * @param amount - The amount to format
 * @param options - Formatting options
 * @returns Formatted amount string without currency suffix
 */
export function formatAmount(
  amount: number,
  options: {
    /** Whether to use absolute value (default: true) */
    absolute?: boolean;
    /** Minimum fraction digits (default: 0) */
    minimumFractionDigits?: number;
    /** Maximum fraction digits (default: 0) */
    maximumFractionDigits?: number;
  } = {}
): string {
  const {
    absolute = true,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0,
  } = options;

  const value = absolute ? Math.abs(amount) : amount;

  return value.toLocaleString('sv-SE', {
    minimumFractionDigits,
    maximumFractionDigits,
  });
}

/**
 * Format an amount with 2 decimal places for detailed displays
 */
export function formatAmountWithDecimals(amount: number, absolute = true): string {
  return formatAmount(amount, {
    absolute,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Format an amount as a compact whole number
 */
export function formatAmountCompact(amount: number, absolute = true): string {
  return formatAmount(amount, {
    absolute,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
}

import type { Transaction, SuspiciousTransaction, SuspiciousType } from '../types/transaction';
import { normalizeRecipientName } from './subscription-detection';

// =============================================================================
// CONFIGURATION
// =============================================================================

interface ValidationConfig {
  /** Threshold for large transaction detection (absolute value) */
  largeTransactionThreshold: number;
  /** Days to look for near duplicates */
  nearDuplicateDays: number;
  /** Multiplier above average to flag as unusual for merchant */
  unusualMerchantMultiplier: number;
  /** Minimum transactions needed to calculate merchant average */
  minMerchantTransactions: number;
}

const DEFAULT_CONFIG: ValidationConfig = {
  largeTransactionThreshold: 5000,
  nearDuplicateDays: 3,
  unusualMerchantMultiplier: 3,
  minMerchantTransactions: 3,
};

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  return Math.abs((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Check if two dates are the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Calculate median of an array of numbers
 */
function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

/**
 * Calculate standard deviation
 */
function standardDeviation(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const squareDiffs = values.map(v => Math.pow(v - avg, 2));
  return Math.sqrt(squareDiffs.reduce((a, b) => a + b, 0) / values.length);
}

/**
 * Format amount for display
 */
function formatAmount(amount: number): string {
  return Math.abs(amount).toLocaleString('sv-SE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' kr';
}

// =============================================================================
// DUPLICATE DETECTION
// =============================================================================

/**
 * Find exact duplicates: same amount, same description, same date
 */
function findExactDuplicates(transactions: Transaction[]): SuspiciousTransaction[] {
  const suspicious: SuspiciousTransaction[] = [];
  const seen = new Map<string, Transaction>();

  for (const t of transactions) {
    // Create a key from amount, description, and date
    const key = `${t.amount.toFixed(2)}|${t.description.toLowerCase()}|${t.date.toISOString().slice(0, 10)}`;

    const existing = seen.get(key);
    if (existing) {
      // Only flag once per duplicate pair
      const alreadyFlagged = suspicious.some(
        s => s.transactionId === t.id && s.type === 'exact_duplicate'
      );
      if (!alreadyFlagged) {
        suspicious.push({
          transactionId: t.id,
          type: 'exact_duplicate',
          reason: `Exact duplicate of another transaction on ${t.date.toLocaleDateString('sv-SE')} for ${formatAmount(t.amount)}`,
          relatedTransactionId: existing.id,
          severity: 'high',
          isDismissed: false,
        });
      }
    } else {
      seen.set(key, t);
    }
  }

  return suspicious;
}

/**
 * Find near duplicates: same amount and similar description within a few days
 */
function findNearDuplicates(
  transactions: Transaction[],
  config: ValidationConfig
): SuspiciousTransaction[] {
  const suspicious: SuspiciousTransaction[] = [];

  // Only consider expenses
  const expenses = transactions.filter(t => t.amount < 0);

  // Group by amount (rounded to 2 decimals)
  const byAmount = new Map<string, Transaction[]>();
  for (const t of expenses) {
    const key = t.amount.toFixed(2);
    const existing = byAmount.get(key) || [];
    existing.push(t);
    byAmount.set(key, existing);
  }

  // Check each group for near duplicates
  for (const [, txns] of byAmount) {
    if (txns.length < 2) continue;

    // Sort by date
    txns.sort((a, b) => a.date.getTime() - b.date.getTime());

    for (let i = 0; i < txns.length - 1; i++) {
      const t1 = txns[i];
      const t2 = txns[i + 1];

      // Skip if same day (would be caught by exact duplicate check)
      if (isSameDay(t1.date, t2.date)) continue;

      const days = daysBetween(t1.date, t2.date);
      if (days <= config.nearDuplicateDays) {
        // Normalize descriptions to compare
        const desc1 = normalizeRecipientName(t1.description).toLowerCase();
        const desc2 = normalizeRecipientName(t2.description).toLowerCase();

        // Check if descriptions are similar (same first 10 chars or one contains the other)
        const areSimilar =
          desc1.slice(0, 10) === desc2.slice(0, 10) ||
          desc1.includes(desc2) ||
          desc2.includes(desc1);

        if (areSimilar) {
          suspicious.push({
            transactionId: t2.id,
            type: 'near_duplicate',
            reason: `Similar to another ${formatAmount(t2.amount)} transaction from ${Math.round(days)} day${days === 1 ? '' : 's'} earlier`,
            relatedTransactionId: t1.id,
            severity: 'medium',
            isDismissed: false,
          });
        }
      }
    }
  }

  return suspicious;
}

// =============================================================================
// UNUSUAL AMOUNT DETECTION
// =============================================================================

/**
 * Find large transactions above threshold
 */
function findLargeTransactions(
  transactions: Transaction[],
  config: ValidationConfig
): SuspiciousTransaction[] {
  const suspicious: SuspiciousTransaction[] = [];

  for (const t of transactions) {
    // Only flag expenses
    if (t.amount >= 0) continue;

    const absAmount = Math.abs(t.amount);
    if (absAmount >= config.largeTransactionThreshold) {
      suspicious.push({
        transactionId: t.id,
        type: 'large_transaction',
        reason: `Large transaction: ${formatAmount(t.amount)} exceeds ${formatAmount(config.largeTransactionThreshold)} threshold`,
        severity: 'low',
        isDismissed: false,
      });
    }
  }

  return suspicious;
}

/**
 * Find transactions that are unusually high for a specific merchant
 */
function findUnusualForMerchant(
  transactions: Transaction[],
  config: ValidationConfig
): SuspiciousTransaction[] {
  const suspicious: SuspiciousTransaction[] = [];

  // Only consider expenses
  const expenses = transactions.filter(t => t.amount < 0);

  // Group by normalized merchant name
  const byMerchant = new Map<string, Transaction[]>();
  for (const t of expenses) {
    const merchant = normalizeRecipientName(t.description);
    const existing = byMerchant.get(merchant) || [];
    existing.push(t);
    byMerchant.set(merchant, existing);
  }

  // Check each merchant group
  for (const [merchant, txns] of byMerchant) {
    // Need minimum transactions to establish a baseline
    if (txns.length < config.minMerchantTransactions) continue;

    const amounts = txns.map(t => Math.abs(t.amount));
    const medianAmount = median(amounts);
    const stdDev = standardDeviation(amounts);

    // Skip if all amounts are the same (likely a subscription)
    if (stdDev === 0) continue;

    // Find transactions significantly above median
    const threshold = medianAmount + (stdDev * config.unusualMerchantMultiplier);

    for (const t of txns) {
      const absAmount = Math.abs(t.amount);
      if (absAmount > threshold && absAmount > medianAmount * 2) {
        suspicious.push({
          transactionId: t.id,
          type: 'unusual_for_merchant',
          reason: `Unusually high for ${merchant}: ${formatAmount(t.amount)} vs typical ${formatAmount(medianAmount)}`,
          severity: 'medium',
          isDismissed: false,
        });
      }
    }
  }

  return suspicious;
}

// =============================================================================
// MAIN VALIDATION FUNCTION
// =============================================================================

export interface ValidationResult {
  /** All detected suspicious transactions */
  suspicious: SuspiciousTransaction[];
  /** Count by type */
  counts: Record<SuspiciousType, number>;
  /** Total count */
  total: number;
}

/**
 * Validate transactions and detect suspicious patterns
 */
export function validateTransactions(
  transactions: Transaction[],
  config: Partial<ValidationConfig> = {}
): ValidationResult {
  const fullConfig: ValidationConfig = { ...DEFAULT_CONFIG, ...config };

  // Run all detection algorithms
  const exactDuplicates = findExactDuplicates(transactions);
  const nearDuplicates = findNearDuplicates(transactions, fullConfig);
  const largeTransactions = findLargeTransactions(transactions, fullConfig);
  const unusualForMerchant = findUnusualForMerchant(transactions, fullConfig);

  // Combine all results (avoiding duplicates by transaction ID + type)
  const seen = new Set<string>();
  const suspicious: SuspiciousTransaction[] = [];

  for (const s of [...exactDuplicates, ...nearDuplicates, ...largeTransactions, ...unusualForMerchant]) {
    const key = `${s.transactionId}|${s.type}`;
    if (!seen.has(key)) {
      seen.add(key);
      suspicious.push(s);
    }
  }

  // Sort by severity (high first), then by type
  const severityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  suspicious.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  // Calculate counts
  const counts: Record<SuspiciousType, number> = {
    exact_duplicate: 0,
    near_duplicate: 0,
    large_transaction: 0,
    unusual_for_merchant: 0,
  };

  for (const s of suspicious) {
    counts[s.type]++;
  }

  return {
    suspicious,
    counts,
    total: suspicious.length,
  };
}

/**
 * Add suspicious badges to transactions
 */
export function markSuspiciousTransactions(
  transactions: Transaction[],
  suspicious: SuspiciousTransaction[]
): Transaction[] {
  // Create a set of suspicious transaction IDs (that are not dismissed)
  const suspiciousIds = new Set(
    suspicious
      .filter(s => !s.isDismissed)
      .map(s => s.transactionId)
  );

  return transactions.map(t => {
    if (suspiciousIds.has(t.id)) {
      // Check if already has suspicious badge
      const hasBadge = t.badges.some(b => b.type === 'suspicious');
      if (!hasBadge) {
        return {
          ...t,
          badges: [...t.badges, { type: 'suspicious' as const, label: 'Review' }],
        };
      }
    }
    return t;
  });
}

/**
 * Remove suspicious badge from a transaction
 */
export function removeSuspiciousBadge(transaction: Transaction): Transaction {
  return {
    ...transaction,
    badges: transaction.badges.filter(b => b.type !== 'suspicious'),
  };
}

// =============================================================================
// PERSISTENCE
// =============================================================================

const DISMISSED_STORAGE_KEY = 'dismissed_suspicious_transactions';

/**
 * Get dismissed warning IDs from localStorage
 */
export function getDismissedWarnings(): Set<string> {
  try {
    const stored = localStorage.getItem(DISMISSED_STORAGE_KEY);
    if (!stored) return new Set();
    return new Set(JSON.parse(stored));
  } catch {
    return new Set();
  }
}

/**
 * Save dismissed warning IDs to localStorage
 */
export function saveDismissedWarnings(dismissed: Set<string>): void {
  try {
    localStorage.setItem(DISMISSED_STORAGE_KEY, JSON.stringify([...dismissed]));
  } catch (e) {
    console.error('Failed to save dismissed warnings:', e);
  }
}

/**
 * Create a unique ID for a suspicious transaction warning
 */
export function getSuspiciousWarningId(s: SuspiciousTransaction): string {
  return `${s.transactionId}|${s.type}`;
}

/**
 * Apply dismissed status to suspicious transactions based on localStorage
 */
export function applyDismissedStatus(suspicious: SuspiciousTransaction[]): SuspiciousTransaction[] {
  const dismissed = getDismissedWarnings();
  return suspicious.map(s => ({
    ...s,
    isDismissed: dismissed.has(getSuspiciousWarningId(s)),
  }));
}

/**
 * Get label for suspicious type
 */
export function getSuspiciousTypeLabel(type: SuspiciousType): string {
  const labels: Record<SuspiciousType, string> = {
    exact_duplicate: 'Exact Duplicate',
    near_duplicate: 'Possible Duplicate',
    large_transaction: 'Large Transaction',
    unusual_for_merchant: 'Unusual Amount',
  };
  return labels[type];
}

/**
 * Get icon for suspicious type
 */
export function getSuspiciousTypeIcon(type: SuspiciousType): string {
  const icons: Record<SuspiciousType, string> = {
    exact_duplicate: '🔁',
    near_duplicate: '📋',
    large_transaction: '💰',
    unusual_for_merchant: '📈',
  };
  return icons[type];
}

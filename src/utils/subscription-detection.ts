import type { Transaction, DetectedSubscription, Subscription, RecurringType } from '../types/transaction';

/**
 * Configuration for subscription detection
 */
interface DetectionConfig {
  /** Minimum occurrences to be considered a subscription (default: 2) */
  minOccurrences: number;
  /** Day tolerance for monthly recurrence (default: 3 days) */
  dayTolerance: number;
  /** Amount tolerance as percentage (default: 0.05 = 5%) */
  amountTolerance: number;
  /** Maximum gap between occurrences in days (default: 45) */
  maxGapDays: number;
}

const DEFAULT_CONFIG: DetectionConfig = {
  minOccurrences: 4,
  dayTolerance: 5,
  amountTolerance: 0.15,
  maxGapDays: 45,
};

/**
 * Normalize a transaction description to extract recipient name
 * Removes common prefixes, transaction codes, and normalizes casing
 */
export function normalizeRecipientName(description: string): string {
  let normalized = description.trim();

  // Remove common Swedish bank prefixes
  const prefixes = [
    /^(KORTKÖP|KORTKOP|AUTOGIRO|BG|PG|SWISH|BETALNING|ÖVERFÖRING|INSÄTTNING)\s*/i,
    /^\d{4}-\d{2}-\d{2}\s*/,  // Date prefixes
    /^\*{4}\d{4}\s*/,          // Card number pattern ****1234
    /^[A-Z]{2}\d{6,}\s*/,      // Reference numbers like SE123456
  ];

  for (const prefix of prefixes) {
    normalized = normalized.replace(prefix, '');
  }

  // Remove trailing reference numbers and transaction codes
  // Be careful NOT to remove legitimate Swedish words
  normalized = normalized
    .replace(/\s+\d{4}-\d{2}-\d{2}$/g, '')     // Trailing dates like "2024-01-15"
    .replace(/\s+\/\d{2}-\d{2}-\d{2}$/g, '')   // Trailing date like /25-12-18
    .replace(/\s+[A-Z]{2,3}\d{4,}$/g, '')      // Trailing codes like SE12345
    .replace(/\s+[A-Z]\d{4,}$/g, '')           // Trailing codes like P39211 (letter + 4+ digits, stricter)
    .replace(/\s+\d{3,4}$/g, '')               // Trailing short numbers (3-4 digits only, common card/ref codes)
    .replace(/\s*\*+\s*$/g, '')                // Trailing asterisks
    .trim();

  // Normalize multiple spaces
  normalized = normalized.replace(/\s+/g, ' ');

  // Convert to title case for consistency, handling Swedish characters
  normalized = toSwedishTitleCase(normalized);

  return normalized || description.trim();
}

/**
 * Convert a string to title case, properly handling Swedish characters (Å, Ä, Ö)
 * JavaScript's \b and \w don't recognize Swedish letters as word characters
 */
function toSwedishTitleCase(str: string): string {
  if (!str) return str;

  // First lowercase everything
  const lower = str.toLowerCase();

  // Then capitalize first letter of each word
  // We need to handle Swedish letters (å, ä, ö) which aren't matched by \w
  let result = '';
  let capitalizeNext = true;

  for (let i = 0; i < lower.length; i++) {
    const char = lower[i];
    if (char === ' ' || char === '-' || char === '/') {
      result += char;
      capitalizeNext = true;
    } else if (capitalizeNext) {
      result += char.toUpperCase();
      capitalizeNext = false;
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Check if two amounts are within the tolerance percentage
 */
function amountsMatch(amount1: number, amount2: number, tolerance: number): boolean {
  const avg = (Math.abs(amount1) + Math.abs(amount2)) / 2;
  if (avg === 0) return true;
  const diff = Math.abs(Math.abs(amount1) - Math.abs(amount2));
  return diff / avg <= tolerance;
}

/**
 * Check if amounts are consistent, allowing for a few outliers
 * Returns the "core" amount (median) and whether enough transactions match
 *
 * Rule: At least half of the transactions must have matching amounts
 */
function checkAmountConsistency(
  amounts: number[],
  tolerance: number,
  minRequired: number
): { isConsistent: boolean; coreAmount: number; matchingCount: number } {
  if (amounts.length === 0) {
    return { isConsistent: false, coreAmount: 0, matchingCount: 0 };
  }

  // Use median instead of average to be resistant to outliers
  const sortedAmounts = [...amounts].map(a => Math.abs(a)).sort((a, b) => a - b);
  const mid = Math.floor(sortedAmounts.length / 2);
  const coreAmount = sortedAmounts.length % 2 === 0
    ? (sortedAmounts[mid - 1] + sortedAmounts[mid]) / 2
    : sortedAmounts[mid];

  // Count how many amounts match the core amount within tolerance
  const matchingCount = amounts.filter(a => amountsMatch(a, -coreAmount, tolerance)).length;

  // Need at least half of the transactions to have matching amounts
  const minMatches = Math.max(minRequired, Math.ceil(amounts.length / 2));
  const isConsistent = matchingCount >= minMatches;

  return { isConsistent, coreAmount, matchingCount };
}

/**
 * Check if two days are within the tolerance range (considering month wrapping)
 */
function daysMatch(day1: number, day2: number, tolerance: number): boolean {
  const diff = Math.abs(day1 - day2);
  // Handle month boundary wrapping (e.g., day 28 and day 2)
  const wrappedDiff = Math.min(diff, 31 - diff);
  return wrappedDiff <= tolerance;
}

/**
 * Calculate the most common day of month from a set of dates
 */
function getMostCommonDay(dates: Date[]): number {
  const dayCounts = new Map<number, number>();

  for (const date of dates) {
    const day = date.getDate();
    dayCounts.set(day, (dayCounts.get(day) || 0) + 1);
  }

  let maxCount = 0;
  let mostCommonDay = 1;

  for (const [day, count] of dayCounts) {
    if (count > maxCount) {
      maxCount = count;
      mostCommonDay = day;
    }
  }

  return mostCommonDay;
}

/**
 * Generate a unique ID for a detected subscription
 */
function generateSubscriptionId(recipientName: string, amount: number): string {
  // Include both name and amount to reduce collisions
  const input = `${recipientName}-${Math.abs(amount).toFixed(2)}`;
  const hash = input.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff;
  }, 0);
  // Add timestamp component for uniqueness
  const timeComponent = Date.now().toString(36).slice(-4);
  return `sub-${Math.abs(hash).toString(36)}-${timeComponent}`;
}

/**
 * Group transactions by normalized recipient name
 */
function groupByRecipient(transactions: Transaction[]): Map<string, Transaction[]> {
  const groups = new Map<string, Transaction[]>();

  for (const transaction of transactions) {
    // Only consider expenses (negative amounts)
    if (transaction.amount >= 0) continue;

    const recipientName = normalizeRecipientName(transaction.description);
    if (!recipientName) continue;

    const existing = groups.get(recipientName) || [];
    // Use spread to avoid direct mutation
    groups.set(recipientName, [...existing, transaction]);
  }

  return groups;
}

/**
 * Check if a group of transactions represents a recurring subscription
 */
function isRecurringPattern(
  transactions: Transaction[],
  config: DetectionConfig
): boolean {
  if (transactions.length < config.minOccurrences) return false;

  // Sort by date
  const sorted = [...transactions].sort((a, b) => a.date.getTime() - b.date.getTime());

  // Check amount consistency (allows 1-2 outliers)
  const amounts = sorted.map(t => t.amount);
  const amountCheck = checkAmountConsistency(amounts, config.amountTolerance, config.minOccurrences);
  if (!amountCheck.isConsistent) return false;

  // Check day of month consistency
  const days = sorted.map(t => t.date.getDate());
  const mostCommonDay = getMostCommonDay(sorted.map(t => t.date));

  const dayConsistent = days.filter(d =>
    daysMatch(d, mostCommonDay, config.dayTolerance)
  ).length >= config.minOccurrences;
  if (!dayConsistent) return false;

  // Check for monthly gaps (not too far apart)
  for (let i = 1; i < sorted.length; i++) {
    const gap = (sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / (1000 * 60 * 60 * 24);
    if (gap > config.maxGapDays) return false;
  }

  return true;
}

/**
 * Detect potential subscriptions from a list of transactions
 */
export function detectSubscriptions(
  transactions: Transaction[],
  config: Partial<DetectionConfig> = {}
): DetectedSubscription[] {
  const fullConfig = { ...DEFAULT_CONFIG, ...config };
  const groups = groupByRecipient(transactions);
  const detected: DetectedSubscription[] = [];

  for (const [recipientName, txns] of groups) {
    if (!isRecurringPattern(txns, fullConfig)) continue;

    // Sort transactions by date
    const sorted = [...txns].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate statistics using median (core amount) to ignore outliers
    const amounts = sorted.map(t => t.amount);
    const amountCheck = checkAmountConsistency(amounts, fullConfig.amountTolerance, fullConfig.minOccurrences);
    const coreAmount = amountCheck.coreAmount;
    const commonDay = getMostCommonDay(sorted.map(t => t.date));

    // Calculate min and max amounts (absolute values since amounts are negative)
    const absAmounts = amounts.map(a => Math.abs(a));
    const minAmount = Math.min(...absAmounts);
    const maxAmount = Math.max(...absAmounts);

    // Check if all transactions share the same category
    const categoryIds = new Set(sorted.map(t => t.categoryId));
    const subcategoryIds = new Set(sorted.map(t => t.subcategoryId));

    detected.push({
      id: generateSubscriptionId(recipientName, coreAmount),
      recipientName,
      averageAmount: Math.round(coreAmount * 100) / 100,
      minAmount: Math.round(minAmount * 100) / 100,
      maxAmount: Math.round(maxAmount * 100) / 100,
      commonDayOfMonth: commonDay,
      transactionIds: sorted.map(t => t.id),
      occurrenceCount: sorted.length,
      isConfirmed: null,
      recurringType: null, // User will choose: 'subscription', 'recurring_expense', or 'fixed_expense'
      categoryId: categoryIds.size === 1 ? sorted[0].categoryId : null,
      subcategoryId: subcategoryIds.size === 1 ? sorted[0].subcategoryId : null,
      firstSeen: sorted[0].date,
      lastSeen: sorted[sorted.length - 1].date,
    });
  }

  // Sort by occurrence count (most frequent first)
  detected.sort((a, b) => b.occurrenceCount - a.occurrenceCount);

  return detected;
}

/**
 * Convert a confirmed detected subscription to a Subscription object
 */
export function createSubscription(detected: DetectedSubscription): Subscription {
  return {
    id: detected.id,
    name: detected.recipientName,
    amount: detected.averageAmount,
    billingDay: detected.commonDayOfMonth,
    recurringType: detected.recurringType || 'subscription', // Default to subscription if not set
    categoryId: detected.categoryId,
    subcategoryId: detected.subcategoryId,
    transactionIds: detected.transactionIds,
    createdAt: new Date(),
    isActive: true,
  };
}

/**
 * Mark transactions as recurring and add appropriate badge
 */
export function markTransactionsAsRecurring(
  transactions: Transaction[],
  recurringTransactionIds: Map<string, RecurringType>
): Transaction[] {
  return transactions.map(t => {
    const recurringType = recurringTransactionIds.get(t.id);
    if (recurringType) {
      const hasRecurringBadge = t.badges.some(
        b => b.type === 'subscription' || b.type === 'recurring_expense' || b.type === 'fixed_expense'
      );
      let badge: { type: 'subscription' | 'recurring_expense' | 'fixed_expense'; label: string };
      if (recurringType === 'subscription') {
        badge = { type: 'subscription', label: 'Subscription' };
      } else if (recurringType === 'fixed_expense') {
        badge = { type: 'fixed_expense', label: 'Fixed' };
      } else {
        badge = { type: 'recurring_expense', label: 'Recurring' };
      }
      return {
        ...t,
        isSubscription: true,
        badges: hasRecurringBadge
          ? t.badges
          : [...t.badges, badge],
      };
    }
    return t;
  });
}

/**
 * Mark transactions as subscriptions and add badge (legacy function for backward compatibility)
 */
export function markTransactionsAsSubscriptions(
  transactions: Transaction[],
  subscriptionTransactionIds: Set<string>
): Transaction[] {
  // Convert Set to Map with default 'subscription' type
  const recurringMap = new Map<string, RecurringType>();
  subscriptionTransactionIds.forEach(id => recurringMap.set(id, 'subscription'));
  return markTransactionsAsRecurring(transactions, recurringMap);
}

/**
 * Group subscriptions by subcategory for display
 */
export function groupSubscriptionsBySubcategory(
  subscriptions: Subscription[]
): Map<string | null, Subscription[]> {
  const groups = new Map<string | null, Subscription[]>();

  for (const sub of subscriptions) {
    const key = sub.subcategoryId;
    const existing = groups.get(key) || [];
    existing.push(sub);
    groups.set(key, existing);
  }

  return groups;
}

/**
 * Calculate total monthly subscription cost
 */
export function calculateMonthlySubscriptionCost(subscriptions: Subscription[]): number {
  return subscriptions
    .filter(s => s.isActive)
    .reduce((sum, s) => sum + s.amount, 0);
}

/**
 * Storage key for subscriptions
 */
const SUBSCRIPTIONS_STORAGE_KEY = 'confirmed_subscriptions';

/**
 * Save subscriptions to localStorage
 */
export function saveSubscriptions(subscriptions: Subscription[]): void {
  try {
    const serializable = subscriptions.map(s => ({
      ...s,
      createdAt: s.createdAt.toISOString(),
    }));
    localStorage.setItem(SUBSCRIPTIONS_STORAGE_KEY, JSON.stringify(serializable));
  } catch (e) {
    console.error('Failed to save subscriptions:', e);
  }
}

/**
 * Load subscriptions from localStorage
 */
export function loadSubscriptions(): Subscription[] {
  try {
    const stored = localStorage.getItem(SUBSCRIPTIONS_STORAGE_KEY);
    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return parsed.map((s: Subscription & { createdAt: string }) => ({
      ...s,
      createdAt: new Date(s.createdAt),
    }));
  } catch (e) {
    console.error('Failed to load subscriptions:', e);
    return [];
  }
}

/**
 * Debug function to analyze why specific transactions aren't detected as subscriptions
 * Call this from browser console: debugSubscriptionDetection(transactions, 'BERGNÄS')
 */
export function debugSubscriptionDetection(
  transactions: Transaction[],
  searchTerm: string
): void {
  const config = DEFAULT_CONFIG;

  // Find matching transactions
  const matching = transactions.filter(t =>
    t.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.group(`🔍 Subscription Debug: "${searchTerm}"`);
  console.log(`Found ${matching.length} transactions containing "${searchTerm}"`);

  if (matching.length === 0) {
    console.log('No transactions found with this search term');
    console.groupEnd();
    return;
  }

  // Show how each transaction normalizes
  console.group('📝 Normalized Names:');
  const normalizedGroups = new Map<string, Transaction[]>();
  matching.forEach(t => {
    const normalized = normalizeRecipientName(t.description);
    console.log(`"${t.description}" → "${normalized}" | Amount: ${t.amount} | Date: ${t.date.toISOString().slice(0, 10)}`);
    const group = normalizedGroups.get(normalized) || [];
    group.push(t);
    normalizedGroups.set(normalized, group);
  });
  console.groupEnd();

  // Check each normalized group
  console.group('📊 Analysis per normalized group:');
  for (const [name, txns] of normalizedGroups) {
    console.group(`Group: "${name}" (${txns.length} transactions)`);

    // Check 1: Min occurrences
    if (txns.length < config.minOccurrences) {
      console.log(`❌ FAIL: Only ${txns.length} occurrences (need ${config.minOccurrences})`);
      console.groupEnd();
      continue;
    }
    console.log(`✅ Occurrences: ${txns.length} >= ${config.minOccurrences}`);

    // Check 2: Only expenses
    const expenses = txns.filter(t => t.amount < 0);
    if (expenses.length < config.minOccurrences) {
      console.log(`❌ FAIL: Only ${expenses.length} are expenses (negative amounts)`);
      console.groupEnd();
      continue;
    }
    console.log(`✅ Expenses: ${expenses.length} negative amounts`);

    // Check 3: Amount consistency (using median, allows outliers)
    const amounts = expenses.map(t => t.amount);
    const amountCheck = checkAmountConsistency(amounts, config.amountTolerance, config.minOccurrences);
    if (!amountCheck.isConsistent) {
      const minMatches = Math.max(config.minOccurrences, Math.ceil(amounts.length / 2));
      console.log(`❌ FAIL: Not enough amounts match (need ${minMatches} = half of ${amounts.length}, got ${amountCheck.matchingCount})`);
      console.log(`   Median amount: ${amountCheck.coreAmount.toFixed(2)}, Amounts: ${amounts.map(a => a.toFixed(2)).join(', ')}`);
      console.groupEnd();
      continue;
    }
    console.log(`✅ Amount consistency: ${amountCheck.matchingCount}/${amounts.length} match median ${amountCheck.coreAmount.toFixed(2)} (±${config.amountTolerance * 100}%)`);

    // Check 4: Day consistency
    const sorted = [...expenses].sort((a, b) => a.date.getTime() - b.date.getTime());
    const days = sorted.map(t => t.date.getDate());
    const mostCommonDay = getMostCommonDay(sorted.map(t => t.date));
    const dayMatches = days.filter(d => daysMatch(d, mostCommonDay, config.dayTolerance)).length;
    if (dayMatches < config.minOccurrences) {
      console.log(`❌ FAIL: Day of month varies too much (>${config.dayTolerance} days tolerance)`);
      console.log(`   Days: ${days.join(', ')}, Most common: ${mostCommonDay}`);
      console.groupEnd();
      continue;
    }
    console.log(`✅ Day consistency: ${dayMatches} match day ${mostCommonDay} (±${config.dayTolerance})`);

    // Check 5: Gap between transactions
    let gapFailed = false;
    for (let i = 1; i < sorted.length; i++) {
      const gap = (sorted[i].date.getTime() - sorted[i - 1].date.getTime()) / (1000 * 60 * 60 * 24);
      if (gap > config.maxGapDays) {
        console.log(`❌ FAIL: Gap of ${Math.round(gap)} days between ${sorted[i-1].date.toISOString().slice(0, 10)} and ${sorted[i].date.toISOString().slice(0, 10)} (max: ${config.maxGapDays})`);
        gapFailed = true;
        break;
      }
    }
    if (!gapFailed) {
      console.log(`✅ Gap check: All gaps <= ${config.maxGapDays} days`);
      console.log(`🎉 This group SHOULD be detected as a subscription!`);
    }

    console.groupEnd();
  }
  console.groupEnd();
  console.groupEnd();
}

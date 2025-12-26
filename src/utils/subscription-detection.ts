import type {
  Transaction,
  DetectedSubscription,
  Subscription,
  RecurringType,
  BillingFrequency,
  ConfidenceLevel,
  AmountType,
  ConfidenceScoreBreakdown,
} from '../types/transaction';

// =============================================================================
// CONFIGURATION
// =============================================================================

interface FrequencyConfig {
  name: BillingFrequency;
  expectedGap: number;
  tolerance: number;
  minOccurrences: number;
}

const FREQUENCIES: FrequencyConfig[] = [
  { name: 'weekly', expectedGap: 7, tolerance: 2, minOccurrences: 4 },
  { name: 'biweekly', expectedGap: 14, tolerance: 3, minOccurrences: 3 },
  { name: 'monthly', expectedGap: 30, tolerance: 5, minOccurrences: 3 },
  { name: 'quarterly', expectedGap: 90, tolerance: 10, minOccurrences: 2 },
  { name: 'annual', expectedGap: 365, tolerance: 15, minOccurrences: 2 },
];

const AMOUNT_TOLERANCES = {
  strict: 0.05,   // 5% for fixed subscriptions
  normal: 0.15,   // 15% for general recurring
  loose: 0.25,    // 25% for variable amounts
};

/** Minimum confidence score to be detected (70% based on user validation) */
const MIN_CONFIDENCE = 70;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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
 * Calculate variance relative to a reference value
 */
function calculateVariance(values: number[], reference: number): number {
  if (reference === 0 || values.length === 0) return 0;
  const deviations = values.map(v => Math.abs(v - reference) / reference);
  return median(deviations);
}

/**
 * Calculate days between two dates
 */
function daysBetween(date1: Date, date2: Date): number {
  return Math.abs((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Generate a unique ID for a detected subscription
 */
function generateSubscriptionId(recipientName: string, amount: number): string {
  const input = `${recipientName}-${Math.abs(amount).toFixed(2)}`;
  const hash = input.split('').reduce((acc, char) => {
    return ((acc << 5) - acc + char.charCodeAt(0)) & 0xffffffff;
  }, 0);
  const timeComponent = Date.now().toString(36).slice(-4);
  return `sub-${Math.abs(hash).toString(36)}-${timeComponent}`;
}

// =============================================================================
// FREQUENCY DETECTION
// =============================================================================

interface FrequencyAnalysis {
  frequency: FrequencyConfig | null;
  gapConsistency: number;
}

/**
 * Detect the billing frequency from transaction gaps
 */
function detectFrequency(gaps: number[]): FrequencyAnalysis {
  if (gaps.length === 0) return { frequency: null, gapConsistency: 0 };

  const medianGap = median(gaps);

  // Find the closest matching frequency
  let bestMatch: FrequencyConfig | null = null;
  let bestDistance = Infinity;

  for (const freq of FREQUENCIES) {
    const distance = Math.abs(medianGap - freq.expectedGap);
    if (distance < bestDistance && distance <= freq.tolerance * 2) {
      bestDistance = distance;
      bestMatch = freq;
    }
  }

  if (!bestMatch) return { frequency: null, gapConsistency: 0 };

  // Calculate how many gaps fall within tolerance
  const matchingGaps = gaps.filter(gap =>
    Math.abs(gap - bestMatch!.expectedGap) <= bestMatch!.tolerance
  );
  const gapConsistency = matchingGaps.length / gaps.length;

  return { frequency: bestMatch, gapConsistency };
}

// =============================================================================
// AMOUNT ANALYSIS
// =============================================================================

interface AmountAnalysis {
  coreAmount: number;
  variance: number;
  amountType: AmountType;
  matchingCount: number;
  tolerance: number;
}

/**
 * Analyze amounts to determine core amount and variance
 */
function analyzeAmounts(amounts: number[]): AmountAnalysis {
  const absAmounts = amounts.map(a => Math.abs(a));
  const coreAmount = median(absAmounts);
  const variance = calculateVariance(absAmounts, coreAmount);

  // Determine amount type based on variance
  let tolerance: number;
  let amountType: AmountType;

  if (variance <= AMOUNT_TOLERANCES.strict) {
    tolerance = AMOUNT_TOLERANCES.strict;
    amountType = 'fixed';
  } else if (variance <= AMOUNT_TOLERANCES.normal) {
    tolerance = AMOUNT_TOLERANCES.normal;
    amountType = 'fixed';
  } else {
    tolerance = AMOUNT_TOLERANCES.loose;
    amountType = 'variable';
  }

  // Count matching amounts
  const matchingCount = absAmounts.filter(a =>
    Math.abs(a - coreAmount) / coreAmount <= tolerance
  ).length;

  return { coreAmount, variance, amountType, matchingCount, tolerance };
}

// =============================================================================
// CONFIDENCE SCORING
// =============================================================================

interface ConfidenceResult {
  score: number;
  breakdown: ConfidenceScoreBreakdown;
}

/**
 * Calculate confidence score for a detected subscription
 */
function calculateConfidenceScore(
  amountAnalysis: AmountAnalysis,
  frequencyAnalysis: FrequencyAnalysis,
  occurrenceCount: number,
  totalTransactions: number
): ConfidenceResult {
  // Amount Score (0-30)
  let amountScore: number;
  if (amountAnalysis.variance <= 0.02) amountScore = 30;
  else if (amountAnalysis.variance <= 0.05) amountScore = 25;
  else if (amountAnalysis.variance <= 0.10) amountScore = 20;
  else if (amountAnalysis.variance <= 0.15) amountScore = 15;
  else if (amountAnalysis.variance <= 0.25) amountScore = 10;
  else amountScore = 5;

  // Timing Score (0-30)
  let timingScore: number;
  const gapConsistency = frequencyAnalysis.gapConsistency;
  if (gapConsistency >= 0.95) timingScore = 30;
  else if (gapConsistency >= 0.90) timingScore = 25;
  else if (gapConsistency >= 0.80) timingScore = 20;
  else if (gapConsistency >= 0.70) timingScore = 15;
  else if (gapConsistency >= 0.60) timingScore = 10;
  else timingScore = 5;

  // Occurrence Score (0-20)
  let occurrenceScore: number;
  if (occurrenceCount >= 10) occurrenceScore = 20;
  else if (occurrenceCount >= 6) occurrenceScore = 15;
  else if (occurrenceCount >= 4) occurrenceScore = 10;
  else if (occurrenceCount >= 3) occurrenceScore = 7;
  else occurrenceScore = 4;

  // Pattern Clarity Score (0-20)
  let clarityScore: number;
  const amountMatchRatio = amountAnalysis.matchingCount / totalTransactions;
  if (frequencyAnalysis.frequency && gapConsistency >= 0.8 && amountMatchRatio >= 0.8) {
    clarityScore = 20;
  } else if (frequencyAnalysis.frequency && gapConsistency >= 0.6 && amountMatchRatio >= 0.6) {
    clarityScore = 15;
  } else if (frequencyAnalysis.frequency) {
    clarityScore = 10;
  } else {
    clarityScore = 5;
  }

  const score = amountScore + timingScore + occurrenceScore + clarityScore;

  return {
    score,
    breakdown: { amountScore, timingScore, occurrenceScore, clarityScore }
  };
}

/**
 * Get confidence level from score
 */
function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

// =============================================================================
// PREDICTION
// =============================================================================

/**
 * Predict the next expected payment date
 */
function predictNextDate(lastDate: Date, frequency: BillingFrequency): Date {
  const next = new Date(lastDate);

  switch (frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'annual':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }

  return next;
}

/**
 * Get the expected billing day (day of week for weekly/biweekly, day of month otherwise)
 */
function getExpectedBillingDay(dates: Date[], frequency: BillingFrequency): number {
  if (frequency === 'weekly' || frequency === 'biweekly') {
    // Return day of week (0-6)
    const days = dates.map(d => d.getDay());
    const counts = new Map<number, number>();
    days.forEach(d => counts.set(d, (counts.get(d) || 0) + 1));
    let maxDay = 0, maxCount = 0;
    counts.forEach((count, day) => {
      if (count > maxCount) { maxCount = count; maxDay = day; }
    });
    return maxDay;
  } else {
    // Return day of month
    const days = dates.map(d => d.getDate());
    const counts = new Map<number, number>();
    days.forEach(d => counts.set(d, (counts.get(d) || 0) + 1));
    let maxDay = 1, maxCount = 0;
    counts.forEach((count, day) => {
      if (count > maxCount) { maxCount = count; maxDay = day; }
    });
    return maxDay;
  }
}

// =============================================================================
// MAIN DETECTION FUNCTION
// =============================================================================

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
    groups.set(recipientName, [...existing, transaction]);
  }

  return groups;
}

/**
 * Detect potential subscriptions from a list of transactions
 * Uses enhanced algorithm with frequency detection and confidence scoring
 */
export function detectSubscriptions(
  transactions: Transaction[],
  minConfidence: number = MIN_CONFIDENCE
): DetectedSubscription[] {
  const groups = groupByRecipient(transactions);
  const detected: DetectedSubscription[] = [];

  for (const [recipientName, txns] of groups) {
    // Sort by date
    const sorted = [...txns].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate gaps between transactions
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(daysBetween(sorted[i - 1].date, sorted[i].date));
    }

    // Detect frequency
    const frequencyAnalysis = detectFrequency(gaps);
    if (!frequencyAnalysis.frequency) continue;

    // Check minimum occurrences for detected frequency
    if (sorted.length < frequencyAnalysis.frequency.minOccurrences) continue;

    // Analyze amounts
    const amounts = sorted.map(t => t.amount);
    const amountAnalysis = analyzeAmounts(amounts);

    // Check if enough amounts match
    const minMatches = Math.ceil(sorted.length / 2);
    if (amountAnalysis.matchingCount < minMatches) continue;

    // Calculate confidence
    const { score, breakdown } = calculateConfidenceScore(
      amountAnalysis,
      frequencyAnalysis,
      sorted.length,
      sorted.length
    );

    // Skip if below minimum confidence
    if (score < minConfidence) continue;

    const absAmounts = amounts.map(a => Math.abs(a));
    const dates = sorted.map(t => t.date);

    // Check if all transactions share the same category
    const categoryIds = new Set(sorted.map(t => t.categoryId));
    const subcategoryIds = new Set(sorted.map(t => t.subcategoryId));

    detected.push({
      id: generateSubscriptionId(recipientName, amountAnalysis.coreAmount),
      recipientName,
      averageAmount: Math.round(amountAnalysis.coreAmount * 100) / 100,
      minAmount: Math.round(Math.min(...absAmounts) * 100) / 100,
      maxAmount: Math.round(Math.max(...absAmounts) * 100) / 100,
      commonDayOfMonth: getExpectedBillingDay(dates, frequencyAnalysis.frequency.name),
      transactionIds: sorted.map(t => t.id),
      occurrenceCount: sorted.length,
      isConfirmed: null,
      recurringType: null,
      categoryId: categoryIds.size === 1 ? sorted[0].categoryId : null,
      subcategoryId: subcategoryIds.size === 1 ? sorted[0].subcategoryId : null,
      firstSeen: sorted[0].date,
      lastSeen: sorted[sorted.length - 1].date,

      // Enhanced fields
      confidence: score,
      confidenceLevel: getConfidenceLevel(score),
      billingFrequency: frequencyAnalysis.frequency.name,
      expectedBillingDay: getExpectedBillingDay(dates, frequencyAnalysis.frequency.name),
      amountVariance: Math.round(amountAnalysis.variance * 10000) / 100, // As percentage
      amountType: amountAnalysis.amountType,
      nextExpectedDate: predictNextDate(sorted[sorted.length - 1].date, frequencyAnalysis.frequency.name),
      scoreBreakdown: breakdown,
    });
  }

  // Sort by confidence (highest first)
  detected.sort((a, b) => b.confidence - a.confidence);

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
    recurringType: detected.recurringType || 'subscription',
    categoryId: detected.categoryId,
    subcategoryId: detected.subcategoryId,
    transactionIds: detected.transactionIds,
    createdAt: new Date(),
    isActive: true,
    // Enhanced fields
    confidence: detected.confidence,
    billingFrequency: detected.billingFrequency,
    amountType: detected.amountType,
    nextExpectedDate: detected.nextExpectedDate,
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
        b => b.type === 'subscription' || b.type === 'fixed'
      );
      const badge: { type: 'subscription' | 'fixed'; label: string } =
        recurringType === 'subscription'
          ? { type: 'subscription', label: 'Subscription' }
          : { type: 'fixed', label: 'Fixed' };
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
      nextExpectedDate: s.nextExpectedDate?.toISOString(),
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
    return parsed.map((s: Subscription & { createdAt: string; nextExpectedDate?: string }) => ({
      ...s,
      createdAt: new Date(s.createdAt),
      nextExpectedDate: s.nextExpectedDate ? new Date(s.nextExpectedDate) : undefined,
    }));
  } catch (e) {
    console.error('Failed to load subscriptions:', e);
    return [];
  }
}

/**
 * Get billing frequency label for display
 */
export function getBillingFrequencyLabel(frequency: BillingFrequency): string {
  const labels: Record<BillingFrequency, string> = {
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annual: 'Annual',
  };
  return labels[frequency];
}

/**
 * Get expected billing day label for display
 */
export function getBillingDayLabel(day: number, frequency: BillingFrequency): string {
  if (frequency === 'weekly' || frequency === 'biweekly') {
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return dayNames[day] || `Day ${day}`;
  }
  return `Day ${day}`;
}

/**
 * Debug function to analyze why specific transactions aren't detected as subscriptions
 * Call this from browser console: debugSubscriptionDetection(transactions, 'BERGNÄS')
 */
export function debugSubscriptionDetection(
  transactions: Transaction[],
  searchTerm: string
): void {
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

    // Sort by date and calculate gaps
    const sorted = [...txns].sort((a, b) => a.date.getTime() - b.date.getTime());
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(daysBetween(sorted[i - 1].date, sorted[i].date));
    }

    // Detect frequency
    const frequencyAnalysis = detectFrequency(gaps);
    if (!frequencyAnalysis.frequency) {
      console.log(`❌ FAIL: No matching frequency pattern found`);
      console.log(`   Gaps: ${gaps.map(g => Math.round(g)).join(', ')} days`);
      console.groupEnd();
      continue;
    }
    console.log(`✅ Frequency: ${frequencyAnalysis.frequency.name} (gap consistency: ${(frequencyAnalysis.gapConsistency * 100).toFixed(1)}%)`);

    // Check min occurrences
    if (sorted.length < frequencyAnalysis.frequency.minOccurrences) {
      console.log(`❌ FAIL: Only ${sorted.length} occurrences (need ${frequencyAnalysis.frequency.minOccurrences} for ${frequencyAnalysis.frequency.name})`);
      console.groupEnd();
      continue;
    }
    console.log(`✅ Occurrences: ${sorted.length} >= ${frequencyAnalysis.frequency.minOccurrences}`);

    // Analyze amounts
    const amounts = sorted.map(t => t.amount);
    const amountAnalysis = analyzeAmounts(amounts);
    const minMatches = Math.ceil(sorted.length / 2);

    if (amountAnalysis.matchingCount < minMatches) {
      console.log(`❌ FAIL: Only ${amountAnalysis.matchingCount} amounts match (need ${minMatches})`);
      console.log(`   Core amount: ${amountAnalysis.coreAmount.toFixed(2)}, Variance: ${(amountAnalysis.variance * 100).toFixed(1)}%`);
      console.groupEnd();
      continue;
    }
    console.log(`✅ Amounts: ${amountAnalysis.matchingCount}/${sorted.length} match (variance: ${(amountAnalysis.variance * 100).toFixed(1)}%)`);

    // Calculate confidence
    const { score, breakdown } = calculateConfidenceScore(
      amountAnalysis,
      frequencyAnalysis,
      sorted.length,
      sorted.length
    );

    if (score < MIN_CONFIDENCE) {
      console.log(`❌ FAIL: Confidence ${score} < ${MIN_CONFIDENCE}`);
      console.log(`   Breakdown: Amount=${breakdown.amountScore}/30, Timing=${breakdown.timingScore}/30, Count=${breakdown.occurrenceScore}/20, Clarity=${breakdown.clarityScore}/20`);
      console.groupEnd();
      continue;
    }

    console.log(`✅ Confidence: ${score}/100 (${getConfidenceLevel(score)})`);
    console.log(`   Breakdown: Amount=${breakdown.amountScore}/30, Timing=${breakdown.timingScore}/30, Count=${breakdown.occurrenceScore}/20, Clarity=${breakdown.clarityScore}/20`);
    console.log(`🎉 This group SHOULD be detected as a subscription!`);

    console.groupEnd();
  }
  console.groupEnd();
  console.groupEnd();
}

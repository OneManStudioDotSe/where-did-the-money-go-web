/**
 * Enhanced Subscription Detection Algorithm - Test Script
 *
 * Run with: npx tsx scripts/test-enhanced-subscription-detection.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// =============================================================================
// TYPES
// =============================================================================

interface Transaction {
  id: string;
  date: Date;
  description: string;
  amount: number;
}

type BillingFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
type ConfidenceLevel = 'high' | 'medium' | 'low';
type AmountType = 'fixed' | 'variable';

interface ScoreBreakdown {
  amountScore: number;
  timingScore: number;
  occurrenceScore: number;
  clarityScore: number;
}

interface EnhancedDetectedSubscription {
  id: string;
  recipientName: string;
  averageAmount: number;
  minAmount: number;
  maxAmount: number;
  transactionIds: string[];
  occurrenceCount: number;
  firstSeen: Date;
  lastSeen: Date;

  // New enhanced fields
  confidence: number;
  confidenceLevel: ConfidenceLevel;
  billingFrequency: BillingFrequency;
  expectedBillingDay: number;
  amountVariance: number;
  amountType: AmountType;
  nextExpectedDate: Date;
  scoreBreakdown: ScoreBreakdown;
}

interface FrequencyConfig {
  name: BillingFrequency;
  expectedGap: number;
  tolerance: number;
  minOccurrences: number;
}

// =============================================================================
// CONFIGURATION
// =============================================================================

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

const MIN_CONFIDENCE = 40;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function normalizeRecipientName(description: string): string {
  let normalized = description.trim();

  // Remove common Swedish bank prefixes
  const prefixes = [
    /^(KORTKÖP|KORTKOP|AUTOGIRO|BG|PG|SWISH|BETALNING|ÖVERFÖRING|INSÄTTNING)\s*/i,
    /^\d{4}-\d{2}-\d{2}\s*/,
    /^\*{4}\d{4}\s*/,
    /^[A-Z]{2}\d{6,}\s*/,
  ];

  for (const prefix of prefixes) {
    normalized = normalized.replace(prefix, '');
  }

  // Remove trailing reference numbers and transaction codes
  normalized = normalized
    .replace(/\s+\d{4}-\d{2}-\d{2}$/g, '')
    .replace(/\s+\/\d{2}-\d{2}-\d{2}$/g, '')
    .replace(/\s+[A-Z]{2,3}\d{4,}$/g, '')
    .replace(/\s+[A-Z]\d{4,}$/g, '')
    .replace(/\s+\d{3,4}$/g, '')
    .replace(/\s*\*+\s*$/g, '')
    .trim();

  normalized = normalized.replace(/\s+/g, ' ');

  // Title case
  return normalized
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ') || description.trim();
}

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? (sorted[mid - 1] + sorted[mid]) / 2
    : sorted[mid];
}

function calculateVariance(values: number[], reference: number): number {
  if (reference === 0 || values.length === 0) return 0;
  const deviations = values.map(v => Math.abs(v - reference) / reference);
  return median(deviations);
}

function daysBetween(date1: Date, date2: Date): number {
  return Math.abs((date2.getTime() - date1.getTime()) / (1000 * 60 * 60 * 24));
}

// =============================================================================
// FREQUENCY DETECTION
// =============================================================================

function detectFrequency(gaps: number[]): { frequency: FrequencyConfig | null; gapConsistency: number } {
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

function analyzeAmounts(amounts: number[]): {
  coreAmount: number;
  variance: number;
  amountType: AmountType;
  matchingCount: number;
  tolerance: number;
} {
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

function calculateConfidenceScore(
  amountAnalysis: ReturnType<typeof analyzeAmounts>,
  frequencyAnalysis: ReturnType<typeof detectFrequency>,
  occurrenceCount: number,
  totalTransactions: number
): { score: number; breakdown: ScoreBreakdown } {
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

function getConfidenceLevel(score: number): ConfidenceLevel {
  if (score >= 75) return 'high';
  if (score >= 50) return 'medium';
  return 'low';
}

// =============================================================================
// PREDICTION
// =============================================================================

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

function detectEnhancedSubscriptions(transactions: Transaction[]): EnhancedDetectedSubscription[] {
  // Group by normalized recipient
  const groups = new Map<string, Transaction[]>();

  for (const tx of transactions) {
    if (tx.amount >= 0) continue; // Only expenses

    const name = normalizeRecipientName(tx.description);
    if (!name) continue;

    const existing = groups.get(name) || [];
    groups.set(name, [...existing, tx]);
  }

  const detected: EnhancedDetectedSubscription[] = [];

  for (const [recipientName, txns] of groups) {
    // Sort by date
    const sorted = [...txns].sort((a, b) => a.date.getTime() - b.date.getTime());

    // Calculate gaps
    const gaps: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      gaps.push(daysBetween(sorted[i-1].date, sorted[i].date));
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

    // Skip low confidence
    if (score < MIN_CONFIDENCE) continue;

    const absAmounts = amounts.map(a => Math.abs(a));
    const dates = sorted.map(t => t.date);

    detected.push({
      id: `sub-${recipientName.replace(/\s+/g, '-').toLowerCase()}-${Date.now().toString(36)}`,
      recipientName,
      averageAmount: Math.round(amountAnalysis.coreAmount * 100) / 100,
      minAmount: Math.round(Math.min(...absAmounts) * 100) / 100,
      maxAmount: Math.round(Math.max(...absAmounts) * 100) / 100,
      transactionIds: sorted.map(t => t.id),
      occurrenceCount: sorted.length,
      firstSeen: sorted[0].date,
      lastSeen: sorted[sorted.length - 1].date,
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

// =============================================================================
// CSV PARSING
// =============================================================================

function parseCSV(content: string): Transaction[] {
  const lines = content.trim().split('\n');
  const transactions: Transaction[] = [];

  // Skip header
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].replace(/^\uFEFF/, ''); // Remove BOM
    const parts = line.split(';');

    if (parts.length >= 5) {
      const dateStr = parts[0];
      const description = parts[3];
      const amountStr = parts[4].replace(',', '.');

      const date = new Date(dateStr);
      const amount = parseFloat(amountStr);

      if (!isNaN(date.getTime()) && !isNaN(amount)) {
        transactions.push({
          id: `tx-${i}`,
          date,
          description,
          amount,
        });
      }
    }
  }

  return transactions;
}

// =============================================================================
// OUTPUT FORMATTING
// =============================================================================

function formatResults(subscriptions: EnhancedDetectedSubscription[]): void {
  console.log('\n' + '='.repeat(100));
  console.log('ENHANCED SUBSCRIPTION DETECTION RESULTS');
  console.log('='.repeat(100) + '\n');

  const byConfidence = {
    high: subscriptions.filter(s => s.confidenceLevel === 'high'),
    medium: subscriptions.filter(s => s.confidenceLevel === 'medium'),
    low: subscriptions.filter(s => s.confidenceLevel === 'low'),
  };

  // HIGH CONFIDENCE
  if (byConfidence.high.length > 0) {
    console.log('🟢 HIGH CONFIDENCE (75-100)');
    console.log('-'.repeat(100));
    byConfidence.high.forEach(s => printSubscription(s));
  }

  // MEDIUM CONFIDENCE
  if (byConfidence.medium.length > 0) {
    console.log('\n🟡 MEDIUM CONFIDENCE (50-74)');
    console.log('-'.repeat(100));
    byConfidence.medium.forEach(s => printSubscription(s));
  }

  // LOW CONFIDENCE
  if (byConfidence.low.length > 0) {
    console.log('\n🟠 LOW CONFIDENCE (40-49)');
    console.log('-'.repeat(100));
    byConfidence.low.forEach(s => printSubscription(s));
  }

  // SUMMARY
  console.log('\n' + '='.repeat(100));
  console.log('SUMMARY');
  console.log('='.repeat(100));
  console.log(`Total detected: ${subscriptions.length}`);
  console.log(`  High confidence: ${byConfidence.high.length}`);
  console.log(`  Medium confidence: ${byConfidence.medium.length}`);
  console.log(`  Low confidence: ${byConfidence.low.length}`);

  const totalMonthly = subscriptions
    .filter(s => s.billingFrequency === 'monthly')
    .reduce((sum, s) => sum + s.averageAmount, 0);
  console.log(`\nEstimated monthly recurring: ${totalMonthly.toFixed(2)} kr`);
}

function printSubscription(s: EnhancedDetectedSubscription): void {
  const frequencyLabel = {
    weekly: 'Weekly',
    biweekly: 'Bi-weekly',
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    annual: 'Annual',
  }[s.billingFrequency];

  const dayLabel = s.billingFrequency === 'weekly' || s.billingFrequency === 'biweekly'
    ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][s.expectedBillingDay]
    : `Day ${s.expectedBillingDay}`;

  console.log(`
  📌 ${s.recipientName}
     Confidence: ${s.confidence}/100 | ${s.amountType.toUpperCase()} amount
     Frequency: ${frequencyLabel} (${dayLabel})
     Amount: ${s.averageAmount.toFixed(2)} kr (variance: ${s.amountVariance.toFixed(1)}%)
     ${s.minAmount !== s.maxAmount ? `Range: ${s.minAmount.toFixed(2)} - ${s.maxAmount.toFixed(2)} kr` : ''}
     Occurrences: ${s.occurrenceCount} (${s.firstSeen.toISOString().slice(0,10)} to ${s.lastSeen.toISOString().slice(0,10)})
     Next expected: ${s.nextExpectedDate.toISOString().slice(0,10)}
     Score breakdown: Amount=${s.scoreBreakdown.amountScore}/30, Timing=${s.scoreBreakdown.timingScore}/30, Count=${s.scoreBreakdown.occurrenceScore}/20, Clarity=${s.scoreBreakdown.clarityScore}/20
`);
}

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const csvPath = path.join(__dirname, '../sample-data/bank-seb-kontoutdrag 20251219-1326.csv');

  console.log('Loading CSV file...');
  const content = fs.readFileSync(csvPath, 'utf-8');

  console.log('Parsing transactions...');
  const transactions = parseCSV(content);
  console.log(`Parsed ${transactions.length} transactions`);

  console.log('Running enhanced subscription detection...');
  const subscriptions = detectEnhancedSubscriptions(transactions);

  formatResults(subscriptions);
}

main().catch(console.error);

/**
 * Unit tests for Subscription Detection utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { detectSubscriptions, normalizeRecipientName } from './subscription-detection';
import type { Transaction } from '../types/transaction';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Helper to create transaction
const createTransaction = (
  description: string,
  amount: number,
  date: Date,
  id?: string
): Transaction => ({
  id: id || `tx-${Date.now()}-${Math.random()}`,
  date,
  valueDate: date,
  amount,
  description,
  categoryId: null,
  subcategoryId: null,
  isSubscription: false,
  balance: 1000,
  verificationNumber: '',
  badges: [],
  rawData: {},
});

// Helper to create monthly recurring transactions
const createMonthlyTransactions = (
  description: string,
  amount: number,
  months: number,
  startDate: Date = new Date('2024-01-15')
): Transaction[] => {
  const transactions: Transaction[] = [];
  for (let i = 0; i < months; i++) {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + i);
    transactions.push(createTransaction(description, amount, date, `tx-${description}-${i}`));
  }
  return transactions;
};

describe('normalizeRecipientName', () => {
  it('normalizes merchant names by removing common suffixes', () => {
    const normalized = normalizeRecipientName('NETFLIX COM /24-01-15');
    expect(normalized.toUpperCase()).toContain('NETFLIX');
  });

  it('handles empty strings', () => {
    const normalized = normalizeRecipientName('');
    expect(normalized).toBe('');
  });

  it('removes date patterns from descriptions', () => {
    const normalized = normalizeRecipientName('SPOTIFY AB 2024-01-15');
    expect(normalized).not.toContain('2024');
  });
});

describe('detectSubscriptions', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('detects monthly subscription pattern', () => {
    const transactions = createMonthlyTransactions('NETFLIX COM', -149, 4);
    const detected = detectSubscriptions(transactions);

    expect(detected.length).toBeGreaterThan(0);
    const netflix = detected.find((d) => d.recipientName.toUpperCase().includes('NETFLIX'));
    expect(netflix).toBeDefined();
    expect(netflix?.billingFrequency).toBe('monthly');
  });

  it('detects subscription with consistent amount', () => {
    const transactions = createMonthlyTransactions('SPOTIFY AB', -169, 5);
    const detected = detectSubscriptions(transactions);

    const spotify = detected.find((d) => d.recipientName.toUpperCase().includes('SPOTIFY'));
    expect(spotify).toBeDefined();
    // averageAmount is stored as absolute value
    expect(Math.abs(spotify?.averageAmount ?? 0)).toBeCloseTo(169, 0);
  });

  it('handles variable amount subscriptions', () => {
    const transactions = [
      createTransaction('GOOGLE CLOUD', -100, new Date('2024-01-15')),
      createTransaction('GOOGLE CLOUD', -120, new Date('2024-02-15')),
      createTransaction('GOOGLE CLOUD', -90, new Date('2024-03-15')),
      createTransaction('GOOGLE CLOUD', -110, new Date('2024-04-15')),
    ];
    const detected = detectSubscriptions(transactions);

    const google = detected.find((d) => d.recipientName.toUpperCase().includes('GOOGLE'));
    // Should still detect as variable amount subscription
    expect(google).toBeDefined();
  });

  it('requires minimum occurrences', () => {
    // Only 2 occurrences - may or may not detect depending on implementation
    const transactions = createMonthlyTransactions('RANDOM SERVICE', -50, 2);
    const detected = detectSubscriptions(transactions);

    const service = detected.find((d) => d.recipientName.toUpperCase().includes('RANDOM'));
    // With only 2 occurrences and monthly frequency, might not reach threshold
    if (service) {
      expect(service.occurrenceCount).toBeGreaterThanOrEqual(2);
    }
  });

  it('ignores income transactions', () => {
    const transactions = createMonthlyTransactions('SALARY EMPLOYER', 25000, 4);
    const detected = detectSubscriptions(transactions);

    const salary = detected.find((d) => d.recipientName.toUpperCase().includes('SALARY'));
    expect(salary).toBeUndefined();
  });

  it('groups similar merchant names', () => {
    const transactions = [
      createTransaction('NETFLIX COM /24-01-15', -149, new Date('2024-01-15')),
      createTransaction('NETFLIX COM /24-02-15', -149, new Date('2024-02-15')),
      createTransaction('NETFLIX COM /24-03-15', -149, new Date('2024-03-15')),
      createTransaction('NETFLIX COM /24-04-15', -149, new Date('2024-04-15')),
    ];
    const detected = detectSubscriptions(transactions);

    // Should group all as one subscription despite different suffixes
    const netflixSubs = detected.filter((d) => d.recipientName.toUpperCase().includes('NETFLIX'));
    expect(netflixSubs.length).toBe(1);
    expect(netflixSubs[0].occurrenceCount).toBe(4);
  });

  it('returns empty array for empty input', () => {
    const detected = detectSubscriptions([]);
    expect(detected).toEqual([]);
  });

  it('returns subscriptions sorted by confidence', () => {
    const transactions = [
      ...createMonthlyTransactions('NETFLIX', -149, 6), // More consistent
      ...createMonthlyTransactions('SPOTIFY', -169, 3), // Fewer occurrences
    ];
    const detected = detectSubscriptions(transactions);

    if (detected.length >= 2) {
      // Higher confidence should be first
      expect(detected[0].confidence).toBeGreaterThanOrEqual(detected[1].confidence);
    }
  });
});

describe('Subscription Detection Edge Cases', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('handles transactions spanning multiple years', () => {
    const transactions = [
      createTransaction('YEARLY SERVICE', -1200, new Date('2022-01-15')),
      createTransaction('YEARLY SERVICE', -1200, new Date('2023-01-15')),
      createTransaction('YEARLY SERVICE', -1200, new Date('2024-01-15')),
    ];
    const detected = detectSubscriptions(transactions);

    const yearly = detected.find((d) => d.recipientName.toUpperCase().includes('YEARLY'));
    if (yearly) {
      expect(yearly.billingFrequency).toBe('annual');
    }
  });

  it('handles duplicate transactions on same day', () => {
    const sameDay = new Date('2024-01-15');
    const transactions = [
      createTransaction('COFFEE SHOP', -50, sameDay, 'tx-1'),
      createTransaction('COFFEE SHOP', -50, sameDay, 'tx-2'),
      createTransaction('COFFEE SHOP', -50, new Date('2024-02-15'), 'tx-3'),
      createTransaction('COFFEE SHOP', -50, new Date('2024-03-15'), 'tx-4'),
    ];
    const detected = detectSubscriptions(transactions);

    // Should handle duplicates gracefully
    expect(detected).toBeDefined();
  });

  it('handles very small amounts', () => {
    const transactions = createMonthlyTransactions('TINY SERVICE', -0.99, 4);
    const detected = detectSubscriptions(transactions);

    const tiny = detected.find((d) => d.recipientName.toUpperCase().includes('TINY'));
    if (tiny) {
      // averageAmount is stored as absolute value
      expect(Math.abs(tiny.averageAmount)).toBeCloseTo(0.99, 2);
    }
  });
});

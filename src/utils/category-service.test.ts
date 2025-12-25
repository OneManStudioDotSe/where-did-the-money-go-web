/**
 * Unit tests for Category Service utilities
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getCategoryName,
  getSubcategoryName,
  getCategoryColor,
  getCategoryIcon,
  findCategory,
  categorizeTransaction,
  categorizeTransactions,
  getCategoryOptions,
} from './category-service';
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

describe('Category Name Lookups', () => {
  it('returns category name for valid category ID', () => {
    const name = getCategoryName('food_dining');
    expect(name).toBe('Food & Dining');
  });

  it('returns Unknown for invalid category ID', () => {
    const name = getCategoryName('invalid-id');
    expect(name).toBe('Unknown');
  });

  it('returns Uncategorized for null category ID', () => {
    const name = getCategoryName(null);
    expect(name).toBe('Uncategorized');
  });
});

describe('Subcategory Name Lookups', () => {
  it('returns subcategory name for valid IDs', () => {
    const name = getSubcategoryName('groceries', 'supermarket');
    expect(name).toBe('Supermarket');
  });

  it('returns empty string for invalid subcategory ID', () => {
    const name = getSubcategoryName('groceries', 'invalid-sub');
    expect(name).toBe('');
  });

  it('returns empty string for invalid category ID', () => {
    const name = getSubcategoryName('invalid-cat', 'supermarket');
    expect(name).toBe('');
  });

  it('returns empty string for null category ID', () => {
    const name = getSubcategoryName(null, 'supermarket');
    expect(name).toBe('');
  });
});

describe('Category Color Lookups', () => {
  it('returns color for valid category ID', () => {
    const color = getCategoryColor('food_dining');
    expect(color).toMatch(/^#[0-9a-fA-F]{6}$/);
  });

  it('returns default color for invalid category ID', () => {
    const color = getCategoryColor('invalid-id');
    expect(color).toBe('#6b7280');
  });

  it('returns default color for null category ID', () => {
    const color = getCategoryColor(null);
    expect(color).toBe('#6b7280');
  });
});

describe('Category Icon Lookups', () => {
  it('returns icon for valid category ID', () => {
    const icon = getCategoryIcon('food_dining');
    expect(icon).toBeDefined();
    expect(typeof icon).toBe('string');
  });

  it('returns default icon for invalid category ID', () => {
    const icon = getCategoryIcon('invalid-id');
    expect(icon).toBe('📦');
  });

  it('returns default icon for null category ID', () => {
    const icon = getCategoryIcon(null);
    expect(icon).toBe('📦');
  });
});

describe('findCategory', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('matches Netflix to entertainment (streaming)', () => {
    const result = findCategory('NETFLIX COM');
    expect(result).not.toBeNull();
    expect(result?.categoryId).toBe('entertainment');
    expect(result?.subcategoryId).toBe('streaming');
  });

  it('matches grocery stores to groceries category', () => {
    const result = findCategory('ICA MAXI STOCKHOLM');
    expect(result).not.toBeNull();
    expect(result?.categoryId).toBe('groceries');
  });

  it('matches case-insensitively', () => {
    const result = findCategory('netflix com');
    expect(result).not.toBeNull();
    expect(result?.categoryId).toBe('entertainment');
  });

  it('returns null for unknown description', () => {
    const result = findCategory('UNKNOWN MERCHANT XYZ123 RANDOM');
    expect(result).toBeNull();
  });
});

describe('categorizeTransaction', () => {
  const createTransaction = (description: string, amount: number = -100): Transaction => ({
    id: 'test-1',
    date: new Date('2024-01-01'),
    valueDate: new Date('2024-01-01'),
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

  beforeEach(() => {
    localStorageMock.clear();
  });

  it('categorizes transaction based on description', () => {
    const transaction = createTransaction('SPOTIFY AB');
    const categorized = categorizeTransaction(transaction);

    expect(categorized.categoryId).toBe('entertainment');
    expect(categorized.subcategoryId).toBe('streaming');
  });

  it('leaves categoryId null when no match found', () => {
    const transaction = createTransaction('RANDOM UNKNOWN MERCHANT XYZ');
    const categorized = categorizeTransaction(transaction);

    expect(categorized.categoryId).toBeNull();
  });

  it('preserves existing transaction data', () => {
    const transaction = createTransaction('SPOTIFY AB');
    transaction.balance = 5000;
    const categorized = categorizeTransaction(transaction);

    expect(categorized.balance).toBe(5000);
    expect(categorized.id).toBe('test-1');
  });
});

describe('categorizeTransactions', () => {
  const createTransactions = (): Transaction[] => [
    {
      id: 'tx-1',
      date: new Date('2024-01-01'),
      valueDate: new Date('2024-01-01'),
      amount: -149,
      description: 'NETFLIX COM',
      categoryId: null,
      subcategoryId: null,
      isSubscription: false,
      balance: 1000,
      verificationNumber: '',
      badges: [],
      rawData: {},
    },
    {
      id: 'tx-2',
      date: new Date('2024-01-02'),
      valueDate: new Date('2024-01-02'),
      amount: -500,
      description: 'ICA MAXI',
      categoryId: null,
      subcategoryId: null,
      isSubscription: false,
      balance: 500,
      verificationNumber: '',
      badges: [],
      rawData: {},
    },
    {
      id: 'tx-3',
      date: new Date('2024-01-03'),
      valueDate: new Date('2024-01-03'),
      amount: -100,
      description: 'UNKNOWN STORE XYZ123',
      categoryId: null,
      subcategoryId: null,
      isSubscription: false,
      balance: 400,
      verificationNumber: '',
      badges: [],
      rawData: {},
    },
  ];

  beforeEach(() => {
    localStorageMock.clear();
  });

  it('categorizes multiple transactions', () => {
    const transactions = createTransactions();
    const categorized = categorizeTransactions(transactions);

    expect(categorized).toHaveLength(3);
    expect(categorized[0].categoryId).toBe('entertainment'); // Netflix -> entertainment/streaming
    expect(categorized[1].categoryId).toBe('groceries');
    expect(categorized[2].categoryId).toBeNull();
  });

  it('returns new array without modifying original', () => {
    const transactions = createTransactions();
    const categorized = categorizeTransactions(transactions);

    expect(categorized).not.toBe(transactions);
    expect(transactions[0].categoryId).toBeNull();
  });
});

describe('getCategoryOptions', () => {
  it('returns options for all categories', () => {
    const options = getCategoryOptions();

    expect(Array.isArray(options)).toBe(true);
    expect(options.length).toBeGreaterThan(0);
    expect(options[0]).toHaveProperty('categoryId');
    expect(options[0]).toHaveProperty('categoryName');
    expect(options[0]).toHaveProperty('subcategoryId');
    expect(options[0]).toHaveProperty('subcategoryName');
    expect(options[0]).toHaveProperty('color');
  });

  it('includes fullPath property', () => {
    const options = getCategoryOptions();

    expect(options[0]).toHaveProperty('fullPath');
    expect(options[0].fullPath).toContain('>');
  });
});

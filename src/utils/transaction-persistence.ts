import type { Transaction } from '../types/transaction';

const TRANSACTIONS_STORAGE_KEY = 'wdtmg_transactions';
const METADATA_STORAGE_KEY = 'wdtmg_transactions_meta';

interface TransactionMetadata {
  fileName: string | null;
  isDemoMode: boolean;
  savedAt: string;
  count: number;
}

/**
 * Save transactions to localStorage
 */
export function saveTransactions(transactions: Transaction[], fileName: string | null, isDemoMode: boolean): void {
  try {
    // Serialize transactions - Date objects need to be converted
    const serializable = transactions.map(t => ({
      ...t,
      date: t.date.toISOString(),
    }));

    localStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(serializable));

    // Save metadata
    const metadata: TransactionMetadata = {
      fileName,
      isDemoMode,
      savedAt: new Date().toISOString(),
      count: transactions.length,
    };
    localStorage.setItem(METADATA_STORAGE_KEY, JSON.stringify(metadata));
  } catch (error) {
    console.error('Failed to save transactions to localStorage:', error);
  }
}

/**
 * Load transactions from localStorage
 */
export function loadTransactions(): { transactions: Transaction[]; metadata: TransactionMetadata | null } {
  try {
    const stored = localStorage.getItem(TRANSACTIONS_STORAGE_KEY);
    const metaStored = localStorage.getItem(METADATA_STORAGE_KEY);

    if (!stored) {
      return { transactions: [], metadata: null };
    }

    const parsed = JSON.parse(stored);

    // Convert date strings back to Date objects
    const transactions: Transaction[] = parsed.map((t: Record<string, unknown>) => ({
      ...t,
      date: new Date(t.date as string),
    }));

    const metadata: TransactionMetadata | null = metaStored ? JSON.parse(metaStored) : null;

    return { transactions, metadata };
  } catch (error) {
    console.error('Failed to load transactions from localStorage:', error);
    return { transactions: [], metadata: null };
  }
}

/**
 * Clear transactions from localStorage
 */
export function clearTransactions(): void {
  try {
    localStorage.removeItem(TRANSACTIONS_STORAGE_KEY);
    localStorage.removeItem(METADATA_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear transactions from localStorage:', error);
  }
}

/**
 * Check if there are saved transactions
 */
export function hasSavedTransactions(): boolean {
  return localStorage.getItem(TRANSACTIONS_STORAGE_KEY) !== null;
}

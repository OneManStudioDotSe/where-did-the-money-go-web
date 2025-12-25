/**
 * CSV Parser Web Worker
 * Offloads heavy CSV parsing to a background thread
 */

import type { CsvConfig, CsvParseResult, CsvParseError, ColumnMapping, BankId } from '../types/csv';
import type { Transaction, TransactionBadge } from '../types/transaction';
import { DEFAULT_CSV_CONFIG } from '../types/csv';

// Message types
export type WorkerMessage =
  | { type: 'PARSE_CSV'; payload: { content: string; config: CsvConfig } }
  | { type: 'CONVERT_TRANSACTIONS'; payload: { result: CsvParseResult; mapping: ColumnMapping; bank: BankId | null } };

export type WorkerResponse =
  | { type: 'PARSE_CSV_SUCCESS'; payload: CsvParseResult }
  | { type: 'PARSE_CSV_ERROR'; payload: CsvParseError }
  | { type: 'CONVERT_TRANSACTIONS_SUCCESS'; payload: Transaction[] }
  | { type: 'CONVERT_TRANSACTIONS_ERROR'; payload: { message: string } };

/**
 * Remove BOM (Byte Order Mark) from the beginning of a string
 */
function removeBOM(text: string): string {
  if (text.charCodeAt(0) === 0xfeff) {
    return text.slice(1);
  }
  return text;
}

/**
 * Parse a CSV string into rows and columns
 */
function parseCSV(content: string, config: CsvConfig): CsvParseResult | CsvParseError {
  const cleanContent = removeBOM(content.trim());

  if (!cleanContent) {
    return {
      type: 'empty_file',
      message: 'The file is empty',
    };
  }

  const lines = cleanContent.split(/\r?\n/).filter((line) => line.trim());

  if (lines.length === 0) {
    return {
      type: 'empty_file',
      message: 'No data rows found in the file',
    };
  }

  const parseRow = (line: string): string[] => {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === config.delimiter && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());

    return values;
  };

  const headers = config.hasHeader ? parseRow(lines[0]) : [];
  const dataLines = config.hasHeader ? lines.slice(1) : lines;
  const rows = dataLines.map(parseRow);

  // Validate consistent column count
  const expectedColumns = headers.length || rows[0]?.length || 0;
  const invalidRows = rows.filter((row) => row.length !== expectedColumns);

  if (invalidRows.length > rows.length * 0.1) {
    return {
      type: 'invalid_format',
      message: 'Too many rows have inconsistent column counts',
      details: `Expected ${expectedColumns} columns, but ${invalidRows.length} rows have different counts`,
    };
  }

  return {
    headers,
    rows,
    rowCount: rows.length,
    config,
  };
}

/**
 * Parse amount string to number
 */
function parseAmount(value: string): number {
  if (!value || value.trim() === '') {
    return 0;
  }

  let cleaned = value.trim();

  // Detect German/European format (1.234,56) vs US format (1,234.56)
  const hasGermanFormat = /^\-?\d{1,3}(\.\d{3})*,\d{2}$/.test(cleaned);
  const hasUSFormat = /^\-?\d{1,3}(,\d{3})*\.\d{2}$/.test(cleaned);

  if (hasGermanFormat) {
    // German format: 1.234,56 -> 1234.56
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (hasUSFormat) {
    // US format: 1,234.56 -> 1234.56
    cleaned = cleaned.replace(/,/g, '');
  } else {
    // Default: Replace comma with dot and remove spaces/currency symbols
    cleaned = cleaned.replace(/[^\d,.\-]/g, '').replace(',', '.');
  }

  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse date string to Date object
 */
function parseDate(value: string): Date | null {
  if (!value || value.trim() === '') {
    return null;
  }

  const cleaned = value.trim();

  // Try ISO format (YYYY-MM-DD)
  const isoMatch = cleaned.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const date = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    if (!isNaN(date.getTime())) return date;
  }

  // Try European format (DD/MM/YYYY or DD.MM.YYYY)
  const euroMatch = cleaned.match(/^(\d{1,2})[\/\.](\d{1,2})[\/\.](\d{4})/);
  if (euroMatch) {
    const date = new Date(parseInt(euroMatch[3]), parseInt(euroMatch[2]) - 1, parseInt(euroMatch[1]));
    if (!isNaN(date.getTime())) return date;
  }

  // Try US format (MM/DD/YYYY)
  const usMatch = cleaned.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (usMatch) {
    const date = new Date(parseInt(usMatch[3]), parseInt(usMatch[1]) - 1, parseInt(usMatch[2]));
    if (!isNaN(date.getTime())) return date;
  }

  // Fallback: try native Date parsing
  const fallback = new Date(cleaned);
  if (!isNaN(fallback.getTime())) return fallback;

  return null;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Apply bank-specific transformations to clean up descriptions
 */
function applyBankTransformations(description: string, bank: BankId | null): string {
  if (!description) return description;

  let cleaned = description.trim();

  // Common transformations for all banks
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');

  // Bank-specific transformations
  if (bank === 'seb') {
    // SEB: Remove date suffixes like "/25-12-18"
    cleaned = cleaned.replace(/\/\d{2}-\d{2}-\d{2}\s*$/, '');
    // Remove "K*" prefix (Klarna)
    if (cleaned.startsWith('K*')) {
      cleaned = cleaned.substring(2).trim();
    }
  }

  if (bank === 'swedbank') {
    // Swedbank-specific cleanups
    cleaned = cleaned.replace(/\s*\(\d+\)\s*$/, ''); // Remove trailing (numbers)
  }

  // General cleanups for all banks
  // Remove common payment provider prefixes
  const prefixPatterns = [
    /^ZETTLE\s*\*/i,
    /^IZETTLE\s*\*/i,
    /^PAYPAL\s*\*/i,
    /^SQ\s*\*/i,
    /^STRIPE\s*\*/i,
  ];

  for (const pattern of prefixPatterns) {
    cleaned = cleaned.replace(pattern, '');
  }

  return cleaned.trim();
}

/**
 * Convert parsed CSV to Transaction objects
 */
function convertToTransactions(
  result: CsvParseResult,
  mapping: ColumnMapping,
  bank: BankId | null
): Transaction[] {
  const transactions: Transaction[] = [];

  for (const row of result.rows) {
    // Safely get column values with type guards
    const dateCol = mapping.dateColumn;
    const amountCol = mapping.amountColumn;
    const descCol = mapping.descriptionColumn;
    const balanceCol = mapping.balanceColumn;

    const dateStr = typeof dateCol === 'number' ? row[dateCol] ?? '' : '';
    const amountStr = typeof amountCol === 'number' ? row[amountCol] ?? '' : '';
    const description = typeof descCol === 'number' ? row[descCol] ?? '' : '';
    const balanceStr = typeof balanceCol === 'number' ? row[balanceCol] ?? '' : '';

    const date = parseDate(dateStr);
    const amount = parseAmount(amountStr);
    const balance = balanceStr ? parseAmount(balanceStr) : undefined;

    // Skip rows without valid date or amount
    if (!date || amount === 0) continue;

    const cleanedDescription = applyBankTransformations(description, bank);

    // Determine badges
    const badges: TransactionBadge[] = [];
    if (amount > 0) {
      badges.push({ type: 'income', label: 'Income' });
    }
    if (amount < -5000) {
      badges.push({ type: 'high_value', label: 'High Value' });
    }

    transactions.push({
      id: generateId(),
      date,
      valueDate: date, // Use same as date if not provided
      description: cleanedDescription,
      amount,
      balance: balance ?? 0,
      verificationNumber: '',
      categoryId: null,
      subcategoryId: null,
      isSubscription: false,
      badges,
      rawData: {
        originalDescription: description,
        originalAmount: amountStr,
        originalDate: dateStr,
      },
    });
  }

  // Sort by date (newest first)
  transactions.sort((a, b) => b.date.getTime() - a.date.getTime());

  return transactions;
}

// Handle messages from main thread
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;

  switch (type) {
    case 'PARSE_CSV': {
      const result = parseCSV(payload.content, payload.config);
      if ('type' in result && (result.type === 'empty_file' || result.type === 'invalid_format')) {
        self.postMessage({ type: 'PARSE_CSV_ERROR', payload: result } as WorkerResponse);
      } else {
        self.postMessage({ type: 'PARSE_CSV_SUCCESS', payload: result } as WorkerResponse);
      }
      break;
    }

    case 'CONVERT_TRANSACTIONS': {
      try {
        const transactions = convertToTransactions(
          payload.result,
          payload.mapping,
          payload.bank
        );
        self.postMessage({ type: 'CONVERT_TRANSACTIONS_SUCCESS', payload: transactions } as WorkerResponse);
      } catch (error) {
        self.postMessage({
          type: 'CONVERT_TRANSACTIONS_ERROR',
          payload: { message: error instanceof Error ? error.message : 'Unknown error' }
        } as WorkerResponse);
      }
      break;
    }
  }
};

// Suppress unused variable warning for DEFAULT_CSV_CONFIG
void DEFAULT_CSV_CONFIG;

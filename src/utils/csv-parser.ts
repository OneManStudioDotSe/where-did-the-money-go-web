import type {
  CsvConfig,
  CsvParseResult,
  CsvParseError,
  ColumnMapping,
  ColumnAnalysis,
  ColumnType,
  BankId,
} from '../types/csv';
import type { Transaction, RawTransaction, TransactionBadge } from '../types/transaction';
import { DEFAULT_CSV_CONFIG, BANK_CONFIGS } from '../types/csv';

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
export function parseCSV(
  content: string,
  config: CsvConfig = DEFAULT_CSV_CONFIG
): CsvParseResult | CsvParseError {
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
 * Detect the type of a column based on its values
 */
function detectColumnType(values: string[]): { type: ColumnType; confidence: number } {
  const nonEmpty = values.filter((v) => v.trim());
  if (nonEmpty.length === 0) return { type: 'unknown', confidence: 0 };

  // Date detection (YYYY-MM-DD)
  const datePattern = /^\d{4}-\d{2}-\d{2}$/;
  const dateMatches = nonEmpty.filter((v) => datePattern.test(v.trim())).length;
  if (dateMatches / nonEmpty.length > 0.9) {
    return { type: 'date', confidence: dateMatches / nonEmpty.length };
  }

  // Amount/Balance detection (numeric with possible negative)
  const numericPattern = /^-?\d+([.,]\d+)?$/;
  const numericMatches = nonEmpty.filter((v) => numericPattern.test(v.trim())).length;
  if (numericMatches / nonEmpty.length > 0.9) {
    // Check for negative values to distinguish amount from balance
    const hasNegatives = nonEmpty.some((v) => v.trim().startsWith('-'));
    const avgAbsValue =
      nonEmpty.reduce((sum, v) => {
        const num = parseFloat(v.replace(',', '.'));
        return sum + (isNaN(num) ? 0 : Math.abs(num));
      }, 0) / nonEmpty.length;

    // Balance values tend to be larger and more varied
    if (hasNegatives) {
      return { type: 'amount', confidence: numericMatches / nonEmpty.length };
    }
    return { type: avgAbsValue > 1000 ? 'balance' : 'amount', confidence: 0.7 };
  }

  // Verification number (numeric string, no decimals)
  const verificationPattern = /^\d{8,}$/;
  const verificationMatches = nonEmpty.filter((v) => verificationPattern.test(v.trim())).length;
  if (verificationMatches / nonEmpty.length > 0.8) {
    return { type: 'verification', confidence: verificationMatches / nonEmpty.length };
  }

  // Default to description for text columns
  const avgLength = nonEmpty.reduce((sum, v) => sum + v.length, 0) / nonEmpty.length;
  if (avgLength > 5) {
    return { type: 'description', confidence: 0.6 };
  }

  return { type: 'unknown', confidence: 0 };
}

/**
 * Analyze columns and suggest mappings
 */
export function analyzeColumns(result: CsvParseResult): ColumnAnalysis[] {
  const { headers, rows } = result;
  const analyses: ColumnAnalysis[] = [];

  const columnCount = headers.length || rows[0]?.length || 0;

  for (let i = 0; i < columnCount; i++) {
    const columnName = headers[i] || `Column ${i + 1}`;
    const sampleValues = rows.slice(0, 10).map((row) => row[i] || '');
    const allValues = rows.map((row) => row[i] || '');

    const { type, confidence } = detectColumnType(allValues);

    // Boost confidence based on Swedish header names
    let adjustedType = type;
    let adjustedConfidence = confidence;

    const lowerHeader = columnName.toLowerCase();
    if (lowerHeader.includes('datum') || lowerHeader.includes('date')) {
      if (type === 'date') adjustedConfidence = Math.max(adjustedConfidence, 0.95);
    }
    if (lowerHeader.includes('belopp') || lowerHeader.includes('amount')) {
      adjustedType = 'amount';
      adjustedConfidence = Math.max(adjustedConfidence, 0.95);
    }
    if (lowerHeader.includes('saldo') || lowerHeader.includes('balance')) {
      adjustedType = 'balance';
      adjustedConfidence = Math.max(adjustedConfidence, 0.95);
    }
    if (lowerHeader === 'text' || lowerHeader.includes('beskrivning')) {
      adjustedType = 'description';
      adjustedConfidence = Math.max(adjustedConfidence, 0.95);
    }
    if (lowerHeader.includes('verifikation') || lowerHeader.includes('verification')) {
      adjustedType = 'verification';
      adjustedConfidence = Math.max(adjustedConfidence, 0.95);
    }

    analyses.push({
      columnName,
      columnIndex: i,
      sampleValues,
      detectedType: adjustedType,
      confidence: adjustedConfidence,
    });
  }

  return analyses;
}

/**
 * Auto-detect column mappings from analysis
 */
export function autoDetectMappings(analyses: ColumnAnalysis[]): ColumnMapping {
  const mapping: ColumnMapping = {
    dateColumn: null,
    valueDateColumn: null,
    amountColumn: null,
    descriptionColumn: null,
    balanceColumn: null,
    verificationColumn: null,
  };

  // Sort by confidence for each type
  const byType = (type: ColumnType) =>
    analyses
      .filter((a) => a.detectedType === type)
      .sort((a, b) => b.confidence - a.confidence);

  const dates = byType('date');
  if (dates.length >= 1) {
    mapping.dateColumn = dates[0].columnName;
    // Second date column is likely value date
    if (dates.length >= 2) {
      mapping.valueDateColumn = dates[1].columnName;
    }
  }

  const amounts = byType('amount');
  if (amounts.length >= 1) {
    mapping.amountColumn = amounts[0].columnName;
  }

  const descriptions = byType('description');
  if (descriptions.length >= 1) {
    mapping.descriptionColumn = descriptions[0].columnName;
  }

  const balances = byType('balance');
  if (balances.length >= 1) {
    mapping.balanceColumn = balances[0].columnName;
  }

  const verifications = byType('verification');
  if (verifications.length >= 1) {
    mapping.verificationColumn = verifications[0].columnName;
  }

  return mapping;
}

/**
 * Parse amount string to number
 * Handles various formats:
 * - Swedish: "1 234,56" or "1234,56" (space/nothing for thousands, comma for decimal)
 * - US/ISO: "1,234.56" or "1234.56" (comma for thousands, period for decimal)
 * - German: "1.234,56" (period for thousands, comma for decimal)
 */
function parseAmount(value: string, decimalSeparator: string = '.'): number {
  if (!value || !value.trim()) return 0;

  let cleaned = value.trim();

  // Remove currency symbols and whitespace
  cleaned = cleaned.replace(/[^\d.,-]/g, '');

  if (!cleaned) return 0;

  // Detect format based on last separator position
  const lastComma = cleaned.lastIndexOf(',');
  const lastPeriod = cleaned.lastIndexOf('.');

  if (decimalSeparator === ',') {
    // European format: comma is decimal, period is thousands
    // "1.234,56" -> "1234.56"
    cleaned = cleaned.replace(/\./g, ''); // Remove thousands separators
    cleaned = cleaned.replace(',', '.'); // Convert decimal separator
  } else {
    // US/ISO format: period is decimal, comma is thousands
    // "1,234.56" -> "1234.56"
    if (lastComma > lastPeriod) {
      // Format like "1.234,56" - comma is decimal (European in US context)
      cleaned = cleaned.replace(/\./g, '');
      cleaned = cleaned.replace(',', '.');
    } else {
      // Standard US format or no thousands separator
      cleaned = cleaned.replace(/,/g, ''); // Remove thousands separators
    }
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

/**
 * Parse date string to Date object
 * Returns null for invalid dates instead of silently using current date
 */
function parseDate(value: string): Date | null {
  if (!value || !value.trim()) return null;

  const trimmed = value.trim();

  // Try YYYY-MM-DD format (ISO)
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1]);
    const month = parseInt(isoMatch[2]) - 1;
    const day = parseInt(isoMatch[3]);
    // Validate the date components
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const date = new Date(year, month, day);
      // Check if date is valid (handles cases like Feb 30)
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
    }
    return null;
  }

  // Try DD/MM/YYYY or DD.MM.YYYY format (European)
  const euroMatch = trimmed.match(/^(\d{2})[./](\d{2})[./](\d{4})$/);
  if (euroMatch) {
    const day = parseInt(euroMatch[1]);
    const month = parseInt(euroMatch[2]) - 1;
    const year = parseInt(euroMatch[3]);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const date = new Date(year, month, day);
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
    }
    return null;
  }

  // Try MM/DD/YYYY format (US)
  const usMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (usMatch) {
    const month = parseInt(usMatch[1]) - 1;
    const day = parseInt(usMatch[2]);
    const year = parseInt(usMatch[3]);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const date = new Date(year, month, day);
      if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
        return date;
      }
    }
    return null;
  }

  // Fallback to Date parsing
  const date = new Date(trimmed);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Generate a unique ID for a transaction
 */
function generateTransactionId(row: Record<string, string>, index: number): string {
  const data = JSON.stringify(row) + index;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return `txn-${Math.abs(hash).toString(36)}`;
}

/**
 * Determine badges for a transaction
 */
function getBadges(amount: number, categoryId: string | null): TransactionBadge[] {
  const badges: TransactionBadge[] = [];

  if (amount > 0) {
    badges.push({ type: 'income', label: 'Income' });
  }

  if (!categoryId) {
    badges.push({ type: 'uncategorized', label: 'Uncategorized' });
  }

  // High value threshold (customize as needed)
  if (Math.abs(amount) > 5000) {
    badges.push({ type: 'high_value', label: 'High Value' });
  }

  return badges;
}

/**
 * Apply bank-specific transformations to description
 */
function applyBankTransformations(description: string, bank: BankId | null): string {
  if (!bank) return description;

  const bankConfig = BANK_CONFIGS[bank];
  if (!bankConfig) return description;

  let result = description;
  let prefixToAdd = '';

  // Apply prefix rules (e.g., SEB Swish detection: 467/123 -> "Swish - ")
  if (bankConfig.prefixRules) {
    for (const rule of bankConfig.prefixRules) {
      if (rule.pattern.test(result)) {
        prefixToAdd = rule.prefix;
        if (rule.removeMatch !== false) {
          result = result.replace(rule.pattern, '');
        }
        break; // Only apply first matching rule
      }
    }
  }

  // Apply regex pattern removals (e.g., Nordea prefixes and suffixes)
  if (bankConfig.removePatterns) {
    for (const pattern of bankConfig.removePatterns) {
      result = result.replace(pattern, '');
    }
    result = result.trim();
  }

  // Trim description at specific character (e.g., SEB "/" character)
  if (bankConfig.trimDescriptionAt) {
    const trimChar = bankConfig.trimDescriptionAt;
    const idx = result.indexOf(trimChar);
    if (idx > 0) {
      result = result.substring(0, idx);
    }
  }

  // Trim whitespace at beginning and end (after all trimming operations)
  result = result.trim();

  // Apply text replacements (e.g., Sl -> SL, Försäkr -> Försäkring)
  if (bankConfig.textReplacements) {
    for (const replacement of bankConfig.textReplacements) {
      if (replacement.matchType === 'exact') {
        // Exact match: the whole string must match the pattern
        const pattern = replacement.pattern instanceof RegExp
          ? replacement.pattern
          : new RegExp(`^${replacement.pattern}$`, 'i');
        if (pattern.test(result)) {
          result = replacement.replacement;
        }
      } else {
        // Contains match (default): replace anywhere in the string
        const pattern = replacement.pattern instanceof RegExp
          ? replacement.pattern
          : new RegExp(replacement.pattern, 'gi');
        result = result.replace(pattern, replacement.replacement);
      }
    }
  }

  // Add the prefix at the end (after all other transformations)
  if (prefixToAdd) {
    result = prefixToAdd + result;
  }

  return result;
}

/**
 * Apply bank-specific transformations to a description (exported for UI preview)
 */
export function applyBankTransform(description: string, bank: BankId): string {
  return applyBankTransformations(description, bank);
}

/**
 * Convert parsed CSV rows to Transaction objects
 */
export function convertToTransactions(
  result: CsvParseResult,
  mapping: ColumnMapping,
  bank: BankId | null = null
): Transaction[] {
  const { headers, rows, config } = result;

  const getColumnIndex = (columnName: string | null): number => {
    if (columnName === null) return -1;
    const index = headers.indexOf(columnName);
    return index;
  };

  const dateIdx = getColumnIndex(mapping.dateColumn);
  const valueDateIdx = getColumnIndex(mapping.valueDateColumn);
  const amountIdx = getColumnIndex(mapping.amountColumn);
  const descIdx = getColumnIndex(mapping.descriptionColumn);
  const balanceIdx = getColumnIndex(mapping.balanceColumn);
  const verificationIdx = getColumnIndex(mapping.verificationColumn);

  if (dateIdx === -1 || amountIdx === -1 || descIdx === -1) {
    console.warn('Missing required columns for transaction conversion');
    return [];
  }

  return rows
    .map((row, index) => {
      const rawData: Record<string, string> = {};
      headers.forEach((header, i) => {
        rawData[header] = row[i] || '';
      });

      const amount = parseAmount(row[amountIdx] || '', config.decimalSeparator);
      const date = parseDate(row[dateIdx] || '');

      // Skip rows with invalid dates
      if (!date) {
        return null;
      }

      const valueDate =
        valueDateIdx !== -1 ? parseDate(row[valueDateIdx] || '') : date;

      // Apply bank-specific transformations to description
      const rawDescription = row[descIdx] || '';
      const description = applyBankTransformations(rawDescription, bank);

      const transaction: Transaction = {
        id: generateTransactionId(rawData, index),
        date,
        valueDate: valueDate || date, // Fallback to main date if value date is invalid
        amount,
        description,
        categoryId: null,
        subcategoryId: null,
        isSubscription: false,
        balance: balanceIdx !== -1 ? parseAmount(row[balanceIdx] || '', config.decimalSeparator) : 0,
        verificationNumber: verificationIdx !== -1 ? row[verificationIdx] || '' : '',
        badges: getBadges(amount, null),
        rawData,
      };
      return transaction;
    })
    .filter((t): t is Transaction => t !== null);
}

/**
 * Parse raw transaction data from Swedish bank format
 */
export function parseSwedishBankCSV(content: string): RawTransaction[] | CsvParseError {
  const result = parseCSV(content, DEFAULT_CSV_CONFIG);

  if ('type' in result) {
    return result; // Return error
  }

  const analyses = analyzeColumns(result);
  const mapping = autoDetectMappings(analyses);

  // Validate we have the minimum required columns
  if (!mapping.dateColumn || !mapping.amountColumn || !mapping.descriptionColumn) {
    return {
      type: 'missing_columns',
      message: 'Could not detect required columns',
      details: `Found: date=${mapping.dateColumn}, amount=${mapping.amountColumn}, description=${mapping.descriptionColumn}`,
    };
  }

  const { headers, rows } = result;
  const dateIdx = headers.indexOf(mapping.dateColumn);
  const valueDateIdx = mapping.valueDateColumn ? headers.indexOf(mapping.valueDateColumn) : -1;
  const amountIdx = headers.indexOf(mapping.amountColumn);
  const descIdx = headers.indexOf(mapping.descriptionColumn);
  const balanceIdx = mapping.balanceColumn ? headers.indexOf(mapping.balanceColumn) : -1;
  const verificationIdx = mapping.verificationColumn
    ? headers.indexOf(mapping.verificationColumn)
    : -1;

  return rows.map((row) => ({
    bookingDate: row[dateIdx] || '',
    valueDate: valueDateIdx !== -1 ? row[valueDateIdx] || '' : row[dateIdx] || '',
    verificationNumber: verificationIdx !== -1 ? row[verificationIdx] || '' : '',
    text: row[descIdx] || '',
    amount: row[amountIdx] || '',
    balance: balanceIdx !== -1 ? row[balanceIdx] || '' : '',
  }));
}

/**
 * Full pipeline: parse CSV content and return Transaction objects
 */
export function parseTransactionsFromCSV(content: string): Transaction[] | CsvParseError {
  const result = parseCSV(content, DEFAULT_CSV_CONFIG);

  if ('type' in result) {
    return result;
  }

  const analyses = analyzeColumns(result);
  const mapping = autoDetectMappings(analyses);

  if (!mapping.dateColumn || !mapping.amountColumn || !mapping.descriptionColumn) {
    return {
      type: 'missing_columns',
      message: 'Could not detect required columns',
      details: `Found: date=${mapping.dateColumn}, amount=${mapping.amountColumn}, description=${mapping.descriptionColumn}`,
    };
  }

  return convertToTransactions(result, mapping);
}

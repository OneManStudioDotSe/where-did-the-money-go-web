/**
 * Swedish bank identifiers
 */
export type BankId = 'seb' | 'swedbank' | 'nordea' | 'handelsbanken' | 'other';

/**
 * Description transformation example for UI preview
 */
export interface DescriptionTransformExample {
  before: string;
  after: string;
}

/**
 * Prefix rule: add a prefix when pattern matches
 */
export interface PrefixRule {
  /** Pattern to match at the start of description */
  pattern: RegExp;
  /** Prefix to add when pattern matches */
  prefix: string;
  /** Whether to remove the matched pattern (default: true) */
  removeMatch?: boolean;
}

export interface TextReplacement {
  /** Pattern to match (can be string or regex) */
  pattern: string | RegExp;
  /** Replacement text */
  replacement: string;
  /** Match type: 'exact' matches whole word, 'contains' matches anywhere */
  matchType?: 'exact' | 'contains';
}

/**
 * Bank-specific configuration
 */
export interface BankConfig {
  id: BankId;
  name: string;
  /** Character to trim description at (e.g., "/" for SEB) */
  trimDescriptionAt?: string;
  /** Regex patterns to remove from descriptions (for complex transformations) */
  removePatterns?: RegExp[];
  /** Rules for adding prefixes based on patterns (e.g., Swish detection) */
  prefixRules?: PrefixRule[];
  /** Text replacements to apply (e.g., expand abbreviations, fix casing) */
  textReplacements?: TextReplacement[];
  /** Default delimiter for this bank's CSV exports */
  defaultDelimiter?: string;
  /** Description of the optimizations applied */
  optimizationDescription?: string;
  /** Example transformations for UI preview */
  examples?: DescriptionTransformExample[];
}

/**
 * Bank configurations for Swedish banks
 */
export const BANK_CONFIGS: Record<BankId, BankConfig> = {
  seb: {
    id: 'seb',
    name: 'SEB',
    trimDescriptionAt: '/',
    // Rules for adding "Swish - " prefix when description starts with 467 or 123
    prefixRules: [
      { pattern: /^467/, prefix: 'Swish - ', removeMatch: false },
      { pattern: /^123/, prefix: 'Swish - ', removeMatch: false },
    ],
    // SEB-specific text replacements to expand abbreviations and fix casing
    textReplacements: [
      // "Sl" should always be "SL" (Stockholm public transit)
      { pattern: /^Sl$/i, replacement: 'SL', matchType: 'exact' },
      // "Försäkr" should be expanded to "Försäkring"
      { pattern: /Försäkr$/i, replacement: 'Försäkring', matchType: 'contains' },
      { pattern: /Gsuit$/i, replacement: 'Gsuite', matchType: 'contains' },
    ],
    optimizationDescription: 'Removes "/" codes, identifies Swish transactions (467, 123), expands abbreviations',
    examples: [
      { before: 'NETFLIX COM /25-12-18', after: 'NETFLIX COM' },
      { before: 'ICA MAXI /24-12-20', after: 'ICA MAXI' },
      { before: '467 JOHN DOE', after: 'Swish - 467 JOHN DOE' },
      { before: '123 JANE DOE', after: 'Swish - 123 JANE DOE' },
      { before: 'SL', after: 'SL' },
      { before: 'Sl', after: 'SL' },
      { before: 'IF FÖRSÄKR', after: 'IF FÖRSÄKRING' },
    ],
  },
  swedbank: {
    id: 'swedbank',
    name: 'Swedbank',
    optimizationDescription: 'Standard parsing with semicolon delimiter',
    examples: [],
  },
  nordea: {
    id: 'nordea',
    name: 'Nordea',
    // Patterns to remove from Nordea descriptions:
    // - "Kortköp YYMMDD " (card purchase with date)
    // - "Swish betalning " (Swish payment)
    // - "Betalning BG XXXX-XXXX " (BG payment)
    // - "Autogiro " (direct debit)
    // - Reference numbers like "F 92526363055"
    removePatterns: [
      /^Kortköp\s+\d{6}\s+/i,       // "Kortköp 250103 " -> removes prefix + date
      /^Swish betalning\s+/i,       // "Swish betalning " -> removes prefix
      /^Betalning BG\s+[\d-]+\s+/i, // "Betalning BG 5572-4959 " -> removes prefix + BG number
      /^Autogiro\s+/i,              // "Autogiro " -> removes prefix
      /\s+F\s+\d+$/i,               // " F 92526363055" -> removes reference suffix
    ],
    optimizationDescription: 'Removes transaction prefixes and reference codes',
    examples: [
      { before: 'Kortköp 250103 NETFLIX.COM', after: 'NETFLIX.COM' },
      { before: 'Kortköp 241227 SL', after: 'SL' },
      { before: 'Swish betalning ADYEN N.V.', after: 'ADYEN N.V.' },
      { before: 'Betalning BG 5572-4959 Telenor', after: 'Telenor' },
      { before: 'Autogiro IF SKADEFÖRS', after: 'IF SKADEFÖRS' },
      { before: 'Barnbidrag F 92526363055', after: 'Barnbidrag' },
    ],
  },
  handelsbanken: {
    id: 'handelsbanken',
    name: 'Handelsbanken',
    optimizationDescription: 'Standard parsing with semicolon delimiter',
    examples: [],
  },
  other: {
    id: 'other',
    name: 'Other / Unknown',
    optimizationDescription: 'Auto-detection of column types and format',
    examples: [],
  },
};

/**
 * Column mapping configuration for CSV parsing
 */
export interface ColumnMapping {
  /** Column name/index for booking date */
  dateColumn: string | null;
  /** Column name/index for value date (optional) */
  valueDateColumn: string | null;
  /** Column name/index for transaction amount */
  amountColumn: string | null;
  /** Column name/index for transaction description */
  descriptionColumn: string | null;
  /** Column name/index for balance (optional) */
  balanceColumn: string | null;
  /** Column name/index for verification number (optional) */
  verificationColumn: string | null;
}

/**
 * Result of column type detection
 */
export interface ColumnAnalysis {
  columnName: string;
  columnIndex: number;
  sampleValues: string[];
  detectedType: ColumnType;
  confidence: number; // 0-1
}

export type ColumnType =
  | 'date'
  | 'amount'
  | 'balance'
  | 'description'
  | 'verification'
  | 'unknown';

/**
 * CSV parsing configuration
 */
export interface CsvConfig {
  delimiter: string;
  hasHeader: boolean;
  encoding: string;
  dateFormat: string;
  decimalSeparator: string;
}

/**
 * Default Swedish bank CSV configuration
 */
export const DEFAULT_CSV_CONFIG: CsvConfig = {
  delimiter: ';',
  hasHeader: true,
  encoding: 'utf-8',
  dateFormat: 'YYYY-MM-DD',
  decimalSeparator: '.',
};

/**
 * Result of CSV parsing
 */
export interface CsvParseResult {
  headers: string[];
  rows: string[][];
  rowCount: number;
  config: CsvConfig;
}

/**
 * Error during CSV parsing
 */
export interface CsvParseError {
  type: 'empty_file' | 'invalid_format' | 'encoding_error' | 'missing_columns';
  message: string;
  details?: string;
}

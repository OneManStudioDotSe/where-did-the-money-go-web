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

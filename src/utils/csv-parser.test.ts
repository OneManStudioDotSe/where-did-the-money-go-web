/**
 * Unit tests for CSV Parser utilities
 */

import { describe, it, expect } from 'vitest';
import { parseCSV, convertToTransactions, analyzeColumns, autoDetectMappings } from './csv-parser';
import type { CsvConfig, CsvParseResult } from '../types/csv';

describe('parseCSV', () => {
  const defaultConfig: CsvConfig = {
    delimiter: ';',
    hasHeader: true,
    encoding: 'utf-8',
    dateFormat: 'iso',
    decimalSeparator: '.',
  };

  it('parses simple CSV with headers', () => {
    const content = 'Date;Description;Amount\n2024-01-01;Test;-100.00';
    const result = parseCSV(content, defaultConfig);

    expect('type' in result).toBe(false);
    if (!('type' in result)) {
      expect(result.headers).toEqual(['Date', 'Description', 'Amount']);
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toEqual(['2024-01-01', 'Test', '-100.00']);
    }
  });

  it('handles quoted fields with delimiters', () => {
    const content = 'Date;Description;Amount\n2024-01-01;"Test;with;semicolons";-100.00';
    const result = parseCSV(content, defaultConfig);

    if (!('type' in result)) {
      expect(result.rows[0][1]).toBe('Test;with;semicolons');
    }
  });

  it('handles escaped quotes in fields', () => {
    const content = 'Date;Description;Amount\n2024-01-01;"Test ""quoted"" text";-100.00';
    const result = parseCSV(content, defaultConfig);

    if (!('type' in result)) {
      expect(result.rows[0][1]).toBe('Test "quoted" text');
    }
  });

  it('returns error for empty file', () => {
    const content = '';
    const result = parseCSV(content, defaultConfig);

    expect('type' in result).toBe(true);
    if ('type' in result) {
      expect(result.type).toBe('empty_file');
    }
  });

  it('removes BOM from UTF-8 content', () => {
    const bomContent = '\uFEFFDate;Description;Amount\n2024-01-01;Test;-100.00';
    const result = parseCSV(bomContent, defaultConfig);

    if (!('type' in result)) {
      expect(result.headers[0]).toBe('Date');
    }
  });

  it('handles Windows line endings', () => {
    const content = 'Date;Description;Amount\r\n2024-01-01;Test1;-100.00\r\n2024-01-02;Test2;-200.00';
    const result = parseCSV(content, defaultConfig);

    if (!('type' in result)) {
      expect(result.rows).toHaveLength(2);
    }
  });

  it('parses CSV without headers', () => {
    const config = { ...defaultConfig, hasHeader: false };
    const content = '2024-01-01;Test;-100.00\n2024-01-02;Test2;-200.00';
    const result = parseCSV(content, config);

    if (!('type' in result)) {
      expect(result.headers).toHaveLength(0);
      expect(result.rows).toHaveLength(2);
    }
  });

  it('uses comma delimiter when specified', () => {
    const config = { ...defaultConfig, delimiter: ',' };
    const content = 'Date,Description,Amount\n2024-01-01,Test,-100.00';
    const result = parseCSV(content, config);

    if (!('type' in result)) {
      expect(result.headers).toEqual(['Date', 'Description', 'Amount']);
    }
  });
});

describe('analyzeColumns', () => {
  const defaultConfig: CsvConfig = {
    delimiter: ';',
    hasHeader: true,
    encoding: 'utf-8',
    dateFormat: 'iso',
    decimalSeparator: '.',
  };

  it('detects date columns', () => {
    const parseResult: CsvParseResult = {
      headers: ['Col1', 'Col2', 'Col3'],
      rows: [
        ['2024-01-01', 'Test', '-100.00'],
        ['2024-01-02', 'Test2', '-200.00'],
      ],
      rowCount: 2,
      config: defaultConfig,
    };
    const analysis = analyzeColumns(parseResult);

    expect(analysis[0].detectedType).toBe('date');
  });

  it('detects amount columns', () => {
    const parseResult: CsvParseResult = {
      headers: ['Col1', 'Col2', 'Col3'],
      rows: [
        ['2024-01-01', 'Test', '-100.00'],
        ['2024-01-02', 'Test2', '-200.00'],
      ],
      rowCount: 2,
      config: defaultConfig,
    };
    const analysis = analyzeColumns(parseResult);

    expect(analysis[2].detectedType).toBe('amount');
  });

  it('detects description columns with Swedish headers', () => {
    const parseResult: CsvParseResult = {
      headers: ['Datum', 'Text', 'Belopp'],
      rows: [
        ['2024-01-01', 'Netflix payment', '-100.00'],
        ['2024-01-02', 'Grocery store', '-200.00'],
      ],
      rowCount: 2,
      config: defaultConfig,
    };
    const analysis = analyzeColumns(parseResult);

    expect(analysis[1].detectedType).toBe('description');
  });
});

describe('autoDetectMappings', () => {
  const defaultConfig: CsvConfig = {
    delimiter: ';',
    hasHeader: true,
    encoding: 'utf-8',
    dateFormat: 'iso',
    decimalSeparator: '.',
  };

  it('maps columns with Swedish headers', () => {
    const parseResult: CsvParseResult = {
      headers: ['Bokföringsdatum', 'Text', 'Belopp', 'Saldo'],
      rows: [['2024-01-01', 'Netflix', '-149.00', '5000.00']],
      rowCount: 1,
      config: defaultConfig,
    };
    const analysis = analyzeColumns(parseResult);
    const mapping = autoDetectMappings(analysis);

    expect(mapping.dateColumn).toBe('Bokföringsdatum');
    expect(mapping.descriptionColumn).toBe('Text');
    expect(mapping.amountColumn).toBe('Belopp');
    expect(mapping.balanceColumn).toBe('Saldo');
  });

  it('maps columns by content analysis', () => {
    const parseResult: CsvParseResult = {
      headers: ['Col1', 'Col2', 'Col3'],
      rows: [
        ['2024-01-01', 'Netflix payment', '-149.00'],
        ['2024-01-02', 'Spotify', '-99.00'],
      ],
      rowCount: 2,
      config: defaultConfig,
    };
    const analysis = analyzeColumns(parseResult);
    const mapping = autoDetectMappings(analysis);

    expect(mapping.dateColumn).toBe('Col1');
    expect(mapping.amountColumn).toBe('Col3');
  });
});

describe('convertToTransactions', () => {
  const defaultConfig: CsvConfig = {
    delimiter: ';',
    hasHeader: true,
    encoding: 'utf-8',
    dateFormat: 'iso',
    decimalSeparator: '.',
  };

  it('converts valid rows to transactions', () => {
    const parseResult: CsvParseResult = {
      headers: ['Date', 'Description', 'Amount'],
      rows: [['2024-01-01', 'Netflix', '-149.00']],
      rowCount: 1,
      config: defaultConfig,
    };
    const mapping = {
      dateColumn: 'Date',
      valueDateColumn: null,
      descriptionColumn: 'Description',
      amountColumn: 'Amount',
      balanceColumn: null,
      verificationColumn: null,
    };

    const transactions = convertToTransactions(parseResult, mapping, null);

    expect(transactions).toHaveLength(1);
    expect(transactions[0].description).toBe('Netflix');
    expect(transactions[0].amount).toBe(-149);
    expect(transactions[0].date).toEqual(new Date(2024, 0, 1));
  });

  it('skips rows with invalid dates', () => {
    const parseResult: CsvParseResult = {
      headers: ['Date', 'Description', 'Amount'],
      rows: [
        ['invalid-date', 'Netflix', '-149.00'],
        ['2024-01-01', 'Spotify', '-99.00'],
      ],
      rowCount: 2,
      config: defaultConfig,
    };
    const mapping = {
      dateColumn: 'Date',
      valueDateColumn: null,
      descriptionColumn: 'Description',
      amountColumn: 'Amount',
      balanceColumn: null,
      verificationColumn: null,
    };

    const transactions = convertToTransactions(parseResult, mapping, null);

    expect(transactions).toHaveLength(1);
    expect(transactions[0].description).toBe('Spotify');
  });

  it('handles Swedish amount format', () => {
    const parseResult: CsvParseResult = {
      headers: ['Date', 'Description', 'Amount'],
      rows: [['2024-01-01', 'Test', '-1 234,56']],
      rowCount: 1,
      config: { ...defaultConfig, decimalSeparator: ',' },
    };
    const mapping = {
      dateColumn: 'Date',
      valueDateColumn: null,
      descriptionColumn: 'Description',
      amountColumn: 'Amount',
      balanceColumn: null,
      verificationColumn: null,
    };

    const transactions = convertToTransactions(parseResult, mapping, null);

    expect(transactions[0].amount).toBeCloseTo(-1234.56, 2);
  });

  it('applies SEB bank transformations', () => {
    const parseResult: CsvParseResult = {
      headers: ['Date', 'Description', 'Amount'],
      rows: [['2024-01-01', 'NETFLIX COM /24-01-01', '-149.00']],
      rowCount: 1,
      config: defaultConfig,
    };
    const mapping = {
      dateColumn: 'Date',
      valueDateColumn: null,
      descriptionColumn: 'Description',
      amountColumn: 'Amount',
      balanceColumn: null,
      verificationColumn: null,
    };

    const transactions = convertToTransactions(parseResult, mapping, 'seb');

    expect(transactions[0].description).toBe('NETFLIX COM');
  });

  it('adds income badge for positive amounts', () => {
    const parseResult: CsvParseResult = {
      headers: ['Date', 'Description', 'Amount'],
      rows: [['2024-01-01', 'Salary', '25000.00']],
      rowCount: 1,
      config: defaultConfig,
    };
    const mapping = {
      dateColumn: 'Date',
      valueDateColumn: null,
      descriptionColumn: 'Description',
      amountColumn: 'Amount',
      balanceColumn: null,
      verificationColumn: null,
    };

    const transactions = convertToTransactions(parseResult, mapping, null);

    expect(transactions[0].badges.some((b) => b.type === 'income')).toBe(true);
  });

  it('generates unique IDs for each transaction', () => {
    const parseResult: CsvParseResult = {
      headers: ['Date', 'Description', 'Amount'],
      rows: [
        ['2024-01-01', 'Test1', '-100.00'],
        ['2024-01-01', 'Test2', '-100.00'],
      ],
      rowCount: 2,
      config: defaultConfig,
    };
    const mapping = {
      dateColumn: 'Date',
      valueDateColumn: null,
      descriptionColumn: 'Description',
      amountColumn: 'Amount',
      balanceColumn: null,
      verificationColumn: null,
    };

    const transactions = convertToTransactions(parseResult, mapping, null);

    expect(transactions[0].id).not.toBe(transactions[1].id);
  });
});

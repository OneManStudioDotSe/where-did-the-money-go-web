/**
 * Hook for using the CSV parser Web Worker
 * Falls back to main thread if Web Workers are not supported
 */

import { useCallback, useRef, useState } from 'react';
import type { CsvConfig, CsvParseResult, CsvParseError, ColumnMapping, BankId } from '../types/csv';
import type { Transaction } from '../types/transaction';
import type { WorkerMessage, WorkerResponse } from '../workers/csv-parser.worker';

// Check if Web Workers are supported
const supportsWorkers = typeof Worker !== 'undefined';

interface UseCsvWorkerResult {
  parseCSV: (content: string, config: CsvConfig) => Promise<CsvParseResult | CsvParseError>;
  convertToTransactions: (result: CsvParseResult, mapping: ColumnMapping, bank: BankId | null) => Promise<Transaction[]>;
  isProcessing: boolean;
  error: string | null;
}

export function useCsvWorker(): UseCsvWorkerResult {
  const workerRef = useRef<Worker | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize worker lazily
  const getWorker = useCallback(() => {
    if (!supportsWorkers) return null;

    if (!workerRef.current) {
      try {
        workerRef.current = new Worker(
          new URL('../workers/csv-parser.worker.ts', import.meta.url),
          { type: 'module' }
        );
      } catch (e) {
        console.warn('Failed to create Web Worker, falling back to main thread:', e);
        return null;
      }
    }
    return workerRef.current;
  }, []);

  const parseCSV = useCallback(async (content: string, config: CsvConfig): Promise<CsvParseResult | CsvParseError> => {
    setIsProcessing(true);
    setError(null);

    const worker = getWorker();

    if (worker) {
      // Use Web Worker
      return new Promise((resolve) => {
        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
          if (event.data.type === 'PARSE_CSV_SUCCESS' || event.data.type === 'PARSE_CSV_ERROR') {
            worker.removeEventListener('message', handleMessage);
            setIsProcessing(false);
            resolve(event.data.payload as CsvParseResult | CsvParseError);
          }
        };

        worker.addEventListener('message', handleMessage);
        worker.postMessage({ type: 'PARSE_CSV', payload: { content, config } } as WorkerMessage);
      });
    } else {
      // Fallback to main thread (dynamic import to avoid bundling worker code twice)
      try {
        const { parseCSV: mainThreadParse } = await import('../utils/csv-parser');
        const result = mainThreadParse(content, config);
        setIsProcessing(false);
        return result;
      } catch (e) {
        setIsProcessing(false);
        setError('Failed to parse CSV');
        return {
          type: 'invalid_format',
          message: 'Failed to parse CSV file',
        };
      }
    }
  }, [getWorker]);

  const convertToTransactions = useCallback(async (
    result: CsvParseResult,
    mapping: ColumnMapping,
    bank: BankId | null
  ): Promise<Transaction[]> => {
    setIsProcessing(true);
    setError(null);

    const worker = getWorker();

    if (worker) {
      // Use Web Worker
      return new Promise((resolve, reject) => {
        const handleMessage = (event: MessageEvent<WorkerResponse>) => {
          if (event.data.type === 'CONVERT_TRANSACTIONS_SUCCESS') {
            worker.removeEventListener('message', handleMessage);
            setIsProcessing(false);
            // Reconstruct Date objects from serialized data
            const transactions = event.data.payload.map((t: Transaction) => ({
              ...t,
              date: new Date(t.date),
            }));
            resolve(transactions);
          } else if (event.data.type === 'CONVERT_TRANSACTIONS_ERROR') {
            worker.removeEventListener('message', handleMessage);
            setIsProcessing(false);
            setError(event.data.payload.message);
            reject(new Error(event.data.payload.message));
          }
        };

        worker.addEventListener('message', handleMessage);
        worker.postMessage({
          type: 'CONVERT_TRANSACTIONS',
          payload: { result, mapping, bank }
        } as WorkerMessage);
      });
    } else {
      // Fallback to main thread
      try {
        const { convertToTransactions: mainThreadConvert } = await import('../utils/csv-parser');
        const transactions = mainThreadConvert(result, mapping, bank);
        setIsProcessing(false);
        return transactions;
      } catch (e) {
        setIsProcessing(false);
        setError('Failed to convert transactions');
        throw e;
      }
    }
  }, [getWorker]);

  return {
    parseCSV,
    convertToTransactions,
    isProcessing,
    error,
  };
}

import { useState, useMemo } from 'react';
import type { CsvConfig, ColumnMapping } from '../types/csv';
import { DEFAULT_CSV_CONFIG } from '../types/csv';
import { parseCSV, analyzeColumns, autoDetectMappings } from '../utils/csv-parser';

interface CsvConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (content: string, config: CsvConfig) => void;
  fileContent: string;
  fileName: string;
}

const COLUMN_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  date: { label: 'Date', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
  amount: { label: 'Amount', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
  balance: { label: 'Balance', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
  description: { label: 'Description', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
  verification: { label: 'Verification', color: 'bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-gray-300' },
  unknown: { label: 'Unknown', color: 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400' },
};

export function CsvConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  fileContent,
  fileName,
}: CsvConfirmationDialogProps) {
  const [config, setConfig] = useState<CsvConfig>(DEFAULT_CSV_CONFIG);

  // Parse and analyze the CSV with current config
  const analysis = useMemo(() => {
    const result = parseCSV(fileContent, config);

    if ('type' in result) {
      return { error: result.message, columns: [], mapping: null, preview: [], rowCount: 0 };
    }

    const columns = analyzeColumns(result);
    const mapping = autoDetectMappings(columns);
    const preview = result.rows.slice(0, 3);

    return {
      error: null,
      columns,
      mapping,
      preview,
      rowCount: result.rowCount,
      headers: result.headers,
    };
  }, [fileContent, config]);

  const handleDelimiterChange = (delimiter: string) => {
    setConfig({ ...config, delimiter });
  };

  const handleConfirm = () => {
    onConfirm(fileContent, config);
  };

  // Check if we have minimum required columns
  const hasRequiredColumns = analysis.mapping &&
    analysis.mapping.dateColumn &&
    analysis.mapping.amountColumn &&
    analysis.mapping.descriptionColumn;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-slate-700">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm CSV Import</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{fileName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="px-6 py-4 space-y-6 max-h-[60vh] overflow-y-auto">
            {/* Parsing Settings */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Parsing Settings</h3>
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Delimiter</label>
                  <div className="flex gap-2">
                    {[
                      { value: ';', label: 'Semicolon (;)' },
                      { value: ',', label: 'Comma (,)' },
                      { value: '\t', label: 'Tab' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleDelimiterChange(option.value)}
                        className={`px-3 py-1.5 text-sm rounded-lg border transition-all ${
                          config.delimiter === option.value
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                            : 'border-gray-200 dark:border-slate-600 hover:border-gray-300 dark:hover:border-slate-500 text-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">File Info</label>
                  <div className="flex gap-2">
                    <span className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-300">
                      {analysis.rowCount} rows
                    </span>
                    <span className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-slate-700 rounded-lg text-gray-600 dark:text-gray-300">
                      {analysis.columns.length} columns
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Message */}
            {analysis.error && (
              <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
                <p className="text-sm font-medium text-danger-600 dark:text-danger-400">{analysis.error}</p>
              </div>
            )}

            {/* Column Detection */}
            {!analysis.error && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Detected Columns</h3>
                <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Column</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Detected Type</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Mapped To</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Sample Values</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {analysis.columns.map((col) => {
                        const typeInfo = COLUMN_TYPE_LABELS[col.detectedType] || COLUMN_TYPE_LABELS.unknown;
                        const mappedTo = getMappedField(col.columnName, analysis.mapping);

                        return (
                          <tr key={col.columnIndex}>
                            <td className="px-4 py-2 font-mono text-gray-900 dark:text-white">
                              {col.columnName}
                            </td>
                            <td className="px-4 py-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeInfo.color}`}>
                                {typeInfo.label}
                              </span>
                              <span className="ml-2 text-xs text-gray-400 dark:text-gray-500">
                                {Math.round(col.confidence * 100)}%
                              </span>
                            </td>
                            <td className="px-4 py-2">
                              {mappedTo ? (
                                <span className="text-success-600 dark:text-success-400 flex items-center gap-1">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                  {mappedTo}
                                </span>
                              ) : (
                                <span className="text-gray-400 dark:text-gray-500">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-gray-600 dark:text-gray-400 truncate max-w-xs">
                              {col.sampleValues.slice(0, 2).join(', ')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Preview Rows */}
            {!analysis.error && analysis.preview.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Data Preview (First 3 rows)</h3>
                <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                      <tr>
                        {analysis.headers?.map((header, i) => (
                          <th key={i} className="text-left px-3 py-2 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {analysis.preview.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          {row.map((cell, cellIndex) => (
                            <td key={cellIndex} className="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">
                              {cell || <span className="text-gray-300 dark:text-gray-600">empty</span>}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Required Columns Check */}
            {!analysis.error && (
              <div className={`p-4 rounded-lg border ${
                hasRequiredColumns
                  ? 'bg-success-50 dark:bg-success-900/20 border-success-200 dark:border-success-800'
                  : 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-700'
              }`}>
                <div className="flex items-start gap-3">
                  {hasRequiredColumns ? (
                    <>
                      <svg className="w-5 h-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-success-700 dark:text-success-300">Ready to import</p>
                        <p className="text-xs text-success-600 dark:text-success-400 mt-0.5">
                          All required columns detected: Date, Amount, Description
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <p className="text-sm font-medium text-warning-700 dark:text-warning-300">Missing required columns</p>
                        <p className="text-xs text-warning-600 dark:text-warning-400 mt-0.5">
                          Could not detect: {!analysis.mapping?.dateColumn && 'Date'} {!analysis.mapping?.amountColumn && 'Amount'} {!analysis.mapping?.descriptionColumn && 'Description'}
                        </p>
                        <p className="text-xs text-warning-500 dark:text-warning-500 mt-1">
                          Try changing the delimiter setting above
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!hasRequiredColumns}
              className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Import {analysis.rowCount} Transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getMappedField(columnName: string, mapping: ColumnMapping | null): string | null {
  if (!mapping) return null;

  if (mapping.dateColumn === columnName) return 'Booking Date';
  if (mapping.valueDateColumn === columnName) return 'Value Date';
  if (mapping.amountColumn === columnName) return 'Amount';
  if (mapping.descriptionColumn === columnName) return 'Description';
  if (mapping.balanceColumn === columnName) return 'Balance';
  if (mapping.verificationColumn === columnName) return 'Verification #';

  return null;
}

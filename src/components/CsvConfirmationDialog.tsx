import { useState, useMemo } from 'react';
import type { DragEvent } from 'react';
import type { CsvConfig, ColumnMapping, BankId } from '../types/csv';
import { DEFAULT_CSV_CONFIG, BANK_CONFIGS } from '../types/csv';
import { parseCSV, analyzeColumns, autoDetectMappings } from '../utils/csv-parser';

interface CsvConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (content: string, config: CsvConfig, mapping: ColumnMapping, bank: BankId | null) => void;
  fileContent: string;
  fileName: string;
  maxTransactionLimit?: number;
  preferredBank?: BankId | null;
}

// Field definitions for drag-and-drop mapping
const MAPPING_FIELDS = [
  { key: 'dateColumn' as const, label: 'Date', icon: '📅', required: true, color: 'bg-blue-500' },
  { key: 'descriptionColumn' as const, label: 'Description', icon: '📝', required: true, color: 'bg-orange-500' },
  { key: 'amountColumn' as const, label: 'Amount', icon: '💰', required: true, color: 'bg-green-500' },
  { key: 'valueDateColumn' as const, label: 'Value Date', icon: '📆', required: false, color: 'bg-cyan-500' },
  { key: 'balanceColumn' as const, label: 'Balance', icon: '⚖️', required: false, color: 'bg-purple-500' },
  { key: 'verificationColumn' as const, label: 'Verification #', icon: '🔢', required: false, color: 'bg-gray-500' },
];

type MappingKey = typeof MAPPING_FIELDS[number]['key'];

export function CsvConfirmationDialog({
  isOpen,
  onClose,
  onConfirm,
  fileContent,
  fileName,
  maxTransactionLimit = 2000,
  preferredBank = null,
}: CsvConfirmationDialogProps) {
  const [config, setConfig] = useState<CsvConfig>(DEFAULT_CSV_CONFIG);
  const [selectedBank, setSelectedBank] = useState<BankId | null>(preferredBank);
  const [manualMappings, setManualMappings] = useState<Partial<ColumnMapping>>({});
  const [draggedField, setDraggedField] = useState<MappingKey | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Parse and analyze the CSV with current config
  const analysis = useMemo(() => {
    const result = parseCSV(fileContent, config);

    if ('type' in result) {
      return { error: result.message, columns: [], mapping: null, preview: [], rowCount: 0, headers: [] as string[] };
    }

    const columns = analyzeColumns(result);
    const mapping = autoDetectMappings(columns);
    const preview = result.rows.slice(0, 5);

    return {
      error: null,
      columns,
      mapping,
      preview,
      rowCount: result.rowCount,
      headers: result.headers,
    };
  }, [fileContent, config]);

  // Combine auto-detected and manual mappings
  const effectiveMapping: ColumnMapping = useMemo(() => {
    return {
      dateColumn: manualMappings.dateColumn ?? analysis.mapping?.dateColumn ?? null,
      valueDateColumn: manualMappings.valueDateColumn ?? analysis.mapping?.valueDateColumn ?? null,
      amountColumn: manualMappings.amountColumn ?? analysis.mapping?.amountColumn ?? null,
      descriptionColumn: manualMappings.descriptionColumn ?? analysis.mapping?.descriptionColumn ?? null,
      balanceColumn: manualMappings.balanceColumn ?? analysis.mapping?.balanceColumn ?? null,
      verificationColumn: manualMappings.verificationColumn ?? analysis.mapping?.verificationColumn ?? null,
    };
  }, [analysis.mapping, manualMappings]);

  const handleDelimiterChange = (delimiter: string) => {
    setConfig({ ...config, delimiter });
    // Reset manual mappings when delimiter changes
    setManualMappings({});
  };

  const handleConfirm = () => {
    onConfirm(fileContent, config, effectiveMapping, selectedBank);
  };

  // Drag and drop handlers
  const handleDragStart = (e: DragEvent<HTMLDivElement>, fieldKey: MappingKey) => {
    setDraggedField(fieldKey);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: DragEvent<HTMLTableCellElement>, columnName: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColumn(columnName);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const handleDrop = (e: DragEvent<HTMLTableCellElement>, columnName: string) => {
    e.preventDefault();
    if (draggedField) {
      // Clear this field from any other column first
      const newMappings = { ...manualMappings };
      Object.keys(newMappings).forEach((key) => {
        if (newMappings[key as MappingKey] === columnName) {
          delete newMappings[key as MappingKey];
        }
      });
      // Set the new mapping
      newMappings[draggedField] = columnName;
      setManualMappings(newMappings);
    }
    setDraggedField(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedField(null);
    setDragOverColumn(null);
  };

  const clearMapping = (fieldKey: MappingKey) => {
    const newMappings = { ...manualMappings };
    // If it was manually set, remove it
    if (newMappings[fieldKey]) {
      delete newMappings[fieldKey];
    } else {
      // Otherwise, explicitly set it to null to override auto-detection
      newMappings[fieldKey] = null;
    }
    setManualMappings(newMappings);
  };

  // Check if we have minimum required columns
  const hasRequiredColumns =
    effectiveMapping.dateColumn &&
    effectiveMapping.amountColumn &&
    effectiveMapping.descriptionColumn;

  // Check if exceeds transaction limit
  const exceedsLimit = analysis.rowCount > maxTransactionLimit;
  const importCount = Math.min(analysis.rowCount, maxTransactionLimit);

  // Get field mapping for a column
  const getFieldForColumn = (columnName: string): typeof MAPPING_FIELDS[number] | null => {
    for (const field of MAPPING_FIELDS) {
      if (effectiveMapping[field.key] === columnName) {
        return field;
      }
    }
    return null;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />

      {/* Panel */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
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
          <div className="px-6 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Top Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* File Info Card */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  File Information
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Rows</p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-200">{analysis.rowCount.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-blue-600 dark:text-blue-400">Columns</p>
                    <p className="text-lg font-bold text-blue-900 dark:text-blue-200">{analysis.columns.length}</p>
                  </div>
                </div>
              </div>

              {/* Parsing Settings Card */}
              <div className="bg-gray-50 dark:bg-slate-700/50 border border-gray-200 dark:border-slate-600 rounded-lg p-4">
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Parsing Settings
                </h3>
                <div className="space-y-3">
                  {/* Delimiter */}
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Delimiter</label>
                    <div className="flex gap-1.5">
                      {[
                        { value: ';', label: ';' },
                        { value: ',', label: ',' },
                        { value: '\t', label: 'Tab' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          onClick={() => handleDelimiterChange(option.value)}
                          className={`px-3 py-1 text-sm rounded-md border transition-all ${
                            config.delimiter === option.value
                              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                              : 'border-gray-200 dark:border-slate-500 hover:border-gray-300 dark:hover:border-slate-400 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Bank */}
                  <div>
                    <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Bank</label>
                    <select
                      value={selectedBank || ''}
                      onChange={(e) => setSelectedBank((e.target.value || null) as BankId | null)}
                      className="w-full px-2 py-1 text-sm border border-gray-200 dark:border-slate-500 rounded-md bg-white dark:bg-slate-600 text-gray-900 dark:text-white"
                    >
                      <option value="">Auto-detect</option>
                      {Object.values(BANK_CONFIGS).map((bank) => (
                        <option key={bank.id} value={bank.id}>{bank.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Transaction Limit Warning */}
            {exceedsLimit && (
              <div className="bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-700 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <svg className="w-5 h-5 text-warning-600 dark:text-warning-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-warning-700 dark:text-warning-300">
                      Large file detected
                    </p>
                    <p className="text-xs text-warning-600 dark:text-warning-400 mt-0.5">
                      This file has {analysis.rowCount.toLocaleString()} transactions. Only the first {maxTransactionLimit.toLocaleString()} will be imported.
                      You can change this limit in Settings.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Error Message */}
            {analysis.error && (
              <div className="p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
                <p className="text-sm font-medium text-danger-600 dark:text-danger-400">{analysis.error}</p>
              </div>
            )}

            {/* Column Mapping Section */}
            {!analysis.error && (
              <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-slate-700/50 px-4 py-3 border-b border-gray-200 dark:border-slate-700">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Column Mapping</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Drag field labels to assign columns, or drop on the preview table headers below
                  </p>
                </div>

                {/* Draggable Field Chips */}
                <div className="px-4 py-3 bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700">
                  <div className="flex flex-wrap gap-2">
                    {MAPPING_FIELDS.map((field) => {
                      const isMapped = effectiveMapping[field.key] !== null;
                      const isManuallyCleared = manualMappings[field.key] === null;

                      return (
                        <div key={field.key} className="flex items-center gap-1">
                          <div
                            draggable
                            onDragStart={(e) => handleDragStart(e, field.key)}
                            onDragEnd={handleDragEnd}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium cursor-grab active:cursor-grabbing transition-all ${
                              draggedField === field.key
                                ? 'opacity-50 scale-95'
                                : isMapped && !isManuallyCleared
                                  ? 'bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300'
                                  : `${field.color} text-white shadow-sm`
                            }`}
                          >
                            <span>{field.icon}</span>
                            <span>{field.label}</span>
                            {field.required && !isMapped && (
                              <span className="text-xs opacity-75">*</span>
                            )}
                          </div>
                          {isMapped && !isManuallyCleared && (
                            <button
                              onClick={() => clearMapping(field.key)}
                              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                              title="Clear mapping"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                          {isMapped && !isManuallyCleared && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              → {effectiveMapping[field.key]}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Data Preview with Drop Zones */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                      <tr>
                        {analysis.headers?.map((header, i) => {
                          const mappedField = getFieldForColumn(header);
                          const isDropTarget = dragOverColumn === header;

                          return (
                            <th
                              key={i}
                              onDragOver={(e) => handleDragOver(e, header)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, header)}
                              className={`text-left px-3 py-2 font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap transition-colors ${
                                isDropTarget
                                  ? 'bg-primary-100 dark:bg-primary-900/50 ring-2 ring-inset ring-primary-500'
                                  : ''
                              }`}
                            >
                              <div className="flex flex-col gap-1">
                                <span>{header}</span>
                                {mappedField && (
                                  <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium ${mappedField.color} text-white w-fit`}>
                                    {mappedField.icon} {mappedField.label}
                                  </span>
                                )}
                              </div>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                      {analysis.preview.map((row, rowIndex) => (
                        <tr key={rowIndex} className="bg-white dark:bg-slate-800">
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
                          All required columns mapped: Date, Amount, Description
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
                          Drag the following fields to their columns: {!effectiveMapping.dateColumn && 'Date'} {!effectiveMapping.amountColumn && 'Amount'} {!effectiveMapping.descriptionColumn && 'Description'}
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 rounded-b-xl">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedBank && BANK_CONFIGS[selectedBank] && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-primary-500" />
                  {BANK_CONFIGS[selectedBank].name} optimizations applied
                </span>
              )}
            </div>
            <div className="flex items-center gap-3">
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
                Import {importCount.toLocaleString()} Transaction{importCount !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

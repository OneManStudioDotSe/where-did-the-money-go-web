import { useEffect } from 'react';

interface CsvParserSpecModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CsvParserSpecModal({ isOpen, onClose }: CsvParserSpecModalProps) {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">CSV parser specification</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Swedish bank export format (Swedbank/SEB style)</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
          {/* File Format */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">File format</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Encoding', value: 'UTF-8 (with BOM)' },
                { label: 'Delimiter', value: 'Semicolon (;)' },
                { label: 'Date Format', value: 'YYYY-MM-DD' },
                { label: 'Decimal', value: 'Period (.)' },
              ].map((item) => (
                <div key={item.label} className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <span className="text-gray-500 dark:text-gray-400">{item.label}</span>
                  <p className="font-medium text-gray-900 dark:text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Expected Columns */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Expected columns</h3>
            <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-slate-700/50">
                  <tr>
                    <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Swedish header</th>
                    <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Description</th>
                    <th className="text-center px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Required</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
                  {[
                    { header: 'Bokföringsdatum', desc: 'Booking Date', required: true },
                    { header: 'Valutadatum', desc: 'Value Date', required: false },
                    { header: 'Verifikationsnummer', desc: 'Transaction ID', required: false },
                    { header: 'Text', desc: 'Description', required: true },
                    { header: 'Belopp', desc: 'Amount', required: true },
                    { header: 'Saldo', desc: 'Balance', required: false },
                  ].map((col) => (
                    <tr key={col.header}>
                      <td className="px-4 py-2 font-mono text-gray-900 dark:text-white">{col.header}</td>
                      <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{col.desc}</td>
                      <td className={`px-4 py-2 text-center ${col.required ? 'text-success-600 dark:text-success-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {col.required ? '✓' : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount Convention */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Amount convention</h3>
            <div className="flex gap-4">
              <div className="flex-1 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg p-3">
                <p className="text-sm font-medium text-danger-600 dark:text-danger-400">Negative (-)</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Expenses (money out)</p>
              </div>
              <div className="flex-1 bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-3">
                <p className="text-sm font-medium text-success-600 dark:text-success-400">Positive (+)</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Income (money in)</p>
              </div>
            </div>
          </div>

          {/* Example Row */}
          <div>
            <h3 className="font-medium text-gray-900 dark:text-white mb-3">Example row</h3>
            <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
              <code className="text-sm text-green-400 whitespace-nowrap">
                2025-12-18;2025-12-18;5484381424;NETFLIX COM /25-12-18;-149.000;8686.500
              </code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

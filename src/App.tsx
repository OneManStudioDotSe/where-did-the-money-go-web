import { useState } from 'react'
import './index.css'
import { defaultCategories } from './data/categories'
import { defaultCategoryMappings } from './data/category-mappings'

function App() {
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [showCsvInfoModal, setShowCsvInfoModal] = useState(false)

  const totalSubcategories = defaultCategories.reduce(
    (sum, cat) => sum + cat.subcategories.length,
    0
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Where Did The Money Go?
          </h1>
          <p className="text-gray-500 mt-1">
            Personal expense tracker - All data stays on your device
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Welcome to Where Did The Money Go
          </h2>
          <p className="text-gray-600 mb-4">
            A privacy-focused expense tracking application that analyzes your bank transactions
            locally in your browser. No accounts, no cloud storage - your financial data never
            leaves your device.
          </p>
          <div className="flex gap-4">
            <button
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              disabled
            >
              Upload CSV (Coming Soon)
            </button>
            <button
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              disabled
            >
              Load Sample Data
            </button>
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Phase 1 Status */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
              <h3 className="font-medium text-gray-900">Phase 1: Foundation</h3>
            </div>
            <p className="text-sm text-gray-600">
              Setting up project structure, TypeScript interfaces, and core data models.
            </p>
          </div>

          {/* Categories Status - Clickable */}
          <button
            onClick={() => setShowCategoriesModal(true)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-success-500 rounded-full"></div>
              <h3 className="font-medium text-gray-900">Categories</h3>
              <span className="ml-auto text-xs text-primary-600 font-medium">Click to view →</span>
            </div>
            <p className="text-sm text-gray-600">
              {defaultCategories.length} categories with {totalSubcategories} subcategories defined. {defaultCategoryMappings.length} merchant mappings ready.
            </p>
          </button>

          {/* CSV Parser Status - Clickable */}
          <button
            onClick={() => setShowCsvInfoModal(true)}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
              <h3 className="font-medium text-gray-900">CSV Parser</h3>
              <span className="ml-auto text-xs text-primary-600 font-medium">View specs →</span>
            </div>
            <p className="text-sm text-gray-600">
              Swedish bank format specification complete. Parser implementation pending.
            </p>
          </button>
        </div>

        {/* Development Info */}
        <div className="bg-gray-100 rounded-lg p-6">
          <h3 className="font-medium text-gray-900 mb-2">Development Mode</h3>
          <p className="text-sm text-gray-600 mb-4">
            This is a development build. Features will be added iteratively.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700">
              React 19
            </span>
            <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700">
              TypeScript
            </span>
            <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700">
              Tailwind CSS 4
            </span>
            <span className="px-2 py-1 bg-white rounded text-xs font-medium text-gray-700">
              Vite 6
            </span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <p className="text-sm text-gray-500 text-center">
            All data is processed locally. Nothing is sent to any server.
          </p>
        </div>
      </footer>

      {/* Categories Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">Category System</h2>
                <p className="text-sm text-gray-500 mt-1">
                  {defaultCategories.length} categories • {totalSubcategories} subcategories • {defaultCategoryMappings.length} merchant mappings
                </p>
              </div>
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {defaultCategories.map((category) => (
                  <div
                    key={category.id}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        {category.icon}
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        <p className="text-xs text-gray-500">{category.subcategories.length} subcategories</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {category.subcategories.map((sub) => (
                        <span
                          key={sub.id}
                          className="px-2 py-0.5 text-xs rounded-full"
                          style={{
                            backgroundColor: `${category.color}15`,
                            color: category.color,
                          }}
                        >
                          {sub.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CSV Parser Info Modal */}
      {showCsvInfoModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">CSV Parser Specification</h2>
                <p className="text-sm text-gray-500 mt-1">Swedish bank export format (Swedbank/SEB style)</p>
              </div>
              <button
                onClick={() => setShowCsvInfoModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              {/* File Format */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">File Format</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500">Encoding</span>
                    <p className="font-medium text-gray-900">UTF-8 (with BOM)</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500">Delimiter</span>
                    <p className="font-medium text-gray-900">Semicolon (;)</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500">Date Format</span>
                    <p className="font-medium text-gray-900">YYYY-MM-DD</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <span className="text-gray-500">Decimal</span>
                    <p className="font-medium text-gray-900">Period (.)</p>
                  </div>
                </div>
              </div>

              {/* Expected Columns */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Expected Columns</h3>
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-700">Swedish Header</th>
                        <th className="text-left px-4 py-2 font-medium text-gray-700">Description</th>
                        <th className="text-center px-4 py-2 font-medium text-gray-700">Required</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      <tr>
                        <td className="px-4 py-2 font-mono text-gray-900">Bokföringsdatum</td>
                        <td className="px-4 py-2 text-gray-600">Booking Date</td>
                        <td className="px-4 py-2 text-center text-success-600">✓</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-gray-900">Valutadatum</td>
                        <td className="px-4 py-2 text-gray-600">Value Date</td>
                        <td className="px-4 py-2 text-center text-gray-400">-</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-gray-900">Verifikationsnummer</td>
                        <td className="px-4 py-2 text-gray-600">Transaction ID</td>
                        <td className="px-4 py-2 text-center text-gray-400">-</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-gray-900">Text</td>
                        <td className="px-4 py-2 text-gray-600">Description</td>
                        <td className="px-4 py-2 text-center text-success-600">✓</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-gray-900">Belopp</td>
                        <td className="px-4 py-2 text-gray-600">Amount</td>
                        <td className="px-4 py-2 text-center text-success-600">✓</td>
                      </tr>
                      <tr>
                        <td className="px-4 py-2 font-mono text-gray-900">Saldo</td>
                        <td className="px-4 py-2 text-gray-600">Balance</td>
                        <td className="px-4 py-2 text-center text-gray-400">-</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Amount Convention */}
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">Amount Convention</h3>
                <div className="flex gap-4">
                  <div className="flex-1 bg-danger-500/10 border border-danger-500/20 rounded-lg p-3">
                    <p className="text-sm font-medium text-danger-600">Negative (-)</p>
                    <p className="text-xs text-gray-600 mt-1">Expenses (money out)</p>
                  </div>
                  <div className="flex-1 bg-success-500/10 border border-success-500/20 rounded-lg p-3">
                    <p className="text-sm font-medium text-success-600">Positive (+)</p>
                    <p className="text-xs text-gray-600 mt-1">Income (money in)</p>
                  </div>
                </div>
              </div>

              {/* Example Row */}
              <div>
                <h3 className="font-medium text-gray-900 mb-3">Example Row</h3>
                <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                  <code className="text-sm text-green-400 whitespace-nowrap">
                    2025-12-18;2025-12-18;5484381424;NETFLIX COM /25-12-18;-149.000;8686.500
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App

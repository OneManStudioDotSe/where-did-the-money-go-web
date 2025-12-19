import { useState } from 'react'
import './index.css'
import { defaultCategories } from './data/categories'
import { defaultCategoryMappings } from './data/category-mappings'
import { FileUpload, TransactionList, FilterPanel, defaultFilters, ProjectRoadmap, TimePeriodSelector, SpendingVisualization } from './components'
import type { TimePeriod } from './components'
import { parseTransactionsFromCSV, categorizeTransactions, getCategorizedStats } from './utils'
import { useTransactionFilters, useTimePeriodFilter } from './hooks'
import type { Transaction, TransactionFilters } from './types/transaction'
import type { CsvParseError } from './types/csv'

function App() {
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [showCsvInfoModal, setShowCsvInfoModal] = useState(false)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<CsvParseError | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod | null>(null)

  // Apply time period filter first
  const { periodFilteredTransactions, periodStats } = useTimePeriodFilter(
    transactions,
    selectedPeriod
  )

  // Then apply regular filters on top
  const { filteredTransactions, totalCount, filteredCount } = useTransactionFilters(
    periodFilteredTransactions,
    filters
  )

  const totalSubcategories = defaultCategories.reduce(
    (sum, cat) => sum + cat.subcategories.length,
    0
  )

  const handleFileLoaded = (content: string, name: string) => {
    setIsLoading(true)
    setError(null)
    setFileName(name)
    setIsDemoMode(false)

    // Simulate slight delay for UX
    setTimeout(() => {
      const result = parseTransactionsFromCSV(content)

      if ('type' in result) {
        setError(result)
        setTransactions([])
      } else {
        const categorized = categorizeTransactions(result)
        setTransactions(categorized)
      }
      setIsLoading(false)
    }, 300)
  }

  const handleLoadDemo = async () => {
    setIsLoading(true)
    setError(null)
    setIsDemoMode(true)
    setFileName('Demo Data (Sample Transactions)')

    try {
      const response = await fetch('/demo-data.csv')
      if (!response.ok) {
        throw new Error('Failed to load demo data')
      }
      const content = await response.text()

      const result = parseTransactionsFromCSV(content)

      if ('type' in result) {
        setError(result)
        setTransactions([])
        setIsDemoMode(false)
      } else {
        const categorized = categorizeTransactions(result)
        setTransactions(categorized)
      }
    } catch {
      setError({
        type: 'invalid_format',
        message: 'Failed to load demo data',
        details: 'Please try again or upload your own CSV file',
      })
      setIsDemoMode(false)
    }
    setIsLoading(false)
  }

  const handleError = (err: CsvParseError) => {
    setError(err)
    setTransactions([])
  }

  const handleClearData = () => {
    setTransactions([])
    setError(null)
    setFileName(null)
    setIsDemoMode(false)
    setFilters(defaultFilters)
    setSelectedPeriod(null)
  }

  const stats = getCategorizedStats(periodFilteredTransactions)

  // Summary calculations - use period filtered data when period is selected
  const totalExpenses = selectedPeriod ? periodStats.totalExpenses : transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const totalIncome = selectedPeriod ? periodStats.totalIncome : transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

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
        {transactions.length === 0 ? (
          <>
            {/* Welcome Card with File Upload */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Get Started
              </h2>
              <p className="text-gray-600 mb-6">
                Upload your bank CSV export to analyze your spending. Your data is processed
                entirely in your browser and never leaves your device.
              </p>

              <FileUpload
                onFileLoaded={handleFileLoaded}
                onError={handleError}
                isLoading={isLoading}
              />

              {/* Demo Mode Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-4">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                        DEMO
                      </span>
                      Try it without your own data
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Explore the app with sample Swedish bank transactions. See how categories are
                      automatically detected, view spending summaries, and understand what insights
                      you'll get from your own data.
                    </p>
                  </div>
                  <button
                    onClick={handleLoadDemo}
                    disabled={isLoading}
                    className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {isLoading ? 'Loading...' : 'Load Demo Data'}
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-danger-500/10 border border-danger-500/20 rounded-lg">
                  <p className="text-sm font-medium text-danger-600">{error.message}</p>
                  {error.details && (
                    <p className="text-xs text-gray-600 mt-1">{error.details}</p>
                  )}
                </div>
              )}
            </div>

            {/* Project Roadmap */}
            <ProjectRoadmap />

            {/* Quick Info Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {/* Categories Status - Clickable */}
              <button
                onClick={() => setShowCategoriesModal(true)}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-left hover:border-primary-300 hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">🏷️</span>
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
                  <span className="text-2xl">📄</span>
                  <h3 className="font-medium text-gray-900">CSV Parser</h3>
                  <span className="ml-auto text-xs text-primary-600 font-medium">View specs →</span>
                </div>
                <p className="text-sm text-gray-600">
                  Swedish bank format parser ready. Auto-detects columns.
                </p>
              </button>
            </div>

            {/* Tech Stack */}
            <div className="bg-gray-100 rounded-lg p-6">
              <h3 className="font-medium text-gray-900 mb-2">Built With</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 shadow-sm">
                  React 19
                </span>
                <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 shadow-sm">
                  TypeScript
                </span>
                <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 shadow-sm">
                  Tailwind CSS 4
                </span>
                <span className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-700 shadow-sm">
                  Vite 6
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Demo Mode Banner */}
            {isDemoMode && (
              <div className="bg-primary-50 border border-primary-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-semibold rounded-full">
                    DEMO MODE
                  </span>
                  <p className="text-sm text-primary-800">
                    You're viewing sample data. Upload your own bank CSV to analyze your real transactions.
                  </p>
                  <button
                    onClick={handleClearData}
                    className="ml-auto text-sm text-primary-700 hover:text-primary-900 font-medium"
                  >
                    Exit Demo
                  </button>
                </div>
              </div>
            )}

            {/* Summary Header */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    Transaction Analysis
                    {isDemoMode && (
                      <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-semibold rounded-full">
                        DEMO
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {fileName} • {selectedPeriod ? `${periodFilteredTransactions.length} of ${transactions.length}` : transactions.length} transactions
                    {selectedPeriod && (
                      <span className="ml-2 text-primary-600">({selectedPeriod.label})</span>
                    )}
                  </p>
                </div>
                <button
                  onClick={handleClearData}
                  className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  {isDemoMode ? 'Exit Demo' : 'Upload New File'}
                </button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Total Expenses</p>
                  <p className="text-xl font-semibold text-danger-600">
                    -{totalExpenses.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Total Income</p>
                  <p className="text-xl font-semibold text-success-600">
                    +{totalIncome.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Categorized</p>
                  <p className="text-xl font-semibold text-gray-900">
                    {stats.percentage}%
                    <span className="text-sm font-normal text-gray-500 ml-1">
                      ({stats.categorized}/{transactions.length})
                    </span>
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-500">Net Change</p>
                  <p className={`text-xl font-semibold ${totalIncome - totalExpenses >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                    {(totalIncome - totalExpenses) >= 0 ? '+' : ''}
                    {(totalIncome - totalExpenses).toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                  </p>
                </div>
              </div>
            </div>

            {/* Time Period Selector */}
            <TimePeriodSelector
              transactions={transactions}
              selectedPeriod={selectedPeriod}
              onPeriodChange={setSelectedPeriod}
            />

            {/* Filter Panel */}
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              totalCount={totalCount}
              filteredCount={filteredCount}
            />

            {/* Main Content: Visualization + Transaction List */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Visualization Panel */}
              <SpendingVisualization
                transactions={filteredTransactions}
                selectedPeriod={selectedPeriod}
                allTransactions={transactions}
              />

              {/* Transaction List */}
              <div>
                <TransactionList transactions={filteredTransactions} />
              </div>
            </div>
          </>
        )}
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

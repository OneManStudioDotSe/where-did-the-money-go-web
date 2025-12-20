import { useState, useEffect } from 'react'
import './index.css'
import { defaultCategories } from './data/categories'
import { defaultCategoryMappings } from './data/category-mappings'
import { FileUpload, TransactionList, FilterPanel, defaultFilters, ProjectRoadmap, TimePeriodSelector, SpendingVisualization, SettingsPanel, loadSettings, TransactionEditModal, UncategorizedCarousel, CsvConfirmationDialog, ExportDialog } from './components'
import type { TimePeriod, AppSettings } from './components'
import { parseTransactionsFromCSV, categorizeTransactions, getCategorizedStats } from './utils'
import { useTransactionFilters, useTimePeriodFilter } from './hooks'
import { useDarkMode } from './hooks/useDarkMode'
import { useHashRouter } from './hooks/useHashRouter'
import type { Transaction, TransactionFilters } from './types/transaction'
import type { CsvParseError, CsvConfig, ColumnMapping, BankId } from './types/csv'
import { parseCSV, convertToTransactions } from './utils/csv-parser'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { FeaturesPage, HowItWorksPage, AboutPage, PrivacyPage, DisclaimerPage } from './pages'
import { preloadIconSet } from './config/icon-sets'

function App() {
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [showCsvInfoModal, setShowCsvInfoModal] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [showUncategorizedCarousel, setShowUncategorizedCarousel] = useState(false)
  const [showCsvConfirmation, setShowCsvConfirmation] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [pendingFileContent, setPendingFileContent] = useState<string | null>(null)
  const [pendingFileName, setPendingFileName] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => loadSettings())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<CsvParseError | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod | null>(null)

  // Hooks
  const { isDark, toggleDark, setMode } = useDarkMode()
  const { route, navigate } = useHashRouter()

  // Sync theme with settings
  useEffect(() => {
    setMode(appSettings.theme)
  }, [appSettings.theme, setMode])

  // Preload icons when icon set changes
  useEffect(() => {
    if (appSettings.iconSet !== 'emoji') {
      preloadIconSet(appSettings.iconSet)
    }
  }, [appSettings.iconSet])

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
    // Show confirmation dialog instead of immediately processing
    setPendingFileContent(content)
    setPendingFileName(name)
    setShowCsvConfirmation(true)
    setError(null)
    setIsDemoMode(false)
  }

  const handleCsvConfirm = (content: string, config: CsvConfig, mapping: ColumnMapping, bank: BankId | null) => {
    setShowCsvConfirmation(false)
    setIsLoading(true)
    setFileName(pendingFileName)

    setTimeout(() => {
      const result = parseCSV(content, config)

      if ('type' in result) {
        setError(result)
        setTransactions([])
      } else {
        // Limit transactions based on settings
        const limitedResult = {
          ...result,
          rows: result.rows.slice(0, appSettings.maxTransactionLimit),
          rowCount: Math.min(result.rowCount, appSettings.maxTransactionLimit),
        }
        const parsedTransactions = convertToTransactions(limitedResult, mapping, bank)
        const categorized = categorizeTransactions(parsedTransactions)
        setTransactions(categorized)
      }
      setIsLoading(false)
      setPendingFileContent(null)
      setPendingFileName(null)
    }, 300)
  }

  const handleCsvCancel = () => {
    setShowCsvConfirmation(false)
    setPendingFileContent(null)
    setPendingFileName(null)
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

  const handleCategoryChange = (transactionId: string, categoryId: string, subcategoryId: string) => {
    setTransactions(prevTransactions =>
      prevTransactions.map(t => {
        if (t.id === transactionId) {
          const badges = t.badges.filter(b => b.type !== 'uncategorized')
          return {
            ...t,
            categoryId,
            subcategoryId,
            badges,
          }
        }
        return t
      })
    )
  }

  const handleTransactionClick = (transaction: Transaction) => {
    setEditingTransaction(transaction)
  }

  const stats = getCategorizedStats(periodFilteredTransactions)

  const totalExpenses = selectedPeriod ? periodStats.totalExpenses : transactions
    .filter((t) => t.amount < 0)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  const totalIncome = selectedPeriod ? periodStats.totalIncome : transactions
    .filter((t) => t.amount > 0)
    .reduce((sum, t) => sum + t.amount, 0)

  // Route rendering
  const renderPage = () => {
    switch (route) {
      case '#/features':
        return <FeaturesPage />
      case '#/how-it-works':
        return <HowItWorksPage />
      case '#/about':
        return <AboutPage />
      case '#/privacy':
        return <PrivacyPage />
      case '#/disclaimer':
        return <DisclaimerPage />
      default:
        return renderHomePage()
    }
  }

  const renderHomePage = () => (
    <>
      {transactions.length === 0 ? (
        <>
          {/* Welcome Card with File Upload */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-8 hover:shadow-md transition-shadow">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Get Started
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Upload your bank CSV export to analyze your spending. Your data is processed
              entirely in your browser and never leaves your device.
            </p>

            <FileUpload
              onFileLoaded={handleFileLoaded}
              onError={handleError}
              isLoading={isLoading}
            />

            {/* Demo Mode Section */}
            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-slate-700">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-semibold rounded-full">
                      DEMO
                    </span>
                    Try it without your own data
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
              <div className="mt-4 p-4 bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 rounded-lg">
                <p className="text-sm font-medium text-danger-600 dark:text-danger-400">{error.message}</p>
                {error.details && (
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{error.details}</p>
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
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 text-left hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">🏷️</span>
                <h3 className="font-medium text-gray-900 dark:text-white">Categories</h3>
                <span className="ml-auto text-xs text-primary-600 dark:text-primary-400 font-medium">Click to view →</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {defaultCategories.length} categories with {totalSubcategories} subcategories defined. {defaultCategoryMappings.length} merchant mappings ready.
              </p>
            </button>

            {/* CSV Parser Status - Clickable */}
            <button
              onClick={() => setShowCsvInfoModal(true)}
              className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 text-left hover:border-primary-300 dark:hover:border-primary-600 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-2xl">📄</span>
                <h3 className="font-medium text-gray-900 dark:text-white">CSV Parser</h3>
                <span className="ml-auto text-xs text-primary-600 dark:text-primary-400 font-medium">View specs →</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Swedish bank format parser ready. Auto-detects columns.
              </p>
            </button>
          </div>

          {/* Tech Stack */}
          <div className="bg-gray-100 dark:bg-slate-800/50 rounded-xl p-6 border border-gray-200 dark:border-slate-700">
            <h3 className="font-medium text-gray-900 dark:text-white mb-2">Built With</h3>
            <div className="flex flex-wrap gap-2">
              {['React 19', 'TypeScript', 'Tailwind CSS 4', 'Vite 6'].map((tech) => (
                <span key={tech} className="px-3 py-1.5 bg-white dark:bg-slate-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Demo Mode Banner */}
          {isDemoMode && (
            <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-xl p-4 mb-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                <span className="px-2 py-0.5 bg-primary-600 text-white text-xs font-semibold rounded-full">
                  DEMO MODE
                </span>
                <p className="text-sm text-primary-800 dark:text-primary-300">
                  You're viewing sample data. Upload your own bank CSV to analyze your real transactions.
                </p>
                <button
                  onClick={handleClearData}
                  className="sm:ml-auto text-sm text-primary-700 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-200 font-medium"
                >
                  Exit Demo
                </button>
              </div>
            </div>
          )}

          {/* Summary Header */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 mb-6 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  Transaction Analysis
                  {isDemoMode && (
                    <span className="px-2 py-0.5 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-xs font-semibold rounded-full">
                      DEMO
                    </span>
                  )}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {fileName} • {selectedPeriod ? `${periodFilteredTransactions.length} of ${transactions.length}` : transactions.length} transactions
                  {selectedPeriod && (
                    <span className="ml-2 text-primary-600 dark:text-primary-400">({selectedPeriod.label})</span>
                  )}
                </p>
              </div>
              <button
                onClick={handleClearData}
                className="px-4 py-2 text-sm border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                {isDemoMode ? 'Exit Demo' : 'Upload New File'}
              </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Expenses</p>
                <p className="text-xl font-semibold text-danger-600 dark:text-danger-400">
                  -{totalExpenses.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Income</p>
                <p className="text-xl font-semibold text-success-600 dark:text-success-400">
                  +{totalIncome.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400">Net Change</p>
                <p className={`text-xl font-semibold ${totalIncome - totalExpenses >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                  {(totalIncome - totalExpenses) >= 0 ? '+' : ''}
                  {(totalIncome - totalExpenses).toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                </p>
              </div>
              {/* Categorized / Uncategorized Stats */}
              <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Categorization</p>
                <div className="flex gap-2">
                  <div className="flex-1 bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 rounded-lg p-2 text-center">
                    <p className="text-lg font-semibold text-success-700 dark:text-success-400">{stats.categorized}</p>
                    <p className="text-xs text-success-600 dark:text-success-500">Categorized</p>
                  </div>
                  <button
                    onClick={() => setShowUncategorizedCarousel(true)}
                    disabled={stats.uncategorized === 0}
                    className={`flex-1 rounded-lg p-2 text-center transition-all ${
                      stats.uncategorized > 0
                        ? 'bg-warning-50 dark:bg-warning-900/30 border border-warning-300 dark:border-warning-700 hover:border-warning-400 dark:hover:border-warning-600 hover:shadow-sm cursor-pointer'
                        : 'bg-gray-100 dark:bg-slate-600/50 border border-gray-200 dark:border-slate-600 cursor-default'
                    }`}
                  >
                    <p className={`text-lg font-semibold ${stats.uncategorized > 0 ? 'text-warning-700 dark:text-warning-400' : 'text-gray-400 dark:text-gray-500'}`}>
                      {stats.uncategorized}
                    </p>
                    <p className={`text-xs ${stats.uncategorized > 0 ? 'text-warning-600 dark:text-warning-500' : 'text-gray-400 dark:text-gray-500'}`}>
                      {stats.uncategorized > 0 ? 'Fix now →' : 'None'}
                    </p>
                  </button>
                </div>
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
          <div className="grid lg:grid-cols-5 gap-6">
            {/* Visualization Panel - 2/5 width */}
            <div className="lg:col-span-2">
              <SpendingVisualization
                transactions={filteredTransactions}
                selectedPeriod={selectedPeriod}
                allTransactions={transactions}
              />
            </div>

            {/* Transaction List - 3/5 width */}
            <div className="lg:col-span-3">
              <TransactionList
                transactions={filteredTransactions}
                onTransactionClick={handleTransactionClick}
              />
            </div>
          </div>
        </>
      )}
    </>
  )

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <Header
        isDark={isDark}
        onToggleDark={toggleDark}
        onOpenSettings={() => setShowSettingsPanel(true)}
        currentRoute={route}
        onNavigate={navigate}
        hasData={transactions.length > 0}
        onReset={handleClearData}
        onExport={() => setShowExportDialog(true)}
      />

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8">
        {renderPage()}
      </main>

      {/* Footer */}
      <Footer onNavigate={navigate} />

      {/* Categories Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Category System</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {defaultCategories.length} categories • {totalSubcategories} subcategories • {defaultCategoryMappings.length} merchant mappings
                </p>
              </div>
              <button
                onClick={() => setShowCategoriesModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-120px)]">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {defaultCategories.map((category) => (
                  <div
                    key={category.id}
                    className="border border-gray-200 dark:border-slate-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-slate-600 transition-colors"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-lg"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        {category.icon}
                      </span>
                      <div>
                        <h3 className="font-medium text-gray-900 dark:text-white">{category.name}</h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{category.subcategories.length} subcategories</p>
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
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-slate-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">CSV Parser Specification</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Swedish bank export format (Swedbank/SEB style)</p>
              </div>
              <button
                onClick={() => setShowCsvInfoModal(false)}
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
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">File Format</h3>
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
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Expected Columns</h3>
                <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-slate-700/50">
                      <tr>
                        <th className="text-left px-4 py-2 font-medium text-gray-700 dark:text-gray-300">Swedish Header</th>
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
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Amount Convention</h3>
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
                <h3 className="font-medium text-gray-900 dark:text-white mb-3">Example Row</h3>
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

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        settings={appSettings}
        onSettingsChange={setAppSettings}
      />

      {/* Transaction Edit Modal */}
      {editingTransaction && (
        <TransactionEditModal
          transaction={editingTransaction}
          isOpen={true}
          onClose={() => setEditingTransaction(null)}
          onSave={handleCategoryChange}
        />
      )}

      {/* Uncategorized Carousel */}
      <UncategorizedCarousel
        transactions={transactions}
        isOpen={showUncategorizedCarousel}
        onClose={() => setShowUncategorizedCarousel(false)}
        onCategorize={handleCategoryChange}
      />

      {/* CSV Confirmation Dialog */}
      {pendingFileContent && pendingFileName && (
        <CsvConfirmationDialog
          isOpen={showCsvConfirmation}
          onClose={handleCsvCancel}
          onConfirm={handleCsvConfirm}
          fileContent={pendingFileContent}
          fileName={pendingFileName}
          maxTransactionLimit={appSettings.maxTransactionLimit}
          preferredBank={appSettings.preferredBank}
        />
      )}

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        transactions={transactions}
        filteredTransactions={filteredTransactions}
      />
    </div>
  )
}

export default App

import { useState, useEffect, useTransition, useMemo, useCallback, useRef } from 'react'
import './index.css'
import { defaultCategories } from './data/categories'
import { defaultCategoryMappings } from './data/category-mappings'
import { FileUpload, TransactionList, FilterPanel, defaultFilters, ProjectRoadmap, SpendingVisualization, SettingsPanel, loadSettings, TransactionEditModal, UncategorizedCarousel, CsvConfirmationDialog, ExportDialog, SubscriptionConfirmationDialog, SubscriptionPanel, SubscriptionCard, SubscriptionEditModal, ErrorBoundary, LoadingOverlay, MappingRulesModal, AddMappingRuleModal, BulkCategoryModal, SuspiciousTransactionsDialog, OnboardingModal, DebugPanel, ReportsPanel, TipsCarousel, ResetConfirmationDialog, TabNavigation } from './components'
import type { DashboardTab } from './components'
import { SectionErrorBoundary } from './components/SectionErrorBoundary'
import { AddSubcategoryModal } from './components/AddSubcategoryModal'
import { CategorySystemModal } from './components/CategorySystemModal'
import { CsvParserSpecModal } from './components/CsvParserSpecModal'
import { getAllCategoriesWithCustomSubcategories, getCustomSubcategories, removeCustomSubcategory, getCustomMappings } from './utils/category-service'
import type { TimePeriod, AppSettings } from './components'
import { parseTransactionsFromCSV, categorizeTransactions, getCategorizedStats } from './utils'
import { useTransactionFilters, useTimePeriodFilter, useOnboarding, useKeyboardShortcuts } from './hooks'
import { useDarkMode } from './hooks/useDarkMode'
import { useHashRouter } from './hooks/useHashRouter'
import type { Transaction, TransactionFilters, DetectedSubscription, Subscription } from './types/transaction'
import type { CsvParseError, CsvConfig, ColumnMapping, BankId } from './types/csv'
import { parseCSV, convertToTransactions } from './utils/csv-parser'
import { Header } from './components/layout/Header'
import { Footer } from './components/layout/Footer'
import { AdPlaceholder } from './components/ui/AdPlaceholder'
import { FeaturesPage, HowItWorksPage, AboutPage, PrivacyPage, DisclaimerPage } from './pages'
import { preloadIconSet } from './config/icon-sets'
import { detectSubscriptions, createSubscription, markTransactionsAsRecurring, loadSubscriptions, saveSubscriptions, debugSubscriptionDetection } from './utils/subscription-detection'
import { validateTransactions, applyDismissedStatus, saveDismissedWarnings, getDismissedWarnings, getSuspiciousWarningId, markSuspiciousTransactions, removeSuspiciousBadge } from './utils/transaction-validation'
import type { RecurringType, SuspiciousTransaction } from './types/transaction'
import type { AIInsightsResponse } from './types/insights'
import { AIInsightsPanel } from './components/AIInsightsPanel'
import { useToast } from './context/ToastContext'
import { saveTransactions, loadTransactions, clearTransactions } from './utils/transaction-persistence'

// Expose debug function globally for browser console access
declare global {
  interface Window {
    debugSubscription?: (searchTerm: string) => void;
    getTransactions?: () => Transaction[];
  }
}

function App() {
  const [showCategoriesModal, setShowCategoriesModal] = useState(false)
  const [showCsvInfoModal, setShowCsvInfoModal] = useState(false)
  const [showSettingsPanel, setShowSettingsPanel] = useState(false)
  const [showUncategorizedCarousel, setShowUncategorizedCarousel] = useState(false)
  const [showCsvConfirmation, setShowCsvConfirmation] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [showSubscriptionConfirmation, setShowSubscriptionConfirmation] = useState(false)
  const [showResetConfirmation, setShowResetConfirmation] = useState(false)
  const [showAddSubcategoryModal, setShowAddSubcategoryModal] = useState(false)
  const [customSubcategoriesVersion, setCustomSubcategoriesVersion] = useState(0)
  const [showMappingRulesModal, setShowMappingRulesModal] = useState(false)
  const [showAddMappingRuleModal, setShowAddMappingRuleModal] = useState(false)
  const [customMappingsVersion, setCustomMappingsVersion] = useState(0)
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false)
  const [showSuspiciousDialog, setShowSuspiciousDialog] = useState(false)
  const [showDebugPanel, setShowDebugPanel] = useState(false)
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set())
  const [suspiciousTransactions, setSuspiciousTransactions] = useState<SuspiciousTransaction[]>([])
  const [pendingFileContent, setPendingFileContent] = useState<string | null>(null)
  const [pendingFileName, setPendingFileName] = useState<string | null>(null)
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null)
  const [appSettings, setAppSettings] = useState<AppSettings>(() => loadSettings())
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() => loadSubscriptions())
  const [detectedSubscriptions, setDetectedSubscriptions] = useState<DetectedSubscription[]>([])
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null)
  const [activeTab, setActiveTab] = useState<DashboardTab>(() => {
    // Load last used tab from localStorage
    const savedTab = localStorage.getItem('wdtmg_active_tab') as DashboardTab | null
    return savedTab && ['overview', 'transactions', 'subscriptions', 'reports', 'insights'].includes(savedTab)
      ? savedTab
      : 'overview'
  })
  const [isPending, startTransition] = useTransition()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<CsvParseError | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [isDemoMode, setIsDemoMode] = useState(false)
  const [filters, setFilters] = useState<TransactionFilters>(defaultFilters)
  const [selectedPeriod, setSelectedPeriod] = useState<TimePeriod | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [aiInsights, setAiInsights] = useState<AIInsightsResponse | null>(null)

  // Hooks
  const { isDark, toggleDark, setMode } = useDarkMode()
  const { route, navigate } = useHashRouter()
  const toast = useToast()
  const {
    isOnboardingOpen,
    hasCompletedOnboarding,
    completeOnboarding,
    skipOnboarding,
    resetOnboarding,
  } = useOnboarding()

  // Ref for search input to focus with keyboard shortcut
  const searchInputRef = useRef<HTMLInputElement>(null)
  // Ref to prevent duplicate toast in StrictMode
  const hasShownRestoreToast = useRef(false)

  // Keyboard shortcuts
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: 'f',
        ctrl: true,
        action: () => {
          // Switch to transactions tab and focus search
          if (transactions.length > 0) {
            setActiveTab('transactions')
            // Small delay to allow tab switch before focusing
            setTimeout(() => searchInputRef.current?.focus(), 100)
          }
        },
        description: 'Search transactions',
      },
      {
        key: 's',
        ctrl: true,
        shift: true,
        action: () => setShowSettingsPanel(true),
        description: 'Open settings',
      },
      {
        key: 'e',
        ctrl: true,
        action: () => {
          if (transactions.length > 0) {
            setShowExportDialog(true)
          }
        },
        description: 'Export data',
      },
      {
        key: '1',
        alt: true,
        action: () => transactions.length > 0 && setActiveTab('overview'),
        description: 'Go to Overview',
      },
      {
        key: '2',
        alt: true,
        action: () => transactions.length > 0 && setActiveTab('transactions'),
        description: 'Go to Transactions',
      },
      {
        key: '3',
        alt: true,
        action: () => transactions.length > 0 && setActiveTab('subscriptions'),
        description: 'Go to Subscriptions',
      },
    ],
    enabled: route === 'home' && !showSettingsPanel && !showExportDialog && !editingTransaction,
  })

  // Sync theme with settings
  useEffect(() => {
    setMode(appSettings.theme)
  }, [appSettings.theme, setMode])

  // Apply accessibility settings to HTML element
  useEffect(() => {
    const html = document.documentElement
    // Reduce motion
    if (appSettings.reduceMotion) {
      html.classList.add('reduce-motion')
    } else {
      html.classList.remove('reduce-motion')
    }
    // High contrast
    if (appSettings.highContrast) {
      html.classList.add('high-contrast')
    } else {
      html.classList.remove('high-contrast')
    }
  }, [appSettings.reduceMotion, appSettings.highContrast])

  // Load saved transactions on mount
  useEffect(() => {
    const { transactions: savedTransactions, metadata } = loadTransactions()
    if (savedTransactions.length > 0 && metadata) {
      setTransactions(savedTransactions)
      setFileName(metadata.fileName)
      setIsDemoMode(metadata.isDemoMode)
      setLastUpdated(metadata.savedAt)
      // Prevent duplicate toast in StrictMode (effect runs twice in dev)
      if (!hasShownRestoreToast.current) {
        hasShownRestoreToast.current = true
        toast.info(`Restored ${savedTransactions.length} transactions from your last session`)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // Only run on mount

  // Auto-save transactions when they change
  useEffect(() => {
    if (transactions.length > 0) {
      saveTransactions(transactions, fileName, isDemoMode)
      setLastUpdated(new Date().toISOString())
    }
  }, [transactions, fileName, isDemoMode])

  // Preload icons when icon set changes
  useEffect(() => {
    if (appSettings.iconSet !== 'emoji') {
      preloadIconSet(appSettings.iconSet)
    }
  }, [appSettings.iconSet])

  // Switch away from subscriptions tab if placement is set to 'overview' only
  useEffect(() => {
    if (activeTab === 'subscriptions' && appSettings.subscriptionPlacement === 'overview') {
      setActiveTab('overview')
    }
  }, [activeTab, appSettings.subscriptionPlacement])

  // Save active tab to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('wdtmg_active_tab', activeTab)
  }, [activeTab])

  // Expose debug functions globally for browser console access
  useEffect(() => {
    window.debugSubscription = (searchTerm: string) => {
      debugSubscriptionDetection(transactions, searchTerm)
    }
    window.getTransactions = () => transactions

    // Cleanup to prevent memory leaks from stale closures
    return () => {
      delete window.debugSubscription
      delete window.getTransactions
    }
  }, [transactions])

  // Apply time period filter first
  const { periodFilteredTransactions } = useTimePeriodFilter(
    transactions,
    selectedPeriod
  )

  // Then apply regular filters on top
  const { filteredTransactions, totalCount, filteredCount } = useTransactionFilters(
    periodFilteredTransactions,
    filters
  )

  // Get all categories with custom subcategories merged in
  const allCategories = useMemo(() =>
    getAllCategoriesWithCustomSubcategories(),
    [customSubcategoriesVersion]
  )

  // Memorize subcategory count calculation
  const totalSubcategories = useMemo(() =>
    allCategories.reduce((sum, cat) => sum + cat.subcategories.length, 0),
    [allCategories]
  )

  // Get custom subcategories for display
  const customSubcategories = useMemo(() =>
    getCustomSubcategories(),
    [customSubcategoriesVersion]
  )

  // Get custom mapping rules count for display
  const customMappingRulesCount = useMemo(() =>
    getCustomMappings().length,
    [customMappingsVersion]
  )

  // Handle custom subcategory deletion
  const handleDeleteCustomSubcategory = useCallback((id: string) => {
    removeCustomSubcategory(id)
    setCustomSubcategoriesVersion(v => v + 1)
    toast.info('Custom subcategory deleted')
  }, [toast])

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
        setIsLoading(false)
        setPendingFileContent(null)
        setPendingFileName(null)
      } else {
        // Limit transactions based on settings
        const limitedResult = {
          ...result,
          rows: result.rows.slice(0, appSettings.maxTransactionLimit),
          rowCount: Math.min(result.rowCount, appSettings.maxTransactionLimit),
        }
        const parsedTransactions = convertToTransactions(limitedResult, mapping, bank)
        const categorized = categorizeTransactions(parsedTransactions)

        // Set transactions first, then detect subscriptions
        setTransactions(categorized)
        setPendingFileContent(null)
        setPendingFileName(null)

        // Detect subscriptions and validate transactions (with a small delay for UI to update)
        setTimeout(() => {
          const detected = detectSubscriptions(categorized)

          // Validate transactions for suspicious patterns (if enabled in settings)
          if (appSettings.enableSuspiciousDetection) {
            const validation = validateTransactions(categorized)
            const suspiciousWithDismissed = applyDismissedStatus(validation.suspicious)
            setSuspiciousTransactions(suspiciousWithDismissed)

            // Mark suspicious transactions with badges
            const withSuspiciousBadges = markSuspiciousTransactions(categorized, suspiciousWithDismissed)
            setTransactions(withSuspiciousBadges)

            // Show suspicious warning if there are undismissed issues
            const undismissedCount = suspiciousWithDismissed.filter(s => !s.isDismissed).length
            if (undismissedCount > 0) {
              toast.warning(`${undismissedCount} potentially suspicious transaction${undismissedCount !== 1 ? 's' : ''} found`)
            }
          }

          setIsLoading(false)
          toast.success(`Successfully imported ${categorized.length} transactions`)

          if (detected.length > 0) {
            setDetectedSubscriptions(detected)
            setShowSubscriptionConfirmation(true)
          }
        }, 100)
      }
    }, 300)
  }

  const handleSubscriptionConfirm = (
    confirmedWithTypes: Array<{ id: string; type: RecurringType }>,
    _rejectedIds: string[]
  ) => {
    setShowSubscriptionConfirmation(false)

    // Build a map of detected subscription ID to its type
    const typeMap = new Map(confirmedWithTypes.map(c => [c.id, c.type]))

    // Create subscription objects from confirmed detections with their types
    const newSubscriptions: Subscription[] = detectedSubscriptions
      .filter(d => typeMap.has(d.id))
      .map(d => {
        // Set the recurringType on the detected subscription before creating
        const detectedWithType = { ...d, recurringType: typeMap.get(d.id)! }
        return createSubscription(detectedWithType)
      })

    // Build a map of transaction IDs to their recurring type
    const recurringTransactionIds = new Map<string, RecurringType>()
    newSubscriptions.forEach(sub => {
      sub.transactionIds.forEach(txId => {
        recurringTransactionIds.set(txId, sub.recurringType)
      })
    })

    // Mark transactions with appropriate badges
    const updatedTransactions = markTransactionsAsRecurring(transactions, recurringTransactionIds)

    // Update state
    setTransactions(updatedTransactions)
    setSubscriptions(prev => {
      const updated = [...prev, ...newSubscriptions]
      saveSubscriptions(updated)
      return updated
    })
    setDetectedSubscriptions([])
    if (newSubscriptions.length > 0) {
      toast.success(`Added ${newSubscriptions.length} recurring ${newSubscriptions.length === 1 ? 'expense' : 'expenses'}`)
    }
  }

  const handleSubscriptionCancel = () => {
    setShowSubscriptionConfirmation(false)
    setDetectedSubscriptions([])
  }

  const handleClearSubscriptions = () => {
    // Clear subscriptions from state
    setSubscriptions([])
    // Clear from localStorage
    saveSubscriptions([])
    // Also clear isSubscription flag and recurring badges from transactions
    setTransactions(prev => prev.map(t => ({
      ...t,
      isSubscription: false,
      badges: t.badges.filter(b => b.type !== 'subscription' && b.type !== 'fixed')
    })))
    toast.info('All recurring expenses have been cleared')
  }

  const handleClearAllData = () => {
    // Clear transactions
    setTransactions([])
    clearTransactions()

    // Clear subscriptions
    setSubscriptions([])
    saveSubscriptions([])

    // Clear custom mapping rules
    localStorage.removeItem('custom_mapping_rules')
    setCustomMappingsVersion(v => v + 1)

    // Clear custom subcategories
    localStorage.removeItem('custom_subcategories')
    setCustomSubcategoriesVersion(v => v + 1)

    // Reset settings to defaults
    const defaultSettings = loadSettings()
    setAppSettings({ ...defaultSettings, debugMode: false, reduceMotion: false, highContrast: false })

    // Clear other state
    setFileName(null)
    setIsDemoMode(false)
    setLastUpdated(null)
    setSelectedPeriod(null)
    setBulkSelectedIds(new Set())

    // Reset onboarding
    resetOnboarding()

    toast.success('All data has been cleared')
  }

  // Debug panel handlers for selective reset
  const handleClearTransactionsOnly = () => {
    setTransactions([])
    clearTransactions()
    setFileName(null)
    setIsDemoMode(false)
    setLastUpdated(null)
    setSelectedPeriod(null)
    setBulkSelectedIds(new Set())
    toast.info('Transactions cleared')
  }

  const handleClearSubscriptionsOnly = () => {
    setSubscriptions([])
    saveSubscriptions([])
    // Also clear isSubscription flag from transactions
    setTransactions(prev => prev.map(t => ({
      ...t,
      isSubscription: false,
      badges: t.badges.filter(b => b.type !== 'subscription' && b.type !== 'fixed')
    })))
    toast.info('Subscriptions cleared')
  }

  const handleResetSettingsOnly = () => {
    const defaultSettings = loadSettings()
    setAppSettings({ ...defaultSettings })
    localStorage.removeItem('app_settings')
    toast.info('Settings reset to defaults')
  }

  // Force error for testing error boundaries
  const [forceError, setForceError] = useState(false)
  const handleForceError = () => {
    setForceError(true)
  }

  // If forceError is triggered, throw to test error boundary
  if (forceError) {
    throw new Error('Forced error for testing error boundaries')
  }

  const handleEditSubscription = (subscription: Subscription) => {
    setEditingSubscription(subscription)
  }

  const handleSaveSubscription = (updated: Subscription) => {
    setSubscriptions(prev => {
      const newSubscriptions = prev.map(s => s.id === updated.id ? updated : s)
      saveSubscriptions(newSubscriptions)
      return newSubscriptions
    })
    toast.success('Recurring expense updated')
  }

  const handleDeleteSubscription = (subscriptionId: string) => {
    setSubscriptions(prev => {
      // Find the subscription to get its transaction IDs
      const toDelete = prev.find(s => s.id === subscriptionId)
      if (toDelete) {
        // Clear isSubscription flag from related transactions
        const transactionIdsToUpdate = new Set(toDelete.transactionIds)
        setTransactions(transactions => transactions.map(t => {
          if (transactionIdsToUpdate.has(t.id)) {
            return {
              ...t,
              isSubscription: false,
              badges: t.badges.filter(b => b.type !== 'subscription')
            }
          }
          return t
        }))
      }
      const newSubscriptions = prev.filter(s => s.id !== subscriptionId)
      saveSubscriptions(newSubscriptions)
      return newSubscriptions
    })
    toast.info('Recurring expense deleted')
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
        toast.success('Demo data loaded successfully')
      }
    } catch {
      setError({
        type: 'invalid_format',
        message: 'Failed to load demo data',
        details: 'Please try again or upload your own CSV file',
      })
      setIsDemoMode(false)
      toast.error('Failed to load demo data')
    }
    setIsLoading(false)
  }

  const handleError = (err: CsvParseError) => {
    setError(err)
    setTransactions([])
    toast.error(err.message)
  }

  const handleClearData = () => {
    // Show confirmation dialog if there are subscriptions
    if (subscriptions.length > 0) {
      setShowResetConfirmation(true)
    } else {
      // No subscriptions, just reset data
      performReset(false)
    }
  }

  const performReset = (alsoResetSubscriptions: boolean) => {
    setTransactions([])
    setError(null)
    setFileName(null)
    setIsDemoMode(false)
    setFilters(defaultFilters)
    setSelectedPeriod(null)
    setActiveTab('overview')
    setShowResetConfirmation(false)
    clearTransactions() // Clear from localStorage

    if (alsoResetSubscriptions) {
      setSubscriptions([])
      saveSubscriptions([])
      toast.info('All data has been reset')
    } else {
      toast.info('Transaction data cleared')
    }
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

  const handleBatchCategoryChange = (transactionIds: string[], categoryId: string, subcategoryId: string) => {
    const idSet = new Set(transactionIds)
    setTransactions(prevTransactions =>
      prevTransactions.map(t => {
        if (idSet.has(t.id)) {
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

  const handleExcludeToggle = (transactionId: string, isExcluded: boolean) => {
    setTransactions(prevTransactions =>
      prevTransactions.map(t =>
        t.id === transactionId ? { ...t, isExcluded } : t
      )
    )
  }

  // Suspicious transaction handlers
  const handleDismissSuspicious = (warningId: string) => {
    // Update state
    setSuspiciousTransactions(prev => {
      const updated = prev.map(s =>
        getSuspiciousWarningId(s) === warningId ? { ...s, isDismissed: true } : s
      )
      // Save to localStorage
      const dismissed = getDismissedWarnings()
      dismissed.add(warningId)
      saveDismissedWarnings(dismissed)
      return updated
    })

    // Remove suspicious badge from the transaction
    const [transactionId] = warningId.split('|')
    setTransactions(prev => prev.map(t => {
      if (t.id === transactionId) {
        // Check if there are other undismissed warnings for this transaction
        const otherWarnings = suspiciousTransactions.filter(
          s => s.transactionId === transactionId && getSuspiciousWarningId(s) !== warningId && !s.isDismissed
        )
        if (otherWarnings.length === 0) {
          return removeSuspiciousBadge(t)
        }
      }
      return t
    }))
  }

  const handleDismissAllSuspicious = () => {
    const dismissed = getDismissedWarnings()
    suspiciousTransactions.forEach(s => {
      if (!s.isDismissed) {
        dismissed.add(getSuspiciousWarningId(s))
      }
    })
    saveDismissedWarnings(dismissed)

    setSuspiciousTransactions(prev => prev.map(s => ({ ...s, isDismissed: true })))

    // Remove all suspicious badges
    setTransactions(prev => prev.map(t => removeSuspiciousBadge(t)))

    toast.success('All suspicious transactions marked as reviewed')
    setShowSuspiciousDialog(false)
  }

  const handleViewSuspiciousTransaction = (transactionId: string) => {
    const transaction = transactions.find(t => t.id === transactionId)
    if (transaction) {
      setEditingTransaction(transaction)
    }
  }

  // Count undismissed suspicious transactions
  const undismissedSuspiciousCount = useMemo(() =>
    suspiciousTransactions.filter(s => !s.isDismissed).length,
    [suspiciousTransactions]
  )

  // Bulk editing handlers
  const handleBulkCategorize = (categoryId: string, subcategoryId: string) => {
    const idsArray = Array.from(bulkSelectedIds)
    handleBatchCategoryChange(idsArray, categoryId, subcategoryId)
    setBulkSelectedIds(new Set())
    setShowBulkCategoryModal(false)
    toast.success(`Updated ${idsArray.length} transaction${idsArray.length !== 1 ? 's' : ''}`)}

  // Clear bulk selection when data changes
  useEffect(() => {
    setBulkSelectedIds(new Set())
  }, [transactions.length])

  const stats = getCategorizedStats(periodFilteredTransactions)

  // Memoize expensive expense/income calculations (excluding excluded transactions)
  const { totalExpenses, totalIncome } = useMemo(() => {
    // Filter out excluded transactions for all calculations
    const includedTransactions = transactions.filter(t => !t.isExcluded)

    if (selectedPeriod) {
      // Recalculate period stats excluding excluded transactions
      const periodIncluded = periodFilteredTransactions.filter(t => !t.isExcluded)
      const expenses = periodIncluded
        .filter((t) => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
      const income = periodIncluded
        .filter((t) => t.amount > 0)
        .reduce((sum, t) => sum + t.amount, 0)
      return { totalExpenses: expenses, totalIncome: income }
    }
    const expenses = includedTransactions
      .filter((t) => t.amount < 0)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    const income = includedTransactions
      .filter((t) => t.amount > 0)
      .reduce((sum, t) => sum + t.amount, 0)
    return { totalExpenses: expenses, totalIncome: income }
  }, [transactions, selectedPeriod, periodFilteredTransactions])

  // Calculate largest expense and income transaction IDs for badges (excluding excluded transactions)
  const { largestExpenseId, largestIncomeId } = useMemo(() => {
    let largestExpense: { id: string; amount: number } | null = null
    let largestIncome: { id: string; amount: number } | null = null

    for (const t of filteredTransactions) {
      // Skip excluded transactions
      if (t.isExcluded) continue

      if (t.amount < 0) {
        // Expense (negative amount) - find largest absolute value
        if (!largestExpense || Math.abs(t.amount) > Math.abs(largestExpense.amount)) {
          largestExpense = { id: t.id, amount: t.amount }
        }
      } else if (t.amount > 0) {
        // Income (positive amount) - find largest value
        if (!largestIncome || t.amount > largestIncome.amount) {
          largestIncome = { id: t.id, amount: t.amount }
        }
      }
    }

    return {
      largestExpenseId: largestExpense?.id ?? null,
      largestIncomeId: largestIncome?.id ?? null,
    }
  }, [filteredTransactions])

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
              Get started
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

           {/* Project Roadmap */}
          <ProjectRoadmap />
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

          {/* Summary Header with Tips Panel - 3:2 ratio */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 lg:gap-6 mb-6">
            {/* Transaction Analysis - 3/5 width */}
            <div className="lg:col-span-3 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    Transaction analysis
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
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total expenses</p>
                  <p className="text-lg font-semibold text-danger-600 dark:text-danger-400">
                    -{totalExpenses.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Total income</p>
                  <p className="text-lg font-semibold text-success-600 dark:text-success-400">
                    +{totalIncome.toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Net change</p>
                  <p className={`text-lg font-semibold ${totalIncome - totalExpenses >= 0 ? 'text-success-600 dark:text-success-400' : 'text-danger-600 dark:text-danger-400'}`}>
                    {(totalIncome - totalExpenses) >= 0 ? '+' : ''}
                    {(totalIncome - totalExpenses).toLocaleString('sv-SE', { minimumFractionDigits: 2 })} kr
                  </p>
                </div>
                {/* Categorized / Uncategorized Stats */}
                <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">Categorization</p>
                  <div className="flex gap-2">
                    <div className="flex-1 bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-700 rounded-lg p-1.5 text-center">
                      <p className="text-base font-semibold text-success-700 dark:text-success-300">{stats.categorized}</p>
                      <p className="text-[10px] text-success-600 dark:text-success-400">Categorized</p>
                    </div>
                    <button
                      onClick={() => setShowUncategorizedCarousel(true)}
                      disabled={stats.uncategorized === 0}
                      className={`flex-1 rounded-lg p-1.5 text-center transition-all ${
                        stats.uncategorized > 0
                          ? 'bg-warning-50 dark:bg-warning-900/30 border border-warning-300 dark:border-warning-600 hover:border-warning-400 dark:hover:border-warning-500 hover:shadow-sm cursor-pointer'
                          : 'bg-gray-100 dark:bg-slate-600/50 border border-gray-200 dark:border-slate-500 cursor-default'
                      }`}
                    >
                      <p className={`text-base font-semibold ${stats.uncategorized > 0 ? 'text-warning-700 dark:text-warning-300' : 'text-gray-400 dark:text-gray-500'}`}>
                        {stats.uncategorized}
                      </p>
                      <p className={`text-[10px] ${stats.uncategorized > 0 ? 'text-warning-600 dark:text-warning-400' : 'text-gray-400 dark:text-gray-500'}`}>
                        {stats.uncategorized > 0 ? 'Fix now →' : 'None'}
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              {/* Suspicious Transactions Warning */}
              {appSettings.enableSuspiciousDetection && undismissedSuspiciousCount > 0 && (
                <div className="mt-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-warning-100 dark:bg-warning-900/40 flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-warning-600 dark:text-warning-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-warning-800 dark:text-warning-300">
                          {undismissedSuspiciousCount} suspicious transaction{undismissedSuspiciousCount !== 1 ? 's' : ''}
                        </p>
                        <p className="text-xs text-warning-600 dark:text-warning-400">
                          Duplicates, large amounts, or unusual patterns
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowSuspiciousDialog(true)}
                      className="px-3 py-1.5 text-sm font-medium text-warning-700 dark:text-warning-300 hover:text-warning-900 dark:hover:text-warning-100 bg-warning-100 dark:bg-warning-900/40 hover:bg-warning-200 dark:hover:bg-warning-900/60 rounded-lg transition-colors flex-shrink-0"
                    >
                      Review →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Tips & Insights Carousel - 2/5 width */}
            <TipsCarousel
              stats={stats}
              totalIncome={totalIncome}
              totalExpenses={totalExpenses}
            />
          </div>

          {/* Tab Navigation with Period Selector */}
          <TabNavigation
            activeTab={activeTab}
            onTabChange={(tab) => startTransition(() => setActiveTab(tab))}
            showSubscriptionsTab={appSettings.subscriptionPlacement === 'tab' || appSettings.subscriptionPlacement === 'both'}
            subscriptionCount={subscriptions.length}
            isPending={isPending}
            transactions={transactions}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
          />

          {/* Tab Content */}
          <div className={`relative ${isPending ? 'opacity-70 pointer-events-none' : ''}`}>
          {activeTab === 'overview' && (
            <div className="animate-tab-content">
              {/* Filter Panel */}
              <SectionErrorBoundary section="filters">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  totalCount={totalCount}
                  filteredCount={filteredCount}
                />
              </SectionErrorBoundary>

              {/* Main Content: Visualization + Subscription Card */}
              <div className={`grid gap-6 ${
                (appSettings.subscriptionPlacement === 'overview' || appSettings.subscriptionPlacement === 'both')
                  ? 'lg:grid-cols-5'
                  : ''
              }`}>
                {/* Visualization Panel - 3/5 width when subscription card is shown, full width otherwise */}
                <div className={
                  (appSettings.subscriptionPlacement === 'overview' || appSettings.subscriptionPlacement === 'both')
                    ? 'lg:col-span-3'
                    : ''
                }>
                  <SectionErrorBoundary section="visualization">
                    <SpendingVisualization
                      transactions={filteredTransactions}
                      selectedPeriod={selectedPeriod}
                      allTransactions={transactions}
                    />
                  </SectionErrorBoundary>
                </div>

                {/* Subscription Card (Option 3) - 2/5 width, shown based on placement setting */}
                {(appSettings.subscriptionPlacement === 'overview' || appSettings.subscriptionPlacement === 'both') && (
                  <div className="lg:col-span-2">
                    <SectionErrorBoundary section="subscriptions">
                      <SubscriptionCard
                        subscriptions={subscriptions}
                        transactions={transactions}
                        onViewAll={() => setActiveTab('subscriptions')}
                      />
                    </SectionErrorBoundary>
                  </div>
                )}
              </div>

            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="animate-tab-content">
              {/* Filter Panel */}
              <SectionErrorBoundary section="filters">
                <FilterPanel
                  filters={filters}
                  onFiltersChange={setFilters}
                  totalCount={totalCount}
                  filteredCount={filteredCount}
                  searchInputRef={searchInputRef}
                />
              </SectionErrorBoundary>

              {/* Transaction List - Full width */}
              <SectionErrorBoundary section="transactions">
                <TransactionList
                  transactions={filteredTransactions}
                  onTransactionClick={handleTransactionClick}
                  pageSize={appSettings.transactionPageSize}
                  bulkEditEnabled={appSettings.enableBulkEditing}
                  selectedIds={bulkSelectedIds}
                  onSelectionChange={setBulkSelectedIds}
                  onBulkCategorize={() => setShowBulkCategoryModal(true)}
                  lastUpdated={lastUpdated}
                  onCategoryChange={handleCategoryChange}
                  largestExpenseId={largestExpenseId}
                  largestIncomeId={largestIncomeId}
                  debugMode={appSettings.debugMode}
                />
              </SectionErrorBoundary>
            </div>
          )}

          {activeTab === 'subscriptions' && (appSettings.subscriptionPlacement === 'tab' || appSettings.subscriptionPlacement === 'both') && (
            <div className="animate-tab-content">
              <SectionErrorBoundary section="subscriptions">
                <SubscriptionPanel
                  subscriptions={subscriptions}
                  transactions={transactions}
                  viewMode={appSettings.subscriptionViewVariation}
                  onEditSubscription={handleEditSubscription}
                />
              </SectionErrorBoundary>
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="animate-tab-content">
              <SectionErrorBoundary section="reports">
                <ReportsPanel
                  transactions={transactions}
                  onExport={() => setShowExportDialog(true)}
                />
              </SectionErrorBoundary>
            </div>
          )}

          {activeTab === 'insights' && (
            <div className="animate-tab-content">
              <SectionErrorBoundary section="insights">
                <AIInsightsPanel
                  transactions={periodFilteredTransactions}
                  subscriptions={subscriptions}
                  aiProvider={appSettings.aiProvider}
                  aiApiKey={appSettings.aiApiKey}
                  onOpenSettings={() => setShowSettingsPanel(true)}
                  useMockAI={appSettings.useMockAI}
                  insights={aiInsights}
                  onInsightsChange={setAiInsights}
                />
              </SectionErrorBoundary>
            </div>
          )}
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

      {/* Main Content with Side Ads */}
      <div className="flex-1 flex justify-center gap-8 xl:gap-12 px-4 py-8">
        {/* Left Ad Column */}
        {appSettings.showAds && <AdPlaceholder position="left" />}

        {/* Main Content */}
        <main className="max-w-7xl w-full">
          <ErrorBoundary>
            {renderPage()}
          </ErrorBoundary>
        </main>

        {/* Right Ad Column */}
        {appSettings.showAds && <AdPlaceholder position="right" />}
      </div>

      {/* Footer */}
      <Footer onNavigate={navigate} />

      {/* Categories Modal */}
      {showCategoriesModal && (
        <CategorySystemModal
          isOpen={showCategoriesModal}
          onClose={() => setShowCategoriesModal(false)}
          allCategories={allCategories}
          customSubcategories={customSubcategories}
          defaultCategoryMappings={defaultCategoryMappings}
          defaultCategories={defaultCategories}
          totalSubcategories={totalSubcategories}
          onAddSubcategory={() => setShowAddSubcategoryModal(true)}
          onDeleteCustomSubcategory={handleDeleteCustomSubcategory}
        />
      )}

      {/* CSV Parser Info Modal */}
      <CsvParserSpecModal
        isOpen={showCsvInfoModal}
        onClose={() => setShowCsvInfoModal(false)}
      />

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettingsPanel}
        onClose={() => setShowSettingsPanel(false)}
        settings={appSettings}
        onSettingsChange={setAppSettings}
        subscriptionCount={subscriptions.length}
        onClearSubscriptions={handleClearSubscriptions}
        customMappingRulesCount={customMappingRulesCount}
        onOpenMappingRules={() => {
          setShowSettingsPanel(false)
          setShowMappingRulesModal(true)
        }}
        onResetOnboarding={resetOnboarding}
        hasCompletedOnboarding={hasCompletedOnboarding}
        onClearAllData={handleClearAllData}
        transactionCount={transactions.length}
      />

      {/* Transaction Edit Modal */}
      {editingTransaction && (
        <TransactionEditModal
          transaction={editingTransaction}
          isOpen={true}
          onClose={() => setEditingTransaction(null)}
          onSave={handleCategoryChange}
          allTransactions={transactions}
          onBatchSave={handleBatchCategoryChange}
          onExcludeToggle={handleExcludeToggle}
        />
      )}

      {/* Subscription Edit Modal */}
      <SubscriptionEditModal
        subscription={editingSubscription}
        isOpen={editingSubscription !== null}
        onClose={() => setEditingSubscription(null)}
        onSave={handleSaveSubscription}
        onDelete={handleDeleteSubscription}
      />

      {/* Uncategorized Carousel */}
      <UncategorizedCarousel
        transactions={transactions}
        isOpen={showUncategorizedCarousel}
        onClose={() => setShowUncategorizedCarousel(false)}
        onCategorize={handleCategoryChange}
        onBatchCategorize={handleBatchCategoryChange}
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
        />
      )}

      {/* Subscription Confirmation Dialog */}
      <SubscriptionConfirmationDialog
        isOpen={showSubscriptionConfirmation}
        onClose={handleSubscriptionCancel}
        onConfirm={handleSubscriptionConfirm}
        detectedSubscriptions={detectedSubscriptions}
        transactions={transactions}
      />

      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        transactions={transactions}
        filteredTransactions={filteredTransactions}
        subscriptions={subscriptions}
      />

      {/* Reset Confirmation Dialog */}
      <ResetConfirmationDialog
        isOpen={showResetConfirmation}
        onClose={() => setShowResetConfirmation(false)}
        onResetKeepSubscriptions={() => performReset(false)}
        onResetEverything={() => performReset(true)}
        subscriptionCount={subscriptions.length}
      />

      {/* Add Subcategory Modal */}
      <AddSubcategoryModal
        isOpen={showAddSubcategoryModal}
        onClose={() => setShowAddSubcategoryModal(false)}
        onSubcategoryAdded={() => setCustomSubcategoriesVersion(v => v + 1)}
      />

      {/* Mapping Rules Modal */}
      <MappingRulesModal
        isOpen={showMappingRulesModal}
        onClose={() => setShowMappingRulesModal(false)}
        onAddRule={() => setShowAddMappingRuleModal(true)}
        onRulesChange={() => setCustomMappingsVersion(v => v + 1)}
      />

      {/* Add Mapping Rule Modal */}
      <AddMappingRuleModal
        isOpen={showAddMappingRuleModal}
        onClose={() => setShowAddMappingRuleModal(false)}
        onRuleAdded={() => {
          setCustomMappingsVersion(v => v + 1)
          // Re-categorize transactions with new rules if enabled
          if (appSettings.enableCustomMappingRules && transactions.length > 0) {
            const recategorized = categorizeTransactions(transactions)
            setTransactions(recategorized)
            toast.success('Transactions re-categorized with new rule')
          }
        }}
      />

      {/* Bulk Category Modal */}
      <BulkCategoryModal
        isOpen={showBulkCategoryModal}
        onClose={() => setShowBulkCategoryModal(false)}
        selectedCount={bulkSelectedIds.size}
        onApply={handleBulkCategorize}
      />

      {/* Suspicious Transactions Dialog */}
      <SuspiciousTransactionsDialog
        isOpen={showSuspiciousDialog}
        onClose={() => setShowSuspiciousDialog(false)}
        suspiciousTransactions={suspiciousTransactions}
        transactions={transactions}
        onDismiss={handleDismissSuspicious}
        onDismissAll={handleDismissAllSuspicious}
        onViewTransaction={handleViewSuspiciousTransaction}
      />

      {/* Onboarding Modal */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onComplete={completeOnboarding}
        onSkip={skipOnboarding}
      />

      {/* Debug Panel - only shown when debug mode is enabled */}
      {appSettings.debugMode && (
        <DebugPanel
          isOpen={showDebugPanel}
          onClose={() => setShowDebugPanel(false)}
          transactions={transactions}
          onClearTransactions={handleClearTransactionsOnly}
          onClearSubscriptions={handleClearSubscriptionsOnly}
          onClearSettings={handleResetSettingsOnly}
          onForceError={handleForceError}
        />
      )}

      {/* Debug Mode Floating Button - only shown when debug mode is enabled */}
      {appSettings.debugMode && !showDebugPanel && (
        <button
          onClick={() => setShowDebugPanel(true)}
          className="fixed bottom-4 right-4 z-30 p-3 bg-amber-500 hover:bg-amber-600 text-white rounded-full shadow-lg transition-all hover:scale-105"
          title="Open Debug Panel"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
          </svg>
        </button>
      )}

      {/* Loading Overlay */}
      <LoadingOverlay
        isVisible={isLoading}
        message="Processing your data..."
        subMessage="Analyzing transactions and detecting patterns"
      />
    </div>
  )
}

export default App

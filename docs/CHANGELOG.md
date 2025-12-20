# Changelog

All notable changes to this project will be documented in this file.

---

## [Unreleased] - 2025-12-21

### UI/UX Improvements

#### CSV Import Dialog
- **Layout**: Changed Delimiter and Bank settings to display side by side using flexbox layout
- **Large File Warning**: Moved warning message into File Info section with proper dark mode support (amber color scheme)

#### Subscription Management
- **Confirmation Dialog**: Fixed dark mode readability with brighter border colors (`dark:border-primary-400`, `dark:border-amber-400`) and conditional text styling based on selection state
- **Details Dialog**: Redesigned with 2-column layout - cost info (Monthly/Yearly) on left, details (Type, Billing Day, Payments, Last Paid) on right
- **Card Entries**: Subscription cards are clickable to open the details modal

#### Transaction Display
- **Title Case**: Added `toTitleCase` utility function to convert transaction descriptions to proper title case format
- Applied to: SubscriptionConfirmationDialog, SubscriptionGrid, SubscriptionList, TransactionList, UncategorizedCarousel, TransactionEditModal

#### Time Period Selector
- **Persistence**: Time period selection now persists when switching between tabs (Overview, Transactions, Subscriptions)
- Added `useEffect` to sync `activePeriodType` state with `selectedPeriod` prop

#### Summary Statistics
- **Currency Display**: Added "kr" suffix to Expenses/Income/Net boxes in TimePeriodSelector

#### Reset Functionality
- **Confirmation Dialog**: Added confirmation dialog when clicking "Start Over" that shows number of saved subscriptions
- Options to "Keep Subscriptions & Start Over" or "Reset Everything (Including Subscriptions)"

#### Spending Analysis
- **Clickable Bars**: Horizontal bar chart bars are now clickable to expand and show subcategory breakdown
- **Animations**: Added CSS keyframe animation for bar growth effect (`animate-bar-grow`)
- **Category Breakdown Table**: Subcategories now always show when expanded, regardless of view mode toggle

#### Uncategorized Dialog
- **Dark Mode**: Full dark mode support added to all elements
- **Scroll Lock**: Added `useEffect` to lock body scroll when dialog is open

#### Header & Branding
- **Taller Header**: Increased height from `h-16` to `h-20`
- **Larger Logo**: Logo icon increased from `w-10 h-10` to `w-12 h-12`, icon from `w-6 h-6` to `w-7 h-7`
- **Larger Text**: Title text increased from `text-lg` to `text-xl`, subtitle from `text-xs` to `text-sm`
- **Hover Animation**: Added `group-hover:scale-105` effect on logo

#### Browser Tab & Favicon
- **Page Title**: Updated to "Where Did The Money Go? - Privacy-First Expense Tracker"
- **Meta Description**: Added SEO-friendly description
- **Favicon**: Created custom SVG favicon with gradient teal background and bar chart icon

### New Files
- `src/utils/text-utils.ts` - Title case conversion utility
- `src/utils/date-utils.ts` - Date formatting utility with configurable formats
- `src/components/ErrorBoundary.tsx` - Error boundary component for graceful crash handling
- `public/favicon.svg` - Custom app favicon

### Bug Fixes & Stability Improvements

#### Charts
- **Division by Zero**: Fixed potential crash in `SpendingVisualization.tsx` when `displayCategories` array is empty (lines 187, 288)

#### Dark Mode
- **TransactionEditModal**: Added full dark mode support (modal background, header, borders, text colors, buttons)
- **CategorySelector**: Added dark mode support for search input, category cards, subcategory buttons, and empty state

#### Error Handling
- **ErrorBoundary**: New component wraps main content to catch and gracefully handle component crashes
- **localStorage**: Added try/catch protection to all localStorage operations across:
  - `SettingsPanel.tsx` - `saveSettings()`
  - `category-service.ts` - `saveCustomMappings()`
  - `useDarkMode.ts` - `getStoredTheme()` and `setMode()`
  - `TimePeriodSelector.tsx` - month start day load/save

#### Loading States
- **Subscription Detection**: Improved loading flow - transactions now display immediately, with subscription detection running in a separate phase

### Technical Improvements
- Added bar chart animation CSS in `src/index.css`
- Added `showResetConfirmation` state and `performReset` function in App.tsx
- Updated utility exports in `src/utils/index.ts`
- Exported `ErrorBoundary` from `src/components/index.ts`

---

## [Unreleased] - 2025-12-21 (Part 2)

### New Features

#### Transaction List Pagination
- **Pagination Controls**: Transaction list now displays transactions in pages (default: 100 per page)
- **Page Navigation**: First/Previous/Next/Last page buttons with ellipsis for large page counts
- **Page Info**: Shows "Showing X-Y of Z transactions" in toolbar
- **Settings Integration**: Added `transactionPageSize` setting to configure page size (50, 100, 200, 500)

#### Display Settings Section
- **New Settings Panel Section**: Added "Display Settings" section in SettingsPanel
- **Transactions Per Page**: Grid of buttons to select page size
- **Reorganized Settings**: Date Format moved under Display Settings section

### Performance Improvements

#### Memory Management
- **Window Debug Cleanup**: Fixed memory leak in App.tsx by adding cleanup for `window.debugSubscription` and `window.getTransactions` functions
- **Memoization**: Added `useMemo` for expensive calculations in App.tsx (`totalSubcategories`, `totalExpenses`, `totalIncome`)
- **SpendingVisualization**: Memoized expense/income filtering and calculations

#### Bug Fixes
- **Array Mutation**: Fixed direct array mutation in subscription-detection.ts using spread operator instead of push
- **Month Boundary Bug**: Fixed date boundary calculation in TimePeriodSelector when `monthStartDay` is 1
- **Currency Parsing**: Improved parseAmount in csv-parser.ts to handle various currency formats with thousands separators (e.g., "1.234,56" German format)
- **Date Parsing**: Updated parseDate to return null for invalid dates instead of silently using current date

### Accessibility Improvements

#### Modal Accessibility
- **Focus Trap Hook**: Created `useFocusTrap` hook for keyboard accessibility in modals
- **ARIA Attributes**: Added `role="dialog"`, `aria-modal="true"`, `aria-labelledby` to all modals
- **Escape Key**: All modals now close on Escape key press
- **Focus Restoration**: Focus returns to previously focused element when modals close
- Applied to: TransactionEditModal, SettingsPanel, SubscriptionEditModal, ExportDialog, UncategorizedCarousel

### UI/UX Improvements

#### Modal Animations
- **Fade In Backdrop**: Added smooth fade-in animation for modal backdrops
- **Slide Up Panel**: Added slide-up animation for modal panels
- Added CSS keyframes `fade-in` and `slide-up` in index.css

#### Responsive Design
- **UncategorizedCarousel Mobile**: Changed from side-by-side to stacked layout on mobile screens
- **Pagination Text**: Compacted pagination info for smaller screens

### New Files
- `src/hooks/useFocusTrap.ts` - Focus trap hook for modal accessibility

### Technical Improvements
- Added modal animation CSS keyframes in `src/index.css`
- Updated `src/hooks/index.ts` to export useFocusTrap
- TypeScript: Made window debug properties optional for proper cleanup support

---

## Previous Updates

### Subscription vs Recurring Expense Differentiation
- Added `RecurringType` enum ('subscription' | 'recurring_expense')
- Updated `SubscriptionConfirmationDialog` with 3-option selection (Subscription, Recurring Expense, Ignore)
- Added badge rendering for recurring expenses
- Updated SubscriptionPanel to show both subscription and recurring expense types

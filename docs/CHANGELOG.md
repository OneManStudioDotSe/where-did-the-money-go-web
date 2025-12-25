# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased] - 2025-12-25

### New Features

#### Monthly Comparison Chart
- **New MonthlyComparisonChart Component**: Compare spending across multiple months at a glance
- **Side-by-Side Bars**: Visualize expenses (and optionally income) for each month
- **Toggle Income Display**: Button to show/hide income bars alongside expenses
- **Average Line**: Dashed line showing average monthly expenses
- **Above-Average Highlighting**: Months exceeding the average are highlighted in red
- **Interactive Tooltips**: Hover/tap to see detailed breakdown (expenses, income, net, transaction count)
- **Summary Stats**: Shows average monthly spending, highest month, and lowest month
- **Mobile Responsive**: Compact labels, flexible bar widths, touch-friendly interactions
- **Integration**: Added to SpendingVisualization component below Trends section

#### Custom Mapping Rules
- **Settings Toggle**: Enable custom mapping rules from Settings → Categorization section
- **MappingRulesModal**: View, manage, and delete your custom mapping rules
- **AddMappingRuleModal**: Create new rules with pattern, match type (contains, starts with, exact, regex), category, subcategory, and priority
- **Match Types**: Supports 4 matching strategies - Contains, Starts with, Exact match, and Regex patterns
- **Priority System**: Higher priority rules are checked first; custom rules always take precedence over defaults
- **Auto Re-categorization**: When a new rule is added, existing transactions are automatically re-categorized
- **Live Preview**: See how your rule will categorize transactions before saving
- **Persistent Storage**: Rules are saved to localStorage and persist across sessions

#### Bulk Transaction Editing
- **Settings Toggle**: Enable bulk editing from Settings → Categorization section
- **Multi-Selection**: When enabled, checkboxes appear on each transaction row
- **Select Page/Deselect Page**: Quickly select or deselect all transactions on the current page
- **Clear All**: Button to clear entire selection across all pages
- **Selection Counter**: Shows how many transactions are currently selected
- **Bulk Categorize Button**: Apply a category to all selected transactions at once
- **BulkCategoryModal**: Category selector modal for applying category to selected transactions
- **Visual Feedback**: Selected rows are highlighted with a primary color background
- **Toast Notifications**: Success message confirms how many transactions were updated

---

## [Unreleased] - 2025-12-24

### New Features

#### Extended Category Mappings
- **72+ New Swedish Merchant Mappings**: Comprehensive analysis of bank transaction patterns to improve auto-categorization
  - **Cafés & Coffee Shops** (9): ESPRESSO HOUSE, CAFE, KAFÉ, KONDITORI, STARBUCKS, WAYNES, BARISTA, SIBYLLA, 7-ELEVEN
  - **Restaurants** (25): O LEARYS, MCDONALDS, MAX HAMBURGARE, PIZZA, BURGER, SUSHI, KEBAB, WOK, ASIAN, RESTAURANG, GRILL, BISTRO, EATERY, DELI, KITCHEN, FOOD COURT, STREET FOOD, and more
  - **Convenience Stores** (4): MYWAY, MY WAY, PRESSBYRÅN, PRESSBYR
  - **Entertainment Events** (5): KULTURBILJET, BILJETT, TICKET, EVENT, KONSERT
  - **Entertainment Activities** (3): BOWLING, MINIGOLF, ESCAPE
  - **Shopping Online** (7): LUXEMBOURG (Amazon), PAYPAL, KLARNA, ZETTLE, SWISH HANDEL, IZETTLE, TICTAIL
  - **Shopping Clothing** (6): KÖK (IKEA), STADIUM, INTERSPORT, XXL, JULA, BYGGMAX
  - **Shopping Hardware** (2): BAUHAUS, HORNBACH
  - **Subscriptions - Gaming** (2): GOOGLE GOOG, GOOGLE ROBLO
  - **Subscriptions - Insurance** (3): HEDVIG, T HEDVIG, BLIWA
  - **Subscriptions - Other** (2): ENKLA VARDAG, BILLMATE
  - **Parking Services** (2): EASYPARK, PARKERING
  - **Income - Salary** (2): LÖN, LON

#### Vertical Bar Chart Improvements
- **Default Chart Type**: Vertical bar chart is now the default view for Spending Analysis
- **Wider Bars**: Bar width increased from 32px to 56px for better visibility
- **Taller Chart**: Chart height increased from 150px to 180px
- **Larger Labels**: Category name labels increased from 9px to 12px with bolder font weight
- **Larger Icons**: Category emoji icons increased from base to large size
- **Better Truncation**: Category names now show up to 7 characters before truncation (was 5)

### Stability Improvements

#### Section-Level Error Boundaries
- **New SectionErrorBoundary Component**: Granular error handling for individual UI sections
- **Section-Specific Fallbacks**: Each section shows a contextual error message with its own icon and description
- **Isolated Failures**: If one section crashes, others continue working normally
- **Retry Functionality**: Users can attempt to recover individual sections without reloading the page
- **Covered Sections**:
  - Time Period Selector (📅)
  - Filter Panel (🔍)
  - Spending Visualization (📊)
  - Transaction List (📋)
  - Recurring Expenses (🔄)
  - Top Merchants (🏪)
  - AI Insights (💡)

### Mobile Responsiveness Fixes

#### Comprehensive Mobile Audit & Fixes
- **SpendingVisualization**: Responsive bar chart with flexible widths, touch-friendly tap interactions, responsive text sizing
- **TimePeriodSelector**: Grid collapses from 4 to 2 columns on mobile, responsive text and padding
- **TopMerchants**: Responsive summary grid, condensed stats on mobile, hidden non-essential info on small screens
- **Header**: Responsive height (64px mobile → 80px tablet → 96px desktop)
- **FilterPanel**: Flexible search layout, responsive filter grid (1 col mobile → 2 col tablet → 4 col desktop)

#### Key Mobile Improvements
- Reduced font sizes with responsive scaling (text-[10px] sm:text-xs patterns)
- Smaller padding/gaps on mobile (p-2 sm:p-3, gap-2 sm:gap-4)
- Touch-friendly bar chart with click-to-toggle tooltips
- Removed "kr" suffix on mobile for space savings
- Hidden less important stats (e.g., "Last transaction" date) on mobile
- Flexible widths instead of fixed (flex-1 min-w-0 max-w-[56px] instead of w-14)

### Files Modified
- `src/data/category-mappings.ts` - 72+ new merchant pattern mappings
- `src/components/SpendingVisualization.tsx` - Chart improvements + mobile responsiveness
- `src/components/SectionErrorBoundary.tsx` - New section-level error boundary component
- `src/components/TimePeriodSelector.tsx` - Mobile responsive grid and typography
- `src/components/TopMerchants.tsx` - Mobile responsive stats and merchant list
- `src/components/FilterPanel.tsx` - Mobile responsive search and filter layout
- `src/components/layout/Header.tsx` - Responsive header height
- `src/App.tsx` - Wrapped major sections with SectionErrorBoundary
- `src/components/index.ts` - Export SectionErrorBoundary

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


---

## [0.8.0] - 2025-12-21 - Custom Subcategories

### Added
- **Custom Subcategory Creation**
  - Add custom subcategories to any of the 13 default categories
  - AddSubcategoryModal with category selector and name input
  - Live preview of new subcategory before creation
  - Duplicate name validation
  - Custom subcategories persisted in localStorage

- **Category System Modal Enhancements**
  - "Add Subcategory" button in Categories & Subcategories section
  - Custom subcategory count badge (+N custom)
  - Delete button (X) for custom subcategories
  - Visual distinction for user-created items

- **CategorySelector Updates**
  - Custom subcategories now appear in transaction editing
  - "custom" badge on user-created subcategories
  - Seamless integration with existing category workflow

### Technical Details
- New localStorage key: `custom_subcategories`
- Added `isCustom` field to Subcategory interface
- New functions in category-service.ts for custom subcategory management
- Categories automatically merge default + custom subcategories

---

## [0.7.0] - 2025-12-21 - Animations & UX Polish

### Added
- **Subtle Animations Throughout**
  - Card hover lift effect with shadow enhancement
  - Button press effect (scale down on click)
  - Tab content fade/slide transitions
  - Modal backdrop fade-in and slide-up animations
  - Transaction list row hover animations
  - Subscription card hover animations
  - Settings gear icon rotation on hover
  - Uncategorized badge subtle pulse animation
  - Subcategory drill-down slide animation
  - Bar chart growth animation

- **Transaction List Pagination**
  - Configurable page sizes (50, 100, 200, 500 transactions)
  - Page size selector in Settings panel
  - Smart page number display with ellipsis
  - First/Previous/Next/Last navigation buttons
  - Auto-scroll to top on page change
  - Results count showing range (e.g., "1-100 of 500")

- **Accessibility Improvements**
  - Focus trap applied to all modals (Settings, Export, Edit, Carousel)
  - ARIA attributes on modal dialogs (role, aria-modal, aria-labelledby)
  - Keyboard navigation: Tab cycles within modal, Escape closes
  - Focus restoration on modal close

- **Responsive Design Enhancements**
  - UncategorizedCarousel stacked layout on mobile
  - Better button layouts on smaller screens

### Technical Details
- 15+ new CSS animation utilities in index.css
- Focus trap implemented via custom useFocusTrap hook
- No new npm dependencies
- All animations respect reduced-motion preferences

---

## [0.6.0] - 2025-12-19 - UI Overhaul

### Added
- **Multiple Icon Sets**
  - 4 icon sets: Emoji (default), Icons8 3D Fluency, Phosphor, OpenMoji
  - CDN-based loading for external icon sets
  - Icon set selector in settings panel
  - Universal CategoryIcon component with loading states

- **Dark Mode Support**
  - Full dark theme with slate backgrounds
  - System preference detection (prefers-color-scheme)
  - Manual toggle: Light / Dark / System
  - Smooth transitions between modes
  - All components updated with `dark:` Tailwind variants

- **Teal/Cyan Color Theme**
  - New primary color palette (teal-500: #14b8a6)
  - Consistent color application across all UI elements
  - Updated success, danger, warning color variants

- **Header & Navigation**
  - Sticky header with logo
  - Navigation links: Features, How It Works, About
  - Settings and dark mode toggle in header
  - Mobile hamburger menu with slide-out drawer

- **Footer**
  - Links: About, Disclaimer, Privacy
  - Creator info and copyright
  - Consistent styling with header

- **Content Pages**
  - Features page with feature grid
  - How It Works step-by-step guide
  - About page explaining the app
  - Privacy policy (data stays local)
  - Disclaimer page

- **Card Component**
  - Reusable Card with variants: default, elevated, interactive
  - CardHeader, CardContent, CardFooter subcomponents
  - Hover effects and shadow options

- **Hash-Based Routing**
  - SPA navigation without React Router dependency
  - Clean URL structure (#/features, #/about, etc.)

- **Settings Context**
  - App-wide settings available via React Context
  - Avoids prop drilling for theme and icon preferences

### Changed
- **Layout**: Header and footer now wrap all pages
- **Settings Panel**: Expanded with dark mode and icon set options
- **All Components**: Updated with dark mode support

### Technical Details
- No new npm dependencies (CDN-based icons)
- Hash-based routing using native browser APIs
- Context API for settings management
- ~20 files created/modified for complete UI overhaul

---

## [0.5.0] - 2025-12-19 - Manual Category Re-assignment

### Added
- **Manual Category Re-assignment**
  - Click any transaction to edit its category
  - Transaction edit modal with current/new category preview
  - Real-time UI updates after category changes

- **Category Selector Component** (`src/components/CategorySelector.tsx`)
  - Searchable category picker
  - Expandable category sections showing subcategories
  - Grid layout for subcategory selection
  - Visual indicators for selected category/subcategory

- **Uncategorized Transactions Carousel** (`src/components/UncategorizedCarousel.tsx`)
  - Paginated view of uncategorized transactions (10 per page)
  - Split view: transaction list on left, category selector on right
  - Skip/Apply workflow for efficient batch categorization
  - Progress tracking showing remaining uncategorized count
  - Auto-advance to next transaction after categorization

- **Improved Stats Panel**
  - Categorization section split into Categorized/Uncategorized counts
  - Clickable uncategorized badge opens carousel
  - Visual styling (green for categorized, warning for uncategorized)

### Technical Details
- Transaction state updates preserve all other transaction data
- Uncategorized badge removed from transaction after categorization
- No external dependencies added
- All modals use consistent design language

---

## [0.4.1] - 2025-12-19 - UI Improvements

### Added
- **Vertical Bar Chart**
  - New chart type option alongside horizontal bars and donut chart
  - Category icons displayed below bars
  - Hover tooltips showing category details

- **Settings Panel** (`src/components/SettingsPanel.tsx`)
  - Date format selection (ISO, European, US, German)
  - Month start day setting (1-28, for Swedish salary cycles)
  - Icon set selection (emoji, minimal, colorful - last two coming soon)
  - Settings persisted to localStorage

- **Info Icon Tooltip**
  - Transaction tooltips now appear on hover over (i) icon
  - Cleaner transaction row without hover effects
  - Positioned at far right of each transaction row

### Changed
- **Layout Ratio**
  - Visualization panel now takes 2/5 width
  - Transaction list now takes 3/5 width
  - Better balance for data-heavy views

### Technical Details
- Custom SVG vertical bar chart (no external library)
- Settings button in header with gear icon
- Modal-based settings panel with save/cancel
- Nested group hover for isolated tooltip behavior

---

## [0.4.0] - 2025-12-19 - Spending Visualization

### Added
- **Spending Visualization Component** (`src/components/SpendingVisualization.tsx`)
  - Side-by-side layout with transaction list on large screens
  - Toggle between Bar Chart and Donut Chart views
  - Quick stats summary (expenses, income, net change)

- **Bar Chart**
  - Horizontal bars showing spending by category
  - Percentage and transaction count display
  - Category icons and colors
  - Hover effects for highlighting

- **Donut Chart**
  - Interactive SVG-based pie chart
  - Hover state showing category details
  - Center display with total/selected amount
  - Color legend for categories

- **Trends & Averages Section**
  - Current period total vs historical average
  - Percentage change indicators (up/down arrows)
  - Transaction count comparison
  - Daily average for selected period

- **Category Totals Table**
  - Expandable category rows
  - Subcategory breakdown on expand
  - Toggle between Categories/Subcategories view
  - Amount, percentage, and count columns

- **UI Improvements**
  - Sortable transaction list columns (date, description, category, amount)
  - Sort direction indicators on column headers
  - Condensed/Expanded view toggle for transactions
  - Transaction row tooltips
  - Custom month start day setting (for Swedish salary cycles)

### Technical Details
- Custom SVG charts (no external charting library)
- Two-column responsive grid layout
- All visualizations update with time period selection
- No new external dependencies

---

## [0.3.0] - 2025-12-19 - Time Period Grouping

### Added
- **Time Period Selector**
  - View transactions by Day, Week, Month, Quarter, or Year
  - Two-step selection: choose period type, then specific period
  - Dynamic period detection from transaction data
  - Period counts shown on type buttons
  - Selected period info bar with date range
  - Clear selection functionality

- **Time Period Hook** (`src/hooks/useTimePeriodFilter.ts`)
  - Period-based transaction filtering
  - Period-specific stats calculation
  - Integrates with existing filter system

### Technical Details
- Time period filter applied before regular filters
- ISO week number calculation (Monday = first day)
- Summary stats update when period is selected
- No new external dependencies

---

## [0.2.0] - 2025-12-19 - Filtering & Search

### Added
- **Transaction Filtering & Search**
  - Real-time search by transaction description
  - Filter by category (multi-select)
  - Filter by date range (from/to picker)
  - Filter by amount range (min/max)
  - Quick filters: "Uncategorized only", "Subscriptions only"
  - Collapsible filter panel with search always visible
  - Active filter badges showing applied filters
  - Results count (X of Y transactions)
  - Clear all filters button

- **Filter Hook** (`src/hooks/useTransactionFilters.ts`)
  - Memoized filtering for performance
  - Reusable filter logic separated from UI

### Technical Details
- No external dependencies for filtering
- AND logic for all filter types
- Amount filter uses absolute value for intuitive UX
- Filters reset when loading new data

---

## Version History

### [0.1.0] - 2025-12-19 - Foundation & Core Features

#### Added
- **Project Setup**
  - Vite 6 + React 19 + TypeScript project
  - Tailwind CSS 4 with custom theme colors
  - Folder structure (components, utils, hooks, data, types)

- **Core Data Models** (`src/types/`)
  - Transaction interface with badges, category assignments
  - Category/Subcategory structures
  - CSV parsing types with column mapping
  - Filter and sort type definitions

- **Category System** (`src/data/`)
  - 13 default categories with 51 subcategories
  - 183 Swedish merchant pattern mappings
  - Priority-based matching system

- **CSV Parser** (`src/utils/csv-parser.ts`)
  - BOM removal for UTF-8 files
  - Semicolon delimiter support
  - Auto-column detection (date, amount, description, balance)
  - Swedish header name recognition
  - Transaction normalization

- **Category Service** (`src/utils/category-service.ts`)
  - Pattern matching (exact, contains, starts_with, regex)
  - Custom mapping persistence to localStorage
  - Category lookup helpers

- **UI Components**
  - FileUpload component with drag & drop
  - TransactionList with category badges
  - Interactive modals for category/CSV info
  - Summary statistics display
  - **Demo Mode** - Try the app with sample Swedish bank transactions
    - Load Demo Data button on welcome screen
    - Demo Mode banner when viewing sample data
    - Clear visual indicators (badges) throughout

- **Documentation**
  - CSV format specification (docs/CSV_FORMAT.md)
  - Category hierarchy documentation (docs/CATEGORIES.md)
  - Development log (DEVLOG.md)
  - Roadmap with progress tracking

#### Technical Details
- No external CSV parsing libraries (vanilla TypeScript)
- No state management library yet (React useState)
- Swedish locale number formatting
- Mobile-responsive layout

---

### [0.2.0] - Filtering & Charts Phase

#### Planned
- Transaction filtering by category, date, amount
- Search functionality
- Category breakdown chart
- Monthly spending trends
- Interactive chart filtering

---

### [0.3.0] - TBD - Smart Features Phase

#### Planned
- Subscription detection algorithm
- Time-based grouping (day, week, month, quarter)
- Category totals and summaries
- Enhanced filtering options

---

### [0.4.0] - TBD - User Customization Phase

#### Planned
- Custom category creation
- Manual category re-assignment
- Export functionality (CSV, JSON)
- Settings panel

---

### [0.5.0] - TBD - AI Insights Phase

#### Planned
- AI insight generation system
- Spending pattern analysis
- Savings recommendations
- Anomaly detection

---

## Release Notes Template

```markdown
### [X.Y.Z] - YYYY-MM-DD

#### Added
- New features

#### Changed
- Changes in existing functionality

#### Deprecated
- Soon-to-be removed features

#### Removed
- Removed features

#### Fixed
- Bug fixes

#### Security
- Security improvements
```

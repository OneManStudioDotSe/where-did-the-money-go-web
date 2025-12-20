# Development Roadmap - Where Did The Money Go

A detailed, iterative development plan organized into phases and iterations.

---

## Overview

```
Phase 1: Foundation          → Core setup, data models, sample data
Phase 2: Data Processing     → CSV parsing, column detection, normalization
Phase 3: Category System     → Categories, mapping, persistence
Phase 4: Core UI             → Layout, components, transaction display
Phase 5: Visualizations      → Charts, graphs, interactive displays
Phase 6: Smart Features      → Subscriptions, grouping, totals
Phase 7: User Customization  → File upload, custom categories, export
Phase 8: UI Themes & Icons   → Multiple icon sets, themes, dark mode
Phase 9: AI Insights         → Analysis, recommendations, patterns
```

---

## Phase 1: Foundation ✅
**Goal:** Establish project structure, core data models, and development environment.

### Iteration 1.1: Project Setup ✅
**Focus:** Development environment and tooling

**Tasks:**
- [x] Initialize project with Vite + React + TypeScript
- [x] Configure ESLint and Prettier
- [x] Set up path aliases (@/ for src)
- [x] Configure Tailwind CSS with custom theme
- [x] Create folder structure:
  ```
  src/
  ├── components/     # UI components
  │   ├── ui/         # Base UI elements
  │   └── features/   # Feature-specific components
  ├── hooks/          # Custom React hooks
  ├── services/       # Business logic
  ├── types/          # TypeScript interfaces
  ├── utils/          # Helper functions
  ├── data/           # Static data, constants
  └── styles/         # Global styles
  ```

**Deliverables:**
- ✅ Running development server
- ✅ Clean project structure
- ✅ Configured tooling

---

### Iteration 1.2: Core Data Models ✅
**Focus:** TypeScript interfaces for all core entities

**Tasks:**
- [x] Define `Transaction` interface
- [x] Define `Category` and `Subcategory` interfaces
- [x] Define `ColumnMapping` interface
- [x] Define `CategoryMapping` interface

**Deliverables:**
- ✅ Complete type definitions in `src/types/`
- ✅ Type exports barrel file

---

### Iteration 1.3: Sample Data & CSV Parser ✅
**Focus:** Development data for testing

**Tasks:**
- [x] Create sample CSV file with realistic transactions:
  - Various categories (groceries, utilities, entertainment, etc.)
  - Date range of 6 months
  - Mix of one-time and recurring transactions
  - Some subscription-like patterns
  - Various description formats

- [x] Create initial category definitions:
  ```
  Housing: Rent, Mortgage, Insurance, Utilities
  Transportation: Fuel, Public Transit, Parking, Maintenance
  Food: Groceries, Restaurants, Coffee, Delivery
  Shopping: Clothing, Electronics, Home Goods
  Entertainment: Streaming, Games, Events, Hobbies
  Health: Medical, Pharmacy, Fitness
  Financial: Bank Fees, Transfers, Investments
  Subscriptions: Software, Services, Memberships
  Other: Uncategorized
  ```

- [x] Create initial hardcoded mappings:
  - Common merchant names → categories
  - Pattern-based rules (e.g., "NETFLIX" → Entertainment/Streaming)

- [x] Implemented CSV Parser & File Upload early:
  - Full CSV parsing utility with BOM handling
  - Auto-column detection for Swedish bank formats
  - File upload component with drag & drop
  - Category mapping service with pattern matching
  - Transaction list component with category badges
  - Summary statistics display

---

## Phase 2: Data Processing ✅
**Goal:** Parse CSV files, detect column types, normalize transaction data.

### Iteration 2.1: CSV Parser ✅ 
**Focus:** Reading and parsing CSV content

**Tasks:**
- [x] Create CSV parsing utility:
  - Handle different delimiters (comma, semicolon, tab)
  - Parse headers
  - Handle quoted fields
  - Handle different line endings
- [x] Create ```useFileReader()``` file reader hook

**Deliverables:**
- ✅ `src/utils/csv-parser.ts`
- ✅ File upload component handles file reading

---

### Iteration 2.2: Column Detection ✅
**Focus:** Automatically identify column purposes

**Tasks:**
- [x] Create column type detector:
  - Date detection: various date formats
  - Amount detection: numeric, currency symbols
  - Description detection: longest text, non-numeric

- [x] Detection heuristics with ``` ColumnAnalysis ```

- [x] Handle ambiguous cases:
  - Multiple date columns
  - Credit/Debit separate columns
  - Missing required columns

**Deliverables:**
- ✅ `src/utils/csv-parser.ts` includes column detection
- ✅ Column mapping suggestion algorithm

---

### Iteration 2.3: Transaction Normalizer ✅
**Focus:** Convert raw CSV rows to Transaction objects

**Tasks:**
- [x] Create normalizer service:
  - Apply column mappings
  - Parse dates to Date objects
  - Parse amounts (handle negative, currency symbols)
  - Generate unique IDs
  - Preserve raw data

- [x] Handle edge cases:
  - Empty rows
  - Invalid dates
  - Non-numeric amounts
  - Missing fields

**Deliverables:**
- ✅ `src/utils/csv-parser.ts` includes transaction conversion
- ✅ Error handling and validation

---

### Iteration 2.4: CSV Import Confirmation ✅
**Focus:** Preview and confirm CSV parsing before import

**Tasks:**
- [x] Create CSV confirmation dialog component:
  - Show detected columns with types and confidence scores
  - Display column-to-field mapping (Date, Amount, Description, etc.)
  - Delimiter selection (semicolon, comma, tab)
  - Data preview (first 3 rows)
  - Required column validation with clear feedback
  - Import confirmation button with row count

**Deliverables:**
- ✅ `src/components/CsvConfirmationDialog.tsx`
- ✅ Integration with file upload flow in App.tsx

---

## Phase 3: Category System ✅
**Goal:** Implement category management and transaction categorization.

### Iteration 3.1: Category Data Structure ✅
**Focus:** Categories and subcategories definitions

**Tasks:**
- [x] Implement category service:
  - Load default categories from `src/data/categories.ts`
  - Category lookup utilities

- [x] Create category utilities:
  - `getCategoryById` - Get category by ID
  - `getSubcategoryName` - Get subcategory by ID
  - `getCategoryOptions` - Flatten category tree for dropdowns
  - `getCategoryColor`, `getCategoryIcon` - Get category display info

**Deliverables:**
- ✅ `src/utils/category-service.ts`
- ✅ `src/data/categories.ts` - 13 categories with 51 subcategories

---

### Iteration 3.2: Category Mapping Engine ✅
**Focus:** Automatic transaction categorization

**Tasks:**
- [x] Implement mapping engine:
  - Pattern matching (exact, contains, starts_with, regex)
  - Priority ordering via `getAllMappings()`
  - Custom vs default mappings support

- [x] Mapping evaluation:
  - `findCategory(description)` - Find matching category
  - `categorizeTransaction(transaction)` - Apply category to transaction
  - `categorizeTransactions(transactions[])` - Batch categorization

**Deliverables:**
- ✅ `src/utils/category-service.ts` - Mapping engine included
- ✅ `src/data/category-mappings.ts` - 183 Swedish merchant patterns

---

### Iteration 3.3: Persistence Layer ✅
**Focus:** Save user customizations locally

**Tasks:**
- [x] LocalStorage service:
  - `getCustomMappings()` / `saveCustomMappings()` - Custom mapping persistence
  - `addCustomMapping()` / `removeCustomMapping()` - CRUD operations
  - Settings persistence in `SettingsPanel.tsx`

- [x] Manual category assignments saved per-session (in React state)

**Deliverables:**
- ✅ Custom mappings persistence in `src/utils/category-service.ts`
- ✅ Settings persistence in `src/components/SettingsPanel.tsx`

---

### Iteration 3.4: Manual Assignment UI ✅
**Focus:** User interface for categorizing transactions

**Tasks:**
- [x] Category selector component:
  - Two-level dropdown (category → subcategory)
  - Search/filter categories
  - Expandable category sections
  - Click to select subcategory

- [x] Transaction edit modal for individual re-categorization
- [x] Uncategorized transactions carousel for batch categorization
- [x] Clickable uncategorized count in stats panel

**Deliverables:**
- ✅ `src/components/CategorySelector.tsx` - Reusable category picker
- ✅ `src/components/TransactionEditModal.tsx` - Individual transaction editing
- ✅ `src/components/UncategorizedCarousel.tsx` - Batch categorization workflow

---

## Phase 4: Core UI

**Goal:** Build the application shell and primary interface components.

### Iteration 4.1: Application Shell ✅
**Focus:** Layout structure and navigation

**Tasks:**
- [x] Create app layout:
  - Header with app title/logo
  - Main content area
  - Filter panel (collapsible)
  - Footer with links

- [x] Implement grid system:
  - CSS Grid-based layout
  - Variable width/height sections
  - Responsive breakpoints

- [x] Design color palette:
  - Primary: Teal/Cyan tones
  - Success/Danger colors for income/expense
  - Dark mode with slate backgrounds

- [x] "Start Over" reset button in header when data is loaded

**Deliverables:**
- ✅ `src/components/layout/Header.tsx` - With reset button
- ✅ `src/components/layout/Footer.tsx`
- ✅ Theme configuration in `src/index.css`

---

### Iteration 4.2: Transaction Components ✅
**Focus:** Display individual and lists of transactions

**Tasks:**
- [x] Transaction item component:
  - Date display
  - Amount (color-coded: expense/income)
  - Description
  - Category badge
  - Subscription badge
  - Action notes/badges

- [x] Transaction list component:
  - Sortable columns
  - Grouping headers (by date)
  - Empty state
  - Click to edit category

**Deliverables:**
- ✅ `src/components/TransactionList.tsx`

---

### Iteration 4.3: Sorting and Filtering ✅
**Focus:** Data organization controls

**Tasks:**
- [x] Sort controls:
  - By date (newest/oldest)
  - By amount (highest/lowest)
  - By category (alphabetical)
  - By description (alphabetical)

- [x] Filter controls:
  - By category
  - By date range
  - By amount range
  - Search by description

- [x] Active filter indicators

**Deliverables:**
- ✅ `src/components/TransactionList.tsx` - Sortable column headers with indicators
- ✅ `src/components/FilterPanel.tsx`
- ✅ `src/hooks/useTransactionFilters.ts`

---

### Iteration 4.4: Badge System ✅
**Focus:** Visual indicators for transaction states

**Tasks:**
- [x] Badge types:
  - Uncategorized (needs attention)
  - Subscription (recurring)
  - High value (above threshold)

- [x] Badge component:
  - Icon + label
  - Color variants
  - Tooltip with details

**Deliverables:**
- ✅ `src/components/ui/Badge.tsx` - Badge, TransactionBadges, getTransactionBadges
- ✅ Badge type definitions (BadgeType export)

---

## Phase 5: Visualizations ✅

**Goal:** Implement charts and graphical data representations.

### Iteration 5.1: Spending Visualization Component ✅
**Focus:** Custom SVG-based charts (no external library)

**Tasks:**
- [x] Bar chart for category breakdown:
  - Horizontal bars with percentage widths
  - Category icons and colors
  - Transaction count display
  - Hover effects for highlighting

- [x] Donut chart for spending distribution:
  - Interactive SVG segments
  - Hover state showing category details
  - Center display with total/selected amount
  - Color legend

- [x] Chart type toggle (bar/donut)

**Deliverables:**
- ✅ `src/components/SpendingVisualization.tsx` - Complete visualization component

---

### Iteration 5.2: Trends & Averages ✅
**Focus:** Period comparison and statistics

**Tasks:**
- [x] Current period total vs historical average
- [x] Percentage change indicators (up/down arrows)
- [x] Transaction count comparison
- [x] Daily average for selected period
- [x] Period-specific calculations based on time grouping

**Deliverables:**
- ✅ TrendSection within SpendingVisualization component

---

### Iteration 5.3: Category Totals Table ✅
**Focus:** Detailed category breakdown

**Tasks:**
- [x] Expandable category rows
- [x] Subcategory details on expand
- [x] View mode toggle (categories/subcategories)
- [x] Amount, percentage, and count columns
- [x] Sorted by spending amount

**Deliverables:**
- ✅ CategoryTotalsTable within SpendingVisualization component

---

### Iteration 5.4: Layout Integration ✅
**Focus:** Side-by-side visualization and transaction list

**Tasks:**
- [x] Two-column grid layout on large screens
- [x] Stacked layout on mobile
- [x] Both panels update with time period selection
- [x] Quick stats summary (expenses, income, net)

**Deliverables:**
- ✅ Updated App.tsx layout with grid system

---

## Phase 6: Smart Features ✅

**Goal:** Implement intelligent transaction analysis.

### Iteration 6.1: Subscription Detection ✅
**Focus:** Identify recurring transactions

**Tasks:**
- [x] Detection algorithm:
  - Group transactions by normalized recipient name
  - Check monthly recurrence (±3 days tolerance)
  - Verify amount consistency (±5% variance)
  - Require minimum 2 occurrences
  - Calculate most common billing day

- [x] Subscription confirmation dialog:
  - Shows detected subscriptions after CSV import
  - User confirms/rejects each detected subscription
  - Displays monthly total for selected subscriptions

- [x] Subscription UI components:
  - Dashboard tab for dedicated subscription view
  - Compact subscription card in Overview tab
  - Two visual variations: Accordion List (grouped by subcategory) and Card Grid
  - Toggle between List and Grid views
  - Subscription details modal with payment history

- [x] Subscription persistence:
  - Save confirmed subscriptions to localStorage
  - Mark transactions with subscription badge

- [x] Subscription management:
  - Edit subscription (name, amount, active/paused status)
  - Delete individual subscriptions
  - Clear all subscriptions from settings
  - Subscription badge on transaction list

- [x] Upcoming payments predictions:
  - Shows payments due in next 14 days
  - Color-coded urgency (Today, Tomorrow, This week)
  - Toggle between "Top subscriptions" and "Upcoming" views
  - Badge showing count of upcoming payments

**Deliverables:**
- ✅ `src/utils/subscription-detection.ts` - Detection algorithm and utilities
- ✅ `src/components/SubscriptionConfirmationDialog.tsx` - Post-import confirmation
- ✅ `src/components/SubscriptionList.tsx` - Variation A: Grouped accordion with edit button
- ✅ `src/components/SubscriptionGrid.tsx` - Variation B: Card grid with edit button
- ✅ `src/components/SubscriptionPanel.tsx` - Wrapper with view toggle + SubscriptionCard with upcoming payments
- ✅ `src/components/SubscriptionEditModal.tsx` - Edit/delete subscription modal
- ✅ `src/types/transaction.ts` - DetectedSubscription, Subscription types

---

### Iteration 6.2: Time-Based Grouping ✅
**Focus:** Organize transactions by time periods

**Tasks:**
- [x] Grouping utilities:
  - By day
  - By week
  - By month
  - By quarter
  - By year

- [x] Period summaries:
  - Total spent
  - Total income
  - Net change
  - Transaction count

- [x] Custom month start day (e.g., 25th for Swedish salary)

**Deliverables:**
- ✅ `src/components/TimePeriodSelector.tsx` - Period selection UI with settings
- ✅ `src/hooks/useTimePeriodFilter.ts` - Period filtering hook

---

### Iteration 6.3: Category Totals ✅
**Focus:** Summary statistics per category

**Tasks:**
- [x] Calculate totals:
  - Total per category
  - Total per subcategory
  - Percentage of overall spending

- [x] Summary table UI:
  - Category icon and name
  - Total amount
  - Transaction count
  - Expandable subcategories

- [x] Trends and averages:
  - Current period vs average comparison
  - Percentage change indicators
  - Daily average calculation

**Deliverables:**
- ✅ CategoryTotalsTable in `src/components/SpendingVisualization.tsx`
- ✅ TrendSection in `src/components/SpendingVisualization.tsx`

---

## Phase 7: User Customization

**Goal:** Enable user file uploads and customization options.

### Iteration 7.1: File Upload ✅
**Focus:** Replace static CSV with user uploads

**Tasks:**
- [x] File drop zone component (drag & drop with visual feedback)
- [x] File validation (CSV extension check)
- [x] Progress indicator (loading spinner)
- [x] Error handling UI (error callbacks for invalid format, encoding errors)

**Deliverables:**
- ✅ `src/components/FileUpload.tsx` - Drag & drop file upload
- ✅ Upload flow integration in App.tsx with CSV confirmation dialog

---

### Iteration 7.2: Custom Categories
**Focus:** User-defined categories

**Tasks:**
- [ ] Add new category UI
- [ ] Edit existing category
- [ ] Delete category (reassign transactions)
- [ ] Custom icons/colors

**Deliverables:**
- `src/components/features/CategoryManager.tsx`
- Category CRUD operations

---

### Iteration 7.3: Settings Panel ✅
**Focus:** User preferences

**Tasks:**
- [x] Settings storage (localStorage)
- [x] Options:
  - Date format preference (ISO, European, US, German)
  - Month start day (1-28, for Swedish salary cycles)
  - Icon set selection (emoji, minimal, colorful)

**Deliverables:**
- ✅ `src/components/SettingsPanel.tsx` - Modal settings panel
- ✅ Settings persistence with localStorage

---

### Iteration 7.4: Export Functionality ✅
**Focus:** Export analyzed data

**Tasks:**
- [x] Export formats:
  - CSV (with categories)
  - JSON

- [x] Export options:
  - All transactions
  - Filtered view
  - Summary only

- [x] Export UI with format selection, scope options, and preview

**Deliverables:**
- ✅ `src/services/export-service.ts` - Export service with CSV/JSON support
- ✅ `src/components/ExportDialog.tsx` - Export dialog with options and preview
- ✅ Export button in Header when data is loaded

---

## Phase 8: UI Themes & Icons ✅
**Goal:** Provide multiple icon sets and UI customization options.

### Iteration 8.1: Multiple Icon Sets ✅
**Focus:** CDN-based icon sets for categories

**Tasks:**
- [x] Implement 4 icon sets: Emoji (default), Icons8 3D Fluency, Phosphor, OpenMoji
- [x] Create icon set configuration with CDN URLs
- [x] Universal CategoryIcon component with loading states
- [x] Icon set selector in settings panel

**Deliverables:**
- ✅ `src/config/icon-sets.ts` - Icon mappings for all 4 sets
- ✅ `src/components/ui/CategoryIcon.tsx` - Universal icon component

---

### Iteration 8.2: Teal Color Theme ✅
**Focus:** Updated primary color scheme

**Tasks:**
- [x] Replace blue theme with teal/cyan palette
- [x] Update all color variables (primary-500: #14b8a6, etc.)
- [x] Consistent color application across all components

**Deliverables:**
- ✅ Updated `src/index.css` with teal color palette

---

### Iteration 8.3: Dark Mode ✅
**Focus:** Full dark theme support

**Tasks:**
- [x] Dark mode color palette
- [x] System preference detection via prefers-color-scheme
- [x] Manual toggle in settings (light/dark/system)
- [x] Smooth transition between modes
- [x] Dark mode classes on ALL components

**Deliverables:**
- ✅ `src/hooks/useDarkMode.ts` - Dark mode hook with localStorage
- ✅ `src/components/DarkModeToggle.tsx` - Sun/moon toggle button
- ✅ Updated SettingsPanel with theme selection
- ✅ All components updated with `dark:` Tailwind variants

---

### Iteration 8.4: Layout Components ✅
**Focus:** Header, footer, and responsive navigation

**Tasks:**
- [x] Sticky header with logo and navigation
- [x] Navigation links: Features, How It Works, About
- [x] Mobile hamburger menu with slide-out drawer
- [x] Footer with About, Disclaimer, Privacy links
- [x] Creator info and copyright

**Deliverables:**
- ✅ `src/components/layout/Header.tsx` - Sticky header
- ✅ `src/components/layout/Footer.tsx` - Footer component
- ✅ `src/components/layout/MobileMenu.tsx` - Mobile navigation

---

### Iteration 8.5: Card Styling & Routing ✅
**Focus:** Reusable card components and content pages

**Tasks:**
- [x] Reusable Card component with variants (default, elevated, interactive)
- [x] Hash-based routing for SPA navigation
- [x] Content pages: Features, How It Works, About, Privacy, Disclaimer

**Deliverables:**
- ✅ `src/components/ui/Card.tsx` - Card component with variants
- ✅ `src/hooks/useHashRouter.ts` - Hash-based routing
- ✅ `src/pages/` - FeaturesPage, HowItWorksPage, AboutPage, PrivacyPage, DisclaimerPage

---

### Iteration 8.6: Responsive Design ✅
**Focus:** Mobile-first responsive layouts

**Tasks:**
- [x] Mobile-first approach with Tailwind breakpoints
- [x] Stacked layouts on small screens
- [x] Collapsible filter panel on mobile
- [x] Responsive header with mobile menu

**Deliverables:**
- ✅ All components updated with responsive classes

---

## Phase 9: AI Insights

**Goal:** Provide intelligent spending analysis and recommendations.

### Iteration 9.1: Pattern Analysis
**Focus:** Identify spending patterns

**Tasks:**
- [ ] Analyze:
  - Spending trends over time
  - Category growth/decline
  - Unusual transactions
  - Seasonal patterns

**Deliverables:**
- `src/services/pattern-analyzer.ts`
- Pattern data structures

---

### Iteration 9.2: Recommendation Engine
**Focus:** Generate actionable insights

**Tasks:**
- [ ] Insight types:
  - "You spent X more on Y this month"
  - "Consider reviewing Z subscription"
  - "Your grocery spending is above average"
  - "You could save X by..."

- [ ] Insight prioritization
- [ ] Dismissible/actionable insights

**Deliverables:**
- `src/services/insight-generator.ts`
- Insight type definitions

---

### Iteration 9.3: Insights UI
**Focus:** Display insights attractively

**Tasks:**
- [ ] Insight cards:
  - Icon based on type
  - Clear message
  - Suggested action
  - Dismiss option

- [ ] Insights dashboard section
- [ ] Insight detail view

**Deliverables:**
- `src/components/features/InsightCard.tsx`
- `src/components/features/InsightsPanel.tsx`

---

## Progress Tracking

### Completion Status

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | ✅ Completed | 100% |
| Phase 2: Data Processing | ✅ Completed | 100% |
| Phase 3: Category System | ✅ Completed | 100% |
| Phase 4: Core UI | ✅ Completed | 100% |
| Phase 5: Visualizations | ✅ Completed | 100% |
| Phase 6: Smart Features | ✅ Completed | 100% |
| Phase 7: User Customization | 🟡 Partial | 75% |
| Phase 8: UI Themes & Icons | ✅ Completed | 100% |
| Phase 9: AI Insights | Not Started | 0% |

**Last Updated:** 2025-12-20 (v0.8.1 - Subscription Management & Predictions)

### Recent Changes (v0.8.1)
- Added subscription edit modal (edit name, amount, active/paused status)
- Added delete subscription functionality with confirmation
- Added clear all subscriptions option in settings
- Added upcoming payments predictions (next 14 days) in SubscriptionCard
- Added toggle between "Top" and "Upcoming" views
- Color-coded urgency for due payments (Today, Tomorrow, This week)

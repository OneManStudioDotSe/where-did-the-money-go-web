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
Phase 8: AI Insights         → Analysis, recommendations, patterns
```

---

## Phase 1: Foundation

**Goal:** Establish project structure, core data models, and development environment.

### Iteration 1.1: Project Setup ✅ COMPLETED
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

### Iteration 1.2: Core Data Models ✅ COMPLETED
**Focus:** TypeScript interfaces for all core entities

**Tasks:**
- [x] Define `Transaction` interface:
  ```typescript
  interface Transaction {
    id: string;
    date: Date;
    amount: number;
    description: string;
    categoryId: string | null;
    subcategoryId: string | null;
    isSubscription: boolean;
    badges: Badge[];
    rawData: Record<string, string>;
  }
  ```

- [x] Define `Category` and `Subcategory` interfaces:
  ```typescript
  interface Category {
    id: string;
    name: string;
    icon: string;
    color: string;
    subcategories: Subcategory[];
  }

  interface Subcategory {
    id: string;
    name: string;
    parentCategoryId: string;
  }
  ```

- [x] Define `ColumnMapping` interface:
  ```typescript
  interface ColumnMapping {
    dateColumn: string | null;
    amountColumn: string | null;
    descriptionColumn: string | null;
    categoryColumn: string | null;
  }
  ```

- [x] Define `CategoryMapping` interface:
  ```typescript
  interface CategoryMapping {
    pattern: string;        // Text pattern to match
    categoryId: string;
    subcategoryId: string;
    isRegex: boolean;
  }
  ```

**Deliverables:**
- ✅ Complete type definitions in `src/types/`
- ✅ Type exports barrel file

---

### Iteration 1.3: Sample Data & CSV Parser ✅ COMPLETED
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

- [x] **BONUS: Implemented CSV Parser & File Upload early:**
  - Full CSV parsing utility with BOM handling
  - Auto-column detection for Swedish bank formats
  - File upload component with drag & drop
  - Category mapping service with pattern matching
  - Transaction list component with category badges
  - Summary statistics display

**Deliverables:**
- ✅ `sample-data/transactions.csv`
- ✅ `src/data/categories.ts` (13 categories, 51 subcategories)
- ✅ `src/data/category-mappings.ts` (183 merchant mappings)
- ✅ `src/utils/csv-parser.ts`
- ✅ `src/utils/category-service.ts`
- ✅ `src/components/FileUpload.tsx`
- ✅ `src/components/TransactionList.tsx`

---

## Phase 2: Data Processing ✅ COMPLETED (merged into Phase 1)

**Goal:** Parse CSV files, detect column types, normalize transaction data.

> **Note:** Phase 2 was completed ahead of schedule as part of Phase 1 Iteration 1.3

### Iteration 2.1: CSV Parser ✅ COMPLETED
**Focus:** Reading and parsing CSV content

**Tasks:**
- [x] Create CSV parsing utility:
  - Handle different delimiters (comma, semicolon, tab)
  - Parse headers
  - Handle quoted fields
  - Handle different line endings

- [x] Create file reader hook:
  ```typescript
  function useFileReader(): {
    readFile: (file: File) => Promise<string>;
    content: string | null;
    error: Error | null;
    isLoading: boolean;
  }
  ```

**Deliverables:**
- ✅ `src/utils/csv-parser.ts`
- ✅ File upload component handles file reading

---

### Iteration 2.2: Column Detection ✅ COMPLETED
**Focus:** Automatically identify column purposes

**Tasks:**
- [x] Create column type detector:
  - Date detection: various date formats
  - Amount detection: numeric, currency symbols
  - Description detection: longest text, non-numeric

- [x] Detection heuristics:
  ```typescript
  interface ColumnAnalysis {
    columnName: string;
    sampleValues: string[];
    detectedType: 'date' | 'amount' | 'description' | 'unknown';
    confidence: number;
  }
  ```

- [x] Handle ambiguous cases:
  - Multiple date columns
  - Credit/Debit separate columns
  - Missing required columns

**Deliverables:**
- ✅ `src/utils/csv-parser.ts` includes column detection
- ✅ Column mapping suggestion algorithm

---

### Iteration 2.3: Transaction Normalizer ✅ COMPLETED
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

### Iteration 2.4: Column Mapping UI
**Focus:** Manual column assignment when auto-detection fails

**Tasks:**
- [ ] Create mapping interface component:
  - Show sample data preview
  - Dropdown selectors for each column type
  - Visual indicators for mapped/unmapped
  - Validation feedback

**Deliverables:**
- `src/components/features/ColumnMapper.tsx`
- Integration with parser flow

---

## Phase 3: Category System

**Goal:** Implement category management and transaction categorization.

### Iteration 3.1: Category Data Structure
**Focus:** Categories and subcategories definitions

**Tasks:**
- [ ] Implement category store/context:
  - Load default categories
  - CRUD operations for categories
  - Category lookup utilities

- [ ] Create category utilities:
  - Get category by ID
  - Get subcategory by ID
  - List subcategories for category
  - Flatten category tree

**Deliverables:**
- `src/services/category-service.ts`
- Category state management

---

### Iteration 3.2: Category Mapping Engine
**Focus:** Automatic transaction categorization

**Tasks:**
- [ ] Implement mapping engine:
  - Pattern matching (exact, contains, regex)
  - Priority ordering
  - Custom vs default mappings

- [ ] Mapping evaluation:
  ```typescript
  function categorizeTransaction(
    transaction: Transaction,
    mappings: CategoryMapping[]
  ): { categoryId: string; subcategoryId: string } | null
  ```

**Deliverables:**
- `src/services/category-mapper.ts`
- Mapping priority system

---

### Iteration 3.3: Persistence Layer
**Focus:** Save user customizations locally

**Tasks:**
- [ ] LocalStorage service:
  - Save custom mappings
  - Save manual category assignments
  - Version migrations
  - Data validation on load

- [ ] Create persistence hooks:
  ```typescript
  function useLocalStorage<T>(key: string, defaultValue: T): [T, (value: T) => void]
  ```

**Deliverables:**
- `src/services/storage-service.ts`
- `src/hooks/useLocalStorage.ts`

---

### Iteration 3.4: Manual Assignment UI
**Focus:** User interface for categorizing transactions

**Tasks:**
- [ ] Category selector component:
  - Two-level dropdown (category → subcategory)
  - Search/filter
  - Recently used
  - Quick assign shortcuts

- [ ] Uncategorized badge and indicator
- [ ] Bulk assignment capability (future consideration)

**Deliverables:**
- `src/components/features/CategorySelector.tsx`
- Integration with transaction items

---

## Phase 4: Core UI

**Goal:** Build the application shell and primary interface components.

### Iteration 4.1: Application Shell
**Focus:** Layout structure and navigation

**Tasks:**
- [ ] Create app layout:
  - Header with app title/logo
  - Main content area
  - Optional sidebar for filters
  - Footer (minimal)

- [ ] Implement grid system:
  - CSS Grid-based layout
  - Variable width/height sections
  - Responsive breakpoints

- [ ] Design color palette:
  ```
  Primary: Modern blue/purple tones
  Secondary: Warm accent colors
  Background: Light with subtle gradients
  Cards: White with soft shadows
  Categories: Distinct colors per category
  ```

**Deliverables:**
- `src/components/layout/AppShell.tsx`
- `src/components/layout/GridSection.tsx`
- Theme configuration

---

### Iteration 4.2: Transaction Components
**Focus:** Display individual and lists of transactions

**Tasks:**
- [ ] Transaction item component:
  - Date display
  - Amount (color-coded: expense/income)
  - Description
  - Category badge
  - Subscription badge
  - Action notes/badges

- [ ] Transaction list component:
  - Virtualized for performance
  - Grouping headers (by date)
  - Empty state

**Deliverables:**
- `src/components/features/TransactionItem.tsx`
- `src/components/features/TransactionList.tsx`

---

### Iteration 4.3: Sorting and Filtering
**Focus:** Data organization controls

**Tasks:**
- [ ] Sort controls:
  - By date (newest/oldest)
  - By amount (highest/lowest)
  - By category (alphabetical)

- [ ] Filter controls:
  - By category
  - By date range
  - By amount range
  - Search by description

- [ ] Active filter indicators

**Deliverables:**
- `src/components/features/SortControls.tsx`
- `src/components/features/FilterPanel.tsx`
- `src/hooks/useTransactionFilters.ts`

---

### Iteration 4.4: Badge System
**Focus:** Visual indicators for transaction states

**Tasks:**
- [ ] Badge types:
  - Uncategorized (needs attention)
  - Subscription (recurring)
  - High value (above threshold)
  - Recent (within X days)

- [ ] Badge component:
  - Icon + label
  - Color variants
  - Tooltip with details

**Deliverables:**
- `src/components/ui/Badge.tsx`
- Badge type definitions

---

## Phase 5: Visualizations

**Goal:** Implement charts and graphical data representations.

### Iteration 5.1: Chart Library Setup
**Focus:** Integrate charting solution

**Tasks:**
- [ ] Evaluate and choose library:
  - Recharts (React-friendly)
  - Chart.js (versatile)
  - Visx (D3-based, customizable)

- [ ] Create chart wrapper components
- [ ] Define consistent chart styling

**Deliverables:**
- Chart library installed and configured
- Base chart components

---

### Iteration 5.2: Category Breakdown Chart
**Focus:** Visualize spending by category

**Tasks:**
- [ ] Bar chart: spending per category
- [ ] Pie/donut chart: category distribution
- [ ] Interactive: click to drill into subcategories

**Deliverables:**
- `src/components/charts/CategoryBreakdown.tsx`
- `src/components/charts/CategoryPie.tsx`

---

### Iteration 5.3: Timeline Charts
**Focus:** Spending over time

**Tasks:**
- [ ] Line chart: monthly spending trend
- [ ] Grouped bar: compare months
- [ ] Time period selector: week/month/quarter

**Deliverables:**
- `src/components/charts/SpendingTrend.tsx`
- `src/components/charts/MonthlyComparison.tsx`

---

### Iteration 5.4: Interactive Features
**Focus:** Chart interactivity and details

**Tasks:**
- [ ] Tooltips with transaction details
- [ ] Click handlers to filter transactions
- [ ] Zoom/pan for timeline charts
- [ ] Legend interactions

**Deliverables:**
- Enhanced chart components
- Chart-to-data linking

---

## Phase 6: Smart Features

**Goal:** Implement intelligent transaction analysis.

### Iteration 6.1: Subscription Detection
**Focus:** Identify recurring transactions

**Tasks:**
- [ ] Detection algorithm:
  ```typescript
  function detectSubscriptions(transactions: Transaction[]): SubscriptionGroup[] {
    // Group by similar description
    // Check monthly recurrence
    // Verify amount consistency (±5% variance)
    // Require minimum 2-3 occurrences
  }
  ```

- [ ] Subscription grouping UI
- [ ] Total subscription cost display

**Deliverables:**
- `src/services/subscription-detector.ts`
- Subscription summary component

---

### Iteration 6.2: Time-Based Grouping
**Focus:** Organize transactions by time periods

**Tasks:**
- [ ] Grouping utilities:
  - By day
  - By week
  - By month
  - By quarter

- [ ] Period summaries:
  - Total spent
  - Average per category
  - Comparison to previous period

**Deliverables:**
- `src/utils/date-grouping.ts`
- Period selector UI

---

### Iteration 6.3: Category Totals
**Focus:** Summary statistics per category

**Tasks:**
- [ ] Calculate totals:
  - Total per category
  - Total per subcategory
  - Percentage of overall spending

- [ ] Summary cards UI:
  - Category icon and name
  - Total amount
  - Transaction count
  - Trend indicator

**Deliverables:**
- `src/components/features/CategorySummary.tsx`
- Summary calculation utilities

---

## Phase 7: User Customization

**Goal:** Enable user file uploads and customization options.

### Iteration 7.1: File Upload
**Focus:** Replace static CSV with user uploads

**Tasks:**
- [ ] File drop zone component
- [ ] File validation
- [ ] Progress indicator
- [ ] Error handling UI

**Deliverables:**
- `src/components/features/FileUpload.tsx`
- Upload flow integration

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

### Iteration 7.3: Settings Panel
**Focus:** User preferences

**Tasks:**
- [ ] Settings storage
- [ ] Options:
  - Date format preference
  - Currency display
  - Default time period
  - Theme (light/dark - future)

**Deliverables:**
- `src/components/features/Settings.tsx`
- Settings context/store

---

### Iteration 7.4: Export Functionality
**Focus:** Export analyzed data

**Tasks:**
- [ ] Export formats:
  - CSV (with categories)
  - JSON
  - PDF report (future consideration)

- [ ] Export options:
  - All transactions
  - Filtered view
  - Summary only

**Deliverables:**
- `src/services/export-service.ts`
- Export UI

---

## Phase 8: AI Insights

**Goal:** Provide intelligent spending analysis and recommendations.

### Iteration 8.1: Pattern Analysis
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

### Iteration 8.2: Recommendation Engine
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

### Iteration 8.3: Insights UI
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

## Future Considerations

### Potential Enhancements (Post-MVP)
- Dark mode theme
- Multiple account support
- Budget setting and tracking
- Goals and savings targets
- Receipt image attachment
- Bank API integrations (if privacy-compliant)
- PWA support for offline use
- Data encryption for extra privacy
- Collaborative features (shared household budgets)

---

## Progress Tracking

### Completion Status

| Phase | Status | Progress |
|-------|--------|----------|
| Phase 1: Foundation | ✅ Completed | 100% |
| Phase 2: Data Processing | ✅ Completed | 100% |
| Phase 3: Category System | 🟡 Partial | 60% |
| Phase 4: Core UI | 🟡 Partial | 40% |
| Phase 5: Visualizations | Not Started | 0% |
| Phase 6: Smart Features | Not Started | 0% |
| Phase 7: User Customization | 🟡 Partial | 30% |
| Phase 8: AI Insights | Not Started | 0% |

**Last Updated:** 2025-12-19

---

## Getting Started

To begin development, start with **Phase 1, Iteration 1.1: Project Setup**.

The recommended approach:
1. Complete each iteration fully before moving to the next
2. Test thoroughly at each step
3. Document decisions in DEVLOG.md
4. Update CHANGELOG.md with each version milestone
5. Commit frequently with meaningful messages

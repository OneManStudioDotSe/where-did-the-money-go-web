# Architecture Overview - Where Did The Money Go

This document describes the technical architecture and design decisions for the application.

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ Dashboard│  │  Lists   │  │  Charts  │  │     Insights     │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      STATE MANAGEMENT                           │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │ Transactions │  │  Categories  │  │    User Preferences    │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        SERVICES                                 │
│  ┌─────────┐  ┌──────────┐  ┌─────────┐  ┌──────────────────┐   │
│  │ CSV     │  │ Category │  │ Pattern │  │    Insight       │   │
│  │ Parser  │  │ Mapper   │  │ Detector│  │    Generator     │   │
│  └─────────┘  └──────────┘  └─────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────────┐ │
│  │   CSV File   │  │ LocalStorage │  │   Static Defaults      │ │
│  │   (Input)    │  │ (Persistence)│  │   (Categories, etc.)   │ │
│  └──────────────┘  └──────────────┘  └────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. CSV Import Flow
```
User uploads CSV
       │
       ▼
┌─────────────────┐
│   CSV Parser    │  Parse raw text to rows/columns
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Column Detector  │  Identify date, amount, description columns
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
 Auto      Manual
Detected   Mapping UI
    │         │
    └────┬────┘
         │
         ▼
┌─────────────────┐
│  Normalizer     │  Convert to Transaction objects
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│Category Mapper  │  Assign categories based on patterns
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   State Store   │  Store processed transactions
└─────────────────┘
```

### 2. Category Assignment Flow
```
Transaction Description
         │
         ▼
┌─────────────────────┐
│  Pattern Matcher    │
│  1. Custom mappings │
│  2. Default rules   │
└────────┬────────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
  Match    No Match
  Found    (Uncategorized)
    │         │
    ▼         ▼
Category  Flag with
Assigned  Badge
```

### 3. User Interaction Flow
```
User Action (sort, filter, assign category)
         │
         ▼
┌─────────────────┐
│  UI Component   │  Capture user intent
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ State Update    │  Update application state
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
UI Update  Persist to
           localStorage
```

---

## Core Data Models

### Transaction
The fundamental unit of data in the application.

```typescript
interface Transaction {
  id: string;                    // Unique identifier (generated)
  date: Date;                    // Transaction date
  amount: number;                // Negative for expenses, positive for income
  description: string;           // Original transaction description
  categoryId: string | null;     // Assigned category
  subcategoryId: string | null;  // Assigned subcategory
  isSubscription: boolean;       // Detected as recurring
  badges: Badge[];               // Visual indicators
  rawData: Record<string, string>; // Original CSV row data
}
```

### Category
Hierarchical organization of spending types.

```typescript
interface Category {
  id: string;
  name: string;
  icon: string;                  // Icon identifier
  color: string;                 // Hex color for charts/badges
  subcategories: Subcategory[];
}

interface Subcategory {
  id: string;
  name: string;
  parentCategoryId: string;
}
```

### Category Mapping
Rules for automatic categorization.

```typescript
interface CategoryMapping {
  id: string;
  pattern: string;               // Text to match
  categoryId: string;
  subcategoryId: string;
  matchType: 'exact' | 'contains' | 'regex';
  priority: number;              // Higher = checked first
  isCustom: boolean;             // User-created vs default
}
```

### Column Mapping
Configuration for CSV parsing.

```typescript
interface ColumnMapping {
  dateColumn: string | null;
  amountColumn: string | null;
  descriptionColumn: string | null;
  categoryColumn: string | null; // Optional, if bank provides
  isDebitNegative: boolean;      // Convention for amounts
}
```

---

## Component Architecture

### UI Component Hierarchy

```
App
├── AppShell
│   ├── Header
│   │   ├── Logo
│   │   ├── Navigation
│   │   └── Settings Button
│   │
│   ├── MainContent
│   │   ├── Dashboard
│   │   │   ├── SummaryCards
│   │   │   ├── ChartSection
│   │   │   │   ├── CategoryBreakdown
│   │   │   │   ├── SpendingTrend
│   │   │   │   └── CategoryPie
│   │   │   └── InsightsPanel
│   │   │
│   │   ├── TransactionSection
│   │   │   ├── FilterPanel
│   │   │   ├── SortControls
│   │   │   └── TransactionList
│   │   │       └── TransactionItem
│   │   │           ├── Badge
│   │   │           └── CategorySelector
│   │   │
│   │   └── UploadSection
│   │       ├── FileUpload
│   │       └── ColumnMapper
│   │
│   └── Sidebar (optional)
│       └── CategoryFilter
│
└── Modals
    ├── SettingsModal
    └── CategoryManager
```

### Component Responsibilities

| Component | Responsibility |
|-----------|----------------|
| AppShell | Layout structure, responsive grid |
| Dashboard | Overview aggregation, summary display |
| TransactionList | Virtualized list, sorting, grouping |
| TransactionItem | Single transaction display, interactions |
| CategorySelector | Category picker dropdown |
| ChartSection | Chart container, period selection |
| FilterPanel | Filter state management, filter UI |
| FileUpload | File drop zone, validation |
| ColumnMapper | Column assignment interface |

---

## State Management Strategy

### State Categories

1. **Application State** (Global)
   - Loaded transactions
   - Category definitions
   - User mappings
   - Current filters/sort

2. **UI State** (Local)
   - Modal open/closed
   - Expanded/collapsed sections
   - Form inputs

3. **Derived State** (Computed)
   - Filtered transactions
   - Category totals
   - Chart data
   - Detected subscriptions

### State Structure

```typescript
interface AppState {
  // Core data
  transactions: Transaction[];
  categories: Category[];
  categoryMappings: CategoryMapping[];

  // View state
  filters: {
    categoryIds: string[];
    dateRange: { start: Date; end: Date } | null;
    amountRange: { min: number; max: number } | null;
    searchQuery: string;
  };
  sortBy: 'date' | 'amount' | 'category';
  sortDirection: 'asc' | 'desc';
  timePeriod: 'day' | 'week' | 'month' | 'quarter';

  // Preferences
  settings: UserSettings;

  // UI state
  isLoading: boolean;
  error: string | null;
}
```

---

## Service Layer

### CSV Parser Service
- Parse CSV text to structured data
- Handle delimiters, quotes, line endings
- Return headers and rows

### Column Detector Service
- Analyze column content
- Score columns for each type (date, amount, description)
- Return best matches with confidence

### Transaction Normalizer Service
- Apply column mappings
- Parse and validate data types
- Generate unique IDs
- Create Transaction objects

### Category Mapper Service
- Match transactions against patterns
- Apply custom mappings first, then defaults
- Track unmatched transactions

### Subscription Detector Service
- Group similar transactions
- Analyze recurrence patterns
- Calculate confidence scores

### Pattern Analyzer Service
- Calculate spending trends
- Identify anomalies
- Generate statistical summaries

### Insight Generator Service
- Apply rules to patterns
- Generate human-readable insights
- Prioritize by impact/actionability

### Storage Service
- Save/load from localStorage
- Handle versioning/migrations
- Validate data integrity

---

## File Structure

```
src/
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx
│   │   ├── Header.tsx
│   │   ├── GridSection.tsx
│   │   └── index.ts
│   │
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Badge.tsx
│   │   ├── Card.tsx
│   │   ├── Dropdown.tsx
│   │   ├── Input.tsx
│   │   └── index.ts
│   │
│   ├── features/
│   │   ├── transactions/
│   │   │   ├── TransactionList.tsx
│   │   │   ├── TransactionItem.tsx
│   │   │   ├── FilterPanel.tsx
│   │   │   └── SortControls.tsx
│   │   │
│   │   ├── categories/
│   │   │   ├── CategorySelector.tsx
│   │   │   ├── CategoryBadge.tsx
│   │   │   └── CategoryManager.tsx
│   │   │
│   │   ├── charts/
│   │   │   ├── CategoryBreakdown.tsx
│   │   │   ├── SpendingTrend.tsx
│   │   │   ├── CategoryPie.tsx
│   │   │   └── ChartContainer.tsx
│   │   │
│   │   ├── upload/
│   │   │   ├── FileUpload.tsx
│   │   │   └── ColumnMapper.tsx
│   │   │
│   │   ├── insights/
│   │   │   ├── InsightCard.tsx
│   │   │   └── InsightsPanel.tsx
│   │   │
│   │   └── dashboard/
│   │       ├── Dashboard.tsx
│   │       └── SummaryCards.tsx
│   │
│   └── modals/
│       └── SettingsModal.tsx
│
├── hooks/
│   ├── useTransactions.ts
│   ├── useCategories.ts
│   ├── useFilters.ts
│   ├── useLocalStorage.ts
│   └── useFileReader.ts
│
├── services/
│   ├── csv-parser.ts
│   ├── column-detector.ts
│   ├── transaction-normalizer.ts
│   ├── category-mapper.ts
│   ├── subscription-detector.ts
│   ├── pattern-analyzer.ts
│   ├── insight-generator.ts
│   └── storage-service.ts
│
├── store/
│   ├── index.ts
│   ├── transactions.ts
│   ├── categories.ts
│   └── settings.ts
│
├── types/
│   ├── transaction.ts
│   ├── category.ts
│   ├── mapping.ts
│   ├── insight.ts
│   └── index.ts
│
├── utils/
│   ├── date-utils.ts
│   ├── format-utils.ts
│   ├── grouping-utils.ts
│   ├── text-utils.ts          # Title case and text formatting
│   ├── subscription-detection.ts
│   ├── category-service.ts
│   ├── csv-parser.ts
│   └── index.ts               # Re-exports all utilities
│
├── data/
│   ├── sample-transactions.csv
│   ├── categories.ts
│   └── category-mappings.ts
│
├── styles/
│   ├── globals.css
│   └── theme.ts
│
├── App.tsx
└── main.tsx
```

---

## Design Decisions

### Why Local Processing Only?
- **Privacy:** Financial data is sensitive
- **Simplicity:** No backend infrastructure needed
- **Speed:** Instant processing, no network latency
- **Trust:** Users can verify no data leaves their device

### Why Two-Level Categories?
- Balance between organization and simplicity
- Most spending fits a broad category with specific subcategory
- Easier for users to understand and manage
- Common pattern in financial apps

### Why Pattern-Based Categorization?
- Works without AI/ML
- Transparent and predictable
- Users can understand and adjust rules
- Builds upon itself as users add mappings

### Why LocalStorage for Persistence?
- No server required
- Works offline
- Simple to implement
- Sufficient for user preferences and mappings

---

## Performance Considerations

### Large Dataset Handling
- Virtual scrolling for transaction lists
- Lazy computation of derived state
- Memoization of expensive calculations
- Efficient filtering/sorting algorithms

### Rendering Optimization
- React.memo for pure components
- useMemo for derived data
- useCallback for event handlers
- Proper key usage in lists

### Chart Performance
- Aggregate data before charting
- Limit data points displayed
- Use canvas rendering for large datasets
- Debounce interaction events

---

## Security Considerations

### Data Privacy
- All processing client-side
- No external API calls with user data
- No analytics tracking of financial data
- Clear data removal option

### Input Validation
- Sanitize CSV input
- Validate data types
- Handle malformed data gracefully
- Prevent XSS in displayed content

# Development Log - Where Did The Money Go

A chronological journal of development decisions, progress, and learnings.

---

## Project Overview

**Name:** Where Did The Money Go
**Type:** Web Application
**Purpose:** Personal expense tracking and analysis tool that processes bank CSV exports locally, providing insights into spending patterns without requiring account creation or cloud storage.

**Core Principles:**
- Privacy-first: All data processed locally in the browser
- No account required
- Simple, modular, iterative development
- Clean, modern UI with creative color palette

---

## Entry #001 - 2025-12-19

### Project Initialization

**What was done:**
- Created project repository
- Defined initial project scope and requirements
- Established development approach: iterative, modular, building blocks first

**Key Decisions:**

1. **Tech Stack Decision:** TBD in next session - will evaluate React/Vue/Svelte based on:
   - Component modularity requirements
   - State management for transaction data
   - Chart library compatibility
   - Bundle size (since everything runs locally)

2. **Data Flow Architecture:**
   ```
   CSV File → Parser → Column Identifier → Transaction Normalizer →
   Category Mapper → State Store → UI Components → Visualizations
   ```

3. **Category System Design:**
   - Two-level hierarchy: Category → Subcategory
   - Hardcoded initial mappings
   - User-customizable mappings stored in localStorage
   - Uncategorized transactions flagged for manual assignment

4. **Subscription Detection Logic:**
   - Monthly recurring transactions
   - Amount variance threshold (e.g., ±5%)
   - Same or similar description
   - At least 2-3 occurrences to confirm pattern

**Questions to Resolve:**
- [ ] Which charting library? (Chart.js, Recharts, D3, etc.)
- [ ] State management approach? (Context, Zustand, Redux, etc.)
- [x] CSS approach? → **Tailwind CSS 4**
- [ ] Testing strategy?

**Next Steps:**
- Set up project scaffolding
- Define TypeScript interfaces for core data models
- Create sample CSV for development

---

## Entry #002 - 2025-12-19

### Tech Stack Finalized & Phase 1 Setup

**What was done:**
- Finalized tech stack based on user requirements
- Initialized Vite + React + TypeScript project
- Configured Tailwind CSS 4 with custom theme
- Created folder structure (components, utils, hooks, data, types)
- Defined core TypeScript interfaces for transactions, categories, and CSV parsing
- Created default category definitions (13 categories, 40+ subcategories)
- Created 100+ Swedish merchant mappings for auto-categorization
- Documented CSV format specification (Swedish bank export format)
- Documented category hierarchy and mapping rules

**Tech Stack Decisions:**

1. **Build Tool:** Vite 6
   - Fastest development experience
   - Native TypeScript support
   - Excellent HMR performance

2. **Framework:** React 19
   - Component-based architecture fits our modular approach
   - Large ecosystem for future expansion
   - Familiar to most developers

3. **Language:** TypeScript
   - Type safety for financial calculations
   - Better IDE support and refactoring
   - Self-documenting interfaces

4. **Styling:** Tailwind CSS 4
   - Using new @tailwindcss/vite plugin
   - Custom theme with category colors
   - Utility-first for rapid UI development
   - No additional CSS files needed

5. **Dependencies:** Minimal
   - Only essential packages
   - Avoiding dependency bloat
   - Each addition must be justified

**Files Created:**
- `src/types/transaction.ts` - Transaction, Badge interfaces
- `src/types/category.ts` - Category, Subcategory, Mapping interfaces
- `src/types/csv.ts` - CSV parsing configuration types
- `src/types/index.ts` - Central exports
- `src/data/categories.ts` - Default category definitions
- `src/data/category-mappings.ts` - Swedish merchant patterns
- `docs/CSV_FORMAT.md` - Swedish bank CSV specification
- `docs/CATEGORIES.md` - Category hierarchy documentation
- `sample-data/transactions.csv` - Development test data

**Key Design Decisions:**

1. **Category Mapping Priority System:**
   - Higher priority patterns checked first
   - Streaming services: 90 (most specific)
   - General patterns: 40-60 (catch-all)

2. **Swedish Character Handling:**
   - Both UTF-8 and corrupted encodings supported
   - Duplicate patterns for å/ä/ö variations

3. **Transaction Model:**
   - Badges for quick visual identification
   - Subscription flag for recurring detection
   - Raw data preserved for debugging

**Running the Project:**
```bash
# Install dependencies (first time only)
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Next Steps:**
- Implement CSV parser utility
- Create file upload component
- Build transaction list view
- Add category service for auto-mapping

---

## Entry #003 - 2025-12-19

### Interactive UI Enhancements

**What was done:**
- Made the Categories status card clickable with interactive modal
- Made the CSV Parser status card clickable with specification details
- Categories modal displays all 13 categories with their subcategories using color-coded badges
- CSV Parser modal shows complete format specification including:
  - File format details (encoding, delimiter, date format, decimal separator)
  - Expected columns table with Swedish headers
  - Amount convention (positive = income, negative = expense)
  - Example CSV row

**Key Decisions:**
1. **Modal-based information display:**
   - Clean UI without cluttering the main page
   - Click-to-expand pattern for progressive disclosure
   - Consistent modal design language

2. **Dynamic data display:**
   - Categories and subcategory counts computed from actual data
   - Merchant mapping count reflects real mappings in the codebase
   - Category colors used for visual consistency

**Files Modified:**
- `src/App.tsx` - Added modal states, category/CSV info modals

**No New Dependencies Added**

---

## Entry #004 - 2025-12-19

### Phase 1 Iteration 1.3 - CSV Parser & Core Features

**What was done:**
- Implemented complete CSV parser utility with:
  - BOM removal for UTF-8 files
  - Quoted field handling
  - Auto-detection of column types (date, amount, balance, description, verification)
  - Swedish header name recognition
  - Configurable delimiter and format options
- Created FileUpload component with:
  - Drag & drop support
  - Click to browse
  - File type validation
  - Loading state indicator
  - Error display
- Built category mapping service with:
  - Pattern matching (exact, contains, starts_with, regex)
  - Priority-based matching system
  - localStorage for custom mappings
  - Helper functions for category lookups
- Created TransactionList component with:
  - Grid-based layout with Date, Description, Category, Amount columns
  - Color-coded category badges
  - Transaction badges (income, uncategorized, high value)
  - Swedish locale number formatting
- Integrated all components into App.tsx with:
  - State management for transactions
  - Summary statistics display (expenses, income, categorization %, net change)
  - Conditional rendering (upload view vs analysis view)

**Files Created:**
- `src/utils/csv-parser.ts` - CSV parsing and column detection
- `src/utils/category-service.ts` - Category matching and lookups
- `src/utils/index.ts` - Utility exports
- `src/components/FileUpload.tsx` - Drag & drop file upload
- `src/components/TransactionList.tsx` - Transaction table display
- `src/components/index.ts` - Component exports

**Files Modified:**
- `src/App.tsx` - Full integration of upload flow and transaction display

**Key Decisions:**

1. **Column Auto-Detection:**
   - Analyze sample values to detect data types
   - Boost confidence based on Swedish header names
   - Fall back to heuristics for unnamed columns

2. **Pattern Matching Priority:**
   - Higher priority patterns checked first
   - Custom user mappings override defaults
   - Sorted by priority before matching

3. **State Management:**
   - Using React useState for now (simple, no extra deps)
   - Will evaluate Zustand if state becomes complex

4. **No New Dependencies:**
   - All parsing done with vanilla TypeScript
   - No external CSV libraries needed

**Testing Notes:**
The parser is ready to test with real Swedish bank CSV exports. Upload a file to see:
- Auto-categorization of known merchants
- Summary statistics
- Transaction list with category badges

**Running the Project:**
```bash
npm run dev
# Open http://localhost:5173
# Drag & drop a CSV file to test
```

**Next Steps (Phase 2):**
- Add transaction filtering and search
- Implement category breakdown charts
- Add ability to manually re-categorize transactions
- Build subscription detection

---

## Entry #005 - 2025-12-19

### Demo Mode Feature

**What was done:**
- Added "Demo Mode" functionality for users to explore the app without their own data
- Created `/public/demo-data.csv` from sample transaction data
- Added demo section in the welcome card with:
  - Clear "DEMO" badge label
  - Description explaining the feature purpose
  - "Load Demo Data" button
- When viewing demo data:
  - Shows prominent "DEMO MODE" banner at top
  - Header shows "DEMO" badge next to title
  - Button changes to "Exit Demo" instead of "Upload New File"
  - Clear messaging that sample data is being viewed

**UI/UX Decisions:**
1. **Prominent but not intrusive demo indicator:**
   - Blue-themed banner matches primary color scheme
   - Badge in header for quick identification
   - Always clear way to exit demo mode

2. **Demo description:**
   - Explains what users will see (categories, summaries)
   - Sets expectations before loading
   - Positioned below file upload, suggesting "try before you commit"

**Files Modified:**
- `src/App.tsx` - Added demo mode state, handler, and UI elements

**Files Created:**
- `public/demo-data.csv` - Sample transactions served as static asset

**No New Dependencies Added**

---

## Entry #006 - 2025-12-19

### Transaction Filtering & Search

**What was done:**
- Implemented comprehensive filtering system for transactions
- Created FilterPanel component with:
  - Real-time search by transaction description
  - Category multi-select filter with checkboxes
  - Date range picker (from/to)
  - Amount range filter (min/max in kr)
  - Quick filters: "Uncategorized only" and "Subscriptions only"
  - Active filter badges showing applied filters
  - Clear all filters button
  - Expandable/collapsible filter panel
  - Results count showing filtered vs total transactions
- Created useTransactionFilters hook for filtering logic:
  - Memoized filtering for performance
  - Supports all filter types with AND logic
  - Amount filter uses absolute value
  - Date range is inclusive
- Integrated filtering into App.tsx:
  - Filters reset when clearing data or loading new file
  - FilterPanel appears above transaction list
  - TransactionList receives filtered results

**Key Decisions:**

1. **Collapsible Filter Panel:**
   - Search is always visible for quick access
   - Advanced filters expand on demand
   - Badge count shows active filter types

2. **Amount Filtering:**
   - Uses absolute value so users don't need to think about negative amounts
   - Min/max allows flexible range queries

3. **Filter Logic:**
   - All filters use AND logic (must match all)
   - Category filter: transaction must match ANY selected category
   - Empty filters are ignored (no filtering applied)

**Files Created:**
- `src/components/FilterPanel.tsx` - Filter UI component
- `src/hooks/useTransactionFilters.ts` - Filter logic hook
- `src/hooks/index.ts` - Hook exports

**Files Modified:**
- `src/components/index.ts` - Added FilterPanel export
- `src/App.tsx` - Integrated filtering state and components

**No New Dependencies Added**

---

## Entry Template

```markdown
## Entry #XXX - YYYY-MM-DD

### [Title]

**What was done:**
-

**Key Decisions:**
-

**Challenges Faced:**
-

**Solutions Applied:**
-

**Next Steps:**
-
```

---

## Development Guidelines

### Commit Message Format
```
type(scope): description

Types: feat, fix, refactor, style, docs, test, chore
Scope: core, ui, parser, categories, charts, etc.
```

### Branch Naming
```
feature/description
bugfix/description
refactor/description
```

### Code Review Checklist
- [ ] Follows established patterns
- [ ] No hardcoded values that should be configurable
- [ ] Proper TypeScript types
- [ ] Handles edge cases
- [ ] No console.logs in production code
- [ ] Accessible UI components

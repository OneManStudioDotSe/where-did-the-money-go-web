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

## Entry #007 - 2025-12-19

### Time Period Selector

**What was done:**
- Implemented time-based transaction grouping and filtering
- Created TimePeriodSelector component with:
  - Five period types: Day, Week, Month, Quarter, Year
  - Clickable period type buttons with transaction counts
  - Dynamic period list generated from actual transaction dates
  - Click to select a specific period (e.g., "December 2025", "Week 50")
  - Selected period info bar showing date range
  - Clear selection functionality
- Created useTimePeriodFilter hook for filtering logic:
  - Filters transactions by date range
  - Calculates period-specific stats (expenses, income, net change)
  - Works in combination with existing filters
- Integrated with existing filter system:
  - Time period filter applied first, then regular filters
  - Summary stats update to show period-specific data
  - Transaction count shows "X of Y" when period is selected
  - Period label displayed in header

**Key Decisions:**

1. **Two-step selection:**
   - First select period type (Day/Week/Month/Quarter/Year)
   - Then select specific period from available options
   - Cleaner UX than a single complex dropdown

2. **Filter chain order:**
   - Time period filter applied first
   - Regular filters (category, search, amount) applied on top
   - Stats calculated from period-filtered data

3. **Week calculation:**
   - ISO week numbers (Monday = first day)
   - Shows week number and year (e.g., "Week 50, 2025")

4. **Period detection:**
   - Dynamically extracts available periods from transaction data
   - Shows count of available periods per type
   - Sorted most recent first

**Files Created:**
- `src/components/TimePeriodSelector.tsx` - Period selection UI
- `src/hooks/useTimePeriodFilter.ts` - Period filtering hook

**Files Modified:**
- `src/components/index.ts` - Added TimePeriodSelector export
- `src/hooks/index.ts` - Added useTimePeriodFilter export
- `src/App.tsx` - Integrated period selector and filtering

**No New Dependencies Added**

---

## Entry #008 - 2025-12-19

### Transaction List Improvements

**What was done:**
- Added sortable column headers to TransactionList:
  - Date (newest/oldest)
  - Description (A-Z/Z-A)
  - Category (A-Z/Z-A)
  - Amount (highest/lowest)
  - Sort direction indicators (up/down arrows)
- Added Condensed/Expanded view toggle:
  - Condensed: smaller padding, shorter date format, compact badges
  - Expanded: full badges, detailed category display
- Added transaction row tooltips showing full details on hover
- Custom month start day setting in TimePeriodSelector:
  - Settings gear icon opens configuration panel
  - Dropdown to select day 1-28
  - Persisted to localStorage
  - Useful for Swedish salary cycles (typically paid on 25th)

**Key Decisions:**
1. **In-component sorting:** State managed within TransactionList for simplicity
2. **CSS-based tooltips:** Using group-hover instead of JS tooltip library
3. **Month start day:** Affects how transactions are grouped into "months"

**Files Modified:**
- `src/components/TransactionList.tsx` - Sorting, condensed view, tooltips
- `src/components/TimePeriodSelector.tsx` - Settings panel for month start day

**No New Dependencies Added**

---

## Entry #009 - 2025-12-19

### Spending Visualization Component

**What was done:**
- Created comprehensive SpendingVisualization component with:
  - Bar chart showing category breakdown
  - Donut chart showing spending distribution
  - Toggle between chart types
  - Quick stats summary (expenses, income, net)
  - Trends & Averages section
  - Category totals table with expandable subcategories
- Updated App.tsx layout:
  - Two-column grid on large screens
  - Visualization panel next to transaction list
  - Both update when time period changes

**Key Features:**

1. **Bar Chart:**
   - Horizontal bars with category colors
   - Width represents percentage of total spending
   - Shows transaction count inside bar
   - Category icon and name on left
   - Amount on right

2. **Donut Chart:**
   - Custom SVG implementation (no library)
   - Interactive segments with hover effects
   - Center shows total or hovered category
   - Color legend below

3. **Trends & Averages:**
   - Compares current period to historical average
   - Shows percentage change with up/down arrows
   - Red = spending more than average
   - Green = spending less than average
   - Daily average calculation

4. **Category Totals Table:**
   - Click to expand subcategories
   - Toggle view mode (categories only / with subcategories)
   - Shows amount, percentage, and transaction count
   - Sorted by spending amount

**Key Decisions:**

1. **Custom SVG Charts:** Built donut chart from scratch using SVG path calculations
   - No external chart library dependency
   - Full control over styling and interactivity
   - Smaller bundle size

2. **Trend Calculation:** Groups all transactions by period type, calculates average
   - Uses same period type as currently selected
   - Shows how current period compares to typical spending

3. **Layout:** Side-by-side on large screens, stacked on mobile
   - Both panels share the same filtered data
   - Period selection affects both simultaneously

**Files Created:**
- `src/components/SpendingVisualization.tsx` - Main visualization component

**Files Modified:**
- `src/components/index.ts` - Export SpendingVisualization
- `src/App.tsx` - Two-column layout with visualization

**No New Dependencies Added**

---

## Entry #010 - 2025-12-19

### UI Improvements & Settings Panel

**What was done:**
- Changed layout ratio from 50/50 to 2/5 (visualization) and 3/5 (transactions)
- Added vertical bar chart as third visualization option
- Moved transaction tooltip to info icon (?) at far right of each row
- Created comprehensive Settings Panel with:
  - Date format selection (ISO, European, US, German)
  - Month start day setting (1-28)
  - Icon set selection (emoji, minimal, colorful - last two coming soon)
- Added new Phase 8 "UI Themes & Icons" to development roadmap
- Renumbered AI Insights to Phase 9

**Key Features:**

1. **Layout Ratio Change:**
   - Grid changed from `grid-cols-2` to `grid-cols-5`
   - Visualization gets `col-span-2` (40%)
   - Transactions get `col-span-3` (60%)
   - Better balance for data-heavy transaction lists

2. **Vertical Bar Chart:**
   - Custom SVG-based implementation
   - Shows top 8 spending categories
   - Category icons displayed below bars
   - Hover state with tooltip showing details
   - Bar height represents percentage of max spending

3. **Info Icon Tooltip:**
   - Replaced row-wide hover tooltip with targeted info icon
   - Uses nested group hover (`group/tooltip`) for isolation
   - Icon positioned at far right of transaction row
   - Shows date, description, category, and amount on hover

4. **Settings Panel:**
   - Modal design with header, content, and footer
   - Date format: Affects date display throughout app
   - Month start day: For Swedish salary cycles (typically 25th)
   - Icon set: Placeholder for future icon set implementations
   - Settings persisted to localStorage

5. **Roadmap Update:**
   - New Phase 8 covers UI themes and icons
   - Planned features: minimal icons, colorful icons, custom themes, dark mode
   - AI Insights moved to Phase 9

**Files Created:**
- `src/components/SettingsPanel.tsx` - Settings modal component

**Files Modified:**
- `src/App.tsx` - Layout ratio, settings button, settings panel integration
- `src/components/SpendingVisualization.tsx` - Vertical bar chart, chart toggle
- `src/components/TransactionList.tsx` - Info icon tooltip
- `src/components/ProjectRoadmap.tsx` - New Phase 8, renumbered Phase 9
- `src/components/index.ts` - Export SettingsPanel

**No New Dependencies Added**

---

## Entry #011 - 2025-12-19

### Manual Category Re-assignment

**What was done:**
- Implemented manual category re-assignment for transactions
- Created CategorySelector component for choosing categories
- Created TransactionEditModal for editing individual transactions
- Created UncategorizedCarousel for batch categorization
- Updated stats panel with clickable uncategorized count
- Wired up transaction click handler in TransactionList

**Key Features:**

1. **CategorySelector Component:**
   - Searchable input filters categories and subcategories
   - Categories display as expandable accordion sections
   - Subcategories shown in 2-column grid layout
   - Selected subcategory highlighted with primary color
   - Reusable across edit modal and carousel

2. **TransactionEditModal:**
   - Shows transaction details (description, date, amount)
   - Displays current category with icon and color
   - Preview of new category selection before saving
   - Save button disabled until valid selection made
   - Click outside modal to close

3. **UncategorizedCarousel:**
   - Split-view design: transaction list (left) + category selector (right)
   - Pagination with 10 transactions per page
   - Page navigation with prev/next buttons
   - Progress indicator showing remaining count
   - Skip button to move to next transaction
   - Apply Category button to confirm selection
   - Auto-advances to next transaction after categorization
   - Success state when all transactions categorized

4. **Stats Panel Updates:**
   - Replaced single "Categorized" stat with split display
   - Green box shows categorized count
   - Warning-colored box shows uncategorized count
   - Uncategorized box is clickable when count > 0
   - "Fix now →" label prompts user to take action

5. **Transaction Click Handler:**
   - Any transaction row is now clickable
   - Opens TransactionEditModal with that transaction
   - Updates transaction in state after save

**Design Decisions:**

1. **Split View for Carousel:**
   - Easier to scan transactions while selecting category
   - Don't lose context when making selections
   - Similar to email/inbox patterns users are familiar with

2. **Pagination over Infinite Scroll:**
   - Grouped by 10 to avoid overwhelming users
   - Clear progress indication (page X of Y)
   - Predictable navigation

3. **Real-time Updates:**
   - Changes reflected immediately in UI
   - No separate "save all" step needed
   - Uncategorized count updates live

**Files Created:**
- `src/components/CategorySelector.tsx` - Reusable category picker
- `src/components/TransactionEditModal.tsx` - Individual transaction editing
- `src/components/UncategorizedCarousel.tsx` - Batch categorization workflow

**Files Modified:**
- `src/components/index.ts` - Export new components
- `src/components/ProjectRoadmap.tsx` - Mark manual assignment as complete
- `src/App.tsx` - State for modals, handlers, integration

**No New Dependencies Added**

---

## Entry #012 - 2025-12-19

### UI Overhaul - Phase 8 Complete

**What was done:**
- Implemented comprehensive UI overhaul including dark mode, multiple icon sets, and new layout components
- Created 4 switchable icon sets: Emoji (default), Icons8 3D Fluency, Phosphor, OpenMoji
- Added full dark mode support with system preference detection
- Changed primary color theme from blue to teal/cyan (#14b8a6)
- Built sticky header with logo, navigation, and mobile hamburger menu
- Created footer with About, Disclaimer, Privacy links
- Implemented hash-based routing for content pages
- Created content pages: Features, How It Works, About, Privacy, Disclaimer
- Built reusable Card component with variants (default, elevated, interactive)
- Added dark mode classes (`dark:`) to ALL components in the application
- Created Settings Context for app-wide settings without prop drilling

**Key Features:**

1. **Multiple Icon Sets:**
   - Icon configuration in `src/config/icon-sets.ts`
   - CDN-based loading for Icons8, Phosphor, OpenMoji
   - CategoryIcon component handles all icon rendering
   - Settings panel allows switching between sets

2. **Dark Mode:**
   - `useDarkMode` hook manages theme state
   - Supports: light, dark, system (auto-detect)
   - Persisted to localStorage
   - DarkModeToggle component with sun/moon icons
   - Pattern: `bg-white dark:bg-slate-800`, `text-gray-900 dark:text-white`

3. **Layout Components:**
   - Header: sticky, logo left, nav right, mobile menu
   - Footer: links, copyright, creator info
   - MobileMenu: slide-out drawer with overlay

4. **Content Pages:**
   - Hash-based routing (`#/features`, `#/about`, etc.)
   - useHashRouter hook for navigation
   - Real content (not placeholder text)

5. **Card Component:**
   - Three variants: default, elevated, interactive
   - Subcomponents: CardHeader, CardContent, CardFooter
   - Dark mode compatible

**Files Created:**
- `src/config/icon-sets.ts` - Icon set configurations
- `src/components/ui/CategoryIcon.tsx` - Universal icon component
- `src/components/ui/Card.tsx` - Reusable card with variants
- `src/components/DarkModeToggle.tsx` - Theme toggle button
- `src/components/layout/Header.tsx` - Sticky header
- `src/components/layout/Footer.tsx` - Footer component
- `src/components/layout/MobileMenu.tsx` - Mobile navigation
- `src/hooks/useDarkMode.ts` - Dark mode state management
- `src/hooks/useHashRouter.ts` - Hash-based routing
- `src/context/SettingsContext.tsx` - Settings context provider
- `src/pages/FeaturesPage.tsx` - Features showcase
- `src/pages/HowItWorksPage.tsx` - Step-by-step guide
- `src/pages/AboutPage.tsx` - About the app
- `src/pages/PrivacyPage.tsx` - Privacy policy
- `src/pages/DisclaimerPage.tsx` - Legal disclaimer

**Files Modified:**
- `src/index.css` - Teal color palette, dark mode base
- `src/App.tsx` - Layout with Header/Footer, routing
- `src/components/SettingsPanel.tsx` - Dark mode + icon set options
- `src/components/TransactionList.tsx` - Dark mode classes
- `src/components/FilterPanel.tsx` - Dark mode classes
- `src/components/SpendingVisualization.tsx` - Dark mode classes
- `src/components/FileUpload.tsx` - Dark mode classes
- `src/components/ProjectRoadmap.tsx` - Dark mode classes, updated Phase 8
- `src/components/CategorySelector.tsx` - Dark mode classes
- `src/components/TimePeriodSelector.tsx` - Dark mode classes
- `src/components/UncategorizedCarousel.tsx` - Dark mode classes
- `src/components/TransactionEditModal.tsx` - Dark mode classes
- `src/components/index.ts` - Export new components

**Key Decisions:**

1. **CDN-based Icons:** Avoided npm packages for icon libraries
   - Reduces bundle size
   - Faster initial load (no upfront download)
   - Easy to add more icon sets later

2. **Hash-based Routing:** No React Router dependency
   - Simpler implementation
   - Works with static hosting
   - Smaller bundle

3. **Dark Mode Pattern:** Used Tailwind's `dark:` variant consistently
   - `bg-white dark:bg-slate-800` for containers
   - `text-gray-900 dark:text-white` for primary text
   - `border-gray-200 dark:border-slate-700` for borders

4. **Settings Context:** Created to avoid prop drilling
   - Theme, icon set accessible everywhere
   - Single source of truth for app settings

**Challenges Faced:**
- Ensuring consistent dark mode styling across ~15 components
- Avoiding duplicate className attributes during edits
- CDN icon loading states and fallbacks

**Solutions Applied:**
- Systematic approach: updated components one by one
- Used consistent dark mode color mapping
- CategoryIcon handles loading states gracefully

**No New npm Dependencies Added**

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

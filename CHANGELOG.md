# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Subscription detection
- Custom category creation
- AI-powered insights
- Multiple icon sets (minimal, colorful)
- Dark mode support

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

### [0.2.0] - TBD - Filtering & Charts Phase

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

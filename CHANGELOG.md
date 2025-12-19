# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Transaction filtering and search
- Chart visualizations (category breakdown, spending trends)
- Subscription detection
- Manual category re-assignment UI
- AI-powered insights

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

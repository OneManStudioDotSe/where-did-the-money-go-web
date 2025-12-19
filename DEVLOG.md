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

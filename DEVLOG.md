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
- [ ] CSS approach? (Tailwind, CSS Modules, Styled Components)
- [ ] Testing strategy?

**Next Steps:**
- Set up project scaffolding
- Define TypeScript interfaces for core data models
- Create sample CSV for development

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

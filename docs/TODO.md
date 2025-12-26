# Where Did The Money Go? - Development Roadmap

## Completed Phases

### Phase 1: Foundation & Polish ✅
- [x] Toast notification system
- [x] Transaction persistence to localStorage
- [x] Loading skeleton components
- [x] Fix AboutPage contact section

### Phase 2: Data Quality & Accuracy ✅
- [x] Expand category mappings - 72+ new Swedish merchant mappings added (coffee shops, restaurants, convenience stores, entertainment, shopping, subscriptions, parking, income)
- [x] Improve category matching accuracy - Swedish character normalization (å/ä/ö → a/a/o for matching) and token-based matching for multi-word patterns
- [x] Add manual category mapping rules - Let users create their own merchant → category mappings (toggle in Settings)
- [x] Subscription detection refinement - Enhanced algorithm with frequency detection (weekly, bi-weekly, monthly, quarterly, annual), confidence scoring (70% threshold), custom naming/aliases, and next payment prediction
- [x] Data validation - Suspicious transaction detection with exact/near duplicates, large transactions, and unusual merchant amounts; review dialog with dismiss functionality

### Phase 3: Enhanced Insights & Visualizations ✅
- [x] Monthly comparison charts - Compare spending across months
- [x] Top merchants analysis - See where you spend most frequently
- [x] Vertical bar chart improvements - Now default view with wider bars and larger labels

### Phase 4: User Experience & Polish ✅
- [x] Bulk transaction editing - Select multiple transactions to recategorize (toggle in Settings)
- [x] Export enhancements - PDF reports, filtered exports, custom date ranges
- [x] Hide ad placeholders toggle in settings
- [x] Onboarding tour - First-time user walkthrough

### Critical Fixes ✅
- [x] Error boundaries for each major section (not just one global)
- [x] Empty states for all lists and panels
- [x] Mobile responsiveness audit and fixes

---

## Future Phases

### Phase 5: AI & Smart Features
- [ ] AI-powered spending insights and recommendations
- [ ] Anomaly detection for unusual spending patterns
- [ ] Natural language search ("show me all coffee purchases last month")

### Phase 6: Multi-Bank & Data Management
- [ ] Support for additional CSV formats (Swedbank, Handelsbanken, Nordea)
- [ ] Multi-account support with account switching
- [ ] Data import from previous sessions
- [x] Data export in multiple formats (CSV, JSON, Excel)

### Phase 8: Platform Expansion
- [ ] Progressive Web App (PWA) with offline support
- [ ] Browser extension for automatic CSV download detection
- [ ] Desktop app (Electron)

---

## Known Issues & Technical Debt

### Performance ✅
- [x] Implement virtualized transaction list for handling 10,000+ transactions
- [x] Add Web Workers for CSV parsing to avoid blocking the main thread
- [x] Lazy load chart components with loading skeletons

### Testing ✅
- [x] Unit tests for core utilities (Vitest with 57 tests for csv-parser, category-service, subscription-detection)
- [x] Integration tests for main user flows (using @testing-library/react)
- [x] E2E tests with Playwright (basic smoke tests for app loading, navigation, responsive design)

### Code Quality ✅
- [x] Add ESLint with strict rules (typescript-eslint with consistent-type-imports, no-explicit-any, max-lines-per-function)
- [x] Add Prettier for consistent formatting (semi, singleQuote, tabWidth: 2)
- [x] Document component props with JSDoc/TSDoc (FileUpload, TransactionList, CategorySelector, SubscriptionPanel)
- [x] Create Storybook for component library (v10.1 with autodocs, a11y addon)

---

## Quick Wins (Low Effort, High Impact) ✅

- [x] Add "Last updated" timestamp to transaction list
- [x] Show transaction count in category breakdown
- [x] Add "Copy to clipboard" for export data
- [x] Keyboard shortcuts (Ctrl+F for search, +S for settings, +E for export, Alt+1/2/3 for tabs)
- [x] Remember last used tab (Overview/Transactions/Subscriptions)
- [x] Change settings from modal dialog to sliding side panel

---

## Quick Wins - Round 2

### UI/UX Enhancements ✅
- [x] Double-click to edit transaction category - Inline category change without opening a menu
- [x] Sticky table headers - Keep column headers visible when scrolling through long lists
- [x] Transaction row hover preview - Tooltip with full merchant name and notes for truncated text
- [x] "Jump to today" button - Quick navigation to current month in date filters 
- [x] Collapsible sidebar sections - Let users collapse/expand sections in the settings panel

### Data & Insights ✅
- [x] Daily spending average - Show "You spend ~X kr/day this month" in the overview
- [x] Show a calendar with the total spending for each day
- [x] Largest transaction badge - Highlight the biggest expense/income in the transaction list
- [x] Category percentage change - Show "↑12% vs last month" next to each category in breakdown

### Accessibility & Polish ✅
- [x] Focus visible indicators - Better keyboard navigation focus styles throughout the app
- [x] Reduced motion preference - Respect `prefers-reduced-motion` for users who prefer less animation
- [x] High contrast mode - Toggle for users who need stronger color contrast

### Developer Experience ✅
- [x] Clear all data button - One-click reset in settings for testing or starting fresh
- [x] Debug mode toggle - Show raw transaction data and internal IDs for troubleshooting
- [x] Debug mode toggle - Suggest and add more toggles and controls for features and functionality

---

*Last updated: 2025-12-26*

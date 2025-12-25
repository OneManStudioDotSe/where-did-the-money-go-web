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

### Phase 5: AI & Smart Features (Planned)
- [ ] AI-powered spending insights and recommendations
- [ ] Anomaly detection for unusual spending patterns
- [ ] Budget recommendations based on historical spending
- [ ] Savings goal tracking and suggestions
- [ ] Natural language search ("show me all coffee purchases last month")

### Phase 6: Multi-Bank & Data Management (Planned)
- [ ] Support for additional Swedish bank CSV formats (Swedbank, Handelsbanken, Nordea)
- [ ] Multi-account support with account switching
- [ ] Data import from previous sessions
- [ ] Transaction history merging (avoid duplicates across imports)
- [ ] Data export in multiple formats (CSV, JSON, Excel)

### Phase 7: Advanced Analytics (Planned)
- [ ] Year-over-year spending comparison
- [ ] Category spending forecasting
- [ ] Merchant spending trends over time
- [ ] Budget vs actual comparison charts
- [ ] Seasonal spending pattern detection

### Phase 8: Social & Sharing (Planned)
- [ ] Generate shareable spending reports (anonymized)
- [ ] Compare spending against anonymized benchmarks
- [ ] Family/household expense sharing
- [ ] Split expense tracking

### Phase 9: Platform Expansion (Planned)
- [ ] Progressive Web App (PWA) with offline support
- [ ] Mobile app (React Native)
- [ ] Browser extension for automatic CSV download detection
- [ ] Desktop app (Electron)

---

## Known Issues & Technical Debt

### Performance
- [ ] Optimize large dataset handling (10,000+ transactions)
- [ ] Add virtual scrolling for transaction list
- [ ] Lazy load chart components

### Accessibility
- [ ] Full WCAG 2.1 AA compliance audit
- [ ] Screen reader testing
- [ ] Keyboard navigation improvements

### Testing
- [ ] Unit tests for core utilities (csv-parser, category-service, subscription-detection)
- [ ] Integration tests for main user flows
- [ ] E2E tests with Playwright

### Code Quality
- [ ] Add ESLint with strict rules
- [ ] Add Prettier for consistent formatting
- [ ] Document component props with JSDoc/TSDoc
- [ ] Create Storybook for component library

---

## Quick Wins (Low Effort, High Impact)

- [ ] Add "Last updated" timestamp to transaction list
- [ ] Show transaction count in category breakdown
- [ ] Add "Copy to clipboard" for export data
- [ ] Keyboard shortcut for common actions (Ctrl+F for search)
- [ ] Remember last used tab (Overview/Transactions/Subscriptions)

---

## Feature Requests (Community)

*This section is for tracking user-requested features*

- None yet - share feedback at [GitHub Issues](https://github.com/your-repo/issues)

---

*Last updated: 2025-12-25*

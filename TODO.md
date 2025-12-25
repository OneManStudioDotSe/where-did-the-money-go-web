# Where Did The Money Go? - Development Roadmap

## Phase 1: Foundation & Polish ✅
- [x] Toast notification system
- [x] Transaction persistence to localStorage
- [x] Loading skeleton components
- [x] Fix AboutPage contact section

---

## Phase 2: Data Quality & Accuracy
- [x] Expand category mappings - 72+ new Swedish merchant mappings added (coffee shops, restaurants, convenience stores, entertainment, shopping, subscriptions, parking, income)
- [ ] Improve category matching accuracy - Add fuzzy matching, handle Swedish characters better
- [x] Add manual category mapping rules - Let users create their own merchant → category mappings (toggle in Settings)
- [ ] Subscription detection refinement - Better handling of varying amounts, detect annual subscriptions
- [ ] Data validation - Warn about suspicious transactions (duplicates, unusual amounts)

## Phase 3: Enhanced Insights & Visualizations ✅
- [x] Monthly comparison charts - Compare spending across months
- [x] Top merchants analysis - See where you spend most frequently
- [x] Vertical bar chart improvements - Now default view with wider bars and larger labels

## Phase 4: User Experience & Polish
- [x] Bulk transaction editing - Select multiple transactions to recategorize (toggle in Settings)
- [x] Export enhancements - PDF reports, filtered exports, custom date ranges
- [x] Hide ad placeholders toggle in settings
- [ ] Onboarding tour - First-time user walkthrough

## Critical Fixes (High Priority) ✅
- [x] Error boundaries for each major section (not just one global)
- [x] Empty states for all lists and panels
- [x] Mobile responsiveness audit and fixes

---

*Last updated: 2025-12-25*

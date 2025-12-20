# Changelog

All notable changes to this project will be documented in this file.

---

## [Unreleased] - 2025-12-21

### UI/UX Improvements

#### CSV Import Dialog
- **Layout**: Changed Delimiter and Bank settings to display side by side using flexbox layout
- **Large File Warning**: Moved warning message into File Info section with proper dark mode support (amber color scheme)

#### Subscription Management
- **Confirmation Dialog**: Fixed dark mode readability with brighter border colors (`dark:border-primary-400`, `dark:border-amber-400`) and conditional text styling based on selection state
- **Details Dialog**: Redesigned with 2-column layout - cost info (Monthly/Yearly) on left, details (Type, Billing Day, Payments, Last Paid) on right
- **Card Entries**: Subscription cards are clickable to open the details modal

#### Transaction Display
- **Title Case**: Added `toTitleCase` utility function to convert transaction descriptions to proper title case format
- Applied to: SubscriptionConfirmationDialog, SubscriptionGrid, SubscriptionList, TransactionList, UncategorizedCarousel, TransactionEditModal

#### Time Period Selector
- **Persistence**: Time period selection now persists when switching between tabs (Overview, Transactions, Subscriptions)
- Added `useEffect` to sync `activePeriodType` state with `selectedPeriod` prop

#### Summary Statistics
- **Currency Display**: Added "kr" suffix to Expenses/Income/Net boxes in TimePeriodSelector

#### Reset Functionality
- **Confirmation Dialog**: Added confirmation dialog when clicking "Start Over" that shows number of saved subscriptions
- Options to "Keep Subscriptions & Start Over" or "Reset Everything (Including Subscriptions)"

#### Spending Analysis
- **Clickable Bars**: Horizontal bar chart bars are now clickable to expand and show subcategory breakdown
- **Animations**: Added CSS keyframe animation for bar growth effect (`animate-bar-grow`)
- **Category Breakdown Table**: Subcategories now always show when expanded, regardless of view mode toggle

#### Uncategorized Dialog
- **Dark Mode**: Full dark mode support added to all elements
- **Scroll Lock**: Added `useEffect` to lock body scroll when dialog is open

#### Header & Branding
- **Taller Header**: Increased height from `h-16` to `h-20`
- **Larger Logo**: Logo icon increased from `w-10 h-10` to `w-12 h-12`, icon from `w-6 h-6` to `w-7 h-7`
- **Larger Text**: Title text increased from `text-lg` to `text-xl`, subtitle from `text-xs` to `text-sm`
- **Hover Animation**: Added `group-hover:scale-105` effect on logo

#### Browser Tab & Favicon
- **Page Title**: Updated to "Where Did The Money Go? - Privacy-First Expense Tracker"
- **Meta Description**: Added SEO-friendly description
- **Favicon**: Created custom SVG favicon with gradient teal background and bar chart icon

### New Files
- `src/utils/text-utils.ts` - Title case conversion utility
- `public/favicon.svg` - Custom app favicon

### Technical Improvements
- Added bar chart animation CSS in `src/index.css`
- Added `showResetConfirmation` state and `performReset` function in App.tsx
- Updated utility exports in `src/utils/index.ts`

---

## Previous Updates

### Subscription vs Recurring Expense Differentiation
- Added `RecurringType` enum ('subscription' | 'recurring_expense')
- Updated `SubscriptionConfirmationDialog` with 3-option selection (Subscription, Recurring Expense, Ignore)
- Added badge rendering for recurring expenses
- Updated SubscriptionPanel to show both subscription and recurring expense types

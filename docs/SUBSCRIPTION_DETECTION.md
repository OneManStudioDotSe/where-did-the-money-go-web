# Subscription Detection System

This document describes the enhanced subscription detection algorithm used in "Where Did The Money Go?" to automatically identify recurring payments.

---

## Overview

The subscription detection system analyzes transaction patterns to identify recurring payments across multiple billing frequencies. It assigns confidence scores to help users distinguish between definite subscriptions and potential false positives.

**Key Features:**
- Multi-frequency detection (weekly to annual)
- Confidence scoring (0-100)
- Custom naming/aliases
- Next payment prediction
- Variable amount tolerance

---

## Supported Billing Frequencies

| Frequency | Expected Gap | Tolerance | Min Occurrences |
|-----------|-------------|-----------|-----------------|
| Weekly | 7 days | ±2 days | 4 |
| Bi-weekly | 14 days | ±3 days | 3 |
| Monthly | 30 days | ±5 days | 3 |
| Quarterly | 90 days | ±10 days | 2 |
| Annual | 365 days | ±15 days | 2 |

### Frequency Detection Logic

1. Group transactions by normalized merchant name
2. Sort by date (ascending)
3. Calculate gaps between consecutive transactions
4. Compute median gap to identify dominant frequency
5. Match median gap to closest frequency category
6. Validate that most gaps fall within the frequency's tolerance

---

## Confidence Scoring (0-100)

Each detected subscription receives a confidence score based on four factors:

### Score Components

| Factor | Weight | Description |
|--------|--------|-------------|
| Amount Consistency | 30% | How similar are the payment amounts? |
| Timing Regularity | 30% | How consistent are the payment intervals? |
| Occurrence Count | 20% | More occurrences = higher confidence |
| Pattern Clarity | 20% | How well does it match a single frequency? |

### Amount Consistency Score (0-30)

| Variance | Score |
|----------|-------|
| Exact match (0%) | 30 |
| Within 5% | 25 |
| Within 10% | 20 |
| Within 15% | 15 |
| Within 25% | 10 |
| Higher | 5 |

### Timing Regularity Score (0-30)

| Gaps Within Tolerance | Score |
|----------------------|-------|
| 100% | 30 |
| 90%+ | 25 |
| 80%+ | 20 |
| 70%+ | 15 |
| 60%+ | 10 |
| Lower | 5 |

### Occurrence Count Score (0-20)

| Occurrences | Score |
|-------------|-------|
| 10+ | 20 |
| 6-9 | 15 |
| 4-5 | 10 |
| 3 | 7 |
| 2 | 4 |

### Pattern Clarity Score (0-20)

| Pattern Quality | Score |
|-----------------|-------|
| Single clear frequency | 20 |
| Frequency with some noise | 15 |
| Ambiguous between 2 frequencies | 10 |
| Unclear pattern | 5 |

### Confidence Thresholds

- **High Confidence (75-100)**: Automatically marked as subscription
- **Medium Confidence (50-74)**: Suggested with "Review" prompt
- **Low Confidence (25-49)**: Only shown if "Show uncertain matches" enabled
- **Very Low (<25)**: Not shown

**Note:** The app uses a **70% confidence threshold** by default, validated against real Swedish bank data.

---

## Adaptive Detection

### High-Confidence Fast Detection

When amount variance ≤ 2% AND same day of month (±1 day):
- Minimum occurrences reduced to 3 (instead of frequency default)
- Automatically marked as high confidence

### Amount Tolerance Tiers

| Pattern Type | Tolerance | Examples |
|--------------|-----------|----------|
| Fixed subscriptions | 5% | Netflix, Spotify |
| General recurring | 15% | Default |
| Usage-based services | 25% | Cloud storage, utilities |

The system tries tolerances in order:
1. Strict (5%) - marks as "fixed amount"
2. Normal (15%) - general recurring
3. Loose (25%) - marks as "variable amount"

---

## Detected Subscription Data

Each detected subscription includes:

```typescript
interface DetectedSubscription {
  // Identification
  id: string;
  recipientName: string;
  customName?: string;  // User-assigned alias

  // Amount info
  averageAmount: number;
  minAmount: number;
  maxAmount: number;
  amountVariance: number;  // Percentage
  amountType: 'fixed' | 'variable';

  // Occurrence tracking
  transactionIds: string[];
  occurrenceCount: number;
  firstSeen: Date;
  lastSeen: Date;

  // Detection results
  confidence: number;  // 0-100
  confidenceLevel: 'high' | 'medium' | 'low';
  billingFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
  expectedBillingDay: number;
  nextExpectedDate: Date;

  // Score breakdown
  scoreBreakdown: {
    amountScore: number;
    timingScore: number;
    occurrenceScore: number;
    clarityScore: number;
  };

  // Categorization
  categoryId: string | null;
  subcategoryId: string | null;
}
```

---

## User Features

### Custom Names

Users can assign custom names to subscriptions for better recognition:
- "Bergnäs" → "House Rent"
- "TRYGG-HANSA" → "Home Insurance"

Custom names are:
- Displayed in the subscription list
- Persisted to localStorage
- Editable via the subscription edit modal

### Subscription vs Recurring Expense

Users can classify detected patterns as:
- **Subscription**: Regular service fee (Netflix, Spotify)
- **Recurring Expense**: Regular but non-subscription (rent, utilities)
- **Ignore**: False positive, don't track

### UI Indicators

The subscription panel shows:
- Confidence badge (High/Medium with color)
- Frequency badge (Weekly, Monthly, etc.)
- Amount type (Fixed/Variable)
- Next expected payment date
- Score breakdown (expandable)

---

## Algorithm Flow

```
1. GROUP transactions by normalized recipient name

2. For each group with 2+ transactions:

   a. SORT by date ascending

   b. CALCULATE gaps between consecutive transactions

   c. DETECT FREQUENCY:
      - Compute median gap
      - Match to frequency category
      - Validate gap consistency

   d. CHECK AMOUNT CONSISTENCY:
      - Try strict tolerance (5%) first
      - Fall back to standard (15%) then loose (25%)
      - Calculate amount variance percentage

   e. CALCULATE CONFIDENCE SCORE:
      - Amount consistency (0-30)
      - Timing regularity (0-30)
      - Occurrence count (0-20)
      - Pattern clarity (0-20)
      - Total: 0-100

   f. APPLY ADAPTIVE THRESHOLDS:
      - High confidence + 3 occurrences → Include
      - Medium confidence + min occurrences → Include
      - Low confidence → Include only if above threshold

   g. PREDICT NEXT DATE:
      - Based on detected frequency and last transaction

   h. OUTPUT DetectedSubscription with all metadata

3. SORT results by confidence (highest first)

4. RETURN subscriptions meeting minimum confidence threshold
```

---

## Known Swedish Subscription Patterns

| Merchant | Typical Day | Typical Amount (SEK) | Frequency |
|----------|-------------|---------------------|-----------|
| NETFLIX | ~18th | 149 | Monthly |
| SPOTIFY | ~2nd | 169-189 | Monthly |
| GOOGLE ONE | ~4th | 249 | Monthly |
| TRYGG-HANSA | ~1st | 633 + 638 | Monthly |
| SECTOR ALARM | ~27th | 547 | Monthly |
| APPLE COM/BI | ~21st | 40 | Monthly |
| DISNEY+ | Variable | 89-109 | Monthly |
| HBO MAX | Variable | 99-149 | Monthly |

---

## Configuration

Default configuration values:

```typescript
{
  // Minimum confidence to display
  minConfidence: 70,

  // Amount tolerance tiers
  amountTolerances: {
    strict: 0.05,   // 5%
    normal: 0.15,   // 15%
    loose: 0.25     // 25%
  },

  // Frequency settings
  frequencies: {
    weekly: { enabled: true, minOccurrences: 4 },
    biweekly: { enabled: true, minOccurrences: 3 },
    monthly: { enabled: true, minOccurrences: 3 },
    quarterly: { enabled: true, minOccurrences: 2 },
    annual: { enabled: true, minOccurrences: 2 }
  }
}
```

---

## Storage

Subscription data is stored in localStorage:

- `confirmed_subscriptions`: User-confirmed subscriptions with custom names
- `dismissed_subscriptions`: Patterns user marked to ignore
- `app_settings`: Includes subscription detection preferences

---

*Last updated: 2025-12-25*

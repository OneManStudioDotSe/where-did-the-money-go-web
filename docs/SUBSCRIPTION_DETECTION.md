Let me design the enhanced subscription detection algorithm with frequency detection, lower thresholds for high-confidence patterns, variable amount tolerance, and confidence scoring.
Enhanced Subscription Detection - Full Specification
Overview
The improved algorithm will detect recurring transactions across multiple billing frequencies, assign confidence scores, and adapt detection thresholds based on pattern strength.
1. Billing Frequency Detection
Supported Frequencies:
Frequency	Expected Gap	Tolerance	Min Occurrences
Weekly	7 days	±2 days	4
Bi-weekly	14 days	±3 days	3
Monthly	30 days	±5 days	3
Quarterly	90 days	±10 days	2
Annual	365 days	±15 days	2
Detection Logic:
Calculate gaps between consecutive transactions (sorted by date)
Compute median gap to identify the dominant frequency
Match median gap to closest frequency category
Validate that most gaps fall within the frequency's tolerance
2. Confidence Scoring (0-100)
Score Components:
Factor	Weight	Description
Amount Consistency	30%	How similar are the amounts?
Timing Regularity	30%	How consistent are the intervals?
Occurrence Count	20%	More occurrences = higher confidence
Pattern Clarity	20%	How well does it match a single frequency?
Amount Consistency Score (0-30):
Exact match (0% variance): 30 points
Within 5% variance: 25 points
Within 10% variance: 20 points
Within 15% variance: 15 points
Within 25% variance: 10 points
Higher variance: 5 points
Timing Regularity Score (0-30):
All gaps within tolerance: 30 points
90%+ gaps within tolerance: 25 points
80%+ gaps within tolerance: 20 points
70%+ gaps within tolerance: 15 points
60%+ gaps within tolerance: 10 points
Lower: 5 points
Occurrence Count Score (0-20):
10+ occurrences: 20 points
6-9 occurrences: 15 points
4-5 occurrences: 10 points
3 occurrences: 7 points
2 occurrences: 4 points
Pattern Clarity Score (0-20):
Single clear frequency detected: 20 points
Frequency detected with some noise: 15 points
Ambiguous between 2 frequencies: 10 points
Unclear pattern: 5 points
Confidence Thresholds:
High Confidence (75-100): Auto-suggested as subscription
Medium Confidence (50-74): Suggested with "Review" prompt
Low Confidence (25-49): Only shown if user enables "Show uncertain matches"
Very Low (<25): Not shown
3. Adaptive Detection Thresholds
High-Confidence Fast Detection (lower requirements): When amount variance ≤ 2% AND same day of month (±1 day):
Minimum occurrences: 3 (instead of 4)
Automatically marked as high confidence
Variable Amount Tolerance:
Pattern Type	Amount Tolerance
Fixed subscriptions (Netflix, Spotify)	5%
Usage-based services (cloud, utilities)	25%
General recurring	15% (default)
The system will:
First try strict 5% tolerance
If pattern found, mark as "fixed amount"
If not, try 15% tolerance for general recurring
If still variance, try 25% for "variable amount" patterns
4. Enhanced Output Structure

interface DetectedSubscription {
  // Existing fields
  id: string;
  recipientName: string;
  averageAmount: number;
  minAmount: number;
  maxAmount: number;
  transactionIds: string[];
  occurrenceCount: number;
  firstSeen: Date;
  lastSeen: Date;
  categoryId: string | null;
  subcategoryId: string | null;
  
  // New fields
  confidence: number;              // 0-100 score
  confidenceLevel: 'high' | 'medium' | 'low';
  billingFrequency: 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'annual';
  expectedBillingDay: number;      // Day of month/week depending on frequency
  amountVariance: number;          // Percentage variance in amounts
  amountType: 'fixed' | 'variable';
  nextExpectedDate: Date;          // Predicted next billing date
  
  // Scoring breakdown (for transparency)
  scoreBreakdown: {
    amountScore: number;
    timingScore: number;
    occurrenceScore: number;
    clarityScore: number;
  };
}
5. Algorithm Flow

1. GROUP transactions by normalized recipient name

2. For each group with 2+ transactions:
   
   a. SORT by date ascending
   
   b. CALCULATE gaps between consecutive transactions
   
   c. DETECT FREQUENCY:
      - Compute median gap
      - Match to frequency category (weekly/biweekly/monthly/quarterly/annual)
      - Validate gap consistency
   
   d. CHECK AMOUNT CONSISTENCY:
      - Try strict tolerance (5%) first
      - Fall back to standard (15%) then loose (25%)
      - Calculate amount variance percentage
   
   e. CALCULATE CONFIDENCE SCORE:
      - Amount consistency score (0-30)
      - Timing regularity score (0-30)
      - Occurrence count score (0-20)
      - Pattern clarity score (0-20)
      - Total: 0-100
   
   f. APPLY ADAPTIVE THRESHOLDS:
      - High confidence + 3 occurrences → Include
      - Medium confidence + min occurrences for frequency → Include
      - Low confidence → Include only if above minimum threshold
   
   g. PREDICT NEXT DATE:
      - Based on detected frequency and last transaction date
   
   h. OUTPUT DetectedSubscription with all metadata

3. SORT results by confidence (highest first)

4. RETURN subscriptions meeting minimum confidence threshold
6. Configuration

interface EnhancedDetectionConfig {
  // Minimum confidence to include in results
  minConfidence: number;  // Default: 40
  
  // Whether to show low-confidence matches
  showUncertainMatches: boolean;  // Default: false
  
  // Frequency-specific overrides
  frequencies: {
    weekly: { enabled: boolean; minOccurrences: number };
    biweekly: { enabled: boolean; minOccurrences: number };
    monthly: { enabled: boolean; minOccurrences: number };
    quarterly: { enabled: boolean; minOccurrences: number };
    annual: { enabled: boolean; minOccurrences: number };
  };
  
  // Amount tolerance tiers
  amountTolerances: {
    strict: number;   // Default: 0.05 (5%)
    normal: number;   // Default: 0.15 (15%)
    loose: number;    // Default: 0.25 (25%)
  };
}
7. UI Enhancements
The confirmation dialog will show:
Confidence score badge (High/Medium/Low with color)
Detected frequency (Weekly, Monthly, etc.)
Amount type indicator (Fixed vs Variable)
Next expected date prediction
Option to "Show more" for low-confidence matches
Does this specification look good? Should I adjust any thresholds or add/remove any features before implementing?
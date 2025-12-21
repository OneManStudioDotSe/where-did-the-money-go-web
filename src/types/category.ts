/**
 * Main category definition
 */
export interface Category {
  id: string;
  name: string;
  /** Icon identifier (emoji or icon name) */
  icon: string;
  /** Hex color for charts and badges */
  color: string;
  /** Ordered list of subcategories */
  subcategories: Subcategory[];
}

/**
 * Subcategory within a parent category
 */
export interface Subcategory {
  id: string;
  name: string;
  parentCategoryId: string;
  /** Whether this is a user-created subcategory */
  isCustom?: boolean;
}

/**
 * Flattened category option for dropdowns
 */
export interface CategoryOption {
  categoryId: string;
  categoryName: string;
  subcategoryId: string;
  subcategoryName: string;
  fullPath: string; // "Category > Subcategory"
  color: string;
  icon: string;
}

/**
 * Mapping rule for automatic categorization
 */
export interface CategoryMapping {
  id: string;
  /** Text pattern to match against transaction description */
  pattern: string;
  /** Target category */
  categoryId: string;
  /** Target subcategory */
  subcategoryId: string;
  /** How to match the pattern */
  matchType: 'exact' | 'contains' | 'starts_with' | 'regex';
  /** Higher priority rules are checked first */
  priority: number;
  /** Whether this is a user-created mapping */
  isCustom: boolean;
}

/**
 * Manual category assignment for a specific transaction
 */
export interface ManualAssignment {
  transactionId: string;
  categoryId: string;
  subcategoryId: string;
  /** When this assignment was made */
  assignedAt: Date;
}

/**
 * Summary of spending by category
 */
export interface CategorySummary {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  totalAmount: number;
  transactionCount: number;
  percentageOfTotal: number;
  subcategorySummaries: SubcategorySummary[];
}

export interface SubcategorySummary {
  subcategoryId: string;
  subcategoryName: string;
  totalAmount: number;
  transactionCount: number;
  percentageOfCategory: number;
}

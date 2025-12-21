import type { Transaction } from '../types/transaction';
import type { CategoryMapping, Category, CategoryOption, Subcategory } from '../types/category';
import { defaultCategoryMappings } from '../data/category-mappings';
import { defaultCategories } from '../data/categories';

// ============================================
// Custom Subcategory Storage
// ============================================

const CUSTOM_SUBCATEGORIES_KEY = 'custom_subcategories';

/**
 * Get all custom subcategories from localStorage
 */
export function getCustomSubcategories(): Subcategory[] {
  try {
    const stored = localStorage.getItem(CUSTOM_SUBCATEGORIES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save custom subcategories to localStorage
 */
export function saveCustomSubcategories(subcategories: Subcategory[]): void {
  try {
    localStorage.setItem(CUSTOM_SUBCATEGORIES_KEY, JSON.stringify(subcategories));
  } catch (error) {
    console.error('Failed to save custom subcategories to localStorage:', error);
  }
}

/**
 * Add a new custom subcategory
 */
export function addCustomSubcategory(parentCategoryId: string, name: string): Subcategory {
  const customSubcategories = getCustomSubcategories();
  const newSubcategory: Subcategory = {
    id: `custom-${Date.now()}`,
    name: name.trim(),
    parentCategoryId,
    isCustom: true,
  };
  customSubcategories.push(newSubcategory);
  saveCustomSubcategories(customSubcategories);
  return newSubcategory;
}

/**
 * Remove a custom subcategory
 */
export function removeCustomSubcategory(id: string): void {
  const customSubcategories = getCustomSubcategories().filter((s) => s.id !== id);
  saveCustomSubcategories(customSubcategories);
}

/**
 * Check if a subcategory name already exists in a category
 */
export function subcategoryExists(parentCategoryId: string, name: string): boolean {
  const category = getCategoryWithCustomSubcategories(parentCategoryId);
  if (!category) return false;
  const normalizedName = name.trim().toLowerCase();
  return category.subcategories.some((s) => s.name.toLowerCase() === normalizedName);
}

/**
 * Get a category with custom subcategories merged in
 */
export function getCategoryWithCustomSubcategories(categoryId: string): Category | undefined {
  const baseCategory = defaultCategories.find((c) => c.id === categoryId);
  if (!baseCategory) return undefined;

  const customSubcategories = getCustomSubcategories().filter(
    (s) => s.parentCategoryId === categoryId
  );

  return {
    ...baseCategory,
    subcategories: [...baseCategory.subcategories, ...customSubcategories],
  };
}

/**
 * Get all categories with custom subcategories merged in
 */
export function getAllCategoriesWithCustomSubcategories(): Category[] {
  const customSubcategories = getCustomSubcategories();

  return defaultCategories.map((category) => {
    const categoryCustomSubs = customSubcategories.filter(
      (s) => s.parentCategoryId === category.id
    );
    return {
      ...category,
      subcategories: [...category.subcategories, ...categoryCustomSubs],
    };
  });
}

// ============================================
// Custom Mapping Storage
// ============================================

/**
 * Get all custom mappings from localStorage
 */
export function getCustomMappings(): CategoryMapping[] {
  try {
    const stored = localStorage.getItem('custom_category_mappings');
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Save custom mappings to localStorage
 */
export function saveCustomMappings(mappings: CategoryMapping[]): void {
  try {
    localStorage.setItem('custom_category_mappings', JSON.stringify(mappings));
  } catch (error) {
    console.error('Failed to save custom mappings to localStorage:', error);
  }
}

/**
 * Add a new custom mapping
 */
export function addCustomMapping(mapping: Omit<CategoryMapping, 'id' | 'isCustom'>): CategoryMapping {
  const customMappings = getCustomMappings();
  const newMapping: CategoryMapping = {
    ...mapping,
    id: `custom-${Date.now()}`,
    isCustom: true,
  };
  customMappings.push(newMapping);
  saveCustomMappings(customMappings);
  return newMapping;
}

/**
 * Remove a custom mapping
 */
export function removeCustomMapping(id: string): void {
  const customMappings = getCustomMappings().filter((m) => m.id !== id);
  saveCustomMappings(customMappings);
}

/**
 * Get all mappings (custom + default), sorted by priority
 */
export function getAllMappings(): CategoryMapping[] {
  const custom = getCustomMappings();
  const all = [...custom, ...defaultCategoryMappings];
  return all.sort((a, b) => b.priority - a.priority);
}

/**
 * Check if a description matches a pattern
 */
function matchesPattern(description: string, mapping: CategoryMapping): boolean {
  const upperDesc = description.toUpperCase();
  const upperPattern = mapping.pattern.toUpperCase();

  switch (mapping.matchType) {
    case 'exact':
      return upperDesc === upperPattern;
    case 'starts_with':
      return upperDesc.startsWith(upperPattern);
    case 'contains':
      return upperDesc.includes(upperPattern);
    case 'regex':
      try {
        const regex = new RegExp(mapping.pattern, 'i');
        return regex.test(description);
      } catch {
        return false;
      }
    default:
      return false;
  }
}

/**
 * Find the best matching category for a transaction description
 */
export function findCategory(
  description: string
): { categoryId: string; subcategoryId: string } | null {
  const mappings = getAllMappings();

  for (const mapping of mappings) {
    if (matchesPattern(description, mapping)) {
      return {
        categoryId: mapping.categoryId,
        subcategoryId: mapping.subcategoryId,
      };
    }
  }

  return null;
}

/**
 * Categorize a single transaction
 */
export function categorizeTransaction(transaction: Transaction): Transaction {
  const match = findCategory(transaction.description);

  if (match) {
    return {
      ...transaction,
      categoryId: match.categoryId,
      subcategoryId: match.subcategoryId,
      badges: transaction.badges.filter((b) => b.type !== 'uncategorized'),
    };
  }

  return transaction;
}

/**
 * Categorize multiple transactions
 */
export function categorizeTransactions(transactions: Transaction[]): Transaction[] {
  return transactions.map(categorizeTransaction);
}

/**
 * Get category by ID (includes custom subcategories)
 */
export function getCategoryById(categoryId: string): Category | undefined {
  return getCategoryWithCustomSubcategories(categoryId);
}

/**
 * Get category name by ID
 */
export function getCategoryName(categoryId: string | null): string {
  if (!categoryId) return 'Uncategorized';
  const category = getCategoryById(categoryId);
  return category?.name || 'Unknown';
}

/**
 * Get subcategory name by IDs
 */
export function getSubcategoryName(categoryId: string | null, subcategoryId: string | null): string {
  if (!categoryId || !subcategoryId) return '';
  const category = getCategoryById(categoryId);
  const subcategory = category?.subcategories.find((s) => s.id === subcategoryId);
  return subcategory?.name || '';
}

/**
 * Get category color by ID
 */
export function getCategoryColor(categoryId: string | null): string {
  if (!categoryId) return '#6b7280'; // gray-500
  const category = getCategoryById(categoryId);
  return category?.color || '#6b7280';
}

/**
 * Get category icon by ID
 */
export function getCategoryIcon(categoryId: string | null): string {
  if (!categoryId) return '📦';
  const category = getCategoryById(categoryId);
  return category?.icon || '📦';
}

/**
 * Get flattened category options for dropdowns (includes custom subcategories)
 */
export function getCategoryOptions(): CategoryOption[] {
  const options: CategoryOption[] = [];
  const allCategories = getAllCategoriesWithCustomSubcategories();

  for (const category of allCategories) {
    for (const subcategory of category.subcategories) {
      options.push({
        categoryId: category.id,
        categoryName: category.name,
        subcategoryId: subcategory.id,
        subcategoryName: subcategory.name,
        fullPath: `${category.name} > ${subcategory.name}`,
        color: category.color,
        icon: category.icon,
      });
    }
  }

  return options;
}

/**
 * Get statistics about categorization
 */
export function getCategorizedStats(transactions: Transaction[]): {
  categorized: number;
  uncategorized: number;
  percentage: number;
} {
  const categorized = transactions.filter((t) => t.categoryId !== null).length;
  const total = transactions.length;

  return {
    categorized,
    uncategorized: total - categorized,
    percentage: total > 0 ? Math.round((categorized / total) * 100) : 0,
  };
}

/**
 * Get matching mappings for a description (for debugging/display)
 */
export function getMatchingMappings(description: string): CategoryMapping[] {
  const mappings = getAllMappings();
  return mappings.filter((mapping) => matchesPattern(description, mapping));
}

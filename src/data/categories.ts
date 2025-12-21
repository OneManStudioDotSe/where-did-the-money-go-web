import type { Category } from '../types';

/**
 * Default category definitions
 */
export const defaultCategories: Category[] = [
  {
    id: 'housing',
    name: 'Housing',
    icon: '🏠',
    color: '#8b5cf6',
    subcategories: [
      { id: 'rent', name: 'Rent/Mortgage', parentCategoryId: 'housing' },
      { id: 'utilities', name: 'Utilities', parentCategoryId: 'housing' },
      { id: 'insurance_home', name: 'Home Insurance', parentCategoryId: 'housing' },
      { id: 'maintenance', name: 'Maintenance', parentCategoryId: 'housing' },
      { id: 'security', name: 'Security', parentCategoryId: 'housing' },
    ],
  },
  {
    id: 'transportation',
    name: 'Transportation',
    icon: '🚗',
    color: '#3b82f6',
    subcategories: [
      { id: 'fuel', name: 'Fuel', parentCategoryId: 'transportation' },
      { id: 'public_transit', name: 'Public Transit', parentCategoryId: 'transportation' },
      { id: 'parking', name: 'Parking', parentCategoryId: 'transportation' },
      { id: 'taxi', name: 'Taxi/Rideshare', parentCategoryId: 'transportation' },
      { id: 'car_maintenance', name: 'Car Maintenance', parentCategoryId: 'transportation' },
      { id: 'vehicle_tax', name: 'Vehicle Tax', parentCategoryId: 'transportation' },
      { id: 'car_insurance', name: 'Car Insurance', parentCategoryId: 'transportation' },
    ],
  },
  {
    id: 'groceries',
    name: 'Groceries',
    icon: '🛒',
    color: '#22c55e',
    subcategories: [
      { id: 'supermarket', name: 'Supermarket', parentCategoryId: 'groceries' },
      { id: 'convenience', name: 'Convenience Store', parentCategoryId: 'groceries' },
      { id: 'specialty', name: 'Specialty/Ethnic', parentCategoryId: 'groceries' },
      { id: 'alcohol', name: 'Alcohol', parentCategoryId: 'groceries' },
    ],
  },
  {
    id: 'food_dining',
    name: 'Food & Dining',
    icon: '🍽️',
    color: '#f97316',
    subcategories: [
      { id: 'restaurant', name: 'Restaurants', parentCategoryId: 'food_dining' },
      { id: 'fast_food', name: 'Fast Food', parentCategoryId: 'food_dining' },
      { id: 'coffee', name: 'Coffee Shops', parentCategoryId: 'food_dining' },
      { id: 'delivery', name: 'Food Delivery', parentCategoryId: 'food_dining' },
      { id: 'bakery', name: 'Bakery', parentCategoryId: 'food_dining' },
    ],
  },
  {
    id: 'shopping',
    name: 'Shopping',
    icon: '🛍️',
    color: '#ec4899',
    subcategories: [
      { id: 'clothing', name: 'Clothing', parentCategoryId: 'shopping' },
      { id: 'electronics', name: 'Electronics', parentCategoryId: 'shopping' },
      { id: 'home_goods', name: 'Home Goods', parentCategoryId: 'shopping' },
      { id: 'online', name: 'Online Shopping', parentCategoryId: 'shopping' },
      { id: 'hardware', name: 'Hardware/DIY', parentCategoryId: 'shopping' },
    ],
  },
  {
    id: 'entertainment',
    name: 'Entertainment',
    icon: '🎬',
    color: '#a855f7',
    subcategories: [
      { id: 'streaming', name: 'Streaming Services', parentCategoryId: 'entertainment' },
      { id: 'gaming', name: 'Gaming', parentCategoryId: 'entertainment' },
      { id: 'events', name: 'Events/Movies', parentCategoryId: 'entertainment' },
      { id: 'activities', name: 'Activities', parentCategoryId: 'entertainment' },
      { id: 'bars', name: 'Bars/Nightlife', parentCategoryId: 'entertainment' },
    ],
  },
  {
    id: 'health',
    name: 'Health & Wellness',
    icon: '💊',
    color: '#14b8a6',
    subcategories: [
      { id: 'pharmacy', name: 'Pharmacy', parentCategoryId: 'health' },
      { id: 'medical', name: 'Medical/Doctor', parentCategoryId: 'health' },
      { id: 'fitness', name: 'Fitness/Gym', parentCategoryId: 'health' },
      { id: 'personal_care', name: 'Personal Care', parentCategoryId: 'health' },
    ],
  },
  {
    id: 'children',
    name: 'Children',
    icon: '👶',
    color: '#f472b6',
    subcategories: [
      { id: 'daycare', name: 'Daycare', parentCategoryId: 'children' },
      { id: 'toys', name: 'Toys', parentCategoryId: 'children' },
      { id: 'kids_clothing', name: 'Kids Clothing', parentCategoryId: 'children' },
      { id: 'kids_activities', name: 'Kids Activities', parentCategoryId: 'children' },
    ],
  },
  {
    id: 'subscriptions',
    name: 'Subscriptions',
    icon: '📱',
    color: '#6366f1',
    subcategories: [
      { id: 'software', name: 'Software/Apps', parentCategoryId: 'subscriptions' },
      { id: 'membership', name: 'Memberships', parentCategoryId: 'subscriptions' },
      { id: 'insurance', name: 'Insurance', parentCategoryId: 'subscriptions' },
    ],
  },
  {
    id: 'financial',
    name: 'Financial',
    icon: '💰',
    color: '#eab308',
    subcategories: [
      { id: 'bank_fees', name: 'Bank Fees', parentCategoryId: 'financial' },
      { id: 'loans', name: 'Loan Payments', parentCategoryId: 'financial' },
      { id: 'transfers', name: 'Transfers', parentCategoryId: 'financial' },
      { id: 'investments', name: 'Investments', parentCategoryId: 'financial' },
    ],
  },
  {
    id: 'public_services',
    name: 'Public Services',
    icon: '🏛️',
    color: '#64748b',
    subcategories: [
      { id: 'municipal_fees', name: 'Municipal Fees', parentCategoryId: 'public_services' },
      { id: 'parking_fines', name: 'Parking Fines', parentCategoryId: 'public_services' },
      { id: 'permits', name: 'Permits & Licenses', parentCategoryId: 'public_services' },
      { id: 'public_fees', name: 'Public Fees', parentCategoryId: 'public_services' },
    ],
  },
  {
    id: 'donations',
    name: 'Donations',
    icon: '🎁',
    color: '#f43f5e',
    subcategories: [
      { id: 'charity', name: 'Charity', parentCategoryId: 'donations' },
      { id: 'religious', name: 'Religious', parentCategoryId: 'donations' },
    ],
  },
  {
    id: 'income',
    name: 'Income',
    icon: '💵',
    color: '#10b981',
    subcategories: [
      { id: 'salary', name: 'Salary', parentCategoryId: 'income' },
      { id: 'refund', name: 'Refunds', parentCategoryId: 'income' },
      { id: 'benefits', name: 'Benefits', parentCategoryId: 'income' },
      { id: 'other_income', name: 'Other Income', parentCategoryId: 'income' },
    ],
  },
  {
    id: 'other',
    name: 'Other',
    icon: '📦',
    color: '#6b7280',
    subcategories: [
      { id: 'uncategorized', name: 'Uncategorized', parentCategoryId: 'other' },
      { id: 'personal', name: 'Personal Transfers', parentCategoryId: 'other' },
    ],
  },
];

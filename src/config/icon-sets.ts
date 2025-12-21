export type IconSetId = 'emoji' | 'icons8-3d' | 'lucide' | 'openmoji';

export interface IconSetConfig {
  id: IconSetId;
  name: string;
  description: string;
  previewIcons: string[];
}

export const iconSetConfigs: Record<IconSetId, IconSetConfig> = {
  emoji: {
    id: 'emoji',
    name: 'Emoji',
    description: 'Classic emoji icons',
    previewIcons: ['🛒', '🍽️', '🚗'],
  },
  'icons8-3d': {
    id: 'icons8-3d',
    name: '3D Fluency',
    description: 'Modern 3D style icons',
    previewIcons: ['shopping-cart', 'cutlery', 'car'],
  },
  lucide: {
    id: 'lucide',
    name: 'Lucide',
    description: 'Modern line icons',
    previewIcons: ['shopping-cart', 'utensils', 'car'],
  },
  openmoji: {
    id: 'openmoji',
    name: 'OpenMoji',
    description: 'Open source emoji style',
    previewIcons: ['1F6D2', '1F37D-FE0F', '1F697'],
  },
};

// Category to icon mappings for each icon set
export const categoryIconMappings: Record<IconSetId, Record<string, string>> = {
  emoji: {
    // Uses default emoji from category definition
    housing: '🏠',
    transportation: '🚗',
    groceries: '🛒',
    food_dining: '🍽️',
    shopping: '🛍️',
    entertainment: '🎬',
    health: '💊',
    children: '👶',
    subscriptions: '📱',
    financial: '💰',
    public_services: '🏛️',
    donations: '🎁',
    income: '💵',
    other: '📦',
  },
  'icons8-3d': {
    housing: 'home',
    transportation: 'car',
    groceries: 'shopping-cart',
    food_dining: 'cutlery',
    shopping: 'shopping-bag',
    entertainment: 'clapperboard',
    health: 'pill',
    children: 'baby',
    subscriptions: 'smartphone',
    financial: 'money-bag',
    public_services: 'bank-building',
    donations: 'gift',
    income: 'wallet',
    other: 'box',
  },
  lucide: {
    housing: 'home',
    transportation: 'car',
    groceries: 'shopping-cart',
    food_dining: 'utensils',
    shopping: 'shopping-bag',
    entertainment: 'film',
    health: 'pill',
    children: 'baby',
    subscriptions: 'smartphone',
    financial: 'coins',
    public_services: 'landmark',
    donations: 'gift',
    income: 'wallet',
    other: 'package',
  },
  openmoji: {
    housing: '1F3E0',
    transportation: '1F697',
    groceries: '1F6D2',
    food_dining: '1F37D-FE0F',
    shopping: '1F6CD-FE0F',
    entertainment: '1F3AC',
    health: '1F48A',
    children: '1F476',
    subscriptions: '1F4F1',
    financial: '1F4B0',
    public_services: '1F3DB-FE0F',
    donations: '1F381',
    income: '1F4B5',
    other: '1F4E6',
  },
};

// CDN URL builders
export function getIconUrl(iconSet: IconSetId, categoryId: string): string | null {
  const iconId = categoryIconMappings[iconSet]?.[categoryId];
  if (!iconId) return null;

  switch (iconSet) {
    case 'emoji':
      return null; // Emoji doesn't use URLs
    case 'icons8-3d':
      return `https://img.icons8.com/3d-fluency/48/${iconId}.png`;
    case 'lucide':
      return `https://cdn.jsdelivr.net/npm/lucide-static@0.469.0/icons/${iconId}.svg`;
    case 'openmoji':
      return `https://cdn.jsdelivr.net/npm/openmoji@15.0.0/color/svg/${iconId}.svg`;
    default:
      return null;
  }
}

// Get emoji for a category (used when iconSet is 'emoji' or as fallback)
export function getCategoryEmoji(categoryId: string): string {
  return categoryIconMappings.emoji[categoryId] || '📦';
}

// Preload icons for better UX
export function preloadIconSet(iconSet: IconSetId): void {
  if (iconSet === 'emoji') return;

  // Guard against invalid icon sets (e.g., from old localStorage values)
  const mapping = categoryIconMappings[iconSet];
  if (!mapping) return;

  Object.keys(mapping).forEach((categoryId) => {
    const url = getIconUrl(iconSet, categoryId);
    if (url) {
      const img = new Image();
      img.src = url;
    }
  });
}

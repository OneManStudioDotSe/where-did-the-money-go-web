export type IconSetId = 'emoji' | 'icons8-3d' | 'phosphor' | 'openmoji';

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
  phosphor: {
    id: 'phosphor',
    name: 'Phosphor',
    description: 'Clean line icons',
    previewIcons: ['shopping-cart', 'fork-knife', 'car'],
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
    donations: 'gift',
    income: 'wallet',
    other: 'box',
  },
  phosphor: {
    housing: 'house',
    transportation: 'car',
    groceries: 'shopping-cart',
    food_dining: 'fork-knife',
    shopping: 'bag',
    entertainment: 'film-strip',
    health: 'pill',
    children: 'baby',
    subscriptions: 'device-mobile',
    financial: 'coins',
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
    case 'phosphor':
      return `https://cdn.jsdelivr.net/npm/@phosphor-icons/web@2.1.1/src/regular/${iconId}.svg`;
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

  Object.keys(categoryIconMappings[iconSet]).forEach((categoryId) => {
    const url = getIconUrl(iconSet, categoryId);
    if (url) {
      const img = new Image();
      img.src = url;
    }
  });
}

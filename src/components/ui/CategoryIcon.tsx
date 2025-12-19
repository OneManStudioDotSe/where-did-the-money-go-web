import { useState, useEffect } from 'react';
import type { IconSetId } from '../../config/icon-sets';
import { getIconUrl, getCategoryEmoji } from '../../config/icon-sets';

interface CategoryIconProps {
  categoryId: string;
  iconSet: IconSetId;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showBackground?: boolean;
  backgroundColor?: string;
}

const sizeClasses = {
  xs: 'w-4 h-4 text-xs',
  sm: 'w-5 h-5 text-sm',
  md: 'w-6 h-6 text-base',
  lg: 'w-8 h-8 text-lg',
  xl: 'w-10 h-10 text-xl',
};

const imgSizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
  xl: 'w-8 h-8',
};

export function CategoryIcon({
  categoryId,
  iconSet,
  size = 'md',
  className = '',
  showBackground = false,
  backgroundColor,
}: CategoryIconProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const iconUrl = iconSet !== 'emoji' ? getIconUrl(iconSet, categoryId) : null;
  const emoji = getCategoryEmoji(categoryId);

  // Reset loading state when iconSet or categoryId changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [iconSet, categoryId]);

  // If emoji or loading failed, show emoji
  const shouldShowEmoji = iconSet === 'emoji' || !iconUrl || imageError;

  const containerClasses = `
    ${sizeClasses[size]}
    flex items-center justify-center flex-shrink-0
    ${showBackground ? 'rounded-lg' : ''}
    ${className}
  `.trim();

  const containerStyle = showBackground && backgroundColor
    ? { backgroundColor: `${backgroundColor}20` }
    : undefined;

  if (shouldShowEmoji) {
    return (
      <span className={containerClasses} style={containerStyle}>
        {emoji}
      </span>
    );
  }

  return (
    <span className={containerClasses} style={containerStyle}>
      {!imageLoaded && !imageError && (
        <span className="animate-pulse bg-gray-200 dark:bg-slate-600 rounded w-full h-full" />
      )}
      <img
        src={iconUrl}
        alt=""
        className={`${imgSizeClasses[size]} ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity`}
        onLoad={() => setImageLoaded(true)}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </span>
  );
}

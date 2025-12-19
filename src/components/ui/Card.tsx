import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  variant?: 'default' | 'elevated' | 'interactive';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
}

const paddingClasses = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
};

const variantClasses = {
  default: 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm',
  elevated:
    'bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 shadow-md hover:shadow-lg transition-shadow',
  interactive:
    'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-primary-300 dark:hover:border-primary-600 transition-all cursor-pointer',
};

export function Card({
  children,
  variant = 'default',
  padding = 'md',
  className = '',
  onClick,
}: CardProps) {
  const classes = `
    rounded-xl
    ${variantClasses[variant]}
    ${paddingClasses[padding]}
    ${className}
  `.trim();

  if (onClick) {
    return (
      <button className={`${classes} w-full text-left`} onClick={onClick}>
        {children}
      </button>
    );
  }

  return <div className={classes}>{children}</div>;
}

// Header component for cards
interface CardHeaderProps {
  children: ReactNode;
  className?: string;
}

export function CardHeader({ children, className = '' }: CardHeaderProps) {
  return (
    <div className={`border-b border-gray-200 dark:border-slate-700 px-4 py-3 ${className}`}>
      {children}
    </div>
  );
}

// Content component for cards
interface CardContentProps {
  children: ReactNode;
  className?: string;
}

export function CardContent({ children, className = '' }: CardContentProps) {
  return <div className={`px-4 py-4 ${className}`}>{children}</div>;
}

// Footer component for cards
interface CardFooterProps {
  children: ReactNode;
  className?: string;
}

export function CardFooter({ children, className = '' }: CardFooterProps) {
  return (
    <div
      className={`border-t border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 px-4 py-3 rounded-b-xl ${className}`}
    >
      {children}
    </div>
  );
}

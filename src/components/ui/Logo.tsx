interface LogoProps {
  /** Size variant: 'sm' (32px), 'md' (48px), 'lg' (80px) */
  size?: 'sm' | 'md' | 'lg';
  /** Whether to show text beside the logo */
  showText?: boolean;
  /** Additional className for the container */
  className?: string;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-12 h-12',
  lg: 'w-20 h-20',
};

const imagePadding = {
  sm: 'p-1',
  md: 'p-1.5',
  lg: 'p-3',
};

const roundedClasses = {
  sm: 'rounded-lg',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
};

const textSizes = {
  sm: 'text-sm',
  md: 'text-xl',
  lg: 'text-2xl',
};

const subtextSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export function Logo({ size = 'md', showText = false, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {/* Logo Icon with greenish background */}
      <div
        className={`
          ${sizeClasses[size]}
          ${imagePadding[size]}
          ${roundedClasses[size]}
          bg-primary-500/20
          dark:bg-primary-500/30
          flex items-center justify-center
          shadow-lg shadow-primary-500/25
        `}
      >
        <img
          src="/logo_3.png"
          alt="Where Did The Money Go? Logo"
          className="w-full h-full object-contain"
        />
      </div>

      {/* Optional Text */}
      {showText && (
        <div>
          <h1 className={`${textSizes[size]} font-bold text-gray-900 dark:text-white leading-tight`}>
            Where Did The Money Go?
          </h1>
          <p className={`${subtextSizes[size]} text-gray-500 dark:text-gray-400`}>
            Privacy-first expense tracking
          </p>
        </div>
      )}
    </div>
  );
}

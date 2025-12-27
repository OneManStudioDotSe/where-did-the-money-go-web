interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className = '',
  variant = 'text',
  width,
  height,
}: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-gray-200 dark:bg-slate-700';

  const variantClasses = {
    text: 'rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style: React.CSSProperties = {
    width: width,
    height: height ?? (variant === 'text' ? '1em' : undefined),
  };

  return (
    <div
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
}

export function TransactionSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-center gap-4">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="60%" height={16} />
          <Skeleton width="40%" height={12} />
        </div>
        <div className="text-right space-y-2">
          <Skeleton width={80} height={16} />
          <Skeleton width={60} height={12} />
        </div>
      </div>
    </div>
  );
}

export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <TransactionSkeleton key={i} />
      ))}
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-gray-50 dark:bg-slate-700/50 rounded-lg p-4">
      <Skeleton width="50%" height={14} className="mb-2" />
      <Skeleton width="70%" height={24} />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700 p-6">
      <div className="flex justify-between items-center mb-6">
        <Skeleton width={150} height={20} />
        <Skeleton width={100} height={32} variant="rectangular" />
      </div>
      <div className="flex items-end justify-around gap-2 h-48">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <Skeleton
              variant="rectangular"
              width="100%"
              height={Math.random() * 100 + 50}
            />
            <Skeleton width="80%" height={12} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function InsightCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
      <div className="flex items-start gap-3">
        <Skeleton variant="circular" width={40} height={40} />
        <div className="flex-1 space-y-2">
          <Skeleton width="70%" height={18} />
          <Skeleton width="100%" height={14} />
          <Skeleton width="80%" height={14} />
          <div className="flex gap-2 mt-2">
            <Skeleton width={100} height={20} variant="rectangular" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function InsightsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Summary skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700 p-4">
        <Skeleton width="100%" height={16} className="mb-2" />
        <Skeleton width="85%" height={16} className="mb-2" />
        <Skeleton width="60%" height={16} />
      </div>
      {/* Insight cards skeleton */}
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <InsightCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Summary Header Skeleton */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2">
            <Skeleton width={200} height={24} />
            <Skeleton width={150} height={14} />
          </div>
          <Skeleton width={120} height={36} variant="rectangular" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Tab Navigation Skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} width={80} height={36} variant="rectangular" />
        ))}
      </div>

      {/* Content Skeleton */}
      <ChartSkeleton />
    </div>
  );
}

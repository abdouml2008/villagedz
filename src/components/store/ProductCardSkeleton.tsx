import { cn } from '@/lib/utils';

interface ProductCardSkeletonProps {
  className?: string;
}

/**
 * Skeleton loader for ProductCard component
 * Provides smooth loading experience while products are being fetched
 */
export function ProductCardSkeleton({ className }: ProductCardSkeletonProps) {
  return (
    <div
      className={cn(
        'bg-card rounded-xl overflow-hidden shadow-village-sm border border-border',
        className
      )}
    >
      {/* Image skeleton */}
      <div className="aspect-square bg-muted animate-pulse" />
      
      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Title skeleton */}
        <div className="h-5 bg-muted rounded animate-pulse w-3/4" />
        
        {/* Description skeleton */}
        <div className="space-y-2">
          <div className="h-3 bg-muted rounded animate-pulse w-full" />
          <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
        </div>
        
        {/* Price and button skeleton */}
        <div className="flex items-center justify-between pt-2">
          <div className="h-6 bg-muted rounded animate-pulse w-20" />
          <div className="h-9 bg-muted rounded animate-pulse w-24" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid of skeleton loaders
 */
export function ProductGridSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
      {[...Array(count)].map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

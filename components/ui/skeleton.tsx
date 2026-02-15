import { cn } from '@/lib/utils';

type SkeletonVariant = 'list' | 'profile' | 'event-compact-item' | 'event-details' | 'event-card';

const skeletonVariants: Record<SkeletonVariant, string> = {
  list: '',
  profile: '',
  'event-compact-item': '',
  'event-details': '',
  'event-card': '',
};

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: SkeletonVariant;
}

function Skeleton({ className, variant, ...props }: SkeletonProps) {
  const variantClassName = variant ? skeletonVariants[variant] : '';
  return (
    <div
      className={cn('animate-pulse rounded-md bg-muted', variantClassName, className)}
      {...props}
    />
  );
}

export { Skeleton };

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function BlogPostCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex flex-col', className)}>
      {/* Image skeleton */}
      <Skeleton className='mb-4 aspect-[3/2] w-full rounded-xl md:mb-5' />

      {/* Badge skeleton */}
      <Skeleton className='mb-4 h-5 w-20 rounded-full' />

      {/* Title skeleton */}
      <Skeleton className='mb-2 h-7 w-full rounded' />
      <Skeleton className='mb-4 h-7 w-3/4 rounded' />

      {/* Excerpt skeleton */}
      <Skeleton className='mb-2 h-4 w-full rounded' />
      <Skeleton className='mb-4 h-4 w-5/6 rounded' />

      {/* Author skeleton */}
      <div className='flex items-center gap-2'>
        <Skeleton className='size-10 rounded-full' />
        <div className='flex flex-col gap-1'>
          <Skeleton className='h-3 w-24 rounded' />
          <Skeleton className='h-3 w-16 rounded' />
        </div>
      </div>
    </div>
  );
}

export function BlogGridSkeleton({ count = 9 }: { count?: number }) {
  return (
    <div className='grid gap-x-4 gap-y-8 md:grid-cols-2 lg:gap-x-6 lg:gap-y-12 2xl:grid-cols-3'>
      {Array.from({ length: count }).map((_, i) => (
        <BlogPostCardSkeleton key={i} />
      ))}
    </div>
  );
}

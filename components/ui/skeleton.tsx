import { cn } from '@/lib/utils';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'list' | 'event-card' | 'event-compact-item' | 'event-details' | 'profile';
}

export function Skeleton({ className, variant = 'default', ...props }: SkeletonProps) {
  if (variant === 'list') return <ListSkeleton className={className} {...props} />;
  else if (variant === 'event-card') return <EventCardSkeleton className={className} {...props} />;
  else if (variant === 'event-compact-item')
    return <EventCompactItemSkeleton className={className} {...props} />;
  else if (variant === 'event-details')
    return <EventDetailsSkeleton className={className} {...props} />;
  else if (variant === 'profile') return <ProfileSkeleton className={className} {...props} />;

  return <div className={cn('animate-pulse rounded-md bg-gray-200', className)} {...props} />;
}

// Event Card Skeleton
function EventCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('overflow-hidden rounded-2xl bg-white', className)}>
      {/* Header skeleton */}
      <div className='flex items-center justify-between px-4 py-3'>
        <div className='flex items-center gap-3'>
          <Skeleton className='h-8 w-8 rounded-full' />
          <div className='space-y-1'>
            <Skeleton className='h-3 w-28' />
            <Skeleton className='h-2.5 w-36' />
          </div>
        </div>
        <Skeleton className='h-8 w-8 rounded-full' />
      </div>
      {/* Image skeleton */}
      <Skeleton className='mx-auto aspect-square w-[calc(94%)] rounded-2xl' />
      {/* Body skeleton */}
      <div className='px-4 py-3'>
        <Skeleton className='mb-2 h-5 w-3/4' />
        <div className='mb-3 flex items-center gap-4'>
          <Skeleton className='h-3 w-24' />
          <Skeleton className='h-3 w-20' />
        </div>
        <Skeleton className='mb-3 h-3 w-40' />
        <div className='flex items-center gap-4'>
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className='h-8 w-8 rounded-full' />
          ))}
        </div>
      </div>
    </div>
  );
}

// Event Compact Item Skeleton
function EventCompactItemSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center gap-4 rounded-lg bg-white p-4', className)}>
      <Skeleton className='h-16 w-16 flex-shrink-0 rounded-lg' />
      <div className='flex-1 space-y-2'>
        <Skeleton className='h-4 w-3/4' />
        <Skeleton className='h-3 w-1/2' />
        <Skeleton className='h-3 w-1/3' />
      </div>
      <Skeleton className='h-8 w-8 rounded-full' />
    </div>
  );
}

// Event Details Skeleton
function EventDetailsSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto max-w-4xl space-y-6 p-6', className)}>
      {/* Header */}
      <div className='space-y-4'>
        <Skeleton className='h-8 w-3/4' />
        <div className='flex items-center gap-4'>
          <Skeleton className='h-6 w-32' />
          <Skeleton className='h-6 w-24' />
          <Skeleton className='h-6 w-28' />
        </div>
      </div>

      {/* Cover Image */}
      <Skeleton className='aspect-video w-full rounded-2xl' />

      {/* Event Info Grid */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        {/* Main Content */}
        <div className='space-y-6 md:col-span-2'>
          {/* Description */}
          <div className='space-y-3'>
            <Skeleton className='h-5 w-24' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-5/6' />
            <Skeleton className='h-4 w-4/5' />
          </div>

          {/* Comments Section */}
          <div className='space-y-4'>
            <Skeleton className='h-5 w-32' />
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className='flex gap-3'>
                <Skeleton className='h-8 w-8 flex-shrink-0 rounded-full' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-3 w-24' />
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-3/4' />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar */}
        <div className='space-y-6'>
          {/* Host Info */}
          <div className='space-y-3'>
            <Skeleton className='h-5 w-16' />
            <div className='flex items-center gap-3'>
              <Skeleton className='h-12 w-12 rounded-full' />
              <div className='space-y-1'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-3 w-20' />
              </div>
            </div>
          </div>

          {/* RSVP Button */}
          <Skeleton className='h-12 w-full rounded-lg' />

          {/* Event Details */}
          <div className='space-y-4'>
            <Skeleton className='h-5 w-20' />
            <div className='space-y-3'>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-4 w-32' />
              </div>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-4 w-28' />
              </div>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-4 w-36' />
              </div>
            </div>
          </div>

          {/* Attendees */}
          <div className='space-y-3'>
            <Skeleton className='h-5 w-20' />
            <div className='flex -space-x-2'>
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className='h-8 w-8 rounded-full border-2 border-white' />
              ))}
            </div>
            <Skeleton className='h-3 w-32' />
          </div>
        </div>
      </div>
    </div>
  );
}

// Profile Skeleton
function ProfileSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn('mx-auto max-w-4xl space-y-6 p-6', className)}>
      {/* Header */}
      <div className='flex items-start gap-6'>
        <Skeleton className='h-24 w-24 rounded-full' />
        <div className='flex-1 space-y-3'>
          <Skeleton className='h-6 w-48' />
          <Skeleton className='h-4 w-32' />
          <Skeleton className='h-4 w-64' />
          <div className='flex gap-2'>
            <Skeleton className='h-8 w-20' />
            <Skeleton className='h-8 w-24' />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className='grid grid-cols-3 gap-4'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='space-y-1 text-center'>
            <Skeleton className='mx-auto h-6 w-12' />
            <Skeleton className='mx-auto h-4 w-16' />
          </div>
        ))}
      </div>

      {/* Content Grid */}
      <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {Array.from({ length: 6 }).map((_, i) => (
          <EventCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

// List Skeleton (for generic lists)
function ListSkeleton({ items = 5, className }: { items?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <Skeleton key={i} className='h-16 w-full rounded-lg' />
      ))}
    </div>
  );
}

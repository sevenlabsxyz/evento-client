import { Skeleton } from '@/components/ui/skeleton';

const CARD_CLASS =
  'overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900';

function BlogPostCardSkeleton() {
  return (
    <div className={CARD_CLASS}>
      <Skeleton className='aspect-video w-full rounded-none' />
      <div className='space-y-2 p-5'>
        <Skeleton className='h-3 w-16' />
        <Skeleton className='h-5 w-full' />
        <Skeleton className='h-5 w-3/4' />
        <Skeleton className='h-4 w-5/6' />
        <div className='flex items-center gap-2.5 pt-4'>
          <Skeleton className='h-8 w-8 rounded-full' />
          <div className='space-y-1.5'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-3 w-32' />
          </div>
        </div>
      </div>
    </div>
  );
}

export function BlogPageSkeleton() {
  return (
    <div className='min-h-full w-full bg-white dark:bg-neutral-900' aria-busy='true'>
      <div className='mx-auto w-full max-w-7xl space-y-8 px-4 pb-40 pt-6 md:px-8 md:pb-16 md:pt-10'>
        <div className='space-y-3 border-b border-gray-200 pb-8 dark:border-neutral-800'>
          <Skeleton className='h-3 w-24' />
          <Skeleton className='h-9 w-80 max-w-full' />
          <Skeleton className='h-4 w-96 max-w-full' />
        </div>
        <div className='flex gap-2'>
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className='h-9 w-20 rounded-full' />
          ))}
        </div>
        <div className={`${CARD_CLASS} grid lg:grid-cols-12`}>
          <Skeleton className='aspect-video w-full rounded-none lg:col-span-7 lg:aspect-auto lg:min-h-[420px]' />
          <div className='space-y-4 p-6 md:p-8 lg:col-span-5 lg:self-center lg:p-10'>
            <Skeleton className='h-3 w-28' />
            <Skeleton className='h-9 w-full' />
            <Skeleton className='h-9 w-2/3' />
            <Skeleton className='h-4 w-full' />
            <Skeleton className='h-4 w-5/6' />
            <div className='flex items-center gap-3 pt-2'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='space-y-1.5'>
                <Skeleton className='h-3.5 w-28' />
                <Skeleton className='h-3.5 w-40' />
              </div>
            </div>
          </div>
        </div>
        <div className='grid gap-6 sm:grid-cols-2 lg:grid-cols-3'>
          {Array.from({ length: 3 }, (_, index) => (
            <BlogPostCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

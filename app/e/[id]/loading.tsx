export default function Loading() {
  return (
    <div className='min-h-screen bg-gray-50 dark:bg-neutral-950'>
      {/* Header skeleton */}
      <div className='sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-neutral-800 dark:bg-neutral-900'>
        <div className='flex items-center justify-between p-4'>
          <div className='h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-neutral-700' />
          <div className='flex items-center gap-2'>
            <div className='h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-neutral-700' />
            <div className='h-10 w-10 animate-pulse rounded-full bg-gray-200 dark:bg-neutral-700' />
          </div>
        </div>
      </div>

      <div className='mx-auto max-w-full bg-white dark:bg-neutral-900 md:max-w-sm'>
        {/* Cover image skeleton */}
        <div className='h-64 w-full animate-pulse bg-gray-200 dark:bg-neutral-700' />

        <div className='space-y-6 px-4 pb-20'>
          {/* Title skeleton */}
          <div className='space-y-2 pt-4'>
            <div className='h-8 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
            <div className='h-6 w-3/4 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
          </div>

          {/* Date and location skeleton */}
          <div className='space-y-3'>
            <div className='h-6 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
            <div className='h-6 w-2/3 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
            <div className='h-6 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
          </div>

          {/* Action buttons skeleton */}
          <div className='grid grid-cols-4 gap-2'>
            <div className='h-16 animate-pulse rounded-xl bg-gray-200 dark:bg-neutral-700' />
            <div className='h-16 animate-pulse rounded-xl bg-gray-200 dark:bg-neutral-700' />
            <div className='h-16 animate-pulse rounded-xl bg-gray-200 dark:bg-neutral-700' />
            <div className='h-16 animate-pulse rounded-xl bg-gray-200 dark:bg-neutral-700' />
          </div>

          {/* Location section skeleton */}
          <div className='space-y-3'>
            <div className='h-6 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
            <div className='h-32 animate-pulse rounded-xl bg-gray-200 dark:bg-neutral-700' />
          </div>

          {/* Host section skeleton */}
          <div className='space-y-3'>
            <div className='h-6 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
            <div className='flex items-center gap-3'>
              <div className='h-12 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-neutral-700' />
              <div className='flex-1 space-y-1'>
                <div className='h-5 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
                <div className='h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
              </div>
            </div>
          </div>

          {/* Content skeleton */}
          <div className='space-y-3'>
            <div className='h-6 w-1/3 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
            <div className='space-y-2'>
              <div className='h-4 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
              <div className='h-4 w-5/6 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
              <div className='h-4 w-4/5 animate-pulse rounded bg-gray-200 dark:bg-neutral-700' />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

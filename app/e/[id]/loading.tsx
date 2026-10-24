import { Skeleton } from '@/components/ui/skeleton';

const CARD_CLASS =
  'rounded-2xl border border-gray-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900';

export default function Loading() {
  return (
    <div className='min-h-full w-full bg-white dark:bg-neutral-900'>
      <div className='mx-auto w-full max-w-2xl px-4 pb-24 pt-4 md:px-8 md:pt-8 lg:max-w-6xl'>
        <div className='lg:grid lg:grid-cols-[minmax(0,400px)_minmax(0,1fr)] lg:gap-10'>
          {/* Left column: cover + summary */}
          <div className='space-y-4 lg:sticky lg:top-6 lg:self-start'>
            <Skeleton className='aspect-square w-full rounded-3xl' />
            <div className={`${CARD_CLASS} hidden space-y-4 lg:block`}>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-8 w-8 rounded-full' />
                <div className='flex-1 space-y-1.5'>
                  <Skeleton className='h-3 w-16' />
                  <Skeleton className='h-4 w-32' />
                </div>
              </div>
              <Skeleton className='h-4 w-24' />
              <div className='grid grid-cols-2 gap-2'>
                <Skeleton className='h-10 rounded-full' />
                <Skeleton className='h-10 rounded-full' />
              </div>
            </div>
          </div>

          {/* Right column: hero, nav, sections */}
          <div className='min-w-0 space-y-6 pt-6 lg:pt-0'>
            <div className='space-y-4'>
              <div className='flex gap-1.5'>
                <Skeleton className='h-5 w-16 rounded-full' />
                <Skeleton className='h-5 w-12 rounded-full' />
              </div>
              <Skeleton className='h-9 w-4/5 md:h-10' />
            </div>

            <div className='space-y-3'>
              {Array.from({ length: 2 }, (_, index) => (
                <div key={index} className='flex items-center gap-3'>
                  <Skeleton className='h-12 w-12 shrink-0 rounded-xl' />
                  <div className='flex-1 space-y-1.5'>
                    <Skeleton className='h-4 w-1/2' />
                    <Skeleton className='h-3 w-1/3' />
                  </div>
                </div>
              ))}
            </div>

            <div className={`${CARD_CLASS} space-y-3`}>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-12 w-full rounded-full' />
            </div>

            <Skeleton className='mx-auto h-11 w-72 rounded-full lg:mx-0' />

            {Array.from({ length: 2 }, (_, index) => (
              <div key={index} className='space-y-3'>
                <Skeleton className='h-5 w-28' />
                <div className={`${CARD_CLASS} space-y-2`}>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-4 w-5/6' />
                  <Skeleton className='h-4 w-2/3' />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

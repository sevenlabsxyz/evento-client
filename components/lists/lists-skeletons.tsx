import { DiscoverEventCardSkeleton } from '@/components/hub/discover-event-card';
import { Skeleton } from '@/components/ui/skeleton';
import { ListCardSkeleton } from './list-card';
import {
  LIST_EVENT_GRID_CLASS,
  LIST_GRID_CLASS,
  LIST_PAGE_BACKGROUND_CLASS,
  LIST_PAGE_CONTAINER_CLASS,
} from './list-page-layout';

function HeaderSkeleton({ withBackLink = false }: { withBackLink?: boolean }) {
  return (
    <div className='flex flex-col gap-4 border-b border-gray-200 pb-8 dark:border-neutral-800 md:flex-row md:items-end md:justify-between'>
      <div className='space-y-3'>
        {withBackLink && <Skeleton className='hidden h-4 w-20 md:block' />}
        <Skeleton className='h-3 w-16' />
        <Skeleton className='h-9 w-72 max-w-full' />
        <Skeleton className='h-4 w-96 max-w-full' />
      </div>
      <Skeleton className='h-10 w-full rounded-full md:w-32' />
    </div>
  );
}

export function ListsIndexSkeleton() {
  return (
    <div className={LIST_PAGE_BACKGROUND_CLASS}>
      <div className={LIST_PAGE_CONTAINER_CLASS}>
        <HeaderSkeleton />
        <div className={`mt-8 ${LIST_GRID_CLASS}`}>
          {Array.from({ length: 4 }, (_, index) => (
            <ListCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function ListDetailSkeleton() {
  return (
    <div className={LIST_PAGE_BACKGROUND_CLASS}>
      <div className={LIST_PAGE_CONTAINER_CLASS}>
        <HeaderSkeleton withBackLink />
        <div className='mt-6 flex items-center justify-between gap-3'>
          <Skeleton className='h-11 w-64 rounded-full' />
          <Skeleton className='h-10 w-36 rounded-full' />
        </div>
        <div className={`mt-6 ${LIST_EVENT_GRID_CLASS}`}>
          {Array.from({ length: 4 }, (_, index) => (
            <DiscoverEventCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

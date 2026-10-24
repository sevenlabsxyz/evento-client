'use client';

import { ListEvent } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { getEventCoverDisplayUrl, isGif } from '@/lib/utils/image';
import { Bookmark } from 'lucide-react';
import Image from 'next/image';
import { getListCovers } from './list-utils';

interface ListCoverMosaicProps {
  events: ListEvent[] | undefined;
  isLoading?: boolean;
  className?: string;
}

/** Tile placement per cover count; three covers get one tall tile on the left. */
const TILE_LAYOUTS: Record<number, string[]> = {
  1: ['col-span-2 row-span-2'],
  2: ['row-span-2', 'row-span-2'],
  3: ['row-span-2', '', ''],
  4: ['', '', '', ''],
};

export function ListCoverMosaic({ events, isLoading = false, className }: ListCoverMosaicProps) {
  const covers = getListCovers(events);
  const frameClass = cn(
    'relative aspect-[4/3] w-full overflow-hidden bg-gray-100 dark:bg-neutral-800',
    className
  );

  if (isLoading) {
    return <div aria-hidden='true' className={cn(frameClass, 'animate-pulse')} />;
  }

  if (covers.length === 0) {
    return (
      <div
        aria-hidden='true'
        className={cn(
          frameClass,
          'flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-800 dark:to-neutral-900'
        )}
      >
        <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm dark:bg-neutral-800 dark:text-neutral-500 dark:shadow-none'>
          <Bookmark className='h-6 w-6' />
        </div>
      </div>
    );
  }

  const layout = TILE_LAYOUTS[covers.length];

  return (
    <div aria-hidden='true' className={cn(frameClass, 'grid grid-cols-2 grid-rows-2 gap-0.5')}>
      {covers.map((entry, index) => (
        <div key={entry.list_event_id} className={cn('relative overflow-hidden', layout[index])}>
          <Image
            src={
              entry.event.cover && isGif(entry.event.cover)
                ? entry.event.cover
                : getEventCoverDisplayUrl(
                    entry.event.cover,
                    covers.length <= 2 ? 'feed' : 'thumbnail'
                  )
            }
            alt=''
            fill
            sizes={
              covers.length === 1
                ? '(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw'
                : '(min-width: 1024px) 200px, (min-width: 640px) 25vw, 50vw'
            }
            className='object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]'
          />
        </div>
      ))}
    </div>
  );
}

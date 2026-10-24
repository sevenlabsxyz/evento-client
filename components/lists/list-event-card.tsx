'use client';

import { DiscoverEventCard } from '@/components/hub/discover-event-card';
import { ListEvent } from '@/lib/types/api';
import { BookmarkMinus } from 'lucide-react';

interface ListEventCardProps {
  entry: ListEvent;
  listName: string;
  onRemove: (entry: ListEvent) => void;
}

/** Hub discover card plus a remove-from-list control over the cover. */
export function ListEventCard({ entry, listName, onRemove }: ListEventCardProps) {
  return (
    <div className='relative h-full'>
      <DiscoverEventCard event={entry.event} />
      {/* Matches the card's 4:3 cover so the control sits in its bottom-right corner. */}
      <div className='pointer-events-none absolute inset-x-px top-px aspect-[4/3]'>
        <button
          type='button'
          onClick={() => onRemove(entry)}
          aria-label={`Remove ${entry.event.title} from ${listName}`}
          title='Remove from list'
          className='pointer-events-auto absolute bottom-3 right-3 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-gray-700 shadow-sm backdrop-blur-sm transition-colors hover:bg-white hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2 dark:bg-neutral-900/90 dark:text-neutral-200 dark:hover:bg-neutral-900 dark:hover:text-red-400 dark:focus-visible:ring-offset-neutral-900'
        >
          <BookmarkMinus className='h-4 w-4' aria-hidden='true' />
        </button>
      </div>
    </div>
  );
}

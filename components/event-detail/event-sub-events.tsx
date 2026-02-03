'use client';

import { EventWithUser } from '@/lib/types/api';
import { PlusIcon } from 'lucide-react';
import { EventCompactItem } from '../event-compact-item';
import { Button } from '../ui/button';

interface EventSubEventsProps {
  subEvents: EventWithUser[];
  subEventsLoading: boolean;
  subEventsError: Error | null;
}

export default function EventSubEvents({
  subEvents,
  subEventsLoading,
  subEventsError,
}: EventSubEventsProps) {
  if (subEventsError) return null;

  return (
    <div className='space-y-4 border-t border-gray-100 pt-6'>
      <div className='mb-4 flex items-center justify-between gap-2'>
        <h3 className='text-lg font-semibold text-gray-900'>Sub Events</h3>
        <Button variant='secondary' size='icon'>
          <PlusIcon className='h-4 w-4' />
        </Button>
      </div>
      <div className='space-y-4'>
        {subEventsLoading ? (
          <div className='space-y-3'>
            {Array.from({ length: 2 }).map((_, idx) => (
              <div key={idx} className='rounded-lg border p-4'>
                <div className='flex items-start gap-3'>
                  <div className='h-12 w-12 animate-pulse rounded-lg bg-gray-200' />
                  <div className='flex-1'>
                    <div className='h-4 w-3/4 animate-pulse rounded bg-gray-200' />
                    <div className='mt-2 h-3 w-1/2 animate-pulse rounded bg-gray-200' />
                    <div className='mt-2 h-3 w-1/3 animate-pulse rounded bg-gray-200' />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : subEvents.length > 0 ? (
          <div className='space-y-3'>
            {subEvents.map((subEvent) => (
              <EventCompactItem key={subEvent.id} event={subEvent} />
            ))}
          </div>
        ) : (
          <div className='rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center'>
            <p className='text-sm text-gray-500'>No sub events found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

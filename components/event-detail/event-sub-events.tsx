'use client';

import { EventWithUser } from '@/lib/types/api';
import { Loader2, PlusIcon } from 'lucide-react';
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
          <div className='flex items-center justify-center py-4'>
            <Loader2 className='h-5 w-5 animate-spin text-gray-500' />
            <span className='ml-2 text-sm text-gray-500'>Loading sub events...</span>
          </div>
        ) : subEvents.length > 0 ? (
          <div className='space-y-3'>
            {subEvents.map((subEvent) => (
              <EventCompactItem key={subEvent.id} event={subEvent} />
            ))}
          </div>
        ) : subEventsError ? (
          <div className='rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center'>
            <p className='text-sm text-gray-500'>Failed to load sub events.</p>
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

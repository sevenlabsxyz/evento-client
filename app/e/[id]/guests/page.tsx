'use client';

import { getEventById } from '@/lib/data/sample-events';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

export default function PublicGuestListPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;

  // Get existing event data
  const existingEvent = getEventById(eventId);

  if (!existingEvent) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Event Not Found</h1>
          <p className='mb-4 text-gray-600'>The event you're trying to view doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Only show if guest list is public
  if (!existingEvent.guestListSettings?.isPublic) {
    return (
      <div className='flex min-h-screen items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <h1 className='mb-2 text-2xl font-bold text-gray-900'>Guest List Private</h1>
          <p className='mb-4 text-gray-600'>The guest list for this event is private.</p>
          <button
            onClick={() => router.back()}
            className='rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600'
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Get only guests who are going (public view)
  const guests = existingEvent.guests || [];
  const goingGuests = guests.filter((guest) => guest.status === 'going');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter guests based on search query
  const filteredGuests = goingGuests.filter((guest) => {
    const matchesSearch =
      guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      guest.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className='mx-auto min-h-screen max-w-full bg-white md:max-w-sm'>
      {/* Header */}
      <div className='flex items-center justify-between border-b border-gray-100 p-4'>
        <div className='flex items-center gap-4'>
          <button onClick={() => router.back()} className='rounded-full p-2 hover:bg-gray-100'>
            <ArrowLeft className='h-5 w-5' />
          </button>
          <div>
            <h1 className='text-xl font-semibold'>Guest List</h1>
            <p className='text-sm text-gray-500'>{goingGuests.length} people going</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className='p-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-400' />
          <input
            type='text'
            placeholder='Search guests...'
            value={searchQuery}
            onChange={handleSearchChange}
            className='w-full rounded-xl border-none bg-gray-100 py-3 pl-10 pr-4 text-gray-900 placeholder-gray-500 outline-none'
          />
        </div>
      </div>

      {/* Tab Header - Shows only "Going" */}
      <div className='px-4'>
        <div className='flex space-x-1 pb-2'>
          <div className='rounded-lg bg-black px-4 py-2 font-medium text-white'>
            Going ({goingGuests.length})
          </div>
        </div>
      </div>

      {/* Content */}
      <div className='flex-1 p-4'>
        {filteredGuests.length > 0 ? (
          <div className='space-y-3'>
            {filteredGuests.map((guest) => (
              <div key={guest.id} className='flex items-center gap-4 rounded-2xl bg-gray-50 p-4'>
                <img
                  src={guest.avatar}
                  alt={guest.name}
                  className='h-12 w-12 rounded-full object-cover'
                />
                <div className='flex-1'>
                  <h3 className='font-semibold text-gray-900'>{guest.name}</h3>
                  {/* Don't show email in public view for privacy */}
                  <p className='text-sm text-gray-500'>Going to this event</p>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='h-3 w-3 rounded-full bg-green-500' />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className='py-16 text-center'>
            <div className='mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
              <Users className='h-8 w-8 text-gray-400' />
            </div>
            <h3 className='mb-2 text-lg font-medium text-gray-900'>
              {searchQuery ? 'No matching guests' : 'No guests going yet'}
            </h3>
            <p className='text-sm text-gray-500'>
              {searchQuery
                ? 'Try adjusting your search terms.'
                : "No guests have confirmed they're going yet."}
            </p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className='border-t border-gray-100 bg-gray-50 p-4'>
        <div className='flex items-center justify-between text-sm text-gray-600'>
          <span>Total Going: {goingGuests.length}</span>
          <span>{searchQuery ? `Showing: ${filteredGuests.length}` : ''}</span>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Search, Users } from 'lucide-react';
import { getEventById } from '@/lib/data/sample-events';
import { Guest } from '@/lib/types/event';

export default function PublicGuestListPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  
  // Get existing event data
  const existingEvent = getEventById(eventId);
  
  if (!existingEvent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600 mb-4">The event you're trying to view doesn't exist.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Guest List Private</h1>
          <p className="text-gray-600 mb-4">The guest list for this event is private.</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Get only guests who are going (public view)
  const guests = existingEvent.guests || [];
  const goingGuests = guests.filter(guest => guest.status === 'going');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter guests based on search query
  const filteredGuests = goingGuests.filter(guest => {
    const matchesSearch = guest.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         guest.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="md:max-w-sm max-w-full mx-auto bg-white min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-semibold">Guest List</h1>
            <p className="text-sm text-gray-500">{goingGuests.length} people going</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search guests..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-3 bg-gray-100 rounded-xl border-none outline-none text-gray-900 placeholder-gray-500"
          />
        </div>
      </div>

      {/* Tab Header - Shows only "Going" */}
      <div className="px-4">
        <div className="flex space-x-1 pb-2">
          <div className="px-4 py-2 rounded-lg font-medium bg-black text-white">
            Going ({goingGuests.length})
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        {filteredGuests.length > 0 ? (
          <div className="space-y-3">
            {filteredGuests.map((guest) => (
              <div key={guest.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                <img
                  src={guest.avatar}
                  alt={guest.name}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{guest.name}</h3>
                  {/* Don't show email in public view for privacy */}
                  <p className="text-sm text-gray-500">Going to this event</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? 'No matching guests' : 'No guests going yet'}
            </h3>
            <p className="text-gray-500 text-sm">
              {searchQuery 
                ? 'Try adjusting your search terms.' 
                : "No guests have confirmed they're going yet."
              }
            </p>
          </div>
        )}
      </div>

      {/* Summary Footer */}
      <div className="border-t border-gray-100 p-4 bg-gray-50">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <span>Total Going: {goingGuests.length}</span>
          <span>
            {searchQuery ? `Showing: ${filteredGuests.length}` : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
'use client';

import EventRSVPSheet from '@/components/event-detail/event-rsvp-sheet';
import { Button } from '@/components/ui/button';
import { EVENT_INVITES_CONFIG } from '@/lib/constants/event-invites';
import { useEventInvites } from '@/lib/hooks/use-event-invites';
import { ArrowRight, Calendar } from 'lucide-react';
import { useState } from 'react';
import { EventInviteCard } from './event-invite-card';
import { EventInvitesSheet } from './event-invites-sheet';

export function EventInvitesSection() {
  const [showInvitesSheet, setShowInvitesSheet] = useState(false);
  const [showRSVPSheet, setShowRSVPSheet] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');

  const { data: pendingInvites = [], isLoading: isLoadingPending } = useEventInvites('pending');

  const handleRSVP = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowRSVPSheet(true);
  };

  // Show loading state
  if (isLoadingPending) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Event Invites</h2>
        </div>
        <div className='flex gap-4 overflow-x-auto pb-2'>
          {[...Array(2)].map((_, i) => (
            <div
              key={i}
              className='h-40 w-72 flex-shrink-0 animate-pulse rounded-2xl bg-gray-100'
            />
          ))}
        </div>
      </div>
    );
  }

  // Show empty state if no invites
  if (pendingInvites.length === 0) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Event Invites</h2>
        </div>
        <div className='flex flex-col items-center justify-center py-8 text-center'>
          <div className='mb-4 rounded-2xl bg-gray-100 p-4'>
            <Calendar className='h-8 w-8 text-gray-400' />
          </div>
          <h3 className='mb-1 text-base font-semibold text-gray-900'>No pending invites</h3>
          <p className='text-sm text-gray-500'>You're all caught up!</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-lg font-semibold'>Event Invites</h2>
          <Button variant='outline' size='sm' onClick={() => setShowInvitesSheet(true)}>
            View All <ArrowRight className='h-4 w-4' />
          </Button>
        </div>

        <div className='scrollbar-hide flex gap-4 overflow-x-auto'>
          {pendingInvites.slice(0, EVENT_INVITES_CONFIG.MAX_DISPLAYED_INVITES).map((invite) => (
            <EventInviteCard
              key={invite.id}
              invite={invite}
              className='w-80 sm:w-72 md:w-80 lg:w-80'
              onRSVP={() => handleRSVP(invite.event_id)}
            />
          ))}
        </div>
      </div>

      {/* Event Invites Sheet */}
      <EventInvitesSheet
        showInvitesSheet={showInvitesSheet}
        setShowInvitesSheet={setShowInvitesSheet}
        handleRSVP={handleRSVP}
      />

      {/* RSVP Sheet */}
      {selectedEventId && (
        <EventRSVPSheet
          eventId={selectedEventId}
          isOpen={showRSVPSheet}
          onClose={() => {
            setShowRSVPSheet(false);
            setSelectedEventId('');
          }}
        />
      )}
    </>
  );
}

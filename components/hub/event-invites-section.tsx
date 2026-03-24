'use client';

import { CircledIconButton } from '@/components/circled-icon-button';
import EventRSVPSheet from '@/components/event-detail/event-rsvp-sheet';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { EVENT_INVITES_CONFIG } from '@/lib/constants/event-invites';
import { EventInvite, HubSectionError } from '@/lib/types/api';
import { AlertTriangle, ArrowRight, Calendar } from 'lucide-react';
import { useState } from 'react';
import { EventInviteDetailSheet } from './event-invite-detail-sheet';
import { EventInviteStoryThumbnail } from './event-invite-story-thumbnail';
import { EventInvitesSheet } from './event-invites-sheet';

interface EventInvitesSectionProps {
  pendingInvites?: EventInvite[];
  pendingTotalCount?: number | null;
  pendingError?: HubSectionError;
}

export function EventInvitesSection({
  pendingInvites = [],
  pendingTotalCount,
  pendingError,
}: EventInvitesSectionProps) {
  const [showInvitesSheet, setShowInvitesSheet] = useState(false);
  const [showRSVPSheet, setShowRSVPSheet] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedInvite, setSelectedInvite] = useState<EventInvite | null>(null);
  const [showDetailSheet, setShowDetailSheet] = useState(false);

  const handleRSVP = (eventId: string) => {
    setSelectedEventId(eventId);
    setShowRSVPSheet(true);
  };

  const handleThumbnailClick = (invite: EventInvite) => {
    setSelectedInvite(invite);
    setShowDetailSheet(true);
  };

  if (pendingError) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>Invites</h2>
        </div>
        <Empty className='py-8'>
          <EmptyHeader>
            <EmptyMedia variant='soft-square'>
              <AlertTriangle className='h-8 w-8' />
            </EmptyMedia>
            <EmptyTitle className='text-base sm:text-base'>Couldn&apos;t load invites</EmptyTitle>
            <EmptyDescription>{pendingError.message}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  // Show empty state if no invites
  if (pendingInvites.length === 0) {
    return (
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>Invites</h2>
        </div>
        <Empty className='py-8'>
          <EmptyHeader>
            <EmptyMedia variant='soft-square'>
              <Calendar className='h-8 w-8' />
            </EmptyMedia>
            <EmptyTitle className='text-base sm:text-base'>No pending invites</EmptyTitle>
            <EmptyDescription>You&apos;re all caught up!</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  return (
    <>
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-semibold'>Invites</h2>
          <CircledIconButton icon={ArrowRight} onClick={() => setShowInvitesSheet(true)} />
        </div>

        <div className='no-scrollbar flex gap-3 overflow-x-auto pb-2'>
          {pendingInvites.slice(0, EVENT_INVITES_CONFIG.MAX_DISPLAYED_INVITES).map((invite) => (
            <EventInviteStoryThumbnail
              key={invite.id}
              invite={invite}
              onClick={() => handleThumbnailClick(invite)}
            />
          ))}
        </div>
      </div>

      {/* Event Invites Sheet */}
      <EventInvitesSheet
        showInvitesSheet={showInvitesSheet}
        setShowInvitesSheet={setShowInvitesSheet}
        handleRSVP={handleRSVP}
        pendingInvites={pendingInvites}
        pendingTotalCount={pendingTotalCount}
        pendingError={pendingError}
      />

      {/* Detail Sheet */}
      <EventInviteDetailSheet
        invite={selectedInvite}
        isOpen={showDetailSheet}
        onClose={() => {
          setShowDetailSheet(false);
          setSelectedInvite(null);
        }}
        onRSVP={() => selectedInvite && handleRSVP(selectedInvite.event_id)}
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

'use client';

import { useEventSavedStatus } from '@/lib/hooks/use-event-saved-status';
import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
import { streamChatService } from '@/lib/services/stream-chat';
import { Event } from '@/lib/types/event';
import { toast } from '@/lib/utils/toast';
import { Calendar, Clock, Mail, MapPin, MoreHorizontal, Share, Star } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import RsvpSheet from './event-rsvp-sheet';
import MoreOptionsSheet from './more-options-sheet';
import OwnerEventButtons from './owner-event-buttons';
import SaveEventSheet from './save-event-sheet';

interface EventInfoProps {
  event: Event;
  currentUserId?: string;
}

export default function EventInfo({ event, currentUserId = '' }: EventInfoProps) {
  const router = useRouter();
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showRsvpSheet, setShowRsvpSheet] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);

  // Current user's RSVP status for this event
  const { data: userRsvp } = useUserRSVP(event.id);
  const currentStatus = userRsvp?.status ?? null;

  // Check if event is saved to any list
  const { data: savedStatus } = useEventSavedStatus(event.id);
  const isSaved = savedStatus?.is_saved ?? false;

  const rsvpButton = useMemo(() => {
    if (currentStatus === 'yes')
      return {
        label: "You're going",
        className: 'bg-green-600 hover:bg-green-700 text-white',
      };
    if (currentStatus === 'maybe')
      return {
        label: 'Maybe',
        className: 'bg-black hover:bg-gray-900 text-white',
      };
    if (currentStatus === 'no')
      return {
        label: 'Not going',
        className: 'bg-gray-400 hover:bg-gray-400 text-white',
      };
    return {
      label: 'RSVP',
      className: 'bg-red-500 hover:bg-red-600 text-white',
    };
  }, [currentStatus]);

  const handleRSVP = () => {
    setShowRsvpSheet(true);
  };

  const handleContact = async () => {
    // Get the first host (primary host) to start DM with
    const primaryHost = event.hosts?.[0];
    if (!primaryHost) {
      toast.error('No host available to contact');
      return;
    }

    try {
      const res = await streamChatService.createDirectMessageChannel(primaryHost.id);
      if (res?.channel?.id) {
        router.push(`/e/messages/${res.channel.id}`);
      } else {
        toast.error('Unable to start chat');
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to start chat');
      console.error('createDirectMessageChannel error', err);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleSendMessage = (message: string) => {
    console.log('Sending message:', message);
    // In a real app, this would send the message to the host via API
  };

  const handleAddToCalendar = () => {
    // Generate .ics file content
    const formatICSDate = (dateStr: string) => {
      // Convert ISO date to ICS format: YYYYMMDDTHHMMSSZ
      const date = new Date(dateStr);
      return date
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}/, '');
    };

    const escapeICS = (text: string) => {
      return text
        .replace(/[\n\r]/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');
    };

    const location = `${event.location.name}, ${
      event.location.address || ''
    }, ${event.location.city}, ${event.location.state || ''} ${event.location.zipCode || ''}`
      .replace(/,\s*,/g, ',')
      .trim();

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Evento//Event Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${event.id}@evento.so`,
      `DTSTAMP:${formatICSDate(new Date().toISOString())}`,
      `DTSTART:${formatICSDate(event.computedStartDate)}`,
      `DTEND:${formatICSDate(event.computedEndDate)}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `DESCRIPTION:${escapeICS(event.description.replace(/<[^>]*>/g, ''))}`,
      `LOCATION:${escapeICS(location)}`,
      event.registrationUrl ? `URL:${event.registrationUrl}` : '',
      'END:VEVENT',
      'END:VCALENDAR',
    ]
      .filter(Boolean)
      .join('\r\n');

    // Create and download .ics file
    const blob = new Blob([icsContent], {
      type: 'text/calendar;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Check if current user is the event owner
  const isOwner = event.owner?.id === currentUserId;

  return (
    <>
      <div className='space-y-6 py-6'>
        {/* Date and Time */}
        <div className='space-y-3'>
          <div className='flex items-center gap-3 text-black'>
            <span className='text-2xl font-bold'>{event.title}</span>
          </div>
          <div className='flex items-center gap-3 text-gray-700'>
            <Calendar className='h-5 w-5 text-gray-400' />
            <span className='font-medium'>{event.date}</span>
          </div>
          <div className='flex items-center gap-3 text-gray-700'>
            <Clock className='h-5 w-5 text-gray-400' />
            <span>
              {event.startTime} - {event.endTime}
              {event.timezone && ` ${event.timezone}`}
            </span>
          </div>
          <div className='flex items-center gap-3 text-gray-700'>
            <MapPin className='h-5 w-5 text-gray-400' />
            <span>{event.location.name}</span>
          </div>
        </div>

        {/* Action Buttons - Different for owners vs guests */}
        {isOwner ? (
          <OwnerEventButtons eventId={event.id} />
        ) : (
          <div className='grid grid-cols-4 gap-2'>
            <button
              onClick={handleRSVP}
              className={`flex h-16 flex-col items-center justify-center rounded-2xl transition-colors ${rsvpButton.className}`}
            >
              <Star className='mb-1 h-5 w-5' />
              <span className='text-xs font-medium'>{rsvpButton.label}</span>
            </button>

            <button
              onClick={handleContact}
              className='flex h-16 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:bg-gray-100'
            >
              <Mail className='mb-1 h-5 w-5' />
              <span className='text-xs font-medium'>Contact</span>
            </button>

            <button
              onClick={handleShare}
              className='flex h-16 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:bg-gray-100'
            >
              <Share className='mb-1 h-5 w-5' />
              <span className='text-xs font-medium'>Share</span>
            </button>

            <button
              onClick={() => setShowMoreSheet(true)}
              className='flex h-16 flex-col items-center justify-center rounded-2xl border border-gray-200 bg-gray-50 text-gray-700 transition-colors hover:bg-gray-100'
            >
              <MoreHorizontal className='mb-1 h-5 w-5' />
              <span className='text-xs font-medium'>More</span>
            </button>
          </div>
        )}
      </div>

      {/* More Options Sheet */}
      <MoreOptionsSheet
        isOpen={showMoreSheet}
        onClose={() => setShowMoreSheet(false)}
        onAddToCalendar={handleAddToCalendar}
        onSaveEvent={() => setShowSaveSheet(true)}
        isSaved={isSaved}
      />

      {/* Save Event Sheet */}
      <SaveEventSheet
        isOpen={showSaveSheet}
        onClose={() => setShowSaveSheet(false)}
        eventId={event.id}
      />

      {/* RSVP Sheet */}
      <RsvpSheet
        eventId={event.id}
        isOpen={showRsvpSheet}
        onClose={() => setShowRsvpSheet(false)}
      />
    </>
  );
}

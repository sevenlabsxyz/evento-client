'use client';

import { EventHost } from '@/lib/hooks/use-event-hosts';
import { useEventSavedStatus } from '@/lib/hooks/use-event-saved-status';
import { useMyRegistration } from '@/lib/hooks/use-my-registration';
import { useRegistrationSettings } from '@/lib/hooks/use-registration-settings';
import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
import { streamChatService } from '@/lib/services/stream-chat';
import { Event as ApiEvent } from '@/lib/types/api';
import { EventDetail } from '@/lib/types/event';
import { getContributionMethods } from '@/lib/utils/event-transform';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { Calendar, Clock, Mail, MapPin, MoreHorizontal, Share, Star, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import ContributionPaymentSheet from './contribution-payment-sheet';
import RsvpSheet from './event-rsvp-sheet';
import MoreOptionsSheet from './more-options-sheet';
import OwnerEventButtons from './owner-event-buttons';
import { RegistrationStatus } from './registration-status';
import SaveEventSheet from './save-event-sheet';

interface EventInfoProps {
  event: EventDetail;
  currentUserId?: string;
  eventData?: ApiEvent | null;
  hosts?: EventHost[];
}

export default function EventInfo({ event, currentUserId = '', eventData, hosts }: EventInfoProps) {
  const router = useRouter();
  const [showMoreSheet, setShowMoreSheet] = useState(false);
  const [showRsvpSheet, setShowRsvpSheet] = useState(false);
  const [showSaveSheet, setShowSaveSheet] = useState(false);
  const [showContributionSheet, setShowContributionSheet] = useState(false);

  const { data: userRsvp } = useUserRSVP(event.id);
  const currentStatus = userRsvp?.status ?? null;

  const { data: savedStatus } = useEventSavedStatus(event.id);
  const isSaved = savedStatus?.is_saved ?? false;

  const { data: registrationSettings } = useRegistrationSettings(event.id);
  const { data: myRegistration } = useMyRegistration(event.id);

  const registrationRequired = registrationSettings?.registration_required ?? false;
  const hasPendingRegistration =
    registrationRequired &&
    myRegistration?.has_registration &&
    myRegistration.registration?.approval_status === 'pending';
  const hasDeniedRegistration =
    registrationRequired &&
    myRegistration?.has_registration &&
    myRegistration.registration?.approval_status === 'denied';

  const hasContributions = useMemo(() => {
    if (!eventData) return false;
    return getContributionMethods(eventData).length > 0;
  }, [eventData]);

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

  const handlePendingClick = () => {
    toast.info('Your registration is pending host approval');
  };

  const handleDeniedClick = () => {
    toast.error('Your registration was not approved. Contact the host for details.');
  };

  const handleContact = async () => {
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
      logger.error('createDirectMessageChannel error', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  };

  const handleShare = async () => {
    const url = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url,
        });
        return;
      } catch (error: any) {
        if (error?.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('Link copied to clipboard!');
    }
  };

  const handleAddToCalendar = () => {
    const formatICSDate = (dateStr: string) => {
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

  const handleContribute = () => {
    setShowContributionSheet(true);
  };

  const isOwnerOrCohost = useMemo(() => {
    if (!currentUserId) return false;
    if (event.owner?.id === currentUserId) return true;
    return hosts?.some((h) => h.user_details?.id === currentUserId) ?? false;
  }, [currentUserId, event.owner?.id, hosts]);

  return (
    <>
      <div className='space-y-6 py-6'>
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

        {isOwnerOrCohost ? (
          <OwnerEventButtons eventId={event.id} />
        ) : (
          <>
            <div className='grid grid-cols-4 gap-2'>
              {hasPendingRegistration ? (
                <button
                  onClick={handlePendingClick}
                  className='flex h-16 flex-col items-center justify-center rounded-2xl bg-yellow-100 text-yellow-700 transition-colors hover:bg-yellow-200'
                >
                  <Clock className='mb-1 h-5 w-5' />
                  <span className='text-xs font-medium'>Pending</span>
                </button>
              ) : hasDeniedRegistration ? (
                <button
                  onClick={handleDeniedClick}
                  className='flex h-16 flex-col items-center justify-center rounded-2xl bg-red-100 text-red-700 transition-colors hover:bg-red-200'
                >
                  <XCircle className='mb-1 h-5 w-5' />
                  <span className='text-xs font-medium'>Denied</span>
                </button>
              ) : (
                <button
                  onClick={handleRSVP}
                  className={`flex h-16 flex-col items-center justify-center rounded-2xl transition-colors ${rsvpButton.className}`}
                >
                  <Star className='mb-1 h-5 w-5' />
                  <span className='text-xs font-medium'>{rsvpButton.label}</span>
                </button>
              )}

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

            {(hasPendingRegistration || hasDeniedRegistration) && myRegistration?.registration && (
              <div className='mt-4'>
                <RegistrationStatus registration={myRegistration.registration} />
              </div>
            )}
          </>
        )}
      </div>

      <MoreOptionsSheet
        isOpen={showMoreSheet}
        onClose={() => setShowMoreSheet(false)}
        onAddToCalendar={handleAddToCalendar}
        onSaveEvent={() => setShowSaveSheet(true)}
        onContribute={handleContribute}
        isSaved={isSaved}
        hasContributions={hasContributions}
      />

      <SaveEventSheet
        isOpen={showSaveSheet}
        onClose={() => setShowSaveSheet(false)}
        eventId={event.id}
      />

      <RsvpSheet
        eventId={event.id}
        isOpen={showRsvpSheet}
        onClose={() => setShowRsvpSheet(false)}
        eventData={eventData}
      />

      {eventData && (
        <ContributionPaymentSheet
          isOpen={showContributionSheet}
          onClose={() => setShowContributionSheet(false)}
          eventData={eventData}
        />
      )}
    </>
  );
}

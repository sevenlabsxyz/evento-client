'use client';

import { StatusBadge } from '@/components/ui/status-badge';
import { EventHost } from '@/lib/hooks/use-event-hosts';
import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
import { useMyRegistration } from '@/lib/hooks/use-my-registration';
import { useRegistrationSettings } from '@/lib/hooks/use-registration-settings';
import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
import { Event as ApiEvent } from '@/lib/types/api';
import { EventDetail } from '@/lib/types/event';
import { formatEventDateRange } from '@/lib/utils/date';
import { formatICSDate, formatICSDateFromParts } from '@/lib/utils/ics';
import { formatEventLocationAddress } from '@/lib/utils/location';
import { toast } from '@/lib/utils/toast';
import { ChevronRight, Clock, Globe, Lock, MapPin, Star, XCircle } from 'lucide-react';
import { useMemo, useState } from 'react';
import { DateTimeActionsSheet } from './date-time-actions-sheet';
import RsvpSheet from './event-rsvp-sheet';
import { LocationActionsSheet } from './location-actions-sheet';
import OwnerEventButtons from './owner-event-buttons';
import { RegistrationStatus } from './registration-status';

interface EventInfoProps {
  event: EventDetail;
  currentUserId?: string;
  eventData?: ApiEvent | null;
  hosts?: EventHost[];
}

export default function EventInfo({ event, currentUserId = '', eventData, hosts }: EventInfoProps) {
  const [showRsvpSheet, setShowRsvpSheet] = useState(false);
  const [showDateTimeSheet, setShowDateTimeSheet] = useState(false);
  const [showLocationSheet, setShowLocationSheet] = useState(false);

  const { data: userRsvp } = useUserRSVP(event.id);
  const { data: eventRsvps } = useEventRSVPs(event.id);
  const currentStatus = userRsvp?.status ?? null;

  const { data: registrationSettings } = useRegistrationSettings(event.id);
  const { data: myRegistration } = useMyRegistration(event.id);

  const registrationRequired =
    eventData?.type !== undefined
      ? eventData.type !== 'rsvp'
      : (registrationSettings?.registration_required ?? false);
  const hasPendingRegistration =
    registrationRequired &&
    myRegistration?.has_registration &&
    myRegistration.registration?.approval_status === 'pending';
  const hasDeniedRegistration =
    registrationRequired &&
    myRegistration?.has_registration &&
    myRegistration.registration?.approval_status === 'denied';

  const maxCapacity = eventData?.max_capacity ?? null;
  const showCapacityCount = Boolean(eventData?.show_capacity_count);
  const yesRsvpCount = useMemo(
    () => (eventRsvps ?? []).filter((rsvp) => rsvp.status === 'yes').length,
    [eventRsvps]
  );
  const isEventFull = maxCapacity !== null && yesRsvpCount >= maxCapacity;
  const spotsRemaining = maxCapacity !== null ? Math.max(0, maxCapacity - yesRsvpCount) : null;
  const isYesRsvp = currentStatus === 'yes';
  const shouldShowCapacityInfo =
    showCapacityCount && maxCapacity !== null && (!isEventFull || isYesRsvp);
  const shouldDisableRsvpButton = isEventFull && !isYesRsvp;

  const rsvpButton = useMemo(() => {
    if (currentStatus === 'yes')
      return {
        label: "You're going",
        className: 'bg-green-600 hover:bg-green-700 text-white',
      };
    if (shouldDisableRsvpButton)
      return {
        label: 'NO SPOTS LEFT',
        className: 'bg-gray-500 text-white',
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
  }, [currentStatus, shouldDisableRsvpButton]);

  const handleRSVP = () => {
    if (shouldDisableRsvpButton) return;
    setShowRsvpSheet(true);
  };

  const handlePendingClick = () => {
    toast.info('Your registration is pending host approval');
  };

  const handleDeniedClick = () => {
    toast.error('Your registration was not approved. Contact the host for details.');
  };

  const copyText = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = value;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(textArea);

      if (!copied) {
        throw new Error('Copy command failed');
      }
    }
  };

  const handleAddToCalendar = () => {
    const escapeICS = (text: string) => {
      return text
        .replace(/[\n\r]/g, '\\n')
        .replace(/,/g, '\\,')
        .replace(/;/g, '\\;');
    };

    const location = isLocationHidden
      ? 'Location hidden until registration approval'
      : `${event.location.name}, ${
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
      `DTSTART${formatICSDateFromParts({
        year: eventData?.start_date_year,
        month: eventData?.start_date_month,
        day: eventData?.start_date_day,
        hours: eventData?.start_date_hours,
        minutes: eventData?.start_date_minutes,
        timezone: event.timezone,
        fallbackIso: event.computedStartDate,
      })}`,
      `DTEND${formatICSDateFromParts({
        year: eventData?.end_date_year,
        month: eventData?.end_date_month,
        day: eventData?.end_date_day,
        hours: eventData?.end_date_hours,
        minutes: eventData?.end_date_minutes,
        timezone: event.timezone,
        fallbackIso: event.computedEndDate,
      })}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `DESCRIPTION:${escapeICS(
        isDescriptionHidden
          ? 'Description hidden until registration approval'
          : event.description.replace(/<[^>]*>/g, '')
      )}`,
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

  const handleCopyDateTime = async () => {
    try {
      await copyText(dateTimeText);
      toast.success('Date and time copied');
    } catch {
      toast.error('Failed to copy date and time');
    }
  };

  const isOwnerOrCohost = useMemo(() => {
    if (!currentUserId) return false;
    if (event.owner?.id === currentUserId) return true;
    return hosts?.some((h) => h.user_details?.id === currentUserId) ?? false;
  }, [currentUserId, event.owner?.id, hosts]);

  const isLocationHidden = eventData?.restricted_fields?.includes('location') ?? false;
  const isDescriptionHidden = eventData?.restricted_fields?.includes('description') ?? false;
  const isTBDLocation = event.location.name === 'TBD';
  const fullAddress = formatEventLocationAddress(event.location);
  const destination = event.location.coordinates
    ? `${event.location.coordinates.lat},${event.location.coordinates.lng}`
    : fullAddress;

  const startDate = useMemo(() => {
    const monthShort = event.monthShort ?? '';
    const day = event.dayOfMonth ?? '';
    const fullDate = formatEventDateRange(
      event.computedStartDate,
      event.computedEndDate,
      eventData?.timezone
    );

    if (!monthShort && !day && !fullDate) {
      return null;
    }

    return {
      monthShort,
      day,
      fullDate,
    };
  }, [
    event.monthShort,
    event.dayOfMonth,
    event.computedStartDate,
    event.computedEndDate,
    eventData?.timezone,
  ]);

  const dateTimeSubtitle = `${event.startTime} - ${event.endTime}${event.timezone ? ` ${event.timezone}` : ''}`;
  const dateTimeText = [startDate?.fullDate, dateTimeSubtitle].filter(Boolean).join('\n');

  const detailModuleBaseClassName =
    'flex h-[2.7rem] w-[2.7rem] shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-50';

  return (
    <>
      <div className='space-y-6 py-6'>
        <div className='space-y-4'>
          {eventData?.visibility && (
            <div className='mb-2 flex items-center gap-2'>
              <StatusBadge
                status={eventData.visibility === 'public' ? 'success' : 'default'}
                leftIcon={eventData.visibility === 'public' ? Globe : Lock}
                leftLabel={eventData.visibility === 'public' ? 'Public' : 'Private'}
              />
            </div>
          )}
          <span className='text-2xl font-bold text-black'>{event.title}</span>

          {/* Date + Time */}
          <button
            type='button'
            onClick={() => setShowDateTimeSheet(true)}
            className='group flex w-full items-center gap-4 text-left'
          >
            <div className={`${detailModuleBaseClassName} flex-col`}>
              <span className='text-[9px] font-semibold uppercase leading-none text-gray-500'>
                {startDate?.monthShort}
              </span>
              <span className='text-[15px] font-bold leading-none text-gray-900'>
                {startDate?.day}
              </span>
            </div>
            <div className='min-w-0 flex-1'>
              <div className='flex flex-col'>
                <span className='font-semibold text-gray-900 group-hover:underline'>
                  {startDate?.fullDate}
                </span>
                <span className='text-sm text-gray-500'>{dateTimeSubtitle}</span>
              </div>
            </div>
            <ChevronRight className='h-5 w-5 shrink-0 text-gray-400 transition-colors group-hover:text-gray-600' />
          </button>

          {/* Location */}
          {!isLocationHidden && (
            <button
              type='button'
              onClick={() => !isTBDLocation && setShowLocationSheet(true)}
              className='group flex w-full items-center gap-4 text-left'
            >
              <div className={detailModuleBaseClassName}>
                <MapPin className='h-[18px] w-[18px] text-gray-600' />
              </div>
              <div className='min-w-0 flex-1'>
                <div className='flex flex-col'>
                  <span
                    className={`font-semibold ${isTBDLocation ? 'text-gray-500' : 'text-gray-900 group-hover:underline'}`}
                  >
                    {event.location.name}
                  </span>
                  {(event.location.city || event.location.state) && (
                    <span className='text-sm text-gray-500'>
                      {event.location.city}
                      {event.location.city && event.location.state && `, ${event.location.state}`}
                    </span>
                  )}
                </div>
              </div>
              {!isTBDLocation && (
                <ChevronRight className='h-5 w-5 shrink-0 text-gray-400 transition-colors group-hover:text-gray-600' />
              )}
            </button>
          )}
        </div>

        {isOwnerOrCohost ? (
          <OwnerEventButtons eventId={event.id} />
        ) : (
          <>
            <div className='grid grid-cols-1 gap-2'>
              {hasPendingRegistration ? (
                <button
                  type='button'
                  onClick={handlePendingClick}
                  className='flex h-16 flex-col items-center justify-center rounded-full bg-yellow-100 text-yellow-700 transition-colors hover:bg-yellow-200'
                >
                  <Clock className='mb-1 h-5 w-5' />
                  <span className='text-xs font-medium'>Pending</span>
                </button>
              ) : hasDeniedRegistration ? (
                <button
                  type='button'
                  onClick={handleDeniedClick}
                  className='flex h-16 flex-col items-center justify-center rounded-full bg-red-100 text-red-700 transition-colors hover:bg-red-200'
                >
                  <XCircle className='mb-1 h-5 w-5' />
                  <span className='text-xs font-medium'>Denied</span>
                </button>
              ) : (
                <button
                  type='button'
                  onClick={handleRSVP}
                  disabled={shouldDisableRsvpButton}
                  className={`flex h-16 flex-col items-center justify-center rounded-full transition-colors ${rsvpButton.className} ${shouldDisableRsvpButton ? 'cursor-not-allowed' : ''}`}
                >
                  <Star className='mb-1 h-5 w-5' />
                  <span className='text-xs font-medium'>{rsvpButton.label}</span>
                </button>
              )}
            </div>

            {shouldShowCapacityInfo && spotsRemaining !== null && (
              <p className='text-center text-sm text-gray-500'>
                {isEventFull && isYesRsvp
                  ? 'No more spots left'
                  : `${spotsRemaining} ${spotsRemaining === 1 ? 'spot' : 'spots'} left`}
              </p>
            )}

            {(hasPendingRegistration || hasDeniedRegistration) && myRegistration?.registration && (
              <div className='mt-4'>
                <RegistrationStatus registration={myRegistration.registration} />
              </div>
            )}
          </>
        )}
      </div>

      <DateTimeActionsSheet
        open={showDateTimeSheet}
        onOpenChange={setShowDateTimeSheet}
        dateTimeText={dateTimeText}
        onAddToCalendar={handleAddToCalendar}
        onCopyDateTime={handleCopyDateTime}
      />

      <RsvpSheet
        eventId={event.id}
        isOpen={showRsvpSheet}
        onClose={() => setShowRsvpSheet(false)}
        eventData={eventData}
      />

      {!isLocationHidden && !isTBDLocation && (
        <LocationActionsSheet
          open={showLocationSheet}
          onOpenChange={setShowLocationSheet}
          fullAddress={fullAddress}
          destination={destination}
        />
      )}
    </>
  );
}

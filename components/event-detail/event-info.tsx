'use client';

import { EventHost } from '@/lib/hooks/use-event-hosts';
import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
import { useMyRegistration } from '@/lib/hooks/use-my-registration';
import { useRegistrationSettings } from '@/lib/hooks/use-registration-settings';
import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
import { Event as ApiEvent, EventBehaviorType } from '@/lib/types/api';
import { EventDetail } from '@/lib/types/event';
import { cn } from '@/lib/utils';
import { formatEventDateRangeFromParts } from '@/lib/utils/date';
import { formatICSDate, formatICSDateFromParts } from '@/lib/utils/ics';
import { formatEventLocationAddress, getEventLocationDisplayLines } from '@/lib/utils/location';
import { toast } from '@/lib/utils/toast';
import { ChevronRight, Clock, Globe, Lock, MapPin, Star, XCircle } from 'lucide-react';
import { type ReactNode, useMemo, useState } from 'react';
import { DateTimeActionsSheet } from './date-time-actions-sheet';
import RsvpSheet from './event-rsvp-sheet';
import { LocationActionsSheet } from './location-actions-sheet';
import OwnerEventButtons from './owner-event-buttons';
import { RegistrationStatus } from './registration-status';

const EVENT_TYPE_LABELS: Record<EventBehaviorType, string> = {
  rsvp: 'RSVP',
  registration: 'Registration',
  ticketed: 'Ticketed',
};

const NEUTRAL_CHIP_CLASS = 'bg-gray-100 text-gray-700 dark:bg-neutral-800 dark:text-neutral-300';

type ActionStatusTone = 'positive' | 'pending' | 'negative' | 'neutral';

const ACTION_STATUS_DOT_CLASS: Record<ActionStatusTone, string> = {
  positive: 'bg-emerald-500 dark:bg-emerald-400',
  pending: 'bg-amber-500 dark:bg-amber-400',
  negative: 'bg-red-500 dark:bg-red-400',
  neutral: 'bg-gray-400 dark:bg-neutral-500',
};

function HeroChip({ className, children }: { className: string; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        className
      )}
    >
      {children}
    </span>
  );
}

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
        className:
          'bg-black dark:bg-neutral-100 hover:bg-gray-900 dark:hover:bg-neutral-200 text-white dark:text-neutral-900',
      };
    if (currentStatus === 'no')
      return {
        label: 'Not going',
        className:
          'bg-gray-400 dark:bg-neutral-500 hover:bg-gray-400 dark:hover:bg-neutral-500 text-white',
      };
    return {
      label: 'RSVP',
      className: 'bg-red-500 dark:bg-red-600 hover:bg-red-600 dark:hover:bg-red-700 text-white',
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

  const hasStructuredLocation = Boolean(eventData?.event_locations);

  // Compute whether this viewer is an approved attendee.
  // Password alone does NOT count — requires RSVP 'yes' and, when registration is
  // required, an 'approved' approval status.
  const isApprovedAttendee = useMemo(() => {
    if (isOwnerOrCohost) return true;
    if (currentStatus !== 'yes') return false;
    if (registrationRequired) {
      return myRegistration?.registration?.approval_status === 'approved';
    }
    return true;
  }, [isOwnerOrCohost, currentStatus, registrationRequired, myRegistration]);

  // Drive visibility from the host's raw settings + approval state,
  // NOT from restricted_fields (which is backend-computed and treats password-holders as approved).
  const visibilitySettings = eventData?.visibility_settings;
  const isLocationHidden =
    (visibilitySettings?.hide_location_for_unapproved ?? false) && !isApprovedAttendee;
  const isDescriptionHidden =
    (visibilitySettings?.hide_description_for_unapproved ?? false) && !isApprovedAttendee;
  const locationDisplay = getEventLocationDisplayLines(event.location, {
    preferStructuredAddress: hasStructuredLocation,
    fallbackLabel: hasStructuredLocation ? undefined : eventData?.location,
  });
  const isTBDLocation = locationDisplay.primary === 'TBD';
  const fullAddress = formatEventLocationAddress(event.location);
  const destination = event.location.coordinates
    ? `${event.location.coordinates.lat},${event.location.coordinates.lng}`
    : fullAddress;

  const dateRange = useMemo(
    () =>
      formatEventDateRangeFromParts({
        start: {
          year: eventData?.start_date_year,
          month: eventData?.start_date_month,
          day: eventData?.start_date_day,
          hours: eventData?.start_date_hours,
          minutes: eventData?.start_date_minutes,
          timezone: eventData?.timezone,
          fallbackIso: event.computedStartDate,
        },
        end: {
          year: eventData?.end_date_year,
          month: eventData?.end_date_month,
          day: eventData?.end_date_day,
          hours: eventData?.end_date_hours,
          minutes: eventData?.end_date_minutes,
          timezone: eventData?.timezone,
          fallbackIso: event.computedEndDate,
        },
      }),
    [
      event.computedEndDate,
      event.computedStartDate,
      eventData?.end_date_day,
      eventData?.end_date_hours,
      eventData?.end_date_minutes,
      eventData?.end_date_month,
      eventData?.end_date_year,
      eventData?.start_date_day,
      eventData?.start_date_hours,
      eventData?.start_date_minutes,
      eventData?.start_date_month,
      eventData?.start_date_year,
      eventData?.timezone,
    ]
  );

  const startDate = useMemo(() => {
    const monthShort = dateRange.startDate.monthShort || event.monthShort || '';
    const day = dateRange.startDate.dayOfMonth || event.dayOfMonth || '';
    const fullDate = dateRange.displayDate || event.longDate || event.date;

    if (!monthShort && !day && !fullDate) {
      return null;
    }

    return {
      monthShort,
      day,
      fullDate,
    };
  }, [
    dateRange.displayDate,
    dateRange.startDate.dayOfMonth,
    dateRange.startDate.monthShort,
    event.date,
    event.dayOfMonth,
    event.longDate,
    event.monthShort,
  ]);

  const startTime = dateRange.startDate.time || event.startTime;
  const endTime = dateRange.endDate.time || event.endTime;
  const dateTimeSubtitle = `${startTime} - ${endTime}${event.timezone ? ` ${event.timezone}` : ''}`;
  const dateTimeText = [startDate?.fullDate, dateTimeSubtitle].filter(Boolean).join('\n');

  const isDraft = eventData?.status === 'draft';
  const isCancelled = eventData?.status === 'cancelled' || eventData?.status === 'archived';
  const typeLabel = eventData?.type ? EVENT_TYPE_LABELS[eventData.type] : null;

  const viewerChip = isOwnerOrCohost
    ? { label: 'Hosting', className: 'bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-400' }
    : hasPendingRegistration
      ? {
          label: 'Pending approval',
          className: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400',
        }
      : currentStatus === 'yes'
        ? {
            label: 'Going',
            className:
              'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400',
          }
        : null;

  // One-line status above the action buttons. RSVP states are already spelled out by the
  // RSVP button label, so only states the buttons don't convey get a line here.
  const actionStatus: { text: string; tone: ActionStatusTone } | null = isOwnerOrCohost
    ? { text: "You're hosting this event", tone: 'positive' }
    : hasPendingRegistration
      ? { text: 'Waiting for host approval', tone: 'pending' }
      : hasDeniedRegistration
        ? { text: 'Registration not approved', tone: 'negative' }
        : !currentStatus && eventData?.type === 'registration'
          ? { text: 'Registration required', tone: 'neutral' }
          : !currentStatus && eventData?.type === 'ticketed'
            ? { text: 'Ticketed event', tone: 'neutral' }
            : null;

  const capacityText =
    !isOwnerOrCohost && shouldShowCapacityInfo && spotsRemaining !== null
      ? isEventFull && isYesRsvp
        ? 'No more spots left'
        : `${spotsRemaining} ${spotsRemaining === 1 ? 'spot' : 'spots'} left`
      : null;

  const detailRowClassName =
    'group -mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-2xl px-2 py-2 text-left transition-colors';
  const detailRowInteractiveClassName =
    'hover:bg-gray-50 focus-visible:bg-gray-50 focus-visible:outline-none dark:hover:bg-neutral-800/70 dark:focus-visible:bg-neutral-800/70';
  const detailTileClassName =
    'flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 dark:border-neutral-700 dark:bg-neutral-800';
  const detailChevron = (
    <ChevronRight
      className='h-5 w-5 shrink-0 text-gray-400 transition-colors group-hover:text-gray-600 motion-safe:transition motion-safe:group-hover:translate-x-0.5 dark:text-neutral-500 dark:group-hover:text-neutral-300'
      aria-hidden='true'
    />
  );
  const primaryActionClassName =
    'flex h-12 w-full items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors';

  return (
    <>
      <div className='space-y-6'>
        <div className='space-y-4'>
          {(eventData?.visibility || typeLabel || viewerChip || isDraft || isCancelled) && (
            <div className='flex flex-wrap items-center gap-1.5'>
              {isCancelled && (
                <HeroChip className='bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'>
                  Cancelled
                </HeroChip>
              )}
              {isDraft && (
                <HeroChip className='bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400'>
                  Draft
                </HeroChip>
              )}
              {eventData?.visibility && (
                <HeroChip className={NEUTRAL_CHIP_CLASS}>
                  {eventData.visibility === 'public' ? (
                    <Globe className='h-3 w-3' aria-hidden='true' />
                  ) : (
                    <Lock className='h-3 w-3' aria-hidden='true' />
                  )}
                  {eventData.visibility === 'public' ? 'Public' : 'Private'}
                </HeroChip>
              )}
              {typeLabel && <HeroChip className={NEUTRAL_CHIP_CLASS}>{typeLabel}</HeroChip>}
              {viewerChip && (
                <HeroChip className={viewerChip.className}>{viewerChip.label}</HeroChip>
              )}
            </div>
          )}

          <h1 className='break-words text-3xl font-bold tracking-tight text-gray-900 dark:text-neutral-100 md:text-4xl'>
            {event.title}
          </h1>
        </div>

        <div className='space-y-1'>
          {/* Date + Time */}
          <button
            type='button'
            onClick={() => setShowDateTimeSheet(true)}
            className={cn(detailRowClassName, detailRowInteractiveClassName)}
          >
            <div className={cn(detailTileClassName, 'flex-col gap-0.5')}>
              <span className='text-[10px] font-semibold uppercase leading-none tracking-wide text-red-500 dark:text-red-400'>
                {startDate?.monthShort}
              </span>
              <span className='text-lg font-bold leading-none text-gray-900 dark:text-neutral-100'>
                {startDate?.day}
              </span>
            </div>
            <div className='flex min-w-0 flex-1 flex-col'>
              <span className='truncate text-[15px] font-semibold text-gray-900 dark:text-neutral-100'>
                {startDate?.fullDate}
              </span>
              <span className='truncate text-sm text-gray-500 dark:text-neutral-400'>
                {dateTimeSubtitle}
              </span>
            </div>
            {detailChevron}
          </button>

          {/* Location */}
          {!isLocationHidden && (
            <button
              type='button'
              onClick={() => !isTBDLocation && setShowLocationSheet(true)}
              className={cn(
                detailRowClassName,
                isTBDLocation ? 'cursor-default' : detailRowInteractiveClassName
              )}
            >
              <div className={detailTileClassName}>
                <MapPin
                  className='h-5 w-5 text-gray-600 dark:text-neutral-400'
                  aria-hidden='true'
                />
              </div>
              <div className='flex min-w-0 flex-1 flex-col'>
                <span
                  className={cn(
                    'truncate text-[15px] font-semibold',
                    isTBDLocation
                      ? 'text-gray-500 dark:text-neutral-400'
                      : 'text-gray-900 dark:text-neutral-100'
                  )}
                >
                  {locationDisplay.primary}
                </span>
                {locationDisplay.secondary && (
                  <span className='truncate text-sm text-gray-500 dark:text-neutral-400'>
                    {locationDisplay.secondary}
                  </span>
                )}
              </div>
              {!isTBDLocation && detailChevron}
            </button>
          )}
        </div>

        <div className='rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-neutral-800 dark:bg-neutral-900 dark:shadow-none'>
          {(actionStatus || capacityText) && (
            <div className='mb-3 flex items-center justify-between gap-3 text-sm'>
              {actionStatus && (
                <p className='flex min-w-0 items-center gap-2 font-medium text-gray-900 dark:text-neutral-100'>
                  <span
                    className={cn(
                      'h-2 w-2 shrink-0 rounded-full',
                      ACTION_STATUS_DOT_CLASS[actionStatus.tone]
                    )}
                    aria-hidden='true'
                  />
                  <span className='truncate'>{actionStatus.text}</span>
                </p>
              )}
              {capacityText && (
                <p className='ml-auto shrink-0 text-gray-500 dark:text-neutral-400'>
                  {capacityText}
                </p>
              )}
            </div>
          )}

          {isOwnerOrCohost ? (
            <OwnerEventButtons eventId={event.id} />
          ) : (
            <>
              {hasPendingRegistration ? (
                <button
                  type='button'
                  onClick={handlePendingClick}
                  className={cn(
                    primaryActionClassName,
                    'bg-yellow-100 text-yellow-700 hover:bg-yellow-200 dark:bg-yellow-950/60 dark:text-yellow-400 dark:hover:bg-yellow-900/60'
                  )}
                >
                  <Clock className='h-5 w-5' aria-hidden='true' />
                  <span>Pending</span>
                </button>
              ) : hasDeniedRegistration ? (
                <button
                  type='button'
                  onClick={handleDeniedClick}
                  className={cn(
                    primaryActionClassName,
                    'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/60 dark:text-red-400 dark:hover:bg-red-900/60'
                  )}
                >
                  <XCircle className='h-5 w-5' aria-hidden='true' />
                  <span>Denied</span>
                </button>
              ) : (
                <button
                  type='button'
                  onClick={handleRSVP}
                  disabled={shouldDisableRsvpButton}
                  className={cn(
                    primaryActionClassName,
                    rsvpButton.className,
                    shouldDisableRsvpButton && 'cursor-not-allowed'
                  )}
                >
                  <Star className='h-5 w-5' aria-hidden='true' />
                  <span>{rsvpButton.label}</span>
                </button>
              )}

              {(hasPendingRegistration || hasDeniedRegistration) &&
                myRegistration?.registration && (
                  <div className='mt-4'>
                    <RegistrationStatus registration={myRegistration.registration} />
                  </div>
                )}
            </>
          )}
        </div>
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

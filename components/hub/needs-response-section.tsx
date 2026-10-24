'use client';

import EventRSVPSheet from '@/components/event-detail/event-rsvp-sheet';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useAcceptCohostInvite, useRejectCohostInvite } from '@/lib/hooks/use-cohost-invites';
import { CohostInvite, EventInvite, EventWithUser, UserDetails } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { formatEventDateFromParts } from '@/lib/utils/date';
import { getEventCoverDisplayUrl, isGif } from '@/lib/utils/image';
import { toast } from '@/lib/utils/toast';
import { formatDistanceToNowStrict } from 'date-fns';
import { AlertTriangle, ArrowRight, Check, Loader2, Users, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { EventInviteDetailSheet } from './event-invite-detail-sheet';
import { EventInvitesSheet } from './event-invites-sheet';

const MAX_VISIBLE_INVITES = 6;
const INVITE_CARD_CLASS =
  'flex h-full flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900';
const INVITE_SLOT_CLASS = 'w-[85%] max-w-[340px] flex-none snap-start md:w-auto md:max-w-none';

interface NeedsResponseSectionProps {
  cohostInvites: CohostInvite[];
  cohostInvitesError?: string;
  eventInvites: EventInvite[];
  eventInvitesTotalCount: number | null;
  eventInvitesError?: string;
}

interface InviteCardBodyProps {
  kind: string;
  title: string;
  event: EventWithUser | undefined;
  inviter: UserDetails | undefined;
  invitedAt: string;
}

function InviteCardBody({ kind, title, event, inviter, invitedAt }: InviteCardBodyProps) {
  const invitedAgo = formatDistanceToNowStrict(new Date(invitedAt), { addSuffix: true });
  const inviterName = inviter?.name || (inviter?.username ? `@${inviter.username}` : 'Someone');
  const cover =
    event?.cover && isGif(event.cover)
      ? event.cover
      : getEventCoverDisplayUrl(event?.cover, 'thumbnail');
  const { dayOfWeek, shortDate, timeWithTz } = event
    ? formatEventDateFromParts({
        year: event.start_date_year,
        month: event.start_date_month,
        day: event.start_date_day,
        hours: event.start_date_hours,
        minutes: event.start_date_minutes,
        timezone: event.timezone,
        fallbackIso: event.computed_start_date,
      })
    : { dayOfWeek: '', shortDate: '', timeWithTz: '' };
  const dayLabel = dayOfWeek && shortDate ? `${dayOfWeek}, ${shortDate}` : shortDate;
  const dateLabel = [dayLabel, timeWithTz].filter(Boolean).join(' · ');

  return (
    <div className='flex items-start gap-3'>
      <div className='relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-neutral-800 dark:bg-neutral-800'>
        <Image src={cover} alt={title} fill sizes='64px' className='object-cover' />
      </div>
      <div className='min-w-0 flex-1 space-y-0.5'>
        <p className='text-[11px] font-semibold uppercase tracking-wide text-red-600 dark:text-red-400'>
          {kind}
        </p>
        <h3 className='truncate font-semibold text-gray-900 dark:text-neutral-100'>{title}</h3>
        {dateLabel && (
          <p className='truncate text-xs text-gray-600 dark:text-neutral-300'>{dateLabel}</p>
        )}
        <div className='flex min-w-0 items-center gap-1.5 pt-1'>
          {inviter && (
            <UserAvatar
              user={{
                name: inviter.name || undefined,
                username: inviter.username || undefined,
                image: inviter.image || undefined,
                verification_status: inviter.verification_status || null,
              }}
              size='xs'
            />
          )}
          <p className='truncate text-xs text-gray-500 dark:text-neutral-400'>
            <span className='font-medium text-gray-700 dark:text-neutral-200'>{inviterName}</span>
            {' · '}
            {invitedAgo}
          </p>
        </div>
      </div>
    </div>
  );
}

function CohostInviteResponseCard({ invite }: { invite: CohostInvite }) {
  const router = useRouter();
  const acceptMutation = useAcceptCohostInvite();
  const rejectMutation = useRejectCohostInvite();
  const isPending = acceptMutation.isPending || rejectMutation.isPending;

  const event = invite.events;
  const eventId = event?.id || invite.event_id;
  const title = event?.title || 'Event details unavailable';

  return (
    <article className={INVITE_CARD_CLASS}>
      <Link href={`/e/${eventId}`} className='block rounded-xl'>
        <InviteCardBody
          kind='Cohost invite'
          title={title}
          event={event}
          inviter={invite.inviter}
          invitedAt={invite.created_at}
        />
      </Link>
      <div className='mt-auto flex gap-2'>
        <Button
          size='sm'
          className='flex-1'
          disabled={isPending}
          onClick={() =>
            acceptMutation.mutate(invite.id, {
              onSuccess: () => {
                toast.info('Taking you to this event now', 'Redirecting');
                router.push(`/e/${eventId}`);
              },
            })
          }
        >
          {acceptMutation.isPending ? <Loader2 className='animate-spin' /> : <Check />}
          Accept
        </Button>
        <Button
          size='sm'
          variant='outline'
          className='flex-1'
          disabled={isPending}
          onClick={() => rejectMutation.mutate(invite.id)}
        >
          {rejectMutation.isPending ? <Loader2 className='animate-spin' /> : <X />}
          Decline
        </Button>
      </div>
    </article>
  );
}

interface EventInviteResponseCardProps {
  invite: EventInvite;
  onOpen: () => void;
  onRSVP: () => void;
}

function EventInviteResponseCard({ invite, onOpen, onRSVP }: EventInviteResponseCardProps) {
  const event = invite.events;

  return (
    <article className={INVITE_CARD_CLASS}>
      <button type='button' onClick={onOpen} className='block w-full rounded-xl text-left'>
        <InviteCardBody
          kind='Event invite'
          title={event.title}
          event={event}
          inviter={event.user_details}
          invitedAt={invite.created_at}
        />
      </button>
      <div className='mt-auto flex gap-2'>
        <Button size='sm' className='flex-1' onClick={onRSVP}>
          <Users />
          RSVP
        </Button>
        <Button asChild size='sm' variant='outline' className='flex-1'>
          <Link href={`/e/${invite.event_id}`}>View</Link>
        </Button>
      </div>
    </article>
  );
}

function SectionErrorNote({ title, message }: { title: string; message: string }) {
  return (
    <div className='flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-400'>
      <AlertTriangle className='mt-0.5 h-4 w-4 shrink-0' />
      <p>
        <span className='font-semibold'>{title}</span> <span>{message}</span>
      </p>
    </div>
  );
}

export function NeedsResponseSection({
  cohostInvites,
  cohostInvitesError,
  eventInvites,
  eventInvitesTotalCount,
  eventInvitesError,
}: NeedsResponseSectionProps) {
  const [showInvitesSheet, setShowInvitesSheet] = useState(false);
  const [rsvpEventId, setRsvpEventId] = useState<string | null>(null);
  const [detailInvite, setDetailInvite] = useState<EventInvite | null>(null);

  if (
    cohostInvites.length === 0 &&
    eventInvites.length === 0 &&
    !cohostInvitesError &&
    !eventInvitesError
  ) {
    return null;
  }

  const eventInviteCount = Math.max(eventInvitesTotalCount ?? 0, eventInvites.length);
  const totalCount = cohostInvites.length + eventInviteCount;
  const visibleCohostInvites = cohostInvites.slice(0, MAX_VISIBLE_INVITES);
  const visibleEventInvites = eventInvites.slice(
    0,
    MAX_VISIBLE_INVITES - visibleCohostInvites.length
  );
  const hasCards = visibleCohostInvites.length + visibleEventInvites.length > 0;

  return (
    <section
      aria-labelledby='needs-response-title'
      className='rounded-3xl border border-red-200/70 bg-red-50/60 p-4 dark:border-red-900/40 dark:bg-red-950/20 md:p-5'
    >
      <div className='mb-3 flex items-center justify-between gap-3'>
        <div className='flex min-w-0 items-center gap-2'>
          <span className='h-2 w-2 shrink-0 rounded-full bg-red-500' aria-hidden />
          <h2
            id='needs-response-title'
            className='text-base font-semibold text-gray-900 dark:text-neutral-100 sm:text-lg'
          >
            Needs your response
          </h2>
          {totalCount > 0 && (
            <span className='rounded-full bg-red-600 px-2 py-0.5 text-xs font-semibold text-white dark:bg-red-500'>
              {totalCount}
            </span>
          )}
        </div>
        {eventInvites.length > 0 && (
          <Button
            variant='ghost'
            size='sm'
            onClick={() => setShowInvitesSheet(true)}
            className='shrink-0 text-gray-700 hover:bg-red-100/70 dark:text-neutral-300 dark:hover:bg-red-950/40'
          >
            See all
            <ArrowRight />
          </Button>
        )}
      </div>

      {(cohostInvitesError || eventInvitesError) && (
        <div className={cn('space-y-2', hasCards && 'mb-3')}>
          {cohostInvitesError && (
            <SectionErrorNote
              title='Cohost invitations are temporarily unavailable.'
              message={cohostInvitesError}
            />
          )}
          {eventInvitesError && (
            <SectionErrorNote
              title='Event invites are temporarily unavailable.'
              message={eventInvitesError}
            />
          )}
        </div>
      )}

      {hasCards && (
        <div className='no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-1 md:mx-0 md:grid md:grid-cols-2 md:overflow-visible md:px-0 md:pb-0 xl:grid-cols-3'>
          {visibleCohostInvites.map((invite) => (
            <div key={`cohost-${invite.id}`} className={INVITE_SLOT_CLASS}>
              <CohostInviteResponseCard invite={invite} />
            </div>
          ))}
          {visibleEventInvites.map((invite) => (
            <div key={`event-${invite.id}`} className={INVITE_SLOT_CLASS}>
              <EventInviteResponseCard
                invite={invite}
                onOpen={() => setDetailInvite(invite)}
                onRSVP={() => setRsvpEventId(invite.event_id)}
              />
            </div>
          ))}
        </div>
      )}

      <EventInvitesSheet
        showInvitesSheet={showInvitesSheet}
        setShowInvitesSheet={setShowInvitesSheet}
        handleRSVP={setRsvpEventId}
        pendingInvites={eventInvites}
        pendingTotalCount={eventInvitesTotalCount}
      />

      <EventInviteDetailSheet
        invite={detailInvite}
        isOpen={detailInvite !== null}
        onClose={() => setDetailInvite(null)}
        onRSVP={() => detailInvite && setRsvpEventId(detailInvite.event_id)}
      />

      {rsvpEventId && (
        <EventRSVPSheet eventId={rsvpEventId} isOpen onClose={() => setRsvpEventId(null)} />
      )}
    </section>
  );
}

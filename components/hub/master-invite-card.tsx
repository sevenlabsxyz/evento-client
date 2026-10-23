'use client';

import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { EventInvite } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { formatEventDateFromParts } from '@/lib/utils/date';
import { getEventCoverDisplayUrl, isGif } from '@/lib/utils/image';
import { formatDistanceToNowStrict } from 'date-fns';
import { Check, MapPin, Users, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface MasterInviteCardProps {
  invite: EventInvite;
  onRSVP?: () => void;
  className?: string;
}

export function MasterInviteCard({ invite, onRSVP, className }: MasterInviteCardProps) {
  const router = useRouter();
  const event = invite.events;

  const { timeWithTz: eventTimeWithTz } = formatEventDateFromParts({
    year: event.start_date_year,
    month: event.start_date_month,
    day: event.start_date_day,
    hours: event.start_date_hours,
    minutes: event.start_date_minutes,
    timezone: event.timezone,
    fallbackIso: event.computed_start_date,
  });

  // Get relative time for when invite was sent (short format)
  const invitedAgo = formatDistanceToNowStrict(new Date(invite.created_at), { addSuffix: true })
    .replace(' seconds', 's')
    .replace(' second', 's')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' days', 'd')
    .replace(' day', 'd')
    .replace(' weeks', 'w')
    .replace(' week', 'w')
    .replace(' months', 'mo')
    .replace(' month', 'mo')
    .replace(' years', 'y')
    .replace(' year', 'y');

  // Get inviter info (event creator)
  const inviter = event.user_details;

  const handleViewEvent = () => {
    router.push(`/e/${invite.event_id}`);
  };

  // Get cover image
  const coverImage =
    event.cover && isGif(event.cover) ? event.cover : getEventCoverDisplayUrl(event.cover, 'feed');

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-4 dark:border-neutral-800 dark:bg-neutral-950',
        className
      )}
    >
      {/* Top Section: Content + Image */}
      <div className='flex items-start gap-4'>
        {/* Left Content */}
        <div className='flex min-w-0 flex-1 flex-col gap-1'>
          {/* Invited By Row */}
          <div className='flex min-w-0 items-center gap-1.5'>
            <UserAvatar
              user={{
                name: inviter.name || undefined,
                username: inviter.username || undefined,
                image: inviter.image || undefined,
                verification_status: inviter.verification_status || null,
              }}
              size='xs'
            />
            <span className='truncate text-sm text-gray-600 dark:text-neutral-400'>
              {inviter.name || inviter.username}
            </span>
            <span className='shrink-0 text-gray-400 dark:text-neutral-500'>·</span>
            <span className='shrink-0 text-sm text-gray-500 dark:text-neutral-400'>
              {invitedAgo}
            </span>
          </div>

          {/* Event Title */}
          <h3 className='text-lg font-bold leading-tight text-gray-900 dark:text-neutral-100'>
            {event.title}
          </h3>

          {/* Time Row */}
          <div className='flex items-center gap-1 text-sm'>
            <span className='font-medium text-amber-600 dark:text-amber-400'>
              {eventTimeWithTz}
            </span>
          </div>

          {/* Location */}
          {event.location && (
            <div className='flex items-center gap-1 text-sm text-gray-600 dark:text-neutral-400'>
              <MapPin className='h-3.5 w-3.5 shrink-0' />
              <span className='truncate'>{event.location}</span>
            </div>
          )}

          {/* Invite Message */}
          {invite.message && (
            <p className='mt-1 line-clamp-2 text-sm italic text-gray-500 dark:text-neutral-400'>
              &quot;{invite.message}&quot;
            </p>
          )}
        </div>

        {/* Right Image */}
        {coverImage && (
          <div className='shrink-0'>
            <img src={coverImage} alt={event.title} className='h-24 w-24 rounded-xl object-cover' />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {invite.status === 'pending' ? (
        <div className='flex flex-col gap-2'>
          <Button
            onClick={onRSVP}
            className='w-full rounded-full bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
          >
            <Users className='mr-1.5 h-4 w-4' />
            RSVP
          </Button>
          <Button variant='outline' onClick={handleViewEvent} className='w-full rounded-full'>
            View Event
          </Button>
        </div>
      ) : (
        <div className='flex items-center justify-between'>
          <span
            className={cn(
              'inline-flex items-center rounded-full px-3 py-1 text-sm font-medium',
              invite.response === 'going' &&
                'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-400',
              invite.response === 'maybe' &&
                'bg-yellow-100 text-yellow-800 dark:bg-yellow-950/60 dark:text-yellow-400',
              invite.response === 'not_going' &&
                'bg-red-100 text-red-800 dark:bg-red-950/60 dark:text-red-400'
            )}
          >
            {invite.response === 'going' && <Check className='mr-1 h-3 w-3' />}
            {invite.response === 'not_going' && <X className='mr-1 h-3 w-3' />}
            {invite.response === 'going'
              ? 'Going'
              : invite.response === 'maybe'
                ? 'Maybe'
                : 'Not Going'}
          </span>
          <Button size='sm' variant='outline' onClick={handleViewEvent}>
            View Event
          </Button>
        </div>
      )}
    </div>
  );
}

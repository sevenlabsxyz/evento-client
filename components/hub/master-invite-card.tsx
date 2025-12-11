'use client';

import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { EventInvite } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { formatEventDate } from '@/lib/utils/date';
import { getOptimizedCoverUrl, isGif } from '@/lib/utils/image';
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

  // Get local time (user's browser timezone)
  const localTime = new Date(event.computed_start_date).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Get event time with timezone
  const { timeWithTz: eventTimeWithTz } = formatEventDate(
    event.computed_start_date,
    event.timezone
  );

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
  const coverImage = event.cover
    ? isGif(event.cover)
      ? event.cover
      : getOptimizedCoverUrl(event.cover, 'feed')
    : null;

  return (
    <div
      className={cn(
        'flex w-full flex-col gap-3 rounded-3xl border border-gray-200 bg-gray-50 p-4',
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
            <span className='truncate text-sm text-gray-600'>
              {inviter.name || inviter.username}
            </span>
            <span className='shrink-0 text-gray-400'>·</span>
            <span className='shrink-0 text-sm text-gray-500'>{invitedAgo}</span>
          </div>

          {/* Event Title */}
          <h3 className='text-lg font-bold leading-tight text-gray-900'>{event.title}</h3>

          {/* Time Row */}
          <div className='flex items-center gap-1 text-sm'>
            <span className='text-gray-500'>{localTime}</span>
            <span className='text-gray-400'>·</span>
            <span className='font-medium text-amber-600'>{eventTimeWithTz}</span>
          </div>

          {/* Location */}
          {event.location && (
            <div className='flex items-center gap-1 text-sm text-gray-600'>
              <MapPin className='h-3.5 w-3.5 shrink-0' />
              <span className='truncate'>{event.location}</span>
            </div>
          )}

          {/* Invite Message */}
          {invite.message && (
            <p className='mt-1 line-clamp-2 text-sm italic text-gray-500'>
              &quot;{invite.message}&quot;
            </p>
          )}
        </div>

        {/* Right Image */}
        {coverImage && (
          <div className='shrink-0'>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverImage} alt={event.title} className='h-24 w-24 rounded-xl object-cover' />
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {invite.status === 'pending' ? (
        <div className='flex flex-col gap-2'>
          <Button
            onClick={onRSVP}
            className='w-full rounded-full bg-red-500 text-white hover:bg-red-600'
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
              invite.response === 'going' && 'bg-green-100 text-green-800',
              invite.response === 'maybe' && 'bg-yellow-100 text-yellow-800',
              invite.response === 'not_going' && 'bg-red-100 text-red-800'
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

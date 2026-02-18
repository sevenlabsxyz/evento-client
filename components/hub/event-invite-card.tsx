import { EventInvite } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { formatEventDate } from '@/lib/utils/date';
import { transformApiEventToDisplay } from '@/lib/utils/event-transform';
import { Check, Clock, Eye, MapPin, Users, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { UserAvatar } from '../ui/user-avatar';

interface EventInviteCardProps {
  invite: EventInvite;
  onRSVP?: () => void;
  className?: string;
}

export function EventInviteCard({ invite, onRSVP, className }: EventInviteCardProps) {
  const router = useRouter();
  const { shortDate: eventDate, time: eventTime } = formatEventDate(
    invite.events.computed_start_date
  );

  const event = transformApiEventToDisplay(invite.events, [], []);

  const handleViewEvent = () => {
    router.push(`/e/${invite.event_id}`);
  };

  return (
    <div
      className={cn(
        'flex-shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm',
        className
      )}
    >
      {/* Event Image */}
      {event.coverImages.length > 0 && (
        <div className='relative h-32 w-full'>
          <Image src={event.coverImages[0]} alt={event.title} fill className='object-cover' />
        </div>
      )}

      <div className='p-4'>
        <div className='mb-3 flex items-center gap-3'>
          <UserAvatar
            user={{
              name: event.hosts[0].name,
              username: event.hosts[0].username,
              image: event.hosts[0].avatar,
            }}
            size='sm'
          />
          <div className='min-w-0 flex-1'>
            <p className='text-sm font-medium text-gray-900'>{event.hosts[0].name}</p>
            <p className='text-xs text-gray-500'>invited you</p>
          </div>
          <div className='text-right'>
            <div className='text-sm font-medium text-gray-900'>{eventDate}</div>
            <div className='text-xs text-gray-500'>
              <Clock className='mr-1 inline h-3 w-3' />
              {eventTime}
            </div>
          </div>
        </div>

        <div className='mb-3'>
          <h3 className='mb-1 line-clamp-2 font-semibold text-gray-900'>{event.title}</h3>
          <div
            className={cn(
              'mb-2 flex items-center text-sm text-gray-500',
              invite.events.location ? '' : 'text-gray-400'
            )}
          >
            <MapPin className='mr-1 h-3 w-3' />
            <span className='line-clamp-1'>{invite.events.location || 'TBD'}</span>
          </div>
          {invite.message && (
            <p className='line-clamp-2 text-sm text-gray-600'>&quot;{invite.message}&quot;</p>
          )}
        </div>

        {invite.status === 'pending' && (
          <div className='flex gap-2'>
            <Button
              size='sm'
              onClick={onRSVP}
              className='flex-1 bg-red-500 text-white hover:bg-red-600'
            >
              <Users className='mr-1 h-4 w-4' />
              RSVP
            </Button>
            <Button size='sm' variant='outline' onClick={handleViewEvent} className='flex-1'>
              <Eye className='mr-1 h-4 w-4' />
              View
            </Button>
          </div>
        )}

        {invite.status === 'responded' && invite.response && (
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
            <Button size='sm' variant='outline' onClick={handleViewEvent} className='ml-2'>
              <Eye className='mr-1 h-4 w-4' />
              View
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

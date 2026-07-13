'use client';

import { EventWithUser } from '@/lib/types/api';
import { formatEventDateFromParts } from '@/lib/utils/date';
import { getEventCoverDisplayUrl } from '@/lib/utils/image';
import {
  Calendar,
  ChevronRight,
  Clock,
  Loader,
  MapPin,
  MoreHorizontal,
  Pin,
  PinOff,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { KeyboardEvent } from 'react';
import { Button } from './ui/button';
import { UserAvatar } from './ui/user-avatar';

interface EventCompactItemProps {
  event: EventWithUser;
  variant?: 'default' | 'sub-event';
  onBookmark?: (eventId: string) => void;
  isBookmarked?: boolean;
  isPinning?: boolean;
  isPinned?: boolean;
  canPin?: boolean;
  onPin?: (eventId: string, isPinned: boolean) => void;
  onMenuClick?: (eventId: string) => void;
}

export function EventCompactItem({
  event,
  variant = 'default',
  onBookmark,
  isBookmarked = false,
  isPinning = false,
  isPinned = false,
  canPin = false,
  onPin,
  onMenuClick,
}: EventCompactItemProps) {
  const router = useRouter();
  const { date, timeWithTz } = formatEventDateFromParts({
    year: event.start_date_year,
    month: event.start_date_month,
    day: event.start_date_day,
    hours: event.start_date_hours,
    minutes: event.start_date_minutes,
    timezone: event.timezone,
    fallbackIso: event.computed_start_date,
  });

  const handleEventClick = () => {
    router.push(`/e/${event.id}`);
  };

  const handleEventKeyDown = (keyboardEvent: KeyboardEvent<HTMLDivElement>) => {
    if (variant === 'sub-event' && (keyboardEvent.key === 'Enter' || keyboardEvent.key === ' ')) {
      keyboardEvent.preventDefault();
      handleEventClick();
    }
  };

  return (
    <div
      className='group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
      role={variant === 'sub-event' ? 'link' : undefined}
      tabIndex={variant === 'sub-event' ? 0 : undefined}
      aria-label={variant === 'sub-event' ? `View ${event.title}` : undefined}
      onClick={handleEventClick}
      onKeyDown={handleEventKeyDown}
    >
      {/* Event thumbnail */}
      <div className='h-14 w-14 overflow-hidden rounded-md'>
        <img
          src={getEventCoverDisplayUrl(event.cover, 'feed')}
          alt={event.title}
          className='h-full w-full object-cover'
        />
      </div>

      {/* Event details */}
      <div className='min-w-0 flex-1'>
        <div className='flex items-center justify-between'>
          <h4
            className={
              variant === 'sub-event'
                ? 'line-clamp-2 min-w-0 flex-1 font-medium leading-snug text-gray-900'
                : 'line-clamp-1 font-medium text-gray-900'
            }
          >
            {event.title}
          </h4>
          <div className='flex items-center'>
            {canPin && (
              <Button
                variant='ghost'
                size='icon'
                className='h-7 w-7 rounded-full bg-transparent p-0 text-gray-400 hover:text-gray-500'
                onClick={(e) => {
                  e.stopPropagation();
                  onPin?.(event.id, isPinned);
                }}
              >
                {isPinning ? (
                  <Loader className='h-4 w-4 animate-spin text-gray-900' />
                ) : isPinned ? (
                  <PinOff className='h-4 w-4 text-gray-900' />
                ) : (
                  <Pin className='h-4 w-4' />
                )}
              </Button>
            )}
            {/* <Button
              variant='ghost'
              size='icon'
              className='h-7 w-7 rounded-full bg-transparent p-0 text-gray-400 hover:text-gray-500'
              onClick={(e) => {
                e.stopPropagation();
                onBookmark?.(event.id);
              }}
            >
              <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current text-red-600' : ''}`} />
            </Button> */}
          </div>
        </div>

        <div className='mt-1 flex items-center text-xs text-gray-500'>
          <div className='mr-2 flex w-fit items-center'>
            <Calendar className='mr-1 h-3 w-3' />
            <span className='w-max'>{date}</span>
          </div>
          <div className='mr-2 flex items-center'>
            <Clock className='mr-1 h-3 w-3' />
            <span className='line-clamp-1'>{timeWithTz?.split(' ')[0] || '--:--'}</span>
          </div>
          {variant !== 'sub-event' && (
            <div className='flex items-center'>
              <MapPin className='mr-1 h-3 w-3' />
              <span className='line-clamp-1'>{event.location}</span>
            </div>
          )}
        </div>

        {/* User details */}
        {variant !== 'sub-event' && (
          <div className='mt-1 flex items-center gap-1'>
            <UserAvatar
              user={{
                name: event.user_details.name || undefined,
                username: event.user_details.username || undefined,
                image: event.user_details.image || undefined,
                verification_status: event.user_details.verification_status || null,
              }}
              size='xs'
            />
            {/* <img
              src={
                event.user_details.image
                  ? getOptimizedAvatarUrl(event.user_details.image)
                  : '/assets/img/evento-sublogo.svg'
              }
              alt={event.user_details.name || event.user_details.username}
              className='mr-1.5 h-4 w-4 rounded-full border border-gray-200 object-cover'
            /> */}
            <span className='text-xs text-gray-500'>@{event.user_details.username}</span>
          </div>
        )}
      </div>

      {variant === 'sub-event' ? (
        <ChevronRight
          aria-hidden='true'
          className='h-5 w-5 shrink-0 text-gray-400 transition-colors group-hover:text-gray-600'
        />
      ) : (
        <Button
          variant='ghost'
          size='icon'
          className='h-7 w-7 rounded-full bg-transparent p-0 text-gray-400 hover:text-gray-500'
          onClick={(e) => {
            e.stopPropagation();
            onMenuClick?.(event.id);
          }}
        >
          <MoreHorizontal className='h-4 w-4' />
        </Button>
      )}
    </div>
  );
}

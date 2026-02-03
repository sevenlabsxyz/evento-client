'use client';

import { EventWithUser } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { formatEventDate } from '@/lib/utils/date';
import { getOptimizedCoverUrl, isGif } from '@/lib/utils/image';
import { MapPin } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useRef } from 'react';
import { UserAvatar } from './ui/user-avatar';

interface MasterEventCardProps {
  event: EventWithUser;
  className?: string;
  onClick?: () => void;
  onLongPress?: () => void;
}

export function MasterEventCard({ event, className, onClick, onLongPress }: MasterEventCardProps) {
  const router = useRouter();

  // Get event time with timezone
  const { timeWithTz: eventTimeWithTz } = formatEventDate(
    event.computed_start_date,
    event.timezone
  );

  // Price display
  const showPrice = event.cost && Number(event.cost) > 0 ? true : false;
  const priceDisplay = showPrice ? `$${Number(event.cost)}` : null;

  // Capacity display (placeholder - needs actual RSVP count data)
  const showCapacity = event.max_capacity && event.show_capacity_count;

  // Long press handling
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const isLongPress = useRef(false);

  const handleTouchStart = () => {
    if (!onLongPress) return;
    isLongPress.current = false;
    longPressTimer.current = setTimeout(() => {
      isLongPress.current = true;
      onLongPress();
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleClick = () => {
    if (isLongPress.current) {
      isLongPress.current = false;
      return;
    }
    if (onClick) {
      onClick();
    } else {
      router.push(`/e/${event.id}`);
    }
  };

  return (
    <button
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchEnd}
      onContextMenu={(e) => {
        if (onLongPress) {
          e.preventDefault();
          onLongPress();
        }
      }}
      className={cn(
        'flex w-full items-start gap-4 rounded-3xl border border-gray-200 bg-gray-50 p-4 text-left transition-colors hover:bg-gray-100',
        className
      )}
    >
      {/* Left Content */}
      <div className='flex min-w-0 flex-1 flex-col gap-1'>
        {/* Time Row */}
        <div className='flex items-center gap-1 text-sm'>
          <span className='font-medium text-red-500'>{eventTimeWithTz}</span>
        </div>

        {/* Title */}
        <h3 className='py-1 text-lg font-bold leading-tight text-gray-900'>{event.title}</h3>

        {/* Host */}
        <div className='flex items-center gap-2'>
          <UserAvatar
            user={{
              name: event.user_details.name || undefined,
              username: event.user_details.username || undefined,
              image: event.user_details.image || undefined,
              verification_status: event.user_details.verification_status || null,
            }}
            size='xs'
          />
          <span className='text-sm text-gray-600'>
            by{' '}
            <span className='font-semibold'>
              @{event.user_details.name || event.user_details.username}
            </span>
          </span>
        </div>

        {/* Location */}
        {event.location && (
          <div className='flex items-center gap-1 py-1 text-sm text-gray-600'>
            <MapPin className='mx-0.5 h-4 w-4 shrink-0' />
            <span className='truncate'>{event.location}</span>
          </div>
        )}

        {/* Optional Badges Row */}
        {(showCapacity || showPrice) && (
          <div className='mt-1 flex items-center gap-2'>
            {showCapacity && (
              <span className='rounded-full border border-amber-500 px-2.5 py-0.5 text-xs font-semibold text-amber-600'>
                Near Capacity
              </span>
            )}
            {showPrice && priceDisplay && (
              <span className='rounded-full border border-green-500 px-2.5 py-0.5 text-xs font-semibold text-green-600'>
                {priceDisplay}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Right Image */}
      <div className='shrink-0'>
        <Image
          src={
            event.cover && isGif(event.cover)
              ? event.cover
              : getOptimizedCoverUrl(event.cover || '', 'thumbnail')
          }
          alt={event.title}
          width={96}
          height={96}
          className='h-24 w-24 rounded-xl border border-gray-200 object-cover'
        />
      </div>
    </button>
  );
}

'use client';

import { EventWithUser } from '@/lib/types/api';
import { formatEventDate } from '@/lib/utils/date';
import { getOptimizedAvatarUrl, getOptimizedCoverUrl } from '@/lib/utils/image';
import { toast } from '@/lib/utils/toast';
import {
  Bookmark,
  Calendar,
  Loader,
  MapPin,
  MoreHorizontal,
  Pin,
  PinOff,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ReusableDropdown } from './reusable-dropdown';
import { Button } from './ui/button';

interface EventCompactItemProps {
  event: EventWithUser;
  onBookmark?: (eventId: string) => void;
  isBookmarked?: boolean;
  isPinning?: boolean;
  isPinned?: boolean;
  canPin?: boolean;
  onPin?: (eventId: string, isPinned: boolean) => void;
}

export function EventCompactItem({
  event,
  onBookmark,
  isBookmarked = false,
  isPinning = false,
  isPinned = false,
  canPin = false,
  onPin,
}: EventCompactItemProps) {
  const router = useRouter();
  const { date, timeWithTz } = formatEventDate(
    event.computed_start_date,
    event.timezone
  );

  const handleEventClick = () => {
    router.push(`/e/${event.id}`);
  };

  const getDropdownItems = (eventId: string, userUsername: string) => [
    {
      label: 'Share Event',
      icon: <span className="h-4 w-4">🔗</span>,
      action: async () => {
        const eventUrl = `${window.location.origin}/e/${eventId}`;
        if (navigator.share) {
          try {
            await navigator.share({
              title: event.title,
              text: `Check out this event: ${event.title}`,
              url: eventUrl,
            });
          } catch (error: any) {
            if (error.name !== 'AbortError') {
              navigator.clipboard.writeText(eventUrl);
              toast.success('Link copied to clipboard!');
            }
          }
        } else {
          navigator.clipboard.writeText(eventUrl);
          toast.success('Link copied to clipboard!');
        }
      },
    },
    {
      label: 'View Profile',
      icon: <span className="h-4 w-4">👤</span>,
      action: () => {
        router.push(`/${userUsername}`);
      },
    },
  ];

  return (
    <div
      className="flex cursor-pointer items-center gap-3 rounded-lg p-2 transition-colors hover:bg-gray-50"
      onClick={handleEventClick}
    >
      {/* Time column */}
      <div className="flex w-16 min-w-[64px] flex-col items-center justify-center">
        <div className="text-xs text-gray-500">
          {timeWithTz?.split(' ')[0] || '--:--'}
        </div>
      </div>

      {/* Event thumbnail */}
      <div className="h-14 w-14 overflow-hidden rounded-md">
        <img
          src={getOptimizedCoverUrl(event.cover || '', 'feed')}
          alt={event.title}
          className="h-full w-full object-cover"
        />
      </div>

      {/* Event details */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <h4 className="line-clamp-1 font-medium text-gray-900">
            {event.title}
          </h4>
          <div className="flex items-center">
            {canPin && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 rounded-full bg-transparent p-0 text-gray-400 hover:text-gray-500"
                onClick={(e) => {
                  e.stopPropagation();
                  onPin?.(event.id, isPinned);
                }}
              >
                {isPinning ? (
                  <Loader className="h-4 w-4 animate-spin text-gray-900" />
                ) : isPinned ? (
                  <PinOff className="h-4 w-4 text-gray-900" />
                ) : (
                  <Pin className="h-4 w-4" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-full bg-transparent p-0 text-gray-400 hover:text-gray-500"
              onClick={(e) => {
                e.stopPropagation();
                onBookmark?.(event.id);
              }}
            >
              <Bookmark
                className={`h-4 w-4 ${
                  isBookmarked ? 'fill-current text-red-600' : ''
                }`}
              />
            </Button>
            <ReusableDropdown
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 rounded-full bg-transparent p-0 text-gray-400 hover:text-gray-500"
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              }
              items={getDropdownItems(event.id, event.user_details?.username)}
              align="right"
              width="w-48"
            />
          </div>
        </div>

        <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
          <div className="flex w-fit items-center">
            <Calendar className="mr-1 h-3 w-3" />
            <span>{date}</span>
          </div>
          {event.location && (
            <div className="flex flex-1 items-center">
              <MapPin className="mr-1 h-3 w-3" />
              <span className="line-clamp-1">{event.location}</span>
            </div>
          )}
        </div>

        {/* User details */}
        {event.user_details && (
          <div className="mt-1 flex items-center">
            <img
              src={
                event.user_details.image
                  ? getOptimizedAvatarUrl(event.user_details.image)
                  : '/assets/img/evento-sublogo.svg'
              }
              alt={event.user_details.name || event.user_details.username}
              className="mr-1.5 h-4 w-4 rounded-full border border-gray-200 object-cover"
            />
            <span className="text-xs text-gray-500">
              @{event.user_details.username}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

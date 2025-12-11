'use client';

import { Button } from '@/components/ui/button';
import DetachedMenuSheet, { MenuOption } from '@/components/ui/detached-menu-sheet';
import { EventWithUser } from '@/lib/types/api';
import { cn } from '@/lib/utils';
import { htmlToPlainText } from '@/lib/utils/content';
import { formatEventDate, getRelativeTime } from '@/lib/utils/date';
import { getOptimizedCoverUrl, isGif } from '@/lib/utils/image';
import { toast } from '@/lib/utils/toast';
import {
  Bookmark,
  Calendar,
  Clock,
  Copy,
  Heart,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  Send,
  Share,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { UserAvatar } from './ui/user-avatar';

interface EventCardProps {
  event: EventWithUser;
  onBookmark?: (eventId: string) => void;
  isBookmarked?: boolean;
  className?: string;
  customMenuOptions?: MenuOption[];
  onMenuClick?: (eventId: string) => void;
}

export function EventCard({
  event,
  onBookmark,
  isBookmarked = false,
  className,
  customMenuOptions,
  onMenuClick,
}: EventCardProps) {
  const router = useRouter();
  const { date, timeWithTz } = formatEventDate(event.computed_start_date, event.timezone);
  const timeAgo = getRelativeTime(event.created_at);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getMenuOptions = (eventId: string, userUsername: string) => [
    {
      id: 'share',
      label: 'Share Event',
      icon: Share,
      onClick: async () => {
        const eventUrl = `${window.location.origin}/e/${eventId}`;
        try {
          if (navigator.share) {
            await navigator.share({
              title: event.title,
              text: `Check out this event: ${event.title}`,
              url: eventUrl,
            });
          } else {
            navigator.clipboard.writeText(eventUrl);
            toast.success('Link copied to clipboard!');
          }
        } catch (error: any) {
          if (error?.name !== 'AbortError') {
            navigator.clipboard.writeText(eventUrl);
            toast.success('Link copied to clipboard!');
          }
        } finally {
          setIsMenuOpen(false);
        }
      },
    },
    {
      id: 'copy',
      label: 'Copy Link',
      icon: Copy,
      onClick: () => {
        navigator.clipboard.writeText(`${window.location.origin}/e/${eventId}`);
        toast.success('Link copied to clipboard!');
        setIsMenuOpen(false);
      },
    },
    {
      id: 'profile',
      label: 'View Profile',
      icon: User,
      onClick: () => {
        router.push(`/${userUsername}`);
        setIsMenuOpen(false);
      },
    },
  ];

  const handleEventClick = () => {
    router.push(`/e/${event.id}`);
  };

  return (
    <div className={cn('bg-white', className)}>
      {/* Post Header */}
      <div className='flex items-center justify-between px-4 py-3'>
        <div className='flex items-center gap-3'>
          <UserAvatar
            user={{
              name: event.user_details.name || undefined,
              username: event.user_details.username || undefined,
              image: event.user_details.image || undefined,
              verification_status: event.user_details.verification_status || null,
            }}
            size='sm'
          />
          <div>
            <p className='text-sm font-semibold'>
              {event.user_details.name || event.user_details.username}
            </p>
            <p className='text-xs text-gray-500'>
              Posted by @{event.user_details.username} {timeAgo}
            </p>
          </div>
        </div>
        <div>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 rounded-full bg-gray-100'
            onClick={() => {
              if (customMenuOptions && onMenuClick) {
                onMenuClick(event.id);
              } else {
                setIsMenuOpen(true);
              }
            }}
          >
            <MoreHorizontal className='h-4 w-4' />
          </Button>
          {!customMenuOptions && isMenuOpen && (
            <DetachedMenuSheet
              isOpen={isMenuOpen}
              onClose={() => setIsMenuOpen(false)}
              options={getMenuOptions(event.id, event.user_details.username)}
            />
          )}
        </div>
      </div>

      {/* Event Image - Square aspect ratio */}
      <div className='relative'>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={
            event.cover && isGif(event.cover)
              ? event.cover
              : getOptimizedCoverUrl(event.cover || '', 'feed')
          }
          alt={event.title}
          className='mx-auto aspect-square w-[calc(94%)] cursor-pointer rounded-2xl object-cover shadow-md'
          onClick={handleEventClick}
        />
      </div>

      {/* Event Details */}
      <div className='px-4 py-3'>
        <h3
          className='mb-2 cursor-pointer text-xl font-semibold transition-colors hover:text-red-600'
          onClick={handleEventClick}
        >
          {event.title}
        </h3>

        {/* Date, Time, Location */}
        <div className='mb-3 flex items-center gap-4 text-base text-gray-500'>
          <div className='flex items-center gap-1'>
            <Calendar className='h-4 w-4' />
            <span>{date}</span>
          </div>
          {timeWithTz && (
            <div className='flex items-center gap-1'>
              <Clock className='h-4 w-4' />
              <span>{timeWithTz}</span>
            </div>
          )}
        </div>

        {event.location && (
          <div className='mb-4 flex items-center gap-1 text-sm text-gray-600'>
            <MapPin className='h-4 w-4' />
            <span>{event.location}</span>
          </div>
        )}

        {/* Event Description (if exists) */}
        {event.description && (
          <p className='mb-4 line-clamp-3 text-sm text-gray-700'>
            {htmlToPlainText(event.description)}
          </p>
        )}

        {/* Post Actions - All on left side */}
        <div className='mb-3 flex items-center gap-4'>
          <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full bg-gray-100 p-0'>
            <Heart className='h-5 w-5' />
          </Button>
          <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full bg-gray-100 p-0'>
            <MessageCircle className='h-5 w-5' />
          </Button>
          <Button variant='ghost' size='icon' className='h-8 w-8 rounded-full bg-gray-100 p-0'>
            <Send className='h-5 w-5' />
          </Button>
          <Button
            variant='ghost'
            size='icon'
            className='h-8 w-8 rounded-full bg-gray-100 p-0'
            onClick={() => onBookmark?.(event.id)}
          >
            <Bookmark className={`h-5 w-5 ${isBookmarked ? 'fill-current text-red-600' : ''}`} />
          </Button>
        </div>
      </div>
    </div>
  );
}

'use client';

import { UINotification } from '@/lib/types/notifications';
import { cn } from '@/lib/utils';
import { formatDistance } from 'date-fns';
import { CheckCheck, Clock, MessageCircle, Star, Trash2, User } from 'lucide-react';
import { useState } from 'react';

interface NotificationItemProps {
  notification: UINotification;
  onRead: (id: string) => void;
  onArchive: (id: string) => void;
  onNavigate?: (notification: UINotification) => void;
  selected?: boolean;
  onSelect?: (id: string, selected: boolean) => void;
  showCheckbox?: boolean;
}

export function NotificationItem({
  notification,
  onRead,
  onArchive,
  onNavigate,
  selected = false,
  onSelect,
  showCheckbox = false,
}: NotificationItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const timeAgo = formatDistance(notification.original.created_at, new Date(), { addSuffix: true });

  const handleClick = () => {
    if (notification.status === 'unseen') {
      onRead(notification.id);
    }
    if (onNavigate) {
      onNavigate(notification);
    }
  };

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSelect) {
      onSelect(notification.id, !selected);
    }
  };

  const handleArchive = (e: React.MouseEvent) => {
    e.stopPropagation();
    onArchive(notification.id);
  };

  const handleMarkRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRead(notification.id);
  };

  // Determine category icon
  const CategoryIcon = () => {
    switch (notification.category) {
      case 'event_invite':
        return <Star className='h-5 w-5 text-yellow-500' />;
      case 'event_comment':
        return <MessageCircle className='h-5 w-5 text-blue-500' />;
      case 'event_rsvp':
        return <Clock className='h-5 w-5 text-green-500' />;
      case 'user_follow':
        return <User className='h-5 w-5 text-purple-500' />;
      default:
        return <Clock className='h-5 w-5 text-gray-500' />;
    }
  };

  return (
    <div
      className={cn(
        'relative flex cursor-pointer flex-col gap-2 border-b border-gray-100 px-4 py-3 transition-colors',
        notification.status === 'unseen' || notification.status === 'seen'
          ? 'bg-blue-50/30'
          : 'bg-white',
        isHovered ? 'bg-gray-50' : '',
        selected ? 'bg-blue-100/50' : ''
      )}
      onClick={handleClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          {showCheckbox && (
            <div
              className={cn(
                'flex h-5 w-5 items-center justify-center rounded border border-gray-300',
                selected ? 'border-blue-500 bg-blue-500 text-white' : 'bg-white'
              )}
              onClick={handleSelect}
            >
              {selected && <CheckCheck className='h-3.5 w-3.5' />}
            </div>
          )}
          <div className='flex h-10 w-10 items-center justify-center rounded-full bg-gray-100'>
            <CategoryIcon />
          </div>
          <div className='flex flex-col'>
            <h3 className='font-medium text-gray-900'>{notification.title}</h3>
            <span className='text-xs text-gray-500'>{timeAgo}</span>
          </div>
        </div>

        {/* Status indicator */}
        {notification.status === 'unseen' && (
          <div className='h-2.5 w-2.5 rounded-full bg-blue-500'></div>
        )}
      </div>

      {/* Notification content */}
      <p className='pl-[52px] text-sm text-gray-600'>{notification.content}</p>

      {/* Action buttons visible on hover */}
      {isHovered && (
        <div className='absolute right-4 top-3 flex items-center gap-2'>
          <button
            onClick={handleMarkRead}
            className='rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100'
            aria-label={notification.status === 'read' ? 'Mark as unread' : 'Mark as read'}
            title={notification.status === 'read' ? 'Mark as unread' : 'Mark as read'}
          >
            <CheckCheck className='h-4 w-4' />
          </button>
          <button
            onClick={handleArchive}
            className='rounded p-1.5 text-gray-500 transition-colors hover:bg-gray-100'
            aria-label='Archive'
            title='Archive'
          >
            <Trash2 className='h-4 w-4' />
          </button>
        </div>
      )}
    </div>
  );
}

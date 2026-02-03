'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { UINotification } from '@/lib/types/notifications';
import { Inbox } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../ui/button';
import { NotificationItem } from './notification-item';

interface NotificationListProps {
  notifications: UINotification[];
  isLoading: boolean;
  isError: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
  onRead: (id: string) => void;
  onArchive: (id: string) => void;
  onNavigate?: (notification: UINotification) => void;
  showCheckboxes?: boolean;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
}

export function NotificationList({
  notifications,
  isLoading,
  isError,
  hasMore,
  onLoadMore,
  onRead,
  onArchive,
  onNavigate,
  showCheckboxes = false,
  selectedIds,
  onSelectionChange,
}: NotificationListProps) {
  const loaderRef = useRef<HTMLDivElement>(null);
  const [initialLoad, setInitialLoad] = useState(true);

  // Handle selecting/deselecting notifications
  const handleSelect = (id: string, selected: boolean) => {
    if (selected) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
    }
  };

  // Setup intersection observer for infinite scrolling
  useEffect(() => {
    if (isLoading || !hasMore || !loaderRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          onLoadMore();
        }
      },
      { threshold: 0.5 }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [isLoading, hasMore, onLoadMore]);

  // Clear initial load state after first render
  useEffect(() => {
    if (notifications.length > 0 && initialLoad) {
      setInitialLoad(false);
    }
  }, [notifications, initialLoad]);

  // Handle error state
  if (isError) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100'>
          <Inbox className='h-8 w-8 text-red-500' />
        </div>
        <h2 className='mb-2 text-lg font-medium text-gray-900'>Unable to load notifications</h2>
        <p className='mb-4 text-sm text-gray-600'>Please check your connection and try again.</p>
        <Button onClick={() => window.location.reload()} size='sm'>
          Retry
        </Button>
      </div>
    );
  }

  // Handle empty state
  if (!isLoading && notifications.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center py-16 text-center'>
        <div className='mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100'>
          <Inbox className='h-8 w-8 text-gray-400' />
        </div>
        <h2 className='mb-2 text-lg font-medium text-gray-900'>You're all caught up!</h2>
        <p className='text-sm text-gray-600'>No new notifications at the moment.</p>
      </div>
    );
  }

  return (
    <div className='flex flex-col divide-y divide-gray-100'>
      {/* Initial loading state */}
      {isLoading && initialLoad ? (
        <>
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className='p-4'>
              <div className='flex items-start gap-3'>
                <Skeleton className='h-10 w-10 rounded-full' />
                <div className='flex-1 space-y-2'>
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-3 w-1/4' />
                  <Skeleton className='h-4 w-full' />
                </div>
              </div>
            </div>
          ))}
        </>
      ) : (
        <>
          {/* Notification list */}
          {notifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              onRead={onRead}
              onArchive={onArchive}
              onNavigate={onNavigate}
              showCheckbox={showCheckboxes}
              selected={selectedIds.includes(notification.id)}
              onSelect={handleSelect}
            />
          ))}

          {/* Load more indicator */}
          {hasMore && (
            <div ref={loaderRef} className='flex justify-center py-4'>
              {isLoading ? (
                <div className='h-6 w-6 animate-spin rounded-full border-2 border-gray-500 border-t-transparent'></div>
              ) : (
                <Button variant='ghost' size='sm' onClick={onLoadMore}>
                  Load more
                </Button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

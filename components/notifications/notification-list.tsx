'use client';

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Inbox } from '@/lib/icons';
import { UINotification } from '@/lib/types/notifications';
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
      <Empty className='py-16'>
        <EmptyHeader>
          <EmptyMedia variant='soft-circle' className='bg-red-100 text-red-500'>
            <Inbox className='h-8 w-8' />
          </EmptyMedia>
          <EmptyTitle className='text-lg sm:text-lg'>Unable to load notifications</EmptyTitle>
          <EmptyDescription>Please check your connection and try again.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => window.location.reload()} size='sm'>
            Retry
          </Button>
        </EmptyContent>
      </Empty>
    );
  }

  // Handle empty state
  if (!isLoading && notifications.length === 0) {
    return (
      <Empty className='py-16'>
        <EmptyHeader>
          <EmptyMedia variant='soft-circle'>
            <Inbox className='h-8 w-8' />
          </EmptyMedia>
          <EmptyTitle className='text-lg sm:text-lg'>You&apos;re all caught up!</EmptyTitle>
          <EmptyDescription>No new notifications at the moment.</EmptyDescription>
        </EmptyHeader>
      </Empty>
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

'use client';

import { Navbar } from '@/components/navbar';
import { NotificationFilters } from '@/components/notifications/notification-filters';
import { NotificationList } from '@/components/notifications/notification-list';
import { Skeleton } from '@/components/ui/skeleton';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import {
  useArchiveNotification,
  useBulkMarkAsRead,
  useMarkAllAsRead,
  useMarkAsRead,
  useNotificationsFeed,
} from '@/lib/hooks/use-notifications';
import { useTopBar } from '@/lib/stores/topbar-store';
import { NotificationFilterParams, UINotification } from '@/lib/types/notifications';
import { isValidRelativePath } from '@/lib/utils/link';
import { toast } from '@/lib/utils/toast';
import { MailOpen, RefreshCw } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export default function InboxPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();
  const pathname = usePathname();
  const router = useRouter();

  // State for filters and pagination
  const [filters, setFilters] = useState<NotificationFilterParams>({
    page_size: 20,
  });
  const [currentTab, setCurrentTab] = useState('all');
  const [showArchived, setShowArchived] = useState(false);
  const [activeTab, setActiveTab] = useState('inbox');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [hasMorePages, setHasMorePages] = useState(true);

  // Refs for debouncing and previous values
  const filterTimeoutRef = useRef<NodeJS.Timeout>();
  const prevFiltersRef = useRef<NotificationFilterParams>(filters);
  const prevTabRef = useRef(currentTab);

  // Hooks for notification actions
  const markAsRead = useMarkAsRead();
  const archiveNotification = useArchiveNotification();
  const bulkMarkAsRead = useBulkMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();

  // Memoized filter object to prevent unnecessary re-renders
  const activeFilters = useMemo<NotificationFilterParams>(
    () => ({
      ...filters,
      archived: currentTab === 'archived' ? true : undefined,
      status: currentTab === 'unread' ? 'unread' : undefined,
    }),
    [filters, currentTab]
  );

  // Debounced filter updates
  useEffect(() => {
    // Skip if filters haven't changed
    if (
      JSON.stringify(prevFiltersRef.current) === JSON.stringify(activeFilters) &&
      prevTabRef.current === currentTab
    ) {
      return;
    }

    // Clear any pending updates
    if (filterTimeoutRef.current) {
      clearTimeout(filterTimeoutRef.current);
    }

    // Set a new timeout
    filterTimeoutRef.current = setTimeout(() => {
      setFilters(activeFilters);
      prevFiltersRef.current = activeFilters;
      prevTabRef.current = currentTab;
    }, 300); // 300ms debounce time

    // Cleanup function
    return () => {
      if (filterTimeoutRef.current) {
        clearTimeout(filterTimeoutRef.current);
      }
    };
  }, [activeFilters, currentTab]);

  // Fetch notifications
  const {
    data: notificationsData,
    isLoading,
    isError,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
  } = useNotificationsFeed(filters);

  // Memoize the extracted notifications to prevent recalculation on every render
  const notifications = useMemo(
    () => (notificationsData ? notificationsData.pages.flatMap((page) => page.entries) : []),
    [notificationsData]
  );

  // Check if there are more pages to load
  useEffect(() => {
    if (notificationsData?.pages) {
      const lastPage = notificationsData.pages[notificationsData.pages.length - 1];
      setHasMorePages(!!lastPage.pageInfo.after);
    }
  }, [notificationsData]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(() => {
    markAllAsRead.mutate(
      {},
      {
        onSuccess: () => {
          toast.success('All notifications marked as read');
        },
        onError: () => {
          toast.error('Failed to mark all notifications as read. Please try again');
        },
      }
    );
  }, []);

  // Set TopBar content
  useEffect(() => {
    applyRouteConfig(pathname);

    setTopBarForRoute(pathname, {
      title: 'Inbox',
      leftMode: 'menu',
      centerMode: 'title',
      buttons: [
        {
          id: 'refresh',
          icon: RefreshCw,
          onClick: handleRefresh,
          label: 'Refresh',
          disabled: isLoading || isFetchingNextPage,
        },
        {
          id: 'mark-all-read',
          icon: MailOpen,
          onClick: handleMarkAllAsRead,
          label: 'Mark all as read',
          disabled: notifications.length === 0 || markAllAsRead.isPending,
        },
      ],
      showAvatar: true,
    });

    // Cleanup function to reset topbar state when leaving this page
    return () => {
      clearRoute(pathname);
    };
  }, [
    pathname,
    applyRouteConfig,
    setTopBarForRoute,
    clearRoute,
    isLoading,
    handleRefresh,
    handleMarkAllAsRead,
    isFetchingNextPage,
    markAllAsRead.isPending,
    notifications.length,
  ]);

  // Handle notification actions
  const handleMarkAsRead = useCallback(
    (id: string) => {
      markAsRead.mutate(id);
    },
    [markAsRead]
  );

  const handleArchive = useCallback(
    (id: string) => {
      archiveNotification.mutate(id, {
        onSuccess: () => {
          toast.success('Notification archived');
        },
        onError: () => {
          toast.error('Failed to archive notification. Please try again');
        },
      });
    },
    [archiveNotification]
  );

  const handleMarkSelectedAsRead = useCallback(() => {
    if (selectedIds.length > 0) {
      bulkMarkAsRead.mutate(
        { message_ids: selectedIds },
        {
          onSuccess: () => {
            setSelectedIds([]);
            toast.success('Notifications marked as read');
          },
          onError: () => {
            toast.error('Failed to mark notifications as read. Please try again');
          },
        }
      );
    }
  }, [selectedIds, bulkMarkAsRead]);

  const handleArchiveSelected = useCallback(() => {
    let isError = false;
    // Archive each selected notification one by one
    // Ideally would use a bulk endpoint, but using what's available
    selectedIds.forEach((id) => {
      archiveNotification.mutate(id, {
        onError: () => {
          isError = true;
        },
      });
    });
    if (!isError) {
      toast.success('Notifications archived');
    } else {
      toast.error('Failed to archive 1 or more notifications. Please try again');
    }
    setSelectedIds([]);
  }, [selectedIds, archiveNotification]);

  const handleNavigate = useCallback(
    (notification: UINotification) => {
      // Extract link from notification data if available
      const link = notification.data?.link;

      // Only proceed if we have a valid relative path
      if (link && isValidRelativePath(link)) {
        try {
          router.push(link);
        } catch (error) {
          console.error('Navigation error:', error);
          // Optionally show error to user
        }
      } else if (link) {
        console.warn('Attempted to navigate to invalid URL:', link);
      }
    },
    [router]
  );

  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasMorePages) {
      fetchNextPage();
    }
  }, [isFetchingNextPage, hasMorePages, fetchNextPage]);

  if (isCheckingAuth || isLoading) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        {/* Filters skeleton */}
        <div className='px-4 pt-4'>
          <div className='mb-3 flex items-center gap-2'>
            <Skeleton className='h-9 w-24 rounded-lg' />
            <Skeleton className='h-9 w-24 rounded-lg' />
            <Skeleton className='h-9 w-24 rounded-lg' />
          </div>
          <div className='mb-3 flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Skeleton className='h-8 w-20 rounded-md' />
              <Skeleton className='h-8 w-28 rounded-md' />
            </div>
            <div className='flex items-center gap-2'>
              <Skeleton className='h-8 w-8 rounded-full' />
              <Skeleton className='h-8 w-8 rounded-full' />
            </div>
          </div>
        </div>

        {/* List skeleton */}
        <div className='flex-1 overflow-y-auto px-4 pb-24'>
          <Skeleton variant='list' />
        </div>

        {/* Bottom Navbar placeholder */}
        <div className='border-t border-gray-100 bg-white p-2'>
          <div className='mx-auto flex max-w-sm items-center justify-around'>
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className='h-8 w-8 rounded-full' />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
      {/* Notification filters */}
      <NotificationFilters
        currentFilters={filters}
        onFilterChange={setFilters}
        showArchived={showArchived}
        onShowArchivedChange={setShowArchived}
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        selectedCount={selectedIds.length}
        onClearSelection={() => setSelectedIds([])}
        onMarkSelectedAsRead={handleMarkSelectedAsRead}
        onArchiveSelected={handleArchiveSelected}
      />

      {/* Notification list */}
      <div className='flex-1 overflow-hidden pb-20'>
        <NotificationList
          notifications={notifications}
          isLoading={isLoading || isFetchingNextPage}
          isError={isError}
          hasMore={hasMorePages}
          onLoadMore={handleLoadMore}
          onRead={handleMarkAsRead}
          onArchive={handleArchive}
          onNavigate={handleNavigate}
          showCheckboxes={true}
          selectedIds={selectedIds}
          onSelectionChange={setSelectedIds}
        />
      </div>

      {/* Bottom Navbar */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

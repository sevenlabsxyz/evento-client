import apiClient from '@/lib/api/client';
import { ApiResponse } from '@/lib/types/api';
import {
  MarkAllNotificationsParams,
  NotificationBulkActionParams,
  NotificationFeedResponse,
  NotificationFilterParams,
  NotificationMessage,
  UINotification,
} from '@/lib/types/notifications';
import { toast } from '@/lib/utils/toast';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { formatDistanceToNowStrict } from 'date-fns';

/**
 * Format the raw notification message into UI-friendly format
 */
export function formatNotificationForUI(message: NotificationMessage): UINotification {
  // Find the first block with content
  const block = message.blocks.find((b) => b.rendered_content);

  // Extract title and content from blocks
  const title = block?.rendered_content?.subject || 'New Notification';
  const content = block?.rendered_content?.plain_text || block?.rendered_content?.body || '';

  // Format the timestamp as a relative time
  const timestamp = formatDistanceToNowStrict(new Date(message.created_at), {
    addSuffix: true,
  });

  // Extract workflow key as category
  const category = message.workflow_key || 'system';

  // Create UI notification
  return {
    id: message.id,
    title,
    content,
    timestamp,
    actor: message.actor
      ? {
          id: message.actor.id,
          type: message.actor.object,
        }
      : undefined,
    category,
    status: message.status,
    data: message.data,
    original: message,
  };
}

interface NotificationFeedQueryData {
  entries: UINotification[];
  pageInfo: {
    after: string | null;
    before: string | null;
    page_size: number;
  };
}

/**
 * Hook to fetch notifications feed with filtering and pagination
 */
export function useNotificationsFeed(filters: NotificationFilterParams = {}) {
  return useInfiniteQuery<NotificationFeedQueryData, Error>({
    queryKey: ['notifications', 'feed', filters],
    initialPageParam: null as string | null,
    queryFn: async ({ pageParam }) => {
      try {
        const params = new URLSearchParams();

        // Add all filters to query params
        if (filters.page_size) {
          params.append('page_size', String(filters.page_size));
        }

        if (pageParam) {
          params.append('after', String(pageParam));
        } else if (filters.after) {
          params.append('after', String(filters.after));
        }

        if (filters.before && !pageParam) {
          params.append('before', String(filters.before));
        }

        if (filters.archived !== undefined) {
          params.append('archived', String(filters.archived));
        }

        if (filters.status) {
          params.append('status', String(filters.status));
        }

        if (filters.tenant) {
          params.append('tenant', String(filters.tenant));
        }

        if (filters.source) {
          params.append('source', String(filters.source));
        }

        // Add any trigger_data filters
        if (filters.trigger_data) {
          Object.entries(filters.trigger_data).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
              params.append(`trigger_data[${key}]`, String(value));
            }
          });
        }

        // Make API request
        const response = await apiClient.get<NotificationFeedResponse>(
          `/v1/notifications/feed?${params.toString()}`
        );

        // Transform data for UI
        if (response?.data) {
          const feedResponse = response.data;
          return {
            entries: feedResponse.entries.map(formatNotificationForUI),
            pageInfo: feedResponse.page_info || {
              before: null,
              after: null,
              page_size: 20,
            },
          };
        }

        throw new Error('Invalid response format');
      } catch (error) {
        console.error('Error fetching notifications feed:', error);
        // throw error; TODO: Uncomment this
        return {
          entries: [],
          pageInfo: { before: null, after: null, page_size: 20 },
        };
      }
    },
    getNextPageParam: (lastPage) => lastPage.pageInfo.after || undefined,
  });
}

/**
 * Hook to get a single notification by ID
 */
export function useNotification(messageId: string, enabled: boolean = true) {
  return useQuery({
    queryKey: ['notifications', 'message', messageId],
    queryFn: async () => {
      try {
        const response = await apiClient.get<NotificationMessage>(
          `/v1/notifications/messages/${messageId}`
        );

        if (response?.data) {
          return formatNotificationForUI(response.data);
        }

        throw new Error('Invalid response format');
      } catch (error) {
        console.error(`Error fetching notification ${messageId}:`, error);
        throw error;
      }
    },
    enabled: enabled && !!messageId,
  });
}

/**
 * Hook to mark a notification as seen
 */
export function useMarkAsSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiClient.put<ApiResponse<NotificationMessage>>(
        `/v1/notifications/messages/${messageId}/seen`
      );

      if (response?.data) {
        return response.data;
      }
      throw new Error('Failed to mark notification as seen');
    },
    onSuccess: (_, messageId) => {
      // Update the notification in the cache
      queryClient.invalidateQueries({ queryKey: ['notifications', 'feed'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'message', messageId],
      });
    },
  });
}

/**
 * Hook to mark a notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiClient.put<ApiResponse<NotificationMessage>>(
        `/v1/notifications/messages/${messageId}/read`
      );

      if (response?.data) {
        return response.data;
      }
      throw new Error('Failed to mark notification as read');
    },
    onSuccess: (_, messageId) => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'feed'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'message', messageId],
      });
    },
  });
}

/**
 * Hook to archive a notification
 */
export function useArchiveNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (messageId: string) => {
      const response = await apiClient.put<ApiResponse<NotificationMessage>>(
        `/v1/notifications/messages/${messageId}/archived`
      );

      if (response?.data) {
        return response.data;
      }
      throw new Error('Failed to archive notification');
    },
    onSuccess: (_, messageId) => {
      toast.success('Notification archived');
      queryClient.invalidateQueries({ queryKey: ['notifications', 'feed'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'message', messageId],
      });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to archive notification');
    },
  });
}

/**
 * Hook to bulk mark notifications as seen
 */
export function useBulkMarkAsSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: NotificationBulkActionParams) => {
      const response = await apiClient.put<{ success: boolean }>(
        '/v1/notifications/messages/bulk/seen',
        params
      );

      if (response?.data?.success !== false) {
        return response;
      }
      throw new Error('Failed to mark notifications as seen');
    },
    onSuccess: () => {
      toast.success('Notifications marked as seen');
      queryClient.invalidateQueries({ queryKey: ['notifications', 'feed'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark notifications as seen');
    },
  });
}

/**
 * Hook to bulk mark notifications as read
 */
export function useBulkMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: NotificationBulkActionParams) => {
      const response = await apiClient.put<{ success: boolean }>(
        '/v1/notifications/messages/bulk/read',
        params
      );

      if (response?.data?.success !== false) {
        return response;
      }
      throw new Error('Failed to mark notifications as read');
    },
    onSuccess: () => {
      toast.success('Notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications', 'feed'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark notifications as read');
    },
  });
}

/**
 * Hook to mark all notifications as seen
 */
export function useMarkAllAsSeen() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: MarkAllNotificationsParams = {}) => {
      const response = await apiClient.put<{ success: boolean }>(
        '/v1/notifications/mark-all/seen',
        params
      );

      if (response?.data?.success !== false) {
        return response;
      }
      throw new Error('Failed to mark all notifications as seen');
    },
    onSuccess: () => {
      toast.success('All notifications marked as seen');
      queryClient.invalidateQueries({ queryKey: ['notifications', 'feed'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark all notifications as seen');
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: MarkAllNotificationsParams = {}) => {
      const response = await apiClient.put<{ success: boolean }>(
        '/v1/notifications/mark-all/read',
        params
      );

      if (response?.data?.success !== false) {
        return response;
      }
      throw new Error('Failed to mark all notifications as read');
    },
    onSuccess: () => {
      toast.success('All notifications marked as read');
      queryClient.invalidateQueries({ queryKey: ['notifications', 'feed'] });
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to mark all notifications as read');
    },
  });
}

/**
 * Hook to get unread notification count
 * This is useful for showing a badge in the UI
 */
export function useUnreadCount() {
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: async () => {
      try {
        const response = await apiClient.get<NotificationFeedResponse>(
          '/v1/notifications/feed?page_size=1'
        );

        if (response?.data?.meta) {
          return {
            unread: response.data.meta.unread_count,
            unseen: response.data.meta.unseen_count,
          };
        }

        return { unread: 0, unseen: 0 };
      } catch (error) {
        console.error('Error fetching notification count:', error);
        return { unread: 0, unseen: 0 };
      }
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 2, // 2 minutes
  });
}

/**
 * Generate dummy notifications for testing/fallback
 */
export function generateDummyNotifications(count: number = 10): UINotification[] {
  const categories = [
    'event_invite',
    'event_comment',
    'event_rsvp',
    'user_follow',
    'event_reminder',
    'system_update',
  ];

  const statuses: ('unseen' | 'seen' | 'read' | 'archived')[] = [
    'unseen',
    'seen',
    'read',
    'archived',
  ];

  const titles = [
    'New event invitation',
    'Someone commented on your event',
    'New RSVP to your event',
    'Someone is now following you',
    'Upcoming event reminder',
    'System update notification',
    'New feature announcement',
    'Your event is trending',
    'Payment processed successfully',
    'Event scheduling update',
  ];

  const contents = [
    'You have been invited to "Summer Beach Party".',
    'Alex commented on your event: "Looking forward to this!"',
    'Jordan RSVP\'d "Yes" to your "Tech Conference" event.',
    'Sam started following you.',
    'Reminder: Your event "Birthday Celebration" is tomorrow.',
    'Evento has updated the privacy policy.',
    'Check out the new messaging feature!',
    'Your event is gaining popularity - 15 new RSVPs today!',
    'Payment for "Concert Tickets" has been processed.',
    'The location for "Team Meeting" has been updated.',
  ];

  const actors = [
    { id: 'user_1', type: 'user' },
    { id: 'user_2', type: 'user' },
    { id: 'user_3', type: 'user' },
    { id: 'user_4', type: 'user' },
    { id: 'system', type: 'system' },
  ];

  const timeOffsets = [
    new Date(new Date().getTime() - 5 * 60 * 1000).toISOString(), // '5 minutes ago'
    new Date(new Date().getTime() - 10 * 60 * 1000).toISOString(), // '10 minutes ago'
    new Date(new Date().getTime() - 60 * 60 * 1000).toISOString(), // '1 hour ago'
    new Date(new Date().getTime() - 3 * 60 * 60 * 1000).toISOString(), // '3 hours ago'
    new Date(new Date().getTime() - 24 * 60 * 60 * 1000).toISOString(), // 'yesterday',
    new Date(new Date().getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(), // '2 days ago',
    new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(), // '1 week ago',
    new Date(new Date().getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(), // '2 weeks ago',
  ];

  // Generate mock notifications
  return Array(count)
    .fill(0)
    .map((_, i) => {
      const categoryIndex = i % categories.length;
      const statusIndex = Math.floor(Math.random() * statuses.length);
      const titleIndex = i % titles.length;
      const contentIndex = i % contents.length;
      const actorIndex = Math.floor(Math.random() * actors.length);
      const timeIndex = i % timeOffsets.length;

      // Create dummy message
      const dummyMessage = {
        id: `msg_dummy_${i}`,
        tenant: null,
        workflow_key: categories[categoryIndex],
        actor:
          actors[actorIndex].type === 'system'
            ? null
            : {
                id: actors[actorIndex].id,
                object: actors[actorIndex].type,
              },
        recipient: {
          id: 'current_user',
          object: 'user',
        },
        status: statuses[statusIndex],
        blocks: [
          {
            channel_id: 'in_app',
            rendered_content: {
              subject: titles[titleIndex],
              plain_text: contents[contentIndex],
            },
            seen_at: null,
            read_at: null,
            interacted_at: null,
            archived_at: null,
          },
        ],
        activities: [],
        data: {},
        created_at: timeOffsets[timeIndex],
        updated_at: timeOffsets[timeIndex],
        trigger_data: {},
      } as NotificationMessage;

      // Return formatted notification
      return {
        id: dummyMessage.id,
        title: titles[titleIndex],
        content: contents[contentIndex],
        timestamp: timeOffsets[timeIndex],
        actor:
          actors[actorIndex].type === 'system'
            ? undefined
            : {
                id: actors[actorIndex].id,
                type: actors[actorIndex].type,
              },
        category: categories[categoryIndex],
        status: statuses[statusIndex],
        data: {},
        original: dummyMessage,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.original.created_at).getTime() - new Date(a.original.created_at).getTime()
    );
}

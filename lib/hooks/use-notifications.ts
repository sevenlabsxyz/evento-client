import apiClient from '@/lib/api/client';
import { ApiResponse } from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';
import {
  MarkAllNotificationsParams,
  NotificationBulkActionParams,
  NotificationFeedResponse,
  NotificationFilterParams,
  NotificationMessage,
  UINotification,
} from '@/lib/types/notifications';
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
        const response = await apiClient.get<ApiResponse<NotificationFeedResponse>>(
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
        logger.error('Error fetching notifications feed', {
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
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
        const response = await apiClient.get<ApiResponse<NotificationMessage>>(
          `/v1/notifications/messages/${messageId}`
        );

        if (response?.data) {
          return formatNotificationForUI(response.data);
        }

        throw new Error('Invalid response format');
      } catch (error) {
        logger.error(`Error fetching notification ${messageId}`, {
          error: error instanceof Error ? error.message : String(error),
        });
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
      queryClient.invalidateQueries({ queryKey: ['notifications', 'feed'] });
      queryClient.invalidateQueries({
        queryKey: ['notifications', 'message', messageId],
      });
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

      if (response.success !== false) {
        return response;
      }
      throw new Error('Failed to mark notifications as seen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'feed'] });
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

      if (response.success !== false) {
        return response;
      }
      throw new Error('Failed to mark notifications as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'feed'] });
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

      if (response.success !== false) {
        return response;
      }
      throw new Error('Failed to mark all notifications as seen');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'feed'] });
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

      if (response.success !== false) {
        return response;
      }
      throw new Error('Failed to mark all notifications as read');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', 'feed'] });
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
        const response = await apiClient.get<ApiResponse<NotificationFeedResponse>>(
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
        logger.error('Error fetching notification count', {
          error: error instanceof Error ? error.message : String(error),
        });
        return { unread: 0, unseen: 0 };
      }
    },
    staleTime: 1000 * 60, // 1 minute
    refetchInterval: 1000 * 60 * 2, // 2 minutes
  });
}

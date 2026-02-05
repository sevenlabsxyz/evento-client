import apiClient from '@/lib/api/client';
import { ApiResponse, Event } from '@/lib/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

// Response type for pinned event
interface PinnedEventResponse {
  id: string;
  title: string;
  [key: string]: any;
}

/**
 * Hook to fetch a user's pinned event
 * @param username - Username of the user to fetch pinned event for
 */
export function usePinnedEvent(username: string) {
  return useQuery({
    queryKey: ['user', username, 'pinned-event'],
    queryFn: async (): Promise<Event | null> => {
      if (!username) {
        return null;
      }
      try {
        const response = await apiClient.get<ApiResponse<Event>>(
          `/v1/user/pinned-event?username=${encodeURIComponent(username)}`
        );
        return response?.data || null;
      } catch (error) {
        // If there's no pinned event, return null instead of error
        if (error && typeof error === 'object' && 'status' in error) {
          const apiError = error as { status?: number };
          if (apiError.status === 404) {
            return null;
          }
        }
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 404 or 401 errors
      if (error && typeof error === 'object' && 'status' in error) {
        const apiError = error as { status?: number };
        if (apiError.status === 404 || apiError.status === 401) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
}

/**
 * Hook to update the current user's pinned event
 * Only works for the authenticated user
 */
export function useUpdatePinnedEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string | null) => {
      const response = await apiClient.patch<ApiResponse<PinnedEventResponse>>(
        '/v1/user/pinned-event',
        { eventId }
      );

      return response.data;
    },
    onSuccess: () => {
      // Invalidate related queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['user'] });
    },
    onError: (error: any) => {
      console.error('Update pinned event error:', error);
    },
  });
}

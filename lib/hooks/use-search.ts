import { useMutation } from '@tanstack/react-query';
import apiClient from '../api/client';
import { UserSearchResult } from '../types/api';
import { EventDetail } from '../types/event';
import { transformApiEventToDisplay } from '../utils/event-transform';
/**
 * Hook to search for events
 * @returns A mutation object for searching events
 */
export function useEventSearch() {
  return useMutation({
    mutationFn: async (query: string): Promise<EventDetail[]> => {
      if (!query.trim()) return [];

      const response = await apiClient.get(`/v1/event/search?s=${encodeURIComponent(query)}`);

      // Transform API events to display format if needed
      // Cast the response to the appropriate Event type
      return response.data.map((event: any) =>
        transformApiEventToDisplay ? transformApiEventToDisplay(event) : event
      );
    },
    onError: (error) => {
      console.error('Event search failed:', error);
    },
  });
}

export function useUserSearch() {
  return useMutation({
    mutationFn: async (query: string): Promise<UserSearchResult[]> => {
      if (!query.trim()) return [];

      const response = await apiClient.get(`/v1/user/search?s=${encodeURIComponent(query)}`);
      return response.data;
    },
    onError: (error) => {
      console.error('User search failed:', error);
    },
  });
}

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "../api/client";
import { ApiResponse, EventWithUser } from "../types/api";

/**
 * Hook to fetch events feed
 * Returns events from followed users and own events
 */
export function useEventsFeed() {
  return useQuery({
    queryKey: ["events", "feed"],
    queryFn: async (): Promise<EventWithUser[]> => {
      const response =
        await apiClient.get<ApiResponse<EventWithUser[]>>("/v1/events/feed");
      return (response as any)?.data || [];
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry on 401 errors
      if (error && typeof error === "object" && "message" in error) {
        const apiError = error as { message: string; status?: number };
        if (
          apiError.status === 401 ||
          apiError.message?.includes("401") ||
          apiError.message?.includes("Unauthorized")
        ) {
          return false;
        }
      }
      return failureCount < 2;
    },
  });
}

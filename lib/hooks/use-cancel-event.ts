import { apiClient } from '@/lib/api/client';
import { debugError } from '@/lib/utils/debug';
import { logger } from '@/lib/utils/logger';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook for cancelling an event
 * Uses DELETE /v1/events/{eventId}/cancel API endpoint
 */
export function useCancelEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, sendEmails }: { eventId: string; sendEmails: boolean }) => {
      try {
        const response = await apiClient.delete(
          `/v1/events/${eventId}/cancel?sendEmails=${sendEmails}`
        );

        return response.data;
      } catch (error) {
        debugError('useCancelEvent', 'Failed to cancel event', error, {
          eventId,
          sendEmails,
        });
        throw error;
      }
    },

    onSuccess: (_data, variables) => {
      // Invalidate related queries to update UI
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.removeQueries({
        queryKey: ['event', 'details', variables.eventId],
      });
    },

    onError: (error) => {
      logger.error('Event cancellation error', {
        error: error instanceof Error ? error.message : String(error),
      });
    },
  });
}

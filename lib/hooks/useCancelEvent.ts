import { apiClient } from '@/lib/api/client';
import { debugError } from '@/lib/utils/debug';
import { toast } from '@/lib/utils/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Hook for cancelling an event
 * Uses DELETE /v1/events/cancel API endpoint
 */
export function useCancelEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, sendEmails }: { eventId: string; sendEmails: boolean }) => {
      try {
        const response = await apiClient.delete(
          `/v1/events/cancel?id=${eventId}&sendEmails=${sendEmails}`
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

      // Show success toast
      toast.success(
        variables.sendEmails
          ? 'Event cancelled. Notification emails have been sent to attendees.'
          : 'Event cancelled successfully.'
      );
    },

    onError: (error) => {
      toast.error('Failed to cancel event. Please try again.');
      console.error('Event cancellation error:', error);
    },
  });
}

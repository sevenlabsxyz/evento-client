import { apiClient } from '@/lib/api/client';
import { debugError } from '@/lib/utils/debug';
import { toast } from '@/lib/utils/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface DeleteSubEventVars {
  parentEventId: string;
  subEventId: string;
}

export function useDeleteSubEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ parentEventId, subEventId }: DeleteSubEventVars) => {
      try {
        // TODO: Replace with correct API spec
        const res = await apiClient.delete(
          `/v1/events/sub-events?id=${subEventId}&parent_id=${parentEventId}`
        );
        return res;
      } catch (error) {
        debugError('useDeleteSubEvent', 'Failed to delete sub-event', error, {
          parentEventId,
          subEventId,
        });
        throw error;
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['event', 'sub-events', vars.parentEventId],
      });
      toast.success('Sub event deleted');
    },
    onError: () => {
      toast.error('Failed to delete sub event');
    },
  });
}

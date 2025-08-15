import { apiClient } from '@/lib/api/client';
import { debugError } from '@/lib/utils/debug';
import { toast } from '@/lib/utils/toast';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface CreateSubEventVars {
  parentEventId: string;
  title: string;
}

export function useCreateSubEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ parentEventId, title }: CreateSubEventVars) => {
      try {
        // TODO: Replace this with actual API
        const res = await apiClient.post('/v1/events/sub-events', {
          parent_event_id: parentEventId,
          title,
        });
        return res;
      } catch (error) {
        debugError('useCreateSubEvent', 'Failed to create sub-event', error, {
          parentEventId,
          title,
        });
        throw error;
      }
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({
        queryKey: ['event', 'sub-events', vars.parentEventId],
      });
      toast.success('Sub event created');
    },
    onError: () => {
      toast.error('Failed to create sub event');
    },
  });
}

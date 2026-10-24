import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse } from '@/lib/types/api';
import type { DuplicatedEvent } from '@/lib/types/manage';
import { getErrorMessage } from '@/lib/utils/error-message';
import { logger } from '@/lib/utils/logger';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

/**
 * Duplicate an event as a new draft owned by the current user
 */
export function useDuplicateEvent() {
  const queryClient = useQueryClient();
  const t = useTranslations('hooks');

  return useMutation({
    mutationFn: async (eventId: string): Promise<DuplicatedEvent> => {
      const response = await apiClient.post<ApiResponse<DuplicatedEvent>>(
        `/v1/events/${eventId}/duplicate`
      );

      if (response?.data) {
        return response.data;
      }

      throw new Error(t('events.duplicateFailed'));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventsUserMeDrafts() });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });
    },
    onError: (error: unknown) => {
      logger.error('Duplicate event error', { error: getErrorMessage(error) });
    },
  });
}

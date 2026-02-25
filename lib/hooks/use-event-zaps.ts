import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import {
  ApiResponse,
  CreateEventZapRunForm,
  EventZapRun,
  EventZapRunRecipient,
  SubmitEventZapRunResultsForm,
} from '@/lib/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useEventZaps(eventId: string) {
  return useQuery({
    queryKey: queryKeys.eventZaps(eventId),
    queryFn: async () => {
      const response = await apiClient.get<ApiResponse<EventZapRun[]>>(
        `/v1/events/${eventId}/zaps`
      );

      return response?.data || [];
    },
    enabled: !!eventId,
  });
}

export function useCreateEventZapRun(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateEventZapRunForm) => {
      const response = await apiClient.post<ApiResponse<EventZapRun>>(
        `/v1/events/${eventId}/zaps`,
        payload
      );

      if (!response?.data) {
        throw new Error('Failed to queue zap run');
      }

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventZaps(eventId) });
    },
  });
}

export async function fetchEventZapRunRecipients(
  eventId: string,
  runId: string,
  options?: {
    status?: 'pending' | 'attempted' | 'fallback_emailed' | 'failed';
    limit?: number;
  }
) {
  const query = new URLSearchParams();

  if (options?.status) {
    query.set('status', options.status);
  }

  if (options?.limit) {
    query.set('limit', String(options.limit));
  }

  const queryString = query.toString();
  const path = `/v1/events/${eventId}/zaps/${runId}/recipients${queryString ? `?${queryString}` : ''}`;

  const response = await apiClient.get<ApiResponse<EventZapRunRecipient[]>>(path);
  return response?.data || [];
}

export async function submitEventZapRunResults(
  eventId: string,
  runId: string,
  payload: SubmitEventZapRunResultsForm
) {
  const response = await apiClient.post<ApiResponse<EventZapRun>>(
    `/v1/events/${eventId}/zaps/${runId}/results`,
    payload
  );

  if (!response?.data) {
    throw new Error('Failed to submit zap run results');
  }

  return response.data;
}

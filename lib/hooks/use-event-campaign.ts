import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import {
  ApiError,
  ApiResponse,
  CampaignStatus,
  CampaignVisibility,
  CampaignWithProgress,
} from '@/lib/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface CreateEventCampaignInput {
  title?: string | null;
  description?: string | null;
  goalSats?: number | null;
  visibility?: CampaignVisibility;
  status?: CampaignStatus;
}

export interface UpdateEventCampaignInput {
  title?: string | null;
  description?: string | null;
  goalSats?: number | null;
  visibility?: CampaignVisibility;
  status?: CampaignStatus;
}

interface UpdateEventCampaignPayload {
  title?: string | null;
  description?: string | null;
  goal_sats?: number | null;
  visibility?: CampaignVisibility;
  status?: CampaignStatus;
}

const hasOwn = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

function toUpdatePayload(input: UpdateEventCampaignInput): UpdateEventCampaignPayload {
  const payload: UpdateEventCampaignPayload = {};

  if (hasOwn(input, 'title')) {
    payload.title = input.title;
  }

  if (hasOwn(input, 'description')) {
    payload.description = input.description;
  }

  if (hasOwn(input, 'goalSats')) {
    payload.goal_sats = input.goalSats;
  }

  if (hasOwn(input, 'visibility')) {
    payload.visibility = input.visibility;
  }

  if (hasOwn(input, 'status')) {
    payload.status = input.status;
  }

  return payload;
}

function isMissingCampaignError(error: unknown): error is ApiError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const apiError = error as ApiError;

  return (
    apiError.status === 404 ||
    (apiError.status === 400 && apiError.message === 'Campaign not found.')
  );
}

export async function getEventCampaign(eventId: string): Promise<CampaignWithProgress | null> {
  try {
    const response = await apiClient.get<ApiResponse<CampaignWithProgress>>(
      `/v1/events/${eventId}/campaign`,
      {
        suppressErrorStatuses: [400, 404],
      }
    );

    return response.data;
  } catch (error) {
    if (isMissingCampaignError(error)) {
      return null;
    }

    throw error;
  }
}

export async function createEventCampaign(
  eventId: string,
  input: CreateEventCampaignInput
): Promise<CampaignWithProgress> {
  const response = await apiClient.post<ApiResponse<CampaignWithProgress>>(
    `/v1/events/${eventId}/campaign`,
    input
  );

  return response.data;
}

export async function updateEventCampaign(
  eventId: string,
  input: UpdateEventCampaignInput
): Promise<CampaignWithProgress> {
  const response = await apiClient.patch<ApiResponse<CampaignWithProgress>>(
    `/v1/events/${eventId}/campaign`,
    toUpdatePayload(input)
  );

  return response.data;
}

export function useEventCampaign(eventId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.eventCampaign(eventId),
    queryFn: () => getEventCampaign(eventId),
    enabled: !!eventId && (options?.enabled ?? true),
  });
}

export function useCreateEventCampaign(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateEventCampaignInput) => createEventCampaign(eventId, input),
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventCampaign(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaignFeed(campaign.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns });
    },
  });
}

export function useUpdateEventCampaign(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateEventCampaignInput) => updateEventCampaign(eventId, input),
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.eventCampaign(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaignFeed(campaign.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.event(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns });
    },
  });
}

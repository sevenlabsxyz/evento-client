import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import {
  ApiResponse,
  CampaignStatus,
  CampaignVisibility,
  CampaignWithProgress,
} from '@/lib/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export interface CreateProfileCampaignInput {
  title?: string | null;
  description?: string | null;
  goalSats?: number | null;
  visibility?: CampaignVisibility;
  status?: CampaignStatus;
}

export interface UpdateProfileCampaignInput {
  title?: string | null;
  description?: string | null;
  goalSats?: number | null;
  visibility?: CampaignVisibility;
  status?: CampaignStatus;
}

interface UpdateProfileCampaignPayload {
  title?: string | null;
  description?: string | null;
  goal_sats?: number | null;
  visibility?: CampaignVisibility;
  status?: CampaignStatus;
}

const hasOwn = (obj: object, key: string) => Object.prototype.hasOwnProperty.call(obj, key);

function toUpdatePayload(input: UpdateProfileCampaignInput): UpdateProfileCampaignPayload {
  const payload: UpdateProfileCampaignPayload = {};

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

function isMissingCampaignError(error: unknown): boolean {
  return (
    !!error &&
    typeof error === 'object' &&
    'status' in error &&
    ((error as { status?: number }).status === 404 ||
      ((error as { status?: number; message?: string }).status === 400 &&
        (error as { message?: string }).message === 'Campaign not found.'))
  );
}

export async function getProfileCampaign(userId: string): Promise<CampaignWithProgress | null> {
  try {
    const response = await apiClient.get<ApiResponse<CampaignWithProgress>>(
      `/v1/users/${userId}/campaign`,
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

export async function getMyCampaign(): Promise<CampaignWithProgress> {
  const response = await apiClient.get<ApiResponse<CampaignWithProgress>>('/v1/user/campaign');

  return response.data;
}

export async function createProfileCampaign(
  input: CreateProfileCampaignInput
): Promise<CampaignWithProgress> {
  const response = await apiClient.post<ApiResponse<CampaignWithProgress>>(
    '/v1/user/campaign',
    input
  );

  return response.data;
}

export async function updateProfileCampaign(
  input: UpdateProfileCampaignInput
): Promise<CampaignWithProgress> {
  const response = await apiClient.patch<ApiResponse<CampaignWithProgress>>(
    '/v1/user/campaign',
    toUpdatePayload(input)
  );

  return response.data;
}

export function useProfileCampaign(userId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.profileCampaign(userId),
    queryFn: () => getProfileCampaign(userId),
    enabled: !!userId && (options?.enabled ?? true),
  });
}

export function useMyCampaign() {
  return useQuery({
    queryKey: queryKeys.myCampaign(),
    queryFn: getMyCampaign,
  });
}

export function useCreateProfileCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProfileCampaignInput) => createProfileCampaign(input),
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myCampaign() });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaignFeed(campaign.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns });
    },
  });
}

export function useUpdateProfileCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateProfileCampaignInput) => updateProfileCampaign(input),
    onSuccess: (campaign) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.myCampaign() });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaignFeed(campaign.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns });
    },
  });
}

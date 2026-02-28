import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse, CampaignPledgeStatus } from '@/lib/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef } from 'react';

export interface CreateCampaignPledgeInput {
  amountSats: number;
}

export type CampaignType = 'event' | 'profile';

export interface CreatePledgeIntentInput extends CreateCampaignPledgeInput {
  eventId?: string;
  username?: string;
}

export interface CreateCampaignPledgeResult {
  pledgeId: string;
  invoice: string;
  amountSats: number;
  expiresAt: string;
}

export interface CampaignPledgeStatusResponse {
  status: CampaignPledgeStatus;
  amountSats: number;
  settledAt?: string;
}

const FAST_POLL_WINDOW_MS = 2 * 60 * 1000;
const SLOW_POLL_WINDOW_MS = 10 * 60 * 1000;
const FAST_POLL_INTERVAL_MS = 3000;
const SLOW_POLL_INTERVAL_MS = 10000;

export function getCampaignPledgePollingInterval(
  elapsedMs: number,
  status?: CampaignPledgeStatus
): number | false {
  if (status && status !== 'pending') {
    return false;
  }

  if (elapsedMs < FAST_POLL_WINDOW_MS) {
    return FAST_POLL_INTERVAL_MS;
  }

  if (elapsedMs < FAST_POLL_WINDOW_MS + SLOW_POLL_WINDOW_MS) {
    return SLOW_POLL_INTERVAL_MS;
  }

  return false;
}

export async function createEventCampaignPledge(
  eventId: string,
  input: CreateCampaignPledgeInput
): Promise<CreateCampaignPledgeResult> {
  const response = await apiClient.post<ApiResponse<CreateCampaignPledgeResult>>(
    `/v1/events/${eventId}/campaign/pledges`,
    input
  );

  return response.data;
}

export async function createProfileCampaignPledge(
  username: string,
  input: CreateCampaignPledgeInput
): Promise<CreateCampaignPledgeResult> {
  const response = await apiClient.post<ApiResponse<CreateCampaignPledgeResult>>(
    `/v1/users/${username}/campaign/pledges`,
    input
  );

  return response.data;
}

export async function getCampaignPledgeStatus(
  pledgeId: string
): Promise<CampaignPledgeStatusResponse> {
  const response = await apiClient.get<ApiResponse<CampaignPledgeStatusResponse>>(
    `/v1/campaign-pledges/${pledgeId}/status`
  );

  return response.data;
}

export function useCreatePledgeIntent(campaignType: CampaignType) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePledgeIntentInput) => {
      if (campaignType === 'event') {
        if (!input.eventId) {
          throw new Error('eventId is required for event campaign pledges');
        }

        return createEventCampaignPledge(input.eventId, { amountSats: input.amountSats });
      }

      if (!input.username) {
        throw new Error('username is required for profile campaign pledges');
      }

      return createProfileCampaignPledge(input.username, { amountSats: input.amountSats });
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pledgeStatus(result.pledgeId) });

      if (campaignType === 'event' && variables.eventId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.eventCampaign(variables.eventId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.event(variables.eventId) });
      }

      if (campaignType === 'profile') {
        if (variables.username) {
          queryClient.invalidateQueries({ queryKey: queryKeys.profileCampaign(variables.username) });
        }
        queryClient.invalidateQueries({ queryKey: queryKeys.myCampaign() });
      }

      queryClient.invalidateQueries({ queryKey: queryKeys.campaigns });
    },
  });
}

export function usePledgeStatus(pledgeId: string) {
  const pollStartAtRef = useRef<number | null>(null);

  useEffect(() => {
    pollStartAtRef.current = pledgeId ? Date.now() : null;
  }, [pledgeId]);

  return useQuery({
    queryKey: queryKeys.pledgeStatus(pledgeId),
    queryFn: () => getCampaignPledgeStatus(pledgeId),
    enabled: !!pledgeId,
    staleTime: 0,
    refetchIntervalInBackground: true,
    refetchInterval: (query) => {
      if (!pledgeId) {
        return false;
      }

      if (pollStartAtRef.current === null) {
        pollStartAtRef.current = Date.now();
      }

      const data = query.state.data as CampaignPledgeStatusResponse | undefined;
      const elapsedMs = Date.now() - pollStartAtRef.current;

      return getCampaignPledgePollingInterval(elapsedMs, data?.status);
    },
  });
}

import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { CohostInvite, CohostInviteTarget } from '@/lib/types/api';

import { toast } from '@/lib/utils/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

interface EventHostApiItem {
  event_id: string;
  created_at: string;
  user_details: {
    id: string;
    username: string;
    name: string | null;
    image: string | null;
    verification_status: string | null;
  };
}

interface EventHostsResponse {
  success: boolean;
  message: string;
  data: EventHostApiItem[];
}

export function useEventCohosts(eventId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.eventCohosts(eventId),
    queryFn: async () => {
      const res = await apiClient.get<EventHostsResponse>(`/v1/events/${eventId}/hosts`);
      const hosts = res.data || [];
      return hosts.map((item) => ({
        id: item.user_details.id,
        username: item.user_details.username,
        name: item.user_details.name,
        image: item.user_details.image,
        verification_status: item.user_details.verification_status,
      }));
    },
    enabled,
  });
}

interface SendCohostInvitesResponse {
  success: boolean;
  message: string;
  data: {
    sent: number;
    skipped: number;
    invites: CohostInvite[];
  };
}

interface CohostInvitesResponse {
  success: boolean;
  message: string;
  data: CohostInvite[];
}

export function useSendCohostInvites(eventId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('hooks');

  return useMutation({
    mutationFn: async (payload: { invites: CohostInviteTarget[]; message?: string }) => {
      const res = await apiClient.post<SendCohostInvitesResponse>(
        `/v1/events/${eventId}/cohost-invites`,
        payload
      );
      return res;
    },
    onSuccess: (data) => {
      const count = data?.data?.sent ?? 0;
      toast.success(count ? t('cohostInvites.sent', { count }) : t('cohostInvites.invitesSent'));
      queryClient.invalidateQueries({ queryKey: queryKeys.eventCohostInvites(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cohostInvites });
      queryClient.invalidateQueries({ queryKey: queryKeys.hub });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('cohostInvites.sendFailed'));
    },
  });
}

export function useEventCohostInvites(eventId: string, status?: string, enabled = true) {
  return useQuery({
    queryKey: [...queryKeys.eventCohostInvites(eventId), status],
    queryFn: async () => {
      const params = status ? `?status=${status}` : '';

      const res = await apiClient.get<CohostInvitesResponse>(
        `/v1/events/${eventId}/cohost-invites${params}`
      );
      return res.data || [];
    },
    enabled,
  });
}

export function useMyCohostInvites(
  status: 'pending' | 'responded' | 'all' = 'pending',
  enabled = true
) {
  return useQuery({
    queryKey: [...queryKeys.myCohostInvites(), status],
    queryFn: async () => {
      const res = await apiClient.get<CohostInvitesResponse>(
        `/v1/user/cohost-invites?status=${status}`
      );
      return res.data || [];
    },
    enabled,
  });
}

export function useAcceptCohostInvite() {
  const queryClient = useQueryClient();
  const t = useTranslations('hooks');

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const res = await apiClient.patch(`/v1/cohost-invites/${inviteId}/accept`);
      return res.data;
    },
    onSuccess: (data) => {
      const eventId = data?.eventId;

      queryClient.invalidateQueries({ queryKey: queryKeys.myCohostInvites() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hub });
      queryClient.invalidateQueries({ queryKey: queryKeys.eventsUserMe() });
      queryClient.invalidateQueries({ queryKey: ['user-events'] });

      if (eventId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.event(eventId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.eventHosts(eventId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.eventCohosts(eventId) });
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('cohostInvites.acceptFailed'));
    },
  });
}

export function useRejectCohostInvite() {
  const queryClient = useQueryClient();
  const t = useTranslations('hooks');

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const res = await apiClient.patch(`/v1/cohost-invites/${inviteId}/reject`);
      return res.data;
    },
    onSuccess: () => {
      toast.success(t('cohostInvites.declined'));
      queryClient.invalidateQueries({ queryKey: queryKeys.myCohostInvites() });
      queryClient.invalidateQueries({ queryKey: queryKeys.hub });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('cohostInvites.declineFailed'));
    },
  });
}

export function useCancelCohostInvite(eventId: string) {
  const queryClient = useQueryClient();
  const t = useTranslations('hooks');

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const res = await apiClient.delete(`/v1/cohost-invites/${inviteId}`);
      return res.data;
    },
    onSuccess: () => {
      toast.success(t('cohostInvites.cancelled'));
      queryClient.invalidateQueries({ queryKey: queryKeys.eventCohostInvites(eventId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.cohostInvites });
      queryClient.invalidateQueries({ queryKey: queryKeys.hub });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || t('cohostInvites.cancelFailed'));
    },
  });
}

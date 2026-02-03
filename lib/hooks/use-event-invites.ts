import apiClient from '@/lib/api/client';
import { EVENT_INVITES_CONFIG } from '@/lib/constants/event-invites';
import { EventInvite, InviteTarget } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { useMutation, useQuery } from '@tanstack/react-query';

export type SendInvitesRequest = {
  id: string; // event id
  message: string;
  invites: InviteTarget[];
};

export type SendInvitesResponse = {
  success: boolean;
  data: {
    emails: {
      data: {
        data: Array<{ id: string }>;
      };
      error: null | string;
    };
    phones: string;
    users: string;
    invites: Array<{
      id: string;
      event_id: string;
      inviter_id: string;
      invitee_id?: string;
      invitee_email: string;
      message: string;
      status: string;
    }>;
  };
  message: string;
};

/**
 * Hook to send event invites
 * Endpoint: POST /v1/events/invites
 * Payload: { id: string, message: string, invites: string[] }
 */
export function useSendEventInvites() {
  return useMutation({
    mutationFn: async (payload: SendInvitesRequest) => {
      if (!payload?.id) throw new Error('Missing event id');
      if (!payload?.invites?.length) throw new Error('No invitees selected');

      const res = await apiClient.post<SendInvitesResponse>(
        `/v1/events/${payload.id}/invites`,
        payload
      );

      return res.data;
    },
    onSuccess: (data) => {
      const count = data?.invites?.length ?? 0;
      toast.success(count ? `Sent ${count} invite${count === 1 ? '' : 's'}` : 'Invites sent');
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to send invites';
      toast.error(msg);
    },
  });
}

interface EventInvitesResponse {
  success: boolean;
  message: string;
  data: EventInvite[];
}

// Hook to fetch event invites
export function useEventInvites(status?: 'pending' | 'responded', enabled: boolean = true) {
  return useQuery({
    queryKey: ['event-invites', status],
    queryFn: async () => {
      try {
        const params = status ? `?status=${status}` : '';
        const response = await apiClient.get<EventInvitesResponse>(`/v1/events/invites${params}`);
        return response.data || [];
      } catch (error) {
        console.error('Failed to fetch event invites:', error);
        throw error;
      }
    },
    enabled,
    staleTime: EVENT_INVITES_CONFIG.CACHE_STALE_TIME,
  });
}

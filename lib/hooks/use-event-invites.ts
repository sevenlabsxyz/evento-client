import apiClient from '@/lib/api/client';
import { InviteTarget } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { useMutation } from '@tanstack/react-query';

export type SendInvitesRequest = {
  id: string; // event id
  message: string;
  invites: InviteTarget[];
};

export type SendInvitesResponse = {
  success: boolean;
  invitedCount?: number;
  failed?: string[];
  message?: string;
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

      const res = await apiClient.post<SendInvitesResponse>('/v1/events/invites', payload);

      // apiClient returns response.data directly; normalize a bit
      return res as any as SendInvitesResponse;
    },
    onSuccess: (data) => {
      const count = data?.invitedCount ?? 0;
      toast.success(count ? `Sent ${count} invite${count === 1 ? '' : 's'}` : 'Invites sent');
    },
    onError: (err: any) => {
      const msg = err?.message || 'Failed to send invites';
      toast.error(msg);
    },
  });
}

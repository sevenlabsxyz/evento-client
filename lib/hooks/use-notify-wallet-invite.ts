'use client';

import { apiClient } from '@/lib/api/client';
import { toast } from '@/lib/utils/toast';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

interface NotifyWalletInviteArgs {
  recipientUsername: string;
}

interface NotifyWalletInviteResponse {
  success: boolean;
  status: 'sent' | 'already_notified' | 'error';
  message?: string;
}

export function useNotifyWalletInvite() {
  const t = useTranslations('hooks');

  return useMutation<NotifyWalletInviteResponse, Error, NotifyWalletInviteArgs>({
    mutationFn: async ({ recipientUsername }) => {
      const response = await apiClient.post<NotifyWalletInviteResponse>('/v1/wallet/notify', {
        recipientUsername,
      });

      if (!response?.success) {
        throw new Error(response?.message || t('walletInvite.notifyFailed'));
      }

      return response;
    },
    onSuccess: (data) => {
      // Only show toast for 'sent' status
      // 'already_notified' is handled by UI state
      if (data.status === 'sent') {
        toast.success(t('walletInvite.notified'));
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || t('walletInvite.notifyFailed'));
    },
  });
}

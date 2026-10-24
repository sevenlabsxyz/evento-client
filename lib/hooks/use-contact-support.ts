import apiClient from '@/lib/api/client';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ApiResponse } from '../types/api';

export interface ContactSupportPayload {
  subject: string;
  message: string;
}

export interface ContactSupportResponse {
  success: boolean;
  message: string;
}

export function useContactSupport() {
  const t = useTranslations('hooks');
  return useMutation<ContactSupportResponse, any, ContactSupportPayload>({
    mutationFn: async (payload) => {
      const data = await apiClient.post<ApiResponse<ContactSupportResponse>>(
        '/v1/contact',
        payload
      );
      // Ensure API indicated success
      if (!data?.data?.success) {
        throw { message: data?.data?.message || t('support.sendFailed') };
      }
      return data?.data;
    },
  });
}

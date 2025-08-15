import apiClient from '@/lib/api/client';
import { useMutation } from '@tanstack/react-query';
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
  return useMutation<ContactSupportResponse, any, ContactSupportPayload>({
    mutationFn: async (payload) => {
      const data = await apiClient.post<ApiResponse<ContactSupportResponse>>(
        '/v1/contact',
        payload
      );
      console.log(data);
      // Ensure API indicated success
      if (!data?.data?.success) {
        throw { message: data?.data?.message || 'Failed to send message' };
      }
      return data?.data;
    },
  });
}

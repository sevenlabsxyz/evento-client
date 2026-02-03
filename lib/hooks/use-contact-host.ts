'use client';

import { apiClient } from '@/lib/api/client';
import { ApiResponse, ContactHostForm } from '@/lib/types/api';
import { useMutation } from '@tanstack/react-query';

interface ContactHostArgs {
  eventId: string;
  form: ContactHostForm;
}

export function useContactHost() {
  return useMutation<boolean, Error, ContactHostArgs>({
    mutationFn: async ({ eventId, form }) => {
      const response = await apiClient.post<ApiResponse<null>>(
        `/v1/events/${eventId}/contact-host`,
        form
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Failed to send message');
      }

      return true;
    },
  });
}

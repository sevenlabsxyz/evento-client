'use client';

import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/lib/types/api';
import { grantEventAccess } from '@/lib/utils/event-access';
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface VerifyEventPasswordArgs {
  eventId: string;
  password: string;
}

interface VerifyPasswordResponse {
  valid: boolean;
}

export function useVerifyEventPassword() {
  const queryClient = useQueryClient();

  return useMutation<boolean, Error, VerifyEventPasswordArgs>({
    mutationFn: async ({ eventId, password }) => {
      const response = await apiClient.post<ApiResponse<VerifyPasswordResponse>>(
        `/v1/events/${eventId}/verify-password`,
        { password }
      );

      if (!response?.success) {
        throw new Error(response?.message || 'Invalid password');
      }

      return response.data?.valid ?? false;
    },
    onSuccess: (isValid, variables) => {
      if (isValid) {
        // Grant access in localStorage
        grantEventAccess(variables.eventId);

        // Invalidate event details to refetch with full data
        queryClient.invalidateQueries({
          queryKey: ['event', 'details', variables.eventId],
        });
      }
    },
  });
}

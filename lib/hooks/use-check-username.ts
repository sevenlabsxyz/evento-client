import { apiClient } from '@/lib/api/client';
import { ApiResponse } from '@/lib/types/api';
import { useMutation } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';

interface UsernameCheckResponse {
  available: boolean;
  message?: string;
}

/**
 * Hook to check username availability
 */
export function useCheckUsername() {
  const t = useTranslations('hooks');
  return useMutation({
    mutationFn: async (username: string) => {
      // Clean username
      const cleanUsername = username.trim().toLowerCase();

      // Basic validation
      if (cleanUsername.length < 3) {
        return {
          available: false,
          message: t('username.tooShort'),
        };
      }

      if (cleanUsername.length > 20) {
        return {
          available: false,
          message: t('username.tooLong'),
        };
      }

      if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        return {
          available: false,
          message: t('username.invalidChars'),
        };
      }

      try {
        const response = await apiClient.get<ApiResponse<UsernameCheckResponse>>(
          `/v1/user/check-username?username=${encodeURIComponent(cleanUsername)}`
        );

        return response.data || { available: false };
      } catch (error: any) {
        // If we get a 404, it means the username is available
        if (error.status === 404) {
          return { available: true };
        }

        // For other errors, assume username is not available
        return {
          available: false,
          message: t('username.checkFailed'),
        };
      }
    },
  });
}

import { apiClient } from '@/lib/api/client';
import { useMutation } from '@tanstack/react-query';

interface UsernameCheckResponse {
  available: boolean;
  message?: string;
}

/**
 * Hook to check username availability
 */
export function useCheckUsername() {
  return useMutation({
    mutationFn: async (username: string) => {
      // Clean username
      const cleanUsername = username.trim().toLowerCase();

      // Basic validation
      if (cleanUsername.length < 3) {
        return {
          available: false,
          message: 'Username must be at least 3 characters',
        };
      }

      if (cleanUsername.length > 20) {
        return {
          available: false,
          message: 'Username must be less than 20 characters',
        };
      }

      if (!/^[a-zA-Z0-9_]+$/.test(cleanUsername)) {
        return {
          available: false,
          message: 'Username can only contain letters, numbers, and underscores',
        };
      }

      try {
        const response = await apiClient.get<UsernameCheckResponse>(
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
          message: 'Unable to check username availability',
        };
      }
    },
  });
}

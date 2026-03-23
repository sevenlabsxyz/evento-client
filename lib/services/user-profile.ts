import apiClient from '@/lib/api/client';
import { ApiResponse, UserDetails } from '@/lib/types/api';

const isApiResponse = <T>(value: unknown): value is ApiResponse<T> => {
  return !!value && typeof value === 'object' && 'data' in value;
};

export async function fetchUserByUsername(username: string): Promise<UserDetails | null> {
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    return null;
  }

  const response = await apiClient.get<ApiResponse<UserDetails> | UserDetails>(
    `/v1/user/details?username=${encodeURIComponent(normalizedUsername)}`
  );

  const user = isApiResponse<UserDetails>(response) ? response.data : response;

  if (!user || !user.username) {
    return null;
  }

  return user;
}

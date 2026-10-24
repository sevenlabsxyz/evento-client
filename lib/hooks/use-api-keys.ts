import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import { toast } from '@/lib/utils/toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import type { ApiKey, CreateApiKeyRequest, CreateApiKeyResponse } from '../types/api-key.types';
const MAX_API_KEYS = 10;

export function useApiKeys() {
  return useQuery({
    queryKey: queryKeys.apiKeys(),
    queryFn: async (): Promise<ApiKey[]> => {
      const response = await apiClient.get('/v1/api-keys');

      // Validate response data
      if (!response?.data?.keys || !Array.isArray(response.data.keys)) {
        throw new Error('Invalid API response format');
      }

      return response.data.keys;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();
  const t = useTranslations('hooks');

  return useMutation({
    mutationFn: async (request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> => {
      const response = await apiClient.post('/v1/api-keys', request);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys() });
      toast.success(t('apiKeys.created'));
    },
    onError: (error: any) => {
      toast.error(error.message || t('apiKeys.createFailed'));
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();
  const t = useTranslations('hooks');

  return useMutation({
    mutationFn: async (keyId: string): Promise<void> => {
      await apiClient.delete(`/v1/api-keys/${keyId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apiKeys() });
      toast.success(t('apiKeys.revoked'));
    },
    onError: (error: any) => {
      toast.error(error.message || t('apiKeys.revokeFailed'));
    },
  });
}

export function useApiKeysCount() {
  const { data: keys = [] } = useApiKeys();
  const activeCount = keys.filter((key) => key.status === 'active').length;
  return {
    activeCount,
    maxKeys: MAX_API_KEYS,
    canCreateMore: activeCount < MAX_API_KEYS,
  };
}

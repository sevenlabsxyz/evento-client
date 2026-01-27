import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ApiKey, CreateApiKeyRequest, CreateApiKeyResponse } from '../types/api-key.types';

// Query keys
const API_KEYS_QUERY_KEY = ['api', 'keys'] as const;

// Maximum number of API keys allowed per user
const MAX_API_KEYS = 3;

// Mock data store (simulating backend storage)
let mockApiKeys: ApiKey[] = [];

/**
 * Generate a realistic-looking API key
 */
function generateApiKey(): string {
  const prefix = 'evt_sk_';
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let key = '';
  for (let i = 0; i < 48; i++) {
    key += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return prefix + key;
}

/**
 * Hook to fetch all API keys for the current user
 */
export function useApiKeys() {
  return useQuery({
    queryKey: API_KEYS_QUERY_KEY,
    queryFn: async (): Promise<ApiKey[]> => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Return mock keys without the actual key value
      return mockApiKeys.map((key) => ({
        ...key,
        key: null, // Never show the key after initial creation
      }));
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to create a new API key
 */
export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (request: CreateApiKeyRequest): Promise<CreateApiKeyResponse> => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check if user has reached the maximum number of keys
      const activeKeys = mockApiKeys.filter((key) => key.status === 'active');
      if (activeKeys.length >= MAX_API_KEYS) {
        throw new Error(`Maximum of ${MAX_API_KEYS} API keys allowed`);
      }

      // Validate name
      if (!request.name || request.name.trim().length === 0) {
        throw new Error('API key name is required');
      }

      if (request.name.length > 50) {
        throw new Error('API key name must be 50 characters or less');
      }

      // Create new API key
      const newKey: CreateApiKeyResponse = {
        id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
        name: request.name.trim(),
        key: generateApiKey(),
        created_at: new Date().toISOString(),
        last_used_at: null,
        status: 'active',
      };

      // Add to mock store
      mockApiKeys.push({ ...newKey });

      return newKey;
    },
    onSuccess: () => {
      // Invalidate and refetch the API keys list
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to create API key:', error);
    },
  });
}

/**
 * Hook to revoke an API key
 */
export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string): Promise<void> => {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 400));

      // Find and revoke the key
      const keyIndex = mockApiKeys.findIndex((key) => key.id === keyId);
      if (keyIndex === -1) {
        throw new Error('API key not found');
      }

      if (mockApiKeys[keyIndex].status === 'revoked') {
        throw new Error('API key is already revoked');
      }

      // Update the key status
      mockApiKeys[keyIndex] = {
        ...mockApiKeys[keyIndex],
        status: 'revoked',
      };
    },
    onSuccess: () => {
      // Invalidate and refetch the API keys list
      queryClient.invalidateQueries({ queryKey: API_KEYS_QUERY_KEY });
    },
    onError: (error) => {
      console.error('Failed to revoke API key:', error);
    },
  });
}

/**
 * Hook to get the count of active API keys
 */
export function useApiKeysCount() {
  const { data: keys = [] } = useApiKeys();
  const activeCount = keys.filter((key) => key.status === 'active').length;
  return {
    activeCount,
    maxKeys: MAX_API_KEYS,
    canCreateMore: activeCount < MAX_API_KEYS,
  };
}

/**
 * API Key Types
 * Types for API key management
 */

export type ApiKeyStatus = 'active' | 'revoked';

export interface ApiKey {
  id: string;
  name: string;
  key: string | null; // Only shown once after creation
  created_at: string;
  last_used_at: string | null;
  status: ApiKeyStatus;
}

export interface CreateApiKeyRequest {
  name: string;
}

export interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string; // The actual API key, shown only once
  created_at: string;
  last_used_at: string | null;
  status: ApiKeyStatus;
}

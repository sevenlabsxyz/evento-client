import { apiClient } from '../api/client';
import { Env } from '../constants/env';
import { ApiResponse } from '../types/api';

export interface StreamChatTokenResponse {
  token: string;
  user_id: string;
  expires_in: number;
}

export interface StreamChatChannel {
  id: string;
  type: string;
  name?: string;
  image?: string;
  member_count?: number;
  last_message_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StreamChatUser {
  id: string;
  name?: string;
  image?: string;
  online?: boolean;
  last_active?: string;
}

export interface DirectMessageChannelResponse {
  channel: StreamChatChannel;
  channel_id: string;
  exists: boolean;
}

export const streamChatService = {
  /**
   * Get Stream Chat token for the current authenticated user
   * GET /api/v1/stream-chat/token
   */
  getToken: async (expiration?: number): Promise<StreamChatTokenResponse> => {
    const params = expiration ? { expiration } : {};
    const response = await apiClient.get<ApiResponse<StreamChatTokenResponse>>(
      '/v1/stream-chat/token',
      { params }
    );
    return response.data;
  },

  /**
   * Sync current user with Stream Chat
   * POST /api/v1/stream-chat/users/sync
   */
  syncUser: async (forceUpdate = false): Promise<StreamChatUser> => {
    const response = await apiClient.post<ApiResponse<StreamChatUser>>(
      '/v1/stream-chat/users/sync',
      { force_update: forceUpdate }
    );
    return response.data;
  },

  /**
   * Get user's channels
   * GET /api/v1/stream-chat/channels
   */
  getChannels: async (limit = 30, offset = 0): Promise<StreamChatChannel[]> => {
    const response = await apiClient.get<ApiResponse<StreamChatChannel[]>>(
      '/v1/stream-chat/channels',
      {
        params: { limit, offset },
      }
    );
    return response.data;
  },

  /**
   * Create or get a direct message channel
   * POST /api/v1/stream-chat/channels/direct-message
   */
  createDirectMessageChannel: async (
    recipientId: string
  ): Promise<DirectMessageChannelResponse> => {
    const response = await apiClient.post<ApiResponse<DirectMessageChannelResponse>>(
      '/v1/stream-chat/channels/direct-message',
      { recipient_id: recipientId }
    );
    return response.data;
  },

  /**
   * Create a new channel
   * POST /api/v1/stream-chat/channels
   */
  createChannel: async (
    channelType: string,
    channelId: string,
    name?: string,
    members?: string[],
    image?: string
  ): Promise<StreamChatChannel> => {
    const response = await apiClient.post<ApiResponse<StreamChatChannel>>(
      '/v1/stream-chat/channels',
      {
        channel_type: channelType,
        channel_id: channelId,
        name,
        members,
        image,
      }
    );
    return response.data;
  },

  /**
   * Update a channel
   * PUT /api/v1/stream-chat/channels
   */
  updateChannel: async (
    channelType: string,
    channelId: string,
    updates: {
      name?: string;
      image?: string;
      add_members?: string[];
      remove_members?: string[];
    }
  ): Promise<StreamChatChannel> => {
    const response = await apiClient.put<ApiResponse<StreamChatChannel>>(
      '/v1/stream-chat/channels',
      {
        channel_type: channelType,
        channel_id: channelId,
        ...updates,
      }
    );
    return response.data;
  },

  /**
   * Delete a channel
   * DELETE /api/v1/stream-chat/channels
   */
  deleteChannel: async (channelType: string, channelId: string): Promise<void> => {
    await apiClient.delete('/v1/stream-chat/channels', {
      params: {
        channel_type: channelType,
        channel_id: channelId,
      },
    });
  },
};

// Helper function to get Stream Chat API key from environment
export const getStreamChatApiKey = (): string => {
  const apiKey = Env.NEXT_PUBLIC_STREAM_CHAT_API_KEY;
  if (!apiKey) {
    throw new Error('NEXT_PUBLIC_STREAM_CHAT_API_KEY environment variable is required');
  }
  return apiKey;
};

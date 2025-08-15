import { useQuery } from '@tanstack/react-query';
import { StreamChat, User } from 'stream-chat';
import { useEffect, useMemo, useState } from 'react';
import { streamChatService, getStreamChatApiKey } from '../services/stream-chat';
import { useAuth } from './use-auth';

export interface UseStreamChatOptions {
  autoConnect?: boolean;
}

export function useStreamChat(options: UseStreamChatOptions = {}) {
  const { autoConnect = true } = options;
  const { user: authUser, isAuthenticated } = useAuth();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  // Query to get Stream Chat token
  const {
    data: tokenData,
    isLoading: isLoadingToken,
    error: tokenError,
    refetch: refetchToken,
  } = useQuery({
    queryKey: ['stream-chat', 'token', authUser?.id],
    queryFn: () => streamChatService.getToken(),
    enabled: isAuthenticated && !!authUser && autoConnect,
    staleTime: 20 * 60 * 1000, // 20 minutes (tokens expire in 24h by default)
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status === 401 || status === 403) return false;
      }
      return failureCount < 3;
    },
  });

  // Query to sync user with Stream Chat
  const {
    data: streamUser,
    isLoading: isSyncingUser,
  } = useQuery({
    queryKey: ['stream-chat', 'user-sync', authUser?.id],
    queryFn: () => streamChatService.syncUser(),
    enabled: isAuthenticated && !!authUser && !!tokenData,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Create Stream Chat client instance
  const streamChatClient = useMemo(() => {
    if (!isAuthenticated || !authUser) return null;
    
    try {
      const apiKey = getStreamChatApiKey();
      return StreamChat.getInstance(apiKey);
    } catch (error) {
      console.error('Failed to create Stream Chat client:', error);
      setConnectionError('Failed to initialize chat client');
      return null;
    }
  }, [isAuthenticated, authUser]);

  // Connect to Stream Chat when token and user data are available
  useEffect(() => {
    if (!streamChatClient || !tokenData || !authUser || !autoConnect) {
      return;
    }

    let isCancelled = false;
    setIsConnecting(true);
    setConnectionError(null);

    const connectToStream = async () => {
      try {
        // Prepare user data for Stream Chat
        const streamUserData: User = {
          id: authUser.id,
          name: authUser.name || authUser.username || 'User',
          image: authUser.image || undefined,
        };

        // Connect to Stream Chat
        await streamChatClient.connectUser(streamUserData, tokenData.token);
        
        if (!isCancelled) {
          setClient(streamChatClient);
          setConnectionError(null);
        }
      } catch (error) {
        console.error('Failed to connect to Stream Chat:', error);
        if (!isCancelled) {
          setConnectionError('Failed to connect to chat service');
        }
      } finally {
        if (!isCancelled) {
          setIsConnecting(false);
        }
      }
    };

    connectToStream();

    return () => {
      isCancelled = true;
    };
  }, [streamChatClient, tokenData, authUser, autoConnect]);

  // Disconnect when user logs out
  useEffect(() => {
    if (!isAuthenticated && client) {
      client.disconnectUser();
      setClient(null);
    }
  }, [isAuthenticated, client]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, [client]);

  const isLoading = isLoadingToken || isSyncingUser || isConnecting;
  const error = tokenError || connectionError;

  return {
    client,
    isLoading,
    isConnecting,
    error,
    streamUser,
    refetchToken,
    isAuthenticated,
  };
}

// Hook specifically for getting channels
export function useStreamChatChannels() {
  const { user: authUser, isAuthenticated } = useAuth();

  return useQuery({
    queryKey: ['stream-chat', 'channels', authUser?.id],
    queryFn: () => streamChatService.getChannels(),
    enabled: isAuthenticated && !!authUser,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}
'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { getStreamChatApiKey, streamChatService } from '@/lib/services/stream-chat';
import { useQuery } from '@tanstack/react-query';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { StreamChat } from 'stream-chat';

interface StreamChatContextValue {
  client: StreamChat | null;
  isLoading: boolean;
  error: string | null;
}

const StreamChatContext = createContext<StreamChatContextValue | undefined>(undefined);

// Global singleton client instance
let globalClient: StreamChat | null = null;

export function StreamChatProvider({ children }: { children: React.ReactNode }) {
  const { user: authUser, isAuthenticated } = useAuth();
  const [client, setClient] = useState<StreamChat | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const connectionAttemptRef = useRef<boolean>(false);

  // Query to get Stream Chat token
  const {
    data: tokenData,
    isLoading: isLoadingToken,
    error: tokenError,
  } = useQuery({
    queryKey: ['stream-chat', 'token', authUser?.id],
    queryFn: () => streamChatService.getToken(),
    enabled: isAuthenticated && !!authUser,
    staleTime: 20 * 60 * 1000, // 20 minutes
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = (error as any).status;
        if (status === 401 || status === 403) return false;
      }
      return failureCount < 3;
    },
  });

  // Query to sync user with Stream Chat
  const { data: streamUser, isLoading: isSyncingUser } = useQuery({
    queryKey: ['stream-chat', 'user-sync', authUser?.id],
    queryFn: () => streamChatService.syncUser(),
    enabled: isAuthenticated && !!authUser && !!tokenData,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  // Initialize or get existing Stream Chat client
  useEffect(() => {
    if (!isAuthenticated || !authUser || !tokenData) {
      return;
    }

    // Prevent multiple connection attempts
    if (connectionAttemptRef.current) {
      return;
    }

    const initializeClient = async () => {
      try {
        connectionAttemptRef.current = true;
        setIsConnecting(true);
        setConnectionError(null);

        // Check if we already have a global client connected
        if (globalClient) {
          const currentUser = globalClient.user;

          // If same user is already connected, reuse the client
          if (currentUser && currentUser.id === authUser.id) {
            setClient(globalClient);
            setIsConnecting(false);
            return;
          }

          // Different user, disconnect the old one
          await globalClient.disconnectUser();
          globalClient = null;
        }

        // Create new client instance
        const apiKey = getStreamChatApiKey();
        const newClient = StreamChat.getInstance(apiKey);

        // Connect the user
        await newClient.connectUser(
          {
            id: authUser.id,
            name: authUser.name || authUser.username || 'User',
            image: authUser.image || undefined,
          },
          tokenData.token
        );

        // Store as global client
        globalClient = newClient;
        setClient(newClient);
        setConnectionError(null);
      } catch (error) {
        console.error('Failed to connect to Stream Chat:', error);
        setConnectionError('Failed to connect to chat service');
      } finally {
        setIsConnecting(false);
        connectionAttemptRef.current = false;
      }
    };

    initializeClient();
  }, [isAuthenticated, authUser, tokenData]);

  // Only disconnect when user logs out
  useEffect(() => {
    if (!isAuthenticated && globalClient) {
      globalClient.disconnectUser().then(() => {
        globalClient = null;
        setClient(null);
      });
    }
  }, [isAuthenticated]);

  const isLoading = isLoadingToken || isSyncingUser || isConnecting;
  const error = tokenError || connectionError;

  return (
    <StreamChatContext.Provider value={{ client, isLoading, error: error as string | null }}>
      {children}
    </StreamChatContext.Provider>
  );
}

export function useStreamChatClient() {
  const context = useContext(StreamChatContext);
  if (context === undefined) {
    throw new Error('useStreamChatClient must be used within a StreamChatProvider');
  }
  return context;
}

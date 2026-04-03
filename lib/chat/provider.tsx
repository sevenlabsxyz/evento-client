'use client';

import { EventoChatRuntime } from '@/lib/chat/runtime';
import type { ChatRuntimeSnapshot } from '@/lib/chat/types';
import { useAuth } from '@/lib/hooks/use-auth';
import type { UserDetails } from '@/lib/types/api';
import { logger } from '@/lib/utils/logger';
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

interface ChatContextValue extends ChatRuntimeSnapshot {
  completeOnboarding: () => Promise<void>;
  openDirectConversation: (target: {
    userId: string;
    username?: string;
    name?: string;
    image?: string | null;
    verification_status?: UserDetails['verification_status'];
    nostr_pubkey?: string;
    nip05?: string;
  }) => Promise<string>;
  sendMessage: (conversationId: string, content: string) => Promise<void>;
  markConversationSeen: (conversationId: string) => void;
  getSecretKeyNsec: () => string | null;
  isOpeningDirectConversation: boolean;
  openingDirectConversationUserIds: string[];
}

const initialSnapshot: ChatRuntimeSnapshot = {
  status: 'idle',
  conversations: [],
  messagesByConversation: {},
  currentUserParticipant: null,
  error: null,
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const runtimeRef = useRef<EventoChatRuntime | null>(null);
  const [snapshot, setSnapshot] = useState<ChatRuntimeSnapshot>(initialSnapshot);
  const [openingDirectConversationCounts, setOpeningDirectConversationCounts] = useState<
    Record<string, number>
  >({});

  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      runtimeRef.current?.destroy();
      runtimeRef.current = null;
      setSnapshot(initialSnapshot);
      setOpeningDirectConversationCounts({});
      return;
    }

    const runtime = new EventoChatRuntime(user);
    runtimeRef.current = runtime;
    setOpeningDirectConversationCounts({});

    const unsubscribe = runtime.subscribe(() => {
      startTransition(() => {
        setSnapshot(runtime.getSnapshot());
      });
    });

    startTransition(() => {
      setSnapshot(runtime.getSnapshot());
    });

    void runtime.start();

    return () => {
      unsubscribe();
      runtime.destroy();
      if (runtimeRef.current === runtime) {
        runtimeRef.current = null;
      }
    };
  }, [isAuthenticated, user]);

  const completeOnboarding = useCallback(async () => {
    if (!runtimeRef.current) {
      throw new Error('Chat runtime is not available');
    }
    await runtimeRef.current.completeOnboarding();
  }, []);

  const openDirectConversation = useCallback<ChatContextValue['openDirectConversation']>(
    async (target) => {
      if (!runtimeRef.current) {
        throw new Error('Chat runtime is not available');
      }
      logger.warn('Chat provider: openDirectConversation', {
        targetUserId: target.userId,
        targetUsername: target.username,
      });
      setOpeningDirectConversationCounts((previous) => ({
        ...previous,
        [target.userId]: (previous[target.userId] ?? 0) + 1,
      }));

      try {
        const conversationId = await runtimeRef.current.openDirectConversation(target);
        logger.warn('Chat provider: openDirectConversation success', {
          conversationId,
          targetUserId: target.userId,
        });
        return conversationId;
      } catch (error) {
        logger.error('Chat provider: openDirectConversation failed', {
          targetUserId: target.userId,
          error,
        });
        throw error;
      } finally {
        setOpeningDirectConversationCounts((previous) => {
          const nextCount = (previous[target.userId] ?? 0) - 1;
          if (nextCount > 0) {
            return {
              ...previous,
              [target.userId]: nextCount,
            };
          }

          const { [target.userId]: _removed, ...remaining } = previous;
          return remaining;
        });
      }
    },
    []
  );

  const sendMessage = useCallback<ChatContextValue['sendMessage']>(
    async (conversationId, content) => {
      if (!runtimeRef.current) {
        throw new Error('Chat runtime is not available');
      }
      await runtimeRef.current.sendMessage(conversationId, content);
    },
    []
  );

  const markConversationSeen = useCallback((conversationId: string) => {
    runtimeRef.current?.markConversationSeen(conversationId);
  }, []);

  const getSecretKeyNsec = useCallback(() => {
    return runtimeRef.current?.getSecretKeyNsec() ?? null;
  }, []);

  const openingDirectConversationUserIds = useMemo(
    () => Object.keys(openingDirectConversationCounts),
    [openingDirectConversationCounts]
  );
  const isOpeningDirectConversation = openingDirectConversationUserIds.length > 0;

  const value = useMemo<ChatContextValue>(
    () => ({
      ...snapshot,
      completeOnboarding,
      openDirectConversation,
      sendMessage,
      markConversationSeen,
      getSecretKeyNsec,
      isOpeningDirectConversation,
      openingDirectConversationUserIds,
    }),
    [
      snapshot,
      completeOnboarding,
      openDirectConversation,
      sendMessage,
      markConversationSeen,
      getSecretKeyNsec,
      isOpeningDirectConversation,
      openingDirectConversationUserIds,
    ]
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

'use client';

import { useChat } from '@/lib/chat/provider';
import { getErrorMessage } from '@/lib/utils/error';
import { logger } from '@/lib/utils/logger';
import { toast } from '@/lib/utils/toast';
import { MessageSquare } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useRef } from 'react';

export default function MessagesPage() {
  const {
    openDirectConversation,
    status,
    isOpeningDirectConversation,
    openingDirectConversationUserIds,
  } = useChat();
  const searchParams = useSearchParams();
  const router = useRouter();
  const pendingUserIdRef = useRef<string | null>(null);

  const pendingUserId = searchParams.get('user');
  const isStartingConversationFromQuery =
    !!pendingUserId && openingDirectConversationUserIds.includes(pendingUserId);

  useEffect(() => {
    const userId = searchParams.get('user');

    if (!userId || status !== 'ready') {
      if (userId) {
        logger.warn('Messages page: openDirectConversation skipped; runtime not ready', {
          userId,
          status,
        });
      }
      return;
    }

    if (pendingUserIdRef.current === userId) {
      return;
    }
    pendingUserIdRef.current = userId;

    void openDirectConversation({ userId })
      .then((conversationId) => {
        logger.warn('Messages page: openDirectConversation success', {
          userId,
          conversationId,
        });
        router.replace(`/e/messages/${conversationId}`);
      })
      .catch((error: unknown) => {
        pendingUserIdRef.current = null;
        logger.error('Messages page: openDirectConversation failed', {
          userId,
          error,
        });
        toast.error(getErrorMessage(error, 'Failed to start chat'));
      });
  }, [openDirectConversation, router, searchParams, status]);

  useEffect(() => {
    if (!searchParams.get('user')) {
      pendingUserIdRef.current = null;
    }
  }, [searchParams]);

  return (
    <>
      <div className='hidden h-full flex-col items-center justify-center bg-gray-50 md:flex'>
        <div className='text-center'>
          {isStartingConversationFromQuery || isOpeningDirectConversation ? (
            <>
              <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-200'>
                <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500' />
              </div>
              <h2 className='mb-2 text-xl font-semibold text-gray-900'>Starting secure chat...</h2>
              <p className='text-sm text-gray-500'>Checking relay and key package availability</p>
            </>
          ) : (
            <>
              <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-200'>
                <MessageSquare className='h-8 w-8 text-gray-400' />
              </div>
              <h2 className='mb-2 text-xl font-semibold text-gray-900'>Select a conversation</h2>
              <p className='text-sm text-gray-500'>
                Choose a chat from the list on the left or start a new one
              </p>
            </>
          )}
        </div>
      </div>

      <div className='flex h-full flex-col items-center justify-center bg-white md:hidden'>
        <div className='px-4 text-center'>
          {isStartingConversationFromQuery || isOpeningDirectConversation ? (
            <>
              <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100'>
                <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500' />
              </div>
              <h2 className='mb-2 text-xl font-semibold text-gray-900'>Starting secure chat...</h2>
              <p className='text-sm text-gray-500'>Please wait while we connect the conversation</p>
            </>
          ) : (
            <>
              <div className='mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100'>
                <MessageSquare className='h-8 w-8 text-gray-400' />
              </div>
              <h2 className='mb-2 text-xl font-semibold text-gray-900'>No conversation selected</h2>
              <p className='text-sm text-gray-500'>Select a chat from your messages list</p>
            </>
          )}
        </div>
      </div>
    </>
  );
}

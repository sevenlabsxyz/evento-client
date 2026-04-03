'use client';

import {
  ChatInput,
  ChatInputSubmit,
  ChatInputTextarea,
  ChatInputToolbar,
} from '@/components/ui/chat-input';
import { Skeleton } from '@/components/ui/skeleton';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useChat } from '@/lib/chat/provider';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useTopBar } from '@/lib/stores/topbar-store';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

export default function SingleChatPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const conversationId = typeof params.id === 'string' ? params.id : '';
  const [inputValue, setInputValue] = useState('');
  const { applyRouteConfig, setTopBarForRoute, clearRoute, setBackHandler } = useTopBar();
  const { conversations, messagesByConversation, sendMessage, markConversationSeen } = useChat();

  const conversation = useMemo(
    () => conversations.find((item) => item.id === conversationId) ?? null,
    [conversationId, conversations]
  );
  const messages = messagesByConversation[conversationId] ?? [];

  useEffect(() => {
    if (!conversation) {
      return;
    }

    const isMobile = window.innerWidth < 768;

    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      leftMode: isMobile ? 'back' : 'menu',
      showAvatar: false,
      centerMode: 'chat-partner',
      buttons: [],
      chatPartner: {
        name: conversation.participant.name,
        image: conversation.participant.image ?? undefined,
        username: conversation.participant.username,
      },
    });

    if (isMobile) {
      setBackHandler(() => router.push('/e/messages'));
    }

    return () => {
      clearRoute(pathname);
      setBackHandler(null);
    };
  }, [applyRouteConfig, clearRoute, conversation, pathname, router, setBackHandler, setTopBarForRoute]);

  useEffect(() => {
    if (conversationId) {
      markConversationSeen(conversationId);
    }
  }, [conversationId, markConversationSeen, messages.length]);

  const handleSubmit = async (event?: React.FormEvent) => {
    event?.preventDefault();

    if (!conversation || !inputValue.trim()) {
      return;
    }

    await sendMessage(conversation.id, inputValue);
    setInputValue('');
  };

  if (isCheckingAuth) {
    return (
      <div className='flex h-full items-center justify-center bg-white'>
        <Skeleton className='h-8 w-8 animate-spin rounded-full' />
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className='flex h-full items-center justify-center bg-white'>
        <div className='text-center'>
          <div className='mb-4 text-red-500'>
            <svg
              className='mx-auto h-12 w-12'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          </div>
          <p className='font-medium text-red-600'>Unable to load conversation</p>
          <p className='mt-1 text-sm text-gray-500'>Please try starting the chat again</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full flex-col bg-white'>
      <div className='min-h-0 flex-1 overflow-y-auto bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fafc_100%)] px-4 py-4 md:px-6'>
        <div className='mx-auto flex max-w-3xl flex-col gap-3'>
          {messages.length === 0 ? (
            <div className='flex min-h-[40vh] items-center justify-center'>
              <div className='max-w-sm text-center'>
                <div className='mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100'>
                  <UserAvatar
                    user={{
                      name: conversation.participant.name,
                      username: conversation.participant.username,
                      image: conversation.participant.image,
                      verification_status: conversation.participant.verificationStatus,
                    }}
                    size='base'
                  />
                </div>
                <h2 className='text-lg font-semibold text-gray-900'>
                  Start your chat with {conversation.participant.name}
                </h2>
                <p className='mt-2 text-sm leading-6 text-gray-500'>
                  Messages in this thread are end-to-end encrypted through Marmot.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.isMine ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-[1.4rem] px-4 py-3 text-sm leading-6 shadow-sm md:max-w-[70%] ${
                    message.isMine
                      ? 'rounded-br-md bg-red-500 text-white'
                      : 'rounded-bl-md bg-white text-gray-900 ring-1 ring-black/5'
                  }`}
                >
                  {!message.isMine ? (
                    <p className='mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400'>
                      {message.sender.name}
                    </p>
                  ) : null}
                  <p className='whitespace-pre-wrap break-words'>{message.content}</p>
                  <p
                    className={`mt-2 text-[11px] ${
                      message.isMine ? 'text-red-100' : 'text-gray-400'
                    }`}
                  >
                    {new Date(message.createdAt).toLocaleTimeString([], {
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className='border-t bg-white p-4'>
        <div className='mx-auto max-w-3xl'>
          <ChatInput onSubmit={handleSubmit}>
            <ChatInputTextarea
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              placeholder={`Message ${conversation.participant.name}`}
            />
            <ChatInputToolbar className='justify-end'>
              <ChatInputSubmit disabled={!inputValue.trim()} />
            </ChatInputToolbar>
          </ChatInput>
        </div>
      </div>
    </div>
  );
}

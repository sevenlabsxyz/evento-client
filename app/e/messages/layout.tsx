'use client';

import { ChatOnboarding } from '@/components/chat/chat-onboarding';
import { ConversationList } from '@/components/chat/conversation-list';
import { ChatSettingsSheet } from '@/components/messages/chat-settings-sheet';
import NewChatSheet from '@/components/messages/new-chat-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useChat } from '@/lib/chat/provider';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useTopBar } from '@/lib/stores/topbar-store';
import { MessageSquarePlus, Plus, Settings } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function MessagesLayout({ children }: { children: React.ReactNode }) {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();
  const pathname = usePathname();
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [isChatSettingsOpen, setIsChatSettingsOpen] = useState(false);
  const { status, conversations, error, completeOnboarding, getSecretKeyNsec } = useChat();

  const isMessageListPage = pathname === '/e/messages';

  useEffect(() => {
    applyRouteConfig(pathname);
    setTopBarForRoute(pathname, {
      title: 'Chat',
      subtitle: '',
      showAvatar: true,
      leftMode: 'menu',
      centerMode: 'title',
      buttons: [
        {
          id: 'new-chat',
          icon: MessageSquarePlus,
          label: 'New Chat',
          onClick: () => setIsNewChatOpen(true),
        },
        ...(status === 'ready'
          ? [
              {
                id: 'chat-settings',
                icon: Settings,
                label: 'Chat Settings',
                onClick: () => setIsChatSettingsOpen(true),
              },
            ]
          : []),
      ],
    });
    return () => clearRoute(pathname);
  }, [pathname, setTopBarForRoute, clearRoute, applyRouteConfig, status]);

  if (isCheckingAuth || status === 'idle' || status === 'initializing') {
    return (
      <div className='flex h-[calc(100vh-4rem)] w-full flex-col bg-white md:flex-row'>
        <div
          className={`w-full border-b border-gray-200 bg-gray-50 md:block md:w-80 md:shrink-0 md:border-b-0 md:border-r ${isMessageListPage ? 'block' : 'hidden'}`}
        >
          <div className='p-4'>
            <Skeleton className='mb-4 h-10 w-full' />
            {[0, 1, 2, 3, 4].map((index) => (
              <div key={index} className='mb-3 flex items-center gap-3'>
                <Skeleton className='h-12 w-12 rounded-full' />
                <div className='flex-1'>
                  <Skeleton className='mb-2 h-4 w-3/4' />
                  <Skeleton className='h-3 w-1/2' />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div
          className={`flex-1 overflow-hidden ${isMessageListPage ? 'hidden md:block' : 'block'}`}
        >
          <div className='flex h-full items-center justify-center'>
            <Skeleton className='h-8 w-8 animate-spin rounded-full' />
          </div>
        </div>
      </div>
    );
  }

  if (status === 'needs-onboarding') {
    return <ChatOnboarding isLoading={false} onStart={completeOnboarding} />;
  }

  if (status === 'error') {
    return (
      <div className='flex h-[calc(100vh-4rem)] w-full flex-col items-center justify-center bg-white'>
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
          <p className='font-medium text-red-600'>Failed to load secure chat</p>
          <p className='mt-1 text-sm text-gray-500'>{error ?? 'Please try refreshing the page'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-[calc(100vh-4rem)] w-full flex-col bg-white md:flex-row'>
      <div
        className={`w-full border-b border-gray-200 bg-gray-50 md:block md:w-80 md:shrink-0 md:border-b-0 md:border-r ${isMessageListPage ? 'block' : 'hidden'}`}
      >
        <div className='h-full overflow-hidden'>
          <ConversationList
            conversations={conversations}
            activeConversationId={isMessageListPage ? null : pathname.split('/').pop()}
          />
        </div>
      </div>

      <div
        className={`flex flex-1 flex-col overflow-hidden ${isMessageListPage ? 'hidden md:flex' : 'flex'}`}
      >
        {children}
      </div>

      <button
        type='button'
        onClick={() => setIsNewChatOpen(true)}
        aria-label='Start new chat'
        className='absolute bottom-24 right-4 z-20 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white shadow-lg hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-400 md:hidden'
      >
        <Plus className='h-6 w-6' />
      </button>

      <ChatSettingsSheet
        open={isChatSettingsOpen}
        onOpenChange={setIsChatSettingsOpen}
        getSecretKeyNsec={getSecretKeyNsec}
      />

      <NewChatSheet isOpen={isNewChatOpen} onClose={() => setIsNewChatOpen(false)} />
    </div>
  );
}

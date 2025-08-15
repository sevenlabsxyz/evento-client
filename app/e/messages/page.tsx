'use client';

import { Navbar } from '@/components/navbar';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useStreamChatClient } from '@/lib/providers/stream-chat-provider';
import { useTopBar } from '@/lib/stores/topbar-store';
import type { ChannelFilters, ChannelOptions, ChannelSort } from 'stream-chat';
import { ChannelList, Chat } from 'stream-chat-react';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CustomChannelPreview } from './CustomChannelPreview';

import './chat-layout.css';
import './stream-chat.d.ts';

export default function ChatPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();
  const pathname = usePathname();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('messages');

  // Use Stream Chat from the provider
  const { client, isLoading: isLoadingStream, error: streamError } = useStreamChatClient();

  // Set TopBar content
  useEffect(() => {
    // Apply any existing configuration for this route
    applyRouteConfig(pathname);

    // Set configuration for this specific route
    setTopBarForRoute(pathname, {
      title: 'Chat',
      subtitle: '',
      showAvatar: true,
      leftMode: 'menu',
      centerMode: 'title',
    });

    // Cleanup on unmount
    return () => {
      clearRoute(pathname);
    };
  }, [pathname, setTopBarForRoute, clearRoute, applyRouteConfig]);

  // Channel configuration - now uses authenticated user's ID
  const sort: ChannelSort = { last_message_at: -1 };
  const filters: ChannelFilters = {
    type: 'messaging',
    members: { $in: [client?.user?.id || ''] },
  };
  const options: ChannelOptions = {
    limit: 10,
  };

  // Show loading state during authentication or Stream Chat setup
  if (isCheckingAuth || isLoadingStream) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='flex flex-1 items-center justify-center pb-20'>
          <div className='text-center'>
            <div className='mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
            <p>{isCheckingAuth ? 'Authenticating...' : 'Setting up chat connection...'}</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if Stream Chat fails to connect
  if (streamError || !client) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='flex flex-1 items-center justify-center pb-20'>
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
            <p className='font-medium text-red-600'>Failed to connect to chat</p>
            <p className='mt-1 text-sm text-gray-500'>
              {streamError || 'Please try refreshing the page'}
            </p>
          </div>
        </div>
        <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  return (
    <div className='mx-auto flex min-h-screen max-w-full flex-col overflow-hidden bg-white md:max-w-sm'>
      <Chat client={client} theme='str-chat__theme-custom'>
        <div className='str-chat__channel-list-container'>
          <ChannelList
            filters={filters}
            sort={sort}
            options={options}
            Preview={CustomChannelPreview}
            showChannelSearch
            additionalChannelSearchProps={{
              searchForChannels: true,
              searchQueryParams: {
                channelFilters: {
                  filters: { members: { $in: [client.user?.id || ''] } },
                },
              },
            }}
          />
        </div>
      </Chat>

      {/* Bottom Navbar */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

'use client';

import { Navbar } from '@/components/navbar';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useTopBar } from '@/lib/stores/topbar-store';
import type { ChannelFilters, ChannelOptions, ChannelSort, User } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  ChannelList,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
  useCreateChatClient,
} from 'stream-chat-react';
import { EmojiPicker } from 'stream-chat-react/emojis';

import { init, SearchIndex } from 'emoji-mart';
import data from '@emoji-mart/data';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import './chat-layout.css';
import './stream-chat.d.ts';

// Stream Chat configuration using the provided credentials from the tutorial
const apiKey = 'dz5f4d5kzrue';
const userId = 'tight-surf-4';
const userName = 'tight';
const userToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoidGlnaHQtc3VyZi00IiwiZXhwIjoxNzU1MjkwNjA3fQ.KRTlf-IFLkEmdvu-g9m4JPzZqb8Ja86s8ncv83QCnFQ';

const user: User = {
  id: userId,
  name: userName,
  image: `https://getstream.io/random_png/?name=${userName}`,
};

const sort: ChannelSort = { last_message_at: -1 };
const filters: ChannelFilters = {
  type: 'messaging',
  members: { $in: [userId] },
};
const options: ChannelOptions = {
  limit: 10,
};

// Initialize emoji-mart
init({ data });

export default function ChatPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();
  const pathname = usePathname();
  const [activeTab, setActiveTab] = useState('messages');

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

  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: user,
  });

  // Set up a demo channel and message when client is ready
  useEffect(() => {
    if (!client) return;

    const initDemoChannel = async () => {
      try {
        // Create or get a demo channel
        const channel = client.channel('messaging', 'demo_channel', {
          image: 'https://getstream.io/random_png/?name=evento',
          name: 'Evento Chat Demo',
          members: [userId],
        });

        // Watch the channel to make it active
        await channel.watch();

        // Send a welcome message if it's a new channel
        const state = channel.state;
        if (state.messages.length === 0) {
          await channel.sendMessage({
            text: '👋 Welcome to Evento Chat! This is powered by Stream Chat SDK. Try sending a message!',
          });
        }
      } catch (error) {
        console.error('Failed to initialize demo channel:', error);
      }
    };

    initDemoChannel();
  }, [client]);

  if (isCheckingAuth) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='flex flex-1 items-center justify-center pb-20'>
          <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500'></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='flex flex-1 items-center justify-center pb-20'>
          <div className='text-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500 mx-auto mb-4'></div>
            <p>Setting up chat connection...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
      <Chat client={client} theme='str-chat__theme-custom'>
        <div className='str-chat__container'>
          <ChannelList filters={filters} sort={sort} options={options} />
          <Channel EmojiPicker={EmojiPicker} emojiSearchIndex={SearchIndex}>
            <Window>
              <ChannelHeader />
              <MessageList />
              <MessageInput />
            </Window>
            <Thread />
          </Channel>
        </div>
      </Chat>

      {/* Bottom Navbar */}
      <Navbar activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

'use client';

import { Button } from '@/components/ui/button';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import type { Channel as StreamChannel, User } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
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
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import '../chat-layout.css';
import '../stream-chat.d.ts';

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

// Initialize emoji-mart
init({ data });

export default function SingleChatPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const [channel, setChannel] = useState<StreamChannel>();

  const client = useCreateChatClient({
    apiKey,
    tokenOrProvider: userToken,
    userData: user,
  });

  // Set up the specific channel based on the ID parameter
  useEffect(() => {
    if (!client || !params.id) return;

    const initSpecificChannel = async () => {
      try {
        // Create or get the specific channel based on the ID
        const channelId = `chat_${params.id}`;
        const targetChannel = client.channel('messaging', channelId, {
          image: 'https://getstream.io/random_png/?name=chat',
          name: `Chat ${params.id}`,
          members: [userId],
        });

        // Watch the channel to make it active
        await targetChannel.watch();
        setChannel(targetChannel);

        // Send a welcome message if it's a new channel
        const state = targetChannel.state;
        if (state.messages.length === 0) {
          await targetChannel.sendMessage({
            text: `Welcome to Chat ${params.id}! 👋`,
          });
        }
      } catch (error) {
        console.error('Failed to initialize specific channel:', error);
      }
    };

    initSpecificChannel();
  }, [client, params.id]);

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
      {/* Custom Header with Back Button */}
      <div className='fixed left-1/2 top-0 z-40 w-full max-w-full -translate-x-1/2 transform border-b border-gray-100 bg-white md:max-w-sm'>
        <div className='px-4 pb-0 pt-6'>
          <div className='mb-2 flex items-center gap-3'>
            <Button 
              variant='ghost' 
              size='icon' 
              className='h-8 w-8' 
              onClick={() => router.back()}
            >
              <ArrowLeft className='h-5 w-5' />
            </Button>
            <div className='flex-1'>
              <h3 className='text-lg font-bold text-black'>Chat {params.id}</h3>
              <p className='text-sm text-gray-500'>Stream Chat Demo</p>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Content */}
      <div className='pt-[100px] flex-1'>
        <Chat client={client} theme='str-chat__theme-custom'>
          <Channel 
            channel={channel} 
            EmojiPicker={EmojiPicker} 
            emojiSearchIndex={SearchIndex}
          >
            <Window>
              <MessageList />
              <MessageInput />
            </Window>
            <Thread />
          </Channel>
        </Chat>
      </div>
    </div>
  );
}

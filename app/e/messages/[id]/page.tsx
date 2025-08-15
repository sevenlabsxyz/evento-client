'use client';

import { Button } from '@/components/ui/button';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useStreamChat } from '@/lib/hooks/use-stream-chat';
import type { Channel as StreamChannel } from 'stream-chat';
import {
  Channel,
  ChannelHeader,
  Chat,
  MessageInput,
  MessageList,
  Thread,
  Window,
} from 'stream-chat-react';
import { EmojiPicker } from 'stream-chat-react/emojis';

import { init, SearchIndex } from 'emoji-mart';
import data from '@emoji-mart/data';
import { ArrowLeft } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import '../chat-layout.css';
import '../stream-chat.d.ts';

// Initialize emoji-mart
init({ data });

export default function SingleChatPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const params = useParams();
  const [channel, setChannel] = useState<StreamChannel>();
  const [channelError, setChannelError] = useState<string | null>(null);

  // Use the new Stream Chat hook with backend integration
  const { client, isLoading: isLoadingStream, error: streamError } = useStreamChat();

  // Set up the specific channel based on the ID parameter
  useEffect(() => {
    if (!client || !params.id || typeof params.id !== 'string') return;

    const initSpecificChannel = async () => {
      try {
        setChannelError(null);
        
        // Create or get the specific channel based on the ID
        const channelId = `chat_${params.id}`;
        const targetChannel = client.channel('messaging', channelId, {
          image: 'https://getstream.io/random_png/?name=chat',
          name: `Chat ${params.id}`,
          members: [client.user?.id],
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
        setChannelError('Failed to load chat channel');
      }
    };

    initSpecificChannel();
  }, [client, params.id]);

  // Show loading state during authentication or Stream Chat setup
  if (isCheckingAuth || isLoadingStream) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='flex flex-1 items-center justify-center pb-20'>
          <div className='text-center'>
            <div className='h-8 w-8 animate-spin rounded-full border-b-2 border-red-500 mx-auto mb-4'></div>
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
              <svg className='mx-auto h-12 w-12' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z' />
              </svg>
            </div>
            <p className='text-red-600 font-medium'>Failed to connect to chat</p>
            <p className='text-sm text-gray-500 mt-1'>{streamError || 'Please try refreshing the page'}</p>
            <Button 
              variant='outline' 
              className='mt-4' 
              onClick={() => router.back()}
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Show channel error if specific channel fails to load
  if (channelError) {
    return (
      <div className='mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm'>
        <div className='flex flex-1 items-center justify-center pb-20'>
          <div className='text-center'>
            <div className='mb-4 text-red-500'>
              <svg className='mx-auto h-12 w-12' fill='none' viewBox='0 0 24 24' stroke='currentColor'>
                <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z' />
              </svg>
            </div>
            <p className='text-red-600 font-medium'>{channelError}</p>
            <p className='text-sm text-gray-500 mt-1'>Chat {params.id} could not be loaded</p>
            <Button 
              variant='outline' 
              className='mt-4' 
              onClick={() => router.back()}
            >
              <ArrowLeft className='h-4 w-4 mr-2' />
              Go Back
            </Button>
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

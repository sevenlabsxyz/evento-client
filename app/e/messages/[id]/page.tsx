'use client';

import { Button } from '@/components/ui/button';
import {
  ChatInput,
  ChatInputButton,
  ChatInputSubmit,
  ChatInputTextarea,
  ChatInputToolbar,
} from '@/components/ui/chat-input';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useStreamChatClient } from '@/lib/providers/stream-chat-provider';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { init } from 'emoji-mart';
import type { ChannelFilters, MessageResponse, Channel as StreamChannel } from 'stream-chat';
import { Channel, Window } from 'stream-chat-react';

import { ArrowLeft, Paperclip, Smile } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useTopBar } from '@/lib/stores/topbar-store';

import { AttachmentPreview } from '@/components/chat/attachment-preview';
import { PinnedMessageBanner } from '@/components/chat/pinned-message-banner';
import { Skeleton } from '@/components/ui/skeleton';
import { useMessageActions } from '@/lib/hooks/use-message-actions';
import { MessageList } from 'stream-chat-react';
import '../chat-layout.css';
import '../stream-chat.d.ts';

init({ data });

export default function SingleChatPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [channel, setChannel] = useState<StreamChannel>();
  const [channelError, setChannelError] = useState<string | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pinnedMessages, setPinnedMessages] = useState<MessageResponse[]>([]);
  const [currentPinnedIndex, setCurrentPinnedIndex] = useState(0);
  const { applyRouteConfig, setTopBarForRoute, clearRoute, setBackHandler } = useTopBar();

  const { handlePin } = useMessageActions(channel);
  const { client, isLoading: isLoadingStream, error: streamError } = useStreamChatClient();

  useEffect(() => {
    if (!client || !params.id || typeof params.id !== 'string') return;

    const initSpecificChannel = async () => {
      try {
        setChannelError(null);
        const channelId = params.id;

        const channelFilter = {
          type: 'messaging',
          id: channelId,
          members: { $in: [client.user?.id || ''] },
        };

        const channels = await client.queryChannels(
          channelFilter as ChannelFilters,
          {},
          { limit: 1 }
        );

        if (channels.length > 0) {
          const targetChannel = channels[0];
          await targetChannel.watch();
          setChannel(targetChannel);

          const pinnedMsgs = targetChannel.state.pinnedMessages || [];
          if (pinnedMsgs.length > 0) {
            setPinnedMessages(pinnedMsgs as unknown as MessageResponse[]);
            setCurrentPinnedIndex(0);
          }

          const handleMessageUpdated = (event: any) => {
            if (event.message) {
              if (event.message.pinned) {
                setPinnedMessages((prev) => {
                  const existing = prev.find((msg) => msg.id === event.message.id);
                  if (!existing) {
                    return [...prev, event.message];
                  }
                  return prev.map((msg) => (msg.id === event.message.id ? event.message : msg));
                });
              } else {
                setPinnedMessages((prev) => {
                  const filtered = prev.filter((msg) => msg.id !== event.message.id);
                  setCurrentPinnedIndex((currentIndex) => {
                    if (filtered.length === 0) {
                      return 0;
                    }
                    const removedIndex = prev.findIndex((msg) => msg.id === event.message.id);
                    if (removedIndex < currentIndex) {
                      return Math.max(0, currentIndex - 1);
                    }
                    if (removedIndex === currentIndex) {
                      return Math.min(currentIndex, filtered.length - 1);
                    }
                    return currentIndex;
                  });
                  return filtered;
                });
              }
            }
          };

          const handleMessageDeleted = (event: any) => {
            if (event.message) {
              setPinnedMessages((prev) => {
                const filtered = prev.filter((msg) => msg.id !== event.message.id);
                setCurrentPinnedIndex((currentIndex) => {
                  if (filtered.length === 0) {
                    return 0;
                  }
                  const removedIndex = prev.findIndex((msg) => msg.id === event.message.id);
                  if (removedIndex < currentIndex) {
                    return Math.max(0, currentIndex - 1);
                  }
                  if (removedIndex === currentIndex) {
                    return Math.min(currentIndex, filtered.length - 1);
                  }
                  return currentIndex;
                });
                return filtered;
              });
            }
          };

          targetChannel.on('message.updated', handleMessageUpdated);
          targetChannel.on('message.deleted', handleMessageDeleted);

          return () => {
            targetChannel.off('message.updated', handleMessageUpdated);
            targetChannel.off('message.deleted', handleMessageDeleted);
          };
        } else {
          setChannelError('Channel not found or you are not a member');
        }
      } catch (error) {
        console.error('Failed to initialize specific channel:', error);
        setChannelError('Failed to load chat channel');
      }
    };

    initSpecificChannel();
  }, [client, params.id]);

  useEffect(() => {
    if (channel) {
      const currentUserId = client?.user?.id;
      const members = Object.values(channel.state.members || {});
      const chatPartner = members.find((member) => member.user?.id !== currentUserId)?.user;

      const isMobile = window.innerWidth < 768;

      applyRouteConfig(pathname);
      setTopBarForRoute(pathname, {
        leftMode: isMobile ? 'back' : 'menu',
        showAvatar: false,
        centerMode: 'chat-partner',
        buttons: [],
        chatPartner: chatPartner
          ? {
              name: chatPartner.name || chatPartner.id || 'Unknown User',
              image: chatPartner.image,
              username: chatPartner.username,
            }
          : undefined,
      });

      if (isMobile) {
        setBackHandler(() => router.push('/e/messages'));
      }
    }

    return () => {
      clearRoute(pathname);
      setBackHandler(null);
    };
  }, [
    pathname,
    applyRouteConfig,
    channel,
    client?.user?.id,
    pinnedMessages,
    router,
    setBackHandler,
    clearRoute,
  ]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && attachments.length === 0) || !channel || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const uploadedAttachments = [];

      for (const file of attachments) {
        try {
          if (file.type.startsWith('image/')) {
            const response = await channel.sendImage(file);
            uploadedAttachments.push({
              type: 'image',
              image_url: response.file,
              fallback: file.name,
            });
          } else {
            const response = await channel.sendFile(file);
            uploadedAttachments.push({
              type: 'file',
              asset_url: response.file,
              title: file.name,
              fallback: file.name,
            });
          }
        } catch (uploadError) {
          console.error('Failed to upload file:', uploadError);
        }
      }

      const messageData: any = {};

      if (inputValue.trim()) {
        messageData.text = inputValue.trim();
      }

      if (uploadedAttachments.length > 0) {
        messageData.attachments = uploadedAttachments;
      }

      await channel.sendMessage(messageData);
      setInputValue('');
      setAttachments([]);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmojiSelect = (emoji: any) => {
    setInputValue((prev) => prev + emoji.native);
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUnpinMessage = async () => {
    const currentMessage = pinnedMessages[currentPinnedIndex];
    if (currentMessage) {
      await handlePin(currentMessage.id, true);
    }
  };

  const handleNextPinnedMessage = () => {
    if (pinnedMessages.length > 1) {
      setCurrentPinnedIndex((prev) => {
        const newIndex = (prev + 1) % pinnedMessages.length;
        const nextMessage = pinnedMessages[newIndex];

        if (nextMessage && channel) {
          setTimeout(() => {
            const messageElement = document.querySelector(`[data-message-id="${nextMessage.id}"]`);
            if (messageElement) {
              messageElement.scrollIntoView({
                behavior: 'smooth',
                block: 'center',
              });
              messageElement.classList.add('pinned-message-highlight');
              setTimeout(() => {
                messageElement.classList.remove('pinned-message-highlight');
              }, 2000);
            }
          }, 100);
        }

        return newIndex;
      });
    }
  };

  if (isCheckingAuth || isLoadingStream) {
    return (
      <div className='flex h-full w-full flex-col bg-white'>
        <div className='flex-1 overflow-y-auto px-4 py-4'>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className={
                i % 2 === 0
                  ? 'mb-4 flex items-start gap-2'
                  : 'mb-4 flex items-start justify-end gap-2'
              }
            >
              {i % 2 === 0 && <Skeleton className='h-8 w-8 rounded-full' />}
              <div className={i % 2 === 0 ? 'max-w-[70%]' : 'max-w-[70%]'}>
                <Skeleton className='mb-2 h-4 w-40' />
                <Skeleton className='mb-1 h-3 w-56' />
                <Skeleton className='h-3 w-32' />
              </div>
              {i % 2 !== 0 && <Skeleton className='h-8 w-8 rounded-full' />}
            </div>
          ))}
        </div>
        <div className='border-t p-4'>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-10 w-10 rounded' />
            <Skeleton className='h-10 flex-1' />
            <Skeleton className='h-10 w-10 rounded' />
          </div>
        </div>
      </div>
    );
  }

  if (streamError || !client) {
    return (
      <div className='flex h-full w-full flex-col items-center justify-center bg-white'>
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
          <p className='mt-1 text-sm text-gray-500'>Please try refreshing the page</p>
          <Button variant='outline' className='mt-4' onClick={() => router.back()}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  if (channelError) {
    return (
      <div className='flex h-full w-full flex-col items-center justify-center bg-white'>
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
                d='M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z'
              />
            </svg>
          </div>
          <p className='mt-1 text-sm text-gray-500'>
            Chat could not be loaded. Please try reloading the page.
          </p>
          <Button variant='outline' className='mt-4' onClick={() => router.back()}>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Go Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='flex h-full w-full flex-col bg-white'>
      <Channel channel={channel}>
        {pinnedMessages.length > 0 && pinnedMessages[currentPinnedIndex] && (
          <PinnedMessageBanner
            pinnedMessage={pinnedMessages[currentPinnedIndex]}
            pinnedCount={pinnedMessages.length}
            currentIndex={currentPinnedIndex}
            onUnpin={handleUnpinMessage}
            onNext={handleNextPinnedMessage}
          />
        )}

        <Window>
          <MessageList
            messageActions={['edit', 'delete', 'pin', 'react']}
            onlySenderCanEdit
            disableQuotedMessages
            closeReactionSelectorOnClick
            returnAllReadData
          />
        </Window>

        <div className='relative border-t bg-white p-4'>
          {showEmojiPicker && (
            <div className='absolute bottom-full left-4 z-50 mb-2'>
              <Picker
                data={data}
                onEmojiSelect={handleEmojiSelect}
                theme='light'
                searchPosition='none'
                previewPosition='none'
                skinTonePosition='none'
              />
            </div>
          )}
          <ChatInput onSubmit={handleSubmit}>
            <AttachmentPreview attachments={attachments} onRemove={removeAttachment} />

            <ChatInputTextarea
              ref={inputRef}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder='Type a message...'
              disabled={isSubmitting}
              className='pr-20'
            />
            <ChatInputToolbar>
              <input
                ref={fileInputRef}
                type='file'
                multiple
                accept='image/*,video/*,.gif,.pdf,.doc,.docx,.txt'
                onChange={handleFileSelect}
                className='hidden'
              />
              <ChatInputButton onClick={() => fileInputRef.current?.click()}>
                <Paperclip className='h-4 w-4' />
              </ChatInputButton>
              <ChatInputButton onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                <Smile className='h-4 w-4' />
              </ChatInputButton>
              <div className='flex-1' />
              <ChatInputSubmit
                disabled={(!inputValue.trim() && attachments.length === 0) || isSubmitting}
                status={isSubmitting ? 'loading' : undefined}
              />
            </ChatInputToolbar>
          </ChatInput>
        </div>
      </Channel>
    </div>
  );
}

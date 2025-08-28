'use client';

import { Button } from '@/components/ui/button';
import {
  ChatInput,
  ChatInputButton,
  ChatInputSubmit,
  ChatInputTextarea,
  ChatInputToolbar,
} from '@/components/ui/chat-input';
import { Message, MessageAvatar, MessageContent } from '@/components/ui/message';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useStreamChatClient } from '@/lib/providers/stream-chat-provider';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { init } from 'emoji-mart';
import type { ChannelFilters, MessageResponse, Channel as StreamChannel } from 'stream-chat';
import { Channel, Chat } from 'stream-chat-react';

import {
  ArrowLeft,
  Heart,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Plus,
  Reply,
  Smile,
} from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useTopBar } from '@/lib/stores/topbar-store';

import { LightboxViewer } from '@/components/lightbox-viewer';
import { Skeleton } from '@/components/ui/skeleton';
import '../chat-layout.css';
import '../stream-chat.d.ts';

// Initialize emoji-mart
init({ data });

export default function SingleChatPage() {
  const { isLoading: isCheckingAuth } = useRequireAuth();
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [channel, setChannel] = useState<StreamChannel>();
  const [channelError, setChannelError] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageResponse[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [replyingTo, setReplyingTo] = useState<MessageResponse | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();

  // Use Stream Chat from the provider
  const { client, isLoading: isLoadingStream, error: streamError } = useStreamChatClient();

  // Set up the specific channel based on the ID parameter
  useEffect(() => {
    if (!client || !params.id || typeof params.id !== 'string') return;

    const initSpecificChannel = async () => {
      try {
        setChannelError(null);

        // Get the channel by ID - this should be an existing channel ID from the channel list
        const channelId = params.id;

        // Query for the existing channel
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

          // Load initial messages
          const messageHistory = await targetChannel.query({
            messages: { limit: 50 },
          });
          setMessages(messageHistory.messages || []);

          // Listen for new messages
          const handleNewMessage = (event: any) => {
            if (event.message) {
              setMessages((prev) => [...prev, event.message]);
            }
          };

          targetChannel.on('message.new', handleNewMessage);

          // Cleanup listener
          return () => {
            targetChannel.off('message.new', handleNewMessage);
          };
        } else {
          // If channel doesn't exist or user is not a member
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
      // Extract chat partner information
      const currentUserId = client?.user?.id;
      const members = Object.values(channel.state.members || {});
      const chatPartner = members.find((member) => member.user?.id !== currentUserId)?.user;

      applyRouteConfig(pathname);
      setTopBarForRoute(pathname, {
        leftMode: 'back',
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
    }

    return () => {
      clearRoute(pathname);
    };
  }, [pathname, applyRouteConfig, channel, client?.user?.id]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message submission
  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if ((!inputValue.trim() && attachments.length === 0) || !channel || isSubmitting) return;

    setIsSubmitting(true);
    try {
      // Handle file uploads first
      const uploadedAttachments = [];

      for (const file of attachments) {
        try {
          if (file.type.startsWith('image/')) {
            // Upload image using Stream Chat's sendImage method
            const response = await channel.sendImage(file);
            uploadedAttachments.push({
              type: 'image',
              image_url: response.file,
              fallback: file.name,
            });
          } else {
            // Upload file using Stream Chat's sendFile method
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
          // Continue with other files even if one fails
        }
      }

      // Prepare message data
      const messageData: any = {};

      if (inputValue.trim()) {
        messageData.text = inputValue.trim();
      }

      if (uploadedAttachments.length > 0) {
        messageData.attachments = uploadedAttachments;
      }

      // Add reply reference if replying to a message - if the message is not a reply
      if (replyingTo && !replyingTo.parent_id) {
        messageData.parent_id = replyingTo.id;
      }

      // Send the message with uploaded attachments
      await channel.sendMessage(messageData);
      setInputValue('');
      setAttachments([]);
      setReplyingTo(null);
      setShowEmojiPicker(false);
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle emoji selection
  const handleEmojiSelect = (emoji: any) => {
    setInputValue((prev) => prev + emoji.native);
    inputRef.current?.focus();
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setReplyingTo(null);
    }
  };

  // Handle message reactions
  const handleReaction = async (messageId: string, emoji: string) => {
    if (!channel) return;
    try {
      await channel.sendReaction(messageId, { type: emoji });
    } catch (error) {
      console.error('Failed to send reaction:', error);
    }
  };

  // Handle reply to message
  const handleReply = (message: MessageResponse) => {
    setReplyingTo(message);
    inputRef.current?.focus();
  };

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setAttachments((prev) => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove attachment
  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  // Handle lightbox opening
  const openLightbox = (images: string[], initialIndex: number = 0) => {
    setLightboxImages(images);
    setSelectedImageIndex(initialIndex);
  };

  // Render multiple images with different layouts
  const renderImageAttachments = (imageAttachments: any[]) => {
    const imageUrls = imageAttachments.map((att) => att.image_url || att.thumb_url);

    if (imageAttachments.length === 1) {
      const imageUrl = imageUrls[0];
      return (
        <img
          src={imageUrl}
          alt={imageAttachments[0].fallback || 'Image'}
          className='max-w-xs cursor-pointer rounded-lg transition-opacity hover:opacity-90'
          style={{ maxHeight: '200px' }}
          onClick={() => openLightbox(imageUrls, 0)}
        />
      );
    }

    if (imageAttachments.length === 2) {
      return (
        <div className='flex max-w-xs gap-1'>
          {imageAttachments.map((attachment, index) => {
            const imageUrl = attachment.image_url || attachment.thumb_url;
            return (
              <img
                key={index}
                src={imageUrl}
                alt={attachment.fallback || `Image ${index + 1}`}
                className='w-1/2 cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-90'
                style={{ height: '120px' }}
                onClick={() => openLightbox(imageUrls, index)}
              />
            );
          })}
        </div>
      );
    }

    if (imageAttachments.length === 3) {
      return (
        <div className='grid max-w-xs grid-cols-2 gap-1'>
          <img
            src={imageUrls[0]}
            alt={imageAttachments[0].fallback || 'Image 1'}
            className='col-span-2 mx-auto cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-90'
            style={{ height: '120px' }}
            onClick={() => openLightbox(imageUrls, 0)}
          />
          {imageAttachments.slice(1).map((attachment, index) => {
            const imageUrl = attachment.image_url || attachment.thumb_url;
            return (
              <img
                key={index + 1}
                src={imageUrl}
                alt={attachment.fallback || `Image ${index + 2}`}
                className='cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-90'
                style={{
                  height: '80px',
                  width: '80px',
                }}
                onClick={() => openLightbox(imageUrls, index + 1)}
              />
            );
          })}
        </div>
      );
    }

    // 4 or more images - 2x2 grid with overflow indicator
    return (
      <div className='grid max-w-xs grid-cols-2 gap-1'>
        {imageAttachments.slice(0, 3).map((attachment, index) => {
          const imageUrl = attachment.image_url || attachment.thumb_url;
          return (
            <img
              key={index}
              src={imageUrl}
              alt={attachment.fallback || `Image ${index + 1}`}
              className='cursor-pointer rounded-lg object-cover transition-opacity hover:opacity-90'
              style={{
                height: '80px',
                width: '80px',
              }}
              onClick={() => openLightbox(imageUrls, index)}
            />
          );
        })}
        <div
          className='relative flex cursor-pointer items-center justify-center rounded-lg bg-black/50 transition-opacity hover:opacity-90'
          style={{ height: '80px', width: '80px' }}
          onClick={() => openLightbox(imageUrls, 3)}
        >
          {imageAttachments.length > 4 ? (
            <>
              <img
                src={imageUrls[3]}
                alt={imageAttachments[3].fallback || 'Image 4'}
                className='absolute inset-0 h-full w-full rounded-lg object-cover opacity-50'
              />
              <div className='relative z-10 flex items-center gap-1 font-medium text-white'>
                <Plus className='h-4 w-4' />
                <span className='text-sm'>{imageAttachments.length - 3}</span>
              </div>
            </>
          ) : (
            <img
              src={imageUrls[3]}
              alt={imageAttachments[3].fallback || 'Image 4'}
              className='h-full w-full rounded-lg object-cover'
            />
          )}
        </div>
      </div>
    );
  };

  // Render attachment preview
  const renderAttachment = (attachment: any) => {
    if (attachment.type === 'file') {
      const fileUrl = attachment.asset_url;
      return (
        <div
          className='flex max-w-xs cursor-pointer items-center gap-2 rounded-lg bg-gray-100 p-3 transition-colors hover:bg-gray-200'
          onClick={() => window.open(fileUrl, '_blank')}
        >
          <Paperclip className='h-4 w-4 text-gray-500' />
          <span className='truncate text-sm'>{attachment.title || attachment.fallback}</span>
        </div>
      );
    }
    return null;
  };

  // Format message for display
  const formatMessage = (msg: MessageResponse) => {
    const isCurrentUser = msg.user?.id === client?.user?.id;
    return {
      id: msg.id,
      text: msg.text || '',
      user: msg.user,
      created_at: msg.created_at,
      isCurrentUser,
    };
  };

  // Show loading state during authentication or Stream Chat setup
  if (isCheckingAuth || isLoadingStream) {
    return (
      <div className='mx-auto flex h-[calc(100vh-4rem)] max-w-full flex-col bg-white md:max-w-sm'>
        {/* Messages skeleton */}
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
        {/* Input area skeleton */}
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
            <Button variant='outline' className='mt-4' onClick={() => router.back()}>
              <ArrowLeft className='mr-2 h-4 w-4' />
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
            <p className='font-medium text-red-600'>{channelError}</p>
            <p className='mt-1 text-sm text-gray-500'>Chat {params.id} could not be loaded</p>
            <Button variant='outline' className='mt-4' onClick={() => router.back()}>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='mx-auto flex h-[calc(100vh-4rem)] max-w-full flex-col bg-white md:max-w-sm'>
      <Chat client={client}>
        <Channel channel={channel}>
          {/* Messages Container */}
          <div className='flex-1 overflow-y-auto px-4 py-2'>
            <div>
              {messages.map((msg) => {
                const formattedMsg = formatMessage(msg);
                return (
                  <Message
                    key={formattedMsg.id}
                    from={formattedMsg.isCurrentUser ? 'user' : 'other'}
                  >
                    <MessageAvatar
                      src={formattedMsg.user?.image || ''}
                      name={formattedMsg.user?.name || formattedMsg.user?.id || 'User'}
                    />
                    <div className='group relative' onDoubleClick={() => handleReply(msg)}>
                      <MessageContent className='rounded-2xl'>
                        {/* Reply indicator */}
                        {msg.parent_id &&
                          (() => {
                            const parentMessage = messages.find((m) => m.id === msg.parent_id);
                            const replyText = parentMessage?.text || 'Message with attachments';
                            return (
                              <div className='mb-2 border-l-2 border-gray-300 pl-2 text-xs opacity-60'>
                                <Reply className='mr-1 inline h-3 w-3' />
                                <span className='truncate'>{replyText}</span>
                              </div>
                            );
                          })()}

                        {formattedMsg.text && <div className='text-xs'>{formattedMsg.text}</div>}
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className='mt-1 space-y-1'>
                            {(() => {
                              const imageAttachments = msg.attachments.filter(
                                (att: any) => att.type === 'image'
                              );
                              const fileAttachments = msg.attachments.filter(
                                (att: any) => att.type === 'file'
                              );

                              return (
                                <>
                                  {imageAttachments.length > 0 && (
                                    <div>{renderImageAttachments(imageAttachments)}</div>
                                  )}
                                  {fileAttachments.map((attachment: any, index: number) => (
                                    <div key={`file-${index}`}>{renderAttachment(attachment)}</div>
                                  ))}
                                </>
                              );
                            })()}
                          </div>
                        )}

                        {/* Reactions */}
                        {msg.reaction_counts && Object.keys(msg.reaction_counts).length > 0 && (
                          <div className='mt-2 flex flex-wrap gap-1'>
                            {Object.entries(msg.reaction_counts).map(([emoji, count]) => (
                              <button
                                key={emoji}
                                onClick={() => handleReaction(msg.id, emoji)}
                                className='flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs transition-colors hover:bg-gray-200'
                              >
                                <span>{emoji}</span>
                                <span>{count as number}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </MessageContent>

                      {/* Message actions */}
                      <div className='absolute right-0 top-0 -mr-2 -mt-2 flex gap-1 rounded-lg border bg-white p-1 opacity-0 shadow-lg transition-opacity group-hover:opacity-100'>
                        <button
                          onClick={() => handleReaction(msg.id, '❤️')}
                          className='rounded p-1 transition-colors hover:bg-gray-100'
                          title='React with heart'
                        >
                          <Heart className='h-3 w-3' />
                        </button>
                        {!msg.parent_id && (
                          <button
                            onClick={() => handleReply(msg)}
                            className='rounded p-1 transition-colors hover:bg-gray-100'
                            title='Reply'
                          >
                            <MessageCircle className='h-3 w-3' />
                          </button>
                        )}
                        <button
                          className='rounded p-1 transition-colors hover:bg-gray-100'
                          title='More options'
                        >
                          <MoreHorizontal className='h-3 w-3' />
                        </button>
                      </div>
                    </div>
                  </Message>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Container */}
          <div className='relative border-t bg-white p-4'>
            {/* Emoji Picker */}
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
              {/* Reply Preview */}
              {replyingTo && (
                <div className='border-b bg-gray-50 p-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2 text-xs text-gray-600'>
                      <Reply className='h-3 w-3' />
                      <span>
                        Replying to {replyingTo.user?.name || replyingTo.user?.id || 'User'}
                      </span>
                    </div>
                    <button
                      onClick={() => setReplyingTo(null)}
                      className='text-gray-400 transition-colors hover:text-gray-600'
                    >
                      ×
                    </button>
                  </div>
                  <div className='mt-1 truncate text-xs text-gray-500'>
                    {replyingTo.text || 'Message with attachments'}
                  </div>
                </div>
              )}

              {/* Attachment Previews */}
              {attachments.length > 0 && (
                <div className='max-w-full overflow-x-auto'>
                  <div className='flex w-max gap-2 border-b p-2'>
                    {attachments.map((file, index) => (
                      <div key={index} className='relative flex-1'>
                        {file.type.startsWith('image/') ? (
                          <div className='relative'>
                            <img
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              className='h-16 w-16 rounded object-cover'
                            />
                            <button
                              type='button'
                              onClick={() => removeAttachment(index)}
                              className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white'
                            >
                              ×
                            </button>
                          </div>
                        ) : (
                          <div className='flex items-center gap-2 rounded bg-gray-100 p-2 text-xs'>
                            <Paperclip className='h-3 w-3' />
                            <span className='max-w-20 truncate'>{file.name}</span>
                            <button
                              type='button'
                              onClick={() => removeAttachment(index)}
                              className='ml-1 text-red-500'
                            >
                              ×
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                {replyingTo && <div className='ml-2 text-xs text-gray-500'>ESC to cancel</div>}
              </ChatInputToolbar>
            </ChatInput>
          </div>
        </Channel>
      </Chat>

      {/* Lightbox for image viewing */}
      <LightboxViewer
        selectedImage={selectedImageIndex}
        onClose={() => setSelectedImageIndex(null)}
        images={lightboxImages}
        onImageChange={function (index: number): void {
          setSelectedImageIndex(index);
        }}
        handleDelete={function (photoId: string): Promise<{ success: boolean }> {
          return Promise.resolve({ success: true });
        }}
        userId={''}
        eventId={''}
      />
    </div>
  );
}

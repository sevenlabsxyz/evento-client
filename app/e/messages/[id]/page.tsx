'use client';

import { Button } from '@/components/ui/button';
import {
  ChatInput,
  ChatInputButton,
  ChatInputSubmit,
  ChatInputTextarea,
  ChatInputToolbar,
} from '@/components/ui/chat-input';
import {
  Message,
  MessageAvatar,
  MessageContent,
} from '@/components/ui/message';
import { useRequireAuth } from '@/lib/hooks/use-auth';
import { useStreamChatClient } from '@/lib/providers/stream-chat-provider';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { init } from 'emoji-mart';
import type {
  ChannelFilters,
  MessageResponse,
  Channel as StreamChannel,
} from 'stream-chat';
import { Channel, Chat } from 'stream-chat-react';

import { ArrowLeft, Paperclip, Smile } from 'lucide-react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

import { useTopBar } from '@/lib/stores/topbar-store';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { applyRouteConfig, setTopBarForRoute, clearRoute } = useTopBar();

  // Use Stream Chat from the provider
  const {
    client,
    isLoading: isLoadingStream,
    error: streamError,
  } = useStreamChatClient();

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
      const chatPartner = members.find(
        (member) => member.user?.id !== currentUserId
      )?.user;

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
    if (
      (!inputValue.trim() && attachments.length === 0) ||
      !channel ||
      isSubmitting
    )
      return;

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

      // Send the message with uploaded attachments
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

  // Check if file is GIF
  const isGif = (url: string) => {
    if (!url) return false;
    return (
      url.toLowerCase().includes('.gif') || url.includes('media.giphy.com')
    );
  };

  // Render attachment preview
  const renderAttachment = (attachment: any) => {
    if (attachment.type === 'image') {
      const imageUrl = attachment.image_url || attachment.thumb_url;
      if (isGif(imageUrl)) {
        return (
          <img
            src={imageUrl}
            alt={attachment.fallback || 'GIF'}
            className="max-w-xs cursor-pointer rounded-lg transition-opacity hover:opacity-90"
            style={{ maxHeight: '200px' }}
            onClick={() => window.open(imageUrl, '_blank')}
          />
        );
      } else {
        return (
          <img
            src={imageUrl}
            alt={attachment.fallback || 'Image'}
            className="max-w-xs cursor-pointer rounded-lg transition-opacity hover:opacity-90"
            style={{ maxHeight: '200px' }}
            onClick={() => window.open(imageUrl, '_blank')}
          />
        );
      }
    } else if (attachment.type === 'file') {
      const fileUrl = attachment.asset_url;
      return (
        <div
          className="flex max-w-xs cursor-pointer items-center gap-2 rounded-lg bg-gray-100 p-3 transition-colors hover:bg-gray-200"
          onClick={() => window.open(fileUrl, '_blank')}
        >
          <Paperclip className="h-4 w-4 text-gray-500" />
          <span className="truncate text-sm">
            {attachment.title || attachment.fallback}
          </span>
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
      <div className="mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm">
        <div className="flex flex-1 items-center justify-center pb-20">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-red-500"></div>
            <p>
              {isCheckingAuth
                ? 'Authenticating...'
                : 'Setting up chat connection...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if Stream Chat fails to connect
  if (streamError || !client) {
    return (
      <div className="mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm">
        <div className="flex flex-1 items-center justify-center pb-20">
          <div className="text-center">
            <div className="mb-4 text-red-500">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            <p className="font-medium text-red-600">
              Failed to connect to chat
            </p>
            <p className="mt-1 text-sm text-gray-500">
              {streamError || 'Please try refreshing the page'}
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
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
      <div className="mx-auto flex min-h-screen max-w-full flex-col bg-white md:max-w-sm">
        <div className="flex flex-1 items-center justify-center pb-20">
          <div className="text-center">
            <div className="mb-4 text-red-500">
              <svg
                className="mx-auto h-12 w-12"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
            </div>
            <p className="font-medium text-red-600">{channelError}</p>
            <p className="mt-1 text-sm text-gray-500">
              Chat {params.id} could not be loaded
            </p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.back()}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-4rem)] max-w-full flex-col bg-white md:max-w-sm">
      <Chat client={client}>
        <Channel channel={channel}>
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-4 py-2">
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
                      name={
                        formattedMsg.user?.name ||
                        formattedMsg.user?.id ||
                        'User'
                      }
                    />
                    <MessageContent className="rounded-2xl">
                      {formattedMsg.text && (
                        <div className="text-xs">{formattedMsg.text}</div>
                      )}
                      {msg.attachments && msg.attachments.length > 0 && (
                        <div className="mt-1 space-y-1">
                          {msg.attachments.map(
                            (attachment: any, index: number) => (
                              <div key={index}>
                                {renderAttachment(attachment)}
                              </div>
                            )
                          )}
                        </div>
                      )}
                    </MessageContent>
                  </Message>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input Container */}
          <div className="relative border-t bg-white p-4">
            {/* Emoji Picker */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-4 z-50 mb-2">
                <Picker
                  data={data}
                  onEmojiSelect={handleEmojiSelect}
                  theme="light"
                  searchPosition="none"
                  previewPosition="none"
                  skinTonePosition="none"
                />
              </div>
            )}

            <ChatInput onSubmit={handleSubmit}>
              {/* Attachment Previews */}
              {attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 border-b p-2">
                  {attachments.map((file, index) => (
                    <div key={index} className="relative">
                      {file.type.startsWith('image/') ? (
                        <div className="relative">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="h-16 w-16 rounded object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs text-white"
                          >
                            ×
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 rounded bg-gray-100 p-2 text-xs">
                          <Paperclip className="h-3 w-3" />
                          <span className="max-w-20 truncate">{file.name}</span>
                          <button
                            type="button"
                            onClick={() => removeAttachment(index)}
                            className="ml-1 text-red-500"
                          >
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <ChatInputTextarea
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Type a message..."
                disabled={isSubmitting}
                className="pr-20"
              />
              <ChatInputToolbar>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,video/*,.gif,.pdf,.doc,.docx,.txt"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <ChatInputButton onClick={() => fileInputRef.current?.click()}>
                  <Paperclip className="h-4 w-4" />
                </ChatInputButton>
                <ChatInputButton
                  onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                >
                  <Smile className="h-4 w-4" />
                </ChatInputButton>
                <div className="flex-1" />
                <ChatInputSubmit
                  disabled={
                    (!inputValue.trim() && attachments.length === 0) ||
                    isSubmitting
                  }
                  status={isSubmitting ? 'loading' : undefined}
                />
              </ChatInputToolbar>
            </ChatInput>
          </div>
        </Channel>
      </Chat>
    </div>
  );
}

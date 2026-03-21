'use client';

import { getDirectMessagePartner } from '@/lib/utils/stream-chat-display';
import { useRouter } from 'next/navigation';
import { ChannelPreviewUIComponentProps, useChatContext } from 'stream-chat-react';

export const CustomChannelPreview = (props: ChannelPreviewUIComponentProps) => {
  const router = useRouter();
  const { client, setActiveChannel } = useChatContext();
  const { channel, displayImage, displayTitle, lastMessage, unread } = props;
  const unreadCount = unread ?? 0;
  const chatPartner = getDirectMessagePartner(channel, client.user?.id);
  const previewImage = chatPartner?.image || displayImage;
  const previewTitle = chatPartner?.name || displayTitle || 'Unknown Channel';

  const handleClick = () => {
    setActiveChannel(channel);
    router.push(`/e/messages/${channel.id}`, { scroll: false });
  };

  const getLastMessagePreview = () => {
    if (!lastMessage) return 'No messages yet';

    if (lastMessage.text) {
      return lastMessage.text.length > 50
        ? lastMessage.text.substring(0, 50) + '...'
        : lastMessage.text;
    }

    if (lastMessage.attachments?.length) {
      return '📎 Attachment';
    }

    return 'No messages yet';
  };

  const getTimeString = () => {
    if (!lastMessage?.created_at) return '';

    const date = new Date(lastMessage.created_at);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } else if (days === 1) {
      return 'Yesterday';
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  };

  return (
    <div
      className='str-chat__channel-preview-messenger str-chat__channel-preview w-auto cursor-pointer'
      onClick={handleClick}
      role='button'
      aria-label='Open chat'
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className='str-chat__channel-preview-messenger--left'>
        <div className='str-chat__avatar str-chat__avatar--circle'>
          {previewImage && (
            <img src={previewImage} alt={previewTitle} className='str-chat__avatar-image' />
          )}
          {!previewImage && (
            <div className='str-chat__avatar-fallback'>{previewTitle.charAt(0)}</div>
          )}
        </div>
      </div>

      <div className='str-chat__channel-preview-messenger--main'>
        <div className='str-chat__channel-preview-messenger--name'>
          <span>{previewTitle}</span>
          {unreadCount > 0 && (
            <span className='str-chat__channel-preview-unread-badge'>{unreadCount}</span>
          )}
        </div>
        <div className='str-chat__channel-preview-messenger--last-message'>
          {getLastMessagePreview()}
        </div>
      </div>

      <div className='str-chat__channel-preview-messenger--right'>
        <div className='str-chat__channel-preview-messenger--time'>{getTimeString()}</div>
      </div>
    </div>
  );
};

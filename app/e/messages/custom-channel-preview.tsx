'use client';

import { useRouter } from 'next/navigation';
import { ChannelPreviewUIComponentProps, useChatContext } from 'stream-chat-react';

export const CustomChannelPreview = (props: ChannelPreviewUIComponentProps) => {
  const router = useRouter();
  const { setActiveChannel } = useChatContext();
  const { channel, displayImage, displayTitle, lastMessage, unread } = props;

  const handleClick = () => {
    // Navigate to the individual chat view
    router.push(`/e/messages/${channel.id}`);
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
          {displayImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayImage}
              alt={displayTitle || 'Channel'}
              className='str-chat__avatar-image'
            />
          )}
          {!displayImage && (
            <div className='str-chat__avatar-fallback'>
              {displayTitle?.charAt(0).toUpperCase() || 'C'}
            </div>
          )}
        </div>
      </div>

      <div className='str-chat__channel-preview-messenger--main'>
        <div className='str-chat__channel-preview-messenger--name'>
          <span>{displayTitle || 'Unknown Channel'}</span>
          {!!unread && <span className='str-chat__channel-preview-unread-badge'>{unread}</span>}
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

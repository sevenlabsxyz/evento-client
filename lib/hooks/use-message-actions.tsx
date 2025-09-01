import { useCallback } from 'react';
import type { Channel as StreamChannel } from 'stream-chat';

export const useMessageActions = (channel: StreamChannel | undefined) => {
  const handleFlag = useCallback(
    async (messageId: string) => {
      if (!channel || !channel.getClient) return;
      try {
        // Use client.flagMessage instead of channel.flagMessage
        const client = channel.getClient();
        await client.flagMessage(messageId);
      } catch (error) {
        console.error('Failed to flag message:', error);
        throw error;
      }
    },
    [channel]
  );

  const handlePin = useCallback(
    async (messageId: string, isPinned: boolean) => {
      if (!channel || !channel.getClient) return;
      try {
        const client = channel.getClient();
        if (isPinned) {
          await client.unpinMessage(messageId);
        } else {
          await client.pinMessage(messageId);
        }
      } catch (error) {
        console.error('Failed to pin/unpin message:', error);
        throw error;
      }
    },
    [channel]
  );

  const handleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!channel) return;
      try {
        await channel.sendReaction(messageId, { type: emoji });
      } catch (error) {
        console.error('Failed to send reaction:', error);
        throw error;
      }
    },
    [channel]
  );

  const handleMarkUnread = useCallback(
    async (messageId: string) => {
      if (!channel) return;
      try {
        // Use the correct method signature for markUnread
        await channel.markUnread({ message_id: messageId });
      } catch (error) {
        console.error('Failed to mark as unread:', error);
        throw error;
      }
    },
    [channel]
  );

  return {
    handleFlag,
    handlePin,
    handleReaction,
    handleMarkUnread,
  };
};

import { useCallback } from 'react';
import type { Channel as StreamChannel } from 'stream-chat';
import { logger } from '@/lib/utils/logger';

export const useMessageActions = (channel: StreamChannel | undefined) => {
  const handleFlag = useCallback(
    async (messageId: string) => {
      if (!channel || !channel.getClient) return;
      try {
        // Use client.flagMessage instead of channel.flagMessage
        const client = channel.getClient();
        await client.flagMessage(messageId);
      } catch (error) {
        logger.error('Failed to flag message', {
          error: error instanceof Error ? error.message : String(error),
        });
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
        logger.error('Failed to pin/unpin message', {
          error: error instanceof Error ? error.message : String(error),
        });
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
        logger.error('Failed to send reaction', {
          error: error instanceof Error ? error.message : String(error),
        });
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
        logger.error('Failed to mark as unread', {
          error: error instanceof Error ? error.message : String(error),
        });
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

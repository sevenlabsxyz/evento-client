import { useMessageActions } from '@/lib/hooks/use-message-actions';
import { act, renderHook } from '@testing-library/react';
import type { Channel as StreamChannel } from 'stream-chat';

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('useMessageActions', () => {
  let mockChannel: Partial<StreamChannel>;
  let mockClient: {
    flagMessage: jest.Mock;
    pinMessage: jest.Mock;
    unpinMessage: jest.Mock;
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Create mock client
    mockClient = {
      flagMessage: jest.fn(),
      pinMessage: jest.fn(),
      unpinMessage: jest.fn(),
    };

    // Create mock channel
    mockChannel = {
      getClient: jest.fn(() => mockClient as unknown as ReturnType<StreamChannel['getClient']>),
      sendReaction: jest.fn() as jest.MockedFunction<StreamChannel['sendReaction']>,
      markUnread: jest.fn() as jest.MockedFunction<StreamChannel['markUnread']>,
    };
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  describe('handleFlag', () => {
    it('flags a message successfully', async () => {
      const messageId = 'message123';
      mockClient.flagMessage.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        await result.current.handleFlag(messageId);
      });

      expect(mockChannel.getClient).toHaveBeenCalled();
      expect(mockClient.flagMessage).toHaveBeenCalledWith(messageId);
    });

    it('handles flag message error', async () => {
      const messageId = 'message123';
      const error = new Error('Flag failed');
      mockClient.flagMessage.mockRejectedValue(error);

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        try {
          await result.current.handleFlag(messageId);
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to flag message:', error);
    });

    it('returns early when channel is undefined', async () => {
      const { result } = renderHook(() => useMessageActions(undefined));

      await act(async () => {
        await result.current.handleFlag('message123');
      });

      expect(mockChannel.getClient).not.toHaveBeenCalled();
    });

    it('returns early when channel.getClient is undefined', async () => {
      const channelWithoutGetClient = { ...mockChannel, getClient: undefined };
      const { result } = renderHook(() =>
        useMessageActions(channelWithoutGetClient as unknown as StreamChannel)
      );

      await act(async () => {
        await result.current.handleFlag('message123');
      });

      expect(mockClient.flagMessage).not.toHaveBeenCalled();
    });
  });

  describe('handlePin', () => {
    it('pins a message when not pinned', async () => {
      const messageId = 'message123';
      const isPinned = false;
      mockClient.pinMessage.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        await result.current.handlePin(messageId, isPinned);
      });

      expect(mockChannel.getClient).toHaveBeenCalled();
      expect(mockClient.pinMessage).toHaveBeenCalledWith(messageId);
      expect(mockClient.unpinMessage).not.toHaveBeenCalled();
    });

    it('unpins a message when already pinned', async () => {
      const messageId = 'message123';
      const isPinned = true;
      mockClient.unpinMessage.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        await result.current.handlePin(messageId, isPinned);
      });

      expect(mockChannel.getClient).toHaveBeenCalled();
      expect(mockClient.unpinMessage).toHaveBeenCalledWith(messageId);
      expect(mockClient.pinMessage).not.toHaveBeenCalled();
    });

    it('handles pin message error', async () => {
      const messageId = 'message123';
      const isPinned = false;
      const error = new Error('Pin failed');
      mockClient.pinMessage.mockRejectedValue(error);

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        try {
          await result.current.handlePin(messageId, isPinned);
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to pin/unpin message:', error);
    });

    it('handles unpin message error', async () => {
      const messageId = 'message123';
      const isPinned = true;
      const error = new Error('Unpin failed');
      mockClient.unpinMessage.mockRejectedValue(error);

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        try {
          await result.current.handlePin(messageId, isPinned);
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to pin/unpin message:', error);
    });

    it('returns early when channel is undefined', async () => {
      const { result } = renderHook(() => useMessageActions(undefined));

      await act(async () => {
        await result.current.handlePin('message123', false);
      });

      expect(mockChannel.getClient).not.toHaveBeenCalled();
    });

    it('returns early when channel.getClient is undefined', async () => {
      const channelWithoutGetClient = { ...mockChannel, getClient: undefined };
      const { result } = renderHook(() =>
        useMessageActions(channelWithoutGetClient as unknown as StreamChannel)
      );

      await act(async () => {
        await result.current.handlePin('message123', false);
      });

      expect(mockClient.pinMessage).not.toHaveBeenCalled();
      expect(mockClient.unpinMessage).not.toHaveBeenCalled();
    });
  });

  describe('handleReaction', () => {
    it('sends a reaction successfully', async () => {
      const messageId = 'message123';
      const emoji = '👍';
      (mockChannel.sendReaction as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        await result.current.handleReaction(messageId, emoji);
      });

      expect(mockChannel.sendReaction).toHaveBeenCalledWith(messageId, {
        type: emoji,
      });
    });

    it('handles reaction error', async () => {
      const messageId = 'message123';
      const emoji = '👍';
      const error = new Error('Reaction failed');
      (mockChannel.sendReaction as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        try {
          await result.current.handleReaction(messageId, emoji);
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to send reaction:', error);
    });

    it('returns early when channel is undefined', async () => {
      const { result } = renderHook(() => useMessageActions(undefined));

      await act(async () => {
        await result.current.handleReaction('message123', '👍');
      });

      expect(mockChannel.sendReaction).not.toHaveBeenCalled();
    });

    it('handles different emoji types', async () => {
      const messageId = 'message123';
      const emojis = ['👍', '❤️', '😂', '😢', '😮', '😡'];

      for (const emoji of emojis) {
        (mockChannel.sendReaction as jest.Mock).mockResolvedValue(undefined);

        const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

        await act(async () => {
          await result.current.handleReaction(messageId, emoji);
        });

        expect(mockChannel.sendReaction).toHaveBeenCalledWith(messageId, {
          type: emoji,
        });
      }
    });
  });

  describe('handleMarkUnread', () => {
    it('marks message as unread successfully', async () => {
      const messageId = 'message123';
      (mockChannel.markUnread as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        await result.current.handleMarkUnread(messageId);
      });

      expect(mockChannel.markUnread).toHaveBeenCalledWith({
        message_id: messageId,
      });
    });

    it('handles mark unread error', async () => {
      const messageId = 'message123';
      const error = new Error('Mark unread failed');
      (mockChannel.markUnread as jest.Mock).mockRejectedValue(error);

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        try {
          await result.current.handleMarkUnread(messageId);
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to mark as unread:', error);
    });

    it('returns early when channel is undefined', async () => {
      const { result } = renderHook(() => useMessageActions(undefined));

      await act(async () => {
        await result.current.handleMarkUnread('message123');
      });

      expect(mockChannel.markUnread).not.toHaveBeenCalled();
    });
  });

  describe('hook return values', () => {
    it('returns all action handlers', () => {
      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      expect(result.current).toEqual({
        handleFlag: expect.any(Function),
        handlePin: expect.any(Function),
        handleReaction: expect.any(Function),
        handleMarkUnread: expect.any(Function),
      });
    });

    it('maintains function references when channel does not change', () => {
      const { result, rerender } = renderHook(({ channel }) => useMessageActions(channel), {
        initialProps: { channel: mockChannel as StreamChannel },
      });

      const firstRender = result.current;

      rerender({ channel: mockChannel as StreamChannel });

      expect(result.current.handleFlag).toBe(firstRender.handleFlag);
      expect(result.current.handlePin).toBe(firstRender.handlePin);
      expect(result.current.handleReaction).toBe(firstRender.handleReaction);
      expect(result.current.handleMarkUnread).toBe(firstRender.handleMarkUnread);
    });

    it('creates new function references when channel changes', () => {
      const { result, rerender } = renderHook(({ channel }) => useMessageActions(channel), {
        initialProps: { channel: mockChannel as StreamChannel },
      });

      const firstRender = result.current;

      const newChannel = {
        ...mockChannel,
        getClient: jest.fn(() => mockClient),
        sendReaction: jest.fn(),
        markUnread: jest.fn(),
      };

      rerender({ channel: newChannel as unknown as StreamChannel });

      expect(result.current.handleFlag).not.toBe(firstRender.handleFlag);
      expect(result.current.handlePin).not.toBe(firstRender.handlePin);
      expect(result.current.handleReaction).not.toBe(firstRender.handleReaction);
      expect(result.current.handleMarkUnread).not.toBe(firstRender.handleMarkUnread);
    });
  });

  describe('edge cases', () => {
    it('handles empty message ID', async () => {
      const messageId = '';
      mockClient.flagMessage.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        await result.current.handleFlag(messageId);
      });

      expect(mockClient.flagMessage).toHaveBeenCalledWith('');
    });

    it('handles special characters in message ID', async () => {
      const messageId = 'message-123_!@#$%^&*()';
      (mockChannel.sendReaction as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        await result.current.handleReaction(messageId, '👍');
      });

      expect(mockChannel.sendReaction).toHaveBeenCalledWith(messageId, {
        type: '👍',
      });
    });

    it('handles very long message ID', async () => {
      const messageId = 'a'.repeat(1000);
      (mockChannel.markUnread as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        await result.current.handleMarkUnread(messageId);
      });

      expect(mockChannel.markUnread).toHaveBeenCalledWith({
        message_id: messageId,
      });
    });

    it('handles null channel', async () => {
      const { result } = renderHook(() => useMessageActions(null as unknown as StreamChannel));

      await act(async () => {
        await result.current.handleFlag('message123');
        await result.current.handlePin('message123', false);
        await result.current.handleReaction('message123', '👍');
        await result.current.handleMarkUnread('message123');
      });

      expect(mockChannel.getClient).not.toHaveBeenCalled();
      expect(mockChannel.sendReaction).not.toHaveBeenCalled();
      expect(mockChannel.markUnread).not.toHaveBeenCalled();
    });
  });

  describe('concurrent operations', () => {
    it('handles multiple flag operations concurrently', async () => {
      const messageIds = ['message1', 'message2', 'message3'];
      mockClient.flagMessage.mockResolvedValue(undefined);

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        const promises = messageIds.map((id) => result.current.handleFlag(id));
        await Promise.all(promises);
      });

      expect(mockClient.flagMessage).toHaveBeenCalledTimes(3);
      messageIds.forEach((id) => {
        expect(mockClient.flagMessage).toHaveBeenCalledWith(id);
      });
    });

    it('handles mixed operations concurrently', async () => {
      mockClient.flagMessage.mockResolvedValue(undefined);
      mockClient.pinMessage.mockResolvedValue(undefined);
      (mockChannel.sendReaction as jest.Mock).mockResolvedValue(undefined);
      (mockChannel.markUnread as jest.Mock).mockResolvedValue(undefined);

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        const promises = [
          result.current.handleFlag('message1'),
          result.current.handlePin('message2', false),
          result.current.handleReaction('message3', '👍'),
          result.current.handleMarkUnread('message4'),
        ];
        await Promise.all(promises);
      });

      expect(mockClient.flagMessage).toHaveBeenCalledWith('message1');
      expect(mockClient.pinMessage).toHaveBeenCalledWith('message2');
      expect(mockChannel.sendReaction).toHaveBeenCalledWith('message3', {
        type: '👍',
      });
      expect(mockChannel.markUnread).toHaveBeenCalledWith({
        message_id: 'message4',
      });
    });
  });

  describe('error scenarios', () => {
    it('handles client method throwing synchronous errors', async () => {
      const messageId = 'message123';
      const error = new Error('Synchronous error');
      mockClient.flagMessage.mockImplementation(() => {
        throw error;
      });

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        try {
          await result.current.handleFlag(messageId);
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to flag message:', error);
    });

    it('handles channel method throwing synchronous errors', async () => {
      const messageId = 'message123';
      const emoji = '👍';
      const error = new Error('Synchronous error');
      (mockChannel.sendReaction as jest.Mock).mockImplementation(() => {
        throw error;
      });

      const { result } = renderHook(() => useMessageActions(mockChannel as StreamChannel));

      await act(async () => {
        try {
          await result.current.handleReaction(messageId, emoji);
        } catch (e) {
          expect(e).toBe(error);
        }
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Failed to send reaction:', error);
    });
  });
});

import { useNotifyWalletInviteBatch } from '@/lib/hooks/use-notify-wallet-invite-batch';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

describe('useNotifyWalletInviteBatch', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  it('sends the expected payload to the batch notify endpoint', async () => {
    const { apiClient } = require('@/lib/api/client');
    apiClient.post.mockResolvedValueOnce({
      success: true,
      status: 'success',
      message: 'Wallet notifications processed.',
      summary: {
        total: 2,
        sent: 1,
        already_notified: 1,
        error: 0,
      },
      results: [
        { recipientUsername: 'alice', status: 'sent' },
        { recipientUsername: 'bob', status: 'already_notified' },
      ],
    });

    const { result } = renderHook(() => useNotifyWalletInviteBatch(), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({
        recipientUsernames: ['alice', 'bob'],
      });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.post).toHaveBeenCalledWith('/v1/wallet/notify/batch', {
      recipientUsernames: ['alice', 'bob'],
    });
    expect(result.current.data?.status).toBe('completed');
    expect(result.current.data?.summary.sentCount).toBe(1);
    expect(result.current.data?.summary.alreadyNotifiedCount).toBe(1);
  });

  it('throws when the API returns a handled error payload', async () => {
    const { apiClient } = require('@/lib/api/client');
    apiClient.post.mockResolvedValueOnce({
      success: false,
      status: 'error',
      message: 'Invalid request payload.',
      summary: {
        requestedCount: 0,
        processedCount: 0,
        sentCount: 0,
        alreadyNotifiedCount: 0,
        errorCount: 0,
      },
      results: [],
    });

    const { result } = renderHook(() => useNotifyWalletInviteBatch(), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({
        recipientUsernames: ['alice'],
      });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Invalid request payload.');
  });
});

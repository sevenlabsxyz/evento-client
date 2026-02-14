import { useNotifyWalletInvite } from '@/lib/hooks/use-notify-wallet-invite';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

describe('useNotifyWalletInvite', () => {
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

  it('should handle sent status', async () => {
    const { default: apiClient } = require('@/lib/api/client');
    apiClient.post.mockResolvedValueOnce({
      success: true,
      status: 'sent',
      message: 'Notification sent',
    });

    const { result } = renderHook(() => useNotifyWalletInvite(), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ recipientUsername: 'testuser' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.status).toBe('sent');
  });

  it('should handle already_notified status', async () => {
    const { default: apiClient } = require('@/lib/api/client');
    apiClient.post.mockResolvedValueOnce({
      success: true,
      status: 'already_notified',
      message: 'Already notified',
    });

    const { result } = renderHook(() => useNotifyWalletInvite(), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ recipientUsername: 'testuser' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.status).toBe('already_notified');
  });

  it('should handle error status', async () => {
    const { default: apiClient } = require('@/lib/api/client');
    apiClient.post.mockResolvedValueOnce({
      success: false,
      status: 'error',
      message: 'Failed to send notification',
    });

    const { result } = renderHook(() => useNotifyWalletInvite(), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ recipientUsername: 'testuser' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it('should send correct payload to API', async () => {
    const { default: apiClient } = require('@/lib/api/client');
    apiClient.post.mockResolvedValueOnce({
      success: true,
      status: 'sent',
      message: 'Notification sent',
    });

    const { result } = renderHook(() => useNotifyWalletInvite(), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ recipientUsername: 'testuser' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(apiClient.post).toHaveBeenCalledWith('/v1/wallet/notify', {
      recipientUsername: 'testuser',
    });
  });

  it('should handle network errors', async () => {
    const { default: apiClient } = require('@/lib/api/client');
    const networkError = new Error('Network error');
    apiClient.post.mockRejectedValueOnce(networkError);

    const { result } = renderHook(() => useNotifyWalletInvite(), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ recipientUsername: 'testuser' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(networkError);
  });

  it('should throw error when success is false', async () => {
    const { default: apiClient } = require('@/lib/api/client');
    apiClient.post.mockResolvedValueOnce({
      success: false,
      status: 'error',
      message: 'Custom error message',
    });

    const { result } = renderHook(() => useNotifyWalletInvite(), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ recipientUsername: 'testuser' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.message).toBe('Custom error message');
  });

  it('should reset mutation state', async () => {
    const { default: apiClient } = require('@/lib/api/client');
    apiClient.post.mockResolvedValueOnce({
      success: true,
      status: 'sent',
      message: 'Notification sent',
    });

    const { result } = renderHook(() => useNotifyWalletInvite(), {
      wrapper: createTestWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({ recipientUsername: 'testuser' });
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    await act(async () => {
      result.current.reset();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('idle');
    });

    expect(result.current.data).toBeUndefined();
  });
});

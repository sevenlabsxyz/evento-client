import { renderHook, act, waitFor } from '@testing-library/react';
import { useProtectedFollowAction } from '@/lib/hooks/use-protected-follow-action';

const mutateAsyncMock = jest.fn();
const ensureAuthenticatedActionMock = jest.fn();
const toastSuccessMock = jest.fn();
const toastErrorMock = jest.fn();

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/hooks/use-user-profile', () => ({
  useFollowAction: jest.fn(),
}));

jest.mock('@/lib/providers/auth-recovery-provider', () => ({
  useEnsureAuthenticatedAction: jest.fn(),
}));

jest.mock('@/lib/utils/toast', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

import { useAuth } from '@/lib/hooks/use-auth';
import { useFollowAction } from '@/lib/hooks/use-user-profile';
import { useEnsureAuthenticatedAction } from '@/lib/providers/auth-recovery-provider';

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseFollowAction = useFollowAction as jest.MockedFunction<typeof useFollowAction>;
const mockUseEnsureAuthenticatedAction =
  useEnsureAuthenticatedAction as jest.MockedFunction<typeof useEnsureAuthenticatedAction>;

describe('useProtectedFollowAction', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      email: null,
      checkAuth: jest.fn(),
      logout: jest.fn(),
      isLoggingOut: false,
    });

    mockUseFollowAction.mockReturnValue({
      mutateAsync: mutateAsyncMock,
      isPending: false,
    } as any);

    mockUseEnsureAuthenticatedAction.mockReturnValue(ensureAuthenticatedActionMock);
  });

  it('redirects unauthenticated users before attempting to follow', async () => {
    ensureAuthenticatedActionMock.mockResolvedValue(false);

    const { result } = renderHook(() =>
      useProtectedFollowAction({ userId: 'user_1', userName: 'Alice', isFollowing: false })
    );

    await act(async () => {
      await result.current.handleFollowToggle();
    });

    expect(ensureAuthenticatedActionMock).toHaveBeenCalledWith({ reason: 'action:follow:user:user_1' });
    expect(mutateAsyncMock).not.toHaveBeenCalled();
  });

  it('recovers auth and then follows successfully', async () => {
    ensureAuthenticatedActionMock.mockResolvedValue(true);
    mutateAsyncMock.mockResolvedValue({});

    const { result } = renderHook(() =>
      useProtectedFollowAction({ userId: 'user_2', userName: 'Bob', isFollowing: false })
    );

    await act(async () => {
      await result.current.handleFollowToggle();
    });

    expect(ensureAuthenticatedActionMock).toHaveBeenCalledWith({ reason: 'action:follow:user:user_2' });
    expect(mutateAsyncMock).toHaveBeenCalledWith({ userId: 'user_2', action: 'follow' });
    expect(toastSuccessMock).toHaveBeenCalledWith('You followed Bob!');
  });

  it('retries auth recovery on 401 responses instead of showing a generic error', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'viewer_1' },
      isAuthenticated: true,
      isLoading: false,
      email: null,
      checkAuth: jest.fn(),
      logout: jest.fn(),
      isLoggingOut: false,
    } as any);
    mutateAsyncMock.mockRejectedValue({ status: 401 });
    ensureAuthenticatedActionMock.mockResolvedValue(true);

    const { result } = renderHook(() =>
      useProtectedFollowAction({ userId: 'user_3', userName: 'Carol', isFollowing: true })
    );

    await act(async () => {
      await result.current.handleFollowToggle();
    });

    expect(mutateAsyncMock).toHaveBeenCalledWith({ userId: 'user_3', action: 'unfollow' });
    expect(ensureAuthenticatedActionMock).toHaveBeenCalledWith({ reason: 'action:unfollow:user:user_3' });
    expect(toastErrorMock).not.toHaveBeenCalled();
  });

  it('shows a generic error for non-auth follow failures', async () => {
    mockUseAuth.mockReturnValue({
      user: { id: 'viewer_2' },
      isAuthenticated: true,
      isLoading: false,
      email: null,
      checkAuth: jest.fn(),
      logout: jest.fn(),
      isLoggingOut: false,
    } as any);
    mutateAsyncMock.mockRejectedValue(new Error('boom'));

    const { result } = renderHook(() =>
      useProtectedFollowAction({ userId: 'user_4', userName: 'Dave', isFollowing: false })
    );

    await act(async () => {
      await result.current.handleFollowToggle();
    });

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Failed to follow. Please try again.');
    });
  });
});

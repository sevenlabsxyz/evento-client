import { useCheckUsername } from '@/lib/hooks/use-check-username';
import {
  useFollowAction,
  useFollowStatus,
  useSearchUsers,
  useUpdateUserProfile,
  useUserByUsername,
  useUserEventCount,
  useUserFollowers,
  useUserFollowing,
  useUserProfile,
} from '@/lib/hooks/use-user-profile';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock the API client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    patch: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
  default: {
    get: jest.fn(),
    patch: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock the auth service
jest.mock('@/lib/services/auth', () => ({
  authService: {
    getCurrentUser: jest.fn(),
  },
}));

// Mock the auth store
jest.mock('@/lib/stores/auth-store', () => ({
  useAuthStore: () => ({
    user: null,
    setUser: jest.fn(),
    clearAuth: jest.fn(),
  }),
}));

import { apiClient as mockApiClient } from '@/lib/api/client';
import { authService as mockAuthService } from '@/lib/services/auth';

// Type the mock API client
const mockApiClientTyped = mockApiClient as any;
const mockAuthServiceTyped = mockAuthService as any;

describe('User Profile Hooks', () => {
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

  describe('useUserProfile', () => {
    it('returns loading state initially', () => {
      mockAuthServiceTyped.getCurrentUser.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });

    it('returns user profile data when available', async () => {
      const mockUser = {
        id: 'user1',
        username: 'testuser',
        name: 'Test User',
        bio: 'Test bio',
        image: 'test.jpg',
        bio_link: '',
        x_handle: '',
        instagram_handle: '',
        ln_address: '',
        nip05: '',
        verification_status: null,
        verification_date: '',
      };

      mockAuthServiceTyped.getCurrentUser.mockResolvedValue(mockUser);

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });

    it('handles authentication errors gracefully', async () => {
      const authError = { message: 'Unauthorized', status: 401 };
      mockAuthServiceTyped.getCurrentUser.mockRejectedValue(authError);

      const { result } = renderHook(() => useUserProfile(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user).toBe(null);
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('useUpdateUserProfile', () => {
    it('updates user profile successfully', async () => {
      const updatedUser = {
        id: 'user1',
        username: 'newusername',
        name: 'New Name',
        bio: 'Updated bio',
        image: 'new-image.jpg',
        bio_link: 'https://example.com',
        x_handle: '@newtwitter',
        instagram_handle: '@newinsta',
        ln_address: 'user@wallet.com',
        nip05: 'user@nostr.com',
        verification_status: 'verified',
        verification_date: '2024-01-01',
      };

      mockApiClientTyped.patch.mockResolvedValue({
        data: [updatedUser],
      });

      const { result } = renderHook(() => useUpdateUserProfile(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          username: 'newusername',
          name: 'New Name',
          bio: 'Updated bio',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClientTyped.patch).toHaveBeenCalledWith('/v1/user', {
        username: 'newusername',
        name: 'New Name',
        bio: 'Updated bio',
      });
    });

    it('handles profile update errors gracefully', async () => {
      const updateError = new Error('Update failed');
      mockApiClientTyped.patch.mockRejectedValue(updateError);

      const { result } = renderHook(() => useUpdateUserProfile(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({ name: 'New Name' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(updateError);
    });
  });

  describe('useSearchUsers', () => {
    it('searches users successfully', async () => {
      const mockUsers = [
        {
          id: 'user1',
          username: 'user1',
          name: 'User One',
          bio: '',
          image: '',
          bio_link: '',
          x_handle: '',
          instagram_handle: '',
          ln_address: '',
          nip05: '',
          verification_status: null,
          verification_date: '',
        },
        {
          id: 'user2',
          username: 'user2',
          name: 'User Two',
          bio: '',
          image: '',
          bio_link: '',
          x_handle: '',
          instagram_handle: '',
          ln_address: '',
          nip05: '',
          verification_status: null,
          verification_date: '',
        },
      ];

      mockApiClientTyped.get.mockResolvedValue(mockUsers);

      const { result } = renderHook(() => useSearchUsers(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('test');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClientTyped.get).toHaveBeenCalledWith('/v1/user/search?s=test');
      expect(result.current.data).toEqual(mockUsers);
    });

    it('handles search errors gracefully', async () => {
      const searchError = new Error('Search failed');
      mockApiClientTyped.get.mockRejectedValue(searchError);

      const { result } = renderHook(() => useSearchUsers(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('test');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(searchError);
    });
  });

  describe('useFollowStatus', () => {
    it('returns follow status for a user', async () => {
      mockApiClientTyped.get.mockResolvedValue({
        data: { isFollowing: true },
      });

      const { result } = renderHook(() => useFollowStatus('user123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({ isFollowing: true });
      expect(mockApiClientTyped.get).toHaveBeenCalledWith('/v1/user/follow?id=user123');
    });

    it('is disabled when userId is empty', () => {
      const { result } = renderHook(() => useFollowStatus(''), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockApiClientTyped.get).not.toHaveBeenCalled();
    });
  });

  describe('useFollowAction', () => {
    it('follows a user successfully', async () => {
      mockApiClientTyped.post.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useFollowAction(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({ userId: 'user123', action: 'follow' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClientTyped.post).toHaveBeenCalledWith('/v1/user/follow', {
        followId: 'user123',
      });
    });

    it('unfollows a user successfully', async () => {
      mockApiClientTyped.delete.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useFollowAction(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({ userId: 'user123', action: 'unfollow' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClientTyped.delete).toHaveBeenCalledWith('/v1/user/follow', {
        data: { followId: 'user123' },
      });
    });

    it('handles follow errors gracefully', async () => {
      const followError = new Error('Follow failed');
      mockApiClientTyped.post.mockRejectedValue(followError);

      const { result } = renderHook(() => useFollowAction(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({ userId: 'user123', action: 'follow' });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(followError);
    });
  });

  describe('useUserFollowers', () => {
    it('returns user followers', async () => {
      const mockApiResponse = [
        {
          follower_id: 'follower1',
          user_details: {
            id: 'follower1',
            username: 'follower1',
            name: 'Follower One',
            image: 'follower1.jpg',
            verification_status: null,
          },
        },
      ];

      mockApiClientTyped.get.mockResolvedValue({
        data: mockApiResponse,
      });

      const { result } = renderHook(() => useUserFollowers('user123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([
        {
          id: 'follower1',
          username: 'follower1',
          name: 'Follower One',
          image: 'follower1.jpg',
          verification_status: '',
        },
      ]);
    });

    it('is disabled when userId is empty', () => {
      const { result } = renderHook(() => useUserFollowers(''), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockApiClientTyped.get).not.toHaveBeenCalled();
    });
  });

  describe('useUserFollowing', () => {
    it('returns users that a user is following', async () => {
      const mockApiResponse = [
        {
          followed_id: 'followed1',
          user_details: {
            id: 'followed1',
            username: 'followed1',
            name: 'Followed One',
            image: 'followed1.jpg',
            verification_status: 'verified',
          },
        },
      ];

      mockApiClientTyped.get.mockResolvedValue({
        data: mockApiResponse,
      });

      const { result } = renderHook(() => useUserFollowing('user123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([
        {
          id: 'followed1',
          username: 'followed1',
          name: 'Followed One',
          image: 'followed1.jpg',
          verification_status: 'verified',
        },
      ]);
    });
  });

  describe('useUserEventCount', () => {
    it('returns user event count', async () => {
      mockApiClientTyped.get.mockResolvedValue({
        data: { count: 5 },
      });

      const { result } = renderHook(() => useUserEventCount('user123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(5);
      expect(mockApiClientTyped.get).toHaveBeenCalledWith('/v1/user/events/count?id=user123');
    });
  });

  describe('useUserByUsername', () => {
    it('returns user profile by username', async () => {
      const mockUser = {
        id: 'user1',
        username: 'testuser',
        name: 'Test User',
        bio: 'Test bio',
        image: 'test.jpg',
        bio_link: '',
        x_handle: '',
        instagram_handle: '',
        ln_address: '',
        nip05: '',
        verification_status: null,
        verification_date: '',
      };

      mockApiClientTyped.get.mockResolvedValue({
        data: mockUser,
      });

      const { result } = renderHook(() => useUserByUsername('testuser'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockUser);
    });

    it('returns undefined for non-existent user', async () => {
      const notFoundError = { status: 404, message: 'User not found' };
      mockApiClientTyped.get.mockRejectedValue(notFoundError);

      const { result } = renderHook(() => useUserByUsername('nonexistent'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
    });

    it('is disabled when username is empty', () => {
      const { result } = renderHook(() => useUserByUsername(''), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockApiClientTyped.get).not.toHaveBeenCalled();
    });
  });

  describe('useCheckUsername', () => {
    it('validates username length - too short', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate('ab');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        available: false,
        message: 'Username must be at least 3 characters',
      });
    });

    it('validates username length - too long', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate('a'.repeat(21));
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        available: false,
        message: 'Username must be less than 20 characters',
      });
    });

    it('validates username format - invalid characters', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate('user-name');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        available: false,
        message: 'Username can only contain letters, numbers, and underscores',
      });
    });

    it('checks username availability - available', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate('validusername');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ available: true });
    });

    it('checks username availability - not available', async () => {
      // Override the mock to return not available for this specific test
      mockApiClientTyped.get.mockResolvedValueOnce({
        data: {
          available: false,
          message: 'Username already taken',
        },
      });

      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate('takenusername');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        available: false,
        message: 'Username already taken',
      });
    });

    it('handles 404 error as available username', async () => {
      // Override the mock to return 404
      const { default: mockApiClient } = require('@/lib/api/client');
      mockApiClient.get.mockRejectedValueOnce({
        status: 404,
        message: 'Not found',
      });

      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate('newusername');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ available: true });
    });

    it('handles API errors gracefully', async () => {
      // Override the mock to return network error
      mockApiClientTyped.get.mockRejectedValueOnce({
        status: 500,
        message: 'Network error',
      });

      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate('testusername');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        available: false,
        message: 'Unable to check username availability',
      });
    });

    it('trims and lowercases username', async () => {
      const { result } = renderHook(() => useCheckUsername(), {
        wrapper: createTestWrapper(),
      });

      await act(async () => {
        result.current.mutate('  TestUser  ');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ available: true });
    });
  });
});

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

const mockApiClient = require('@/lib/api/client').apiClient as jest.Mocked<typeof apiClient>;
const mockAuthService = require('@/lib/services/auth').authService as jest.Mocked<
  typeof authService
>;

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
      mockAuthService.getCurrentUser.mockImplementation(() => new Promise(() => {}));

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

      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

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
      mockAuthService.getCurrentUser.mockRejectedValue(authError);

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

      mockApiClient.patch.mockResolvedValue({
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

      expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/user', {
        username: 'newusername',
        name: 'New Name',
        bio: 'Updated bio',
      });
    });

    it('handles profile update errors gracefully', async () => {
      const updateError = new Error('Update failed');
      mockApiClient.patch.mockRejectedValue(updateError);

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

      mockApiClient.get.mockResolvedValue(mockUsers);

      const { result } = renderHook(() => useSearchUsers(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('test');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/user/search?s=test');
      expect(result.current.data).toEqual(mockUsers);
    });

    it('handles search errors gracefully', async () => {
      const searchError = new Error('Search failed');
      mockApiClient.get.mockRejectedValue(searchError);

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
      mockApiClient.get.mockResolvedValue({
        data: { isFollowing: true },
      });

      const { result } = renderHook(() => useFollowStatus('user123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({ isFollowing: true });
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/user/follow?id=user123');
    });

    it('is disabled when userId is empty', () => {
      const { result } = renderHook(() => useFollowStatus(''), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });
  });

  describe('useFollowAction', () => {
    it('follows a user successfully', async () => {
      mockApiClient.post.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useFollowAction(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({ userId: 'user123', action: 'follow' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/user/follow', {
        followId: 'user123',
      });
    });

    it('unfollows a user successfully', async () => {
      mockApiClient.delete.mockResolvedValue({ data: { success: true } });

      const { result } = renderHook(() => useFollowAction(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({ userId: 'user123', action: 'unfollow' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/user/follow', {
        data: { followId: 'user123' },
      });
    });

    it('handles follow errors gracefully', async () => {
      const followError = new Error('Follow failed');
      mockApiClient.post.mockRejectedValue(followError);

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

      mockApiClient.get.mockResolvedValue({
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
          verification_status: null,
        },
      ]);
    });

    it('is disabled when userId is empty', () => {
      const { result } = renderHook(() => useUserFollowers(''), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockApiClient.get).not.toHaveBeenCalled();
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

      mockApiClient.get.mockResolvedValue({
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
      mockApiClient.get.mockResolvedValue({
        data: { count: 5 },
      });

      const { result } = renderHook(() => useUserEventCount('user123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(5);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/user/events/count?id=user123');
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

      mockApiClient.get.mockResolvedValue({
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

    it('returns null for non-existent user', async () => {
      const notFoundError = { status: 404, message: 'User not found' };
      mockApiClient.get.mockRejectedValue(notFoundError);

      const { result } = renderHook(() => useUserByUsername('nonexistent'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBe(null);
    });

    it('is disabled when username is empty', () => {
      const { result } = renderHook(() => useUserByUsername(''), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });
  });
});

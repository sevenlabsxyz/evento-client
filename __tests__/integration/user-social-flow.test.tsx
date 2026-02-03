import { useUserSearch } from '@/lib/hooks/use-search';
import {
  useFollowAction,
  useFollowStatus,
  useUserByUsername,
  useUserFollowers,
  useUserFollowing,
} from '@/lib/hooks/use-user-profile';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';

// Mock the API client
jest.mock('@/lib/api/client', () => {
  const mockApiClient = {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
    head: jest.fn(),
    options: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    __esModule: true,
    default: mockApiClient,
    apiClient: mockApiClient,
  };
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: '/',
    query: {},
    asPath: '/',
    events: {
      on: jest.fn(),
      off: jest.fn(),
      emit: jest.fn(),
    },
    isFallback: false,
    isLocaleDomain: false,
    isReady: true,
    isPreview: false,
    basePath: '',
    locale: 'en',
    locales: ['en'],
    defaultLocale: 'en',
    domainLocales: [],
    isSsr: false,
  }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({}),
}));

describe('User Social Integration Flow', () => {
  let queryClient: QueryClient;
  let mockApiClient: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockApiClient = require('@/lib/api/client').default;
    mockApiClient.get.mockClear();
    mockApiClient.post.mockClear();
    mockApiClient.delete.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createWrapper = (client: QueryClient) => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  it('should handle follow/unfollow flow', async () => {
    const mockFollowStatus = {
      isFollowing: false,
    };

    const mockFollowResponse = {
      success: true,
      message: 'Followed successfully',
      data: { isFollowing: true },
    };

    mockApiClient.get.mockResolvedValueOnce({
      success: true,
      data: mockFollowStatus,
    });

    mockApiClient.post.mockResolvedValueOnce({
      success: true,
      data: mockFollowResponse,
    });

    // Test follow status query
    const { result: followStatusResult } = renderHook(() => useFollowStatus('user123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/user/follow?id=user123');
    expect(followStatusResult.current.data).toEqual(mockFollowStatus);

    // Test follow action
    const { result: followActionResult } = renderHook(() => useFollowAction(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      followActionResult.current.mutate({
        userId: 'user123',
        action: 'follow',
      });
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/v1/user/follow', {
      followId: 'user123',
    });
    expect(followActionResult.current.isPending).toBe(false);
    expect(followActionResult.current.error).toBeNull();
  });

  it('should handle unfollow action', async () => {
    const mockUnfollowResponse = {
      success: true,
      message: 'Unfollowed successfully',
      data: { isFollowing: false },
    };

    mockApiClient.delete.mockResolvedValueOnce({
      success: true,
      data: mockUnfollowResponse,
    });

    const { result } = renderHook(() => useFollowAction(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({
        userId: 'user123',
        action: 'unfollow',
      });
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/user/follow', {
      data: {
        followId: 'user123',
      },
    });
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle follow action errors', async () => {
    mockApiClient.post.mockRejectedValueOnce(new Error('Failed to follow user'));

    const { result } = renderHook(() => useFollowAction(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate({
        userId: 'user123',
        action: 'follow',
      });
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/v1/user/follow', {
      followId: 'user123',
    });
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('should fetch user followers', async () => {
    const mockApiResponse = [
      {
        user_details: {
          id: 'follower1',
          username: 'follower1',
          name: 'Follower One',
          image: 'follower1.jpg',
          verification_status: 'verified',
        },
      },
      {
        user_details: {
          id: 'follower2',
          username: 'follower2',
          name: 'Follower Two',
          image: 'follower2.jpg',
          verification_status: 'unverified',
        },
      },
    ];

    const expectedTransformedData = [
      {
        id: 'follower1',
        username: 'follower1',
        name: 'Follower One',
        image: 'follower1.jpg',
        verification_status: 'verified',
      },
      {
        id: 'follower2',
        username: 'follower2',
        name: 'Follower Two',
        image: 'follower2.jpg',
        verification_status: 'unverified',
      },
    ];

    mockApiClient.get.mockResolvedValueOnce({
      success: true,
      data: mockApiResponse,
    });

    const { result } = renderHook(() => useUserFollowers('user123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/user/followers/list?id=user123');
    expect(result.current.data).toEqual(expectedTransformedData);
    expect(result.current.isLoading).toBe(false);
  });

  it('should fetch user following', async () => {
    const mockApiResponse = [
      {
        user_details: {
          id: 'following1',
          username: 'following1',
          name: 'Following One',
          image: 'following1.jpg',
          verification_status: 'verified',
        },
      },
      {
        user_details: {
          id: 'following2',
          username: 'following2',
          name: 'Following Two',
          image: 'following2.jpg',
          verification_status: 'unverified',
        },
      },
    ];

    const expectedTransformedData = [
      {
        id: 'following1',
        username: 'following1',
        name: 'Following One',
        image: 'following1.jpg',
        verification_status: 'verified',
      },
      {
        id: 'following2',
        username: 'following2',
        name: 'Following Two',
        image: 'following2.jpg',
        verification_status: 'unverified',
      },
    ];

    mockApiClient.get.mockResolvedValueOnce({
      success: true,
      data: mockApiResponse,
    });

    const { result } = renderHook(() => useUserFollowing('user123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/user/follows/list?id=user123');
    expect(result.current.data).toEqual(expectedTransformedData);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle user search', async () => {
    const mockSearchResults = [
      {
        id: 'user1',
        username: 'user1',
        name: 'User One',
        image: 'user1.jpg',
      },
      {
        id: 'user2',
        username: 'user2',
        name: 'User Two',
        image: 'user2.jpg',
      },
    ];

    mockApiClient.get.mockResolvedValueOnce({
      success: true,
      data: mockSearchResults,
    });

    const { result } = renderHook(() => useUserSearch(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate('test');
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/user/search?s=test');
    expect(result.current.data).toEqual(mockSearchResults);
    expect(result.current.isPending).toBe(false);
  });

  it('should handle user profile fetching by username', async () => {
    const mockUserProfile = {
      id: 'user123',
      username: 'testuser',
      name: 'Test User',
      image: 'test.jpg',
      bio: 'Test bio',
      followers_count: 100,
      following_count: 50,
      events_count: 25,
    };

    mockApiClient.get.mockResolvedValueOnce({
      success: true,
      data: mockUserProfile,
    });

    const { result } = renderHook(() => useUserByUsername('testuser'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/user/details?username=testuser');
    expect(result.current.data).toEqual(mockUserProfile);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle social feature errors gracefully', async () => {
    mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useUserFollowers('user123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/user/followers/list?id=user123');
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeTruthy();
  });
});

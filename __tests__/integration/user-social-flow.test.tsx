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

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
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
    const { result: followStatusResult } = renderHook(() => useFollowStatus('user123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(followStatusResult.current.data).toBeDefined();

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
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(followActionResult.current.isPending).toBe(false);
    expect(followActionResult.current.error).toBeNull();
  });

  it('should handle unfollow action', async () => {
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
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle follow action errors', async () => {
    const mockApiClient = require('@/lib/api/client').default;
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
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('should fetch user followers', async () => {
    const { result } = renderHook(() => useUserFollowers('user123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBeGreaterThan(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('should fetch user following', async () => {
    const { result } = renderHook(() => useUserFollowing('user123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBeGreaterThan(0);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle user search', async () => {
    const { result } = renderHook(() => useUserSearch(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate('test');
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.isPending).toBe(false);
  });

  it('should handle user profile fetching by username', async () => {
    const { result } = renderHook(() => useUserByUsername('testuser'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle social feature errors gracefully', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    mockApiClient.get.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useUserFollowers('user123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeTruthy();
  });
});

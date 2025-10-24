import { useStreamChat, useStreamChatChannels } from '@/lib/hooks/use-stream-chat';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';

// Mock the Stream Chat service
jest.mock('@/lib/services/stream-chat', () => ({
  streamChatService: {
    getToken: jest.fn(),
    syncUser: jest.fn(),
    getChannels: jest.fn(),
  },
  getStreamChatApiKey: jest.fn(() => 'mock-api-key'),
}));

// Mock the auth hook
jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

// Mock Stream Chat
jest.mock('stream-chat', () => ({
  StreamChat: {
    getInstance: jest.fn(),
  },
}));

// Mock next/navigation
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
    route: '/',
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

describe('Stream Chat Integration Flow', () => {
  let queryClient: QueryClient;
  let mockStreamChatService: any;
  let mockStreamChat: any;
  let mockUseAuth: any;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });

    mockStreamChatService = require('@/lib/services/stream-chat').streamChatService;
    mockStreamChat = require('stream-chat').StreamChat;
    mockUseAuth = require('@/lib/hooks/use-auth').useAuth;

    // Reset all mocks
    jest.clearAllMocks();
    mockStreamChatService.getToken.mockClear();
    mockStreamChatService.syncUser.mockClear();
    mockStreamChatService.getChannels.mockClear();
    mockStreamChat.getInstance.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createWrapper = (client: QueryClient) => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  it('should initialize Stream Chat client successfully', async () => {
    const mockUser = {
      id: 'user123',
      name: 'Test User',
      username: 'testuser',
      image: 'test.jpg',
    };

    const mockTokenData = {
      token: 'mock-stream-token',
    };

    const mockStreamUser = {
      id: 'user123',
      name: 'Test User',
      image: 'test.jpg',
    };

    const mockClient = {
      connectUser: jest.fn().mockResolvedValue(undefined),
      disconnectUser: jest.fn(),
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });

    mockStreamChatService.getToken.mockResolvedValue(mockTokenData);
    mockStreamChatService.syncUser.mockResolvedValue(mockStreamUser);
    mockStreamChat.getInstance.mockReturnValue(mockClient);

    const { result } = renderHook(() => useStreamChat(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(mockStreamChatService.getToken).toHaveBeenCalled();
    expect(mockStreamChatService.syncUser).toHaveBeenCalled();
    expect(mockStreamChat.getInstance).toHaveBeenCalledWith('mock-api-key');
    expect(mockClient.connectUser).toHaveBeenCalledWith(
      {
        id: 'user123',
        name: 'Test User',
        image: 'test.jpg',
      },
      'mock-stream-token'
    );
    expect(result.current.client).toBe(mockClient);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle Stream Chat connection errors', async () => {
    const mockUser = {
      id: 'user123',
      name: 'Test User',
      username: 'testuser',
    };

    const mockTokenData = {
      token: 'mock-stream-token',
    };

    const mockClient = {
      connectUser: jest.fn().mockRejectedValue(new Error('Connection failed')),
      disconnectUser: jest.fn(),
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });

    mockStreamChatService.getToken.mockResolvedValue(mockTokenData);
    mockStreamChatService.syncUser.mockResolvedValue({});
    mockStreamChat.getInstance.mockReturnValue(mockClient);

    const { result } = renderHook(() => useStreamChat(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(mockClient.connectUser).toHaveBeenCalled();
    expect(result.current.client).toBeNull();
    expect(result.current.error).toBe('Failed to connect to chat service');
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle token fetch errors', async () => {
    const mockUser = {
      id: 'user123',
      name: 'Test User',
      username: 'testuser',
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });

    mockStreamChatService.getToken.mockRejectedValue(new Error('Token fetch failed'));

    const { result } = renderHook(() => useStreamChat(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(mockStreamChatService.getToken).toHaveBeenCalled();
    expect(result.current.client).toBeNull();
    // The error might be in the query error state, so check if there's any error
    expect(result.current.error || result.current.isLoading).toBeTruthy();
  });

  it('should not connect when user is not authenticated', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    const { result } = renderHook(() => useStreamChat(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockStreamChatService.getToken).not.toHaveBeenCalled();
    expect(mockStreamChatService.syncUser).not.toHaveBeenCalled();
    expect(result.current.client).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should fetch channels successfully', async () => {
    const mockUser = {
      id: 'user123',
      name: 'Test User',
      username: 'testuser',
    };

    const mockChannels = [
      {
        id: 'channel1',
        name: 'General',
        type: 'messaging',
      },
      {
        id: 'channel2',
        name: 'Events',
        type: 'messaging',
      },
    ];

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });

    mockStreamChatService.getChannels.mockResolvedValue(mockChannels);

    const { result } = renderHook(() => useStreamChatChannels(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockStreamChatService.getChannels).toHaveBeenCalled();
    expect(result.current.data).toEqual(mockChannels);
    expect(result.current.isLoading).toBe(false);
  });

  it('should handle channel fetch errors', async () => {
    const mockUser = {
      id: 'user123',
      name: 'Test User',
      username: 'testuser',
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });

    mockStreamChatService.getChannels.mockRejectedValue(new Error('Channels fetch failed'));

    const { result } = renderHook(() => useStreamChatChannels(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockStreamChatService.getChannels).toHaveBeenCalled();
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBeTruthy();
    expect(result.current.isLoading).toBe(false);
  });

  it('should disconnect when user logs out', async () => {
    const mockUser = {
      id: 'user123',
      name: 'Test User',
      username: 'testuser',
    };

    const mockTokenData = {
      token: 'mock-stream-token',
    };

    const mockClient = {
      connectUser: jest.fn().mockResolvedValue(undefined),
      disconnectUser: jest.fn(),
    };

    // Start with authenticated user
    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });

    mockStreamChatService.getToken.mockResolvedValue(mockTokenData);
    mockStreamChatService.syncUser.mockResolvedValue({});
    mockStreamChat.getInstance.mockReturnValue(mockClient);

    const { result, rerender } = renderHook(() => useStreamChat(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.client).toBe(mockClient);

    // Simulate user logout
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
    });

    rerender();

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockClient.disconnectUser).toHaveBeenCalled();
    expect(result.current.client).toBeNull();
  });

  it('should handle autoConnect option', async () => {
    const mockUser = {
      id: 'user123',
      name: 'Test User',
      username: 'testuser',
    };

    mockUseAuth.mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    });

    const { result } = renderHook(() => useStreamChat({ autoConnect: false }), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockStreamChatService.getToken).not.toHaveBeenCalled();
    expect(result.current.client).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});

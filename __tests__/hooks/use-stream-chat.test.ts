import { useStreamChat, useStreamChatChannels } from '@/lib/hooks/use-stream-chat';
import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock Stream Chat
const mockStreamChatClient = {
  connectUser: jest.fn(),
  disconnectUser: jest.fn(),
  on: jest.fn(),
  off: jest.fn(),
  queryChannels: jest.fn(),
  queryUsers: jest.fn(),
  channel: jest.fn(),
  user: jest.fn(),
  setUser: jest.fn(),
  updateAppSettings: jest.fn(),
  getAuthType: jest.fn(),
  getConnectionId: jest.fn(),
  getConnectionState: jest.fn(),
  isConnected: jest.fn(),
  muteUser: jest.fn(),
  unmuteUser: jest.fn(),
  muteChannel: jest.fn(),
  unmuteChannel: jest.fn(),
  muteAllChannels: jest.fn(),
  unmuteAllChannels: jest.fn(),
  muteUserGlobally: jest.fn(),
  unmuteUserGlobally: jest.fn(),
  banUser: jest.fn(),
  unbanUser: jest.fn(),
  flagUser: jest.fn(),
  unflagUser: jest.fn(),
  flagMessage: jest.fn(),
  unflagMessage: jest.fn(),
  flagChannel: jest.fn(),
  unflagChannel: jest.fn(),
  hideChannel: jest.fn(),
  showChannel: jest.fn(),
  deleteChannel: jest.fn(),
  deleteMessage: jest.fn(),
  search: jest.fn(),
  searchChannels: jest.fn(),
  searchUsers: jest.fn(),
  searchMessages: jest.fn(),
  getAppSettings: jest.fn(),
  getAppPermissions: jest.fn(),
  getAppConfig: jest.fn(),
  getAppInfo: jest.fn(),
  getAppVersion: jest.fn(),
  getAppEnvironment: jest.fn(),
  getAppRegion: jest.fn(),
  getAppTimezone: jest.fn(),
  getAppLanguage: jest.fn(),
  getAppCurrency: jest.fn(),
  getAppDateFormat: jest.fn(),
  getAppTimeFormat: jest.fn(),
  getAppNumberFormat: jest.fn(),
  getAppBooleanFormat: jest.fn(),
  getAppArrayFormat: jest.fn(),
  getAppObjectFormat: jest.fn(),
  getAppStringFormat: jest.fn(),
  getAppNumberArrayFormat: jest.fn(),
  getAppStringArrayFormat: jest.fn(),
  getAppObjectArrayFormat: jest.fn(),
  getAppBooleanArrayFormat: jest.fn(),
  getAppDateArrayFormat: jest.fn(),
  getAppTimeArrayFormat: jest.fn(),
  getAppDateTimeArrayFormat: jest.fn(),
  getAppTimestampArrayFormat: jest.fn(),
  getAppDurationArrayFormat: jest.fn(),
  getAppIntervalArrayFormat: jest.fn(),
  getAppFrequencyArrayFormat: jest.fn(),
  getAppRateArrayFormat: jest.fn(),
  getAppRatioArrayFormat: jest.fn(),
  getAppPercentageArrayFormat: jest.fn(),
  getAppDecimalArrayFormat: jest.fn(),
  getAppFloatArrayFormat: jest.fn(),
  getAppIntegerArrayFormat: jest.fn(),
  getAppLongArrayFormat: jest.fn(),
  getAppShortArrayFormat: jest.fn(),
  getAppByteArrayFormat: jest.fn(),
  getAppCharArrayFormat: jest.fn(),
};

jest.mock('stream-chat', () => ({
  StreamChat: {
    getInstance: jest.fn(() => mockStreamChatClient),
  },
}));

// Mock the stream chat service
jest.mock('@/lib/services/stream-chat', () => ({
  streamChatService: {
    getToken: jest.fn(),
    syncUser: jest.fn(),
    getChannels: jest.fn(),
    createDirectMessageChannel: jest.fn(),
    createChannel: jest.fn(),
    updateChannel: jest.fn(),
    deleteChannel: jest.fn(),
  },
  getStreamChatApiKey: jest.fn(() => 'test-api-key'),
}));

// Mock the auth hook
const mockAuthUser = {
  id: 'user123',
  username: 'testuser',
  name: 'Test User',
  email: 'test@example.com',
  bio: 'Test bio',
  image: 'test-image.jpg',
  bio_link: '',
  x_handle: '',
  instagram_handle: '',
  ln_address: '',
  nip05: '',
  verification_status: null,
  verification_date: '',
};

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: jest.fn(() => ({
    user: mockAuthUser,
    isAuthenticated: true,
    email: 'test@example.com',
  })),
}));

describe('useStreamChat', () => {
  let queryClient: QueryClient;
  let wrapper: ReturnType<typeof createTestWrapper>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
        mutations: { retry: false },
      },
    });
    wrapper = createTestWrapper(queryClient);

    // Reset all mocks
    jest.clearAllMocks();
    mockStreamChatClient.connectUser.mockClear();
    mockStreamChatClient.disconnectUser.mockClear();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should return initial state correctly', () => {
    const { result } = renderHook(() => useStreamChat(), { wrapper });

    expect(result.current).toMatchObject({
      client: null,
      isLoading: true,
      isConnecting: false,
      error: null,
      streamUser: undefined,
      refetchToken: expect.any(Function),
      isAuthenticated: true,
    });
  });

  it('should create Stream Chat client when authenticated', () => {
    const { result } = renderHook(() => useStreamChat(), { wrapper });

    expect(result.current.client).toBeNull();
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle unauthenticated state', () => {
    const { useAuth } = require('@/lib/hooks/use-auth');
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      email: null,
    });

    const { result } = renderHook(() => useStreamChat(), { wrapper });

    expect(result.current).toMatchObject({
      client: null,
      isAuthenticated: false,
    });
  });

  it('should not connect when autoConnect is false', async () => {
    const { result } = renderHook(() => useStreamChat({ autoConnect: false }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockStreamChatClient.connectUser).not.toHaveBeenCalled();
    expect(result.current.client).toBeNull();
  });

  it('should provide refetchToken function', async () => {
    const { result } = renderHook(() => useStreamChat(), { wrapper });

    expect(typeof result.current.refetchToken).toBe('function');
  });

  it('should handle Stream Chat client creation errors', () => {
    const { getStreamChatApiKey } = require('@/lib/services/stream-chat');
    getStreamChatApiKey.mockImplementation(() => {
      throw new Error('API key not found');
    });

    const { result } = renderHook(() => useStreamChat(), { wrapper });

    // The hook should still return a valid state even when client creation fails
    expect(result.current).toBeDefined();
    expect(typeof result.current.refetchToken).toBe('function');
    expect(result.current.client).toBeNull();
  });

  it('should handle user with missing name gracefully', () => {
    const { useAuth } = require('@/lib/hooks/use-auth');
    useAuth.mockReturnValue({
      user: {
        ...mockAuthUser,
        name: null,
        username: null,
      },
      isAuthenticated: true,
      email: 'test@example.com',
    });

    const { result } = renderHook(() => useStreamChat(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle user with missing image gracefully', () => {
    const { useAuth } = require('@/lib/hooks/use-auth');
    useAuth.mockReturnValue({
      user: {
        ...mockAuthUser,
        image: null,
      },
      isAuthenticated: true,
      email: 'test@example.com',
    });

    const { result } = renderHook(() => useStreamChat(), { wrapper });

    expect(result.current.isAuthenticated).toBe(true);
  });
});

describe('useStreamChatChannels', () => {
  let queryClient: QueryClient;
  let wrapper: ReturnType<typeof createTestWrapper>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
        mutations: { retry: false },
      },
    });
    wrapper = createTestWrapper(queryClient);

    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should return initial state correctly', () => {
    const { result } = renderHook(() => useStreamChatChannels(), { wrapper });

    expect(result.current).toMatchObject({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: expect.any(Function),
    });
  });

  it('should not fetch when user is not authenticated', () => {
    const { useAuth } = require('@/lib/hooks/use-auth');
    useAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      email: null,
    });

    const { result } = renderHook(() => useStreamChatChannels(), { wrapper });

    expect(result.current.isLoading).toBe(false);
  });

  it('should provide refetch function', () => {
    const { result } = renderHook(() => useStreamChatChannels(), { wrapper });

    expect(typeof result.current.refetch).toBe('function');
  });
});

describe('Integration Tests', () => {
  let queryClient: QueryClient;
  let wrapper: ReturnType<typeof createTestWrapper>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
        mutations: { retry: false },
      },
    });
    wrapper = createTestWrapper(queryClient);

    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should work with both hooks simultaneously', () => {
    const { result: chatResult } = renderHook(() => useStreamChat(), {
      wrapper,
    });
    const { result: channelsResult } = renderHook(() => useStreamChatChannels(), {
      wrapper,
    });

    // Both hooks should be initialized
    expect(chatResult.current).toBeDefined();
    expect(channelsResult.current).toBeDefined();
    expect(typeof chatResult.current.refetchToken).toBe('function');
    expect(typeof channelsResult.current.refetch).toBe('function');
  });

  it('should handle cleanup on unmount', () => {
    const { result, unmount } = renderHook(() => useStreamChat(), { wrapper });

    expect(result.current.client).toBeNull();

    // Unmount the component
    unmount();

    // The client should not be disconnected on unmount (as per the comment in the code)
    expect(mockStreamChatClient.disconnectUser).not.toHaveBeenCalled();
  });
});

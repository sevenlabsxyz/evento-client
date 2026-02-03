import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
import { useUpsertRSVP } from '@/lib/hooks/use-upsert-rsvp';
import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
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
  useParams: () => ({ id: 'event123' }),
}));

// Mock the auth hook
jest.mock('@/lib/hooks/use-auth', () => ({
  useRequireAuth: () => ({ isLoading: false, isAuthenticated: true }),
}));

describe('RSVP Integration Flow', () => {
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
    mockApiClient.patch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createWrapper = (client: QueryClient) => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  it('should fetch event RSVPs successfully', async () => {
    const mockRSVPs = [
      {
        id: 'rsvp1',
        user_id: 'user1',
        event_id: 'event123',
        status: 'yes',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'rsvp2',
        user_id: 'user2',
        event_id: 'event123',
        status: 'maybe',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      },
    ];

    mockApiClient.get.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: mockRSVPs,
    });

    const { result } = renderHook(() => useEventRSVPs('event123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      // Wait for the query to complete
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/event123/rsvps');
    expect(result.current.data).toEqual(mockRSVPs);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch user RSVP status', async () => {
    const mockUserRSVP = {
      id: 'rsvp1',
      user_id: 'current_user',
      event_id: 'event123',
      status: 'yes',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
    };

    mockApiClient.get.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: [mockUserRSVP],
    });

    const { result } = renderHook(() => useUserRSVP('event123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      // Wait for the query to complete
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/event123/rsvps/me');
    expect(result.current.data).toEqual({
      status: 'yes',
      rsvp: mockUserRSVP,
    });
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should create RSVP successfully', async () => {
    const mockRSVPData = {
      eventId: 'event123',
      status: 'yes' as const,
      hasExisting: false,
    };

    const mockResponse = {
      success: true,
      message: 'RSVP created successfully',
      data: [
        {
          id: 'rsvp_new',
          user_id: 'current_user',
          event_id: 'event123',
          status: 'yes',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ],
    };

    mockApiClient.post.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useUpsertRSVP(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate(mockRSVPData);
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/event123/rsvps', {
      event_id: 'event123',
      status: 'yes',
    });
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should update RSVP successfully', async () => {
    const mockRSVPData = {
      eventId: 'event123',
      status: 'maybe' as const,
      hasExisting: true,
    };

    const mockResponse = {
      success: true,
      message: 'RSVP updated successfully',
      data: [
        {
          id: 'rsvp1',
          user_id: 'current_user',
          event_id: 'event123',
          status: 'maybe',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ],
    };

    mockApiClient.patch.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useUpsertRSVP(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate(mockRSVPData);
    });

    expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/event123/rsvps', {
      event_id: 'event123',
      status: 'maybe',
    });
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle RSVP errors gracefully', async () => {
    const mockRSVPData = {
      eventId: 'event123',
      status: 'yes' as const,
      hasExisting: false,
    };

    mockApiClient.post.mockRejectedValueOnce(new Error('Failed to create RSVP'));

    const { result } = renderHook(() => useUpsertRSVP(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate(mockRSVPData);
    });

    // Wait for the mutation to complete
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/event123/rsvps', {
      event_id: 'event123',
      status: 'yes',
    });
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('should handle different RSVP statuses', async () => {
    const statuses = ['yes', 'maybe', 'no'];

    for (const status of statuses) {
      const mockRSVPData = {
        eventId: 'event123',
        status: status as 'yes' | 'maybe' | 'no',
        hasExisting: false,
      };

      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        message: 'RSVP created successfully',
        data: [
          {
            id: `rsvp_${status}`,
            user_id: 'current_user',
            event_id: 'event123',
            status: status,
            created_at: '2025-01-01T00:00:00Z',
            updated_at: '2025-01-01T00:00:00Z',
          },
        ],
      });

      const { result } = renderHook(() => useUpsertRSVP(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate(mockRSVPData);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/event123/rsvps', {
        event_id: 'event123',
        status: status,
      });
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
    }
  });
});

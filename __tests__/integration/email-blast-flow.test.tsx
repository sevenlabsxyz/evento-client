import { useCreateEmailBlast, useEmailBlasts } from '@/lib/hooks/use-email-blasts';
import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
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
  useAuth: () => ({
    user: { id: 'user1', name: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

describe('Email Blast Integration Flow', () => {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createWrapper = (client: QueryClient) => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={client}>{children}</QueryClientProvider>
    );
  };

  it('should fetch email blast history successfully', async () => {
    const mockEmailBlasts = [
      {
        id: 'blast1',
        event_id: 'event123',
        user_id: 'user1',
        message: '<p>Come join us!</p>',
        recipient_filter: 'all',
        status: 'sent',
        scheduled_for: null,
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z',
      },
      {
        id: 'blast2',
        event_id: 'event123',
        user_id: 'user1',
        message: '<p>Reminder about the event</p>',
        recipient_filter: 'yes',
        status: 'sent',
        scheduled_for: null,
        created_at: '2025-01-01T11:00:00Z',
        updated_at: '2025-01-01T11:00:00Z',
      },
    ];

    mockApiClient.get.mockResolvedValueOnce({
      success: true,
      message: 'ok',
      data: mockEmailBlasts,
    });

    const { result } = renderHook(() => useEmailBlasts('event123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      // Wait for the query to complete
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/email-blasts/event123');
    expect(result.current.data).toEqual(mockEmailBlasts);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should create email blast successfully', async () => {
    const mockEmailBlastData = {
      message: "<p>Don't forget to arrive on time!</p>",
      recipientFilter: 'all' as const,
      scheduledFor: null,
    };

    const mockResponse = {
      success: true,
      message: 'Email blast created successfully',
      data: {
        id: 'blast_new',
        event_id: 'event123',
        user_id: 'user1',
        message: "<p>Don't forget to arrive on time!</p>",
        recipient_filter: 'all',
        status: 'sent',
        scheduled_for: null,
        created_at: '2025-01-01T12:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      },
    };

    mockApiClient.post.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useCreateEmailBlast('event123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate(mockEmailBlastData);
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/v1/events/email-blasts/event123',
      mockEmailBlastData
    );
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle email blast creation errors', async () => {
    const mockEmailBlastData = {
      message: '<p>Test message</p>',
      recipientFilter: 'all' as const,
      scheduledFor: null,
    };

    mockApiClient.post.mockRejectedValueOnce(new Error('Failed to create email blast'));

    const { result } = renderHook(() => useCreateEmailBlast('event123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate(mockEmailBlastData);
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/v1/events/email-blasts/event123',
      mockEmailBlastData
    );
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('should fetch RSVP data for recipient filtering', async () => {
    const mockRSVPs = [
      { id: 'rsvp1', status: 'yes', user_id: 'user1' },
      { id: 'rsvp2', status: 'yes', user_id: 'user2' },
      { id: 'rsvp3', status: 'maybe', user_id: 'user3' },
      { id: 'rsvp4', status: 'no', user_id: 'user4' },
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
      await new Promise((resolve) => setTimeout(resolve, 100));
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/rsvps?event_id=event123');
    expect(result.current.data).toEqual(mockRSVPs);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle different recipient filters', async () => {
    const recipientFilters = ['all', 'yes_only', 'yes_and_maybe'];

    for (const filter of recipientFilters) {
      const mockEmailBlastData = {
        message: `<p>Message for ${filter} recipients</p>`,
        recipientFilter: filter as 'all' | 'yes_only' | 'yes_and_maybe',
        scheduledFor: null,
      };

      mockApiClient.post.mockResolvedValueOnce({
        success: true,
        message: 'Email blast created successfully',
        data: {
          id: `blast_${filter}`,
          event_id: 'event123',
          user_id: 'user1',
          message: `<p>Message for ${filter} recipients</p>`,
          recipient_filter: filter,
          status: 'sent',
          scheduled_for: null,
          created_at: '2025-01-01T12:00:00Z',
          updated_at: '2025-01-01T12:00:00Z',
        },
      });

      const { result } = renderHook(() => useCreateEmailBlast('event123'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate(mockEmailBlastData);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/email-blasts/event123',
        mockEmailBlastData
      );
      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
    }
  });

  it('should handle scheduled email blasts', async () => {
    const scheduledDate = new Date('2025-01-02T10:00:00Z');
    const mockEmailBlastData = {
      message: '<p>Scheduled reminder</p>',
      recipientFilter: 'all' as const,
      scheduledFor: scheduledDate.toISOString(),
    };

    const mockResponse = {
      success: true,
      message: 'Email blast scheduled successfully',
      data: {
        id: 'blast_scheduled',
        event_id: 'event123',
        user_id: 'user1',
        message: '<p>Scheduled reminder</p>',
        recipient_filter: 'all',
        status: 'scheduled',
        scheduled_for: scheduledDate.toISOString(),
        created_at: '2025-01-01T12:00:00Z',
        updated_at: '2025-01-01T12:00:00Z',
      },
    };

    mockApiClient.post.mockResolvedValueOnce(mockResponse);

    const { result } = renderHook(() => useCreateEmailBlast('event123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate(mockEmailBlastData);
    });

    expect(mockApiClient.post).toHaveBeenCalledWith(
      '/v1/events/email-blasts/event123',
      mockEmailBlastData
    );
    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

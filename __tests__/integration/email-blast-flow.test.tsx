import { useCreateEmailBlast, useEmailBlasts } from '@/lib/hooks/use-email-blasts';
import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
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
  useParams: () => ({ id: 'event123' }),
}));

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    user: { id: 'user1', name: 'Test User' },
    isAuthenticated: true,
    isLoading: false,
  }),
}));

describe('Email Blast Integration Flow', () => {
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

  it('should fetch email blast history successfully', async () => {
    const { result } = renderHook(() => useEmailBlasts('event123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should create email blast successfully', async () => {
    const mockEmailBlastData = {
      message: "<p>Don't forget to arrive on time!</p>",
      recipientFilter: 'all' as const,
      scheduledFor: null,
    };

    const { result } = renderHook(() => useCreateEmailBlast('event123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate(mockEmailBlastData);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle email blast creation errors', async () => {
    const apiClient = require('@/lib/api/client').default;
    apiClient.post.mockRejectedValueOnce(new Error('Failed to create email blast'));

    const mockEmailBlastData = {
      message: '<p>Test message</p>',
      recipientFilter: 'all' as const,
      scheduledFor: null,
    };

    const { result } = renderHook(() => useCreateEmailBlast('event123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate(mockEmailBlastData);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('should fetch RSVP data for recipient filtering', async () => {
    const { result } = renderHook(() => useEventRSVPs('event123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.data).toBeDefined();
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

      const { result } = renderHook(() => useCreateEmailBlast('event123'), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate(mockEmailBlastData);
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

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

    const { result } = renderHook(() => useCreateEmailBlast('event123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate(mockEmailBlastData);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
import { useUpsertRSVP } from '@/lib/hooks/use-upsert-rsvp';
import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
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
  useRequireAuth: () => ({ isLoading: false, isAuthenticated: true }),
}));

describe('RSVP Integration Flow', () => {
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

  it('should fetch event RSVPs successfully', async () => {
    const { result } = renderHook(() => useEventRSVPs('event123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.length).toBeGreaterThan(0);
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should fetch user RSVP status', async () => {
    const { result } = renderHook(() => useUserRSVP('event123'), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.status).toBe('yes');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should create RSVP successfully', async () => {
    const mockRSVPData = {
      eventId: 'event123',
      status: 'yes' as const,
      hasExisting: false,
    };

    const { result } = renderHook(() => useUpsertRSVP(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate(mockRSVPData);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
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

    const { result } = renderHook(() => useUpsertRSVP(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate(mockRSVPData);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle RSVP errors gracefully', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    mockApiClient.post.mockRejectedValueOnce(new Error('Failed to create RSVP'));

    const mockRSVPData = {
      eventId: 'event123',
      status: 'yes' as const,
      hasExisting: false,
    };

    const { result } = renderHook(() => useUpsertRSVP(), {
      wrapper: createWrapper(queryClient),
    });

    await act(async () => {
      result.current.mutate(mockRSVPData);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
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

      const { result } = renderHook(() => useUpsertRSVP(), {
        wrapper: createWrapper(queryClient),
      });

      await act(async () => {
        result.current.mutate(mockRSVPData);
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 200));
      });

      expect(result.current.isPending).toBe(false);
      expect(result.current.error).toBeNull();
    }
  });
});

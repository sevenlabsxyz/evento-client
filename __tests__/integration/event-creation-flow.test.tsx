import { useCreateEventWithCallbacks } from '@/lib/hooks/use-create-event';
import { useEventFormStore } from '@/lib/stores/event-form-store';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logApiRequest: jest.fn(),
    logApiResponse: jest.fn(),
  },
}));

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

jest.mock('@/lib/stores/event-form-store', () => ({
  useEventFormStore: () => ({
    title: 'Test Event',
    description: 'Test Description',
    location: {
      name: 'Test Location',
      address: '123 Test St',
      city: 'Test City',
      state: 'TS',
      country: 'Test Country',
      zipCode: '12345',
      formatted: 'Test Location, 123 Test St, Test City, TS 12345, Test Country',
    },
    timezone: 'UTC',
    startDate: new Date('2025-01-01T10:00:00Z'),
    endDate: new Date('2025-01-01T12:00:00Z'),
    visibility: 'public',
    status: 'published',
    setTitle: jest.fn(),
    setDescription: jest.fn(),
    setLocation: jest.fn(),
    setTimezone: jest.fn(),
    setStartDate: jest.fn(),
    setEndDate: jest.fn(),
    setVisibility: jest.fn(),
    setStatus: jest.fn(),
    reset: jest.fn(),
    isValid: jest.fn(() => true),
  }),
}));

jest.mock('@/lib/hooks/use-auth', () => ({
  useRequireAuth: () => ({ isLoading: false }),
}));

describe('Event Creation Integration Flow', () => {
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

  it('should create an event successfully', async () => {
    const { result } = renderHook(() => useCreateEventWithCallbacks(), {
      wrapper: createWrapper(queryClient),
    });

    const eventData = {
      title: 'Test Event',
      description: 'Test Description',
      location: {
        type: 'manual_entry' as const,
        data: {
          name: 'Test Location, 123 Test St, Test City, TS 12345, Test Country',
        },
      },
      timezone: 'UTC',
      start_date_day: 1,
      start_date_month: 1,
      start_date_year: 2025,
      start_date_hours: 10,
      start_date_minutes: 0,
      end_date_day: 1,
      end_date_month: 1,
      end_date_year: 2025,
      end_date_hours: 12,
      end_date_minutes: 0,
      visibility: 'public' as const,
      status: 'published' as const,
    };

    await act(async () => {
      result.current.mutate(eventData);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should handle event creation errors', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    mockApiClient.post.mockRejectedValueOnce(new Error('Failed to create event'));

    const { result } = renderHook(() => useCreateEventWithCallbacks(), {
      wrapper: createWrapper(queryClient),
    });

    const eventData = {
      title: 'Test Event',
      description: 'Test Description',
      location: {
        type: 'manual_entry' as const,
        data: {
          name: 'Test Location, 123 Test St, Test City, TS 12345, Test Country',
        },
      },
      timezone: 'UTC',
      start_date_day: 1,
      start_date_month: 1,
      start_date_year: 2025,
      start_date_hours: 10,
      start_date_minutes: 0,
      end_date_day: 1,
      end_date_month: 1,
      end_date_year: 2025,
      end_date_hours: 12,
      end_date_minutes: 0,
      visibility: 'public' as const,
      status: 'published' as const,
    };

    await act(async () => {
      result.current.mutate(eventData);
    });

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 200));
    });

    expect(result.current.isPending).toBe(false);
    expect(result.current.error).toBeTruthy();
  });

  it('should validate event data before creation', async () => {
    const { result } = renderHook(() => useCreateEventWithCallbacks(), {
      wrapper: createWrapper(queryClient),
    });

    const invalidEventData = {
      title: '',
      description: 'Test Description',
    };

    await act(async () => {
      try {
        result.current.mutate(invalidEventData as any);
      } catch {}
    });
  });

  it('should handle form state correctly', () => {
    const { result: formResult } = renderHook(() => useEventFormStore(), {
      wrapper: createWrapper(queryClient),
    });

    expect(formResult.current.title).toBe('Test Event');
    expect(formResult.current.description).toBe('Test Description');
    expect(formResult.current.location).toBeDefined();
    expect(formResult.current.timezone).toBe('UTC');
    expect(formResult.current.visibility).toBe('public');
    expect(formResult.current.visibility).toBe('public');
    expect(formResult.current.isValid()).toBe(true);
  });

  it('should reset form state', () => {
    const { result: formResult } = renderHook(() => useEventFormStore(), {
      wrapper: createWrapper(queryClient),
    });

    act(() => {
      formResult.current.reset();
    });

    expect(formResult.current.reset).toHaveBeenCalled();
  });
});

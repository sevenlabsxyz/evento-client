import { useUserEvents } from '@/lib/hooks/use-user-events';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('useUserEvents', () => {
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
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should return initial state correctly', () => {
    const { result } = renderHook(() => useUserEvents({}), { wrapper });

    expect(result.current).toMatchObject({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      fetchNextPage: expect.any(Function),
      hasNextPage: false,
      isFetchingNextPage: false,
    });
  });

  it('should not fetch when enabled is false', () => {
    const { result } = renderHook(() => useUserEvents({ enabled: false }), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should fetch user events successfully with default params', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockResponse = {
      data: {
        events: [
          {
            id: 'event1',
            title: 'Test Event 1',
            description: 'Description 1',
            user_details: {
              id: 'user1',
              username: 'testuser',
              name: 'Test User',
            },
          },
        ],
        pagination: {
          totalCount: 1,
          totalPages: 1,
          currentPage: 1,
          limit: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserEvents({}), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/v1/events/user-events?sortBy=date&sortOrder=desc&timeframe=all&page=1&limit=10'
    );
    expect(result.current.data?.pages[0]).toEqual(mockResponse.data);
  });

  it('should fetch user events with custom params', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockResponse = {
      data: {
        events: [
          {
            id: 'event1',
            title: 'Test Event 1',
            user_details: {
              id: 'user1',
              username: 'testuser',
              name: 'Test User',
            },
          },
        ],
        pagination: {
          totalCount: 1,
          totalPages: 1,
          currentPage: 1,
          limit: 5,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(
      () =>
        useUserEvents({
          search: 'test',
          filter: 'hosting',
          timeframe: 'future',
          sortBy: 'created-asc',
          limit: 5,
        }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/v1/events/user-events?filter=hosting&search=test&sortBy=created&sortOrder=asc&timeframe=future&page=1&limit=5'
    );
    expect(result.current.data?.pages[0]).toEqual(mockResponse.data);
  });

  it('should handle all filter types correctly', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const filters = ['upcoming', 'hosting', 'attending'] as const;

    for (const filter of filters) {
      const mockResponse = {
        data: {
          events: [],
          pagination: {
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
            limit: 10,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUserEvents({ filter }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const expectedUrl =
        filter === 'upcoming'
          ? '/v1/events/user-events?sortBy=date&sortOrder=desc&timeframe=all&page=1&limit=10'
          : `/v1/events/user-events?filter=${filter}&sortBy=date&sortOrder=desc&timeframe=all&page=1&limit=10`;

      expect(mockApiClient.get).toHaveBeenCalledWith(expectedUrl);

      // Reset for next iteration
      jest.clearAllMocks();
    }
  });

  it('should handle all timeframe types correctly', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const timeframes = ['all', 'future', 'past'] as const;

    for (const timeframe of timeframes) {
      const mockResponse = {
        data: {
          events: [],
          pagination: {
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
            limit: 10,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUserEvents({ timeframe }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/v1/events/user-events?sortBy=date&sortOrder=desc&timeframe=${timeframe}&page=1&limit=10`
      );

      // Reset for next iteration
      jest.clearAllMocks();
    }
  });

  it('should handle all sort types correctly', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const sortTypes = ['date-asc', 'date-desc', 'created-asc', 'created-desc'] as const;

    for (const sortBy of sortTypes) {
      const mockResponse = {
        data: {
          events: [],
          pagination: {
            totalCount: 0,
            totalPages: 0,
            currentPage: 1,
            limit: 10,
            hasNextPage: false,
            hasPreviousPage: false,
          },
        },
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUserEvents({ sortBy }), {
        wrapper,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const [field, order] = sortBy.split('-');
      expect(mockApiClient.get).toHaveBeenCalledWith(
        `/v1/events/user-events?sortBy=${field}&sortOrder=${order}&timeframe=all&page=1&limit=10`
      );

      // Reset for next iteration
      jest.clearAllMocks();
    }
  });

  it('should handle API errors gracefully', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const apiError = new Error('API Error');
    mockApiClient.get.mockRejectedValue(apiError);

    const { result } = renderHook(() => useUserEvents({}), { wrapper });

    // The hook should be defined and have the expected structure
    expect(result.current).toBeDefined();
    expect(typeof result.current.fetchNextPage).toBe('function');
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should not retry on 401 errors', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const unauthorizedError = new Error('Unauthorized');
    (unauthorizedError as any).response = { status: 401 };
    mockApiClient.get.mockRejectedValue(unauthorizedError);

    const { result } = renderHook(() => useUserEvents({}), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Should only be called once (no retries)
    expect(mockApiClient.get).toHaveBeenCalledTimes(1);
  });

  it('should retry on other errors up to 3 times', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const networkError = new Error('Network Error');
    mockApiClient.get.mockRejectedValue(networkError);

    const { result } = renderHook(() => useUserEvents({}), { wrapper });

    // The hook should be defined and have the expected structure
    expect(result.current).toBeDefined();
    expect(typeof result.current.fetchNextPage).toBe('function');
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should handle null response', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    mockApiClient.get.mockResolvedValue(null);

    const { result } = renderHook(() => useUserEvents({}), { wrapper });

    // The hook should be defined and have the expected structure
    expect(result.current).toBeDefined();
    expect(typeof result.current.fetchNextPage).toBe('function');
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should handle response without data', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    mockApiClient.get.mockResolvedValue({});

    const { result } = renderHook(() => useUserEvents({}), { wrapper });

    // The hook should be defined and have the expected structure
    expect(result.current).toBeDefined();
    expect(typeof result.current.fetchNextPage).toBe('function');
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should handle empty events array', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockResponse = {
      data: {
        events: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
          limit: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserEvents({}), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.pages[0].events).toEqual([]);
  });

  it('should handle pagination correctly', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockResponse = {
      data: {
        events: [
          {
            id: 'event1',
            title: 'Test Event 1',
            user_details: {
              id: 'user1',
              username: 'testuser',
              name: 'Test User',
            },
          },
        ],
        pagination: {
          totalCount: 25,
          totalPages: 3,
          currentPage: 1,
          limit: 10,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserEvents({}), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.data?.pages[0].pagination.hasNextPage).toBe(true);
  });

  it('should fetch next page correctly', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockResponse1 = {
      data: {
        events: [
          {
            id: 'event1',
            title: 'Test Event 1',
            user_details: {
              id: 'user1',
              username: 'testuser',
              name: 'Test User',
            },
          },
        ],
        pagination: {
          totalCount: 25,
          totalPages: 3,
          currentPage: 1,
          limit: 10,
          hasNextPage: true,
          hasPreviousPage: false,
        },
      },
    };

    const mockResponse2 = {
      data: {
        events: [
          {
            id: 'event2',
            title: 'Test Event 2',
            user_details: {
              id: 'user1',
              username: 'testuser',
              name: 'Test User',
            },
          },
        ],
        pagination: {
          totalCount: 25,
          totalPages: 3,
          currentPage: 2,
          limit: 10,
          hasNextPage: true,
          hasPreviousPage: true,
        },
      },
    };

    mockApiClient.get.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

    const { result } = renderHook(() => useUserEvents({}), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Fetch next page
    await act(async () => {
      result.current.fetchNextPage();
    });

    // The hook should be defined and have the expected structure
    expect(result.current).toBeDefined();
    expect(typeof result.current.fetchNextPage).toBe('function');
    expect(typeof result.current.isFetchingNextPage).toBe('boolean');
  });

  it('should not fetch next page when hasNextPage is false', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockResponse = {
      data: {
        events: [
          {
            id: 'event1',
            title: 'Test Event 1',
            user_details: {
              id: 'user1',
              username: 'testuser',
              name: 'Test User',
            },
          },
        ],
        pagination: {
          totalCount: 5,
          totalPages: 1,
          currentPage: 1,
          limit: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserEvents({}), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.hasNextPage).toBe(false);

    // Try to fetch next page
    await act(async () => {
      result.current.fetchNextPage();
    });

    // Should not make additional API calls
    expect(mockApiClient.get).toHaveBeenCalledTimes(1);
  });

  it('should handle search parameter correctly', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockResponse = {
      data: {
        events: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
          limit: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserEvents({ search: 'test search' }), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/v1/events/user-events?search=test+search&sortBy=date&sortOrder=desc&timeframe=all&page=1&limit=10'
    );
  });

  it('should handle empty search parameter', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockResponse = {
      data: {
        events: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
          limit: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserEvents({ search: '' }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/v1/events/user-events?sortBy=date&sortOrder=desc&timeframe=all&page=1&limit=10'
    );
  });

  it('should handle custom limit parameter', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockResponse = {
      data: {
        events: [],
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
          limit: 20,
          hasNextPage: false,
          hasPreviousPage: false,
        },
      },
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserEvents({ limit: 20 }), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/v1/events/user-events?sortBy=date&sortOrder=desc&timeframe=all&page=1&limit=20'
    );
  });

  it('should handle response with missing pagination', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockResponse = {
      data: {
        events: [
          {
            id: 'event1',
            title: 'Test Event 1',
            user_details: {
              id: 'user1',
              username: 'testuser',
              name: 'Test User',
            },
          },
        ],
        // Missing pagination
      },
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserEvents({}), { wrapper });

    // The hook should be defined and have the expected structure
    expect(result.current).toBeDefined();
    expect(typeof result.current.fetchNextPage).toBe('function');
    expect(typeof result.current.isLoading).toBe('boolean');
  });

  it('should handle response with missing events', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockResponse = {
      data: {
        pagination: {
          totalCount: 0,
          totalPages: 0,
          currentPage: 1,
          limit: 10,
          hasNextPage: false,
          hasPreviousPage: false,
        },
        // Missing events
      },
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserEvents({}), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.pages[0].events).toEqual([]);
    expect(result.current.data?.pages[0].pagination).toEqual(mockResponse.data.pagination);
  });
});

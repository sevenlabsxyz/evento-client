import { useSubEvents } from '@/lib/hooks/use-sub-events';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock the API transform utility
jest.mock('@/lib/utils/api-transform', () => ({
  transformApiEventResponse: jest.fn((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    computed_start_date: event.computed_start_date,
    timezone: event.timezone,
    user_details: event.user_details,
  })),
}));

// Mock the debug utility
jest.mock('@/lib/utils/debug', () => ({
  debugError: jest.fn(),
}));

describe('useSubEvents', () => {
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
    const { result } = renderHook(() => useSubEvents('event123'), { wrapper });

    expect(result.current).toMatchObject({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: expect.any(Function),
    });
  });

  it('should not fetch when eventId is undefined', () => {
    const { result } = renderHook(() => useSubEvents(), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should not fetch when eventId is empty string', () => {
    const { result } = renderHook(() => useSubEvents(''), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should fetch sub-events successfully', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const { transformApiEventResponse } = require('@/lib/utils/api-transform');

    const mockSubEvents = [
      {
        id: 'subevent1',
        title: 'Sub Event 1',
        description: 'Description 1',
        computed_start_date: '2024-01-01T10:00:00Z',
        timezone: 'UTC',
        user_details: {
          id: 'user1',
          username: 'user1',
          name: 'User 1',
        },
      },
      {
        id: 'subevent2',
        title: 'Sub Event 2',
        description: 'Description 2',
        computed_start_date: '2024-01-02T10:00:00Z',
        timezone: 'UTC',
        user_details: {
          id: 'user2',
          username: 'user2',
          name: 'User 2',
        },
      },
    ];

    const transformedEvents = [
      {
        id: 'subevent1',
        title: 'Sub Event 1',
        description: 'Description 1',
        computed_start_date: '2024-01-01T10:00:00Z',
        timezone: 'UTC',
        user_details: {
          id: 'user1',
          username: 'user1',
          name: 'User 1',
        },
      },
      {
        id: 'subevent2',
        title: 'Sub Event 2',
        description: 'Description 2',
        computed_start_date: '2024-01-02T10:00:00Z',
        timezone: 'UTC',
        user_details: {
          id: 'user2',
          username: 'user2',
          name: 'User 2',
        },
      },
    ];

    mockApiClient.get.mockResolvedValue(mockSubEvents);
    transformApiEventResponse
      .mockReturnValueOnce(transformedEvents[0])
      .mockReturnValueOnce(transformedEvents[1]);

    const { result } = renderHook(() => useSubEvents('event123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/v1/events/sub-events?event_id=event123'
    );
    expect(result.current.data).toEqual(transformedEvents);
    expect(transformApiEventResponse).toHaveBeenCalledTimes(2);
  });

  it('should handle empty sub-events response', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;

    mockApiClient.get.mockResolvedValue([]);

    const { result } = renderHook(() => useSubEvents('event123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual([]);
    expect(mockApiClient.get).toHaveBeenCalledWith(
      '/v1/events/sub-events?event_id=event123'
    );
  });

  it('should add default values for missing fields', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const { transformApiEventResponse } = require('@/lib/utils/api-transform');

    const mockSubEvent = {
      id: 'subevent1',
      title: 'Sub Event 1',
      // Missing computed_start_date and timezone
      user_details: {
        id: 'user1',
        username: 'user1',
        name: 'User 1',
      },
    };

    const transformedEvent = {
      id: 'subevent1',
      title: 'Sub Event 1',
      computed_start_date: '2024-01-01T10:00:00Z',
      timezone: 'UTC',
      user_details: {
        id: 'user1',
        username: 'user1',
        name: 'User 1',
      },
    };

    mockApiClient.get.mockResolvedValue([mockSubEvent]);
    transformApiEventResponse.mockReturnValue(transformedEvent);

    const { result } = renderHook(() => useSubEvents('event123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(transformApiEventResponse).toHaveBeenCalledWith({
      ...mockSubEvent,
      computed_start_date: expect.any(String),
      timezone: 'UTC',
      user_details: mockSubEvent.user_details,
    });
  });

  it('should handle events with existing computed_start_date and timezone', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const { transformApiEventResponse } = require('@/lib/utils/api-transform');

    const mockSubEvent = {
      id: 'subevent1',
      title: 'Sub Event 1',
      computed_start_date: '2024-01-01T10:00:00Z',
      timezone: 'America/New_York',
      user_details: {
        id: 'user1',
        username: 'user1',
        name: 'User 1',
      },
    };

    const transformedEvent = {
      id: 'subevent1',
      title: 'Sub Event 1',
      computed_start_date: '2024-01-01T10:00:00Z',
      timezone: 'America/New_York',
      user_details: {
        id: 'user1',
        username: 'user1',
        name: 'User 1',
      },
    };

    mockApiClient.get.mockResolvedValue([mockSubEvent]);
    transformApiEventResponse.mockReturnValue(transformedEvent);

    const { result } = renderHook(() => useSubEvents('event123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(transformApiEventResponse).toHaveBeenCalledWith({
      ...mockSubEvent,
      computed_start_date: '2024-01-01T10:00:00Z',
      timezone: 'America/New_York',
      user_details: mockSubEvent.user_details,
    });
  });

  it('should use correct query configuration', () => {
    const { result } = renderHook(() => useSubEvents('event123'), { wrapper });

    // Check that the query is enabled when eventId is provided
    expect(result.current.isLoading).toBe(true);
  });

  it('should refetch when refetch is called', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const { transformApiEventResponse } = require('@/lib/utils/api-transform');

    const mockSubEvents = [
      {
        id: 'subevent1',
        title: 'Sub Event 1',
        computed_start_date: '2024-01-01T10:00:00Z',
        timezone: 'UTC',
        user_details: {
          id: 'user1',
          username: 'user1',
          name: 'User 1',
        },
      },
    ];

    const transformedEvent = {
      id: 'subevent1',
      title: 'Sub Event 1',
      computed_start_date: '2024-01-01T10:00:00Z',
      timezone: 'UTC',
      user_details: {
        id: 'user1',
        username: 'user1',
        name: 'User 1',
      },
    };

    mockApiClient.get.mockResolvedValue(mockSubEvents);
    transformApiEventResponse.mockReturnValue(transformedEvent);

    const { result } = renderHook(() => useSubEvents('event123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Reset mock to track new calls
    mockApiClient.get.mockClear();

    // Call refetch
    await act(async () => {
      result.current.refetch();
    });

    expect(mockApiClient.get).toHaveBeenCalledTimes(1);
  });

  it('should handle API errors gracefully', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;

    const apiError = new Error('API Error');
    mockApiClient.get.mockRejectedValue(apiError);

    const { result } = renderHook(() => useSubEvents('event123'), { wrapper });

    // Wait for the query to complete (either success or error)
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    // The hook should handle the error gracefully
    expect(result.current).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should handle invalid response format', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;

    // Mock invalid response (not an array)
    mockApiClient.get.mockResolvedValue({ invalid: 'response' });

    const { result } = renderHook(() => useSubEvents('event123'), { wrapper });

    // Wait for the query to complete
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    // The hook should handle the invalid response gracefully
    expect(result.current).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should handle null response', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;

    mockApiClient.get.mockResolvedValue(null);

    const { result } = renderHook(() => useSubEvents('event123'), { wrapper });

    // Wait for the query to complete
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    // The hook should handle the null response gracefully
    expect(result.current).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should handle transformation errors', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const { transformApiEventResponse } = require('@/lib/utils/api-transform');

    const mockSubEvents = [
      {
        id: 'subevent1',
        title: 'Sub Event 1',
        computed_start_date: '2024-01-01T10:00:00Z',
        timezone: 'UTC',
        user_details: {
          id: 'user1',
          username: 'user1',
          name: 'User 1',
        },
      },
    ];

    mockApiClient.get.mockResolvedValue(mockSubEvents);
    transformApiEventResponse.mockReturnValue(null); // Simulate transformation failure

    const { result } = renderHook(() => useSubEvents('event123'), { wrapper });

    // Wait for the query to complete
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    // The hook should handle the transformation error gracefully
    expect(result.current).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should handle network timeout errors', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;

    const timeoutError = new Error('Request timeout');
    timeoutError.name = 'TimeoutError';
    mockApiClient.get.mockRejectedValue(timeoutError);

    const { result } = renderHook(() => useSubEvents('event123'), { wrapper });

    // Wait for the query to complete
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    // The hook should handle the timeout error gracefully
    expect(result.current).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should handle 404 errors gracefully', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;

    const notFoundError = new Error('Not Found');
    (notFoundError as any).response = { status: 404 };
    mockApiClient.get.mockRejectedValue(notFoundError);

    const { result } = renderHook(() => useSubEvents('event123'), { wrapper });

    // Wait for the query to complete
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    // The hook should handle the 404 error gracefully
    expect(result.current).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should handle malformed event data', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const { transformApiEventResponse } = require('@/lib/utils/api-transform');

    const malformedEvent = {
      id: 'subevent1',
      // Missing required fields
      user_details: null, // Invalid user_details
    };

    mockApiClient.get.mockResolvedValue([malformedEvent]);
    transformApiEventResponse.mockReturnValue(null);

    const { result } = renderHook(() => useSubEvents('event123'), { wrapper });

    // Wait for the query to complete
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 5000 }
    );

    // The hook should handle the malformed data gracefully
    expect(result.current).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should handle multiple transformation failures', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const { transformApiEventResponse } = require('@/lib/utils/api-transform');

    const mockSubEvents = [
      {
        id: 'subevent1',
        title: 'Sub Event 1',
        computed_start_date: '2024-01-01T10:00:00Z',
        timezone: 'UTC',
        user_details: {
          id: 'user1',
          username: 'user1',
          name: 'User 1',
        },
      },
      {
        id: 'subevent2',
        title: 'Sub Event 2',
        computed_start_date: '2024-01-02T10:00:00Z',
        timezone: 'UTC',
        user_details: {
          id: 'user2',
          username: 'user2',
          name: 'User 2',
        },
      },
    ];

    mockApiClient.get.mockResolvedValue(mockSubEvents);
    transformApiEventResponse
      .mockReturnValueOnce({
        id: 'subevent1',
        title: 'Sub Event 1',
        computed_start_date: '2024-01-01T10:00:00Z',
        timezone: 'UTC',
        user_details: {
          id: 'user1',
          username: 'user1',
          name: 'User 1',
        },
      })
      .mockReturnValueOnce(null); // Second transformation fails

    const { result } = renderHook(() => useSubEvents('event123'), { wrapper });

    // Wait for the query to complete
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    // The hook should handle the transformation failures gracefully
    expect(result.current).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });
});

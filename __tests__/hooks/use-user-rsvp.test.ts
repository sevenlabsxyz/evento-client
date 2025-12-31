import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

describe('useUserRSVP', () => {
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
    const { result } = renderHook(() => useUserRSVP('event123'), { wrapper });

    expect(result.current).toMatchObject({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    });
  });

  it('should not fetch when eventId is not provided', () => {
    const { result } = renderHook(() => useUserRSVP(''), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should not fetch when eventId is null', () => {
    const { result } = renderHook(() => useUserRSVP(null as any), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should fetch user RSVP successfully with RSVP data', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockRSVP = {
      id: 'rsvp123',
      event_id: 'event123',
      user_id: 'user123',
      status: 'going',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    const mockResponse = {
      data: [mockRSVP],
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserRSVP('event123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/event123/rsvps/me');
    expect(result.current.data).toEqual({
      status: 'going',
      rsvp: mockRSVP,
    });
  });

  it('should fetch user RSVP successfully with no RSVP data', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockResponse = {
      data: [],
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserRSVP('event123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/event123/rsvps/me');
    expect(result.current.data).toEqual({
      status: null,
      rsvp: null,
    });
  });

  it('should handle different RSVP statuses correctly', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const statuses = ['going', 'maybe', 'not_going'] as const;

    for (const status of statuses) {
      const mockRSVP = {
        id: 'rsvp123',
        event_id: 'event123',
        user_id: 'user123',
        status,
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      };

      const mockResponse = {
        data: [mockRSVP],
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUserRSVP('event123'), { wrapper });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        status,
        rsvp: mockRSVP,
      });

      // Reset for next iteration
      jest.clearAllMocks();
      queryClient.clear();
    }
  });

  it('should handle API errors gracefully', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const apiError = new Error('API Error');
    mockApiClient.get.mockRejectedValue(apiError);

    const { result } = renderHook(() => useUserRSVP('event123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(apiError);
  });

  it('should handle null response', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    mockApiClient.get.mockResolvedValue(null);

    const { result } = renderHook(() => useUserRSVP('event123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it('should handle response without data property', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    mockApiClient.get.mockResolvedValue({});

    const { result } = renderHook(() => useUserRSVP('event123'), { wrapper });

    // Wait for the query to complete
    await waitFor(
      () => {
        expect(result.current.isLoading).toBe(false);
      },
      { timeout: 2000 }
    );

    // The hook should handle the response without data gracefully
    expect(result.current).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });

  it('should handle non-array data response', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockResponse = {
      data: 'not-an-array',
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserRSVP('event123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      status: null,
      rsvp: null,
    });
  });

  it('should handle RSVP without status property', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockRSVP = {
      id: 'rsvp123',
      event_id: 'event123',
      user_id: 'user123',
      // Missing status property
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    const mockResponse = {
      data: [mockRSVP],
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserRSVP('event123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      status: null,
      rsvp: mockRSVP,
    });
  });

  it('should handle multiple RSVPs by taking the first one', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockRSVPs = [
      {
        id: 'rsvp1',
        event_id: 'event123',
        user_id: 'user123',
        status: 'going',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z',
      },
      {
        id: 'rsvp2',
        event_id: 'event123',
        user_id: 'user123',
        status: 'maybe',
        created_at: '2023-01-02T00:00:00Z',
        updated_at: '2023-01-02T00:00:00Z',
      },
    ];

    const mockResponse = {
      data: mockRSVPs,
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserRSVP('event123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      status: 'going',
      rsvp: mockRSVPs[0],
    });
  });

  it('should handle empty string eventId', async () => {
    const { result } = renderHook(() => useUserRSVP(''), { wrapper });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should handle undefined eventId', async () => {
    const { result } = renderHook(() => useUserRSVP(undefined as any), {
      wrapper,
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
  });

  it('should refetch when eventId changes', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockRSVP1 = {
      id: 'rsvp1',
      event_id: 'event1',
      user_id: 'user123',
      status: 'going',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    const mockRSVP2 = {
      id: 'rsvp2',
      event_id: 'event2',
      user_id: 'user123',
      status: 'maybe',
      created_at: '2023-01-02T00:00:00Z',
      updated_at: '2023-01-02T00:00:00Z',
    };

    mockApiClient.get
      .mockResolvedValueOnce({ data: [mockRSVP1] })
      .mockResolvedValueOnce({ data: [mockRSVP2] });

    const { result, rerender } = renderHook(({ eventId }) => useUserRSVP(eventId), {
      wrapper,
      initialProps: { eventId: 'event1' },
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      status: 'going',
      rsvp: mockRSVP1,
    });

    // Change eventId
    rerender({ eventId: 'event2' });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      status: 'maybe',
      rsvp: mockRSVP2,
    });

    expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    expect(mockApiClient.get).toHaveBeenNthCalledWith(1, '/v1/events/event1/rsvps/me');
    expect(mockApiClient.get).toHaveBeenNthCalledWith(2, '/v1/events/event2/rsvps/me');
  });

  it('should handle RSVP with null status', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockRSVP = {
      id: 'rsvp123',
      event_id: 'event123',
      user_id: 'user123',
      status: null,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    const mockResponse = {
      data: [mockRSVP],
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserRSVP('event123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      status: null,
      rsvp: mockRSVP,
    });
  });

  it('should handle RSVP with undefined status', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockRSVP = {
      id: 'rsvp123',
      event_id: 'event123',
      user_id: 'user123',
      status: undefined,
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z',
    };

    const mockResponse = {
      data: [mockRSVP],
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserRSVP('event123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      status: null,
      rsvp: mockRSVP,
    });
  });

  it('should handle network errors', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const networkError = new Error('Network Error');
    mockApiClient.get.mockRejectedValue(networkError);

    const { result } = renderHook(() => useUserRSVP('event123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(networkError);
  });

  it('should handle malformed RSVP data', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockResponse = {
      data: [
        {
          // Missing required fields
          id: 'rsvp123',
        },
      ],
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserRSVP('event123'), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual({
      status: null,
      rsvp: { id: 'rsvp123' },
    });
  });

  it('should handle very long eventId', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const longEventId = 'a'.repeat(1000);
    const mockResponse = {
      data: [],
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserRSVP(longEventId), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(`/v1/events/${longEventId}/rsvps/me`);
    expect(result.current.data).toEqual({
      status: null,
      rsvp: null,
    });
  });

  it('should handle special characters in eventId', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const specialEventId = 'event-123_test@example.com';
    const mockResponse = {
      data: [],
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUserRSVP(specialEventId), {
      wrapper,
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(`/v1/events/${specialEventId}/rsvps/me`);
    expect(result.current.data).toEqual({
      status: null,
      rsvp: null,
    });
  });
});

import { useUpsertRSVP } from '@/lib/hooks/use-upsert-rsvp';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('useUpsertRSVP', () => {
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
    const { result } = renderHook(() => useUpsertRSVP(), { wrapper });

    expect(result.current).toMatchObject({
      mutate: expect.any(Function),
      mutateAsync: expect.any(Function),
      isError: false,
      isSuccess: false,
      error: null,
      data: undefined,
    });
  });

  it('should create new RSVP when hasExisting is false', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockArgs = {
      eventId: 'event123',
      status: 'yes' as const,
      hasExisting: false,
    };

    const mockResponse = {
      success: true,
      message: 'RSVP created successfully',
      data: [
        {
          id: 'rsvp123',
          event_id: 'event123',
          user_id: 'user123',
          status: 'yes',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
        },
      ],
    };

    mockApiClient.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpsertRSVP(), { wrapper });

    await act(async () => {
      result.current.mutate(mockArgs);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/event123/rsvps', {
      event_id: 'event123',
      status: 'yes',
    });
    expect(mockApiClient.patch).not.toHaveBeenCalled();
    expect(result.current.data).toEqual(mockResponse.data[0]);
  });

  it('should update existing RSVP when hasExisting is true', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockArgs = {
      eventId: 'event123',
      status: 'maybe' as const,
      hasExisting: true,
    };

    const mockResponse = {
      success: true,
      message: 'RSVP updated successfully',
      data: [
        {
          id: 'rsvp123',
          event_id: 'event123',
          user_id: 'user123',
          status: 'maybe',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T11:00:00Z',
        },
      ],
    };

    mockApiClient.patch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpsertRSVP(), { wrapper });

    await act(async () => {
      result.current.mutate(mockArgs);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/event123/rsvps', {
      event_id: 'event123',
      status: 'maybe',
    });
    expect(mockApiClient.post).not.toHaveBeenCalled();
    expect(result.current.data).toEqual(mockResponse.data[0]);
  });

  it('should handle all RSVP statuses correctly', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const statuses: Array<'yes' | 'no' | 'maybe'> = ['yes', 'no', 'maybe'];

    for (const status of statuses) {
      const mockArgs = {
        eventId: 'event123',
        status,
        hasExisting: false,
      };

      const mockResponse = {
        success: true,
        message: 'RSVP created successfully',
        data: [
          {
            id: 'rsvp123',
            event_id: 'event123',
            user_id: 'user123',
            status,
            created_at: '2024-01-01T10:00:00Z',
            updated_at: '2024-01-01T10:00:00Z',
          },
        ],
      };

      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useUpsertRSVP(), { wrapper });

      await act(async () => {
        result.current.mutate(mockArgs);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/event123/rsvps', {
        event_id: 'event123',
        status,
      });

      // Reset for next iteration
      jest.clearAllMocks();
    }
  });

  it('should handle API errors gracefully', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockArgs = {
      eventId: 'event123',
      status: 'yes' as const,
      hasExisting: false,
    };

    const apiError = new Error('Network Error');
    mockApiClient.post.mockRejectedValue(apiError);

    const { result } = renderHook(() => useUpsertRSVP(), { wrapper });

    await act(async () => {
      result.current.mutate(mockArgs);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error('Failed to update RSVP'));
  });

  it('should handle unsuccessful response', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockArgs = {
      eventId: 'event123',
      status: 'yes' as const,
      hasExisting: false,
    };

    const mockResponse = {
      success: false,
      message: 'Some error occurred',
      data: [],
    };

    mockApiClient.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpsertRSVP(), { wrapper });

    await act(async () => {
      result.current.mutate(mockArgs);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error('Failed to update RSVP'));
  });

  it('should handle capacity reached error specifically', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockArgs = {
      eventId: 'event123',
      status: 'yes' as const,
      hasExisting: false,
    };

    const mockResponse = {
      success: false,
      message: 'This event has reached its capacity.',
      data: [],
    };

    mockApiClient.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpsertRSVP(), { wrapper });

    await act(async () => {
      result.current.mutate(mockArgs);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error('This event has reached its capacity.'));
  });

  it('should handle null response', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockArgs = {
      eventId: 'event123',
      status: 'yes' as const,
      hasExisting: false,
    };

    mockApiClient.post.mockResolvedValue(null);

    const { result } = renderHook(() => useUpsertRSVP(), { wrapper });

    await act(async () => {
      result.current.mutate(mockArgs);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error('Failed to update RSVP'));
  });

  it('should handle empty data array', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockArgs = {
      eventId: 'event123',
      status: 'yes' as const,
      hasExisting: false,
    };

    const mockResponse = {
      success: true,
      message: 'RSVP created successfully',
      data: [], // Empty array
    };

    mockApiClient.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpsertRSVP(), { wrapper });

    await act(async () => {
      result.current.mutate(mockArgs);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it('should handle undefined data', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockArgs = {
      eventId: 'event123',
      status: 'yes' as const,
      hasExisting: false,
    };

    const mockResponse = {
      success: true,
      message: 'RSVP created successfully',
      data: undefined, // Undefined data
    };

    mockApiClient.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpsertRSVP(), { wrapper });

    await act(async () => {
      result.current.mutate(mockArgs);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it('should handle non-array data', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockArgs = {
      eventId: 'event123',
      status: 'yes' as const,
      hasExisting: false,
    };

    const mockResponse = {
      success: true,
      message: 'RSVP created successfully',
      data: 'not an array', // Non-array data
    };

    mockApiClient.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpsertRSVP(), { wrapper });

    await act(async () => {
      result.current.mutate(mockArgs);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it('should invalidate queries on success', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockArgs = {
      eventId: 'event123',
      status: 'yes' as const,
      hasExisting: false,
    };

    const mockResponse = {
      success: true,
      message: 'RSVP created successfully',
      data: [
        {
          id: 'rsvp123',
          event_id: 'event123',
          user_id: 'user123',
          status: 'yes',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
        },
      ],
    };

    mockApiClient.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpsertRSVP(), { wrapper });

    await act(async () => {
      result.current.mutate(mockArgs);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check that queries were invalidated
    expect(queryClient.getQueryCache().findAll()).toHaveLength(0);
  });

  it('should handle RSVP with user details', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockArgs = {
      eventId: 'event123',
      status: 'yes' as const,
      hasExisting: false,
    };

    const mockResponse = {
      success: true,
      message: 'RSVP created successfully',
      data: [
        {
          id: 'rsvp123',
          event_id: 'event123',
          user_id: 'user123',
          status: 'yes',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
          user_details: {
            id: 'user123',
            username: 'testuser',
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      ],
    };

    mockApiClient.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpsertRSVP(), { wrapper });

    await act(async () => {
      result.current.mutate(mockArgs);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockResponse.data[0]);
  });

  it('should work with mutateAsync', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockArgs = {
      eventId: 'event123',
      status: 'yes' as const,
      hasExisting: false,
    };

    const mockResponse = {
      success: true,
      message: 'RSVP created successfully',
      data: [
        {
          id: 'rsvp123',
          event_id: 'event123',
          user_id: 'user123',
          status: 'yes',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
        },
      ],
    };

    mockApiClient.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpsertRSVP(), { wrapper });

    const data = await result.current.mutateAsync(mockArgs);

    expect(data).toEqual(mockResponse.data[0]);
    expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/event123/rsvps', {
      event_id: 'event123',
      status: 'yes',
    });
  });

  it('should handle multiple RSVPs in response data', async () => {
    const mockApiClient = require('@/lib/api/client').apiClient;
    const mockArgs = {
      eventId: 'event123',
      status: 'yes' as const,
      hasExisting: false,
    };

    const mockResponse = {
      success: true,
      message: 'RSVP created successfully',
      data: [
        {
          id: 'rsvp123',
          event_id: 'event123',
          user_id: 'user123',
          status: 'yes',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
        },
        {
          id: 'rsvp124',
          event_id: 'event123',
          user_id: 'user124',
          status: 'yes',
          created_at: '2024-01-01T10:00:00Z',
          updated_at: '2024-01-01T10:00:00Z',
        },
      ],
    };

    mockApiClient.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpsertRSVP(), { wrapper });

    await act(async () => {
      result.current.mutate(mockArgs);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should return the first RSVP from the array
    expect(result.current.data).toEqual(mockResponse.data[0]);
  });
});

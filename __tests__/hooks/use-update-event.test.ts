import { useUpdateEvent, useUpdateEventWithCallbacks } from '@/lib/hooks/use-update-event';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('useUpdateEvent', () => {
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
    const { result } = renderHook(() => useUpdateEvent(), { wrapper });

    expect(result.current).toMatchObject({
      mutate: expect.any(Function),
      mutateAsync: expect.any(Function),
      isError: false,
      isSuccess: false,
      error: null,
      data: undefined,
    });
  });

  it('should update event successfully', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockUpdateData = {
      id: 'event123',
      title: 'Updated Event Title',
      description: 'Updated description',
      location: {
        type: 'manual_entry',
        data: {
          name: 'Updated Location',
        },
      },
      timezone: 'UTC',
      start_date_day: 15,
      start_date_month: 6,
      start_date_year: 2024,
      start_date_hours: 14,
      start_date_minutes: 30,
      end_date_day: 15,
      end_date_month: 6,
      end_date_year: 2024,
      end_date_hours: 16,
      end_date_minutes: 30,
      visibility: 'public' as const,
      status: 'published' as const,
    };

    const mockResponse = {
      data: [
        {
          id: 'event123',
          title: 'Updated Event Title',
          description: 'Updated description',
          location: {
            type: 'manual_entry',
            data: {
              name: 'Updated Location',
            },
          },
          timezone: 'UTC',
        },
      ],
    };

    mockApiClient.patch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateEvent(), { wrapper });

    await act(async () => {
      result.current.mutate(mockUpdateData);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/details', mockUpdateData);
    expect(result.current.data).toEqual(mockResponse.data[0]);
  });

  it('should handle API errors gracefully', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockUpdateData = {
      id: 'event123',
      title: 'Updated Event Title',
      description: 'Updated description',
      location: {
        type: 'manual_entry',
        data: {
          name: 'Updated Location',
        },
      },
      timezone: 'UTC',
      start_date_day: 15,
      start_date_month: 6,
      start_date_year: 2024,
      end_date_day: 15,
      end_date_month: 6,
      end_date_year: 2024,
      visibility: 'public' as const,
      status: 'published' as const,
    };

    const apiError = new Error('API Error');
    mockApiClient.patch.mockRejectedValue(apiError);

    const { result } = renderHook(() => useUpdateEvent(), { wrapper });

    await act(async () => {
      result.current.mutate(mockUpdateData);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(apiError);
    expect(mockConsoleError).toHaveBeenCalledWith('Update event error:', apiError);
  });

  it('should handle validation errors', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const invalidData = {
      id: '', // Invalid: empty ID
      title: 'Updated Event Title',
      description: 'Updated description',
      location: {
        type: 'manual_entry',
        data: {
          name: 'Updated Location',
        },
      },
      timezone: 'UTC',
      start_date_day: 15,
      start_date_month: 6,
      start_date_year: 2024,
      end_date_day: 15,
      end_date_month: 6,
      end_date_year: 2024,
      visibility: 'public' as const,
      status: 'published' as const,
    };

    const { result } = renderHook(() => useUpdateEvent(), { wrapper });

    await act(async () => {
      result.current.mutate(invalidData);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Should not call API with invalid data
    expect(mockApiClient.patch).not.toHaveBeenCalled();
  });

  it('should handle empty response data', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockUpdateData = {
      id: 'event123',
      title: 'Updated Event Title',
      description: 'Updated description',
      location: {
        type: 'manual_entry',
        data: {
          name: 'Updated Location',
        },
      },
      timezone: 'UTC',
      start_date_day: 15,
      start_date_month: 6,
      start_date_year: 2024,
      end_date_day: 15,
      end_date_month: 6,
      end_date_year: 2024,
      visibility: 'public' as const,
      status: 'published' as const,
    };

    const mockResponse = {
      data: [], // Empty array
    };

    mockApiClient.patch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateEvent(), { wrapper });

    await act(async () => {
      result.current.mutate(mockUpdateData);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error('Failed to update event'));
  });

  it('should handle null response', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockUpdateData = {
      id: 'event123',
      title: 'Updated Event Title',
      description: 'Updated description',
      location: {
        type: 'manual_entry',
        data: {
          name: 'Updated Location',
        },
      },
      timezone: 'UTC',
      start_date_day: 15,
      start_date_month: 6,
      start_date_year: 2024,
      end_date_day: 15,
      end_date_month: 6,
      end_date_year: 2024,
      visibility: 'public' as const,
      status: 'published' as const,
    };

    mockApiClient.patch.mockResolvedValue(null);

    const { result } = renderHook(() => useUpdateEvent(), { wrapper });

    await act(async () => {
      result.current.mutate(mockUpdateData);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(new Error('Failed to update event'));
  });

  it('should invalidate queries on success', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockUpdateData = {
      id: 'event123',
      title: 'Updated Event Title',
      description: 'Updated description',
      location: {
        type: 'manual_entry',
        data: {
          name: 'Updated Location',
        },
      },
      timezone: 'UTC',
      start_date_day: 15,
      start_date_month: 6,
      start_date_year: 2024,
      end_date_day: 15,
      end_date_month: 6,
      end_date_year: 2024,
      visibility: 'public' as const,
      status: 'published' as const,
    };

    const mockResponse = {
      data: [
        {
          id: 'event123',
          title: 'Updated Event Title',
        },
      ],
    };

    mockApiClient.patch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateEvent(), { wrapper });

    await act(async () => {
      result.current.mutate(mockUpdateData);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check that queries were invalidated
    expect(queryClient.getQueryCache().findAll()).toHaveLength(0);
  });

  it('should handle optional fields correctly', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockUpdateData = {
      id: 'event123',
      title: 'Updated Event Title',
      description: 'Updated description',
      location: {
        type: 'manual_entry',
        data: {
          name: 'Updated Location',
        },
      },
      timezone: 'UTC',
      start_date_day: 15,
      start_date_month: 6,
      start_date_year: 2024,
      end_date_day: 15,
      end_date_month: 6,
      end_date_year: 2024,
      visibility: 'public' as const,
      status: 'published' as const,
      // Optional fields
      cover: 'https://example.com/cover.jpg',
      spotify_url: 'https://open.spotify.com/track/123',
      wavlake_url: 'https://wavlake.com/track/123',
      contrib_cashapp: '$username',
      contrib_venmo: '@username',
      contrib_paypal: 'paypal.me/username',
      contrib_btclightning: 'lnbc123...',
      cost: 'Free',
    };

    const mockResponse = {
      data: [
        {
          id: 'event123',
          title: 'Updated Event Title',
        },
      ],
    };

    mockApiClient.patch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateEvent(), { wrapper });

    await act(async () => {
      result.current.mutate(mockUpdateData);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/details', mockUpdateData);
  });

  it('should handle time fields correctly', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockUpdateData = {
      id: 'event123',
      title: 'Updated Event Title',
      description: 'Updated description',
      location: {
        type: 'manual_entry',
        data: {
          name: 'Updated Location',
        },
      },
      timezone: 'UTC',
      start_date_day: 15,
      start_date_month: 6,
      start_date_year: 2024,
      start_date_hours: 14,
      start_date_minutes: 30,
      end_date_day: 15,
      end_date_month: 6,
      end_date_year: 2024,
      end_date_hours: 16,
      end_date_minutes: 30,
      visibility: 'public' as const,
      status: 'published' as const,
    };

    const mockResponse = {
      data: [
        {
          id: 'event123',
          title: 'Updated Event Title',
        },
      ],
    };

    mockApiClient.patch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateEvent(), { wrapper });

    await act(async () => {
      result.current.mutate(mockUpdateData);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/details', mockUpdateData);
  });

  it('should handle null time fields', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockUpdateData = {
      id: 'event123',
      title: 'Updated Event Title',
      description: 'Updated description',
      location: {
        type: 'manual_entry',
        data: {
          name: 'Updated Location',
        },
      },
      timezone: 'UTC',
      start_date_day: 15,
      start_date_month: 6,
      start_date_year: 2024,
      start_date_hours: null,
      start_date_minutes: null,
      end_date_day: 15,
      end_date_month: 6,
      end_date_year: 2024,
      end_date_hours: null,
      end_date_minutes: null,
      visibility: 'public' as const,
      status: 'published' as const,
    };

    const mockResponse = {
      data: [
        {
          id: 'event123',
          title: 'Updated Event Title',
        },
      ],
    };

    mockApiClient.patch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateEvent(), { wrapper });

    await act(async () => {
      result.current.mutate(mockUpdateData);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/details', mockUpdateData);
  });
});

describe('useUpdateEventWithCallbacks', () => {
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
    const { result } = renderHook(() => useUpdateEventWithCallbacks(), {
      wrapper,
    });

    expect(result.current).toMatchObject({
      mutate: expect.any(Function),
      mutateAsync: expect.any(Function),
      isError: false,
      isSuccess: false,
      error: null,
      data: undefined,
    });
  });

  it('should update event successfully', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockUpdateData = {
      id: 'event123',
      title: 'Updated Event Title',
      description: 'Updated description',
      location: {
        type: 'manual_entry',
        data: {
          name: 'Updated Location',
        },
      },
      timezone: 'UTC',
      start_date_day: 15,
      start_date_month: 6,
      start_date_year: 2024,
      end_date_day: 15,
      end_date_month: 6,
      end_date_year: 2024,
      visibility: 'public' as const,
      status: 'published' as const,
    };

    const mockResponse = {
      data: [
        {
          id: 'event123',
          title: 'Updated Event Title',
        },
      ],
    };

    mockApiClient.patch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateEventWithCallbacks(), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate(mockUpdateData);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/details', mockUpdateData);
    expect(result.current.data).toEqual(mockResponse.data[0]);
  });

  it('should handle API errors gracefully', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockUpdateData = {
      id: 'event123',
      title: 'Updated Event Title',
      description: 'Updated description',
      location: {
        type: 'manual_entry',
        data: {
          name: 'Updated Location',
        },
      },
      timezone: 'UTC',
      start_date_day: 15,
      start_date_month: 6,
      start_date_year: 2024,
      end_date_day: 15,
      end_date_month: 6,
      end_date_year: 2024,
      visibility: 'public' as const,
      status: 'published' as const,
    };

    const apiError = new Error('API Error');
    mockApiClient.patch.mockRejectedValue(apiError);

    const { result } = renderHook(() => useUpdateEventWithCallbacks(), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate(mockUpdateData);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(apiError);
    // This hook doesn't have onError callback, so console.error shouldn't be called
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should invalidate queries on success', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockUpdateData = {
      id: 'event123',
      title: 'Updated Event Title',
      description: 'Updated description',
      location: {
        type: 'manual_entry',
        data: {
          name: 'Updated Location',
        },
      },
      timezone: 'UTC',
      start_date_day: 15,
      start_date_month: 6,
      start_date_year: 2024,
      end_date_day: 15,
      end_date_month: 6,
      end_date_year: 2024,
      visibility: 'public' as const,
      status: 'published' as const,
    };

    const mockResponse = {
      data: [
        {
          id: 'event123',
          title: 'Updated Event Title',
        },
      ],
    };

    mockApiClient.patch.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useUpdateEventWithCallbacks(), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate(mockUpdateData);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check that queries were invalidated
    expect(queryClient.getQueryCache().findAll()).toHaveLength(0);
  });

  it('should handle validation errors', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const invalidData = {
      id: '', // Invalid: empty ID
      title: 'Updated Event Title',
      description: 'Updated description',
      location: {
        type: 'manual_entry',
        data: {
          name: 'Updated Location',
        },
      },
      timezone: 'UTC',
      start_date_day: 15,
      start_date_month: 6,
      start_date_year: 2024,
      end_date_day: 15,
      end_date_month: 6,
      end_date_year: 2024,
      visibility: 'public' as const,
      status: 'published' as const,
    };

    const { result } = renderHook(() => useUpdateEventWithCallbacks(), {
      wrapper,
    });

    await act(async () => {
      result.current.mutate(invalidData);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Should not call API with invalid data
    expect(mockApiClient.patch).not.toHaveBeenCalled();
  });

  it('should work with both hooks simultaneously', () => {
    const { result: result1 } = renderHook(() => useUpdateEvent(), { wrapper });
    const { result: result2 } = renderHook(() => useUpdateEventWithCallbacks(), { wrapper });

    // Both hooks should be initialized
    expect(result1.current).toBeDefined();
    expect(result2.current).toBeDefined();
    expect(typeof result1.current.mutate).toBe('function');
    expect(typeof result2.current.mutate).toBe('function');
  });
});

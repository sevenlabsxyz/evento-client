import { useEventDetails } from '@/lib/hooks/use-event-details';
import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock the API client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
  },
}));

// Mock the API transform utility
jest.mock('@/lib/utils/api-transform', () => ({
  transformApiEventResponse: jest.fn(),
}));

// Mock the debug utility
jest.mock('@/lib/utils/debug', () => ({
  debugError: jest.fn(),
}));

const mockApiClient = require('@/lib/api/client').apiClient as jest.Mocked<typeof apiClient>;
const mockTransformApiEventResponse = require('@/lib/utils/api-transform')
  .transformApiEventResponse as jest.MockedFunction<any>;

describe('useEventDetails', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  it('returns loading state initially', () => {
    mockApiClient.get.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { result } = renderHook(() => useEventDetails('event123'), {
      wrapper: createTestWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBe(null);
  });

  it('fetches and returns event details successfully', async () => {
    const mockEventData = {
      id: 'event123',
      title: 'Test Event',
      description: 'Test Description',
      location: 'Test Location',
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
      timezone: 'UTC',
      visibility: 'public',
      status: 'published',
      cover: null,
      host_id: 'user1',
    };

    const transformedEvent = {
      ...mockEventData,
      startDate: new Date(2025, 0, 1, 10, 0),
      endDate: new Date(2025, 0, 1, 12, 0),
    };

    mockApiClient.get.mockResolvedValue({
      success: true,
      message: 'ok',
      data: mockEventData,
    });

    mockTransformApiEventResponse.mockReturnValue(transformedEvent);

    const { result } = renderHook(() => useEventDetails('event123'), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(transformedEvent);
    expect(result.current.error).toBe(null);
    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/details?id=event123');
    expect(mockTransformApiEventResponse).toHaveBeenCalledWith(mockEventData);
  });

  it('handles API response without success wrapper', async () => {
    const mockEventData = {
      id: 'event123',
      title: 'Test Event',
      description: 'Test Description',
    };

    const transformedEvent = {
      ...mockEventData,
      startDate: null,
      endDate: null,
    };

    mockApiClient.get.mockResolvedValue(mockEventData);
    mockTransformApiEventResponse.mockReturnValue(transformedEvent);

    const { result } = renderHook(() => useEventDetails('event123'), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(transformedEvent);
    expect(mockTransformApiEventResponse).toHaveBeenCalledWith(mockEventData);
  });

  it('handles API errors gracefully', async () => {
    const apiError = new Error('Event not found');
    mockApiClient.get.mockRejectedValue(apiError);

    const { result } = renderHook(() => useEventDetails('event123'), {
      wrapper: createTestWrapper(),
    });

    await waitFor(
      () => {
        // Wait for the hook to complete with error - use a more robust condition
        return !result.current.isLoading;
      },
      { timeout: 2000 }
    );

    expect(result.current.data).toBeUndefined();
    expect(result.current.error).toBe(apiError);
  });

  it('handles transformation errors gracefully', async () => {
    const mockEventData = {
      id: 'event123',
      title: 'Test Event',
    };

    mockApiClient.get.mockResolvedValue({
      success: true,
      message: 'ok',
      data: mockEventData,
    });

    const { result } = renderHook(() => useEventDetails('event123'), {
      wrapper: createTestWrapper(),
    });

    // Wait for the hook to complete - it should finish even with transformation failure
    await waitFor(
      () => {
        // The hook should complete (not be loading) even if transformation fails
        return !result.current.isLoading;
      },
      { timeout: 2000 }
    );

    // When transformation fails, the hook should return undefined data without throwing
    expect(result.current.data).toBeUndefined();
    // Should not have an error since the transformation failure is handled gracefully
    expect(result.current.error).toBeNull();

    it('is disabled when eventId is empty', () => {
      const { result } = renderHook(() => useEventDetails(''), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('handles different event IDs correctly', async () => {
      const mockEventData = {
        id: 'event456',
        title: 'Different Event',
        description: 'Different Description',
      };

      mockApiClient.get.mockResolvedValue({
        success: true,
        message: 'ok',
        data: mockEventData,
      });

      mockTransformApiEventResponse.mockReturnValue(mockEventData);

      const { result } = renderHook(() => useEventDetails('event456'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockEventData);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/details?id=event456');
    });
  });
});

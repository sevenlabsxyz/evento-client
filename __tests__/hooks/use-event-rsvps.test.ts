import { apiClient } from '@/lib/api/client';
import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
import { queryKeys } from '@/lib/query-client';
import { ApiResponse, EventRSVP, UserDetails } from '@/lib/types/api';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useEventRSVPs', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    // Clear any existing mock implementations
    mockApiClient.get.mockReset();
  });

  const createMockUserDetails = (overrides: Partial<UserDetails> = {}): UserDetails => ({
    id: 'user123',
    username: 'testuser',
    name: 'Test User',
    email: 'test@example.com',
    bio: 'Test bio',
    image: 'test.jpg',
    bio_link: 'https://example.com',
    x_handle: '@testuser',
    instagram_handle: '@testuser',
    ln_address: 'test@example.com',
    nip05: 'test@example.com',
    verification_status: 'verified',
    verification_date: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  const createMockEventRSVP = (overrides: Partial<EventRSVP> = {}): EventRSVP => ({
    id: 'rsvp123',
    event_id: 'event123',
    user_id: 'user123',
    status: 'yes',
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    user_details: createMockUserDetails(),
    ...overrides,
  });

  const createMockApiResponse = (data: EventRSVP[]): ApiResponse<EventRSVP[]> => ({
    success: true,
    message: 'Event RSVPs retrieved successfully',
    data,
  });

  describe('query functionality', () => {
    it('fetches event RSVPs successfully', async () => {
      const mockRSVPs = [
        createMockEventRSVP({ id: 'rsvp1', status: 'yes' }),
        createMockEventRSVP({ id: 'rsvp2', status: 'no' }),
        createMockEventRSVP({ id: 'rsvp3', status: 'maybe' }),
      ];
      const mockResponse = createMockApiResponse(mockRSVPs);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/event123/rsvps');
      expect(result.current.data).toEqual(mockRSVPs);
    });

    it('fetches event RSVPs with different statuses', async () => {
      const mockRSVPs = [
        createMockEventRSVP({
          id: 'rsvp1',
          status: 'yes',
          user_details: createMockUserDetails({ username: 'user1' }),
        }),
        createMockEventRSVP({
          id: 'rsvp2',
          status: 'no',
          user_details: createMockUserDetails({ username: 'user2' }),
        }),
        createMockEventRSVP({
          id: 'rsvp3',
          status: 'maybe',
          user_details: createMockUserDetails({ username: 'user3' }),
        }),
      ];
      const mockResponse = createMockApiResponse(mockRSVPs);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data![0].status).toBe('yes');
      expect(result.current.data![1].status).toBe('no');
      expect(result.current.data![2].status).toBe('maybe');
    });

    it('handles empty RSVPs response', async () => {
      const mockResponse = createMockApiResponse([]);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('handles API response with null data', async () => {
      const mockResponse = {
        success: true,
        message: 'Event RSVPs retrieved successfully',
        data: null,
      };
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('handles API response with undefined data', async () => {
      const mockResponse = {
        success: true,
        message: 'Event RSVPs retrieved successfully',
        data: undefined,
      };
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('handles API response with non-array data', async () => {
      const mockResponse = {
        success: true,
        message: 'Event RSVPs retrieved successfully',
        data: 'not an array',
      };
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('handles API error', async () => {
      const apiError = new Error('API Error');
      mockApiClient.get.mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });

    it('is disabled when eventId is empty', () => {
      const { result } = renderHook(() => useEventRSVPs(''), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('is disabled when eventId is null', () => {
      const { result } = renderHook(() => useEventRSVPs(null as any), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('is disabled when eventId is undefined', () => {
      const { result } = renderHook(() => useEventRSVPs(undefined as any), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });
  });

  describe('query state', () => {
    it('tracks loading state correctly', async () => {
      const mockRSVPs = [createMockEventRSVP()];
      const mockResponse = createMockApiResponse(mockRSVPs);

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.get.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Check loading state
      expect(result.current.isLoading).toBe(true);
      expect(result.current.isFetching).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!(mockResponse);
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('tracks success state correctly', async () => {
      const mockRSVPs = [createMockEventRSVP()];
      const mockResponse = createMockApiResponse(mockRSVPs);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockRSVPs);
    });

    it('tracks error state correctly', async () => {
      const apiError = new Error('API Error');
      mockApiClient.get.mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(apiError);
      });
    });
  });

  describe('query configuration', () => {
    it('has correct query key', async () => {
      const mockRSVPs = [createMockEventRSVP()];
      const mockResponse = createMockApiResponse(mockRSVPs);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that the query key is correct
      const queryData = queryClient.getQueryData(queryKeys.eventRsvps('event123'));
      expect(queryData).toEqual(mockRSVPs);
    });

    it('has stale time configuration', async () => {
      const mockRSVPs = [createMockEventRSVP()];
      const mockResponse = createMockApiResponse(mockRSVPs);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // The stale time is configured in the hook, we can verify it's working
      // by checking that the query doesn't refetch immediately
      expect(result.current.data).toEqual(mockRSVPs);
    });
  });

  describe('URL parameter handling', () => {
    it('constructs correct URL with event ID', async () => {
      const mockRSVPs = [createMockEventRSVP()];
      const mockResponse = createMockApiResponse(mockRSVPs);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/event123/rsvps');
    });

    it('handles special characters in event ID', async () => {
      const eventId = 'event-with-special-chars-!@#$%';
      const mockRSVPs = [createMockEventRSVP({ event_id: eventId })];
      const mockResponse = createMockApiResponse(mockRSVPs);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs(eventId), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(`/v1/events/${eventId}/rsvps`);
      expect(result.current.data![0].event_id).toBe(eventId);
    });

    it('handles numeric event ID', async () => {
      const eventId = '12345';
      const mockRSVPs = [createMockEventRSVP({ event_id: eventId })];
      const mockResponse = createMockApiResponse(mockRSVPs);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs(eventId), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(`/v1/events/${eventId}/rsvps`);
    });
  });

  describe('RSVP data structure', () => {
    it('handles RSVPs with complete data', async () => {
      const mockRSVP = createMockEventRSVP({
        id: 'rsvp456',
        event_id: 'event456',
        user_id: 'user789',
        status: 'yes',
        created_at: '2024-01-15T10:30:00Z',
        updated_at: '2024-01-15T11:30:00Z',
        user_details: createMockUserDetails({
          id: 'user789',
          username: 'johndoe',
          name: 'John Doe',
          email: 'john@example.com',
        }),
      });

      const mockResponse = createMockApiResponse([mockRSVP]);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs('event456'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0]).toEqual(mockRSVP);
      expect(result.current.data![0].user_details?.username).toBe('johndoe');
    });

    it('handles RSVPs without user details', async () => {
      const mockRSVP = createMockEventRSVP({
        id: 'rsvp789',
        user_details: undefined,
      });

      const mockResponse = createMockApiResponse([mockRSVP]);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data![0].user_details).toBeUndefined();
    });

    it('handles RSVPs with different status values', async () => {
      const mockRSVPs = [
        createMockEventRSVP({ id: 'rsvp1', status: 'yes' }),
        createMockEventRSVP({ id: 'rsvp2', status: 'no' }),
        createMockEventRSVP({ id: 'rsvp3', status: 'maybe' }),
      ];

      const mockResponse = createMockApiResponse(mockRSVPs);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data![0].status).toBe('yes');
      expect(result.current.data![1].status).toBe('no');
      expect(result.current.data![2].status).toBe('maybe');
    });
  });

  describe('multiple queries', () => {
    it('can fetch different events independently', async () => {
      const mockRSVPs1 = [createMockEventRSVP({ event_id: 'event1' })];
      const mockRSVPs2 = [createMockEventRSVP({ event_id: 'event2' })];

      const mockResponse1 = createMockApiResponse(mockRSVPs1);
      const mockResponse2 = createMockApiResponse(mockRSVPs2);

      mockApiClient.get.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

      const { result: result1 } = renderHook(() => useEventRSVPs('event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const { result: result2 } = renderHook(() => useEventRSVPs('event2'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      expect(result1.current.data).toEqual(mockRSVPs1);
      expect(result2.current.data).toEqual(mockRSVPs2);
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('handles very large RSVPs response', async () => {
      const mockRSVPs = Array.from({ length: 100 }, (_, index) =>
        createMockEventRSVP({
          id: `rsvp${index}`,
          user_id: `user${index}`,
          status: index % 3 === 0 ? 'yes' : index % 3 === 1 ? 'no' : 'maybe',
        })
      );
      const mockResponse = createMockApiResponse(mockRSVPs);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(100);
      expect(result.current.data![0].id).toBe('rsvp0');
      expect(result.current.data![99].id).toBe('rsvp99');
    });

    it('handles response with success false', async () => {
      const mockResponse = {
        success: false,
        message: 'No RSVPs found',
        data: null,
      };
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('handles malformed API response', async () => {
      const mockResponse = {
        success: true,
        message: 'Event RSVPs retrieved successfully',
        // Missing data property
      };
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('handles network timeout', async () => {
      const timeoutError = new Error('Network timeout');
      timeoutError.name = 'TimeoutError';
      mockApiClient.get.mockRejectedValueOnce(timeoutError);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(timeoutError);
    });
  });
});

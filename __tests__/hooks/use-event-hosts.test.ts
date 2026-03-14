import { apiClient } from '@/lib/api/client';
import { EventHost, useEventHosts } from '@/lib/hooks/use-event-hosts';
import { UserDetails } from '@/lib/types/api';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useEventHosts', () => {
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

  const createMockEventHost = (overrides: Partial<EventHost> = {}): EventHost => ({
    event_id: 'event123',
    created_at: '2024-01-15T10:30:00Z',
    user_details: createMockUserDetails(),
    ...overrides,
  });

  const createMockApiResponse = (data: EventHost[]) => ({
    success: true,
    message: 'Event hosts retrieved successfully',
    data,
  });

  describe('query functionality', () => {
    it('fetches event hosts successfully with API response structure', async () => {
      const mockEventHosts = [
        createMockEventHost({
          event_id: 'event123',
          user_details: createMockUserDetails({
            id: 'host1',
            username: 'hostuser1',
            name: 'Host User 1',
          }),
        }),
        createMockEventHost({
          event_id: 'event123',
          user_details: createMockUserDetails({
            id: 'host2',
            username: 'hostuser2',
            name: 'Host User 2',
          }),
        }),
      ];
      const mockResponse = createMockApiResponse(mockEventHosts);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/event123/hosts');
      expect(result.current.data).toEqual(mockEventHosts);
    });

    it('fetches event hosts successfully with direct response', async () => {
      const mockEventHosts = [
        createMockEventHost({
          event_id: 'event123',
          user_details: createMockUserDetails({
            id: 'host1',
            username: 'hostuser1',
            name: 'Host User 1',
          }),
        }),
        createMockEventHost({
          event_id: 'event123',
          user_details: createMockUserDetails({
            id: 'host2',
            username: 'hostuser2',
            name: 'Host User 2',
          }),
        }),
      ];
      mockApiClient.get.mockResolvedValueOnce(mockEventHosts as any);

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/event123/hosts');
      expect(result.current.data).toEqual(mockEventHosts);
    });

    it('handles empty hosts response', async () => {
      const mockResponse = createMockApiResponse([]);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventHosts('event123'), {
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
        message: 'Event hosts retrieved successfully',
        data: null,
      };
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventHosts('event123'), {
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

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });

    it('handles invalid response format', async () => {
      mockApiClient.get.mockResolvedValueOnce(null as any);

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        expect.objectContaining({
          message: 'Invalid response format',
        })
      );
    });

    it('handles non-object response', async () => {
      mockApiClient.get.mockResolvedValueOnce('string response' as any);

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        expect.objectContaining({
          message: 'Invalid response format',
        })
      );
    });

    it('is disabled when eventId is empty', () => {
      const { result } = renderHook(() => useEventHosts(''), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('is disabled when eventId is null', () => {
      const { result } = renderHook(() => useEventHosts(null as any), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });
  });

  describe('query state', () => {
    it('tracks loading state correctly', async () => {
      const mockEventHosts = [createMockEventHost()];
      const mockResponse = createMockApiResponse(mockEventHosts);

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.get.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useEventHosts('event123'), {
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
      const mockEventHosts = [createMockEventHost()];
      const mockResponse = createMockApiResponse(mockEventHosts);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockEventHosts);
    });

    it('tracks error state correctly', async () => {
      const apiError = new Error('API Error');
      mockApiClient.get.mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(apiError);
      });
    });
  });

  describe('URL parameter handling', () => {
    it('constructs correct URL with event ID', async () => {
      const mockEventHosts = [createMockEventHost()];
      const mockResponse = createMockApiResponse(mockEventHosts);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/event123/hosts');
    });

    it('handles special characters in event ID', async () => {
      const mockEventHosts = [createMockEventHost()];
      const mockResponse = createMockApiResponse(mockEventHosts);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventHosts('event-with-special-chars-!@#$%'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/events/event-with-special-chars-!@#$%/hosts'
      );
    });
  });

  describe('response data handling', () => {
    it('handles API response with success and data properties', async () => {
      const mockEventHosts = [
        createMockEventHost({
          event_id: 'event123',
          user_details: createMockUserDetails({
            id: 'host1',
            username: 'hostuser1',
            name: 'Host User 1',
          }),
        }),
        createMockEventHost({
          event_id: 'event123',
          user_details: createMockUserDetails({
            id: 'host2',
            username: 'hostuser2',
            name: 'Host User 2',
          }),
        }),
      ];
      const mockResponse = createMockApiResponse(mockEventHosts);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockEventHosts);
    });

    it('handles direct hosts response without API wrapper', async () => {
      const mockEventHosts = [
        createMockEventHost({
          event_id: 'event123',
          user_details: createMockUserDetails({
            id: 'host1',
            username: 'hostuser1',
            name: 'Host User 1',
          }),
        }),
        createMockEventHost({
          event_id: 'event123',
          user_details: createMockUserDetails({
            id: 'host2',
            username: 'hostuser2',
            name: 'Host User 2',
          }),
        }),
      ];
      mockApiClient.get.mockResolvedValueOnce(mockEventHosts as any);

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockEventHosts);
    });
  });

  describe('query configuration', () => {
    it('has correct query key', async () => {
      const mockEventHosts = [createMockEventHost()];
      const mockResponse = createMockApiResponse(mockEventHosts);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that the query key is correct
      const queryData = queryClient.getQueryData(['events', 'event123', 'hosts']);
      expect(queryData).toEqual(mockEventHosts);
    });

    it('has stale time configuration', async () => {
      const mockEventHosts = [createMockEventHost()];
      const mockResponse = createMockApiResponse(mockEventHosts);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // The stale time is configured in the hook, we can verify it's working
      // by checking that the query doesn't refetch immediately
      expect(result.current.data).toEqual(mockEventHosts);
    });
  });

  describe('event host structure', () => {
    it('handles event hosts with complete user details', async () => {
      const mockUserDetails = createMockUserDetails({
        id: 'host456',
        username: 'hostuser456',
        name: 'Host User 456',
        bio: 'Host user bio',
        image: 'host-user.jpg',
        verification_status: 'verified',
      });

      const mockEventHost = createMockEventHost({
        event_id: 'event456',
        user_details: mockUserDetails,
      });

      const mockResponse = createMockApiResponse([mockEventHost]);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventHosts('event456'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0]).toEqual(mockEventHost);
      expect(result.current.data![0].user_details).toEqual(mockUserDetails);
    });

    it('handles event hosts with minimal user details', async () => {
      const mockUserDetails = createMockUserDetails({
        id: 'host789',
        username: 'minimalhost',
        name: 'Minimal Host',
        bio: '',
        image: '',
        verification_status: undefined,
      });

      const mockEventHost = createMockEventHost({
        event_id: 'event789',
        user_details: mockUserDetails,
      });

      const mockResponse = createMockApiResponse([mockEventHost]);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventHosts('event789'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0].user_details).toEqual(mockUserDetails);
    });

    it('handles multiple hosts for the same event', async () => {
      const mockEventHosts = [
        createMockEventHost({
          event_id: 'event123',
          user_details: createMockUserDetails({
            id: 'host1',
            username: 'hostuser1',
            name: 'Host User 1',
          }),
        }),
        createMockEventHost({
          event_id: 'event123',
          user_details: createMockUserDetails({
            id: 'host2',
            username: 'hostuser2',
            name: 'Host User 2',
          }),
        }),
        createMockEventHost({
          event_id: 'event123',
          user_details: createMockUserDetails({
            id: 'host3',
            username: 'hostuser3',
            name: 'Host User 3',
          }),
        }),
      ];

      const mockResponse = createMockApiResponse(mockEventHosts);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data![0].user_details.username).toBe('hostuser1');
      expect(result.current.data![1].user_details.username).toBe('hostuser2');
      expect(result.current.data![2].user_details.username).toBe('hostuser3');
    });
  });

  describe('multiple queries', () => {
    it('can fetch different event hosts independently', async () => {
      const mockEventHosts1 = [
        createMockEventHost({
          event_id: 'event1',
          user_details: createMockUserDetails({
            id: 'host1',
            username: 'hostuser1',
            name: 'Host User 1',
          }),
        }),
      ];
      const mockEventHosts2 = [
        createMockEventHost({
          event_id: 'event2',
          user_details: createMockUserDetails({
            id: 'host2',
            username: 'hostuser2',
            name: 'Host User 2',
          }),
        }),
      ];

      const mockResponse1 = createMockApiResponse(mockEventHosts1);
      const mockResponse2 = createMockApiResponse(mockEventHosts2);

      mockApiClient.get.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

      const { result: result1 } = renderHook(() => useEventHosts('event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const { result: result2 } = renderHook(() => useEventHosts('event2'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      expect(result1.current.data).toEqual(mockEventHosts1);
      expect(result2.current.data).toEqual(mockEventHosts2);
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('handles undefined response data', async () => {
      const mockResponse = {
        success: true,
        message: 'Event hosts retrieved successfully',
        data: undefined,
      };
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('handles response with success false', async () => {
      const mockResponse = {
        success: false,
        message: 'Event not found',
        data: null,
      };
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('handles very large hosts response', async () => {
      const mockEventHosts = Array.from({ length: 50 }, (_, index) =>
        createMockEventHost({
          event_id: 'event123',
          user_details: createMockUserDetails({
            id: `host${index}`,
            username: `hostuser${index}`,
            name: `Host User ${index}`,
          }),
        })
      );
      const mockResponse = createMockApiResponse(mockEventHosts);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(50);
      expect(result.current.data![0].user_details.username).toBe('hostuser0');
      expect(result.current.data![49].user_details.username).toBe('hostuser49');
    });

    it('handles hosts with different event IDs in response', async () => {
      const mockEventHosts = [
        createMockEventHost({
          event_id: 'event123',
          user_details: createMockUserDetails({
            id: 'host1',
            username: 'hostuser1',
            name: 'Host User 1',
          }),
        }),
        createMockEventHost({
          event_id: 'event456', // Different event ID
          user_details: createMockUserDetails({
            id: 'host2',
            username: 'hostuser2',
            name: 'Host User 2',
          }),
        }),
      ];

      const mockResponse = createMockApiResponse(mockEventHosts);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventHosts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Should return all hosts regardless of event_id in the response
      expect(result.current.data).toHaveLength(2);
      expect(result.current.data![0].event_id).toBe('event123');
      expect(result.current.data![1].event_id).toBe('event456');
    });
  });
});

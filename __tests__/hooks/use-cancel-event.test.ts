import { useCancelEvent } from '@/lib/hooks/use-cancel-event';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock the API client
jest.mock('@/lib/api/client', () => {
  const mockApiClient = {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
    request: jest.fn(),
    head: jest.fn(),
    options: jest.fn(),
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
  };
  return {
    __esModule: true,
    default: mockApiClient,
    apiClient: mockApiClient,
  };
});

// Mock the debug utility
jest.mock('@/lib/utils/debug', () => ({
  debugError: jest.fn(),
}));

// Mock console.error to avoid noise in test output
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

import { apiClient } from '@/lib/api/client';
import { debugError } from '@/lib/utils/debug';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockDebugError = debugError as jest.MockedFunction<typeof debugError>;

describe('useCancelEvent', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    mockConsoleError.mockClear();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  const createMockCancelResponse = () => ({
    success: true,
    message: 'Event cancelled successfully',
    data: {
      id: 'event1',
      status: 'cancelled',
      cancelled_at: '2023-01-01T00:00:00Z',
    },
  });

  describe('mutation function', () => {
    it('cancels an event successfully', async () => {
      const mockResponse = createMockCancelResponse();
      mockApiClient.delete.mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const cancelParams = {
        eventId: 'event1',
        sendEmails: true,
      };

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(cancelParams);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/events/event1/cancel?sendEmails=true');
      expect(mutationResult).toEqual(mockResponse);
    });

    it('cancels an event without sending emails', async () => {
      const mockResponse = createMockCancelResponse();
      mockApiClient.delete.mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const cancelParams = {
        eventId: 'event2',
        sendEmails: false,
      };

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(cancelParams);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/v1/events/event2/cancel?sendEmails=false'
      );
      expect(mutationResult).toEqual(mockResponse);
    });

    it('handles API errors and calls debugError', async () => {
      const apiError = new Error('Event not found');
      mockApiClient.delete.mockRejectedValue(apiError);

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const cancelParams = {
        eventId: 'nonexistent',
        sendEmails: true,
      };

      await act(async () => {
        result.current.mutate(cancelParams);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockDebugError).toHaveBeenCalledWith(
        'useCancelEvent',
        'Failed to cancel event',
        apiError,
        {
          eventId: 'nonexistent',
          sendEmails: true,
        }
      );
    });

    it('handles network errors', async () => {
      const networkError = new Error('Network error');
      mockApiClient.delete.mockRejectedValue(networkError);

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const cancelParams = {
        eventId: 'event1',
        sendEmails: false,
      };

      await act(async () => {
        result.current.mutate(cancelParams);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockDebugError).toHaveBeenCalledWith(
        'useCancelEvent',
        'Failed to cancel event',
        networkError,
        {
          eventId: 'event1',
          sendEmails: false,
        }
      );
    });

    it('handles different event IDs correctly', async () => {
      const mockResponse = createMockCancelResponse();
      mockApiClient.delete.mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const testCases = [
        { eventId: 'event-123', sendEmails: true },
        { eventId: 'event-456', sendEmails: false },
        { eventId: 'event-789', sendEmails: true },
      ];

      for (const testCase of testCases) {
        await act(async () => {
          await result.current.mutateAsync(testCase);
        });

        expect(mockApiClient.delete).toHaveBeenCalledWith(
          `/v1/events/${testCase.eventId}/cancel?sendEmails=${testCase.sendEmails}`
        );
      }
    });
  });

  describe('success handling', () => {
    it('invalidates events queries on successful cancellation', async () => {
      const mockResponse = createMockCancelResponse();
      mockApiClient.delete.mockResolvedValue({ data: mockResponse });

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
      const removeQueriesSpy = jest.spyOn(queryClient, 'removeQueries');

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const cancelParams = {
        eventId: 'event1',
        sendEmails: true,
      };

      await act(async () => {
        await result.current.mutateAsync(cancelParams);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['events'],
      });
      expect(removeQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['event', 'details', 'event1'],
      });
    });

    it('handles multiple successful cancellations', async () => {
      const mockResponse = createMockCancelResponse();
      mockApiClient.delete.mockResolvedValue({ data: mockResponse });

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
      const removeQueriesSpy = jest.spyOn(queryClient, 'removeQueries');

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const events = ['event1', 'event2', 'event3'];

      for (const eventId of events) {
        await act(async () => {
          await result.current.mutateAsync({
            eventId,
            sendEmails: true,
          });
        });
      }

      // Should invalidate events query for each cancellation
      expect(invalidateQueriesSpy).toHaveBeenCalledTimes(3);
      expect(removeQueriesSpy).toHaveBeenCalledTimes(3);

      // Check that each event's details were removed
      events.forEach((eventId) => {
        expect(removeQueriesSpy).toHaveBeenCalledWith({
          queryKey: ['event', 'details', eventId],
        });
      });
    });
  });

  describe('error handling', () => {
    it('logs error to console on mutation failure', async () => {
      const apiError = new Error('Server error');
      mockApiClient.delete.mockRejectedValue(apiError);

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const cancelParams = {
        eventId: 'event1',
        sendEmails: true,
      };

      await act(async () => {
        result.current.mutate(cancelParams);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockConsoleError).toHaveBeenCalled();
    });

    it('does not invalidate queries on error', async () => {
      const apiError = new Error('API Error');
      mockApiClient.delete.mockRejectedValue(apiError);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');
      const removeQueriesSpy = jest.spyOn(queryClient, 'removeQueries');

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const cancelParams = {
        eventId: 'event1',
        sendEmails: true,
      };

      await act(async () => {
        result.current.mutate(cancelParams);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(invalidateQueriesSpy).not.toHaveBeenCalled();
      expect(removeQueriesSpy).not.toHaveBeenCalled();
    });
  });

  describe('mutation state', () => {
    it('tracks loading state correctly', async () => {
      const mockResponse = createMockCancelResponse();

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.delete.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const cancelParams = {
        eventId: 'event1',
        sendEmails: true,
      };

      // Start mutation
      act(() => {
        result.current.mutate(cancelParams);
      });

      // Wait for the mutation to start and check status
      await waitFor(() => {
        expect(result.current.status).toBe('pending');
      });

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ data: mockResponse });
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });
    });

    it('tracks error state correctly', async () => {
      const apiError = new Error('API Error');
      mockApiClient.delete.mockRejectedValue(apiError);

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const cancelParams = {
        eventId: 'event1',
        sendEmails: true,
      };

      await act(async () => {
        result.current.mutate(cancelParams);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe(apiError);
      });
    });

    it('can perform multiple mutations successfully', async () => {
      const mockResponse = createMockCancelResponse();
      mockApiClient.delete.mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const cancelParams = {
        eventId: 'event1',
        sendEmails: true,
      };

      // First mutation
      await act(async () => {
        await result.current.mutateAsync(cancelParams);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      // Second mutation should work
      await act(async () => {
        await result.current.mutateAsync({
          eventId: 'event2',
          sendEmails: false,
        });
      });

      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });

      // Verify both API calls were made
      expect(mockApiClient.delete).toHaveBeenCalledTimes(2);
      expect(mockApiClient.delete).toHaveBeenNthCalledWith(
        1,
        '/v1/events/event1/cancel?sendEmails=true'
      );
      expect(mockApiClient.delete).toHaveBeenNthCalledWith(
        2,
        '/v1/events/event2/cancel?sendEmails=false'
      );
    });
  });

  describe('URL parameter handling', () => {
    it('correctly encodes boolean parameters in URL', async () => {
      const mockResponse = createMockCancelResponse();
      mockApiClient.delete.mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const testCases = [
        {
          eventId: 'event1',
          sendEmails: true,
          expectedUrl: '/v1/events/event1/cancel?sendEmails=true',
        },
        {
          eventId: 'event2',
          sendEmails: false,
          expectedUrl: '/v1/events/event2/cancel?sendEmails=false',
        },
      ];

      for (const testCase of testCases) {
        await act(async () => {
          await result.current.mutateAsync({
            eventId: testCase.eventId,
            sendEmails: testCase.sendEmails,
          });
        });

        expect(mockApiClient.delete).toHaveBeenCalledWith(testCase.expectedUrl);
      }
    });

    it('handles special characters in event ID', async () => {
      const mockResponse = createMockCancelResponse();
      mockApiClient.delete.mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const specialEventIds = [
        'event-with-dashes',
        'event_with_underscores',
        'event.with.dots',
        'event123',
        'event@special',
      ];

      for (const eventId of specialEventIds) {
        await act(async () => {
          await result.current.mutateAsync({
            eventId,
            sendEmails: true,
          });
        });

        expect(mockApiClient.delete).toHaveBeenCalledWith(
          `/v1/events/${eventId}/cancel?sendEmails=true`
        );
      }
    });
  });

  describe('query client integration', () => {
    it('works with existing query cache', async () => {
      const mockResponse = createMockCancelResponse();
      mockApiClient.delete.mockResolvedValue({ data: mockResponse });

      // Pre-populate query cache
      queryClient.setQueryData(['events'], [{ id: 'event1', title: 'Test Event' }]);
      queryClient.setQueryData(['event', 'details', 'event1'], {
        id: 'event1',
        title: 'Test Event',
      });

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const cancelParams = {
        eventId: 'event1',
        sendEmails: true,
      };

      await act(async () => {
        await result.current.mutateAsync(cancelParams);
      });

      // Check that the event details were removed from cache
      const eventDetails = queryClient.getQueryData(['event', 'details', 'event1']);
      expect(eventDetails).toBeUndefined();

      // Check that events query was invalidated (would trigger refetch)
      const eventsQuery = queryClient.getQueryState(['events']);
      expect(eventsQuery?.isInvalidated).toBe(true);
    });

    it('handles missing query cache gracefully', async () => {
      const mockResponse = createMockCancelResponse();
      mockApiClient.delete.mockResolvedValue({ data: mockResponse });

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const cancelParams = {
        eventId: 'event1',
        sendEmails: true,
      };

      // Should not throw error even if queries don't exist
      await expect(
        act(async () => {
          await result.current.mutateAsync(cancelParams);
        })
      ).resolves.not.toThrow();
    });
  });
});

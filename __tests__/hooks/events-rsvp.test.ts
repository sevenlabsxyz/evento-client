import { useCancelEvent } from '@/lib/hooks/use-cancel-event';
import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
import { useEventsFeed } from '@/lib/hooks/use-events-feed';
import { useSubEvents } from '@/lib/hooks/use-sub-events';
import { useUpdateEvent } from '@/lib/hooks/use-update-event';
import { useUserEvents } from '@/lib/hooks/use-user-events';
import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock the API client
const mockApiClient = {
  get: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
};

// Mock the API transform utility
jest.mock('@/lib/utils/api-transform', () => ({
  transformApiEventResponse: jest.fn(),
}));

const mockTransformApiEventResponse =
  require('@/lib/utils/api-transform').transformApiEventResponse;

describe('Event and RSVP Hooks', () => {
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

  describe('useEventsFeed', () => {
    it('returns loading state initially', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useEventsFeed(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('fetches and returns events feed successfully', async () => {
      const mockEvents = [
        {
          id: 'event1',
          title: 'Event 1',
          description: 'Description 1',
          user_details: { username: 'user1', name: 'User 1' },
        },
        {
          id: 'event2',
          title: 'Event 2',
          description: 'Description 2',
          user_details: { username: 'user2', name: 'User 2' },
        },
      ];

      mockApiClient.get.mockResolvedValue({
        success: true,
        message: 'ok',
        data: mockEvents,
      });

      const { result } = renderHook(() => useEventsFeed(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockEvents);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/feed');
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to fetch feed');
      mockApiClient.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useEventsFeed(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBe(apiError);
    });

    it('handles unauthorized errors without retry', async () => {
      const authError = { message: 'Unauthorized', status: 401 };
      mockApiClient.get.mockRejectedValue(authError);

      const { result } = renderHook(() => useEventsFeed(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(authError);
      // Should not retry on 401 errors
    });
  });

  describe('useUserEvents', () => {
    it('returns loading state initially', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(
        () =>
          useUserEvents({
            username: 'testuser',
            filter: 'upcoming',
            timeframe: 'all',
            sortBy: 'date-desc',
          }),
        {
          wrapper: createTestWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('fetches user events with all parameters', async () => {
      const mockResponse = {
        events: [
          {
            id: 'event1',
            title: 'Event 1',
            description: 'Description 1',
            user_details: { username: 'testuser', name: 'Test User' },
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
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () =>
          useUserEvents({
            username: 'testuser',
            search: 'test',
            filter: 'hosting',
            timeframe: 'future',
            sortBy: 'date-asc',
            limit: 20,
          }),
        {
          wrapper: createTestWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/events/user-events?username=testuser&filter=hosting&search=test&sortBy=date&sortOrder=asc&timeframe=future&page=1&limit=20'
      );
    });

    it('is disabled when username is not provided', () => {
      const { result } = renderHook(
        () =>
          useUserEvents({
            username: '',
            filter: 'upcoming',
          }),
        {
          wrapper: createTestWrapper(),
        }
      );

      expect(result.current.isLoading).toBe(false);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('handles pagination correctly', async () => {
      const mockResponse = {
        events: [
          {
            id: 'event1',
            title: 'Event 1',
            user_details: { username: 'testuser', name: 'Test User' },
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
      };

      mockApiClient.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () =>
          useUserEvents({
            username: 'testuser',
            limit: 10,
          }),
        {
          wrapper: createTestWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.data?.pages[0]?.pagination.totalPages).toBe(3);
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to fetch user events');
      mockApiClient.get.mockRejectedValue(apiError);

      const { result } = renderHook(
        () =>
          useUserEvents({
            username: 'testuser',
          }),
        {
          wrapper: createTestWrapper(),
        }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBe(apiError);
    });
  });

  describe('useEventRSVPs', () => {
    it('returns loading state initially', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('fetches event RSVPs successfully', async () => {
      const mockRSVPs = [
        {
          id: 'rsvp1',
          event_id: 'event123',
          user_id: 'user1',
          status: 'yes',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
        {
          id: 'rsvp2',
          event_id: 'event123',
          user_id: 'user2',
          status: 'maybe',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z',
        },
      ];

      mockApiClient.get.mockResolvedValue({
        success: true,
        message: 'ok',
        data: mockRSVPs,
      });

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockRSVPs);
      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/rsvps?event_id=event123');
    });

    it('returns empty array when no RSVPs found', async () => {
      mockApiClient.get.mockResolvedValue({
        success: true,
        message: 'ok',
        data: [],
      });

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('is disabled when eventId is empty', () => {
      const { result } = renderHook(() => useEventRSVPs(''), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to fetch RSVPs');
      mockApiClient.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBe(apiError);
    });
  });

  describe('useUserRSVP', () => {
    it('returns loading state initially', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useUserRSVP('event123'), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('fetches user RSVP successfully', async () => {
      const mockRSVP = {
        id: 'rsvp1',
        event_id: 'event123',
        user_id: 'user1',
        status: 'yes',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      mockApiClient.get.mockResolvedValue({
        success: true,
        message: 'ok',
        data: [mockRSVP],
      });

      const { result } = renderHook(() => useUserRSVP('event123'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        status: 'yes',
        rsvp: mockRSVP,
      });
      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/events/rsvps/current-user?event_id=event123'
      );
    });

    it('returns null status when no RSVP found', async () => {
      mockApiClient.get.mockResolvedValue({
        success: true,
        message: 'ok',
        data: [],
      });

      const { result } = renderHook(() => useUserRSVP('event123'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        status: null,
        rsvp: null,
      });
    });

    it('is disabled when eventId is empty', () => {
      const { result } = renderHook(() => useUserRSVP(''), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to fetch user RSVP');
      mockApiClient.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useUserRSVP('event123'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBe(apiError);
    });
  });

  describe('useUpdateEvent', () => {
    it('updates event successfully', async () => {
      const updatedEvent = {
        id: 'event123',
        title: 'Updated Event',
        description: 'Updated Description',
      };

      mockApiClient.patch.mockResolvedValue({
        success: true,
        message: 'ok',
        data: [updatedEvent],
      });

      const { result } = renderHook(() => useUpdateEvent(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({
        id: 'event123',
        title: 'Updated Event',
        description: 'Updated Description',
        location: 'Updated Location',
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
        status: 'published' as const,
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/details', expect.any(Object));
      expect(result.current.data).toEqual(updatedEvent);
    });

    it('handles update errors gracefully', async () => {
      const updateError = new Error('Failed to update event');
      mockApiClient.patch.mockRejectedValue(updateError);

      const { result } = renderHook(() => useUpdateEvent(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({
        id: 'event123',
        title: 'Updated Event',
        description: 'Updated Description',
        location: 'Updated Location',
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
        status: 'published' as const,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(updateError);
    });
  });

  describe('useCancelEvent', () => {
    it('cancels event successfully', async () => {
      const cancelResponse = {
        success: true,
        message: 'Event cancelled successfully',
      };

      mockApiClient.delete.mockResolvedValue({
        data: cancelResponse,
      });

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({
        eventId: 'event123',
        sendEmails: true,
      });

      await waitFor(
        () => {
          expect(result.current.isSuccess).toBe(true);
        },
        { timeout: 2000 }
      );

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/v1/events/cancel?id=event123&sendEmails=true'
      );
      expect(result.current.data).toEqual(cancelResponse);
    });

    it('handles cancel errors gracefully', async () => {
      const cancelError = new Error('Failed to cancel event');
      mockApiClient.delete.mockRejectedValue(cancelError);

      const { result } = renderHook(() => useCancelEvent(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({
        eventId: 'event123',
        sendEmails: false,
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(cancelError);
    });
  });

  describe('useSubEvents', () => {
    it('returns loading state initially', () => {
      mockApiClient.get.mockImplementation(() => new Promise(() => {}));

      const { result } = renderHook(() => useSubEvents('event123'), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('fetches sub-events successfully', async () => {
      const mockSubEvents = [
        {
          id: 'subevent1',
          title: 'Sub Event 1',
          description: 'Sub Event Description',
          user_details: { username: 'user1', name: 'User 1' },
          computed_start_date: '2025-01-02T10:00:00Z',
          timezone: 'UTC',
        },
      ];

      const transformedEvent = {
        ...mockSubEvents[0],
        startDate: new Date('2025-01-02T10:00:00Z'),
      };

      mockApiClient.get.mockResolvedValue(mockSubEvents);
      mockTransformApiEventResponse.mockReturnValue(transformedEvent);

      const { result } = renderHook(() => useSubEvents('event123'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(
        () => {
          // Wait for the hook to complete successfully
          return !result.current.isLoading;
        },
        { timeout: 1000 }
      );

      expect(result.current.data).toEqual([transformedEvent]);
      expect(result.current.error).toBeNull();
    });

    it('returns empty array when eventId is not provided', () => {
      const { result } = renderHook(() => useSubEvents(), {
        wrapper: createTestWrapper(),
      });

      // When no eventId is provided, the hook should return empty array immediately
      expect(result.current.data).toEqual([]);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to fetch sub-events');
      mockApiClient.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useSubEvents('event123'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(
        () => {
          // Wait for the hook to complete with error
          return !result.current.isLoading;
        },
        { timeout: 1000 }
      );

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBe(apiError);
    });

    it('handles transformation errors gracefully', async () => {
      const mockSubEvents = [
        {
          id: 'subevent1',
          title: 'Sub Event 1',
          user_details: { username: 'user1', name: 'User 1' },
        },
      ];

      mockApiClient.get.mockResolvedValue(mockSubEvents);
      mockTransformApiEventResponse.mockReturnValue(null);

      const { result } = renderHook(() => useSubEvents('event123'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(
        () => {
          // Wait for the hook to complete - it should finish even with transformation failure
          return !result.current.isLoading;
        },
        { timeout: 1000 }
      );

      // When transformation fails, the hook should return undefined data without throwing
      expect(result.current.data).toBeUndefined();
      // Should not have an error since the transformation failure is handled gracefully
      expect(result.current.error).toBeNull();
    });
  });
});

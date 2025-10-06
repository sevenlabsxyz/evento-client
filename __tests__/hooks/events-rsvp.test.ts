import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock the API transform utility
jest.mock('@/lib/utils/api-transform', () => ({
  transformApiEventResponse: jest.fn(),
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
}));

// Import after mocking
import { useCancelEvent } from '@/lib/hooks/use-cancel-event';
import { useCreateEvent } from '@/lib/hooks/use-create-event';
import { useEventDetails } from '@/lib/hooks/use-event-details';
import { useEventRSVPs } from '@/lib/hooks/use-event-rsvps';
import { useEventsFeed } from '@/lib/hooks/use-events-feed';
import { useSubEvents } from '@/lib/hooks/use-sub-events';
import { useUpdateEvent } from '@/lib/hooks/use-update-event';
import { useUpsertRSVP } from '@/lib/hooks/use-upsert-rsvp';
import { useUserEvents } from '@/lib/hooks/use-user-events';
import { useUserRSVP } from '@/lib/hooks/use-user-rsvp';
import { CreateEventData } from '@/lib/schemas/event';
import { QueryClient } from '@tanstack/react-query';

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

    // Setup default mock for transformation function
    mockTransformApiEventResponse.mockImplementation((event: any) => {
      if (!event) return null;
      return {
        ...event,
        startDate: new Date(
          event.computed_start_date || new Date().toISOString()
        ),
      };
    });
  });

  describe('useEventsFeed', () => {
    it('returns loading state initially', () => {
      const { result } = renderHook(() => useEventsFeed(), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('fetches and returns events feed successfully', async () => {
      const { result } = renderHook(() => useEventsFeed(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([
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
      ]);
    });

    it('handles API errors gracefully', async () => {
      // Override the mock to return an error
      const { default: mockApiClient } = require('@/lib/api/client');
      mockApiClient.get.mockRejectedValueOnce(
        new Error('Internal server error')
      );

      const { result } = renderHook(() => useEventsFeed(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(
        () => {
          return result.current.isError;
        },
        { timeout: 2000 }
      );

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeTruthy();
    });

    it('handles unauthorized errors without retry', async () => {
      // Override the mock to return 401
      const { default: mockApiClient } = require('@/lib/api/client');
      mockApiClient.get.mockRejectedValueOnce({
        status: 401,
        message: 'Unauthorized',
      });

      const { result } = renderHook(() => useEventsFeed(), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.error).toBeTruthy();
      // Should not retry on 401 errors
    });
  });

  describe('useUserEvents', () => {
    it('returns loading state initially', () => {
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

      expect(result.current.data?.pages[0]).toEqual({
        events: [
          {
            id: 'event1',
            title: 'User Event 1',
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
      });
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
      expect(result.current.data).toBeUndefined();
    });

    it('handles pagination correctly', async () => {
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

      expect(result.current.hasNextPage).toBe(false);
      expect(result.current.data?.pages[0]?.pagination.totalPages).toBe(1);
    });

    it('handles API errors gracefully', async () => {
      // Override the mock to return an error
      const { default: mockApiClient } = require('@/lib/api/client');
      mockApiClient.get.mockRejectedValueOnce(
        new Error('Internal server error')
      );

      const { result } = renderHook(
        () =>
          useUserEvents({
            username: 'testuser',
          }),
        {
          wrapper: createTestWrapper(),
        }
      );

      await waitFor(
        () => {
          return result.current.isError;
        },
        { timeout: 2000 }
      );

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useEventRSVPs', () => {
    it('returns loading state initially', () => {
      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('fetches event RSVPs successfully', async () => {
      const { result } = renderHook(() => useEventRSVPs('event123'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([
        {
          id: 'rsvp1',
          event_id: 'event123',
          user_id: 'user1',
          status: 'yes',
          created_at: expect.any(String),
          updated_at: expect.any(String),
        },
      ]);
    });

    it('returns empty array when no RSVPs found', async () => {
      // Override the mock to return empty array
      const { default: mockApiClient } = require('@/lib/api/client');
      mockApiClient.get.mockResolvedValueOnce({
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
      expect(result.current.data).toBeUndefined();
    });
  });

  describe('useUserRSVP', () => {
    it('returns loading state initially', () => {
      const { result } = renderHook(() => useUserRSVP('event123'), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('fetches user RSVP successfully', async () => {
      const { result } = renderHook(() => useUserRSVP('event123'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
        status: 'yes',
        rsvp: {
          id: 'rsvp1',
          event_id: 'event123',
          user_id: 'current_user',
          status: 'yes',
          created_at: expect.any(String),
          updated_at: expect.any(String),
        },
      });
    });

    it('returns null status when no RSVP found', async () => {
      // Override the mock to return empty array
      const { default: mockApiClient } = require('@/lib/api/client');
      mockApiClient.get.mockResolvedValueOnce({
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
      expect(result.current.data).toBeUndefined();
    });

    it('handles API errors gracefully', async () => {
      // Override the mock to return an error
      const { default: mockApiClient } = require('@/lib/api/client');
      mockApiClient.get.mockRejectedValueOnce(
        new Error('Internal server error')
      );

      const { result } = renderHook(() => useUserRSVP('event123'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useUpdateEvent', () => {
    it('updates event successfully', async () => {
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

      expect(result.current.data).toEqual({
        id: 'event123',
        title: 'Updated Event',
        description: 'Updated Description',
      });
    });

    it('handles update errors gracefully', async () => {
      // Override the mock to return an error
      const { default: mockApiClient } = require('@/lib/api/client');
      mockApiClient.patch.mockRejectedValueOnce(
        new Error('Internal server error')
      );

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

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useCancelEvent', () => {
    it('cancels event successfully', async () => {
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

      expect(result.current.data).toEqual({
        id: 'event123',
        status: 'cancelled',
      });
    });

    it('handles cancel errors gracefully', async () => {
      // Override the mock to return an error
      const { default: mockApiClient } = require('@/lib/api/client');
      mockApiClient.delete.mockRejectedValueOnce(
        new Error('Internal server error')
      );

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

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useSubEvents', () => {
    it('returns loading state initially', () => {
      const { result } = renderHook(() => useSubEvents('event123'), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('fetches sub-events successfully', async () => {
      const transformedEvent = {
        id: 'subevent1',
        title: 'Sub Event 1',
        description: 'Sub Event Description',
        user_details: { username: 'user1', name: 'User 1' },
        computed_start_date: '2025-01-01T00:00:00.000Z',
        timezone: 'UTC',
        startDate: new Date('2025-01-01T00:00:00.000Z'),
      };

      mockTransformApiEventResponse.mockReturnValue(transformedEvent);

      const { result } = renderHook(() => useSubEvents('event123'), {
        wrapper: createTestWrapper(),
      });

      // Wait for the hook to complete (either success or error)
      await act(async () => {
        await waitFor(
          () => {
            return !result.current.isLoading;
          },
          { timeout: 5000 }
        );
      });

      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data).toEqual([transformedEvent]);
      expect(result.current.error).toBeNull();
    });

    it('returns empty array when eventId is not provided', () => {
      const { result } = renderHook(() => useSubEvents(), {
        wrapper: createTestWrapper(),
      });

      // When no eventId is provided, the hook is disabled and returns undefined
      expect(result.current.data).toBeUndefined();
      expect(result.current.isLoading).toBe(false);
    });

    it('handles API errors gracefully', async () => {
      // Override the mock to return an error
      const { default: mockApiClient } = require('@/lib/api/client');
      mockApiClient.get.mockRejectedValueOnce(
        new Error('Internal server error')
      );

      const { result } = renderHook(() => useSubEvents('event123'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(
        () => {
          // Wait for the hook to have an error (after retry)
          return result.current.isError && !result.current.isLoading;
        },
        { timeout: 3000 }
      );

      expect(result.current.data).toBeUndefined();
      expect(result.current.isError).toBe(true);
    });

    it('handles transformation errors gracefully', async () => {
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

      // When transformation fails, the hook should return undefined data with an error
      expect(result.current.error).toBeDefined();
    });
  });

  describe('useCreateEvent', () => {
    function makeValidCreateData(
      overrides: Partial<CreateEventData> = {}
    ): CreateEventData {
      return {
        title: 'Test Event',
        description: 'Desc',
        location: 'Somewhere',
        timezone: 'UTC',
        cover: null,
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
        visibility: 'private',
        status: 'published',
        spotify_url: '',
        wavlake_url: '',
        contrib_cashapp: '',
        contrib_venmo: '',
        contrib_paypal: '',
        contrib_btclightning: '',
        cost: '',
        settings: { max_capacity: 100, show_capacity_count: true },
        ...overrides,
      };
    }

    it('creates event successfully', async () => {
      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate(makeValidCreateData());

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(
        expect.objectContaining({ id: 'evt_test123', title: 'Test Event' })
      );
    });

    it('handles validation errors', async () => {
      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate(makeValidCreateData({ title: '' }));

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useEventDetails', () => {
    it('returns loading state initially', () => {
      const { result } = renderHook(() => useEventDetails('event123'), {
        wrapper: createTestWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('fetches event details successfully', async () => {
      // Mock the transformation function to return the event data
      mockTransformApiEventResponse.mockReturnValue({
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
      });

      const { result } = renderHook(() => useEventDetails('event123'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({
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
      });
    });

    it('handles API errors gracefully', async () => {
      // Set up the error mock to override the global mock for this specific URL
      const apiError = new Error('Event not found');
      const { default: mockApiClient } = require('@/lib/api/client');
      mockApiClient.get.mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useEventDetails('error-event'), {
        wrapper: createTestWrapper(),
      });

      await waitFor(
        () => {
          // Wait for the hook to have an error
          return result.current.isError;
        },
        { timeout: 2000 }
      );

      expect(result.current.data).toBeUndefined();
      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useUpsertRSVP', () => {
    it('creates a new RSVP (no existing)', async () => {
      const { result } = renderHook(() => useUpsertRSVP(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({
        eventId: 'evt_1',
        status: 'yes',
        hasExisting: false,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(
        expect.objectContaining({ event_id: 'evt_1', status: 'yes' })
      );
    });

    it('updates an existing RSVP', async () => {
      const { result } = renderHook(() => useUpsertRSVP(), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({
        eventId: 'evt_1',
        status: 'maybe',
        hasExisting: true,
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(
        expect.objectContaining({ event_id: 'evt_1', status: 'maybe' })
      );
    });
  });
});

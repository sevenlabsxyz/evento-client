import { usePublicUserEvents } from '@/lib/hooks/use-public-user-events';
import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

describe('usePublicUserEvents', () => {
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
    jest.clearAllMocks();
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should fetch public user events from users events endpoint', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockResponse = {
      data: {
        events: [
          {
            id: 'event1',
            title: 'Test Event',
            description: 'A public event',
            location: 'Test location',
            timezone: 'UTC',
            status: 'published',
            visibility: 'public',
            cost: null,
            creator_user_id: 'user1',
            hosts: [],
            start_date_day: 1,
            start_date_month: 1,
            start_date_year: 2026,
            start_date_hours: 12,
            start_date_minutes: 0,
            end_date_day: 1,
            end_date_month: 1,
            end_date_year: 2026,
            end_date_hours: 13,
            end_date_minutes: 0,
            computed_start_date: '2026-01-01T12:00:00.000Z',
            computed_end_date: '2026-01-01T13:00:00.000Z',
            spotify_url: '',
            wavlake_url: '',
            contrib_cashapp: '',
            contrib_venmo: '',
            contrib_paypal: '',
            contrib_btclightning: '',
            created_at: '2026-01-01T00:00:00.000Z',
            updated_at: '2026-01-01T00:00:00.000Z',
            user_details: {
              id: 'user1',
              username: 'testuser',
              name: 'Test User',
              bio: '',
              image: 'https://example.com/avatar.jpg',
              verification_status: 'verified',
            },
          },
        ],
      },
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => usePublicUserEvents({ username: 'TestUser' }), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/users/testuser/events');
    expect(result.current.data).toEqual(mockResponse.data.events);
  });

  it('should support legacy responses that return the array directly', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockResponse = {
      data: [
        {
          id: 'event1',
          title: 'Legacy Event',
          description: 'A direct response event',
          location: 'Legacy location',
          timezone: 'UTC',
          status: 'published',
          visibility: 'public',
          cost: null,
          creator_user_id: 'user1',
          hosts: [],
          start_date_day: 1,
          start_date_month: 1,
          start_date_year: 2026,
          start_date_hours: 12,
          start_date_minutes: 0,
          end_date_day: 1,
          end_date_month: 1,
          end_date_year: 2026,
          end_date_hours: 13,
          end_date_minutes: 0,
          computed_start_date: '2026-01-01T12:00:00.000Z',
          computed_end_date: '2026-01-01T13:00:00.000Z',
          spotify_url: '',
          wavlake_url: '',
          contrib_cashapp: '',
          contrib_venmo: '',
          contrib_paypal: '',
          contrib_btclightning: '',
          created_at: '2026-01-01T00:00:00.000Z',
          updated_at: '2026-01-01T00:00:00.000Z',
          user_details: {
            id: 'user1',
            username: 'testuser',
            name: 'Test User',
            bio: '',
            image: 'https://example.com/avatar.jpg',
            verification_status: 'verified',
          },
        },
      ],
    };

    mockApiClient.get.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => usePublicUserEvents({ username: 'TestUser' }), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockResponse.data);
  });

  it('should not fetch when enabled is false', () => {
    const mockApiClient = require('@/lib/api/client').default;

    const { result } = renderHook(
      () => usePublicUserEvents({ username: 'TestUser', enabled: false }),
      {
        wrapper,
      }
    );

    expect(result.current.isLoading).toBe(false);
    expect(result.current.data).toBeUndefined();
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });
});

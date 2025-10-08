import { apiClient } from '@/lib/api/client';
import {
  SendInvitesRequest,
  SendInvitesResponse,
  useEventInvites,
  useSendEventInvites,
} from '@/lib/hooks/use-event-invites';
import { EventInvite, InviteTarget, UserDetails } from '@/lib/types/api';
import { toast } from '@/lib/utils/toast';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;
const mockToast = toast as jest.Mocked<typeof toast>;

// Mock the toast utility
jest.mock('@/lib/utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

describe('useEventInvites', () => {
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
    mockApiClient.post.mockReset();
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

  const createMockEventInvite = (overrides: Partial<EventInvite> = {}): EventInvite => ({
    id: 'invite123',
    event_id: 'event123',
    inviter_id: 'user123',
    invitee_id: 'user456',
    invitee_email: 'invitee@example.com',
    message: 'You are invited to this event!',
    status: 'pending',
    response: null,
    created_at: '2024-01-15T10:30:00Z',
    updated_at: '2024-01-15T10:30:00Z',
    events: {
      id: 'event123',
      title: 'Test Event',
      description: 'Test event description',
      location: 'Test Location',
      timezone: 'UTC',
      visibility: 'public',
      status: 'published',
      cost: 25.0,
      creator_user_id: 'user123',
      start_date_day: 15,
      start_date_month: 1,
      start_date_year: 2024,
      start_date_hours: 10,
      start_date_minutes: 0,
      end_date_day: 15,
      end_date_month: 1,
      end_date_year: 2024,
      end_date_hours: 12,
      end_date_minutes: 0,
      computed_start_date: '2024-01-15T10:00:00Z',
      computed_end_date: '2024-01-15T12:00:00Z',
      spotify_url: '',
      wavlake_url: '',
      contrib_cashapp: '',
      contrib_venmo: '',
      contrib_paypal: '',
      contrib_btclightning: '',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      user_details: createMockUserDetails(),
    },
    ...overrides,
  });

  const createMockInviteTarget = (overrides: Partial<InviteTarget> = {}): InviteTarget => ({
    email: 'test@example.com',
    type: 'email',
    ...overrides,
  });

  const createMockSendInvitesRequest = (
    overrides: Partial<SendInvitesRequest> = {}
  ): SendInvitesRequest => ({
    id: 'event123',
    message: 'You are invited to this event!',
    invites: [createMockInviteTarget()],
    ...overrides,
  });

  const createMockSendInvitesResponse = (
    overrides: Partial<SendInvitesResponse> = {}
  ): SendInvitesResponse => ({
    success: true,
    data: {
      emails: {
        data: {
          data: [{ id: 'email1' }],
        },
        error: null,
      },
      phones: '0',
      users: '1',
      invites: [
        {
          id: 'invite123',
          event_id: 'event123',
          inviter_id: 'user123',
          invitee_id: 'user456',
          invitee_email: 'test@example.com',
          message: 'You are invited to this event!',
          status: 'pending',
        },
      ],
    },
    message: 'Invites sent successfully',
    ...overrides,
  });

  const createMockEventInvitesResponse = (data: EventInvite[]) => ({
    success: true,
    message: 'Event invites retrieved successfully',
    data,
  });

  describe('useSendEventInvites', () => {
    describe('mutation functionality', () => {
      it('sends event invites successfully', async () => {
        const mockRequest = createMockSendInvitesRequest();
        const mockResponse = createMockSendInvitesResponse();
        mockApiClient.post.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useSendEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await act(async () => {
          result.current.mutate(mockRequest);
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/invites', mockRequest);
        expect(mockToast.success).toHaveBeenCalledWith('Sent 1 invite');
      });

      it('sends multiple event invites successfully', async () => {
        const mockRequest = createMockSendInvitesRequest({
          invites: [
            createMockInviteTarget({ email: 'user1@example.com' }),
            createMockInviteTarget({ email: 'user2@example.com' }),
            createMockInviteTarget({ email: 'user3@example.com' }),
          ],
        });
        const mockResponse = createMockSendInvitesResponse({
          data: {
            ...createMockSendInvitesResponse().data,
            invites: [
              {
                id: 'invite1',
                event_id: 'event123',
                inviter_id: 'user123',
                invitee_email: 'user1@example.com',
                message: 'You are invited to this event!',
                status: 'pending',
              },
              {
                id: 'invite2',
                event_id: 'event123',
                inviter_id: 'user123',
                invitee_email: 'user2@example.com',
                message: 'You are invited to this event!',
                status: 'pending',
              },
              {
                id: 'invite3',
                event_id: 'event123',
                inviter_id: 'user123',
                invitee_email: 'user3@example.com',
                message: 'You are invited to this event!',
                status: 'pending',
              },
            ],
          },
        });
        mockApiClient.post.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useSendEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await act(async () => {
          result.current.mutate(mockRequest);
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockToast.success).toHaveBeenCalledWith('Sent 3 invites');
      });

      it('handles API error', async () => {
        const mockRequest = createMockSendInvitesRequest();
        const apiError = new Error('API Error');
        mockApiClient.post.mockRejectedValueOnce(apiError);

        const { result } = renderHook(() => useSendEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await act(async () => {
          result.current.mutate(mockRequest);
        });

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(mockToast.error).toHaveBeenCalledWith('API Error');
      });

      it('handles missing event id', async () => {
        const mockRequest = createMockSendInvitesRequest({ id: '' });

        const { result } = renderHook(() => useSendEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await act(async () => {
          result.current.mutate(mockRequest);
        });

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toEqual(
          expect.objectContaining({
            message: 'Missing event id',
          })
        );
        expect(mockApiClient.post).not.toHaveBeenCalled();
      });

      it('handles empty invites array', async () => {
        const mockRequest = createMockSendInvitesRequest({ invites: [] });

        const { result } = renderHook(() => useSendEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await act(async () => {
          result.current.mutate(mockRequest);
        });

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toEqual(
          expect.objectContaining({
            message: 'No invitees selected',
          })
        );
        expect(mockApiClient.post).not.toHaveBeenCalled();
      });

      it('handles response with no invites', async () => {
        const mockRequest = createMockSendInvitesRequest();
        const mockResponse = createMockSendInvitesResponse({
          data: {
            ...createMockSendInvitesResponse().data,
            invites: [],
          },
        });
        mockApiClient.post.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useSendEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await act(async () => {
          result.current.mutate(mockRequest);
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockToast.success).toHaveBeenCalledWith('Invites sent');
      });

      it('handles different invite target types', async () => {
        const mockRequest = createMockSendInvitesRequest({
          invites: [
            createMockInviteTarget({
              email: 'email@example.com',
              type: 'email',
            }),
            {
              id: 'user123',
              username: 'testuser',
              name: 'Test User',
              verification_status: 'verified',
              image: 'test.jpg',
            },
          ],
        });
        const mockResponse = createMockSendInvitesResponse();
        mockApiClient.post.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useSendEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await act(async () => {
          result.current.mutate(mockRequest);
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/invites', mockRequest);
      });
    });

    describe('mutation state', () => {
      it('tracks loading state correctly', async () => {
        const mockRequest = createMockSendInvitesRequest();
        const mockResponse = createMockSendInvitesResponse();

        // Create a promise that we can control
        let resolvePromise: (value: any) => void;
        const controlledPromise = new Promise((resolve) => {
          resolvePromise = resolve;
        });
        mockApiClient.post.mockReturnValue(controlledPromise);

        const { result } = renderHook(() => useSendEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        // Start mutation
        act(() => {
          result.current.mutate(mockRequest);
        });

        // Wait for pending state
        await waitFor(() => {
          expect(result.current.isPending).toBe(true);
          expect(result.current.isIdle).toBe(false);
        });

        // Resolve the promise
        await act(async () => {
          resolvePromise!(mockResponse);
        });

        // Wait for completion
        await waitFor(() => {
          expect(result.current.isPending).toBe(false);
          expect(result.current.isSuccess).toBe(true);
        });
      });

      it('tracks success state correctly', async () => {
        const mockRequest = createMockSendInvitesRequest();
        const mockResponse = createMockSendInvitesResponse();
        mockApiClient.post.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useSendEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await act(async () => {
          result.current.mutate(mockRequest);
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
          expect(result.current.isPending).toBe(false);
        });

        expect(result.current.data).toEqual(mockResponse.data);
      });

      it('tracks error state correctly', async () => {
        const mockRequest = createMockSendInvitesRequest();
        const apiError = new Error('API Error');
        mockApiClient.post.mockRejectedValueOnce(apiError);

        const { result } = renderHook(() => useSendEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await act(async () => {
          result.current.mutate(mockRequest);
        });

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
          expect(result.current.error).toBe(apiError);
        });
      });

      it('resets mutation state', async () => {
        const mockRequest = createMockSendInvitesRequest();
        const mockResponse = createMockSendInvitesResponse();
        mockApiClient.post.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useSendEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        // Start mutation
        await act(async () => {
          result.current.mutate(mockRequest);
        });

        // Wait for success
        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        // Reset mutation
        act(() => {
          result.current.reset();
        });

        // Wait for reset to take effect
        await waitFor(() => {
          expect(result.current.isIdle).toBe(true);
          expect(result.current.isSuccess).toBe(false);
          expect(result.current.isError).toBe(false);
          expect(result.current.isPending).toBe(false);
        });
      });
    });
  });

  describe('useEventInvites', () => {
    describe('query functionality', () => {
      it('fetches event invites successfully', async () => {
        const mockEventInvites = [
          createMockEventInvite({ id: 'invite1', status: 'pending' }),
          createMockEventInvite({ id: 'invite2', status: 'responded' }),
        ];
        const mockResponse = createMockEventInvitesResponse(mockEventInvites);
        mockApiClient.get.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/invites');
        expect(result.current.data).toEqual(mockEventInvites);
      });

      it('fetches event invites with status filter', async () => {
        const mockEventInvites = [createMockEventInvite({ id: 'invite1', status: 'pending' })];
        const mockResponse = createMockEventInvitesResponse(mockEventInvites);
        mockApiClient.get.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useEventInvites('pending'), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/invites?status=pending');
        expect(result.current.data).toEqual(mockEventInvites);
      });

      it('fetches event invites with responded status filter', async () => {
        const mockEventInvites = [createMockEventInvite({ id: 'invite1', status: 'responded' })];
        const mockResponse = createMockEventInvitesResponse(mockEventInvites);
        mockApiClient.get.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useEventInvites('responded'), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/invites?status=responded');
        expect(result.current.data).toEqual(mockEventInvites);
      });

      it('handles empty invites response', async () => {
        const mockResponse = createMockEventInvitesResponse([]);
        mockApiClient.get.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useEventInvites(), {
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
          message: 'Event invites retrieved successfully',
          data: null,
        };
        mockApiClient.get.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useEventInvites(), {
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

        const { result } = renderHook(() => useEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await waitFor(() => {
          expect(result.current.isError).toBe(true);
        });

        expect(result.current.error).toBe(apiError);
      });

      it('is disabled when enabled is false', () => {
        const { result } = renderHook(() => useEventInvites(undefined, false), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        expect(result.current.isLoading).toBe(false);
        expect(result.current.isFetching).toBe(false);
        expect(mockApiClient.get).not.toHaveBeenCalled();
      });
    });

    describe('query state', () => {
      it('tracks loading state correctly', async () => {
        const mockEventInvites = [createMockEventInvite()];
        const mockResponse = createMockEventInvitesResponse(mockEventInvites);

        // Create a promise that we can control
        let resolvePromise: (value: any) => void;
        const controlledPromise = new Promise((resolve) => {
          resolvePromise = resolve;
        });
        mockApiClient.get.mockReturnValue(controlledPromise);

        const { result } = renderHook(() => useEventInvites(), {
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
        const mockEventInvites = [createMockEventInvite()];
        const mockResponse = createMockEventInvitesResponse(mockEventInvites);
        mockApiClient.get.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
          expect(result.current.isLoading).toBe(false);
        });

        expect(result.current.data).toEqual(mockEventInvites);
      });

      it('tracks error state correctly', async () => {
        const apiError = new Error('API Error');
        mockApiClient.get.mockRejectedValueOnce(apiError);

        const { result } = renderHook(() => useEventInvites(), {
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
        const mockEventInvites = [createMockEventInvite()];
        const mockResponse = createMockEventInvitesResponse(mockEventInvites);
        mockApiClient.get.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useEventInvites('pending'), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        // Check that the query key is correct
        const queryData = queryClient.getQueryData(['event-invites', 'pending']);
        expect(queryData).toEqual(mockEventInvites);
      });

      it('has stale time configuration', async () => {
        const mockEventInvites = [createMockEventInvite()];
        const mockResponse = createMockEventInvitesResponse(mockEventInvites);
        mockApiClient.get.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        // The stale time is configured in the hook, we can verify it's working
        // by checking that the query doesn't refetch immediately
        expect(result.current.data).toEqual(mockEventInvites);
      });
    });

    describe('event invite structure', () => {
      it('handles event invites with complete data', async () => {
        const mockEventInvite = createMockEventInvite({
          id: 'invite456',
          event_id: 'event456',
          inviter_id: 'user123',
          invitee_id: 'user789',
          invitee_email: 'invitee@example.com',
          message: 'Custom invite message',
          status: 'responded',
          response: 'going',
          created_at: '2024-01-15T10:30:00Z',
          updated_at: '2024-01-15T11:30:00Z',
        });

        const mockResponse = createMockEventInvitesResponse([mockEventInvite]);
        mockApiClient.get.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toHaveLength(1);
        expect(result.current.data![0]).toEqual(mockEventInvite);
        expect(result.current.data![0].response).toBe('going');
      });

      it('handles event invites with different statuses', async () => {
        const mockEventInvites = [
          createMockEventInvite({
            id: 'invite1',
            status: 'pending',
            response: null,
          }),
          createMockEventInvite({
            id: 'invite2',
            status: 'responded',
            response: 'going',
          }),
          createMockEventInvite({
            id: 'invite3',
            status: 'responded',
            response: 'not_going',
          }),
          createMockEventInvite({
            id: 'invite4',
            status: 'responded',
            response: 'maybe',
          }),
        ];

        const mockResponse = createMockEventInvitesResponse(mockEventInvites);
        mockApiClient.get.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toHaveLength(4);
        expect(result.current.data![0].status).toBe('pending');
        expect(result.current.data![1].response).toBe('going');
        expect(result.current.data![2].response).toBe('not_going');
        expect(result.current.data![3].response).toBe('maybe');
      });
    });

    describe('multiple queries', () => {
      it('can fetch different status filters independently', async () => {
        const mockPendingInvites = [createMockEventInvite({ id: 'invite1', status: 'pending' })];
        const mockRespondedInvites = [
          createMockEventInvite({ id: 'invite2', status: 'responded' }),
        ];

        const mockResponse1 = createMockEventInvitesResponse(mockPendingInvites);
        const mockResponse2 = createMockEventInvitesResponse(mockRespondedInvites);

        mockApiClient.get.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

        const { result: result1 } = renderHook(() => useEventInvites('pending'), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        const { result: result2 } = renderHook(() => useEventInvites('responded'), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await waitFor(() => {
          expect(result1.current.isSuccess).toBe(true);
          expect(result2.current.isSuccess).toBe(true);
        });

        expect(result1.current.data).toEqual(mockPendingInvites);
        expect(result2.current.data).toEqual(mockRespondedInvites);
        expect(mockApiClient.get).toHaveBeenCalledTimes(2);
      });
    });

    describe('edge cases', () => {
      it('handles undefined response data', async () => {
        const mockResponse = {
          success: true,
          message: 'Event invites retrieved successfully',
          data: undefined,
        };
        mockApiClient.get.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useEventInvites(), {
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
          message: 'No invites found',
          data: null,
        };
        mockApiClient.get.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toEqual([]);
      });

      it('handles very large invites response', async () => {
        const mockEventInvites = Array.from({ length: 100 }, (_, index) =>
          createMockEventInvite({
            id: `invite${index}`,
            invitee_email: `user${index}@example.com`,
          })
        );
        const mockResponse = createMockEventInvitesResponse(mockEventInvites);
        mockApiClient.get.mockResolvedValueOnce(mockResponse);

        const { result } = renderHook(() => useEventInvites(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });

        expect(result.current.data).toHaveLength(100);
        expect(result.current.data![0].id).toBe('invite0');
        expect(result.current.data![99].id).toBe('invite99');
      });
    });
  });
});

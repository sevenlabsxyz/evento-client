import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock the API client
jest.mock('@/lib/api/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    put: jest.fn(),
  },
  apiClient: {
    get: jest.fn(),
    put: jest.fn(),
  },
}));

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

// Mock the auth hook
jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

// Mock the auth utilities
jest.mock('@/lib/utils/auth', () => ({
  isUserOnboarded: jest.fn((user) => user?.onboarding_completed || false),
  validateRedirectUrl: jest.fn((url) => url || '/'),
  getOnboardingRedirectUrl: jest.fn(
    (pathname) => `/onboarding?redirect=${pathname}`
  ),
}));

// Mock date-fns
jest.mock('date-fns', () => ({
  formatDistanceToNowStrict: jest.fn(() => '2 hours ago'),
}));

import { default as mockApiClient } from '@/lib/api/client';
import {
  formatNotificationForUI,
  useArchiveNotification,
  useBulkMarkAsRead,
  useBulkMarkAsSeen,
  useMarkAllAsRead,
  useMarkAllAsSeen,
  useMarkAsRead,
  useMarkAsSeen,
  useNotification,
  useNotificationsFeed,
  useUnreadCount,
} from '@/lib/hooks/use-notifications';
import { useOnboardingGuard } from '@/lib/hooks/use-onboarding-guard';
import { useRequireOnboarding } from '@/lib/hooks/use-require-onboarding';

// Type the mock API client
const mockApiClientTyped = mockApiClient as any;

describe('Notification and Onboarding Hooks', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();

    // Setup default mock implementations
    const { useAuth } = require('@/lib/hooks/use-auth');
    useAuth.mockReturnValue({
      user: {
        id: 'user123',
        username: 'testuser',
        onboarding_completed: true,
      },
      isLoading: false,
      isAuthenticated: true,
    });
  });

  describe('formatNotificationForUI', () => {
    const mockNotificationMessage = {
      id: 'notif1',
      created_at: '2025-01-01T00:00:00Z',
      updated_at: '2025-01-01T00:00:00Z',
      status: 'unread',
      workflow_key: 'event_rsvp',
      tenant: 'default',
      recipient: 'user123',
      actor: {
        id: 'user1',
        object: 'user',
      },
      data: { event_id: 'event123' },
      trigger_data: { event_id: 'event123' },
      activities: [],
      blocks: [
        {
          rendered_content: {
            subject: 'New RSVP',
            plain_text: 'User has RSVPed to your event',
            body: 'User has RSVPed to your event',
          },
        },
      ],
    };

    it('formats notification message correctly', () => {
      const result = formatNotificationForUI(mockNotificationMessage);

      expect(result).toEqual({
        id: 'notif1',
        title: 'New RSVP',
        content: 'User has RSVPed to your event',
        timestamp: '2 hours ago',
        actor: {
          id: 'user1',
          type: 'user',
        },
        category: 'event_rsvp',
        status: 'unread',
        data: { event_id: 'event123' },
        original: mockNotificationMessage,
      });
    });

    it('handles notification without actor', () => {
      const notificationWithoutActor = {
        ...mockNotificationMessage,
        actor: null,
      };

      const result = formatNotificationForUI(notificationWithoutActor);

      expect(result.actor).toBeUndefined();
    });

    it('handles notification without blocks', () => {
      const notificationWithoutBlocks = {
        ...mockNotificationMessage,
        blocks: [],
      };

      const result = formatNotificationForUI(notificationWithoutBlocks);

      expect(result.title).toBe('New Notification');
      expect(result.content).toBe('');
    });

    it('handles notification with empty rendered content', () => {
      const notificationWithEmptyContent = {
        ...mockNotificationMessage,
        blocks: [
          {
            rendered_content: null,
          },
        ],
      };

      const result = formatNotificationForUI(notificationWithEmptyContent);

      expect(result.title).toBe('New Notification');
      expect(result.content).toBe('');
    });
  });

  describe('useNotificationsFeed', () => {
    const mockFeedResponse = {
      data: {
        entries: [
          {
            id: 'notif1',
            created_at: '2025-01-01T00:00:00Z',
            status: 'unread',
            workflow_key: 'event_rsvp',
            actor: {
              id: 'user1',
              object: 'user',
            },
            data: { event_id: 'event123' },
            blocks: [
              {
                rendered_content: {
                  subject: 'New RSVP',
                  plain_text: 'User has RSVPed to your event',
                },
              },
            ],
          },
        ],
        page_info: {
          after: 'cursor123',
          before: null,
          page_size: 20,
        },
      },
    };

    it('fetches notifications feed successfully', async () => {
      mockApiClientTyped.get.mockResolvedValue(mockFeedResponse);

      const { result } = renderHook(() => useNotificationsFeed(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.pages[0].entries).toHaveLength(1);
      expect(result.current.data?.pages[0].entries[0].title).toBe('New RSVP');
      expect(mockApiClientTyped.get).toHaveBeenCalledWith(
        '/v1/notifications/feed?'
      );
    });

    it('handles filters correctly', async () => {
      mockApiClientTyped.get.mockResolvedValue(mockFeedResponse);

      const filters = {
        page_size: 10,
        archived: false,
        status: 'unread',
        tenant: 'test',
        source: 'email',
        trigger_data: { event_id: 'event123' },
      };

      const { result } = renderHook(() => useNotificationsFeed(filters), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiClientTyped.get).toHaveBeenCalledWith(
        '/v1/notifications/feed?page_size=10&archived=false&status=unread&tenant=test&source=email&trigger_data%5Bevent_id%5D=event123'
      );
    });

    it('handles pagination correctly', async () => {
      mockApiClientTyped.get.mockResolvedValue(mockFeedResponse);

      const { result } = renderHook(() => useNotificationsFeed(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.hasNextPage).toBe(true);
      expect(result.current.data?.pages[0].pageInfo.after).toBe('cursor123');
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to fetch notifications');
      mockApiClientTyped.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useNotificationsFeed(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });

    it('handles invalid response format', async () => {
      mockApiClientTyped.get.mockResolvedValue({ data: null });

      const { result } = renderHook(() => useNotificationsFeed(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useNotification', () => {
    const mockNotification = {
      data: {
        id: 'notif1',
        created_at: '2025-01-01T00:00:00Z',
        status: 'unread',
        workflow_key: 'event_rsvp',
        actor: {
          id: 'user1',
          object: 'user',
        },
        data: { event_id: 'event123' },
        blocks: [
          {
            rendered_content: {
              subject: 'New RSVP',
              plain_text: 'User has RSVPed to your event',
            },
          },
        ],
      },
    };

    it('fetches single notification successfully', async () => {
      mockApiClientTyped.get.mockResolvedValue(mockNotification);

      const { result } = renderHook(() => useNotification('notif1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data?.title).toBe('New RSVP');
      expect(mockApiClientTyped.get).toHaveBeenCalledWith(
        '/v1/notifications/messages/notif1'
      );
    });

    it('is disabled when messageId is empty', () => {
      const { result } = renderHook(() => useNotification(''), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockApiClientTyped.get).not.toHaveBeenCalled();
    });

    it('is disabled when enabled is false', () => {
      const { result } = renderHook(() => useNotification('notif1', false), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockApiClientTyped.get).not.toHaveBeenCalled();
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to fetch notification');
      mockApiClientTyped.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useNotification('notif1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });
  });

  describe('useMarkAsSeen', () => {
    it('marks notification as seen successfully', async () => {
      mockApiClientTyped.put.mockResolvedValue({
        data: { id: 'notif1', status: 'seen' },
      });

      const { result } = renderHook(() => useMarkAsSeen(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('notif1');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClientTyped.put).toHaveBeenCalledWith(
        '/v1/notifications/messages/notif1/seen'
      );
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to mark as seen');
      mockApiClientTyped.put.mockRejectedValue(apiError);

      const { result } = renderHook(() => useMarkAsSeen(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('notif1');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });

    it('handles missing data in response', async () => {
      mockApiClientTyped.put.mockResolvedValue({});

      const { result } = renderHook(() => useMarkAsSeen(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('notif1');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useMarkAsRead', () => {
    it('marks notification as read successfully', async () => {
      mockApiClientTyped.put.mockResolvedValue({
        data: { id: 'notif1', status: 'read' },
      });

      const { result } = renderHook(() => useMarkAsRead(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('notif1');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClientTyped.put).toHaveBeenCalledWith(
        '/v1/notifications/messages/notif1/read'
      );
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to mark as read');
      mockApiClientTyped.put.mockRejectedValue(apiError);

      const { result } = renderHook(() => useMarkAsRead(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('notif1');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });
  });

  describe('useArchiveNotification', () => {
    it('archives notification successfully', async () => {
      mockApiClientTyped.put.mockResolvedValue({
        data: { id: 'notif1', status: 'archived' },
      });

      const { result } = renderHook(() => useArchiveNotification(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('notif1');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClientTyped.put).toHaveBeenCalledWith(
        '/v1/notifications/messages/notif1/archived'
      );
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to archive notification');
      mockApiClientTyped.put.mockRejectedValue(apiError);

      const { result } = renderHook(() => useArchiveNotification(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('notif1');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });
  });

  describe('useBulkMarkAsSeen', () => {
    it('bulk marks notifications as seen successfully', async () => {
      mockApiClientTyped.put.mockResolvedValue({
        data: { success: true },
      });

      const { result } = renderHook(() => useBulkMarkAsSeen(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({ message_ids: ['notif1', 'notif2'] });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClientTyped.put).toHaveBeenCalledWith(
        '/v1/notifications/messages/bulk/seen',
        {
          message_ids: ['notif1', 'notif2'],
        }
      );
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to bulk mark as seen');
      mockApiClientTyped.put.mockRejectedValue(apiError);

      const { result } = renderHook(() => useBulkMarkAsSeen(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({ message_ids: ['notif1', 'notif2'] });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });

    it('handles unsuccessful response', async () => {
      mockApiClientTyped.put.mockResolvedValue({
        data: { success: false },
      });

      const { result } = renderHook(() => useBulkMarkAsSeen(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({ message_ids: ['notif1', 'notif2'] });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });
  });

  describe('useBulkMarkAsRead', () => {
    it('bulk marks notifications as read successfully', async () => {
      mockApiClientTyped.put.mockResolvedValue({
        data: { success: true },
      });

      const { result } = renderHook(() => useBulkMarkAsRead(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({ message_ids: ['notif1', 'notif2'] });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClientTyped.put).toHaveBeenCalledWith(
        '/v1/notifications/messages/bulk/read',
        {
          message_ids: ['notif1', 'notif2'],
        }
      );
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to bulk mark as read');
      mockApiClientTyped.put.mockRejectedValue(apiError);

      const { result } = renderHook(() => useBulkMarkAsRead(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({ message_ids: ['notif1', 'notif2'] });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });
  });

  describe('useMarkAllAsSeen', () => {
    it('marks all notifications as seen successfully', async () => {
      mockApiClientTyped.put.mockResolvedValue({
        data: { success: true },
      });

      const { result } = renderHook(() => useMarkAllAsSeen(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate();
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClientTyped.put).toHaveBeenCalledWith(
        '/v1/notifications/mark-all/seen',
        {}
      );
    });

    it('handles parameters correctly', async () => {
      mockApiClientTyped.put.mockResolvedValue({
        data: { success: true },
      });

      const { result } = renderHook(() => useMarkAllAsSeen(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({ tenant: 'test' });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClientTyped.put).toHaveBeenCalledWith(
        '/v1/notifications/mark-all/seen',
        { tenant: 'test' }
      );
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to mark all as seen');
      mockApiClientTyped.put.mockRejectedValue(apiError);

      const { result } = renderHook(() => useMarkAllAsSeen(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate();
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });
  });

  describe('useMarkAllAsRead', () => {
    it('marks all notifications as read successfully', async () => {
      mockApiClientTyped.put.mockResolvedValue({
        data: { success: true },
      });

      const { result } = renderHook(() => useMarkAllAsRead(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate();
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClientTyped.put).toHaveBeenCalledWith(
        '/v1/notifications/mark-all/read',
        {}
      );
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to mark all as read');
      mockApiClientTyped.put.mockRejectedValue(apiError);

      const { result } = renderHook(() => useMarkAllAsRead(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate();
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });
  });

  describe('useUnreadCount', () => {
    it('fetches unread count successfully', async () => {
      mockApiClientTyped.get.mockResolvedValue({
        data: {
          meta: {
            unread_count: 5,
            unseen_count: 3,
          },
        },
      });

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({ unread: 5, unseen: 3 });
      expect(mockApiClientTyped.get).toHaveBeenCalledWith(
        '/v1/notifications/feed?page_size=1'
      );
    });

    it('handles missing meta data', async () => {
      mockApiClientTyped.get.mockResolvedValue({
        data: {},
      });

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({ unread: 0, unseen: 0 });
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to fetch count');
      mockApiClientTyped.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useUnreadCount(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual({ unread: 0, unseen: 0 });
    });
  });

  describe('useOnboardingGuard', () => {
    it('returns loading state initially', () => {
      const { useAuth } = require('@/lib/hooks/use-auth');
      useAuth.mockReturnValue({
        user: null,
        isLoading: true,
      });

      const { result } = renderHook(() => useOnboardingGuard(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.needsOnboarding).toBe(false);
    });

    it('returns needsOnboarding true for non-onboarded user', () => {
      const { useAuth } = require('@/lib/hooks/use-auth');
      useAuth.mockReturnValue({
        user: { id: 'user1', onboarding_completed: false },
        isLoading: false,
      });

      const { result } = renderHook(() => useOnboardingGuard(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.needsOnboarding).toBe(true);
    });

    it('returns needsOnboarding false for onboarded user', () => {
      const { useAuth } = require('@/lib/hooks/use-auth');
      useAuth.mockReturnValue({
        user: { id: 'user1', onboarding_completed: true },
        isLoading: false,
      });

      const { result } = renderHook(() => useOnboardingGuard(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.needsOnboarding).toBe(false);
    });
  });

  describe('useRequireOnboarding', () => {
    it('returns loading state initially', () => {
      const { useAuth } = require('@/lib/hooks/use-auth');
      useAuth.mockReturnValue({
        user: null,
        isLoading: true,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useRequireOnboarding(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.isOnboarded).toBe(false);
      expect(result.current.user).toBeNull();
    });

    it('returns isOnboarded true for onboarded user', () => {
      const { useAuth } = require('@/lib/hooks/use-auth');
      useAuth.mockReturnValue({
        user: { id: 'user1', onboarding_completed: true },
        isLoading: false,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useRequireOnboarding(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isOnboarded).toBe(true);
      expect(result.current.user).toEqual({
        id: 'user1',
        onboarding_completed: true,
      });
    });

    it('returns isOnboarded false for non-onboarded user', () => {
      const { useAuth } = require('@/lib/hooks/use-auth');
      useAuth.mockReturnValue({
        user: { id: 'user1', onboarding_completed: false },
        isLoading: false,
        isAuthenticated: true,
      });

      const { result } = renderHook(() => useRequireOnboarding(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isOnboarded).toBe(false);
      expect(result.current.user).toEqual({
        id: 'user1',
        onboarding_completed: false,
      });
    });
  });
});

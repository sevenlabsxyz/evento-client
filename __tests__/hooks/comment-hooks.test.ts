import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock the API client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock the auth hook
jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    user: {
      id: 'user123',
      username: 'testuser',
      image: 'test.jpg',
      verification_status: 'verified',
    },
  }),
}));

import { apiClient as mockApiClient } from '@/lib/api/client';
import { useAddComment } from '@/lib/hooks/use-add-comment';
import { useDeleteComment } from '@/lib/hooks/use-delete-comment';
import { useEditComment } from '@/lib/hooks/use-edit-comment';
import { EventComment, useEventComments } from '@/lib/hooks/use-event-comments';

// Type the mock API client
const mockApiClientTyped = mockApiClient as any;

describe('Comment Hooks', () => {
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

  describe('useEventComments', () => {
    const mockComments: EventComment[] = [
      {
        id: 'comment1',
        created_at: '2025-01-01T00:00:00Z',
        message: 'Great event!',
        user_id: 'user1',
        event_id: 'event123',
        parent_comment_id: null,
        user_details: {
          id: 'user1',
          username: 'user1',
          name: 'User One',
          image: 'user1.jpg',
          bio: '',
          bio_link: '',
          x_handle: '',
          instagram_handle: '',
          ln_address: '',
          nip05: '',
          verification_status: 'verified',
          verification_date: '',
        },
        replies: [
          {
            id: 'reply1',
            created_at: '2025-01-01T01:00:00Z',
            message: 'I agree!',
            user_id: 'user2',
            event_id: 'event123',
            parent_comment_id: 'comment1',
            user_details: {
              id: 'user2',
              username: 'user2',
              name: 'User Two',
              image: 'user2.jpg',
              bio: '',
              bio_link: '',
              x_handle: '',
              instagram_handle: '',
              ln_address: '',
              nip05: '',
              verification_status: null,
              verification_date: '',
            },
            replies: [],
          },
        ],
      },
    ];

    it('returns loading state initially', () => {
      mockApiClientTyped.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useEventComments('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('fetches event comments successfully', async () => {
      mockApiClientTyped.get.mockResolvedValue({
        success: true,
        message: 'ok',
        data: mockComments,
      });

      const { result } = renderHook(() => useEventComments('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockComments);
      expect(mockApiClientTyped.get).toHaveBeenCalledWith(
        '/v1/events/comments?event_id=event123'
      );
    });

    it('handles direct data response format', async () => {
      mockApiClientTyped.get.mockResolvedValue(mockComments);

      const { result } = renderHook(() => useEventComments('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockComments);
    });

    it('handles empty comments array', async () => {
      mockApiClientTyped.get.mockResolvedValue({
        success: true,
        message: 'ok',
        data: [],
      });

      const { result } = renderHook(() => useEventComments('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to fetch comments');
      mockApiClientTyped.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useEventComments('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
      expect(result.current.data).toBeUndefined();
    });

    it('handles invalid response format', async () => {
      mockApiClientTyped.get.mockResolvedValue(null);

      const { result } = renderHook(() => useEventComments('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('is disabled when eventId is empty', () => {
      const { result } = renderHook(() => useEventComments(''), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).toBeUndefined();
      expect(mockApiClientTyped.get).not.toHaveBeenCalled();
    });

    it('handles different event IDs correctly', async () => {
      mockApiClientTyped.get.mockResolvedValue({
        success: true,
        message: 'ok',
        data: mockComments,
      });

      const { result } = renderHook(() => useEventComments('event456'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiClientTyped.get).toHaveBeenCalledWith(
        '/v1/events/comments?event_id=event456'
      );
    });
  });

  describe('useAddComment', () => {
    const mockNewComment: EventComment = {
      id: 'comment2',
      created_at: '2025-01-01T02:00:00Z',
      message: 'New comment',
      user_id: 'user123',
      event_id: 'event123',
      parent_comment_id: null,
      user_details: {
        id: 'user123',
        username: 'testuser',
        name: 'Test User',
        image: 'test.jpg',
        bio: '',
        bio_link: '',
        x_handle: '',
        instagram_handle: '',
        ln_address: '',
        nip05: '',
        verification_status: 'verified',
        verification_date: '',
      },
      replies: [],
    };

    it('adds comment successfully', async () => {
      mockApiClientTyped.post.mockResolvedValue({
        success: true,
        message: 'ok',
        data: [mockNewComment],
      });

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          event_id: 'event123',
          message: 'New comment',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockNewComment);
      expect(mockApiClientTyped.post).toHaveBeenCalledWith(
        '/v1/events/comments',
        {
          event_id: 'event123',
          message: 'New comment',
        }
      );
    });

    it('adds reply comment successfully', async () => {
      mockApiClientTyped.post.mockResolvedValue({
        success: true,
        message: 'ok',
        data: [mockNewComment],
      });

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          event_id: 'event123',
          message: 'Reply comment',
          parent_comment_id: 'comment1',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockNewComment);
      expect(mockApiClientTyped.post).toHaveBeenCalledWith(
        '/v1/events/comments',
        {
          event_id: 'event123',
          message: 'Reply comment',
          parent_comment_id: 'comment1',
        }
      );
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to add comment');
      mockApiClientTyped.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          event_id: 'event123',
          message: 'New comment',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });

    it('handles invalid response format', async () => {
      mockApiClientTyped.post.mockResolvedValue(null);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          event_id: 'event123',
          message: 'New comment',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('handles empty data array in response', async () => {
      mockApiClientTyped.post.mockResolvedValue({
        success: true,
        message: 'ok',
        data: [],
      });

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          event_id: 'event123',
          message: 'New comment',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toBeNull();
    });

    it('handles invalid response structure', async () => {
      mockApiClientTyped.post.mockResolvedValue({
        success: true,
        message: 'ok',
        // Missing data field
      });

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          event_id: 'event123',
          message: 'New comment',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('performs optimistic updates for top-level comments', async () => {
      // Set up existing comments in the cache
      queryClient.setQueryData(
        ['event', 'comments', 'event123'],
        [
          {
            id: 'comment1',
            created_at: '2025-01-01T00:00:00Z',
            message: 'Existing comment',
            user_id: 'user1',
            event_id: 'event123',
            parent_comment_id: null,
            user_details: {
              id: 'user1',
              username: 'user1',
              name: 'User One',
              image: 'user1.jpg',
              bio: '',
              bio_link: '',
              x_handle: '',
              instagram_handle: '',
              ln_address: '',
              nip05: '',
              verification_status: 'verified',
              verification_date: '',
            },
            replies: [],
          },
        ]
      );

      mockApiClientTyped.post.mockResolvedValue({
        success: true,
        message: 'ok',
        data: [mockNewComment],
      });

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          event_id: 'event123',
          message: 'New comment',
        });
      });

      // Check that optimistic update was added
      const cachedComments = queryClient.getQueryData<EventComment[]>([
        'event',
        'comments',
        'event123',
      ]);
      expect(cachedComments).toHaveLength(2);
      expect(cachedComments?.[0].message).toBe('New comment');
      expect(cachedComments?.[0].optimistic).toBe(true);
    });

    it('performs optimistic updates for reply comments', async () => {
      // Set up existing comments with replies in the cache
      const existingComments: EventComment[] = [
        {
          id: 'comment1',
          created_at: '2025-01-01T00:00:00Z',
          message: 'Parent comment',
          user_id: 'user1',
          event_id: 'event123',
          parent_comment_id: null,
          user_details: {
            id: 'user1',
            username: 'user1',
            name: 'User One',
            image: 'user1.jpg',
            bio: '',
            bio_link: '',
            x_handle: '',
            instagram_handle: '',
            ln_address: '',
            nip05: '',
            verification_status: 'verified',
            verification_date: '',
          },
          replies: [],
        },
      ];

      queryClient.setQueryData(
        ['event', 'comments', 'event123'],
        existingComments
      );

      mockApiClientTyped.post.mockResolvedValue({
        success: true,
        message: 'ok',
        data: [mockNewComment],
      });

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          event_id: 'event123',
          message: 'Reply comment',
          parent_comment_id: 'comment1',
        });
      });

      // Check that optimistic reply was added
      const cachedComments = queryClient.getQueryData<EventComment[]>([
        'event',
        'comments',
        'event123',
      ]);
      expect(cachedComments?.[0].replies).toHaveLength(1);
      expect(cachedComments?.[0].replies[0].message).toBe('Reply comment');
      expect(cachedComments?.[0].replies[0].optimistic).toBe(true);
    });

    it('reverts optimistic updates on error', async () => {
      const existingComments: EventComment[] = [
        {
          id: 'comment1',
          created_at: '2025-01-01T00:00:00Z',
          message: 'Existing comment',
          user_id: 'user1',
          event_id: 'event123',
          parent_comment_id: null,
          user_details: {
            id: 'user1',
            username: 'user1',
            name: 'User One',
            image: 'user1.jpg',
            bio: '',
            bio_link: '',
            x_handle: '',
            instagram_handle: '',
            ln_address: '',
            nip05: '',
            verification_status: 'verified',
            verification_date: '',
          },
          replies: [],
        },
      ];

      queryClient.setQueryData(
        ['event', 'comments', 'event123'],
        existingComments
      );

      const apiError = new Error('Failed to add comment');
      mockApiClientTyped.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          event_id: 'event123',
          message: 'New comment',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Check that optimistic update was reverted
      const cachedComments = queryClient.getQueryData<EventComment[]>([
        'event',
        'comments',
        'event123',
      ]);
      expect(cachedComments).toEqual(existingComments);
    });
  });

  describe('useDeleteComment', () => {
    it('deletes comment successfully', async () => {
      mockApiClientTyped.delete.mockResolvedValue({
        success: true,
        message: 'ok',
        data: { id: 'comment1' },
      });

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          commentId: 'comment1',
          eventId: 'event123',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ id: 'comment1' });
      expect(mockApiClientTyped.delete).toHaveBeenCalledWith(
        '/v1/events/comments?id=comment1'
      );
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to delete comment');
      mockApiClientTyped.delete.mockRejectedValue(apiError);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          commentId: 'comment1',
          eventId: 'event123',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });

    it('handles invalid response format', async () => {
      mockApiClientTyped.delete.mockResolvedValue(null);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          commentId: 'comment1',
          eventId: 'event123',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('handles missing data in response', async () => {
      mockApiClientTyped.delete.mockResolvedValue({
        success: true,
        message: 'ok',
        // Missing data field
      });

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          commentId: 'comment1',
          eventId: 'event123',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ id: 'comment1' });
    });

    it('handles direct response format', async () => {
      mockApiClientTyped.delete.mockResolvedValue({ id: 'comment1' });

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          commentId: 'comment1',
          eventId: 'event123',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({ id: 'comment1' });
    });
  });

  describe('useEditComment', () => {
    const mockEditedComment: EventComment = {
      id: 'comment1',
      created_at: '2025-01-01T00:00:00Z',
      message: 'Edited comment',
      user_id: 'user1',
      event_id: 'event123',
      parent_comment_id: null,
      user_details: {
        id: 'user1',
        username: 'user1',
        name: 'User One',
        image: 'user1.jpg',
        bio: '',
        bio_link: '',
        x_handle: '',
        instagram_handle: '',
        ln_address: '',
        nip05: '',
        verification_status: 'verified',
        verification_date: '',
      },
      replies: [],
    };

    it('edits comment successfully', async () => {
      mockApiClientTyped.patch.mockResolvedValue({
        success: true,
        message: 'ok',
        data: mockEditedComment,
      });

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          commentId: 'comment1',
          message: 'Edited comment',
          eventId: 'event123',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockEditedComment);
      expect(mockApiClientTyped.patch).toHaveBeenCalledWith(
        '/v1/events/comments/comment1',
        {
          message: 'Edited comment',
        }
      );
    });

    it('handles direct data response format', async () => {
      mockApiClientTyped.patch.mockResolvedValue(mockEditedComment);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          commentId: 'comment1',
          message: 'Edited comment',
          eventId: 'event123',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockEditedComment);
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to edit comment');
      mockApiClientTyped.patch.mockRejectedValue(apiError);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          commentId: 'comment1',
          message: 'Edited comment',
          eventId: 'event123',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });

    it('handles invalid response format', async () => {
      mockApiClientTyped.patch.mockResolvedValue(null);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          commentId: 'comment1',
          message: 'Edited comment',
          eventId: 'event123',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('handles missing data in response', async () => {
      mockApiClientTyped.patch.mockResolvedValue({
        success: true,
        message: 'ok',
        // Missing data field
      });

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          commentId: 'comment1',
          message: 'Edited comment',
          eventId: 'event123',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('logs error on failure', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const apiError = new Error('Failed to edit comment');
      mockApiClientTyped.patch.mockRejectedValue(apiError);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          commentId: 'comment1',
          message: 'Edited comment',
          eventId: 'event123',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error editing comment:',
        apiError
      );
      consoleSpy.mockRestore();
    });
  });
});

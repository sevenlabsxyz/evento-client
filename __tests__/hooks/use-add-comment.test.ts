import { useAddComment } from '@/lib/hooks/use-add-comment';
import { EventComment } from '@/lib/hooks/use-event-comments';
import { UserDetails, VerificationStatus } from '@/lib/types/api';
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

// Mock the auth hook
const mockUser: UserDetails = {
  id: 'user1',
  username: 'testuser',
  name: 'Test User',
  bio: 'Test bio',
  image: 'test.jpg',
  bio_link: '',
  x_handle: '',
  instagram_handle: '',
  ln_address: '',
  nip05: '',
  verification_status: 'verified' as VerificationStatus,
  verification_date: '2023-01-01T00:00:00Z',
};

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: true,
    isLoading: false,
  }),
}));

import { apiClient } from '@/lib/api/client';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useAddComment', () => {
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

  const createMockComment = (overrides: Partial<EventComment> = {}): EventComment => ({
    id: 'comment1',
    created_at: '2023-01-01T00:00:00Z',
    message: 'Test comment',
    user_id: 'user1',
    event_id: 'event1',
    parent_comment_id: null,
    user_details: {
      id: 'user1',
      name: 'Test User',
      bio: 'Test bio',
      username: 'testuser',
      image: 'test.jpg',
      verification_status: 'verified' as VerificationStatus,
    },
    replies: [],
    ...overrides,
  });

  const createMockApiResponse = (comments: EventComment[]) => ({
    success: true,
    message: 'Comment added successfully',
    data: comments,
  });

  describe('mutation function', () => {
    it('adds a comment successfully', async () => {
      const mockComment = createMockComment();
      const mockResponse = createMockApiResponse([mockComment]);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const commentParams = {
        event_id: 'event1',
        message: 'Test comment',
      };

      let mutationResult: EventComment | undefined;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(commentParams);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/event1/comments', commentParams);
      expect(mutationResult).toEqual(mockComment);
    });

    it('adds a reply comment successfully', async () => {
      const mockReply = createMockComment({
        parent_comment_id: 'parent1',
        message: 'Test reply',
      });
      const mockResponse = createMockApiResponse([mockReply]);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const replyParams = {
        event_id: 'event1',
        message: 'Test reply',
        parent_comment_id: 'parent1',
      };

      let mutationResult: EventComment | undefined;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(replyParams);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/event1/comments', replyParams);
      expect(mutationResult).toEqual(mockReply);
    });

    it('handles invalid response format', async () => {
      mockApiClient.post.mockResolvedValue(null as any);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const commentParams = {
        event_id: 'event1',
        message: 'Test comment',
      };

      await expect(
        act(async () => {
          await result.current.mutateAsync(commentParams);
        })
      ).rejects.toThrow('Invalid response format');
    });

    it('handles invalid response structure', async () => {
      mockApiClient.post.mockResolvedValue({ invalid: 'structure' } as any);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const commentParams = {
        event_id: 'event1',
        message: 'Test comment',
      };

      await expect(
        act(async () => {
          await result.current.mutateAsync(commentParams);
        })
      ).rejects.toThrow('Invalid response structure');
    });

    it('handles empty data array', async () => {
      const mockResponse = createMockApiResponse([]);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const commentParams = {
        event_id: 'event1',
        message: 'Test comment',
      };

      let mutationResult: EventComment | undefined;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(commentParams);
      });

      expect(mutationResult).toBeNull();
    });

    it('handles API errors', async () => {
      const apiError = new Error('API Error');
      mockApiClient.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const commentParams = {
        event_id: 'event1',
        message: 'Test comment',
      };

      await expect(
        act(async () => {
          await result.current.mutateAsync(commentParams);
        })
      ).rejects.toThrow('API Error');
    });
  });

  describe('optimistic updates', () => {
    it('adds optimistic comment for top-level comment', async () => {
      const existingComments = [createMockComment({ id: 'existing1' })];

      // Set up existing comments in query cache
      queryClient.setQueryData(['event', 'comments', 'event1'], existingComments);

      // Mock API response
      const mockComment = createMockComment({
        message: 'New optimistic comment',
      });
      const mockResponse = createMockApiResponse([mockComment]);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const commentParams = {
        event_id: 'event1',
        message: 'New optimistic comment',
      };

      await act(async () => {
        result.current.mutate(commentParams);
      });

      // Wait for the mutation to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that optimistic comment was added
      const updatedComments = queryClient.getQueryData<EventComment[]>([
        'event',
        'comments',
        'event1',
      ]);
      expect(updatedComments).toHaveLength(2);
      expect(updatedComments![0].message).toBe('New optimistic comment');
      expect(updatedComments![0].optimistic).toBe(true);
      expect(updatedComments![0].id).toMatch(/^optimistic-\d+-[a-z0-9]+$/);
    });

    it('adds optimistic reply to existing comment', async () => {
      const parentComment = createMockComment({
        id: 'parent1',
        replies: [createMockComment({ id: 'existing-reply1' })],
      });
      const existingComments = [parentComment];

      // Set up existing comments in query cache
      queryClient.setQueryData(['event', 'comments', 'event1'], existingComments);

      // Mock API response
      const mockReply = createMockComment({
        message: 'New optimistic reply',
        parent_comment_id: 'parent1',
      });
      const mockResponse = createMockApiResponse([mockReply]);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const replyParams = {
        event_id: 'event1',
        message: 'New optimistic reply',
        parent_comment_id: 'parent1',
      };

      await act(async () => {
        result.current.mutate(replyParams);
      });

      // Wait for the mutation to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that optimistic reply was added
      const updatedComments = queryClient.getQueryData<EventComment[]>([
        'event',
        'comments',
        'event1',
      ]);
      const parent = updatedComments![0];
      expect(parent.replies).toHaveLength(2);
      expect(parent.replies[0].message).toBe('New optimistic reply');
      expect(parent.replies[0].optimistic).toBe(true);
      expect(parent.replies[0].parent_comment_id).toBe('parent1');
    });

    it('adds optimistic reply to nested comment', async () => {
      const nestedReply = createMockComment({ id: 'nested-reply1' });
      const parentComment = createMockComment({
        id: 'parent1',
        replies: [
          createMockComment({
            id: 'reply1',
            replies: [nestedReply],
          }),
        ],
      });
      const existingComments = [parentComment];

      // Set up existing comments in query cache
      queryClient.setQueryData(['event', 'comments', 'event1'], existingComments);

      // Mock API response
      const mockReply = createMockComment({
        message: 'Reply to nested comment',
        parent_comment_id: 'nested-reply1',
      });
      const mockResponse = createMockApiResponse([mockReply]);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const replyParams = {
        event_id: 'event1',
        message: 'Reply to nested comment',
        parent_comment_id: 'nested-reply1',
      };

      await act(async () => {
        result.current.mutate(replyParams);
      });

      // Wait for the mutation to complete
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that optimistic reply was added to the nested comment
      const updatedComments = queryClient.getQueryData<EventComment[]>([
        'event',
        'comments',
        'event1',
      ]);
      const parent = updatedComments![0];
      const reply = parent.replies[0];
      const nested = reply.replies[0];

      expect(nested.replies).toHaveLength(1);
      expect(nested.replies[0].message).toBe('Reply to nested comment');
      expect(nested.replies[0].optimistic).toBe(true);
      expect(nested.replies[0].parent_comment_id).toBe('nested-reply1');
    });

    it('handles case when parent comment is not found', async () => {
      const existingComments = [createMockComment({ id: 'existing1' })];

      // Set up existing comments in query cache
      queryClient.setQueryData(['event', 'comments', 'event1'], existingComments);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const replyParams = {
        event_id: 'event1',
        message: 'Reply to non-existent parent',
        parent_comment_id: 'non-existent',
      };

      await act(async () => {
        result.current.mutate(replyParams);
      });

      // Check that comments remain unchanged
      const updatedComments = queryClient.getQueryData<EventComment[]>([
        'event',
        'comments',
        'event1',
      ]);
      expect(updatedComments).toEqual(existingComments);
    });

    it('does not add optimistic comment when user is not authenticated', async () => {
      // Mock unauthenticated user
      jest.doMock('@/lib/hooks/use-auth', () => ({
        useAuth: () => ({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        }),
      }));

      const existingComments = [createMockComment({ id: 'existing1' })];
      queryClient.setQueryData(['event', 'comments', 'event1'], existingComments);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const commentParams = {
        event_id: 'event1',
        message: 'New comment',
      };

      await act(async () => {
        result.current.mutate(commentParams);
      });

      // Check that no optimistic comment was added
      const updatedComments = queryClient.getQueryData<EventComment[]>([
        'event',
        'comments',
        'event1',
      ]);
      expect(updatedComments).toEqual(existingComments);
    });
  });

  describe('error handling', () => {
    it('reverts optimistic update on mutation failure', async () => {
      const existingComments = [createMockComment({ id: 'existing1' })];

      // Set up existing comments in query cache
      queryClient.setQueryData(['event', 'comments', 'event1'], existingComments);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const commentParams = {
        event_id: 'event1',
        message: 'New comment',
      };

      // Mock API failure
      mockApiClient.post.mockRejectedValue(new Error('API Error'));

      await act(async () => {
        result.current.mutate(commentParams);
      });

      // Wait for the mutation to complete and error handling to occur
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Check that comments were reverted to original state
      const revertedComments = queryClient.getQueryData<EventComment[]>([
        'event',
        'comments',
        'event1',
      ]);
      expect(revertedComments).toEqual(existingComments);
    });

    it('handles case when previous comments context is missing', async () => {
      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const commentParams = {
        event_id: 'event1',
        message: 'New comment',
      };

      // Mock API failure
      mockApiClient.post.mockRejectedValue(new Error('API Error'));

      await act(async () => {
        result.current.mutate(commentParams);
      });

      // Wait for the mutation to complete
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      // Should not throw an error even without previous comments context
      expect(result.current.error).toBeDefined();
    });
  });

  describe('success handling', () => {
    it('invalidates comments query on successful mutation', async () => {
      const mockComment = createMockComment();
      const mockResponse = createMockApiResponse([mockComment]);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const commentParams = {
        event_id: 'event1',
        message: 'Test comment',
      };

      await act(async () => {
        await result.current.mutateAsync(commentParams);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['event', 'comments', 'event1'],
      });
    });
  });

  describe('mutation state', () => {
    it('tracks loading state correctly', async () => {
      const mockComment = createMockComment();
      const mockResponse = createMockApiResponse([mockComment]);

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.post.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const commentParams = {
        event_id: 'event1',
        message: 'Test comment',
      };

      // Start mutation
      act(() => {
        result.current.mutate(commentParams);
      });

      // Wait for the mutation to start and check status
      await waitFor(() => {
        expect(result.current.status).toBe('pending');
      });

      // Resolve the promise
      await act(async () => {
        resolvePromise!(mockResponse);
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.status).toBe('success');
      });
    });

    it('tracks error state correctly', async () => {
      const apiError = new Error('API Error');
      mockApiClient.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const commentParams = {
        event_id: 'event1',
        message: 'Test comment',
      };

      await act(async () => {
        result.current.mutate(commentParams);
      });

      await waitFor(() => {
        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe(apiError);
      });
    });
  });

  describe('query cancellation', () => {
    it('cancels existing queries before optimistic update', async () => {
      const cancelQueriesSpy = jest.spyOn(queryClient, 'cancelQueries');

      const { result } = renderHook(() => useAddComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const commentParams = {
        event_id: 'event1',
        message: 'Test comment',
      };

      await act(async () => {
        result.current.mutate(commentParams);
      });

      expect(cancelQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['event', 'comments', 'event1'],
      });
    });
  });
});

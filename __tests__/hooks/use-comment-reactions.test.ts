import { CommentReactions, useCommentReactions } from '@/lib/hooks/use-comment-reactions';
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

import { apiClient } from '@/lib/api/client';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useCommentReactions', () => {
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

  const createMockReactions = (overrides: Partial<CommentReactions> = {}): CommentReactions => ({
    reactions: {
      like: 5,
      ...overrides.reactions,
    },
    user_reaction: null,
    ...overrides,
  });

  const createMockApiResponse = (data: any) => ({
    success: true,
    message: 'Success',
    data,
  });

  describe('query functionality', () => {
    it('fetches comment reactions successfully', async () => {
      const mockReactions = createMockReactions({
        reactions: { like: 10 },
        user_reaction: 'like',
      });
      // Mock the API client to return data directly (as per interceptor)
      mockApiClient.get.mockResolvedValue(mockReactions);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/events/event1/comments/comment1/reactions'
      );

      // Wait for the data to be available
      await waitFor(() => {
        expect(result.current.reactions).toEqual({ like: 10 });
        expect(result.current.userReaction).toBe('like');
      });
    });

    it('handles API response with success wrapper', async () => {
      const mockReactions = createMockReactions({
        reactions: { like: 3 },
        user_reaction: null,
      });
      const wrappedResponse = createMockApiResponse(mockReactions);
      mockApiClient.get.mockResolvedValue(wrappedResponse);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.reactions).toEqual({ like: 3 });
      expect(result.current.userReaction).toBe(null);
    });

    it('handles invalid response format', async () => {
      mockApiClient.get.mockResolvedValue(null as any);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle error gracefully
      expect(result.current.reactions).toEqual({ like: 0 });
      expect(result.current.userReaction).toBeUndefined();
    });

    it('handles API errors', async () => {
      const apiError = new Error('API Error');
      mockApiClient.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Should handle error gracefully
      expect(result.current.reactions).toEqual({ like: 0 });
      expect(result.current.userReaction).toBeUndefined();
    });

    it('does not fetch when commentId is empty', () => {
      const { result } = renderHook(() => useCommentReactions('', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(mockApiClient.get).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('does not fetch when commentId is undefined', () => {
      const { result } = renderHook(() => useCommentReactions(undefined as any, 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(mockApiClient.get).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('mutation functionality', () => {
    it('toggles reaction successfully', async () => {
      const mockReactions = createMockReactions({
        reactions: { like: 5 },
        user_reaction: null,
      });
      mockApiClient.get.mockResolvedValue(mockReactions);

      const mockResponse = createMockApiResponse({
        action: 'added',
        has_reacted: true,
        reaction_type: 'like',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Wait for initial data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Toggle reaction
      act(() => {
        result.current.toggleReaction('like');
      });

      // Wait for mutation to complete
      await waitFor(() => {
        expect(result.current.isToggling).toBe(false);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/event1/comments/comment1/reactions',
        {
          reactionType: 'like',
        }
      );
    });

    it('handles mutation errors', async () => {
      const mockReactions = createMockReactions({
        reactions: { like: 5 },
        user_reaction: null,
      });
      mockApiClient.get.mockResolvedValue(mockReactions);

      const apiError = new Error('Mutation failed');
      mockApiClient.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Wait for initial data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Toggle reaction
      act(() => {
        result.current.toggleReaction('like');
      });

      // Wait for mutation to complete
      await waitFor(() => {
        expect(result.current.isToggling).toBe(false);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/event1/comments/comment1/reactions',
        {
          reactionType: 'like',
        }
      );
    });

    it('handles invalid mutation response format', async () => {
      const mockReactions = createMockReactions({
        reactions: { like: 5 },
        user_reaction: null,
      });
      mockApiClient.get.mockResolvedValue(mockReactions);

      mockApiClient.post.mockResolvedValue(null as any);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Wait for initial data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Toggle reaction
      act(() => {
        result.current.toggleReaction('like');
      });

      // Wait for mutation to complete
      await waitFor(() => {
        expect(result.current.isToggling).toBe(false);
      });
    });
  });

  describe('optimistic updates', () => {
    it('calls API when adding reaction and user has no reaction', async () => {
      const mockReactions = createMockReactions({
        reactions: { like: 5 },
        user_reaction: null,
      });
      mockApiClient.get.mockResolvedValue(mockReactions);

      const mockResponse = createMockApiResponse({
        action: 'added',
        has_reacted: true,
        reaction_type: 'like',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Wait for initial data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.reactions).toEqual({ like: 5 });
        expect(result.current.userReaction).toBe(null);
      });

      // Toggle reaction
      act(() => {
        result.current.toggleReaction('like');
      });

      // Wait for mutation to complete
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/v1/events/event1/comments/comment1/reactions',
          {
            reactionType: 'like',
          }
        );
      });
    });

    it('calls API when removing reaction and user already has the same reaction', async () => {
      const mockReactions = createMockReactions({
        reactions: { like: 5 },
        user_reaction: 'like',
      });
      mockApiClient.get.mockResolvedValue(mockReactions);

      const mockResponse = createMockApiResponse({
        action: 'removed',
        has_reacted: false,
        reaction_type: 'like',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Wait for initial data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.reactions).toEqual({ like: 5 });
        expect(result.current.userReaction).toBe('like');
      });

      // Toggle reaction
      act(() => {
        result.current.toggleReaction('like');
      });

      // Wait for mutation to complete
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/v1/events/event1/comments/comment1/reactions',
          {
            reactionType: 'like',
          }
        );
      });
    });

    it('calls API when updating reaction and user has different reaction', async () => {
      const mockReactions = createMockReactions({
        reactions: { like: 5, love: 3 },
        user_reaction: 'love',
      });
      mockApiClient.get.mockResolvedValue(mockReactions);

      const mockResponse = createMockApiResponse({
        action: 'updated',
        has_reacted: true,
        reaction_type: 'like',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Wait for initial data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.reactions).toEqual({ like: 5, love: 3 });
        expect(result.current.userReaction).toBe('love');
      });

      // Toggle reaction
      act(() => {
        result.current.toggleReaction('like');
      });

      // Wait for mutation to complete
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/v1/events/event1/comments/comment1/reactions',
          {
            reactionType: 'like',
          }
        );
      });
    });

    it('calls API with zero reactions edge case', async () => {
      const mockReactions = createMockReactions({
        reactions: { like: 0 },
        user_reaction: 'like',
      });
      mockApiClient.get.mockResolvedValue(mockReactions);

      const mockResponse = createMockApiResponse({
        action: 'removed',
        has_reacted: false,
        reaction_type: 'like',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Wait for initial data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.reactions).toEqual({ like: 0 });
        expect(result.current.userReaction).toBe('like');
      });

      // Toggle reaction
      act(() => {
        result.current.toggleReaction('like');
      });

      // Wait for mutation to complete
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledWith(
          '/v1/events/event1/comments/comment1/reactions',
          {
            reactionType: 'like',
          }
        );
      });
    });

    it('reverts optimistic update on mutation failure', async () => {
      const mockReactions = createMockReactions({
        reactions: { like: 5 },
        user_reaction: null,
      });
      mockApiClient.get.mockResolvedValue(mockReactions);

      const apiError = new Error('Mutation failed');
      mockApiClient.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Wait for initial data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.reactions).toEqual({ like: 5 });
        expect(result.current.userReaction).toBe(null);
      });

      // Toggle reaction
      act(() => {
        result.current.toggleReaction('like');
      });

      // Wait for mutation to fail and revert
      await waitFor(() => {
        expect(result.current.isToggling).toBe(false);
      });

      // Should revert to original state
      expect(result.current.reactions).toEqual({ like: 5 });
      expect(result.current.userReaction).toBe(null);
    });
  });

  describe('query invalidation', () => {
    it('invalidates query after successful mutation', async () => {
      const mockReactions = createMockReactions({
        reactions: { like: 5 },
        user_reaction: null,
      });
      mockApiClient.get.mockResolvedValue(mockReactions);

      const mockResponse = createMockApiResponse({
        action: 'added',
        has_reacted: true,
        reaction_type: 'like',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Wait for initial data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Toggle reaction
      act(() => {
        result.current.toggleReaction('like');
      });

      // Wait for mutation to complete
      await waitFor(() => {
        expect(result.current.isToggling).toBe(false);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['comment', 'reactions', 'comment1'],
      });
    });

    it('invalidates query after failed mutation', async () => {
      const mockReactions = createMockReactions({
        reactions: { like: 5 },
        user_reaction: null,
      });
      mockApiClient.get.mockResolvedValue(mockReactions);

      const apiError = new Error('Mutation failed');
      mockApiClient.post.mockRejectedValue(apiError);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Wait for initial data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Toggle reaction
      act(() => {
        result.current.toggleReaction('like');
      });

      // Wait for mutation to fail
      await waitFor(() => {
        expect(result.current.isToggling).toBe(false);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['comment', 'reactions', 'comment1'],
      });
    });
  });

  describe('loading states', () => {
    it('tracks loading state correctly', async () => {
      const mockReactions = createMockReactions({
        reactions: { like: 5 },
        user_reaction: null,
      });

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.get.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Should be loading initially
      expect(result.current.isLoading).toBe(true);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({ data: mockReactions });
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it('tracks toggling state correctly', async () => {
      const mockReactions = createMockReactions({
        reactions: { like: 5 },
        user_reaction: null,
      });
      mockApiClient.get.mockResolvedValue(mockReactions);

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.post.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Wait for initial data
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Start mutation
      act(() => {
        result.current.toggleReaction('like');
      });

      // Wait for toggling state to be true
      await waitFor(() => {
        expect(result.current.isToggling).toBe(true);
      });

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          success: true,
          data: { action: 'added', has_reacted: true, reaction_type: 'like' },
        });
      });

      // Wait for completion
      await waitFor(() => {
        expect(result.current.isToggling).toBe(false);
      });
    });
  });

  describe('edge cases', () => {
    it('handles missing reactions data', async () => {
      const mockReactions = {
        user_reaction: 'like',
      } as CommentReactions;
      mockApiClient.get.mockResolvedValue(mockReactions);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.userReaction).toBe('like');
      });

      expect(result.current.reactions).toEqual({ like: 0 });
    });

    it('handles missing user_reaction', async () => {
      const mockReactions = {
        reactions: { like: 5 },
      } as CommentReactions;
      mockApiClient.get.mockResolvedValue(mockReactions);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.reactions).toEqual({ like: 5 });
      });

      expect(result.current.userReaction).toBeUndefined();
    });

    it('handles multiple reaction types', async () => {
      const mockReactions = createMockReactions({
        reactions: { like: 5, love: 3, laugh: 2 },
        user_reaction: 'love',
      });
      mockApiClient.get.mockResolvedValue(mockReactions);

      const { result } = renderHook(() => useCommentReactions('comment1', 'event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
        expect(result.current.reactions).toEqual({
          like: 5,
          love: 3,
          laugh: 2,
        });
        expect(result.current.userReaction).toBe('love');
      });
    });
  });
});

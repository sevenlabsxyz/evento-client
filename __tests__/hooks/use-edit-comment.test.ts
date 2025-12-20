import { useEditComment } from '@/lib/hooks/use-edit-comment';
import { EventComment } from '@/lib/hooks/use-event-comments';
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

describe('useEditComment', () => {
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

  const createMockEditParams = (
    overrides: Partial<{
      commentId: string;
      message: string;
      eventId: string;
    }> = {}
  ) => ({
    commentId: 'comment123',
    message: 'Updated comment message',
    eventId: 'event456',
    ...overrides,
  });

  const createMockComment = (overrides: Partial<EventComment> = {}): EventComment => ({
    id: 'comment123',
    created_at: '2024-01-01T00:00:00Z',
    message: 'Updated comment message',
    user_id: 'user123',
    event_id: 'event456',
    parent_comment_id: null,
    user_details: {
      id: 'user123',
      username: 'testuser',
      name: 'Test User',
      image: 'test.jpg',
      verification_status: null,
    },
    replies: [],
    ...overrides,
  });

  const createMockApiResponse = (data: EventComment) => ({
    success: true,
    message: 'Comment updated successfully',
    data,
  });

  describe('mutation functionality', () => {
    it('edits comment successfully with API response structure', async () => {
      const mockParams = createMockEditParams();
      const mockComment = createMockComment();
      const mockResponse = createMockApiResponse(mockComment);
      mockApiClient.patch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/event456/comments/comment123', {
        message: 'Updated comment message',
      });
      expect(mutationResult).toEqual(mockComment);
    });

    it('edits comment successfully with direct response', async () => {
      const mockParams = createMockEditParams();
      const mockComment = createMockComment();
      mockApiClient.patch.mockResolvedValue(mockComment);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/event456/comments/comment123', {
        message: 'Updated comment message',
      });
      expect(mutationResult).toEqual(mockComment);
    });

    it('handles API error response', async () => {
      const mockParams = createMockEditParams();
      const apiError = new Error('Comment not found');
      mockApiClient.patch.mockRejectedValue(apiError);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/event456/comments/comment123', {
        message: 'Updated comment message',
      });
    });

    it('handles null response', async () => {
      const mockParams = createMockEditParams();
      mockApiClient.patch.mockResolvedValue(null as any);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toEqual(new Error('Invalid response format'));
        }
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/event456/comments/comment123', {
        message: 'Updated comment message',
      });
    });

    it('handles undefined response', async () => {
      const mockParams = createMockEditParams();
      mockApiClient.patch.mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toEqual(new Error('Invalid response format'));
        }
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/event456/comments/comment123', {
        message: 'Updated comment message',
      });
    });

    it('handles non-object response', async () => {
      const mockParams = createMockEditParams();
      mockApiClient.patch.mockResolvedValue('string response' as any);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toEqual(new Error('Invalid response format'));
        }
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/event456/comments/comment123', {
        message: 'Updated comment message',
      });
    });
  });

  describe('query invalidation', () => {
    it('invalidates comments query on successful edit', async () => {
      const mockParams = createMockEditParams();
      const mockComment = createMockComment();
      const mockResponse = createMockApiResponse(mockComment);
      mockApiClient.patch.mockResolvedValue(mockResponse);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['event', 'comments', 'event456'],
      });
    });

    it('invalidates comments query with correct event ID', async () => {
      const mockParams = createMockEditParams({
        commentId: 'comment789',
        message: 'Updated message',
        eventId: 'event123',
      });
      const mockComment = createMockComment({ event_id: 'event123' });
      const mockResponse = createMockApiResponse(mockComment);
      mockApiClient.patch.mockResolvedValue(mockResponse);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['event', 'comments', 'event123'],
      });
    });

    it('does not invalidate queries on error', async () => {
      const mockParams = createMockEditParams();
      const apiError = new Error('API Error');
      mockApiClient.patch.mockRejectedValue(apiError);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          // Expected error
        }
      });

      expect(invalidateQueriesSpy).not.toHaveBeenCalled();
    });
  });

  describe('mutation state', () => {
    it('tracks loading state correctly', async () => {
      const mockParams = createMockEditParams();
      const mockComment = createMockComment();
      const mockResponse = createMockApiResponse(mockComment);

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.patch.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockParams);
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

    it('tracks error state correctly', async () => {
      const mockParams = createMockEditParams();
      const apiError = new Error('API Error');
      mockApiClient.patch.mockRejectedValue(apiError);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockParams);
      });

      // Wait for error
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(apiError);
      });
    });

    it('tracks success state correctly', async () => {
      const mockParams = createMockEditParams();
      const mockComment = createMockComment();
      const mockResponse = createMockApiResponse(mockComment);
      mockApiClient.patch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockParams);
      });

      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual(mockComment);
      });
    });

    it('resets mutation state', async () => {
      const mockParams = createMockEditParams();
      const mockComment = createMockComment();
      const mockResponse = createMockApiResponse(mockComment);
      mockApiClient.patch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockParams);
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

  describe('URL parameter handling', () => {
    it('constructs correct URL with comment ID', async () => {
      const mockParams = createMockEditParams({
        commentId: 'special-comment-123',
        message: 'Updated message',
        eventId: 'event789',
      });
      const mockComment = createMockComment({ id: 'special-comment-123' });
      const mockResponse = createMockApiResponse(mockComment);
      mockApiClient.patch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/v1/events/event789/comments/special-comment-123',
        {
          message: 'Updated message',
        }
      );
    });

    it('handles special characters in comment ID', async () => {
      const mockParams = createMockEditParams({
        commentId: 'comment-with-special-chars-!@#$%',
        message: 'Updated message',
        eventId: 'event456',
      });
      const mockComment = createMockComment({
        id: 'comment-with-special-chars-!@#$%',
      });
      const mockResponse = createMockApiResponse(mockComment);
      mockApiClient.patch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith(
        '/v1/events/event456/comments/comment-with-special-chars-!@#$%',
        { message: 'Updated message' }
      );
    });
  });

  describe('message handling', () => {
    it('sends correct message in request body', async () => {
      const mockParams = createMockEditParams({
        commentId: 'comment123',
        message: 'This is a very long message with special characters! @#$%^&*()',
        eventId: 'event456',
      });
      const mockComment = createMockComment({
        message: 'This is a very long message with special characters! @#$%^&*()',
      });
      const mockResponse = createMockApiResponse(mockComment);
      mockApiClient.patch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/event456/comments/comment123', {
        message: 'This is a very long message with special characters! @#$%^&*()',
      });
    });

    it('handles empty message', async () => {
      const mockParams = createMockEditParams({
        commentId: 'comment123',
        message: '',
        eventId: 'event456',
      });
      const mockComment = createMockComment({ message: '' });
      const mockResponse = createMockApiResponse(mockComment);
      mockApiClient.patch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/event456/comments/comment123', {
        message: '',
      });
    });

    it('handles multiline message', async () => {
      const multilineMessage = `This is a multiline message
with multiple lines
and special characters! @#$%^&*()`;

      const mockParams = createMockEditParams({
        commentId: 'comment123',
        message: multilineMessage,
        eventId: 'event456',
      });
      const mockComment = createMockComment({ message: multilineMessage });
      const mockResponse = createMockApiResponse(mockComment);
      mockApiClient.patch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/event456/comments/comment123', {
        message: multilineMessage,
      });
    });
  });

  describe('response data handling', () => {
    it('returns API response data when available', async () => {
      const mockParams = createMockEditParams();
      const mockComment = createMockComment({
        id: 'comment123',
        message: 'Updated comment message',
        created_at: '2024-01-01T00:00:00Z',
        user_details: {
          id: 'user123',
          username: 'testuser',
          name: 'Test User',
          image: 'test.jpg',
          verification_status: 'verified',
        },
      });
      const mockResponse = createMockApiResponse(mockComment);
      mockApiClient.patch.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockParams);
      });

      expect(mutationResult).toEqual(mockComment);
    });

    it('handles response without API structure', async () => {
      const mockParams = createMockEditParams();
      const mockComment = createMockComment();
      mockApiClient.patch.mockResolvedValue(mockComment);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockParams);
      });

      expect(mutationResult).toEqual(mockComment);
    });
  });

  describe('multiple mutations', () => {
    it('can perform multiple edit operations', async () => {
      const mockParams1 = createMockEditParams({
        commentId: 'comment1',
        message: 'First edit',
        eventId: 'event1',
      });
      const mockParams2 = createMockEditParams({
        commentId: 'comment2',
        message: 'Second edit',
        eventId: 'event1',
      });

      const mockComment1 = createMockComment({
        id: 'comment1',
        message: 'First edit',
      });
      const mockComment2 = createMockComment({
        id: 'comment2',
        message: 'Second edit',
      });

      const mockResponse1 = createMockApiResponse(mockComment1);
      const mockResponse2 = createMockApiResponse(mockComment2);

      mockApiClient.patch.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // First edit
      await act(async () => {
        await result.current.mutateAsync(mockParams1);
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/event1/comments/comment1', {
        message: 'First edit',
      });

      // Second edit
      await act(async () => {
        await result.current.mutateAsync(mockParams2);
      });

      expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/events/event1/comments/comment2', {
        message: 'Second edit',
      });
      expect(mockApiClient.patch).toHaveBeenCalledTimes(2);
    });

    it('handles mixed success and error scenarios', async () => {
      const mockParams1 = createMockEditParams({
        commentId: 'comment1',
        message: 'First edit',
        eventId: 'event1',
      });
      const mockParams2 = createMockEditParams({
        commentId: 'comment2',
        message: 'Second edit',
        eventId: 'event1',
      });

      const mockComment1 = createMockComment({
        id: 'comment1',
        message: 'First edit',
      });
      const apiError = new Error('Comment not found');

      const mockResponse1 = createMockApiResponse(mockComment1);

      mockApiClient.patch.mockResolvedValueOnce(mockResponse1).mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // First edit (success)
      await act(async () => {
        await result.current.mutateAsync(mockParams1);
      });

      // Wait for success state
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Second edit (error)
      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams2);
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });

      // Wait for error state
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('error logging', () => {
    it('logs error to console on mutation error', async () => {
      const mockParams = createMockEditParams();
      const apiError = new Error('API Error');
      mockApiClient.patch.mockRejectedValue(apiError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useEditComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          // Expected error
        }
      });

      expect(consoleSpy).toHaveBeenCalledWith('Error editing comment:', apiError);
      consoleSpy.mockRestore();
    });
  });
});

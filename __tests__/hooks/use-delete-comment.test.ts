import { useDeleteComment } from '@/lib/hooks/use-delete-comment';
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

describe('useDeleteComment', () => {
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

  const createMockDeleteParams = (
    overrides: Partial<{ commentId: string; eventId: string }> = {}
  ) => ({
    commentId: 'comment123',
    eventId: 'event456',
    ...overrides,
  });

  const createMockApiResponse = (data: any) => ({
    success: true,
    message: 'Comment deleted successfully',
    data,
  });

  describe('mutation functionality', () => {
    it('deletes comment successfully with API response structure', async () => {
      const mockParams = createMockDeleteParams();
      const mockResponse = createMockApiResponse({ id: 'comment123' });
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/v1/events/comments?id=comment123'
      );
      expect(mutationResult).toEqual({ id: 'comment123' });
    });

    it('deletes comment successfully with fallback response', async () => {
      const mockParams = createMockDeleteParams();
      const mockResponse = { id: 'comment123' }; // Direct response without API structure
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/v1/events/comments?id=comment123'
      );
      expect(mutationResult).toEqual({ id: 'comment123' });
    });

    it('handles API response with null data', async () => {
      const mockParams = createMockDeleteParams();
      const mockResponse = {
        success: true,
        message: 'Comment deleted successfully',
        data: null,
      };
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/v1/events/comments?id=comment123'
      );
      expect(mutationResult).toEqual({ id: 'comment123' }); // Fallback to commentId
    });

    it('handles API error response', async () => {
      const mockParams = createMockDeleteParams();
      const apiError = new Error('Comment not found');
      mockApiClient.delete.mockRejectedValue(apiError);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/v1/events/comments?id=comment123'
      );
    });

    it('handles null response', async () => {
      const mockParams = createMockDeleteParams();
      mockApiClient.delete.mockResolvedValue(null as any);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toEqual(new Error('Invalid response format'));
        }
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/v1/events/comments?id=comment123'
      );
    });

    it('handles undefined response', async () => {
      const mockParams = createMockDeleteParams();
      mockApiClient.delete.mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toEqual(new Error('Invalid response format'));
        }
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/v1/events/comments?id=comment123'
      );
    });

    it('handles non-object response', async () => {
      const mockParams = createMockDeleteParams();
      mockApiClient.delete.mockResolvedValue('string response' as any);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toEqual(new Error('Invalid response format'));
        }
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/v1/events/comments?id=comment123'
      );
    });
  });

  describe('query invalidation', () => {
    it('invalidates comments query on successful deletion with API response', async () => {
      const mockParams = createMockDeleteParams();
      const mockResponse = createMockApiResponse({ id: 'comment123' });
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['event', 'comments', 'event456'],
      });
    });

    it('invalidates comments query on successful deletion with fallback response', async () => {
      const mockParams = createMockDeleteParams();
      const mockResponse = { id: 'comment123' };
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['event', 'comments', 'event456'],
      });
    });

    it('does not invalidate queries on error', async () => {
      const mockParams = createMockDeleteParams();
      const apiError = new Error('API Error');
      mockApiClient.delete.mockRejectedValue(apiError);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteComment(), {
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
      const mockParams = createMockDeleteParams();
      const mockResponse = createMockApiResponse({ id: 'comment123' });

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.delete.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useDeleteComment(), {
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
      const mockParams = createMockDeleteParams();
      const apiError = new Error('API Error');
      mockApiClient.delete.mockRejectedValue(apiError);

      const { result } = renderHook(() => useDeleteComment(), {
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
      const mockParams = createMockDeleteParams();
      const mockResponse = createMockApiResponse({ id: 'comment123' });
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockParams);
      });

      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual({ id: 'comment123' });
      });
    });

    it('resets mutation state', async () => {
      const mockParams = createMockDeleteParams();
      const mockResponse = createMockApiResponse({ id: 'comment123' });
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteComment(), {
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
      const mockParams = createMockDeleteParams({
        commentId: 'special-comment-123',
        eventId: 'event789',
      });
      const mockResponse = createMockApiResponse({ id: 'special-comment-123' });
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/v1/events/comments?id=special-comment-123'
      );
    });

    it('handles special characters in comment ID', async () => {
      const mockParams = createMockDeleteParams({
        commentId: 'comment-with-special-chars-!@#$%',
        eventId: 'event456',
      });
      const mockResponse = createMockApiResponse({
        id: 'comment-with-special-chars-!@#$%',
      });
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/v1/events/comments?id=comment-with-special-chars-!@#$%'
      );
    });
  });

  describe('response data handling', () => {
    it('returns API response data when available', async () => {
      const mockParams = createMockDeleteParams();
      const mockResponse = createMockApiResponse({
        id: 'comment123',
        deleted_at: '2024-01-01T00:00:00Z',
        status: 'deleted',
      });
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockParams);
      });

      expect(mutationResult).toEqual({
        id: 'comment123',
        deleted_at: '2024-01-01T00:00:00Z',
        status: 'deleted',
      });
    });

    it('falls back to comment ID when API data is null', async () => {
      const mockParams = createMockDeleteParams({
        commentId: 'fallback-comment-456',
        eventId: 'event789',
      });
      const mockResponse = {
        success: true,
        message: 'Comment deleted successfully',
        data: null,
      };
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockParams);
      });

      expect(mutationResult).toEqual({ id: 'fallback-comment-456' });
    });

    it('falls back to comment ID when response lacks API structure', async () => {
      const mockParams = createMockDeleteParams({
        commentId: 'direct-response-789',
        eventId: 'event123',
      });
      const mockResponse = { id: 'direct-response-789' };
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockParams);
      });

      expect(mutationResult).toEqual({ id: 'direct-response-789' });
    });
  });

  describe('multiple mutations', () => {
    it('can perform multiple delete operations', async () => {
      const mockParams1 = createMockDeleteParams({
        commentId: 'comment1',
        eventId: 'event1',
      });
      const mockParams2 = createMockDeleteParams({
        commentId: 'comment2',
        eventId: 'event1',
      });

      const mockResponse1 = createMockApiResponse({ id: 'comment1' });
      const mockResponse2 = createMockApiResponse({ id: 'comment2' });

      mockApiClient.delete
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // First deletion
      await act(async () => {
        await result.current.mutateAsync(mockParams1);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/v1/events/comments?id=comment1'
      );

      // Second deletion
      await act(async () => {
        await result.current.mutateAsync(mockParams2);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/v1/events/comments?id=comment2'
      );
      expect(mockApiClient.delete).toHaveBeenCalledTimes(2);
    });

    it('handles mixed success and error scenarios', async () => {
      const mockParams1 = createMockDeleteParams({
        commentId: 'comment1',
        eventId: 'event1',
      });
      const mockParams2 = createMockDeleteParams({
        commentId: 'comment2',
        eventId: 'event1',
      });

      const mockResponse1 = createMockApiResponse({ id: 'comment1' });
      const apiError = new Error('Comment not found');

      mockApiClient.delete
        .mockResolvedValueOnce(mockResponse1)
        .mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useDeleteComment(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // First deletion (success)
      await act(async () => {
        await result.current.mutateAsync(mockParams1);
      });

      // Wait for success state
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Second deletion (error)
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
});

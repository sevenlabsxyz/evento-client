import { useDeleteGalleryItem } from '@/lib/hooks/use-delete-gallery-item';
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

describe('useDeleteGalleryItem', () => {
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
    overrides: Partial<{ galleryItemId: string; eventId: string }> = {}
  ) => ({
    galleryItemId: 'gallery123',
    eventId: 'event456',
    ...overrides,
  });

  const createMockApiResponse = (success: boolean, message?: string) => ({
    success,
    message:
      message || (success ? 'Gallery item deleted successfully' : 'Failed to delete gallery item'),
    data: null,
  });

  describe('mutation functionality', () => {
    it('deletes gallery item successfully with success response', async () => {
      const mockParams = createMockDeleteParams();
      const mockResponse = createMockApiResponse(true);
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/events/gallery?id=gallery123');
      expect(mutationResult).toEqual({
        galleryItemId: 'gallery123',
        eventId: 'event456',
      });
    });

    it('deletes gallery item successfully with direct response', async () => {
      const mockParams = createMockDeleteParams();
      const mockResponse = { id: 'gallery123' }; // Direct response without API structure
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/events/gallery?id=gallery123');
      expect(mutationResult).toEqual({
        galleryItemId: 'gallery123',
        eventId: 'event456',
      });
    });

    it('handles API error response with success: false', async () => {
      const mockParams = createMockDeleteParams();
      const mockResponse = createMockApiResponse(false, 'Gallery item not found');
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toEqual(new Error('Failed to delete photo'));
        }
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/events/gallery?id=gallery123');
    });

    it('handles API error response', async () => {
      const mockParams = createMockDeleteParams();
      const apiError = new Error('Network error');
      mockApiClient.delete.mockRejectedValue(apiError);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/events/gallery?id=gallery123');
    });

    it('handles null response', async () => {
      const mockParams = createMockDeleteParams();
      mockApiClient.delete.mockResolvedValue(null as any);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toEqual(new Error('Invalid response format'));
        }
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/events/gallery?id=gallery123');
    });

    it('handles undefined response', async () => {
      const mockParams = createMockDeleteParams();
      mockApiClient.delete.mockResolvedValue(undefined as any);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toEqual(new Error('Invalid response format'));
        }
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/events/gallery?id=gallery123');
    });

    it('handles non-object response', async () => {
      const mockParams = createMockDeleteParams();
      mockApiClient.delete.mockResolvedValue('string response' as any);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toEqual(new Error('Invalid response format'));
        }
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/events/gallery?id=gallery123');
    });
  });

  describe('query invalidation', () => {
    it('invalidates gallery query on successful deletion', async () => {
      const mockParams = createMockDeleteParams();
      const mockResponse = createMockApiResponse(true);
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['event', 'gallery', 'event456'],
      });
    });

    it('invalidates gallery query with correct event ID', async () => {
      const mockParams = createMockDeleteParams({
        galleryItemId: 'gallery789',
        eventId: 'event123',
      });
      const mockResponse = createMockApiResponse(true);
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['event', 'gallery', 'event123'],
      });
    });

    it('does not invalidate queries on error', async () => {
      const mockParams = createMockDeleteParams();
      const apiError = new Error('API Error');
      mockApiClient.delete.mockRejectedValue(apiError);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteGalleryItem(), {
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

    it('does not invalidate queries on API success: false', async () => {
      const mockParams = createMockDeleteParams();
      const mockResponse = createMockApiResponse(false);
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useDeleteGalleryItem(), {
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
      const mockResponse = createMockApiResponse(true);

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.delete.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
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

      const { result } = renderHook(() => useDeleteGalleryItem(), {
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
      const mockResponse = createMockApiResponse(true);
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockParams);
      });

      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual({
          galleryItemId: 'gallery123',
          eventId: 'event456',
        });
      });
    });

    it('resets mutation state', async () => {
      const mockParams = createMockDeleteParams();
      const mockResponse = createMockApiResponse(true);
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
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
    it('constructs correct URL with gallery item ID', async () => {
      const mockParams = createMockDeleteParams({
        galleryItemId: 'special-gallery-123',
        eventId: 'event789',
      });
      const mockResponse = createMockApiResponse(true);
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/v1/events/gallery?id=special-gallery-123'
      );
    });

    it('handles special characters in gallery item ID', async () => {
      const mockParams = createMockDeleteParams({
        galleryItemId: 'gallery-with-special-chars-!@#$%',
        eventId: 'event456',
      });
      const mockResponse = createMockApiResponse(true);
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith(
        '/v1/events/gallery?id=gallery-with-special-chars-!@#$%'
      );
    });
  });

  describe('response data handling', () => {
    it('returns correct data structure on success', async () => {
      const mockParams = createMockDeleteParams({
        galleryItemId: 'gallery789',
        eventId: 'event123',
      });
      const mockResponse = createMockApiResponse(true);
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockParams);
      });

      expect(mutationResult).toEqual({
        galleryItemId: 'gallery789',
        eventId: 'event123',
      });
    });

    it('handles response without success property', async () => {
      const mockParams = createMockDeleteParams();
      const mockResponse = { id: 'gallery123' }; // No success property
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockParams);
      });

      expect(mutationResult).toEqual({
        galleryItemId: 'gallery123',
        eventId: 'event456',
      });
    });
  });

  describe('multiple mutations', () => {
    it('can perform multiple delete operations', async () => {
      const mockParams1 = createMockDeleteParams({
        galleryItemId: 'gallery1',
        eventId: 'event1',
      });
      const mockParams2 = createMockDeleteParams({
        galleryItemId: 'gallery2',
        eventId: 'event1',
      });

      const mockResponse1 = createMockApiResponse(true);
      const mockResponse2 = createMockApiResponse(true);

      mockApiClient.delete
        .mockResolvedValueOnce(mockResponse1)
        .mockResolvedValueOnce(mockResponse2);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // First deletion
      await act(async () => {
        await result.current.mutateAsync(mockParams1);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/events/gallery?id=gallery1');

      // Second deletion
      await act(async () => {
        await result.current.mutateAsync(mockParams2);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/events/gallery?id=gallery2');
      expect(mockApiClient.delete).toHaveBeenCalledTimes(2);
    });

    it('handles mixed success and error scenarios', async () => {
      const mockParams1 = createMockDeleteParams({
        galleryItemId: 'gallery1',
        eventId: 'event1',
      });
      const mockParams2 = createMockDeleteParams({
        galleryItemId: 'gallery2',
        eventId: 'event1',
      });

      const mockResponse1 = createMockApiResponse(true);
      const apiError = new Error('Gallery item not found');

      mockApiClient.delete.mockResolvedValueOnce(mockResponse1).mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
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

  describe('edge cases', () => {
    it('handles empty string gallery item ID', async () => {
      const mockParams = createMockDeleteParams({
        galleryItemId: '',
        eventId: 'event456',
      });
      const mockResponse = createMockApiResponse(true);
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/events/gallery?id=');
    });

    it('handles empty string event ID', async () => {
      const mockParams = createMockDeleteParams({
        galleryItemId: 'gallery123',
        eventId: '',
      });
      const mockResponse = createMockApiResponse(true);
      mockApiClient.delete.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.delete).toHaveBeenCalledWith('/v1/events/gallery?id=gallery123');
    });
  });
});

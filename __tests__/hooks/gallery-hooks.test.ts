import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock the API client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
  default: {
    get: jest.fn(),
    post: jest.fn(),
    delete: jest.fn(),
  },
}));

// Mock the toast utility
jest.mock('@/lib/utils/toast', () => ({
  toast: {
    error: jest.fn(),
  },
}));

import { apiClient as mockApiClient } from '@/lib/api/client';
import { useDeleteGalleryItem } from '@/lib/hooks/use-delete-gallery-item';
import { GalleryItem, useEventGallery } from '@/lib/hooks/use-event-gallery';
import { useGalleryItemLikes } from '@/lib/hooks/use-gallery-item-likes';

// Type the mock API client
const mockApiClientTyped = mockApiClient as any;

describe('Gallery Hooks', () => {
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

  describe('useEventGallery', () => {
    const mockGalleryItems: GalleryItem[] = [
      {
        id: 'gallery1',
        created_at: '2025-01-01T00:00:00Z',
        url: 'https://example.com/image1.jpg',
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
        events: {
          id: 'event123',
          title: 'Test Event',
        },
      },
      {
        id: 'gallery2',
        created_at: '2025-01-01T01:00:00Z',
        url: 'https://example.com/image2.jpg',
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
        events: {
          id: 'event123',
          title: 'Test Event',
        },
      },
    ];

    it('returns loading state initially', () => {
      mockApiClientTyped.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('fetches event gallery successfully', async () => {
      mockApiClientTyped.get.mockResolvedValue({
        success: true,
        message: 'ok',
        data: mockGalleryItems,
      });

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockGalleryItems);
      expect(mockApiClientTyped.get).toHaveBeenCalledWith(
        '/v1/events/gallery?id=event123'
      );
    });

    it('handles direct data response format', async () => {
      mockApiClientTyped.get.mockResolvedValue(mockGalleryItems);

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockGalleryItems);
    });

    it('handles empty gallery array', async () => {
      mockApiClientTyped.get.mockResolvedValue({
        success: true,
        message: 'ok',
        data: [],
      });

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual([]);
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to fetch gallery');
      mockApiClientTyped.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useEventGallery('event123'), {
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

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('is disabled when eventId is empty', () => {
      const { result } = renderHook(() => useEventGallery(''), {
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
        data: mockGalleryItems,
      });

      const { result } = renderHook(() => useEventGallery('event456'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiClientTyped.get).toHaveBeenCalledWith(
        '/v1/events/gallery?id=event456'
      );
    });
  });

  describe('useDeleteGalleryItem', () => {
    it('deletes gallery item successfully', async () => {
      mockApiClientTyped.delete.mockResolvedValue({
        success: true,
        message: 'ok',
      });

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          galleryItemId: 'gallery1',
          eventId: 'event123',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual({
        galleryItemId: 'gallery1',
        eventId: 'event123',
      });
      expect(mockApiClientTyped.delete).toHaveBeenCalledWith(
        '/v1/events/gallery?id=gallery1'
      );
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to delete gallery item');
      mockApiClientTyped.delete.mockRejectedValue(apiError);

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          galleryItemId: 'gallery1',
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

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          galleryItemId: 'gallery1',
          eventId: 'event123',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('handles unsuccessful response', async () => {
      mockApiClientTyped.delete.mockResolvedValue({
        success: false,
        message: 'Failed to delete',
      });

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          galleryItemId: 'gallery1',
          eventId: 'event123',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('invalidates gallery query on success', async () => {
      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      mockApiClientTyped.delete.mockResolvedValue({
        success: true,
        message: 'ok',
      });

      const { result } = renderHook(() => useDeleteGalleryItem(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate({
          galleryItemId: 'gallery1',
          eventId: 'event123',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['event', 'gallery', 'event123'],
      });
    });
  });

  describe('useGalleryItemLikes', () => {
    const mockLikesResponse = {
      likes: 5,
      has_liked: false,
    };

    const mockLikeActionResponse = {
      action: 'liked' as const,
      has_liked: true,
    };

    it('returns loading state initially', () => {
      mockApiClientTyped.get.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { result } = renderHook(() => useGalleryItemLikes('gallery1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.likes).toBe(0);
      expect(result.current.hasLiked).toBe(false);
    });

    it('fetches gallery item likes successfully', async () => {
      mockApiClientTyped.get.mockResolvedValue({
        success: true,
        message: 'ok',
        data: mockLikesResponse,
      });

      const { result } = renderHook(() => useGalleryItemLikes('gallery1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.likes).toBe(5);
      expect(result.current.hasLiked).toBe(false);
      expect(mockApiClientTyped.get).toHaveBeenCalledWith(
        '/v1/events/gallery/likes?itemId=gallery1'
      );
    });

    it('handles direct data response format', async () => {
      mockApiClientTyped.get.mockResolvedValue(mockLikesResponse);

      const { result } = renderHook(() => useGalleryItemLikes('gallery1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.likes).toBe(5);
      expect(result.current.hasLiked).toBe(false);
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to fetch likes');
      mockApiClientTyped.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useGalleryItemLikes('gallery1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.likes).toBe(0);
      expect(result.current.hasLiked).toBe(false);
    });

    it('handles invalid response format', async () => {
      mockApiClientTyped.get.mockResolvedValue(null);

      const { result } = renderHook(() => useGalleryItemLikes('gallery1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.likes).toBe(0);
      expect(result.current.hasLiked).toBe(false);
    });

    it('is disabled when itemId is not provided', () => {
      const { result } = renderHook(() => useGalleryItemLikes(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.likes).toBe(0);
      expect(result.current.hasLiked).toBe(false);
      expect(mockApiClientTyped.get).not.toHaveBeenCalled();
    });

    it('toggles like successfully', async () => {
      // Set up initial likes data
      queryClient.setQueryData(
        ['gallery', 'likes', 'gallery1'],
        mockLikesResponse
      );

      mockApiClientTyped.post.mockResolvedValue({
        success: true,
        message: 'ok',
        data: mockLikeActionResponse,
      });

      const { result } = renderHook(() => useGalleryItemLikes('gallery1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.toggleLike();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(mockApiClientTyped.post).toHaveBeenCalledWith(
        '/v1/events/gallery/likes',
        {
          itemId: 'gallery1',
        }
      );
    });

    it('performs optimistic updates when toggling like', async () => {
      // Set up initial likes data
      queryClient.setQueryData(
        ['gallery', 'likes', 'gallery1'],
        mockLikesResponse
      );

      mockApiClientTyped.post.mockResolvedValue({
        success: true,
        message: 'ok',
        data: mockLikeActionResponse,
      });

      const { result } = renderHook(() => useGalleryItemLikes('gallery1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.toggleLike();
      });

      // Check that optimistic update was applied
      const cachedData = queryClient.getQueryData([
        'gallery',
        'likes',
        'gallery1',
      ]);
      expect(cachedData).toEqual({
        likes: 6, // 5 + 1
        has_liked: true, // flipped from false
      });
    });

    it('reverts optimistic updates on error', async () => {
      // Set up initial likes data
      queryClient.setQueryData(
        ['gallery', 'likes', 'gallery1'],
        mockLikesResponse
      );

      const apiError = new Error('Failed to toggle like');
      mockApiClientTyped.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useGalleryItemLikes('gallery1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.toggleLike();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Check that optimistic update was reverted
      const cachedData = queryClient.getQueryData([
        'gallery',
        'likes',
        'gallery1',
      ]);
      expect(cachedData).toEqual(mockLikesResponse);
    });

    it('shows error toast when itemId is not provided', async () => {
      const { toast } = require('@/lib/utils/toast');

      const { result } = renderHook(() => useGalleryItemLikes(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.toggleLike();
      });

      expect(toast.error).toHaveBeenCalledWith('Unable to like this image');
    });

    it('shows error toast when toggle fails', async () => {
      const { toast } = require('@/lib/utils/toast');

      mockApiClientTyped.post.mockRejectedValue(
        new Error('Failed to toggle like')
      );

      const { result } = renderHook(() => useGalleryItemLikes('gallery1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.toggleLike();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(toast.error).toHaveBeenCalledWith(
        'Failed to update like. Please try again.'
      );
    });

    it('handles like mutation errors gracefully', async () => {
      mockApiClientTyped.post.mockResolvedValue({
        success: false,
        message: 'Failed to toggle like',
      });

      const { result } = renderHook(() => useGalleryItemLikes('gallery1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.toggleLike();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
    });

    it('handles invalid like response format', async () => {
      mockApiClientTyped.post.mockResolvedValue(null);

      const { result } = renderHook(() => useGalleryItemLikes('gallery1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.toggleLike();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
    });

    it('handles missing data in like response', async () => {
      mockApiClientTyped.post.mockResolvedValue({
        success: true,
        message: 'ok',
        // Missing data field
      });

      const { result } = renderHook(() => useGalleryItemLikes('gallery1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.toggleLike();
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isError).toBe(true);
    });
  });
});

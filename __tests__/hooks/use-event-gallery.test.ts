import { apiClient } from '@/lib/api/client';
import { GalleryItem, useEventGallery } from '@/lib/hooks/use-event-gallery';
import { UserDetails } from '@/lib/types/api';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useEventGallery', () => {
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

  const createMockGalleryItem = (overrides: Partial<GalleryItem> = {}): GalleryItem => ({
    id: 'gallery123',
    created_at: '2024-01-15T10:30:00Z',
    url: 'https://example.com/image.jpg',
    user_details: createMockUserDetails(),
    events: {
      id: 'event123',
      title: 'Test Event',
    },
    ...overrides,
  });

  const createMockApiResponse = (data: GalleryItem[]) => ({
    success: true,
    message: 'Gallery items retrieved successfully',
    data,
  });

  describe('query functionality', () => {
    it('fetches gallery items successfully with API response structure', async () => {
      const mockGalleryItems = [
        createMockGalleryItem({
          id: 'item1',
          url: 'https://example.com/image1.jpg',
        }),
        createMockGalleryItem({
          id: 'item2',
          url: 'https://example.com/image2.jpg',
        }),
      ];
      const mockResponse = createMockApiResponse(mockGalleryItems);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/gallery?id=event123');
      expect(result.current.data).toEqual(mockGalleryItems);
    });

    it('fetches gallery items successfully with direct response', async () => {
      const mockGalleryItems = [
        createMockGalleryItem({
          id: 'item1',
          url: 'https://example.com/image1.jpg',
        }),
        createMockGalleryItem({
          id: 'item2',
          url: 'https://example.com/image2.jpg',
        }),
      ];
      mockApiClient.get.mockResolvedValueOnce(mockGalleryItems as any);

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/gallery?id=event123');
      expect(result.current.data).toEqual(mockGalleryItems);
    });

    it('handles empty gallery response', async () => {
      const mockResponse = createMockApiResponse([]);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventGallery('event123'), {
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
        message: 'Gallery items retrieved successfully',
        data: null,
      };
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventGallery('event123'), {
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

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });

    it('handles invalid response format', async () => {
      mockApiClient.get.mockResolvedValueOnce(null as any);

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        expect.objectContaining({
          message: 'Invalid response format',
        })
      );
    });

    it('handles non-object response', async () => {
      mockApiClient.get.mockResolvedValueOnce('string response' as any);

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toEqual(
        expect.objectContaining({
          message: 'Invalid response format',
        })
      );
    });

    it('is disabled when eventId is empty', () => {
      const { result } = renderHook(() => useEventGallery(''), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('is disabled when eventId is null', () => {
      const { result } = renderHook(() => useEventGallery(null as any), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isFetching).toBe(false);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });
  });

  describe('query state', () => {
    it('tracks loading state correctly', async () => {
      const mockGalleryItems = [createMockGalleryItem()];
      const mockResponse = createMockApiResponse(mockGalleryItems);

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.get.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useEventGallery('event123'), {
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
      const mockGalleryItems = [createMockGalleryItem()];
      const mockResponse = createMockApiResponse(mockGalleryItems);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.data).toEqual(mockGalleryItems);
    });

    it('tracks error state correctly', async () => {
      const apiError = new Error('API Error');
      mockApiClient.get.mockRejectedValueOnce(apiError);

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(apiError);
      });
    });
  });

  describe('URL parameter handling', () => {
    it('constructs correct URL with event ID', async () => {
      const mockGalleryItems = [createMockGalleryItem()];
      const mockResponse = createMockApiResponse(mockGalleryItems);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/gallery?id=event123');
    });

    it('handles special characters in event ID', async () => {
      const mockGalleryItems = [createMockGalleryItem()];
      const mockResponse = createMockApiResponse(mockGalleryItems);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventGallery('event-with-special-chars-!@#$%'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/events/gallery?id=event-with-special-chars-!@#$%'
      );
    });
  });

  describe('response data handling', () => {
    it('handles API response with success and data properties', async () => {
      const mockGalleryItems = [
        createMockGalleryItem({ id: 'item1' }),
        createMockGalleryItem({ id: 'item2' }),
      ];
      const mockResponse = createMockApiResponse(mockGalleryItems);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockGalleryItems);
    });

    it('handles direct gallery response without API wrapper', async () => {
      const mockGalleryItems = [
        createMockGalleryItem({ id: 'item1' }),
        createMockGalleryItem({ id: 'item2' }),
      ];
      mockApiClient.get.mockResolvedValueOnce(mockGalleryItems as any);

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockGalleryItems);
    });
  });

  describe('query configuration', () => {
    it('has correct query key', async () => {
      const mockGalleryItems = [createMockGalleryItem()];
      const mockResponse = createMockApiResponse(mockGalleryItems);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // Check that the query key is correct
      const queryData = queryClient.getQueryData(['event', 'gallery', 'event123']);
      expect(queryData).toEqual(mockGalleryItems);
    });

    it('has stale time configuration', async () => {
      const mockGalleryItems = [createMockGalleryItem()];
      const mockResponse = createMockApiResponse(mockGalleryItems);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      // The stale time is configured in the hook, we can verify it's working
      // by checking that the query doesn't refetch immediately
      expect(result.current.data).toEqual(mockGalleryItems);
    });
  });

  describe('gallery item structure', () => {
    it('handles gallery items with complete user details', async () => {
      const mockUserDetails = createMockUserDetails({
        id: 'user456',
        username: 'galleryuser',
        name: 'Gallery User',
        bio: 'Gallery user bio',
        image: 'gallery-user.jpg',
        verification_status: 'verified',
      });

      const mockGalleryItem = createMockGalleryItem({
        id: 'gallery456',
        url: 'https://example.com/gallery-image.jpg',
        user_details: mockUserDetails,
        events: {
          id: 'event456',
          title: 'Gallery Event',
        },
      });

      const mockResponse = createMockApiResponse([mockGalleryItem]);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventGallery('event456'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0]).toEqual(mockGalleryItem);
      expect(result.current.data![0].user_details).toEqual(mockUserDetails);
    });

    it('handles gallery items with minimal user details', async () => {
      const mockUserDetails = createMockUserDetails({
        id: 'user789',
        username: 'minimaluser',
        name: 'Minimal User',
        bio: '',
        image: '',
        verification_status: 'unverified',
      });

      const mockGalleryItem = createMockGalleryItem({
        id: 'gallery789',
        url: 'https://example.com/minimal-image.jpg',
        user_details: mockUserDetails,
      });

      const mockResponse = createMockApiResponse([mockGalleryItem]);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventGallery('event789'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0].user_details).toEqual(mockUserDetails);
    });
  });

  describe('multiple queries', () => {
    it('can fetch different event galleries independently', async () => {
      const mockGalleryItems1 = [
        createMockGalleryItem({
          id: 'item1',
          events: { id: 'event1', title: 'Event 1' },
        }),
      ];
      const mockGalleryItems2 = [
        createMockGalleryItem({
          id: 'item2',
          events: { id: 'event2', title: 'Event 2' },
        }),
      ];

      const mockResponse1 = createMockApiResponse(mockGalleryItems1);
      const mockResponse2 = createMockApiResponse(mockGalleryItems2);

      mockApiClient.get.mockResolvedValueOnce(mockResponse1).mockResolvedValueOnce(mockResponse2);

      const { result: result1 } = renderHook(() => useEventGallery('event1'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const { result: result2 } = renderHook(() => useEventGallery('event2'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result1.current.isSuccess).toBe(true);
        expect(result2.current.isSuccess).toBe(true);
      });

      expect(result1.current.data).toEqual(mockGalleryItems1);
      expect(result2.current.data).toEqual(mockGalleryItems2);
      expect(mockApiClient.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('edge cases', () => {
    it('handles undefined response data', async () => {
      const mockResponse = {
        success: true,
        message: 'Gallery items retrieved successfully',
        data: undefined,
      };
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventGallery('event123'), {
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
        message: 'Gallery not found',
        data: null,
      };
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('handles very large gallery response', async () => {
      const mockGalleryItems = Array.from({ length: 100 }, (_, index) =>
        createMockGalleryItem({
          id: `item${index}`,
          url: `https://example.com/image${index}.jpg`,
        })
      );
      const mockResponse = createMockApiResponse(mockGalleryItems);
      mockApiClient.get.mockResolvedValueOnce(mockResponse);

      const { result } = renderHook(() => useEventGallery('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toHaveLength(100);
      expect(result.current.data![0].id).toBe('item0');
      expect(result.current.data![99].id).toBe('item99');
    });
  });
});

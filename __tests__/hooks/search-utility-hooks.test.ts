import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock the API client
jest.mock('@/lib/api/client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
  },
  default: {
    get: jest.fn(),
    post: jest.fn(),
  },
}));

// Mock the event transform utility
jest.mock('@/lib/utils/event-transform', () => ({
  transformApiEventToDisplay: jest.fn((event) => ({
    ...event,
    transformed: true,
  })),
}));

import { apiClient as mockApiClient } from '@/lib/api/client';
import { useDebounce } from '@/lib/hooks/use-debounce';
import {
  GenerateDescriptionParams,
  useGenerateDescription,
} from '@/lib/hooks/use-generate-description';
import { useEventSearch, useUserSearch } from '@/lib/hooks/use-search';

// Type the mock API client
const mockApiClientTyped = mockApiClient as any;

describe('Search and Utility Hooks', () => {
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

  describe('useEventSearch', () => {
    const mockEvents = [
      {
        id: 'event1',
        title: 'Test Event 1',
        description: 'Test Description 1',
        start_date: '2025-01-01T10:00:00Z',
        location: 'Test Location 1',
      },
      {
        id: 'event2',
        title: 'Test Event 2',
        description: 'Test Description 2',
        start_date: '2025-01-02T10:00:00Z',
        location: 'Test Location 2',
      },
    ];

    it('searches events successfully', async () => {
      mockApiClientTyped.get.mockResolvedValue({
        data: mockEvents,
      });

      const { result } = renderHook(() => useEventSearch(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('test');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([
        { ...mockEvents[0], transformed: true },
        { ...mockEvents[1], transformed: true },
      ]);
      expect(mockApiClientTyped.get).toHaveBeenCalledWith(
        '/v1/event/search?s=test'
      );
    });

    it('returns empty array for empty query', async () => {
      const { result } = renderHook(() => useEventSearch(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
      expect(mockApiClientTyped.get).not.toHaveBeenCalled();
    });

    it('returns empty array for whitespace-only query', async () => {
      const { result } = renderHook(() => useEventSearch(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('   ');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
      expect(mockApiClientTyped.get).not.toHaveBeenCalled();
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Search failed');
      mockApiClientTyped.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useEventSearch(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('test');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });

    it('logs error on failure', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const apiError = new Error('Search failed');
      mockApiClientTyped.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useEventSearch(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('test');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(consoleSpy).toHaveBeenCalledWith('Event search failed:', apiError);
      consoleSpy.mockRestore();
    });

    it('handles special characters in query', async () => {
      mockApiClientTyped.get.mockResolvedValue({
        data: mockEvents,
      });

      const { result } = renderHook(() => useEventSearch(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('test & special chars!');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClientTyped.get).toHaveBeenCalledWith(
        '/v1/event/search?s=test%20%26%20special%20chars%21'
      );
    });
  });

  describe('useUserSearch', () => {
    const mockUsers = [
      {
        id: 'user1',
        username: 'user1',
        name: 'User One',
        image: 'user1.jpg',
        bio: 'Bio 1',
        bio_link: '',
        x_handle: '',
        instagram_handle: '',
        ln_address: '',
        nip05: '',
        verification_status: 'verified',
        verification_date: '',
      },
      {
        id: 'user2',
        username: 'user2',
        name: 'User Two',
        image: 'user2.jpg',
        bio: 'Bio 2',
        bio_link: '',
        x_handle: '',
        instagram_handle: '',
        ln_address: '',
        nip05: '',
        verification_status: null,
        verification_date: '',
      },
    ];

    it('searches users successfully', async () => {
      mockApiClientTyped.get.mockResolvedValue({
        data: mockUsers,
      });

      const { result } = renderHook(() => useUserSearch(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('user');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockUsers);
      expect(mockApiClientTyped.get).toHaveBeenCalledWith(
        '/v1/user/search?s=user'
      );
    });

    it('returns empty array for empty query', async () => {
      const { result } = renderHook(() => useUserSearch(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
      expect(mockApiClientTyped.get).not.toHaveBeenCalled();
    });

    it('returns empty array for whitespace-only query', async () => {
      const { result } = renderHook(() => useUserSearch(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('   ');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
      expect(mockApiClientTyped.get).not.toHaveBeenCalled();
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('User search failed');
      mockApiClientTyped.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useUserSearch(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('user');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });

    it('logs error on failure', async () => {
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      const apiError = new Error('User search failed');
      mockApiClientTyped.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useUserSearch(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('user');
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(consoleSpy).toHaveBeenCalledWith('User search failed:', apiError);
      consoleSpy.mockRestore();
    });

    it('handles special characters in query', async () => {
      mockApiClientTyped.get.mockResolvedValue({
        data: mockUsers,
      });

      const { result } = renderHook(() => useUserSearch(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate('user & special chars!');
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClientTyped.get).toHaveBeenCalledWith(
        '/v1/user/search?s=user%20%26%20special%20chars%21'
      );
    });
  });

  describe('useDebounce', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('returns initial value immediately', () => {
      const { result } = renderHook(() => useDebounce('initial', 100));

      expect(result.current).toBe('initial');
    });

    it('debounces value changes', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBe('initial');

      // Change the value
      rerender({ value: 'changed' });
      expect(result.current).toBe('initial'); // Should still be initial

      // Fast-forward time by 50ms
      jest.advanceTimersByTime(50);
      expect(result.current).toBe('initial'); // Should still be initial

      // Fast-forward time by another 50ms (total 100ms)
      jest.advanceTimersByTime(50);
      expect(result.current).toBe('changed'); // Should now be changed
    });

    it('cancels previous timeout when value changes rapidly', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 'initial' } }
      );

      expect(result.current).toBe('initial');

      // Change value multiple times rapidly
      rerender({ value: 'changed1' });
      jest.advanceTimersByTime(50);
      rerender({ value: 'changed2' });
      jest.advanceTimersByTime(50);
      rerender({ value: 'changed3' });
      jest.advanceTimersByTime(50);

      expect(result.current).toBe('initial'); // Should still be initial

      // Fast-forward to complete the debounce
      jest.advanceTimersByTime(50);
      expect(result.current).toBe('changed3'); // Should be the last value
    });

    it('works with different delay values', () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: 'initial', delay: 200 } }
      );

      expect(result.current).toBe('initial');

      rerender({ value: 'changed', delay: 200 });
      expect(result.current).toBe('initial');

      // Fast-forward by 100ms (not enough)
      jest.advanceTimersByTime(100);
      expect(result.current).toBe('initial');

      // Fast-forward by another 100ms (total 200ms)
      jest.advanceTimersByTime(100);
      expect(result.current).toBe('changed');
    });

    it('works with different data types', () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 100),
        { initialProps: { value: 0 } }
      );

      expect(result.current).toBe(0);

      rerender({ value: 42 });
      expect(result.current).toBe(0);

      jest.advanceTimersByTime(100);
      expect(result.current).toBe(42);
    });

    it('cleans up timeout on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const { unmount } = renderHook(() => useDebounce('test', 100));

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
      clearTimeoutSpy.mockRestore();
    });
  });

  describe('useGenerateDescription', () => {
    const mockParams: GenerateDescriptionParams = {
      title: 'Test Event',
      location: 'Test Location',
      startDate: '2025-01-01T10:00:00Z',
      endDate: '2025-01-01T12:00:00Z',
      timezone: 'UTC',
      visibility: 'public',
      length: 'medium',
      tone: 'professional',
    };

    const mockResponse = {
      description: 'This is a generated description for the test event.',
    };

    it('generates description successfully', async () => {
      mockApiClientTyped.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate(mockParams);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(mockApiClientTyped.post).toHaveBeenCalledWith(
        '/v1/events/generate-description',
        mockParams,
        {
          timeout: 60000,
        }
      );
    });

    it('handles API errors gracefully', async () => {
      const apiError = new Error('Failed to generate description');
      mockApiClientTyped.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate(mockParams);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });

    it('handles missing description in response', async () => {
      mockApiClientTyped.post.mockResolvedValue({
        // Missing description field
        success: true,
      });

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate(mockParams);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBeTruthy();
    });

    it('handles invalid response format', async () => {
      mockApiClientTyped.post.mockResolvedValue(null);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate(mockParams);
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
      const apiError = new Error('Failed to generate description');
      mockApiClientTyped.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate(mockParams);
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Generate description error:',
        apiError
      );
      consoleSpy.mockRestore();
    });

    it('handles all parameter types correctly', async () => {
      const fullParams: GenerateDescriptionParams = {
        title: 'Test Event',
        location: 'Test Location',
        startDate: '2025-01-01T10:00:00Z',
        endDate: '2025-01-01T12:00:00Z',
        timezone: 'UTC',
        visibility: 'public',
        spotifyUrl: 'https://open.spotify.com/track/123',
        cost: 25,
        currentDescription: 'Existing description',
        length: 'long',
        tone: 'exciting',
        customPrompt: 'Make it sound amazing',
        eventContext: 'Music event',
        userPrompt: 'Focus on the atmosphere',
      };

      mockApiClientTyped.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate(fullParams);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClientTyped.post).toHaveBeenCalledWith(
        '/v1/events/generate-description',
        fullParams,
        {
          timeout: 60000,
        }
      );
    });

    it('handles minimal parameters', async () => {
      const minimalParams: GenerateDescriptionParams = {
        title: 'Test Event',
        length: 'short',
        tone: 'casual',
      };

      mockApiClientTyped.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        result.current.mutate(minimalParams);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClientTyped.post).toHaveBeenCalledWith(
        '/v1/events/generate-description',
        minimalParams,
        {
          timeout: 60000,
        }
      );
    });
  });
});

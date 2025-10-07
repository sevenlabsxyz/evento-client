import {
  useCreateEvent,
  useCreateEventWithCallbacks,
} from '@/lib/hooks/use-create-event';
import { CreateEventData } from '@/lib/schemas/event';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock Next.js router
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

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

import apiClient from '@/lib/api/client';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useCreateEvent', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
    mockPush.mockClear();
  });

  const createMockEventData = (
    overrides: Partial<CreateEventData> = {}
  ): CreateEventData => ({
    title: 'Test Event',
    description: 'Test event description',
    location: 'Test Location',
    timezone: 'UTC',
    cover: null,
    start_date_day: 15,
    start_date_month: 6,
    start_date_year: 2024,
    start_date_hours: 14,
    start_date_minutes: 30,
    end_date_day: 15,
    end_date_month: 6,
    end_date_year: 2024,
    end_date_hours: 16,
    end_date_minutes: 30,
    visibility: 'public',
    status: 'published',
    spotify_url: '',
    wavlake_url: '',
    contrib_cashapp: '',
    contrib_venmo: '',
    contrib_paypal: '',
    contrib_btclightning: '',
    cost: '',
    settings: {
      max_capacity: 100,
      show_capacity_count: true,
    },
    ...overrides,
  });

  const createMockApiResponse = (eventData: any) => ({
    success: true,
    message: 'Event created successfully',
    data: [eventData],
  });

  describe('mutation functionality', () => {
    it('creates event successfully and navigates to event page', async () => {
      const mockEventData = createMockEventData();
      const mockEvent = {
        id: 'event123',
        title: 'Test Event',
        description: 'Test event description',
      };
      const mockResponse = createMockApiResponse(mockEvent);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockEventData);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/create',
        mockEventData
      );
      expect(mutationResult).toEqual(mockEvent);
      expect(mockPush).toHaveBeenCalledWith('/e/event123');
    });

    it('validates event data before sending', async () => {
      const invalidEventData = {
        title: '', // Invalid: empty title
        description: 'Test description',
        location: 'Test Location',
        timezone: 'UTC',
        start_date_day: 15,
        start_date_month: 6,
        start_date_year: 2024,
        end_date_day: 15,
        end_date_month: 6,
        end_date_year: 2024,
        visibility: 'public',
        status: 'published',
      } as CreateEventData;

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(invalidEventData);
        } catch (error) {
          expect(error).toBeDefined();
          // Zod validation error should be thrown
        }
      });

      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('handles API error response', async () => {
      const mockEventData = createMockEventData();
      const apiError = new Error('API Error');
      mockApiClient.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockEventData);
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/create',
        mockEventData
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('handles invalid API response format', async () => {
      const mockEventData = createMockEventData();
      const invalidResponse = {
        success: true,
        data: null, // Invalid: data should be an array
      };
      mockApiClient.post.mockResolvedValue(invalidResponse);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockEventData);
        } catch (error) {
          expect(error).toEqual(new Error('Failed to create event'));
        }
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/create',
        mockEventData
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('handles empty data array in response', async () => {
      const mockEventData = createMockEventData();
      const emptyResponse = {
        success: true,
        data: [], // Empty array
      };
      mockApiClient.post.mockResolvedValue(emptyResponse);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockEventData);
        } catch (error) {
          expect(error).toEqual(new Error('Failed to create event'));
        }
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/create',
        mockEventData
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('handles missing response data', async () => {
      const mockEventData = createMockEventData();
      const noDataResponse = {
        success: true,
        // Missing data property
      };
      mockApiClient.post.mockResolvedValue(noDataResponse);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockEventData);
        } catch (error) {
          expect(error).toEqual(new Error('Failed to create event'));
        }
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/create',
        mockEventData
      );
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('handles null response', async () => {
      const mockEventData = createMockEventData();
      mockApiClient.post.mockResolvedValue(null as any);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockEventData);
        } catch (error) {
          expect(error).toEqual(new Error('Failed to create event'));
        }
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/create',
        mockEventData
      );
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe('mutation state', () => {
    it('tracks loading state correctly', async () => {
      const mockEventData = createMockEventData();
      const mockEvent = { id: 'event123', title: 'Test Event' };
      const mockResponse = createMockApiResponse(mockEvent);

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.post.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockEventData);
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
      const mockEventData = createMockEventData();
      const apiError = new Error('API Error');
      mockApiClient.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockEventData);
      });

      // Wait for error
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(apiError);
      });
    });

    it('tracks success state correctly', async () => {
      const mockEventData = createMockEventData();
      const mockEvent = { id: 'event123', title: 'Test Event' };
      const mockResponse = createMockApiResponse(mockEvent);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockEventData);
      });

      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual(mockEvent);
      });
    });

    it('resets mutation state', async () => {
      const mockEventData = createMockEventData();
      const mockEvent = { id: 'event123', title: 'Test Event' };
      const mockResponse = createMockApiResponse(mockEvent);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockEventData);
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

  describe('event data validation', () => {
    it('validates required fields', async () => {
      const incompleteEventData = {
        // Missing required fields
        description: 'Test description',
        location: 'Test Location',
        timezone: 'UTC',
        start_date_day: 15,
        start_date_month: 6,
        start_date_year: 2024,
        end_date_day: 15,
        end_date_month: 6,
        end_date_year: 2024,
        visibility: 'public',
        status: 'published',
      } as CreateEventData;

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(incompleteEventData);
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('validates date ranges', async () => {
      const invalidDateEventData = createMockEventData({
        start_date_year: 2023, // Invalid: before 2024
        end_date_year: 2023,
      });

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(invalidDateEventData);
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('validates URL formats', async () => {
      const invalidUrlEventData = createMockEventData({
        spotify_url: 'invalid-url', // Invalid URL format
        wavlake_url: 'not-a-url',
      });

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(invalidUrlEventData);
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('accepts valid event data with all optional fields', async () => {
      const completeEventData = createMockEventData({
        cover: 'https://example.com/cover.jpg',
        spotify_url: 'https://open.spotify.com/track/123',
        wavlake_url: 'https://wavlake.com/track/456',
        contrib_cashapp: '$testuser',
        contrib_venmo: '@testuser',
        contrib_paypal: 'test@example.com',
        contrib_btclightning: 'test@example.com',
        cost: '25.00',
        settings: {
          max_capacity: 50,
          show_capacity_count: false,
        },
      });

      const mockEvent = { id: 'event123', title: 'Complete Event' };
      const mockResponse = createMockApiResponse(mockEvent);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(completeEventData);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/create',
        completeEventData
      );
      expect(mockPush).toHaveBeenCalledWith('/e/event123');
    });
  });

  describe('navigation behavior', () => {
    it('navigates to event page on successful creation', async () => {
      const mockEventData = createMockEventData();
      const mockEvent = { id: 'event456', title: 'Navigation Test' };
      const mockResponse = createMockApiResponse(mockEvent);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockEventData);
      });

      expect(mockPush).toHaveBeenCalledWith('/e/event456');
    });

    it('does not navigate on error', async () => {
      const mockEventData = createMockEventData();
      const apiError = new Error('API Error');
      mockApiClient.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useCreateEvent(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockEventData);
        } catch (error) {
          // Expected error
        }
      });

      expect(mockPush).not.toHaveBeenCalled();
    });
  });
});

describe('useCreateEventWithCallbacks', () => {
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

  const createMockEventData = (
    overrides: Partial<CreateEventData> = {}
  ): CreateEventData => ({
    title: 'Test Event',
    description: 'Test event description',
    location: 'Test Location',
    timezone: 'UTC',
    cover: null,
    start_date_day: 15,
    start_date_month: 6,
    start_date_year: 2024,
    start_date_hours: 14,
    start_date_minutes: 30,
    end_date_day: 15,
    end_date_month: 6,
    end_date_year: 2024,
    end_date_hours: 16,
    end_date_minutes: 30,
    visibility: 'public',
    status: 'published',
    spotify_url: '',
    wavlake_url: '',
    contrib_cashapp: '',
    contrib_venmo: '',
    contrib_paypal: '',
    contrib_btclightning: '',
    cost: '',
    settings: {
      max_capacity: 100,
      show_capacity_count: true,
    },
    ...overrides,
  });

  const createMockApiResponse = (eventData: any) => ({
    success: true,
    message: 'Event created successfully',
    data: [eventData],
  });

  describe('mutation functionality', () => {
    it('creates event successfully without navigation', async () => {
      const mockEventData = createMockEventData();
      const mockEvent = {
        id: 'event123',
        title: 'Test Event',
        description: 'Test event description',
      };
      const mockResponse = createMockApiResponse(mockEvent);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateEventWithCallbacks(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockEventData);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/create',
        mockEventData
      );
      expect(mutationResult).toEqual(mockEvent);
      expect(mockPush).not.toHaveBeenCalled();
    });

    it('validates event data before sending', async () => {
      const invalidEventData = {
        title: '', // Invalid: empty title
        description: 'Test description',
        location: 'Test Location',
        timezone: 'UTC',
        start_date_day: 15,
        start_date_month: 6,
        start_date_year: 2024,
        end_date_day: 15,
        end_date_month: 6,
        end_date_year: 2024,
        visibility: 'public',
        status: 'published',
      } as CreateEventData;

      const { result } = renderHook(() => useCreateEventWithCallbacks(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(invalidEventData);
        } catch (error) {
          expect(error).toBeDefined();
        }
      });

      expect(mockApiClient.post).not.toHaveBeenCalled();
    });

    it('handles API error response', async () => {
      const mockEventData = createMockEventData();
      const apiError = new Error('API Error');
      mockApiClient.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useCreateEventWithCallbacks(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockEventData);
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/create',
        mockEventData
      );
    });

    it('handles invalid API response format', async () => {
      const mockEventData = createMockEventData();
      const invalidResponse = {
        success: true,
        data: null, // Invalid: data should be an array
      };
      mockApiClient.post.mockResolvedValue(invalidResponse);

      const { result } = renderHook(() => useCreateEventWithCallbacks(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockEventData);
        } catch (error) {
          expect(error).toEqual(new Error('Failed to create event'));
        }
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/create',
        mockEventData
      );
    });
  });

  describe('mutation state', () => {
    it('tracks loading state correctly', async () => {
      const mockEventData = createMockEventData();
      const mockEvent = { id: 'event123', title: 'Test Event' };
      const mockResponse = createMockApiResponse(mockEvent);

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.post.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useCreateEventWithCallbacks(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockEventData);
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
      const mockEventData = createMockEventData();
      const apiError = new Error('API Error');
      mockApiClient.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useCreateEventWithCallbacks(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockEventData);
      });

      // Wait for error
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(apiError);
      });
    });

    it('tracks success state correctly', async () => {
      const mockEventData = createMockEventData();
      const mockEvent = { id: 'event123', title: 'Test Event' };
      const mockResponse = createMockApiResponse(mockEvent);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateEventWithCallbacks(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockEventData);
      });

      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual(mockEvent);
      });
    });
  });

  describe('custom callback usage', () => {
    it('allows custom success handling', async () => {
      const mockEventData = createMockEventData();
      const mockEvent = { id: 'event123', title: 'Custom Callback Test' };
      const mockResponse = createMockApiResponse(mockEvent);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const customOnSuccess = jest.fn();
      const customOnError = jest.fn();

      const { result } = renderHook(() => useCreateEventWithCallbacks(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Use custom callbacks
      result.current.mutate(mockEventData, {
        onSuccess: customOnSuccess,
        onError: customOnError,
      });

      await waitFor(() => {
        expect(customOnSuccess).toHaveBeenCalledWith(
          mockEvent,
          mockEventData,
          undefined
        );
        expect(customOnError).not.toHaveBeenCalled();
      });
    });

    it('allows custom error handling', async () => {
      const mockEventData = createMockEventData();
      const apiError = new Error('Custom Error Test');
      mockApiClient.post.mockRejectedValue(apiError);

      const customOnSuccess = jest.fn();
      const customOnError = jest.fn();

      const { result } = renderHook(() => useCreateEventWithCallbacks(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Use custom callbacks
      result.current.mutate(mockEventData, {
        onSuccess: customOnSuccess,
        onError: customOnError,
      });

      await waitFor(() => {
        expect(customOnError).toHaveBeenCalledWith(
          apiError,
          mockEventData,
          undefined
        );
        expect(customOnSuccess).not.toHaveBeenCalled();
      });
    });
  });
});

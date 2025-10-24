import { apiClient } from '@/lib/api/client';
import {
  GenerateDescriptionParams,
  useGenerateDescription,
} from '@/lib/hooks/use-generate-description';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

// Mock console.error to avoid noise in tests
const mockConsoleError = jest.spyOn(console, 'error').mockImplementation(() => {});

describe('useGenerateDescription', () => {
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
    mockApiClient.post.mockReset();
  });

  afterAll(() => {
    mockConsoleError.mockRestore();
  });

  const createMockParams = (
    overrides: Partial<GenerateDescriptionParams> = {}
  ): GenerateDescriptionParams => ({
    title: 'Test Event',
    length: 'medium',
    tone: 'professional',
    ...overrides,
  });

  const createMockResponse = (description: string) => ({
    description,
  });

  // Helper function to mock the API client for generate-description endpoint
  const mockGenerateDescription = (response: { description: string }) => {
    mockApiClient.post.mockImplementation((url: string) => {
      if (url.includes('/v1/events/generate-description')) {
        return Promise.resolve(response);
      }
      return Promise.resolve({ description: 'fallback' });
    });
  };

  // Helper function to mock API error for generate-description endpoint
  const mockGenerateDescriptionError = (error: Error) => {
    mockApiClient.post.mockImplementation((url: string) => {
      if (url.includes('/v1/events/generate-description')) {
        return Promise.reject(error);
      }
      return Promise.resolve({ description: 'fallback' });
    });
  };

  describe('mutation functionality', () => {
    it('generates description successfully', async () => {
      const mockParams = createMockParams({
        title: 'Amazing Concert',
        location: 'Madison Square Garden',
        length: 'long',
        tone: 'exciting',
      });
      const mockResponse = createMockResponse(
        'Join us for an amazing concert at Madison Square Garden!'
      );
      mockGenerateDescription(mockResponse);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/generate-description',
        mockParams,
        { timeout: 60000 }
      );
      expect(result.current.data).toEqual(mockResponse);
    });

    it('handles API error', async () => {
      const mockParams = createMockParams();
      const apiError = new Error('API Error');
      mockGenerateDescriptionError(apiError);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Generate description error:', apiError);
    });

    it('handles response without description', async () => {
      const mockParams = createMockParams();
      const mockResponse = { message: 'Success' }; // Missing description
      mockApiClient.post.mockImplementation((url: string) => {
        if (url.includes('/v1/events/generate-description')) {
          return Promise.resolve(mockResponse);
        }
        return Promise.resolve({ description: 'fallback' });
      });

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect((error as Error).message).toBe('Failed to generate description');
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('handles null response', async () => {
      const mockParams = createMockParams();
      mockApiClient.post.mockImplementation((url: string) => {
        if (url.includes('/v1/events/generate-description')) {
          return Promise.resolve(null);
        }
        return Promise.resolve({ description: 'fallback' });
      });

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect((error as Error).message).toContain('Cannot read properties of null');
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('handles undefined response', async () => {
      const mockParams = createMockParams();
      mockApiClient.post.mockImplementation((url: string) => {
        if (url.includes('/v1/events/generate-description')) {
          return Promise.resolve(undefined);
        }
        return Promise.resolve({ description: 'fallback' });
      });

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect((error as Error).message).toContain('Cannot read properties of undefined');
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('handles empty description', async () => {
      const mockParams = createMockParams();
      const mockResponse = createMockResponse(''); // Empty description
      mockGenerateDescription(mockResponse);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect((error as Error).message).toBe('Failed to generate description');
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('mutation state', () => {
    it('tracks loading state correctly', async () => {
      const mockParams = createMockParams();
      const mockResponse = createMockResponse('Generated description');

      // Create a promise that we can control
      let resolvePromise: (value: { description: string }) => void;
      const controlledPromise = new Promise<{ description: string }>((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.post.mockImplementationOnce((url: string) => {
        if (url.includes('/v1/events/generate-description')) {
          return controlledPromise;
        }
        return Promise.resolve({ description: 'fallback' });
      });

      const { result } = renderHook(() => useGenerateDescription(), {
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

    it('tracks success state correctly', async () => {
      const mockParams = createMockParams();
      const mockResponse = createMockResponse('Generated description');
      mockGenerateDescription(mockResponse);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
      expect(result.current.data).toEqual(mockResponse);
    });

    it('tracks error state correctly', async () => {
      const mockParams = createMockParams();
      const apiError = new Error('API Error');
      mockGenerateDescriptionError(apiError);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      expect(result.current.error).toBe(apiError);
    });

    it('resets mutation state', async () => {
      const mockParams = createMockParams();
      const mockResponse = createMockResponse('Generated description');
      mockGenerateDescription(mockResponse);

      const { result } = renderHook(() => useGenerateDescription(), {
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

  describe('parameter validation', () => {
    it('handles minimal required parameters', async () => {
      const mockParams = createMockParams({
        title: 'Minimal Event',
        length: 'short',
        tone: 'casual',
      });
      const mockResponse = createMockResponse('Short description');
      mockGenerateDescription(mockResponse);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/generate-description',
        mockParams,
        { timeout: 60000 }
      );
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('handles all optional parameters', async () => {
      const mockParams = createMockParams({
        title: 'Complete Event',
        location: 'New York',
        startDate: '2024-06-15T10:00:00Z',
        endDate: '2024-06-15T18:00:00Z',
        timezone: 'America/New_York',
        visibility: 'public',
        spotifyUrl: 'https://spotify.com/playlist',
        cost: 50,
        currentDescription: 'Existing description',
        length: 'long',
        tone: 'exciting',
        customPrompt: 'Make it sound amazing',
        eventContext: 'Music festival',
        userPrompt: 'Include details about the lineup',
      });
      const mockResponse = createMockResponse('Complete description');
      mockGenerateDescription(mockResponse);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/generate-description',
        mockParams,
        { timeout: 60000 }
      );
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('handles different length options', async () => {
      const lengths: Array<'short' | 'medium' | 'long'> = ['short', 'medium', 'long'];

      for (const length of lengths) {
        const mockParams = createMockParams({ length });
        const mockResponse = createMockResponse(`${length} description`);
        mockGenerateDescription(mockResponse);

        const { result } = renderHook(() => useGenerateDescription(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await act(async () => {
          await result.current.mutateAsync(mockParams);
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });
        expect(result.current.data?.description).toBe(`${length} description`);
      }
    });

    it('handles different tone options', async () => {
      const tones: Array<'professional' | 'casual' | 'exciting'> = [
        'professional',
        'casual',
        'exciting',
      ];

      for (const tone of tones) {
        const mockParams = createMockParams({ tone });
        const mockResponse = createMockResponse(`${tone} description`);
        mockGenerateDescription(mockResponse);

        const { result } = renderHook(() => useGenerateDescription(), {
          wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
        });

        await act(async () => {
          await result.current.mutateAsync(mockParams);
        });

        await waitFor(() => {
          expect(result.current.isSuccess).toBe(true);
        });
        expect(result.current.data?.description).toBe(`${tone} description`);
      }
    });

    it('handles numeric cost parameter', async () => {
      const mockParams = createMockParams({
        cost: 25.99,
      });
      const mockResponse = createMockResponse('Description with cost');
      mockGenerateDescription(mockResponse);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/generate-description',
        expect.objectContaining({ cost: 25.99 }),
        { timeout: 60000 }
      );
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('handles string cost parameter', async () => {
      const mockParams = createMockParams({
        cost: 'Free',
      });
      const mockResponse = createMockResponse('Free event description');
      mockGenerateDescription(mockResponse);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/generate-description',
        expect.objectContaining({ cost: 'Free' }),
        { timeout: 60000 }
      );
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });
  });

  describe('API configuration', () => {
    it('uses correct endpoint', async () => {
      const mockParams = createMockParams();
      const mockResponse = createMockResponse('Description');
      mockGenerateDescription(mockResponse);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/generate-description',
        mockParams,
        { timeout: 60000 }
      );
    });

    it('uses correct timeout configuration', async () => {
      const mockParams = createMockParams();
      const mockResponse = createMockResponse('Description');
      mockGenerateDescription(mockResponse);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/generate-description',
        mockParams,
        { timeout: 60000 }
      );
    });
  });

  describe('error handling', () => {
    it('logs error to console', async () => {
      const mockParams = createMockParams();
      const apiError = new Error('Network error');
      mockGenerateDescriptionError(apiError);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });

      expect(mockConsoleError).toHaveBeenCalledWith('Generate description error:', apiError);
    });

    it('handles network timeout', async () => {
      const mockParams = createMockParams();
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      mockGenerateDescriptionError(timeoutError);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toBe(timeoutError);
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      expect(mockConsoleError).toHaveBeenCalledWith('Generate description error:', timeoutError);
    });

    it('handles server error', async () => {
      const mockParams = createMockParams();
      const serverError = new Error('Internal Server Error');
      mockGenerateDescriptionError(serverError);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockParams);
        } catch (error) {
          expect(error).toBe(serverError);
        }
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
      expect(mockConsoleError).toHaveBeenCalledWith('Generate description error:', serverError);
    });
  });

  describe('edge cases', () => {
    it('handles very long title', async () => {
      const longTitle = 'A'.repeat(1000);
      const mockParams = createMockParams({ title: longTitle });
      const mockResponse = createMockResponse('Description for long title');
      mockGenerateDescription(mockResponse);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/generate-description',
        expect.objectContaining({ title: longTitle }),
        { timeout: 60000 }
      );
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('handles special characters in parameters', async () => {
      const mockParams = createMockParams({
        title: 'Event with Special Chars: !@#$%^&*()',
        location: 'São Paulo, Brasil',
        customPrompt: 'Make it sound amazing! 🎉',
      });
      const mockResponse = createMockResponse('Description with special chars');
      mockGenerateDescription(mockResponse);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('handles empty optional parameters', async () => {
      const mockParams = createMockParams({
        title: 'Event',
        location: '',
        startDate: '',
        endDate: '',
        timezone: '',
        visibility: '',
        spotifyUrl: '',
        cost: '',
        currentDescription: '',
        customPrompt: '',
        eventContext: '',
        userPrompt: '',
      });
      const mockResponse = createMockResponse('Description');
      mockGenerateDescription(mockResponse);

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockParams);
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('handles multiple rapid mutations', async () => {
      const mockParams1 = createMockParams({ title: 'Event 1' });
      const mockParams2 = createMockParams({ title: 'Event 2' });
      const mockResponse1 = createMockResponse('Description 1');
      const mockResponse2 = createMockResponse('Description 2');

      mockApiClient.post
        .mockImplementationOnce((url: string) => {
          if (url.includes('/v1/events/generate-description')) {
            return Promise.resolve(mockResponse1);
          }
          return Promise.resolve({ description: 'fallback' });
        })
        .mockImplementationOnce((url: string) => {
          if (url.includes('/v1/events/generate-description')) {
            return Promise.resolve(mockResponse2);
          }
          return Promise.resolve({ description: 'fallback' });
        });

      const { result } = renderHook(() => useGenerateDescription(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // First mutation
      await act(async () => {
        await result.current.mutateAsync(mockParams1);
      });

      await waitFor(() => {
        expect(result.current.data?.description).toBe('Description 1');
      });

      // Second mutation
      await act(async () => {
        await result.current.mutateAsync(mockParams2);
      });

      await waitFor(() => {
        expect(result.current.data?.description).toBe('Description 2');
      });
      expect(mockApiClient.post).toHaveBeenCalledTimes(2);
    });
  });
});

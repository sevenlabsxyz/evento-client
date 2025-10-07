import {
  ContactSupportPayload,
  useContactSupport,
} from '@/lib/hooks/use-contact-support';
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

import apiClient from '@/lib/api/client';

const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useContactSupport', () => {
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

  const createMockPayload = (
    overrides: Partial<ContactSupportPayload> = {}
  ): ContactSupportPayload => ({
    subject: 'Test Subject',
    message: 'Test message content',
    ...overrides,
  });

  const createMockApiResponse = (data: any) => ({
    success: true,
    message: 'Success',
    data,
  });

  describe('mutation functionality', () => {
    it('sends contact support message successfully', async () => {
      const mockPayload = createMockPayload();
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Message sent successfully',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockPayload);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/contact',
        mockPayload
      );
      expect(mutationResult).toEqual({
        success: true,
        message: 'Message sent successfully',
      });
    });

    it('handles API success response', async () => {
      const mockPayload = createMockPayload({
        subject: 'Bug Report',
        message: 'I found a bug in the application',
      });
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Thank you for your feedback',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockPayload);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/contact', {
        subject: 'Bug Report',
        message: 'I found a bug in the application',
      });
    });

    it('handles API error response when success is false', async () => {
      const mockPayload = createMockPayload();
      const mockResponse = createMockApiResponse({
        success: false,
        message: 'Failed to send message',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockPayload);
        } catch (error) {
          expect(error).toEqual({
            message: 'Failed to send message',
          });
        }
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/contact',
        mockPayload
      );
    });

    it('handles API error response with default message', async () => {
      const mockPayload = createMockPayload();
      const mockResponse = createMockApiResponse({
        success: false,
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockPayload);
        } catch (error) {
          expect(error).toEqual({
            message: 'Failed to send message',
          });
        }
      });
    });

    it('handles network errors', async () => {
      const mockPayload = createMockPayload();
      const networkError = new Error('Network error');
      mockApiClient.post.mockRejectedValue(networkError);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockPayload);
        } catch (error) {
          expect(error).toBe(networkError);
        }
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/contact',
        mockPayload
      );
    });

    it('handles invalid response format', async () => {
      const mockPayload = createMockPayload();
      mockApiClient.post.mockResolvedValue(null as any);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockPayload);
        } catch (error) {
          expect(error).toEqual({
            message: 'Failed to send message',
          });
        }
      });
    });

    it('handles missing data in response', async () => {
      const mockPayload = createMockPayload();
      const mockResponse = {
        success: true,
        message: 'Success',
        // Missing data property
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockPayload);
        } catch (error) {
          expect(error).toEqual({
            message: 'Failed to send message',
          });
        }
      });
    });
  });

  describe('mutation state', () => {
    it('tracks loading state correctly', async () => {
      const mockPayload = createMockPayload();
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Message sent successfully',
      });

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.post.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockPayload);
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
      const mockPayload = createMockPayload();
      const networkError = new Error('Network error');
      mockApiClient.post.mockRejectedValue(networkError);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockPayload);
      });

      // Wait for error
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(networkError);
      });
    });

    it('tracks success state correctly', async () => {
      const mockPayload = createMockPayload();
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Message sent successfully',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockPayload);
      });

      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual({
          success: true,
          message: 'Message sent successfully',
        });
      });
    });

    it('resets mutation state', async () => {
      const mockPayload = createMockPayload();
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Message sent successfully',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockPayload);
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

  describe('payload validation', () => {
    it('handles empty subject', async () => {
      const mockPayload = createMockPayload({ subject: '' });
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Message sent successfully',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockPayload);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/contact', {
        subject: '',
        message: 'Test message content',
      });
    });

    it('handles empty message', async () => {
      const mockPayload = createMockPayload({ message: '' });
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Message sent successfully',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockPayload);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/contact', {
        subject: 'Test Subject',
        message: '',
      });
    });

    it('handles long subject and message', async () => {
      const longSubject = 'A'.repeat(1000);
      const longMessage = 'B'.repeat(5000);
      const mockPayload = createMockPayload({
        subject: longSubject,
        message: longMessage,
      });
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Message sent successfully',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockPayload);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/contact', {
        subject: longSubject,
        message: longMessage,
      });
    });

    it('handles special characters in subject and message', async () => {
      const mockPayload = createMockPayload({
        subject: 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
        message:
          'Message with "quotes" and \'apostrophes\' and newlines\nand tabs\t',
      });
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Message sent successfully',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockPayload);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/contact', {
        subject: 'Special chars: !@#$%^&*()_+-=[]{}|;:,.<>?',
        message:
          'Message with "quotes" and \'apostrophes\' and newlines\nand tabs\t',
      });
    });
  });

  describe('multiple mutations', () => {
    it('can perform multiple mutations sequentially', async () => {
      const mockPayload1 = createMockPayload({ subject: 'First message' });
      const mockPayload2 = createMockPayload({ subject: 'Second message' });
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Message sent successfully',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // First mutation
      await act(async () => {
        await result.current.mutateAsync(mockPayload1);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/contact',
        mockPayload1
      );

      // Second mutation
      await act(async () => {
        await result.current.mutateAsync(mockPayload2);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/contact',
        mockPayload2
      );
      expect(mockApiClient.post).toHaveBeenCalledTimes(2);
    });

    it('handles concurrent mutations', async () => {
      const mockPayload1 = createMockPayload({ subject: 'First message' });
      const mockPayload2 = createMockPayload({ subject: 'Second message' });
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Message sent successfully',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start both mutations
      act(() => {
        result.current.mutate(mockPayload1);
        result.current.mutate(mockPayload2);
      });

      // Wait for both to complete
      await waitFor(() => {
        expect(mockApiClient.post).toHaveBeenCalledTimes(2);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/contact',
        mockPayload1
      );
      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/contact',
        mockPayload2
      );
    });
  });

  describe('edge cases', () => {
    it('handles undefined payload properties', async () => {
      const mockPayload = {
        subject: undefined as any,
        message: undefined as any,
      };
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Message sent successfully',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockPayload);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/contact', {
        subject: undefined,
        message: undefined,
      });
    });

    it('handles null payload properties', async () => {
      const mockPayload = {
        subject: null as any,
        message: null as any,
      };
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Message sent successfully',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockPayload);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/contact', {
        subject: null,
        message: null,
      });
    });

    it('handles very large payload', async () => {
      const largeSubject = 'A'.repeat(10000);
      const largeMessage = 'B'.repeat(100000);
      const mockPayload = createMockPayload({
        subject: largeSubject,
        message: largeMessage,
      });
      const mockResponse = createMockApiResponse({
        success: true,
        message: 'Message sent successfully',
      });
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useContactSupport(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockPayload);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/contact', {
        subject: largeSubject,
        message: largeMessage,
      });
    });
  });
});

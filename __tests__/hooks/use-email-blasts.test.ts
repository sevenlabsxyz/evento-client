import {
  transformEmailBlastForUI,
  useCreateEmailBlast,
  useCreateEmailBlastWithCallbacks,
  useEmailBlasts,
} from '@/lib/hooks/use-email-blasts';
import { CreateEmailBlastForm, EmailBlast } from '@/lib/types/api';
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

describe('useEmailBlasts', () => {
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

  const createMockEmailBlast = (
    overrides: Partial<EmailBlast> = {}
  ): EmailBlast => ({
    id: 'blast123',
    event_id: 'event456',
    user_id: 'user789',
    message: 'Test email blast message',
    recipient_filter: 'all',
    status: 'sent',
    scheduled_for: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    recipientCount: 10,
    delivered: 8,
    failed: 1,
    pending: 1,
    ...overrides,
  });

  const createMockApiResponse = (data: EmailBlast[]) => ({
    success: true,
    message: 'Email blasts retrieved successfully',
    data,
  });

  describe('query functionality', () => {
    it('fetches email blasts successfully', async () => {
      const mockBlasts = [
        createMockEmailBlast({ id: 'blast1' }),
        createMockEmailBlast({ id: 'blast2' }),
      ];
      const mockResponse = createMockApiResponse(mockBlasts);
      mockApiClient.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEmailBlasts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(mockApiClient.get).toHaveBeenCalledWith(
        '/v1/events/email-blasts/event123'
      );
      expect(result.current.data).toEqual(mockBlasts);
    });

    it('returns empty array when response has no data', async () => {
      const mockResponse = {
        success: true,
        message: 'No email blasts found',
        data: null,
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEmailBlasts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('returns empty array when response data is not an array', async () => {
      const mockResponse = {
        success: true,
        message: 'Invalid data format',
        data: 'not an array',
      };
      mockApiClient.get.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useEmailBlasts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data).toEqual([]);
    });

    it('handles API error', async () => {
      const apiError = new Error('API Error');
      mockApiClient.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useEmailBlasts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });

      expect(result.current.error).toBe(apiError);
    });

    it('is disabled when eventId is empty', () => {
      const { result } = renderHook(() => useEmailBlasts(''), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });

    it('is disabled when eventId is null', () => {
      const { result } = renderHook(() => useEmailBlasts(null as any), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      expect(result.current.isLoading).toBe(false);
      expect(mockApiClient.get).not.toHaveBeenCalled();
    });
  });

  describe('query state', () => {
    it('tracks loading state correctly', async () => {
      const mockBlasts = [createMockEmailBlast()];
      const mockResponse = createMockApiResponse(mockBlasts);

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.get.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useEmailBlasts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Wait for loading state
      await waitFor(() => {
        expect(result.current.isLoading).toBe(true);
      });

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

    it('tracks error state correctly', async () => {
      const apiError = new Error('API Error');
      mockApiClient.get.mockRejectedValue(apiError);

      const { result } = renderHook(() => useEmailBlasts('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(apiError);
      });
    });
  });
});

describe('useCreateEmailBlast', () => {
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

  const createMockCreateForm = (
    overrides: Partial<CreateEmailBlastForm> = {}
  ): CreateEmailBlastForm => ({
    message: 'Test email blast message',
    recipientFilter: 'all',
    scheduledFor: null,
    ...overrides,
  });

  const createMockEmailBlast = (
    overrides: Partial<EmailBlast> = {}
  ): EmailBlast => ({
    id: 'blast123',
    event_id: 'event456',
    user_id: 'user789',
    message: 'Test email blast message',
    recipient_filter: 'all',
    status: 'draft',
    scheduled_for: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  const createMockApiResponse = (data: EmailBlast) => ({
    success: true,
    message: 'Email blast created successfully',
    data,
  });

  describe('mutation functionality', () => {
    it('creates email blast successfully', async () => {
      const mockForm = createMockCreateForm();
      const mockBlast = createMockEmailBlast();
      const mockResponse = createMockApiResponse(mockBlast);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateEmailBlast('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockForm);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/email-blasts/event123',
        mockForm
      );
      expect(mutationResult).toEqual(mockBlast);
    });

    it('handles API error response', async () => {
      const mockForm = createMockCreateForm();
      const apiError = new Error('API Error');
      mockApiClient.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useCreateEmailBlast('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockForm);
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/email-blasts/event123',
        mockForm
      );
    });

    it('handles invalid response format', async () => {
      const mockForm = createMockCreateForm();
      const invalidResponse = {
        success: true,
        message: 'Created but no data',
        data: null,
      };
      mockApiClient.post.mockResolvedValue(invalidResponse);

      const { result } = renderHook(() => useCreateEmailBlast('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockForm);
        } catch (error) {
          expect(error).toEqual(new Error('Failed to create email blast'));
        }
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/email-blasts/event123',
        mockForm
      );
    });

    it('handles null response', async () => {
      const mockForm = createMockCreateForm();
      mockApiClient.post.mockResolvedValue(null as any);

      const { result } = renderHook(() => useCreateEmailBlast('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockForm);
        } catch (error) {
          expect(error).toEqual(new Error('Failed to create email blast'));
        }
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/email-blasts/event123',
        mockForm
      );
    });
  });

  describe('query invalidation', () => {
    it('invalidates email blasts query on successful creation', async () => {
      const mockForm = createMockCreateForm();
      const mockBlast = createMockEmailBlast();
      const mockResponse = createMockApiResponse(mockBlast);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateEmailBlast('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        await result.current.mutateAsync(mockForm);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['emailBlasts', 'event123'],
      });
    });

    it('does not invalidate queries on error', async () => {
      const mockForm = createMockCreateForm();
      const apiError = new Error('API Error');
      mockApiClient.post.mockRejectedValue(apiError);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(() => useCreateEmailBlast('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockForm);
        } catch (error) {
          // Expected error
        }
      });

      expect(invalidateQueriesSpy).not.toHaveBeenCalled();
    });
  });

  describe('mutation state', () => {
    it('tracks loading state correctly', async () => {
      const mockForm = createMockCreateForm();
      const mockBlast = createMockEmailBlast();
      const mockResponse = createMockApiResponse(mockBlast);

      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.post.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useCreateEmailBlast('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockForm);
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
      const mockForm = createMockCreateForm();
      const apiError = new Error('API Error');
      mockApiClient.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useCreateEmailBlast('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockForm);
      });

      // Wait for error
      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(apiError);
      });
    });

    it('tracks success state correctly', async () => {
      const mockForm = createMockCreateForm();
      const mockBlast = createMockEmailBlast();
      const mockResponse = createMockApiResponse(mockBlast);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useCreateEmailBlast('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Start mutation
      act(() => {
        result.current.mutate(mockForm);
      });

      // Wait for success
      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual(mockBlast);
      });
    });
  });

  describe('error logging', () => {
    it('logs error to console on mutation error', async () => {
      const mockForm = createMockCreateForm();
      const apiError = new Error('API Error');
      mockApiClient.post.mockRejectedValue(apiError);

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useCreateEmailBlast('event123'), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(mockForm);
        } catch (error) {
          // Expected error
        }
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Create email blast error:',
        apiError
      );
      consoleSpy.mockRestore();
    });
  });
});

describe('useCreateEmailBlastWithCallbacks', () => {
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

  const createMockCreateForm = (
    overrides: Partial<CreateEmailBlastForm> = {}
  ): CreateEmailBlastForm => ({
    message: 'Test email blast message',
    recipientFilter: 'all',
    scheduledFor: null,
    ...overrides,
  });

  const createMockEmailBlast = (
    overrides: Partial<EmailBlast> = {}
  ): EmailBlast => ({
    id: 'blast123',
    event_id: 'event456',
    user_id: 'user789',
    message: 'Test email blast message',
    recipient_filter: 'all',
    status: 'draft',
    scheduled_for: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  });

  const createMockApiResponse = (data: EmailBlast) => ({
    success: true,
    message: 'Email blast created successfully',
    data,
  });

  describe('mutation functionality', () => {
    it('creates email blast successfully without error logging', async () => {
      const mockForm = createMockCreateForm();
      const mockBlast = createMockEmailBlast();
      const mockResponse = createMockApiResponse(mockBlast);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(
        () => useCreateEmailBlastWithCallbacks('event123'),
        {
          wrapper: ({ children }) =>
            createTestWrapper(queryClient)({ children }),
        }
      );

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(mockForm);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/email-blasts/event123',
        mockForm
      );
      expect(mutationResult).toEqual(mockBlast);
    });

    it('handles API error response', async () => {
      const mockForm = createMockCreateForm();
      const apiError = new Error('API Error');
      mockApiClient.post.mockRejectedValue(apiError);

      const { result } = renderHook(
        () => useCreateEmailBlastWithCallbacks('event123'),
        {
          wrapper: ({ children }) =>
            createTestWrapper(queryClient)({ children }),
        }
      );

      await act(async () => {
        try {
          await result.current.mutateAsync(mockForm);
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/email-blasts/event123',
        mockForm
      );
    });

    it('handles invalid response format', async () => {
      const mockForm = createMockCreateForm();
      const invalidResponse = {
        success: true,
        message: 'Created but no data',
        data: null,
      };
      mockApiClient.post.mockResolvedValue(invalidResponse);

      const { result } = renderHook(
        () => useCreateEmailBlastWithCallbacks('event123'),
        {
          wrapper: ({ children }) =>
            createTestWrapper(queryClient)({ children }),
        }
      );

      await act(async () => {
        try {
          await result.current.mutateAsync(mockForm);
        } catch (error) {
          expect(error).toEqual(new Error('Failed to create email blast'));
        }
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/email-blasts/event123',
        mockForm
      );
    });
  });

  describe('query invalidation', () => {
    it('invalidates email blasts query on successful creation', async () => {
      const mockForm = createMockCreateForm();
      const mockBlast = createMockEmailBlast();
      const mockResponse = createMockApiResponse(mockBlast);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

      const { result } = renderHook(
        () => useCreateEmailBlastWithCallbacks('event123'),
        {
          wrapper: ({ children }) =>
            createTestWrapper(queryClient)({ children }),
        }
      );

      await act(async () => {
        await result.current.mutateAsync(mockForm);
      });

      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey: ['emailBlasts', 'event123'],
      });
    });
  });

  describe('custom callback usage', () => {
    it('allows custom success handling', async () => {
      const mockForm = createMockCreateForm();
      const mockBlast = createMockEmailBlast();
      const mockResponse = createMockApiResponse(mockBlast);
      mockApiClient.post.mockResolvedValue(mockResponse);

      const customOnSuccess = jest.fn();
      const customOnError = jest.fn();

      const { result } = renderHook(
        () => useCreateEmailBlastWithCallbacks('event123'),
        {
          wrapper: ({ children }) =>
            createTestWrapper(queryClient)({ children }),
        }
      );

      // Use custom callbacks
      result.current.mutate(mockForm, {
        onSuccess: customOnSuccess,
        onError: customOnError,
      });

      await waitFor(() => {
        expect(customOnSuccess).toHaveBeenCalledWith(
          mockBlast,
          mockForm,
          undefined
        );
        expect(customOnError).not.toHaveBeenCalled();
      });
    });

    it('allows custom error handling', async () => {
      const mockForm = createMockCreateForm();
      const apiError = new Error('Custom Error Test');
      mockApiClient.post.mockRejectedValue(apiError);

      const customOnSuccess = jest.fn();
      const customOnError = jest.fn();

      const { result } = renderHook(
        () => useCreateEmailBlastWithCallbacks('event123'),
        {
          wrapper: ({ children }) =>
            createTestWrapper(queryClient)({ children }),
        }
      );

      // Use custom callbacks
      result.current.mutate(mockForm, {
        onSuccess: customOnSuccess,
        onError: customOnError,
      });

      await waitFor(() => {
        expect(customOnError).toHaveBeenCalledWith(
          apiError,
          mockForm,
          undefined
        );
        expect(customOnSuccess).not.toHaveBeenCalled();
      });
    });
  });
});

describe('transformEmailBlastForUI', () => {
  const createMockEmailBlast = (
    overrides: Partial<EmailBlast> = {}
  ): EmailBlast => ({
    id: 'blast123',
    event_id: 'event456',
    user_id: 'user789',
    message: 'Test email blast message',
    recipient_filter: 'all',
    status: 'sent',
    scheduled_for: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    recipientCount: 10,
    delivered: 8,
    failed: 1,
    pending: 1,
    ...overrides,
  });

  describe('subject extraction', () => {
    it('extracts subject from first line of message', () => {
      const blast = createMockEmailBlast({
        message: 'This is the subject\nThis is the body content',
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.subject).toBe('This is the subject');
    });

    it('limits subject to 50 characters', () => {
      const longMessage = 'A'.repeat(60) + '\nThis is the body';
      const blast = createMockEmailBlast({
        message: longMessage,
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.subject).toBe('A'.repeat(50));
    });

    it('removes HTML tags from subject', () => {
      const blast = createMockEmailBlast({
        message: '<h1>Subject Line</h1>\n<p>Body content</p>',
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.subject).toBe('Subject Line');
    });

    it('handles empty message', () => {
      const blast = createMockEmailBlast({
        message: '',
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.subject).toBe('No subject');
    });

    it('handles message with only HTML tags', () => {
      const blast = createMockEmailBlast({
        message: '<div><span></span></div>',
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.subject).toBe('No subject');
    });

    it('trims whitespace from subject', () => {
      const blast = createMockEmailBlast({
        message: '   Subject Line   \nBody content',
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.subject).toBe('Subject Line');
    });
  });

  describe('recipient filter mapping', () => {
    it('maps all filter correctly', () => {
      const blast = createMockEmailBlast({
        recipient_filter: 'all',
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.recipients).toBe('All RSVPs');
    });

    it('maps yes_only filter correctly', () => {
      const blast = createMockEmailBlast({
        recipient_filter: 'yes_only',
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.recipients).toBe('RSVP: Yes');
    });

    it('maps yes_and_maybe filter correctly', () => {
      const blast = createMockEmailBlast({
        recipient_filter: 'yes_and_maybe',
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.recipients).toBe('RSVP: Yes & Maybe');
    });

    it('handles unknown filter with fallback', () => {
      const blast = createMockEmailBlast({
        recipient_filter: 'unknown_filter' as any,
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.recipients).toBe('All Recipients');
    });
  });

  describe('statistics handling', () => {
    it('uses API values when available', () => {
      const blast = createMockEmailBlast({
        recipientCount: 25,
        delivered: 20,
        failed: 3,
        pending: 2,
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.recipientCount).toBe(25);
      expect(result.delivered).toBe(20);
      expect(result.failed).toBe(3);
      expect(result.pending).toBe(2);
    });

    it('uses default values when API values are missing', () => {
      const blast = createMockEmailBlast({
        recipientCount: undefined,
        delivered: undefined,
        failed: undefined,
        pending: undefined,
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.recipientCount).toBe(0);
      expect(result.delivered).toBe(0);
      expect(result.failed).toBe(0);
      expect(result.pending).toBe(0);
    });

    it('preserves all original properties', () => {
      const blast = createMockEmailBlast({
        id: 'custom-id',
        event_id: 'custom-event',
        user_id: 'custom-user',
        status: 'draft',
        scheduled_for: '2024-12-31T23:59:59Z',
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.id).toBe('custom-id');
      expect(result.event_id).toBe('custom-event');
      expect(result.user_id).toBe('custom-user');
      expect(result.status).toBe('draft');
      expect(result.scheduled_for).toBe('2024-12-31T23:59:59Z');
      expect(result.created_at).toBe('2024-01-01T00:00:00Z');
      expect(result.updated_at).toBe('2024-01-01T00:00:00Z');
    });
  });

  describe('edge cases', () => {
    it('handles message with only newlines', () => {
      const blast = createMockEmailBlast({
        message: '\n\n\n',
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.subject).toBe('No subject');
    });

    it('handles message with only whitespace', () => {
      const blast = createMockEmailBlast({
        message: '   \n  \n  ',
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.subject).toBe('No subject');
    });

    it('handles very long HTML content', () => {
      const longHtml = '<div>' + 'x'.repeat(100) + '</div>';
      const blast = createMockEmailBlast({
        message: longHtml,
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.subject).toBe('x'.repeat(50));
    });

    it('handles mixed content with HTML and text', () => {
      const blast = createMockEmailBlast({
        message: '<p>Subject</p>More content\nAnother line',
      });

      const result = transformEmailBlastForUI(blast);

      expect(result.subject).toBe('SubjectMore content');
    });
  });
});

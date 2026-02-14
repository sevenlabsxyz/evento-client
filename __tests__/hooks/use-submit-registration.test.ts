import { useSubmitRegistration } from '@/lib/hooks/use-submit-registration';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

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

describe('useSubmitRegistration', () => {
  let queryClient: QueryClient;

  const createSubmitData = (overrides = {}) => ({
    eventId: 'event_123',
    email: 'test@example.com',
    name: 'Test User',
    answers: [
      { question_id: 'q1', answer: 'Answer 1' },
      { question_id: 'q2', answer: 'Answer 2' },
    ],
    ...overrides,
  });

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    jest.clearAllMocks();
  });

  describe('mutation functionality', () => {
    it('submits registration successfully', async () => {
      const mockResponse = {
        data: {
          registration_id: 'reg_123',
          status: 'pending',
          auto_approved: false,
          message: 'Registration submitted successfully',
        },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSubmitRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const submitData = createSubmitData();

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync(submitData);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/event_123/registration/submit', {
        email: submitData.email,
        name: submitData.name,
        answers: submitData.answers,
      });
      expect(mutationResult).toEqual(mockResponse.data);
    });

    it('handles auto-approved registration', async () => {
      const mockResponse = {
        data: {
          registration_id: 'reg_123',
          status: 'approved',
          auto_approved: true,
          rsvp_id: 'rsvp_456',
          message: 'Registration auto-approved',
        },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSubmitRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.mutate(createSubmitData());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data?.auto_approved).toBe(true);
      });
    });

    it('handles API error response', async () => {
      const apiError = new Error('Registration failed');
      mockApiClient.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useSubmitRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync(createSubmitData());
        } catch (error) {
          expect(error).toBe(apiError);
        }
      });

      expect(mockApiClient.post).toHaveBeenCalled();
    });

    it('handles duplicate registration error', async () => {
      const duplicateError = {
        response: {
          status: 409,
          data: { message: 'You have already registered for this event' },
        },
      };
      mockApiClient.post.mockRejectedValue(duplicateError);

      const { result } = renderHook(() => useSubmitRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.mutate(createSubmitData());
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('mutation state', () => {
    it('tracks loading state correctly', async () => {
      const mockResponse = {
        data: {
          registration_id: 'reg_123',
          status: 'pending',
          auto_approved: false,
          message: 'Success',
        },
      };

      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.post.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useSubmitRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.mutate(createSubmitData());
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(true);
      });

      await act(async () => {
        resolvePromise!(mockResponse);
      });

      await waitFor(() => {
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      });
    });

    it('tracks error state correctly', async () => {
      const apiError = new Error('Server error');
      mockApiClient.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useSubmitRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.mutate(createSubmitData());
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(apiError);
      });
    });

    it('resets mutation state', async () => {
      const mockResponse = {
        data: {
          registration_id: 'reg_123',
          status: 'pending',
          auto_approved: false,
          message: 'Success',
        },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSubmitRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.mutate(createSubmitData());
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      act(() => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(result.current.isIdle).toBe(true);
        expect(result.current.isSuccess).toBe(false);
      });
    });
  });

  describe('registration data handling', () => {
    it('submits registration with required answers', async () => {
      const mockResponse = {
        data: {
          registration_id: 'reg_123',
          status: 'pending',
          auto_approved: false,
          message: 'Success',
        },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSubmitRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const submitData = createSubmitData({
        eventId: 'event_456',
        answers: [
          { question_id: 'q1', answer: 'John Doe' },
          { question_id: 'q2', answer: 'john@example.com' },
        ],
      });

      await act(async () => {
        await result.current.mutateAsync(submitData);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/event_456/registration/submit', {
        email: submitData.email,
        name: submitData.name,
        answers: submitData.answers,
      });
    });

    it('submits registration with empty answers when not required', async () => {
      const mockResponse = {
        data: {
          registration_id: 'reg_123',
          status: 'approved',
          auto_approved: true,
          message: 'Success',
        },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useSubmitRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      const submitData = createSubmitData({
        eventId: 'event_789',
        answers: [],
      });

      await act(async () => {
        await result.current.mutateAsync(submitData);
      });

      expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/event_789/registration/submit', {
        email: submitData.email,
        name: submitData.name,
        answers: [],
      });
    });
  });
});

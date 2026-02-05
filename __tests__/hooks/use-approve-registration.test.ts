import { useApproveRegistration } from '@/lib/hooks/use-approve-registration';
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

describe('useApproveRegistration', () => {
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

  describe('mutation functionality', () => {
    it('approves registration successfully', async () => {
      const mockResponse = {
        data: {
          registration: {
            id: 'reg_123',
            approval_status: 'approved',
            reviewed_at: '2024-01-15T10:30:00Z',
            reviewed_by: 'host_user_123',
          },
          rsvp: {
            id: 'rsvp_456',
            status: 'going',
          },
        },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useApproveRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      let mutationResult: any;
      await act(async () => {
        mutationResult = await result.current.mutateAsync({
          eventId: 'event_123',
          registrationId: 'reg_123',
        });
      });

      expect(mockApiClient.post).toHaveBeenCalledWith(
        '/v1/events/event_123/registration/submissions/reg_123/approve'
      );
      expect(mutationResult).toEqual(mockResponse.data);
    });

    it('handles approval with RSVP creation', async () => {
      const mockResponse = {
        data: {
          registration: {
            id: 'reg_123',
            approval_status: 'approved',
            reviewed_at: '2024-01-15T10:30:00Z',
            reviewed_by: 'host_user_123',
          },
          rsvp: {
            id: 'rsvp_new',
            status: 'going',
          },
        },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useApproveRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        const data = await result.current.mutateAsync({
          eventId: 'event_123',
          registrationId: 'reg_123',
        });
        expect(data.rsvp).not.toBeNull();
        expect(data.rsvp?.status).toBe('going');
      });
    });

    it('handles approval without RSVP (already exists)', async () => {
      const mockResponse = {
        data: {
          registration: {
            id: 'reg_123',
            approval_status: 'approved',
            reviewed_at: '2024-01-15T10:30:00Z',
            reviewed_by: 'host_user_123',
          },
          rsvp: null,
        },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useApproveRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        const data = await result.current.mutateAsync({
          eventId: 'event_123',
          registrationId: 'reg_123',
        });
        expect(data.rsvp).toBeNull();
      });
    });

    it('handles API error response', async () => {
      const apiError = new Error('Approval failed');
      mockApiClient.post.mockRejectedValue(apiError);

      const { result } = renderHook(() => useApproveRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.mutate({
          eventId: 'event_123',
          registrationId: 'reg_123',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(apiError);
      });

      expect(mockApiClient.post).toHaveBeenCalled();
    });

    it('handles unauthorized error (non-host)', async () => {
      const unauthorizedError = {
        response: {
          status: 403,
          data: { message: 'You are not authorized to approve registrations' },
        },
      };
      mockApiClient.post.mockRejectedValue(unauthorizedError);

      const { result } = renderHook(() => useApproveRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.mutate({
          eventId: 'event_123',
          registrationId: 'reg_123',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('handles not found error (registration not found)', async () => {
      const notFoundError = {
        response: {
          status: 404,
          data: { message: 'Registration not found' },
        },
      };
      mockApiClient.post.mockRejectedValue(notFoundError);

      const { result } = renderHook(() => useApproveRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.mutate({
          eventId: 'event_123',
          registrationId: 'nonexistent_reg',
        });
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
          registration: {
            id: 'reg_123',
            approval_status: 'approved',
            reviewed_at: '2024-01-15T10:30:00Z',
            reviewed_by: 'host_user_123',
          },
          rsvp: null,
        },
      };

      let resolvePromise: (value: any) => void;
      const controlledPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });
      mockApiClient.post.mockReturnValue(controlledPromise);

      const { result } = renderHook(() => useApproveRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.mutate({
          eventId: 'event_123',
          registrationId: 'reg_123',
        });
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

      const { result } = renderHook(() => useApproveRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.mutate({
          eventId: 'event_123',
          registrationId: 'reg_123',
        });
      });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
        expect(result.current.error).toBe(apiError);
      });
    });

    it('tracks success state correctly', async () => {
      const mockResponse = {
        data: {
          registration: {
            id: 'reg_123',
            approval_status: 'approved',
            reviewed_at: '2024-01-15T10:30:00Z',
            reviewed_by: 'host_user_123',
          },
          rsvp: {
            id: 'rsvp_456',
            status: 'going',
          },
        },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useApproveRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.mutate({
          eventId: 'event_123',
          registrationId: 'reg_123',
        });
      });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
        expect(result.current.data).toEqual(mockResponse.data);
      });
    });

    it('resets mutation state', async () => {
      const mockResponse = {
        data: {
          registration: {
            id: 'reg_123',
            approval_status: 'approved',
            reviewed_at: '2024-01-15T10:30:00Z',
            reviewed_by: 'host_user_123',
          },
          rsvp: null,
        },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useApproveRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      act(() => {
        result.current.mutate({
          eventId: 'event_123',
          registrationId: 'reg_123',
        });
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

  describe('edge cases', () => {
    it('handles already approved registration', async () => {
      const mockResponse = {
        data: {
          registration: {
            id: 'reg_123',
            approval_status: 'approved',
            reviewed_at: '2024-01-15T10:30:00Z',
            reviewed_by: 'host_user_123',
          },
          rsvp: null,
        },
      };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const { result } = renderHook(() => useApproveRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      await act(async () => {
        const data = await result.current.mutateAsync({
          eventId: 'event_123',
          registrationId: 'reg_123',
        });
        expect(data.registration.approval_status).toBe('approved');
      });
    });

    it('handles multiple sequential approvals', async () => {
      const createMockResponse = (regId: string) => ({
        data: {
          registration: {
            id: regId,
            approval_status: 'approved',
            reviewed_at: new Date().toISOString(),
            reviewed_by: 'host_user_123',
          },
          rsvp: { id: `rsvp_${regId}`, status: 'going' },
        },
      });

      mockApiClient.post
        .mockResolvedValueOnce(createMockResponse('reg_1'))
        .mockResolvedValueOnce(createMockResponse('reg_2'))
        .mockResolvedValueOnce(createMockResponse('reg_3'));

      const { result } = renderHook(() => useApproveRegistration(), {
        wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      });

      // Approve three registrations sequentially
      for (const regId of ['reg_1', 'reg_2', 'reg_3']) {
        await act(async () => {
          await result.current.mutateAsync({
            eventId: 'event_123',
            registrationId: regId,
          });
        });
      }

      expect(mockApiClient.post).toHaveBeenCalledTimes(3);
    });
  });
});

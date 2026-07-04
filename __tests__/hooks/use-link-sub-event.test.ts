import { useLinkSubEvent } from '@/lib/hooks/use-link-sub-event';
import { queryKeys } from '@/lib/query-client';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
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

describe('useLinkSubEvent', () => {
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

  it('links a sub event successfully', async () => {
    const mockResponse = {
      success: true,
      message: 'Sub event linked successfully',
      data: { id: 'evt_child', parent_event_id: 'evt_parent' },
    };
    mockApiClient.post.mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useLinkSubEvent(), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    let mutationResult: any;
    await act(async () => {
      mutationResult = await result.current.mutateAsync({
        parentEventId: 'evt_parent',
        subEventId: 'evt_child',
      });
    });

    expect(mockApiClient.post).toHaveBeenCalledWith('/v1/events/evt_parent/sub-events', {
      event_id: 'evt_child',
    });
    expect(mutationResult).toEqual({ id: 'evt_child', parent_event_id: 'evt_parent' });
  });

  it('invalidates the parent sub-events query on success', async () => {
    const mockResponse = {
      success: true,
      message: 'Sub event linked successfully',
      data: { id: 'evt_child', parent_event_id: 'evt_parent' },
    };
    mockApiClient.post.mockResolvedValue(mockResponse);

    const invalidateSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useLinkSubEvent(), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await act(async () => {
      await result.current.mutateAsync({
        parentEventId: 'evt_parent',
        subEventId: 'evt_child',
      });
    });

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.eventSubEvents('evt_parent'),
    });
  });

  it('throws when the response has no data', async () => {
    mockApiClient.post.mockResolvedValue({ success: false, message: 'Not allowed' });

    const { result } = renderHook(() => useLinkSubEvent(), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          parentEventId: 'evt_parent',
          subEventId: 'evt_child',
        })
      ).rejects.toThrow('Failed to link sub event');
    });
  });

  it('propagates API errors', async () => {
    const apiError = new Error('Network error');
    mockApiClient.post.mockRejectedValue(apiError);

    const { result } = renderHook(() => useLinkSubEvent(), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await act(async () => {
      await expect(
        result.current.mutateAsync({
          parentEventId: 'evt_parent',
          subEventId: 'evt_child',
        })
      ).rejects.toThrow('Network error');
    });
  });
});

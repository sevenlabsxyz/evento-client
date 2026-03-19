import { useMyHostedRegistrations } from '@/lib/hooks/use-my-hosted-registrations';
import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
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

describe('useMyHostedRegistrations', () => {
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

  it('returns hosted registrations from a flat ApiResponse payload', async () => {
    const mockHostedRegistrations = [
      {
        event: { id: 'event_123', title: 'Hosted Event' },
        registration_counts: { pending: 2, approved: 1, denied: 0, total: 3 },
        latest_registrations: [],
      },
    ];

    mockApiClient.get.mockResolvedValue({
      data: mockHostedRegistrations,
    } as never);

    const { result } = renderHook(() => useMyHostedRegistrations(), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/user/events/registrations?status=pending');
    expect(result.current.data).toEqual(mockHostedRegistrations);
  });

  it('returns hosted registrations from a nested data payload', async () => {
    const mockHostedRegistrations = [
      {
        event: { id: 'event_456', title: 'Nested Event' },
        registration_counts: { pending: 5, approved: 0, denied: 0, total: 5 },
        latest_registrations: [{ id: 'reg_1' }],
      },
    ];

    mockApiClient.get.mockResolvedValue({
      data: {
        data: mockHostedRegistrations,
      },
    } as never);

    const { result } = renderHook(() => useMyHostedRegistrations('all'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/user/events/registrations?status=all');
    expect(result.current.data).toEqual(mockHostedRegistrations);
  });
});

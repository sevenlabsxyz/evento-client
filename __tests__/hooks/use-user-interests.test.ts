import { useReplaceInterests } from '@/lib/hooks/use-user-interests';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

jest.mock('@/lib/api/client', () => {
  const mockClient = {
    get: jest.fn(),
    patch: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  };

  return {
    apiClient: mockClient,
    default: mockClient,
  };
});

import { apiClient as mockApiClient } from '@/lib/api/client';

const mockApiClientTyped = mockApiClient as any;

describe('useReplaceInterests', () => {
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

  it('dedupes interest IDs before sending the PUT request', async () => {
    mockApiClientTyped.put.mockResolvedValue({
      data: [
        { id: 'int_a', slug: 'bitcoin' },
        { id: 'int_b', slug: 'nostr' },
      ],
    });

    const { result } = renderHook(() => useReplaceInterests(), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await act(async () => {
      await result.current.mutateAsync(['int_a', 'int_a', 'int_b', 'int_b']);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockApiClientTyped.put).toHaveBeenCalledWith('/v1/user/interests', {
      interest_ids: ['int_a', 'int_b'],
    });
  });
});

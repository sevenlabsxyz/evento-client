import { useEventoCashProfile } from '@/lib/hooks/use-evento-cash-profile';
import { EventoCashProfileService } from '@/lib/services/evento-cash-profile';
import { QueryClient } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock the EventoCashProfileService
jest.mock('@/lib/services/evento-cash-profile', () => ({
  EventoCashProfileService: {
    fetchProfile: jest.fn(),
  },
}));

const mockFetchProfile = EventoCashProfileService.fetchProfile as jest.MockedFunction<
  typeof EventoCashProfileService.fetchProfile
>;

describe('useEventoCashProfile', () => {
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

  it('fetches profile for valid @evento.cash address', async () => {
    const mockProfile = {
      username: 'alice',
      displayName: 'Alice Smith',
      avatar: 'https://example.com/alice.jpg',
    };

    mockFetchProfile.mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useEventoCashProfile('alice@evento.cash'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockProfile);
    expect(mockFetchProfile).toHaveBeenCalledWith('alice@evento.cash');
  });

  it('is disabled for non-@evento.cash addresses', () => {
    const { result } = renderHook(() => useEventoCashProfile('alice@walletofsatoshi.com'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    // Should not be loading because query is disabled
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFetchProfile).not.toHaveBeenCalled();
  });

  it('is disabled for undefined address', () => {
    const { result } = renderHook(() => useEventoCashProfile(undefined), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFetchProfile).not.toHaveBeenCalled();
  });

  it('is disabled for empty string address', () => {
    const { result } = renderHook(() => useEventoCashProfile(''), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFetchProfile).not.toHaveBeenCalled();
  });

  it('handles null response from service gracefully', async () => {
    mockFetchProfile.mockResolvedValue(null);

    const { result } = renderHook(() => useEventoCashProfile('nonexistent@evento.cash'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toBeNull();
    expect(result.current.isError).toBe(false);
  });

  it('handles service errors gracefully', async () => {
    const error = new Error('Network error');
    mockFetchProfile.mockRejectedValue(error);

    const { result } = renderHook(() => useEventoCashProfile('alice@evento.cash'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(error);
  });

  it('respects 5-minute stale time', async () => {
    const mockProfile = {
      username: 'alice',
      displayName: 'Alice Smith',
      avatar: 'https://example.com/alice.jpg',
    };

    mockFetchProfile.mockResolvedValue(mockProfile);

    const { result } = renderHook(() => useEventoCashProfile('alice@evento.cash'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Check stale time is 5 minutes (300000ms)
    const queryCache = queryClient.getQueryCache();
    const query = queryCache.find({ queryKey: ['eventoCashProfile', 'alice@evento.cash'] });
    expect(query?.options.staleTime).toBe(5 * 60 * 1000);
  });

  it('refetches when lightning address changes', async () => {
    const mockProfile1 = {
      username: 'alice',
      displayName: 'Alice Smith',
      avatar: 'https://example.com/alice.jpg',
    };

    const mockProfile2 = {
      username: 'bob',
      displayName: 'Bob Jones',
      avatar: 'https://example.com/bob.jpg',
    };

    mockFetchProfile.mockResolvedValueOnce(mockProfile1).mockResolvedValueOnce(mockProfile2);

    const { result, rerender } = renderHook(({ address }) => useEventoCashProfile(address), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      initialProps: { address: 'alice@evento.cash' },
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockProfile1);
    });

    // Change to different address
    rerender({ address: 'bob@evento.cash' });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockProfile2);
    });

    expect(mockFetchProfile).toHaveBeenCalledTimes(2);
    expect(mockFetchProfile).toHaveBeenNthCalledWith(1, 'alice@evento.cash');
    expect(mockFetchProfile).toHaveBeenNthCalledWith(2, 'bob@evento.cash');
  });

  it('does not refetch when switching from valid to invalid address', async () => {
    const mockProfile = {
      username: 'alice',
      displayName: 'Alice Smith',
      avatar: 'https://example.com/alice.jpg',
    };

    mockFetchProfile.mockResolvedValue(mockProfile);

    const { result, rerender } = renderHook(({ address }) => useEventoCashProfile(address), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
      initialProps: { address: 'alice@evento.cash' },
    });

    await waitFor(() => {
      expect(result.current.data).toEqual(mockProfile);
    });

    // Change to invalid address - should disable query
    rerender({ address: 'alice@other.com' });

    // Should keep previous data but not be loading
    expect(result.current.isLoading).toBe(false);
    expect(result.current.fetchStatus).toBe('idle');
    expect(mockFetchProfile).toHaveBeenCalledTimes(1);
  });
});

import { useEventSearch, useUserSearch } from '@/lib/hooks/use-search';
import { QueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

// Mock the event transform utility
jest.mock('@/lib/utils/event-transform', () => ({
  transformApiEventToDisplay: jest.fn((event) => ({
    id: event.id,
    title: event.title,
    description: event.description,
    computedStartDate: event.computed_start_date,
    computedEndDate: event.computed_end_date,
    location: { name: event.location, city: '', country: '' },
    coverImages: event.cover ? [event.cover] : [],
    hosts: [],
    guests: [],
    guestListSettings: { isPublic: true, allowPublicRSVP: true },
    perks: [],
    details: {},
    capacity: undefined,
    weather: undefined,
    type: 'social',
    tags: [],
    isActive: event.status === 'published',
    registrationUrl: undefined,
    contactEnabled: true,
    owner: undefined,
  })),
}));

describe('useEventSearch', () => {
  let queryClient: QueryClient;
  let wrapper: ReturnType<typeof createTestWrapper>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
        mutations: { retry: false },
      },
    });
    wrapper = createTestWrapper(queryClient);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should return a mutation object with correct initial state', () => {
    const { result } = renderHook(() => useEventSearch(), { wrapper });

    expect(result.current).toMatchObject({
      mutate: expect.any(Function),
      mutateAsync: expect.any(Function),
      isPending: false,
      isError: false,
      isSuccess: false,
      data: undefined,
      error: null,
    });
  });

  it('should search for events successfully', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockEvents = [
      {
        id: 'event1',
        title: 'Test Event 1',
        description: 'Test Description 1',
        location: 'Test Location 1',
        computed_start_date: '2024-01-01T10:00:00Z',
        computed_end_date: '2024-01-01T12:00:00Z',
        cover: 'test-cover1.jpg',
        status: 'published',
        visibility: 'public',
      },
      {
        id: 'event2',
        title: 'Test Event 2',
        description: 'Test Description 2',
        location: 'Test Location 2',
        computed_start_date: '2024-01-02T10:00:00Z',
        computed_end_date: '2024-01-02T12:00:00Z',
        cover: null,
        status: 'published',
        visibility: 'public',
      },
    ];

    mockApiClient.get.mockResolvedValueOnce({
      data: mockEvents,
    });

    const { result } = renderHook(() => useEventSearch(), { wrapper });

    await act(async () => {
      result.current.mutate('test query');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/event/search?s=test%20query');
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toMatchObject({
      id: 'event1',
      title: 'Test Event 1',
      description: 'Test Description 1',
    });
  });

  it('should return empty array for empty query', async () => {
    const { result } = renderHook(() => useEventSearch(), { wrapper });

    await act(async () => {
      result.current.mutate('');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('should return empty array for whitespace-only query', async () => {
    const { result } = renderHook(() => useEventSearch(), { wrapper });

    await act(async () => {
      result.current.mutate('   ');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('should handle API errors gracefully', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockApiClient.get.mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useEventSearch(), { wrapper });

    await act(async () => {
      result.current.mutate('test query');
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should encode query parameters correctly', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const specialQuery = 'test & query with special chars!@#$%';

    mockApiClient.get.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useEventSearch(), { wrapper });

    await act(async () => {
      result.current.mutate(specialQuery);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      `/v1/event/search?s=${encodeURIComponent(specialQuery)}`
    );
  });

  it('should transform API events using transformApiEventToDisplay', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const { transformApiEventToDisplay } = require('@/lib/utils/event-transform');

    const mockEvent = {
      id: 'event1',
      title: 'Test Event',
      description: 'Test Description',
      location: 'Test Location',
      computed_start_date: '2024-01-01T10:00:00Z',
      computed_end_date: '2024-01-01T12:00:00Z',
      cover: 'test-cover.jpg',
      status: 'published',
      visibility: 'public',
    };

    mockApiClient.get.mockResolvedValueOnce({
      data: [mockEvent],
    });

    const { result } = renderHook(() => useEventSearch(), { wrapper });

    await act(async () => {
      result.current.mutate('test query');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(transformApiEventToDisplay).toHaveBeenCalledWith(mockEvent);
  });

  it('should handle case when transformApiEventToDisplay returns null', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const { transformApiEventToDisplay } = require('@/lib/utils/event-transform');

    // Mock transformApiEventToDisplay to return null
    transformApiEventToDisplay.mockReturnValueOnce(null);

    const mockEvent = {
      id: 'event1',
      title: 'Test Event',
      description: 'Test Description',
    };

    mockApiClient.get.mockResolvedValueOnce({
      data: [mockEvent],
    });

    const { result } = renderHook(() => useEventSearch(), { wrapper });

    await act(async () => {
      result.current.mutate('test query');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // When transformApiEventToDisplay returns null, null should be returned
    expect(result.current.data?.[0]).toBeNull();
  });
});

describe('useUserSearch', () => {
  let queryClient: QueryClient;
  let wrapper: ReturnType<typeof createTestWrapper>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
        mutations: { retry: false },
      },
    });
    wrapper = createTestWrapper(queryClient);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should return a mutation object with correct initial state', () => {
    const { result } = renderHook(() => useUserSearch(), { wrapper });

    expect(result.current).toMatchObject({
      mutate: expect.any(Function),
      mutateAsync: expect.any(Function),
      isPending: false,
      isError: false,
      isSuccess: false,
      data: undefined,
      error: null,
    });
  });

  it('should search for users successfully', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const mockUsers = [
      {
        id: 'user1',
        username: 'testuser1',
        name: 'Test User 1',
        verification_status: 'verified',
        image: 'test-image1.jpg',
      },
      {
        id: 'user2',
        username: 'testuser2',
        name: 'Test User 2',
        verification_status: 'pending',
        image: 'test-image2.jpg',
      },
    ];

    mockApiClient.get.mockResolvedValueOnce({
      data: mockUsers,
    });

    const { result } = renderHook(() => useUserSearch(), { wrapper });

    await act(async () => {
      result.current.mutate('test query');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/user/search?s=test%20query');
    expect(result.current.data).toEqual(mockUsers);
    expect(result.current.data).toHaveLength(2);
    expect(result.current.data?.[0]).toMatchObject({
      id: 'user1',
      username: 'testuser1',
      name: 'Test User 1',
      verification_status: 'verified',
      image: 'test-image1.jpg',
    });
  });

  it('should return empty array for empty query', async () => {
    const { result } = renderHook(() => useUserSearch(), { wrapper });

    await act(async () => {
      result.current.mutate('');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('should return empty array for whitespace-only query', async () => {
    const { result } = renderHook(() => useUserSearch(), { wrapper });

    await act(async () => {
      result.current.mutate('   ');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('should handle API errors gracefully', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    mockApiClient.get.mockRejectedValueOnce(new Error('API Error'));

    const { result } = renderHook(() => useUserSearch(), { wrapper });

    await act(async () => {
      result.current.mutate('test query');
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should encode query parameters correctly', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const specialQuery = 'test & query with special chars!@#$%';

    mockApiClient.get.mockResolvedValueOnce({ data: [] });

    const { result } = renderHook(() => useUserSearch(), { wrapper });

    await act(async () => {
      result.current.mutate(specialQuery);
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith(
      `/v1/user/search?s=${encodeURIComponent(specialQuery)}`
    );
  });

  it('should handle empty search results', async () => {
    const mockApiClient = require('@/lib/api/client').default;

    mockApiClient.get.mockResolvedValueOnce({
      data: [],
    });

    const { result } = renderHook(() => useUserSearch(), { wrapper });

    await act(async () => {
      result.current.mutate('nonexistent user');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([]);
  });

  it('should handle malformed API response', async () => {
    const mockApiClient = require('@/lib/api/client').default;

    mockApiClient.get.mockResolvedValueOnce({
      data: null,
    });

    const { result } = renderHook(() => useUserSearch(), { wrapper });

    await act(async () => {
      result.current.mutate('test query');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toBeNull();
  });

  it('should handle network timeout errors', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const timeoutError = new Error('Request timeout');
    timeoutError.name = 'TimeoutError';
    mockApiClient.get.mockRejectedValueOnce(timeoutError);

    const { result } = renderHook(() => useUserSearch(), { wrapper });

    await act(async () => {
      result.current.mutate('test query');
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(timeoutError);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });

  it('should handle 404 errors gracefully', async () => {
    const mockApiClient = require('@/lib/api/client').default;
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    const notFoundError = new Error('Not Found');
    (notFoundError as any).response = { status: 404 };
    mockApiClient.get.mockRejectedValueOnce(notFoundError);

    const { result } = renderHook(() => useUserSearch(), { wrapper });

    await act(async () => {
      result.current.mutate('test query');
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBe(notFoundError);
    expect(consoleErrorSpy).toHaveBeenCalled();

    consoleErrorSpy.mockRestore();
  });
});

describe('Integration Tests', () => {
  let queryClient: QueryClient;
  let wrapper: ReturnType<typeof createTestWrapper>;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false, staleTime: 0 },
        mutations: { retry: false },
      },
    });
    wrapper = createTestWrapper(queryClient);
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('should work with both hooks simultaneously', async () => {
    const mockApiClient = require('@/lib/api/client').default;

    const mockEvents = [
      {
        id: 'event1',
        title: 'Test Event',
        description: 'Test Description',
        location: 'Test Location',
        computed_start_date: '2024-01-01T10:00:00Z',
        computed_end_date: '2024-01-01T12:00:00Z',
        cover: null,
        status: 'published',
        visibility: 'public',
      },
    ];

    const mockUsers = [
      {
        id: 'user1',
        username: 'testuser',
        name: 'Test User',
        verification_status: 'verified',
        image: 'test-image.jpg',
      },
    ];

    mockApiClient.get
      .mockResolvedValueOnce({ data: mockEvents })
      .mockResolvedValueOnce({ data: mockUsers });

    const { result: eventResult } = renderHook(() => useEventSearch(), {
      wrapper,
    });
    const { result: userResult } = renderHook(() => useUserSearch(), {
      wrapper,
    });

    await act(async () => {
      eventResult.current.mutate('test');
      userResult.current.mutate('test');
    });

    await waitFor(() => {
      expect(eventResult.current.isSuccess).toBe(true);
      expect(userResult.current.isSuccess).toBe(true);
    });

    expect(eventResult.current.data).toHaveLength(1);
    expect(userResult.current.data).toHaveLength(1);
  });

  it('should handle rapid successive calls', async () => {
    const mockApiClient = require('@/lib/api/client').default;

    mockApiClient.get.mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useEventSearch(), { wrapper });

    // Make rapid successive calls
    await act(async () => {
      result.current.mutate('query1');
      result.current.mutate('query2');
      result.current.mutate('query3');
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Should have made multiple API calls
    expect(mockApiClient.get).toHaveBeenCalledTimes(3);
  });
});

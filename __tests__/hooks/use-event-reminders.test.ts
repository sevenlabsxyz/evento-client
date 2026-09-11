import {
  FOURTH_REMINDER_ERROR,
  INVALID_REMINDER_OFFSET_ERROR,
  parseEventReminders,
  sanitizeReminderOffsets,
  toggleReminderOffset,
  useEventReminders,
  useUpdateEventReminders,
  validateReminderOffsetsForSave,
} from '@/lib/hooks/use-event-reminders';
import { queryKeys } from '@/lib/query-client';
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

describe('reminder offset helpers', () => {
  it('keeps only the allowed offset literals', () => {
    expect(sanitizeReminderOffsets(['1h', '2d', '3d', '1h', 'soon'])).toEqual(['1h', '3d']);
  });

  it('rejects unknown offsets on save', () => {
    const result = validateReminderOffsetsForSave(['1h', '2d']);

    expect(result.error).toBe(INVALID_REMINDER_OFFSET_ERROR);
    expect(result.offsets).toEqual(['1h']);
  });

  it('blocks a fourth selected reminder', () => {
    const result = toggleReminderOffset(['1h', '2h', '1d'], '3d');

    expect(result.error).toBe(FOURTH_REMINDER_ERROR);
    expect(result.offsets).toEqual(['1h', '2h', '1d']);
  });

  it('rejects more than three offsets on save', () => {
    const result = validateReminderOffsetsForSave(['1h', '2h', '3h', '1d']);

    expect(result.error).toBe(FOURTH_REMINDER_ERROR);
    expect(result.offsets).toEqual(['1h', '2h', '3h']);
  });

  it('parses API reminder payloads', () => {
    expect(parseEventReminders({ offsets: ['3d', '1h', 'nope'] })).toEqual({
      offsets: ['1h', '3d'],
    });
    expect(parseEventReminders(null)).toEqual({ offsets: [] });
  });
});

describe('useEventReminders', () => {
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

  it('fetches reminder offsets for an event', async () => {
    mockApiClient.get.mockResolvedValue({
      success: true,
      message: 'ok',
      data: { offsets: ['1h', '1d'] },
    });

    const { result } = renderHook(() => useEventReminders('evt_123'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(mockApiClient.get).toHaveBeenCalledWith('/v1/events/evt_123/reminders', {
      suppressErrorStatuses: [404],
    });
    expect(result.current.data).toEqual({ offsets: ['1h', '1d'] });
    expect(queryKeys.eventReminders('evt_123')).toEqual(['events', 'evt_123', 'reminders']);
  });

  it('treats a missing reminders endpoint as an empty selection', async () => {
    mockApiClient.get.mockRejectedValue({
      success: false,
      status: 404,
      message: 'Not found',
    });

    const { result } = renderHook(() => useEventReminders('evt_123'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual({ offsets: [] });
  });

  it('does not fetch when eventId is empty', () => {
    const { result } = renderHook(() => useEventReminders(''), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    expect(result.current.isLoading).toBe(false);
    expect(mockApiClient.get).not.toHaveBeenCalled();
  });
});

describe('useUpdateEventReminders', () => {
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

  it('saves the offsets array to the API', async () => {
    mockApiClient.put.mockResolvedValue({
      success: true,
      message: 'Reminders updated',
      data: { offsets: ['2h', '1d'] },
    });

    const { result } = renderHook(() => useUpdateEventReminders('evt_123'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    let saved: { offsets: string[] } | undefined;
    await act(async () => {
      saved = await result.current.mutateAsync(['2h', '1d']);
    });

    expect(mockApiClient.put).toHaveBeenCalledWith('/v1/events/evt_123/reminders', {
      offsets: ['2h', '1d'],
    });
    expect(saved).toEqual({ offsets: ['2h', '1d'] });
  });

  it('does not call the API when a fourth offset is submitted', async () => {
    const { result } = renderHook(() => useUpdateEventReminders('evt_123'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await act(async () => {
      await expect(result.current.mutateAsync(['1h', '2h', '3h', '1d'] as any)).rejects.toThrow(
        FOURTH_REMINDER_ERROR
      );
    });

    expect(mockApiClient.put).not.toHaveBeenCalled();
  });

  it('does not call the API when an unknown offset is submitted', async () => {
    const { result } = renderHook(() => useUpdateEventReminders('evt_123'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await act(async () => {
      await expect(result.current.mutateAsync(['1h', '2d'] as any)).rejects.toThrow(
        INVALID_REMINDER_OFFSET_ERROR
      );
    });

    expect(mockApiClient.put).not.toHaveBeenCalled();
  });

  it('invalidates the reminders query after a successful save', async () => {
    mockApiClient.put.mockResolvedValue({
      success: true,
      message: 'Reminders updated',
      data: { offsets: ['8h'] },
    });

    const invalidateQueriesSpy = jest.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateEventReminders('evt_123'), {
      wrapper: ({ children }) => createTestWrapper(queryClient)({ children }),
    });

    await act(async () => {
      await result.current.mutateAsync(['8h']);
    });

    expect(invalidateQueriesSpy).toHaveBeenCalledWith({
      queryKey: queryKeys.eventReminders('evt_123'),
    });
  });
});

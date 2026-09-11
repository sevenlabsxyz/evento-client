import apiClient from '@/lib/api/client';
import { queryKeys } from '@/lib/query-client';
import type { ApiError, ApiResponse } from '@/lib/types/api';
import {
  EVENT_REMINDER_OFFSETS,
  MAX_EVENT_REMINDERS,
  type EventReminderOffset,
  type EventReminders,
  type UpdateEventRemindersBody,
} from '@/lib/types/api';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export const FOURTH_REMINDER_ERROR = 'You can select up to 3 reminders';
export const INVALID_REMINDER_OFFSET_ERROR =
  'Only 1h, 2h, 3h, 8h, 1d, and 3d reminders are allowed';

const EMPTY_REMINDERS: EventReminders = { offsets: [] };

export function isEventReminderOffset(value: unknown): value is EventReminderOffset {
  return typeof value === 'string' && (EVENT_REMINDER_OFFSETS as readonly string[]).includes(value);
}

export function sanitizeReminderOffsets(offsets: unknown): EventReminderOffset[] {
  if (!Array.isArray(offsets)) {
    return [];
  }

  const unique = new Set<EventReminderOffset>();

  for (const offset of offsets) {
    if (isEventReminderOffset(offset)) {
      unique.add(offset);
    }
  }

  return EVENT_REMINDER_OFFSETS.filter((offset) => unique.has(offset));
}

export function parseEventReminders(data: unknown): EventReminders {
  if (!data || typeof data !== 'object') {
    return EMPTY_REMINDERS;
  }

  const offsets = 'offsets' in data ? (data as { offsets: unknown }).offsets : [];
  return { offsets: sanitizeReminderOffsets(offsets) };
}

export function toggleReminderOffset(
  current: EventReminderOffset[],
  offset: EventReminderOffset
): { offsets: EventReminderOffset[]; error?: string } {
  if (!isEventReminderOffset(offset)) {
    return { offsets: current, error: INVALID_REMINDER_OFFSET_ERROR };
  }

  const selected = new Set(sanitizeReminderOffsets(current));

  if (selected.has(offset)) {
    selected.delete(offset);
    return { offsets: EVENT_REMINDER_OFFSETS.filter((value) => selected.has(value)) };
  }

  if (selected.size >= MAX_EVENT_REMINDERS) {
    return {
      offsets: EVENT_REMINDER_OFFSETS.filter((value) => selected.has(value)),
      error: FOURTH_REMINDER_ERROR,
    };
  }

  selected.add(offset);
  return { offsets: EVENT_REMINDER_OFFSETS.filter((value) => selected.has(value)) };
}

export function validateReminderOffsetsForSave(offsets: unknown): {
  offsets: EventReminderOffset[];
  error?: string;
} {
  if (!Array.isArray(offsets)) {
    return { offsets: [], error: INVALID_REMINDER_OFFSET_ERROR };
  }

  if (offsets.some((offset) => !isEventReminderOffset(offset))) {
    return { offsets: sanitizeReminderOffsets(offsets), error: INVALID_REMINDER_OFFSET_ERROR };
  }

  const sanitized = sanitizeReminderOffsets(offsets);

  if (offsets.length > MAX_EVENT_REMINDERS || sanitized.length > MAX_EVENT_REMINDERS) {
    return { offsets: sanitized.slice(0, MAX_EVENT_REMINDERS), error: FOURTH_REMINDER_ERROR };
  }

  return { offsets: sanitized };
}

function isMissingRemindersError(error: unknown): error is ApiError {
  if (!error || typeof error !== 'object') {
    return false;
  }

  return (error as ApiError).status === 404;
}

async function getEventReminders(eventId: string): Promise<EventReminders> {
  try {
    const response = await apiClient.get<ApiResponse<EventReminders>>(
      `/v1/events/${eventId}/reminders`,
      {
        suppressErrorStatuses: [404],
      }
    );

    return parseEventReminders(response?.data ?? response);
  } catch (error) {
    if (isMissingRemindersError(error)) {
      return EMPTY_REMINDERS;
    }

    throw error;
  }
}

export function useEventReminders(eventId: string) {
  return useQuery({
    queryKey: queryKeys.eventReminders(eventId),
    queryFn: () => getEventReminders(eventId),
    enabled: !!eventId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateEventReminders(eventId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (offsets: EventReminderOffset[]): Promise<EventReminders> => {
      const validation = validateReminderOffsetsForSave(offsets);

      if (validation.error) {
        throw new Error(validation.error);
      }

      const body: UpdateEventRemindersBody = { offsets: validation.offsets };
      const response = await apiClient.put<ApiResponse<EventReminders>>(
        `/v1/events/${eventId}/reminders`,
        body
      );

      return parseEventReminders(response?.data ?? response);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(queryKeys.eventReminders(eventId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.eventReminders(eventId) });
    },
  });
}

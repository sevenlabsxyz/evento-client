import apiClient from '@/lib/api/client';
import { Env } from '@/lib/constants/env';
import { queryKeys } from '@/lib/query-client';
import type { ApiResponse } from '@/lib/types/api';
import type { EventSales } from '@/lib/types/manage';
import { useQuery } from '@tanstack/react-query';

// The sales endpoint omits `ticketTypes` / `discountCodes` when their lookups return no rows
type EventSalesPayload = Omit<EventSales, 'ticketTypes' | 'discountCodes' | 'salesOverTime'> &
  Partial<Pick<EventSales, 'ticketTypes' | 'discountCodes' | 'salesOverTime'>>;

/**
 * Sales summary for the host dashboard (ticketed events)
 */
export function useEventSales(eventId: string) {
  return useQuery({
    queryKey: queryKeys.eventSales(eventId),
    queryFn: async (): Promise<EventSales> => {
      const response = await apiClient.get<ApiResponse<EventSalesPayload>>(
        `/v1/events/${eventId}/sales`
      );
      const data = response?.data;

      if (!data) {
        throw new Error('Failed to load sales data');
      }

      return {
        summary: data.summary,
        ticketTypes: data.ticketTypes ?? [],
        salesOverTime: data.salesOverTime ?? [],
        discountCodes: data.discountCodes ?? [],
      };
    },
    enabled: !!eventId,
  });
}

async function readExportErrorMessage(response: Response): Promise<string> {
  const fallback = `Failed to export attendees (status ${response.status})`;

  try {
    const body: unknown = await response.json();
    if (body && typeof body === 'object' && 'message' in body) {
      const { message } = body as { message?: unknown };
      if (typeof message === 'string' && message.length > 0) {
        return message;
      }
    }
  } catch {
    // Non-JSON error body; use the fallback message.
  }

  return fallback;
}

/**
 * Download the attendee list for an event as a CSV file (host only)
 */
export async function downloadAttendeesCsv(eventId: string): Promise<void> {
  const response = await fetch(`${Env.NEXT_PUBLIC_API_URL}/v1/events/${eventId}/sales/export`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error(await readExportErrorMessage(response));
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `attendees-${eventId}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Defer revocation so the browser has started reading the blob before the URL disappears
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

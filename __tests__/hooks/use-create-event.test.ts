import { useCreateEvent } from '@/lib/hooks/use-create-event';
import { CreateEventData } from '@/lib/schemas/event';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

function makeValidCreateData(overrides: Partial<CreateEventData> = {}): CreateEventData {
  return {
    title: 'Test Event',
    description: 'Desc',
    location: 'Somewhere',
    timezone: 'UTC',
    cover: null,
    start_date_day: 1,
    start_date_month: 1,
    start_date_year: 2025,
    start_date_hours: 10,
    start_date_minutes: 0,
    end_date_day: 1,
    end_date_month: 1,
    end_date_year: 2025,
    end_date_hours: 12,
    end_date_minutes: 0,
    visibility: 'private',
    status: 'published',
    spotify_url: '',
    wavlake_url: '',
    contrib_cashapp: '',
    contrib_venmo: '',
    contrib_paypal: '',
    contrib_btclightning: '',
    cost: '',
    settings: { max_capacity: 100, show_capacity_count: true },
    ...overrides,
  };
}

describe('useCreateEvent', () => {
  it('creates event successfully', async () => {
    const { result } = renderHook(() => useCreateEvent(), { wrapper: createTestWrapper() });

    result.current.mutate(makeValidCreateData());

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(
      expect.objectContaining({ id: expect.any(String), title: 'Test Event' })
    );
  });

  it('handles validation errors', async () => {
    const { result } = renderHook(() => useCreateEvent(), { wrapper: createTestWrapper() });

    result.current.mutate(makeValidCreateData({ title: '' }));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

import { useUpsertRSVP } from '@/lib/hooks/use-upsert-rsvp';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

describe('useUpsertRSVP', () => {
  it('creates a new RSVP (no existing)', async () => {
    const { result } = renderHook(() => useUpsertRSVP(), { wrapper: createTestWrapper() });

    result.current.mutate({ eventId: 'evt_1', status: 'yes', hasExisting: false });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(
      expect.objectContaining({ event_id: 'evt_1', status: 'yes' })
    );
  });

  it('updates an existing RSVP', async () => {
    const { result } = renderHook(() => useUpsertRSVP(), { wrapper: createTestWrapper() });

    result.current.mutate({ eventId: 'evt_1', status: 'maybe', hasExisting: true });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(
      expect.objectContaining({ event_id: 'evt_1', status: 'maybe' })
    );
  });
});

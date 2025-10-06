import {
  useCreateEmailBlast,
  useEmailBlasts,
} from '@/lib/hooks/use-email-blasts';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

const EVENT_ID = 'evt_1';

describe('Event Management Hooks', () => {
  describe('useEmailBlasts', () => {
    it('fetches email blasts list', async () => {
      const { result } = renderHook(() => useEmailBlasts(EVENT_ID), {
        wrapper: createTestWrapper(),
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'blast_1',
            event_id: EVENT_ID,
            message: '<p>Hello!</p>',
            recipient_filter: 'all',
            status: 'sent',
          }),
        ])
      );
    });
  });

  describe('useCreateEmailBlast', () => {
    it('creates an email blast', async () => {
      const { result } = renderHook(() => useCreateEmailBlast(EVENT_ID), {
        wrapper: createTestWrapper(),
      });

      result.current.mutate({
        message: '<p>Hello!</p>',
        recipientFilter: 'all',
      });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(
        expect.objectContaining({
          id: 'blast_new',
          event_id: EVENT_ID,
          message: '<p>Hello!</p>',
          recipient_filter: 'all',
          status: 'sent',
        })
      );
    });
  });
});

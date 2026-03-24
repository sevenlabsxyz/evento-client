import { EventRSVP, UserDetails } from '@/lib/types/api';
import {
  buildBatchZapRecipients,
  getBatchZapDistribution,
  validateBatchZap,
} from '@/lib/utils/batch-zap';

const createUser = (overrides: Partial<UserDetails> = {}): UserDetails => ({
  id: 'user-1',
  username: 'user1',
  name: 'User One',
  email: 'user1@example.com',
  bio: '',
  image: '',
  verification_status: 'verified',
  ...overrides,
});

const createRsvp = (overrides: Partial<EventRSVP> = {}): EventRSVP => ({
  id: 'rsvp-1',
  event_id: 'event-1',
  user_id: 'user-1',
  status: 'yes',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  user_details: createUser({
    id: 'user-1',
    username: 'user1',
    name: 'User One',
    ln_address: 'user1@evento.cash',
  }),
  ...overrides,
});

describe('buildBatchZapRecipients', () => {
  it('excludes hosts and self for host viewers', () => {
    const rsvps = [
      createRsvp({
        id: 'host-rsvp',
        user_id: 'host-1',
        user_details: createUser({
          id: 'host-1',
          username: 'host1',
          name: 'Host One',
          ln_address: 'host1@evento.cash',
        }),
      }),
      createRsvp({
        id: 'self-rsvp',
        user_id: 'viewer-1',
        user_details: createUser({
          id: 'viewer-1',
          username: 'viewer',
          name: 'Viewer',
          ln_address: 'viewer@evento.cash',
        }),
      }),
      createRsvp({
        id: 'guest-rsvp',
        user_id: 'guest-1',
        user_details: createUser({
          id: 'guest-1',
          username: 'guest1',
          name: 'Guest One',
          ln_address: 'guest1@evento.cash',
        }),
      }),
    ];

    const summary = buildBatchZapRecipients({
      rsvps,
      creatorUserId: 'host-1',
      hostUserIds: ['cohost-1'],
      currentUserId: 'viewer-1',
      isViewerHost: true,
    });

    expect(summary.eligibleRecipients.map((recipient) => recipient.userId)).toEqual(['guest-1']);
    expect(summary.excludedHosts.map((rsvp) => rsvp.user_id)).toEqual(['host-1']);
    expect(summary.excludedSelf.map((rsvp) => rsvp.user_id)).toEqual(['viewer-1']);
  });

  it('includes hosts for non-host viewers while still excluding self and missing wallets', () => {
    const rsvps = [
      createRsvp({
        id: 'host-rsvp',
        user_id: 'host-1',
        user_details: createUser({
          id: 'host-1',
          username: 'host1',
          name: 'Host One',
          ln_address: 'host1@evento.cash',
        }),
      }),
      createRsvp({
        id: 'self-rsvp',
        user_id: 'guest-self',
        user_details: createUser({
          id: 'guest-self',
          username: 'guestself',
          name: 'Guest Self',
          ln_address: 'self@evento.cash',
        }),
      }),
      createRsvp({
        id: 'no-wallet-rsvp',
        user_id: 'guest-2',
        user_details: createUser({
          id: 'guest-2',
          username: 'guest2',
          name: 'Guest Two',
          ln_address: '',
        }),
      }),
    ];

    const summary = buildBatchZapRecipients({
      rsvps,
      creatorUserId: 'host-1',
      hostUserIds: [],
      currentUserId: 'guest-self',
      isViewerHost: false,
    });

    expect(summary.eligibleRecipients.map((recipient) => recipient.userId)).toEqual(['host-1']);
    expect(summary.excludedHosts).toEqual([]);
    expect(summary.excludedSelf.map((rsvp) => rsvp.user_id)).toEqual(['guest-self']);
    expect(summary.excludedNoLightning.map((rsvp) => rsvp.user_id)).toEqual(['guest-2']);
  });
});

describe('batch zap distribution and validation', () => {
  it('calculates total-split using floor division and keeps the remainder', () => {
    expect(getBatchZapDistribution('total-split', 101, 4)).toEqual({
      amountMode: 'total-split',
      enteredAmountSats: 101,
      recipientCount: 4,
      perRecipientAmountSats: 25,
      totalAmountSats: 100,
      leftoverSats: 1,
    });
  });

  it('rejects total-split amounts that drop below the per-person minimum', () => {
    const validation = validateBatchZap({
      amountMode: 'total-split',
      enteredAmountSats: 19,
      recipientCount: 4,
    });

    expect(validation.valid).toBe(false);
    expect(validation.error).toContain('less than 5 sats per guest');
  });

  it('accepts valid per-person sends and calculates the total batch amount', () => {
    const validation = validateBatchZap({
      amountMode: 'per-person',
      enteredAmountSats: 25,
      recipientCount: 3,
    });

    expect(validation.valid).toBe(true);
    expect(validation.distribution).toEqual({
      amountMode: 'per-person',
      enteredAmountSats: 25,
      recipientCount: 3,
      perRecipientAmountSats: 25,
      totalAmountSats: 75,
      leftoverSats: 0,
    });
  });
});

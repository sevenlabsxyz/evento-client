import {
  findMatchingWalletEasterEgg,
  getWalletEasterEggSenderComment,
  matchWalletEasterEgg,
  WalletEasterEggRule,
} from '@/lib/utils/wallet-easter-eggs';
import { Payment } from '@breeztech/breez-sdk-spark/web';

function createLightningPayment(
  overrides: Partial<Payment['details']> = {},
  paymentOverrides: Partial<Payment> = {}
): Payment {
  return {
    id: 'payment_123',
    paymentType: 'receive',
    status: 'completed',
    amount: BigInt(2100),
    fees: BigInt(0),
    timestamp: 1700000000,
    method: 'lightning',
    details: {
      type: 'lightning',
      description: 'Base invoice description',
      invoice: 'lnbc123',
      destinationPubkey: '02abc',
      htlcDetails: {
        paymentHash: 'hash_123',
        preimage: 'preimage_123',
      },
      lnurlReceiveMetadata: {
        senderComment: 'Open sesame',
      },
      ...overrides,
    },
    ...paymentOverrides,
  } as Payment;
}

describe('wallet easter egg matching', () => {
  const rules: readonly WalletEasterEggRule[] = [
    {
      id: 'secret-phrase',
      senderCommentExact: 'Open sesame',
    },
    {
      id: 'medal-podium',
      senderCommentIncludesAny: ['🥇', '🥈', '🥉'],
    },
  ];

  it('matches an exact sender comment', () => {
    expect(findMatchingWalletEasterEgg('Open sesame', rules)).toEqual({
      id: 'secret-phrase',
      senderComment: 'Open sesame',
    });
  });

  it('does not match a different sender comment', () => {
    expect(findMatchingWalletEasterEgg('open sesame', rules)).toBeNull();
  });

  it('matches when the sender comment contains any configured medal emoji', () => {
    expect(findMatchingWalletEasterEgg('Winner gets 🥇', rules)).toEqual({
      id: 'medal-podium',
      senderComment: 'Winner gets 🥇',
    });

    expect(findMatchingWalletEasterEgg('2nd place gets 🥈', rules)).toEqual({
      id: 'medal-podium',
      senderComment: '2nd place gets 🥈',
    });

    expect(findMatchingWalletEasterEgg('3rd place gets 🥉', rules)).toEqual({
      id: 'medal-podium',
      senderComment: '3rd place gets 🥉',
    });
  });

  it('reads only the LNURL sender comment from the payment', () => {
    const payment = createLightningPayment({
      description: 'Open sesame',
      lnurlReceiveMetadata: {
        senderComment: 'Open sesame',
      },
    });

    expect(getWalletEasterEggSenderComment(payment)).toBe('Open sesame');
    expect(matchWalletEasterEgg(payment, rules)).toEqual({
      id: 'secret-phrase',
      senderComment: 'Open sesame',
    });
  });

  it('ignores invoice description when sender comment is missing', () => {
    const payment = createLightningPayment({
      description: 'Winner gets 🥇',
      lnurlReceiveMetadata: undefined,
    });

    expect(getWalletEasterEggSenderComment(payment)).toBeNull();
    expect(matchWalletEasterEgg(payment, rules)).toBeNull();
  });
});

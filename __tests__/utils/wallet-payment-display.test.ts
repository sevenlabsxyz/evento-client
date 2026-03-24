import { getWalletPaymentDisplayData } from '@/lib/utils/wallet-payment-display';
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
      lnurlPayInfo: {
        lnAddress: 'satoshi@evento.cash',
        domain: 'evento.cash',
      },
      lnurlReceiveMetadata: {
        senderComment: 'Dinner split',
      },
      ...overrides,
    },
    ...paymentOverrides,
  } as Payment;
}

describe('getWalletPaymentDisplayData', () => {
  it('prefers sender comment over description and exposes LNURL metadata', () => {
    const payment = createLightningPayment();

    expect(getWalletPaymentDisplayData(payment)).toEqual({
      primaryText: 'Dinner split',
      secondaryText: 'Base invoice description',
      description: 'Base invoice description',
      senderComment: 'Dinner split',
      lightningAddress: 'satoshi@evento.cash',
      lightningUsername: 'satoshi',
      lightningDomain: 'evento.cash',
    });
  });

  it('falls back to description when there is no sender comment', () => {
    const payment = createLightningPayment({
      lnurlReceiveMetadata: undefined,
    });

    expect(getWalletPaymentDisplayData(payment)).toMatchObject({
      primaryText: 'Base invoice description',
      secondaryText: null,
      description: 'Base invoice description',
      senderComment: null,
    });
  });
});

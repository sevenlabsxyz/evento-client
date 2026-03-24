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

  it('falls back to LNURL pay comment when sender comment is missing', () => {
    const payment = createLightningPayment({
      description: undefined,
      lnurlReceiveMetadata: undefined,
      lnurlPayInfo: {
        lnAddress: 'satoshi@evento.cash',
        domain: 'evento.cash',
        comment: 'Comment from LNURL pay',
      },
    });

    expect(getWalletPaymentDisplayData(payment)).toMatchObject({
      primaryText: 'Comment from LNURL pay',
      secondaryText: null,
      senderComment: 'Comment from LNURL pay',
      lightningAddress: 'satoshi@evento.cash',
      lightningDomain: 'evento.cash',
    });
  });

  it('preserves legacy lightning address fields when LNURL pay info is missing', () => {
    const payment = createLightningPayment({
      description: 'Legacy payment',
      lnurlPayInfo: undefined,
      lnurlReceiveMetadata: undefined,
      destinationAddress: 'legacy@evento.cash',
    } as Partial<Payment['details']> & { destinationAddress: string });

    expect(getWalletPaymentDisplayData(payment)).toMatchObject({
      primaryText: 'Legacy payment',
      lightningAddress: 'legacy@evento.cash',
      lightningUsername: 'legacy',
      lightningDomain: 'evento.cash',
    });
  });

  it('derives provider host from LNURL withdraw metadata', () => {
    const payment = createLightningPayment({
      description: undefined,
      lnurlPayInfo: undefined,
      lnurlReceiveMetadata: undefined,
      lnurlWithdrawInfo: {
        withdrawUrl: 'https://withdraw.example.com/callback?k1=abc123',
      },
    });

    expect(getWalletPaymentDisplayData(payment)).toMatchObject({
      primaryText: 'Lightning payment received',
      lightningAddress: null,
      lightningUsername: null,
      lightningDomain: 'withdraw.example.com',
    });
  });

  it.each([
    ['spark', 'Spark payment'],
    ['token', 'Token payment'],
    ['withdraw', 'Withdrawal'],
    ['deposit', 'Deposit'],
  ] as const)('keeps description text for %s payments', (type, label) => {
    const payment = {
      id: `payment_${type}`,
      paymentType: 'receive',
      status: 'completed',
      amount: BigInt(2100),
      fees: BigInt(0),
      timestamp: 1700000000,
      method: 'lightning',
      details:
        type === 'token'
          ? {
              type: 'token',
              metadata: {
                tokenId: 'usdt',
                ticker: 'USDT',
                name: 'Tether',
              },
              txHash: 'hash_123',
              txType: 'transfer',
            }
          : type === 'spark'
            ? {
                type: 'spark',
              }
            : type === 'withdraw'
              ? {
                  type: 'withdraw',
                  txId: 'tx_123',
                }
              : {
                  type: 'deposit',
                  txId: 'tx_123',
                },
    } as Payment;

    expect(getWalletPaymentDisplayData(payment)).toMatchObject({
      primaryText: label,
      description: label,
      secondaryText: null,
    });
  });
});

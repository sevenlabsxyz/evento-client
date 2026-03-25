import { BatchZapSheet } from '@/components/zap/batch-zap-sheet';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { HTMLAttributes, ReactNode } from 'react';

const sendBatchMock = jest.fn();
const resetBatchMock = jest.fn();
const notifyBatchMock = jest.fn();
const resetNotifyBatchMock = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

jest.mock('@/components/ui/master-scrollable-sheet', () => ({
  MasterScrollableSheet: ({
    title,
    children,
    footer,
  }: {
    title: string;
    children: ReactNode;
    footer?: ReactNode;
  }) => (
    <div>
      <div>{title}</div>
      <div>{children}</div>
      <div>{footer}</div>
    </div>
  ),
}));

jest.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: { children: ReactNode }) => <>{children}</>,
  motion: {
    div: ({ children, ...props }: HTMLAttributes<HTMLDivElement>) => (
      <div {...props}>{children}</div>
    ),
  },
}));

jest.mock('@/lib/hooks/use-wallet', () => ({
  useWallet: () => ({
    walletState: {
      isConnected: true,
      balance: 2500,
    },
  }),
}));

jest.mock('@/lib/hooks/use-batch-zap-payments', () => ({
  useBatchZapPayments: () => {
    const React = require('react');

    const initialProgress = {
      status: 'idle',
      currentIndex: 0,
      totalCount: 0,
      currentRecipient: null,
      sentCount: 0,
      failedCount: 0,
      remainingCount: 0,
      results: [],
    } as const;

    const [progress, setProgress] = React.useState(initialProgress);

    return {
      progress,
      reset: () => {
        resetBatchMock();
        setProgress(initialProgress);
      },
      sendBatch: async (args: unknown) => {
        const result = await sendBatchMock(args);
        const results = result.results ?? [];

        setProgress({
          status: 'completed',
          currentIndex: results.length,
          totalCount: results.length,
          currentRecipient: null,
          sentCount: results.filter((entry: { status: string }) => entry.status === 'sent').length,
          failedCount: results.filter((entry: { status: string }) => entry.status === 'failed')
            .length,
          remainingCount: 0,
          results,
        });

        return result;
      },
    };
  },
}));

jest.mock('@/lib/hooks/use-notify-wallet-invite-batch', () => ({
  useNotifyWalletInviteBatch: () => ({
    mutateAsync: notifyBatchMock,
    reset: resetNotifyBatchMock,
  }),
}));

jest.mock('@/lib/services/breez-sdk', () => ({
  breezSDK: {
    isConnected: () => true,
  },
}));

jest.mock('@/lib/services/btc-price', () => ({
  BTCPriceService: {
    satsToUSD: jest.fn().mockResolvedValue(1.23),
  },
}));

jest.mock('@/lib/utils/toast', () => {
  const toast = {
    success: jest.fn(),
    error: jest.fn(),
    custom: jest.fn(),
    dismiss: jest.fn(),
  };

  return {
    __toastMocks: toast,
    toast,
  };
});

describe('BatchZapSheet', () => {
  const { __toastMocks, toast } = require('@/lib/utils/toast');

  beforeEach(() => {
    jest.clearAllMocks();

    sendBatchMock.mockResolvedValue({
      results: [
        {
          recipient: {
            userId: 'wallet-user',
            name: 'Wallet Guest',
            lightningAddress: 'wallet@evento.cash',
          },
          amountSats: 100,
          status: 'sent',
        },
      ],
    });

    notifyBatchMock.mockResolvedValue({
      success: true,
      status: 'completed',
      message: 'Batch wallet notifications processed.',
      summary: {
        requestedCount: 2,
        processedCount: 2,
        sentCount: 1,
        alreadyNotifiedCount: 1,
        errorCount: 0,
      },
      results: [
        { recipientUsername: 'guest2', status: 'sent' },
        { recipientUsername: 'guest3', status: 'already_notified' },
      ],
    });
  });

  it('notifies excluded no-wallet guests when a batch zap is confirmed', async () => {
    render(
      <BatchZapSheet
        open={true}
        onOpenChange={jest.fn()}
        recipientSummary={{
          eligibleRecipients: [
            {
              userId: 'wallet-user',
              name: 'Wallet Guest',
              username: 'walletguest',
              lightningAddress: 'wallet@evento.cash',
            },
          ],
          excludedSelf: [],
          excludedHosts: [],
          excludedNoLightning: [
            {
              id: 'rsvp-1',
              event_id: 'event-1',
              user_id: 'guest-2',
              status: 'yes',
              created_at: '2026-03-24T00:00:00Z',
              updated_at: '2026-03-24T00:00:00Z',
              user_details: {
                id: 'guest-2',
                username: 'Guest2',
                name: 'Guest Two',
                bio: '',
                image: '',
                verification_status: null,
              },
            },
            {
              id: 'rsvp-2',
              event_id: 'event-1',
              user_id: 'guest-3',
              status: 'yes',
              created_at: '2026-03-24T00:00:00Z',
              updated_at: '2026-03-24T00:00:00Z',
              user_details: {
                id: 'guest-3',
                username: 'guest3',
                name: 'Guest Three',
                bio: '',
                image: '',
                verification_status: null,
              },
            },
            {
              id: 'rsvp-3',
              event_id: 'event-1',
              user_id: 'guest-4',
              status: 'yes',
              created_at: '2026-03-24T00:00:00Z',
              updated_at: '2026-03-24T00:00:00Z',
              user_details: {
                id: 'guest-4',
                username: 'guest3',
                name: 'Guest Three Duplicate',
                bio: '',
                image: '',
                verification_status: null,
              },
            },
          ],
          isViewerHost: true,
        }}
      />
    );

    await screen.findByText('$1.23 available');

    fireEvent.click(screen.getByRole('button', { name: /Per person/i }));
    fireEvent.change(screen.getByLabelText('Amount in sats'), {
      target: { value: '100' },
    });

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Next' })).not.toBeDisabled();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm and send' }));

    await waitFor(() => {
      expect(sendBatchMock).toHaveBeenCalledWith({
        recipients: [
          {
            userId: 'wallet-user',
            name: 'Wallet Guest',
            username: 'walletguest',
            lightningAddress: 'wallet@evento.cash',
          },
        ],
        amountMode: 'per-person',
        amountSats: 100,
        comment: undefined,
      });
    });

    await waitFor(() => {
      expect(notifyBatchMock).toHaveBeenCalledWith({
        recipientUsernames: ['guest2', 'guest3'],
      });
    });

    expect(toast.success).toHaveBeenCalledWith('Batch Zap completed');
    expect(__toastMocks.error).not.toHaveBeenCalled();
  });

  it('shows backend error text when batch wallet notify rejects with an API error object', async () => {
    notifyBatchMock.mockRejectedValueOnce({
      message: 'Batch wallet notify is temporarily unavailable.',
    });

    render(
      <BatchZapSheet
        open={true}
        onOpenChange={jest.fn()}
        recipientSummary={{
          eligibleRecipients: [
            {
              userId: 'wallet-user',
              name: 'Wallet Guest',
              username: 'walletguest',
              lightningAddress: 'wallet@evento.cash',
            },
          ],
          excludedSelf: [],
          excludedHosts: [],
          excludedNoLightning: [
            {
              id: 'rsvp-1',
              event_id: 'event-1',
              user_id: 'guest-2',
              status: 'yes',
              created_at: '2026-03-24T00:00:00Z',
              updated_at: '2026-03-24T00:00:00Z',
              user_details: {
                id: 'guest-2',
                username: 'guest2',
                name: 'Guest Two',
                bio: '',
                image: '',
                verification_status: null,
              },
            },
          ],
          isViewerHost: true,
        }}
      />
    );

    await screen.findByText('$1.23 available');

    fireEvent.click(screen.getByRole('button', { name: /Per person/i }));
    fireEvent.change(screen.getByLabelText('Amount in sats'), {
      target: { value: '100' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(screen.getByRole('button', { name: 'Confirm and send' }));

    await screen.findByText('Batch wallet notify is temporarily unavailable.');
  });
});

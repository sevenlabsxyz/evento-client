import { ReceiveLightningSheet } from '@/components/wallet/receive-invoice-sheet';
import { breezSDK } from '@/lib/services/breez-sdk';
import { toast } from '@/lib/utils/toast';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

jest.mock('@/components/ui/animated-tabs', () => ({
  AnimatedTabs: ({ tabs }: { tabs: Array<{ title: string; onClick: () => void }> }) => (
    <div>
      {tabs.map((tab) => (
        <button key={tab.title} type='button' onClick={tab.onClick}>
          {tab.title}
        </button>
      ))}
    </div>
  ),
}));

jest.mock('@/components/ui/evento-qr-code', () => ({
  EventoQRCode: ({ value }: { value: string }) => <div data-testid='qr-code'>{value}</div>,
}));

jest.mock('@/components/ui/master-scrollable-sheet', () => ({
  MasterScrollableSheet: ({
    open,
    title,
    headerSecondary,
    children,
  }: {
    open?: boolean;
    title: string;
    headerSecondary?: ReactNode;
    children: ReactNode;
  }) =>
    open ? (
      <section>
        <h1>{title}</h1>
        {headerSecondary}
        {children}
      </section>
    ) : null,
}));

jest.mock('@/components/wallet/amount-input-sheet', () => ({
  AmountInputSheet: () => null,
}));

jest.mock('@/lib/hooks/use-lightning-address', () => ({
  useLightningAddress: () => ({
    address: { lightningAddress: 'alice@evento.cash' },
    isLoading: false,
  }),
}));

jest.mock('@/lib/hooks/use-wallet-payments', () => ({
  useAmountConverter: () => ({
    satsToUSD: jest.fn(async (sats: number) => sats / 100000),
  }),
  useReceivePayment: () => ({
    createInvoice: jest.fn(),
  }),
}));

jest.mock('@/lib/services/breez-sdk', () => ({
  breezSDK: {
    receivePayment: jest.fn(),
    onEvent: jest.fn(() => jest.fn()),
  },
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

const receivePaymentMock = breezSDK.receivePayment as jest.MockedFunction<
  typeof breezSDK.receivePayment
>;
const toastErrorMock = toast.error as jest.MockedFunction<typeof toast.error>;

describe('ReceiveLightningSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    receivePaymentMock
      .mockResolvedValueOnce({ paymentRequest: 'bc1qfirst', fee: 0 } as any)
      .mockResolvedValueOnce({ paymentRequest: 'bc1qsecond', fee: 0 } as any);
  });

  it('requests a new Bitcoin deposit address for each receive sheet session', async () => {
    const { rerender } = render(<ReceiveLightningSheet open={true} onOpenChange={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Onchain' }));

    await waitFor(() => {
      expect(receivePaymentMock).toHaveBeenCalledWith({
        paymentMethod: { type: 'bitcoinAddress', newAddress: true },
      });
    });
    expect(await screen.findByTestId('qr-code')).toHaveTextContent('bitcoin:bc1qfirst');

    rerender(<ReceiveLightningSheet open={false} onOpenChange={jest.fn()} />);
    rerender(<ReceiveLightningSheet open={true} onOpenChange={jest.fn()} />);

    await waitFor(() => {
      expect(receivePaymentMock).toHaveBeenCalledTimes(2);
    });
    expect(receivePaymentMock).toHaveBeenLastCalledWith({
      paymentMethod: { type: 'bitcoinAddress', newAddress: true },
    });
    expect(await screen.findByTestId('qr-code')).toHaveTextContent('bitcoin:bc1qsecond');
  });

  it('does not retry Bitcoin address generation indefinitely after a failure', async () => {
    receivePaymentMock.mockReset();
    receivePaymentMock.mockRejectedValue(new Error('Network unavailable'));

    render(<ReceiveLightningSheet open={true} onOpenChange={jest.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Onchain' }));

    await waitFor(() => {
      expect(toastErrorMock).toHaveBeenCalledWith('Network unavailable');
    });

    expect(await screen.findByRole('button', { name: 'Try Again' })).toBeInTheDocument();

    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(receivePaymentMock).toHaveBeenCalledTimes(1);
  });
});

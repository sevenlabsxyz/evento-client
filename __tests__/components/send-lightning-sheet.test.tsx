import { SendLightningSheet } from '@/components/wallet/send-lightning-sheet';
import { breezSDK } from '@/lib/services/breez-sdk';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';

jest.mock('@/components/ui/master-scrollable-sheet', () => ({
  MasterScrollableSheet: ({ open, children }: { open?: boolean; children: ReactNode }) =>
    open ? <section>{children}</section> : null,
}));

jest.mock('@/components/ui/sheet-with-detent-full', () => ({
  SheetWithDetentFull: {
    Root: ({ presented, children }: { presented?: boolean; children: ReactNode }) =>
      presented ? <div>{children}</div> : null,
    Portal: ({ children }: { children: ReactNode }) => <>{children}</>,
    View: ({ children }: { children: ReactNode }) => <>{children}</>,
    Backdrop: () => null,
    Content: ({ children }: { children: ReactNode }) => <section>{children}</section>,
    Handle: () => null,
    Title: ({ children }: { children: ReactNode }) => <h1>{children}</h1>,
  },
}));

jest.mock('@silk-hq/components', () => ({
  VisuallyHidden: {
    Root: ({ children }: { children: ReactNode }) => <>{children}</>,
  },
}));

jest.mock('@/components/wallet/amount-input-sheet', () => ({
  AmountInputSheet: () => null,
}));

jest.mock('@/components/wallet/add-contact-sheet', () => ({
  AddContactSheet: () => null,
}));

jest.mock('@/components/wallet/contacts-list', () => ({
  ContactsList: () => null,
}));

jest.mock('@/components/wallet/wallet-balance-display', () => ({
  WalletBalanceDisplay: () => <div>Balance</div>,
}));

jest.mock('@/components/wallet/contact-autocomplete', () => ({
  ContactAutocomplete: ({
    value,
    onChange,
    placeholder,
  }: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  }) => (
    <textarea
      aria-label='Payment destination'
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  ),
}));

jest.mock('@/components/wallet/save-contact-prompt', () => ({
  useSaveContactPrompt: () => ({
    showSaveContactPrompt: jest.fn(),
  }),
}));

jest.mock('@/lib/hooks/use-contacts', () => ({
  useContacts: () => ({
    isLoading: false,
  }),
}));

jest.mock('@/lib/hooks/use-wallet', () => ({
  useWallet: () => ({
    walletState: { balance: 100_000 },
  }),
}));

jest.mock('@/lib/hooks/use-wallet-payments', () => ({
  useAmountConverter: () => ({
    satsToUSD: jest.fn(async (sats: number) => sats / 100000),
    usdToSats: jest.fn(async (usd: number) => Math.round(usd * 100000)),
  }),
  useSendPayment: () => ({
    prepareSend: jest.fn(),
    sendPayment: jest.fn(),
    feeEstimate: null,
    isLoading: false,
  }),
}));

jest.mock('@/lib/services/breez-sdk', () => ({
  breezSDK: {
    parseInput: jest.fn(),
    prepareLnurlPay: jest.fn(),
    preparePayment: jest.fn(),
    prepareSendAll: jest.fn(),
    sendPaymentWithOptions: jest.fn(),
    lnurlPay: jest.fn(),
  },
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/lib/utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
  },
}));

const parseInputMock = breezSDK.parseInput as jest.MockedFunction<typeof breezSDK.parseInput>;

describe('SendLightningSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows a graceful unavailable state for cross-chain stablecoin addresses', async () => {
    parseInputMock.mockResolvedValue({
      type: 'crossChainAddress',
      address: '0x1111111111111111111111111111111111111111',
      addressFamily: 'evm',
      chainId: 8453,
    } as any);

    render(<SendLightningSheet open={true} onOpenChange={jest.fn()} />);

    fireEvent.change(screen.getByLabelText('Payment destination'), {
      target: { value: '0x1111111111111111111111111111111111111111' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Stablecoin sends are not ready')).toBeInTheDocument();
    expect(screen.getByText(/recognized this as a cross-chain address/i)).toBeInTheDocument();
    expect(
      screen.getByText(/address is valid but Evento cannot send to it yet/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/token contract address/i)).toBeInTheDocument();
    expect(screen.getByText('0x1111111111111111111111111111111111111111')).toBeInTheDocument();

    await waitFor(() => {
      expect(parseInputMock).toHaveBeenCalledWith('0x1111111111111111111111111111111111111111');
    });
  });
});

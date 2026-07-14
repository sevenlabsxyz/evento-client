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
  AmountInputSheet: ({
    open,
    onConfirm,
    isLoading,
  }: {
    open?: boolean;
    onConfirm: (amountSats: number, sendAll?: boolean) => void;
    isLoading?: boolean;
  }) =>
    open ? (
      <button type='button' disabled={isLoading} onClick={() => onConfirm(25_000, false)}>
        Confirm Amount
      </button>
    ) : null,
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
    getCrossChainRoutes: jest.fn(),
    prepareCrossChainPayment: jest.fn(),
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
const getCrossChainRoutesMock = breezSDK.getCrossChainRoutes as jest.MockedFunction<
  typeof breezSDK.getCrossChainRoutes
>;
const prepareCrossChainPaymentMock = breezSDK.prepareCrossChainPayment as jest.MockedFunction<
  typeof breezSDK.prepareCrossChainPayment
>;
const prepareLnurlPayMock = breezSDK.prepareLnurlPay as jest.MockedFunction<
  typeof breezSDK.prepareLnurlPay
>;
const sendPaymentWithOptionsMock = breezSDK.sendPaymentWithOptions as jest.MockedFunction<
  typeof breezSDK.sendPaymentWithOptions
>;

describe('SendLightningSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prepares and sends a cross-chain stablecoin payment', async () => {
    const route = {
      provider: 'orchestra',
      chain: 'Base',
      chainId: '8453',
      asset: 'USDC',
      decimals: 6,
      exactOutEligible: false,
      supportedSources: [],
    } as any;
    const prepareResponse = {
      amount: BigInt(25_000),
      feePolicy: 'feesExcluded',
      paymentMethod: {
        type: 'crossChainAddress',
        route,
        recipientAddress: '0x1111111111111111111111111111111111111111',
        amountIn: '25000',
        assetAmountIn: '25000',
        estimatedOut: '1200000',
        feeAmount: '1000',
        serviceFeeAmount: '500',
        serviceFeeAsset: 'USDC',
        sourceTransferFeeSats: 250,
        feeMode: 'feesExcluded',
        expiresAt: '2099-01-01T00:00:00Z',
        providerContext: {
          type: 'orchestra',
          quoteId: 'quote_123',
          depositAddress: '0x2222222222222222222222222222222222222222',
        },
      },
    } as any;

    parseInputMock.mockResolvedValue({
      type: 'crossChainAddress',
      address: '0x1111111111111111111111111111111111111111',
      addressFamily: 'evm',
      chainId: 8453,
    } as any);
    getCrossChainRoutesMock.mockResolvedValue([route]);
    prepareCrossChainPaymentMock.mockResolvedValue(prepareResponse);
    sendPaymentWithOptionsMock.mockResolvedValue({ payment: {} } as any);

    render(<SendLightningSheet open={true} onOpenChange={jest.fn()} />);

    fireEvent.change(screen.getByLabelText('Payment destination'), {
      target: { value: '0x1111111111111111111111111111111111111111' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    fireEvent.click(await screen.findByRole('button', { name: 'Confirm Amount' }));

    expect(await screen.findByText('Confirm Payment')).toBeInTheDocument();
    expect(screen.getByText('1.2 USDC')).toBeInTheDocument();
    expect(screen.getByText('USDC on Base')).toBeInTheDocument();

    await waitFor(() => {
      expect(parseInputMock).toHaveBeenCalledWith('0x1111111111111111111111111111111111111111');
    });
    expect(getCrossChainRoutesMock).toHaveBeenCalledWith({
      type: 'crossChainAddress',
      address: '0x1111111111111111111111111111111111111111',
      addressFamily: 'evm',
      chainId: 8453,
    });
    expect(prepareCrossChainPaymentMock).toHaveBeenCalledWith(
      '0x1111111111111111111111111111111111111111',
      route,
      25_000
    );

    fireEvent.click(screen.getByRole('button', { name: 'Send' }));

    await waitFor(() => {
      expect(sendPaymentWithOptionsMock).toHaveBeenCalledWith({
        prepareResponse,
      });
    });
  });

  it('resets cross-chain mode when entering a Lightning address after a stablecoin address', async () => {
    const baseRoute = {
      provider: 'orchestra',
      chain: 'Base',
      chainId: '8453',
      asset: 'USDC',
      decimals: 6,
      exactOutEligible: false,
      supportedSources: [],
    } as any;
    const polygonRoute = {
      ...baseRoute,
      chain: 'Polygon',
      chainId: '137',
    };
    const payRequest = {
      commentAllowed: 0,
      minSendable: BigInt(1000),
      maxSendable: BigInt(100_000_000),
    };

    parseInputMock
      .mockResolvedValueOnce({
        type: 'crossChainAddress',
        address: '0x1111111111111111111111111111111111111111',
        addressFamily: 'evm',
        chainId: 8453,
      } as any)
      .mockResolvedValueOnce({
        type: 'lightningAddress',
        payRequest,
      } as any);
    getCrossChainRoutesMock.mockResolvedValue([baseRoute, polygonRoute]);
    prepareLnurlPayMock.mockResolvedValue({ feeSats: 1 } as any);

    render(<SendLightningSheet open={true} onOpenChange={jest.fn()} />);

    fireEvent.change(screen.getByLabelText('Payment destination'), {
      target: { value: '0x1111111111111111111111111111111111111111' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));

    expect(await screen.findByText('Choose a stablecoin route')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Enter Different Address' }));

    fireEvent.change(screen.getByLabelText('Payment destination'), {
      target: { value: 'alice@example.com' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Next' }));
    fireEvent.click(await screen.findByRole('button', { name: 'Confirm Amount' }));

    await waitFor(() => {
      expect(prepareLnurlPayMock).toHaveBeenCalledWith({
        payRequest,
        amount: BigInt(25_000),
        comment: undefined,
      });
    });
    expect(prepareCrossChainPaymentMock).not.toHaveBeenCalled();
  });
});

import CrowdfundingManagementPage from '@/app/e/[id]/manage/crowdfunding/page';
import { useAuth } from '@/lib/hooks/use-auth';
import {
  useCreateEventCampaign,
  useEventCampaign,
  useUpdateEventCampaign,
} from '@/lib/hooks/use-event-campaign';
import { useWallet } from '@/lib/hooks/use-wallet';
import { INITIAL_WALLET_STATE, useWalletStore } from '@/lib/stores/wallet-store';
import { toast } from '@/lib/utils/toast';
import { showWalletUnlockToast } from '@/lib/utils/wallet-unlock-toast';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/e/evt_test123/manage/crowdfunding',
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ id: 'evt_test123' }),
}));

jest.mock('@/lib/hooks/use-event-campaign', () => ({
  useEventCampaign: jest.fn(),
  useCreateEventCampaign: jest.fn(),
  useUpdateEventCampaign: jest.fn(),
}));

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('@/lib/hooks/use-wallet', () => ({
  useWallet: jest.fn(),
}));

jest.mock('@/lib/utils/wallet-unlock-toast', () => ({
  redirectToWalletUnlock: jest.fn(),
  showWalletUnlockToast: jest.fn(),
}));

jest.mock('@/lib/utils/toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
    custom: jest.fn(),
    dismiss: jest.fn(),
    clear: jest.fn(),
  },
}));

const mockUseEventCampaign = useEventCampaign as jest.MockedFunction<typeof useEventCampaign>;
const mockUseCreateEventCampaign = useCreateEventCampaign as jest.MockedFunction<
  typeof useCreateEventCampaign
>;
const mockUseUpdateEventCampaign = useUpdateEventCampaign as jest.MockedFunction<
  typeof useUpdateEventCampaign
>;
const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>;
const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>;
const mockShowWalletUnlockToast = showWalletUnlockToast as jest.MockedFunction<
  typeof showWalletUnlockToast
>;
const mockToast = toast as jest.Mocked<typeof toast>;

describe('CrowdfundingManagementPage', () => {
  const createCampaignMutation = {
    mutateAsync: jest.fn(),
    isPending: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    useWalletStore.setState({
      walletState: INITIAL_WALLET_STATE,
      isLoading: false,
      error: null,
      lightningAddress: null,
    });

    mockUseEventCampaign.mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
    } as any);
    mockUseCreateEventCampaign.mockReturnValue(createCampaignMutation as any);
    mockUseUpdateEventCampaign.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    } as any);
  });

  const renderPage = () => {
    const view = render(<CrowdfundingManagementPage />);
    fireEvent.change(screen.getByLabelText(/Title/i), {
      target: { value: 'Fund our event' },
    });
    fireEvent.submit(view.container.querySelector('form')!);
    return view;
  };

  it('routes the user to wallet setup when creating without an active wallet', async () => {
    mockUseAuth.mockReturnValue({
      user: null,
    } as any);
    mockUseWallet.mockReturnValue({
      walletState: {
        ...INITIAL_WALLET_STATE,
        isInitialized: false,
        isConnected: false,
      },
      isLoading: false,
    } as any);

    renderPage();

    await waitFor(() => {
      expect(mockShowWalletUnlockToast).toHaveBeenCalledTimes(1);
    });
    expect(createCampaignMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it('blocks campaign creation while the wallet address is still syncing upstream', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        ln_address: 'stale@getalby.com',
      },
    } as any);
    mockUseWallet.mockReturnValue({
      walletState: {
        ...INITIAL_WALLET_STATE,
        isInitialized: true,
        isConnected: true,
      },
      isLoading: false,
    } as any);

    useWalletStore.setState({
      walletState: {
        ...INITIAL_WALLET_STATE,
        isInitialized: true,
        isConnected: true,
      },
      isLoading: false,
      error: null,
      lightningAddress: {
        lightningAddress: 'alice@evento.cash',
      } as any,
    });

    renderPage();

    await waitFor(() => {
      expect(mockToast.info).toHaveBeenCalledWith(
        'Your wallet address is still syncing. Try again in a moment.',
        'Syncing wallet'
      );
    });
    expect(createCampaignMutation.mutateAsync).not.toHaveBeenCalled();
  });

  it('creates the campaign once the wallet address matches the synced profile address', async () => {
    mockUseAuth.mockReturnValue({
      user: {
        ln_address: 'alice@evento.cash',
      },
    } as any);
    mockUseWallet.mockReturnValue({
      walletState: {
        ...INITIAL_WALLET_STATE,
        isInitialized: true,
        isConnected: true,
      },
      isLoading: false,
    } as any);

    useWalletStore.setState({
      walletState: {
        ...INITIAL_WALLET_STATE,
        isInitialized: true,
        isConnected: true,
      },
      isLoading: false,
      error: null,
      lightningAddress: {
        lightningAddress: 'alice@evento.cash',
      } as any,
    });

    createCampaignMutation.mutateAsync.mockResolvedValue({
      id: 'cmp_1',
    });

    renderPage();

    await waitFor(() => {
      expect(createCampaignMutation.mutateAsync).toHaveBeenCalledWith({
        title: 'Fund our event',
        description: null,
        goalSats: null,
        visibility: 'public',
        status: 'active',
      });
    });
    expect(mockShowWalletUnlockToast).not.toHaveBeenCalled();
    expect(mockToast.info).not.toHaveBeenCalled();
  });
});

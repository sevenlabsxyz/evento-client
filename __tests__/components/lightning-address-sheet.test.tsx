import LightningAddressSheet from '@/components/profile-edit/lightning-address-sheet';
import { useLightningAddress } from '@/lib/hooks/use-lightning-address';
import { useUpdateUserProfile } from '@/lib/hooks/use-user-profile';
import { useWallet } from '@/lib/hooks/use-wallet';
import { redirectToWalletUnlock } from '@/lib/utils/wallet-unlock-toast';
import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';

const mockRouterPush = jest.fn();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockRouterPush,
  }),
}));

jest.mock('@/components/ui/sheet-with-detent-full', () => ({
  SheetWithDetentFull: {
    Root: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Portal: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    View: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Backdrop: () => null,
    Content: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    ScrollRoot: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    ScrollView: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    ScrollContent: ({ children }: { children: ReactNode }) => <div>{children}</div>,
    Handle: () => <div />,
  },
}));

jest.mock('@/lib/hooks/use-wallet', () => ({
  useWallet: jest.fn(),
}));

jest.mock('@/lib/hooks/use-lightning-address', () => ({
  useLightningAddress: jest.fn(),
}));

jest.mock('@/lib/hooks/use-user-profile', () => ({
  useUpdateUserProfile: jest.fn(),
}));

jest.mock('@/lib/utils/wallet-unlock-toast', () => ({
  redirectToWalletUnlock: jest.fn(),
}));

const mockUseWallet = useWallet as jest.MockedFunction<typeof useWallet>;
const mockUseLightningAddress = useLightningAddress as jest.MockedFunction<
  typeof useLightningAddress
>;
const mockUseUpdateUserProfile = useUpdateUserProfile as jest.MockedFunction<
  typeof useUpdateUserProfile
>;
const mockRedirectToWalletUnlock = redirectToWalletUnlock as jest.MockedFunction<
  typeof redirectToWalletUnlock
>;

describe('LightningAddressSheet', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseLightningAddress.mockReturnValue({
      address: {
        lightningAddress: 'alice@evento.cash',
      },
    } as any);
    mockUseUpdateUserProfile.mockReturnValue({
      mutateAsync: jest.fn(),
      isPending: false,
    } as any);
  });

  it('opens the wallet page directly when the wallet-managed address is already connected', () => {
    mockUseWallet.mockReturnValue({
      walletState: {
        isInitialized: true,
        isConnected: true,
      },
    } as any);

    render(<LightningAddressSheet isOpen={true} onClose={jest.fn()} currentAddress='' />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Wallet' }));

    expect(mockRouterPush).toHaveBeenCalledWith('/e/wallet');
    expect(mockRedirectToWalletUnlock).not.toHaveBeenCalled();
  });

  it('uses the unlock redirect when the wallet-managed address is not connected yet', () => {
    mockUseWallet.mockReturnValue({
      walletState: {
        isInitialized: true,
        isConnected: false,
      },
    } as any);

    render(<LightningAddressSheet isOpen={true} onClose={jest.fn()} currentAddress='' />);

    fireEvent.click(screen.getByRole('button', { name: 'Open Wallet' }));

    expect(mockRedirectToWalletUnlock).toHaveBeenCalledTimes(1);
    expect(mockRouterPush).not.toHaveBeenCalled();
  });
});

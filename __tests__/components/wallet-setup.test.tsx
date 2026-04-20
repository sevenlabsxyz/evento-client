import { WalletSetup } from '@/components/wallet/wallet-setup';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ButtonHTMLAttributes } from 'react';

const createWalletMock = jest.fn();
const checkAvailabilityMock = jest.fn();
const registerAddressMock = jest.fn();

jest.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      whileTap,
      transition,
      ...props
    }: ButtonHTMLAttributes<HTMLButtonElement> & {
      whileTap?: unknown;
      transition?: unknown;
    }) => <button {...props}>{children}</button>,
  },
}));

jest.mock('@/lib/hooks/use-wallet', () => ({
  useWallet: () => ({
    createWallet: createWalletMock,
  }),
}));

jest.mock('@/lib/hooks/use-auth', () => ({
  useAuth: () => ({
    user: null,
  }),
}));

jest.mock('@/lib/hooks/use-lightning-address', () => ({
  useLightningAddress: () => ({
    checkAvailability: checkAvailabilityMock,
    registerAddress: registerAddressMock,
  }),
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

describe('WalletSetup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('auto-advances and auto-submits after the sixth digit', async () => {
    const onComplete = jest.fn();

    createWalletMock.mockResolvedValue('test mnemonic');

    render(<WalletSetup onComplete={onComplete} />);

    for (const digit of '123456') {
      fireEvent.keyDown(window, { key: digit });
    }

    expect(await screen.findByText('Confirm Your PIN')).toBeInTheDocument();

    for (const digit of '123456') {
      fireEvent.keyDown(window, { key: digit });
    }

    await waitFor(() => {
      expect(createWalletMock).toHaveBeenCalledWith('123456');
    });

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith('test mnemonic');
    });
  });
});

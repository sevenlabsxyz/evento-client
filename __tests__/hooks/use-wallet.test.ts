import { resetWalletInitialization, useWallet } from '@/lib/hooks/use-wallet';
import { breezSDK } from '@/lib/services/breez-sdk';
import { WalletStorageService } from '@/lib/services/wallet-storage';
import { INITIAL_WALLET_STATE, useWalletStore } from '@/lib/stores/wallet-store';
import { renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

jest.mock('@/lib/services/breez-sdk', () => ({
  breezSDK: {
    connect: jest.fn(),
    disconnect: jest.fn(),
    getBalance: jest.fn(),
    isConnected: jest.fn(),
  },
}));

jest.mock('@/lib/services/wallet-storage', () => ({
  WalletStorageService: {
    getEncryptedSeed: jest.fn(),
    getWalletState: jest.fn(),
    saveWalletState: jest.fn(),
    clearWalletData: jest.fn(),
    generateMnemonic: jest.fn(),
    encryptSeed: jest.fn(),
    decryptSeed: jest.fn(),
    saveEncryptedSeed: jest.fn(),
  },
}));

const mockBreezSDK = breezSDK as jest.Mocked<typeof breezSDK>;
const mockWalletStorageService = WalletStorageService as jest.Mocked<typeof WalletStorageService>;

describe('useWallet', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    useWalletStore.setState({
      walletState: INITIAL_WALLET_STATE,
      isLoading: true,
      error: null,
      lightningAddress: null,
    });

    await resetWalletInitialization({ resetStore: false });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('keeps the wallet connected when a live SDK session cannot refresh balance', async () => {
    useWalletStore.setState({
      walletState: {
        isInitialized: true,
        isConnected: true,
        balance: 4321,
        hasBackup: true,
      },
      isLoading: true,
      error: null,
      lightningAddress: null,
    });

    mockWalletStorageService.getEncryptedSeed.mockReturnValue('encrypted-seed');
    mockWalletStorageService.getWalletState.mockReturnValue({
      isInitialized: true,
      isConnected: false,
      balance: 1234,
      hasBackup: true,
    });

    mockBreezSDK.isConnected.mockReturnValue(true);
    mockBreezSDK.getBalance.mockRejectedValue(new Error('temporary balance failure'));

    const { result } = renderHook(() => useWallet(), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.walletState).toMatchObject({
      isInitialized: true,
      isConnected: true,
      balance: 4321,
      hasBackup: true,
    });
  });
});

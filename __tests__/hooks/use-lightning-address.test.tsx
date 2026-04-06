import { apiClient } from '@/lib/api/client';
import { useLightningAddress } from '@/lib/hooks/use-lightning-address';
import { breezSDK } from '@/lib/services/breez-sdk';
import { useAuthStore } from '@/lib/stores/auth-store';
import { INITIAL_WALLET_STATE, useWalletStore } from '@/lib/stores/wallet-store';
import { act, renderHook, waitFor } from '@testing-library/react';
import { createTestWrapper } from '../setup/test-utils';

jest.mock('@/lib/services/breez-sdk', () => ({
  breezSDK: {
    getLightningAddress: jest.fn(),
    registerLightningAddress: jest.fn(),
    checkLightningAddressAvailable: jest.fn(),
    deleteLightningAddress: jest.fn(),
  },
}));

jest.mock('@/lib/utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    logApiRequest: jest.fn(),
    logApiResponse: jest.fn(),
  },
}));

const mockBreezSDK = breezSDK as jest.Mocked<typeof breezSDK>;
const mockApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('useLightningAddress', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    useWalletStore.setState({
      walletState: {
        ...INITIAL_WALLET_STATE,
        isInitialized: true,
        isConnected: true,
      },
      isLoading: false,
      error: null,
      lightningAddress: null,
    });

    useAuthStore.getState().setUser({
      id: 'usr_1',
      username: 'alice',
      name: 'Alice',
      bio: '',
      image: '',
      bio_link: '',
      x_handle: '',
      instagram_handle: '',
      ln_address: 'stale@getalby.com',
      nip05: '',
      verification_status: null,
      verification_date: '',
    });
  });

  it('syncs the registered wallet address upstream immediately', async () => {
    mockBreezSDK.registerLightningAddress.mockResolvedValue({
      lightningAddress: 'alice@evento.cash',
    } as any);
    mockApiClient.patch.mockResolvedValue({ success: true } as any);

    const { result } = renderHook(() => useLightningAddress(), {
      wrapper: createTestWrapper(),
    });

    await act(async () => {
      await result.current.registerAddress('alice', 'Pay to Alice');
    });

    expect(mockApiClient.patch).toHaveBeenCalledWith('/v1/user/lightning-address', {
      lightning_address: 'alice@evento.cash',
    });
    expect(useAuthStore.getState().user?.ln_address).toBe('alice@evento.cash');
  });

  it('retries syncing the same wallet address after a failed upstream sync', async () => {
    mockApiClient.patch
      .mockRejectedValueOnce(new Error('temporary failure'))
      .mockResolvedValueOnce({ success: true } as any);

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

    renderHook(() => useLightningAddress({ autoSyncToBackend: true }), {
      wrapper: createTestWrapper(),
    });

    await waitFor(() => {
      expect(mockApiClient.patch).toHaveBeenCalledTimes(1);
    });

    act(() => {
      useWalletStore.getState().setLightningAddress({
        lightningAddress: 'alice@evento.cash',
      } as any);
    });

    await waitFor(() => {
      expect(mockApiClient.patch).toHaveBeenCalledTimes(2);
    });
  });
});

import { WalletState } from '@/lib/types/wallet';
import { LightningAddressInfo } from '@breeztech/breez-sdk-spark/web';
import { create } from 'zustand';

interface WalletStore {
  walletState: WalletState;
  isLoading: boolean;
  error: string | null;
  lightningAddress: LightningAddressInfo | null;
  setWalletState: (state: WalletState | ((prev: WalletState) => WalletState)) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLightningAddress: (address: LightningAddressInfo | null) => void;
}

export const useWalletStore = create<WalletStore>((set) => ({
  walletState: {
    isInitialized: false,
    isConnected: false,
    balance: 0,
    hasBackup: false,
  },
  isLoading: true,
  error: null,
  lightningAddress: null,

  setWalletState: (stateOrUpdater) =>
    set((state) => ({
      walletState:
        typeof stateOrUpdater === 'function' ? stateOrUpdater(state.walletState) : stateOrUpdater,
    })),

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setLightningAddress: (address) => set({ lightningAddress: address }),
}));

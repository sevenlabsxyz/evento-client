import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletPreferencesStore {
  balanceHidden: boolean;
  toggleBalanceVisibility: () => void;
  setBalanceHidden: (hidden: boolean) => void;
}

export const useWalletPreferences = create<WalletPreferencesStore>()(
  persist(
    (set) => ({
      balanceHidden: false,

      toggleBalanceVisibility: () => set((state) => ({ balanceHidden: !state.balanceHidden })),

      setBalanceHidden: (hidden: boolean) => set({ balanceHidden: hidden }),
    }),
    {
      name: STORAGE_KEYS.WALLET_PREFERENCES,
    }
  )
);

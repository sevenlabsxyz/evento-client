import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../utils/storage';

interface RecentLightningAddressesState {
  recentAddresses: string[];
  addRecentAddress: (address: string) => void;
  clearRecentAddresses: () => void;
}

const MAX_RECENT_ADDRESSES = 5;

export const useRecentLightningAddressesStore = create<RecentLightningAddressesState>()(
  persist(
    (set) => ({
      recentAddresses: [],

      addRecentAddress: (address) =>
        set((state) => {
          // Remove any existing duplicate before adding
          const filtered = state.recentAddresses.filter((a) => a !== address);

          // Add new address to the beginning and limit to MAX_RECENT_ADDRESSES
          return {
            recentAddresses: [address, ...filtered].slice(0, MAX_RECENT_ADDRESSES),
          };
        }),

      clearRecentAddresses: () => set({ recentAddresses: [] }),
    }),
    {
      name: STORAGE_KEYS.RECENT_LIGHTNING_ADDRESSES,
    }
  )
);

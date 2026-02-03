import { create } from 'zustand';

const SEED_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds

interface WalletSeedStore {
  // In-memory seed (never persisted)
  seed: string | null;
  seedExpiresAt: number | null;

  // Actions
  setSeed: (seed: string) => void;
  clearSeed: () => void;
  isSeedValid: () => boolean;
  getSeed: () => string | null;
}

export const useWalletSeedStore = create<WalletSeedStore>((set, get) => ({
  seed: null,
  seedExpiresAt: null,

  setSeed: (seed: string) => {
    const expiresAt = Date.now() + SEED_TTL;
    set({ seed, seedExpiresAt: expiresAt });

    // Auto-clear after TTL
    setTimeout(() => {
      const state = get();
      if (state.seedExpiresAt && Date.now() >= state.seedExpiresAt) {
        get().clearSeed();
      }
    }, SEED_TTL);
  },

  clearSeed: () => {
    set({ seed: null, seedExpiresAt: null });
  },

  isSeedValid: () => {
    const { seed, seedExpiresAt } = get();
    if (!seed || !seedExpiresAt) return false;
    return Date.now() < seedExpiresAt;
  },

  getSeed: () => {
    const state = get();
    if (state.isSeedValid()) {
      return state.seed;
    }
    // Expired, clear it
    state.clearSeed();
    return null;
  },
}));

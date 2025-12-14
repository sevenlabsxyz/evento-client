import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import { create } from 'zustand';

interface BetaAccessState {
  hasAccess: boolean | null;
  isLoading: boolean;
  initialize: () => void;
  grantAccess: () => void;
  revokeAccess: () => void;
}

export const useBetaAccessStore = create<BetaAccessState>((set) => ({
  hasAccess: null,
  isLoading: true,
  initialize: () => {
    const stored = localStorage.getItem(STORAGE_KEYS.BETA_ACCESS);
    set({ hasAccess: stored === 'granted', isLoading: false });
  },
  grantAccess: () => {
    localStorage.setItem(STORAGE_KEYS.BETA_ACCESS, 'granted');
    set({ hasAccess: true, isLoading: false });
  },
  revokeAccess: () => {
    localStorage.removeItem(STORAGE_KEYS.BETA_ACCESS);
    set({ hasAccess: false });
  },
}));

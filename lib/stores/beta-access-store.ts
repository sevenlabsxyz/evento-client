import { create } from 'zustand';

const BETA_ACCESS_KEY = 'evento-beta-access';

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
    const stored = localStorage.getItem(BETA_ACCESS_KEY);
    set({ hasAccess: stored === 'granted', isLoading: false });
  },
  grantAccess: () => {
    localStorage.setItem(BETA_ACCESS_KEY, 'granted');
    set({ hasAccess: true, isLoading: false });
  },
  revokeAccess: () => {
    localStorage.removeItem(BETA_ACCESS_KEY);
    set({ hasAccess: false });
  },
}));

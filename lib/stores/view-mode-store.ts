import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { STORAGE_KEYS } from '../utils/storage';

export type ViewMode = 'card' | 'compact';

interface ViewModeState {
  feedViewMode: ViewMode;
  setFeedViewMode: (mode: ViewMode) => void;
}

export const useViewModeStore = create<ViewModeState>()(
  persist(
    (set) => ({
      feedViewMode: 'card', // Default view mode
      setFeedViewMode: (mode) => set({ feedViewMode: mode }),
    }),
    {
      name: STORAGE_KEYS.VIEW_MODE, // Local storage key
    }
  )
);

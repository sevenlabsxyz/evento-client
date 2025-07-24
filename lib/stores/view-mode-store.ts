import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
			name: 'evento-view-mode', // Local storage key
		}
	)
);

import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import { UserSearchResult } from '@/lib/types/api';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface RecentSearchesState {
  recentSearches: UserSearchResult[];
  addRecentSearch: (user: UserSearchResult) => void;
  clearRecentSearches: () => void;
}

const MAX_RECENT_SEARCHES = 5;

export const useRecentSearchesStore = create<RecentSearchesState>()(
  persist(
    (set) => ({
      recentSearches: [],

      addRecentSearch: (user) =>
        set((state) => {
          // Remove any existing duplicate before adding
          const filteredSearches = state.recentSearches.filter((item) => item.id !== user.id);

          // Add new search to the beginning and limit to MAX_RECENT_SEARCHES
          return {
            recentSearches: [user, ...filteredSearches].slice(0, MAX_RECENT_SEARCHES),
          };
        }),

      clearRecentSearches: () => set({ recentSearches: [] }),
    }),
    {
      name: STORAGE_KEYS.RECENT_SEARCHES,
    }
  )
);

import { create } from 'zustand';

interface ContactsStore {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useContactsStore = create<ContactsStore>((set) => ({
  searchQuery: '',
  setSearchQuery: (query) => set({ searchQuery: query }),
}));

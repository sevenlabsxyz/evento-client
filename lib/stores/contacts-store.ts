import { Contact } from '@/lib/types/wallet';
import { create } from 'zustand';

interface ContactsStore {
  contacts: Contact[];
  isLoading: boolean;
  error: string | null;
  searchQuery: string;
  setContacts: (contacts: Contact[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSearchQuery: (query: string) => void;
  addContact: (contact: Contact) => void;
  updateContact: (contact: Contact) => void;
  removeContact: (contactId: string) => void;
}

export const useContactsStore = create<ContactsStore>((set) => ({
  contacts: [],
  isLoading: false,
  error: null,
  searchQuery: '',

  setContacts: (contacts) => set({ contacts }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setSearchQuery: (query) => set({ searchQuery: query }),

  addContact: (contact) =>
    set((state) => ({
      contacts: [...state.contacts, contact],
    })),

  updateContact: (contact) =>
    set((state) => ({
      contacts: state.contacts.map((c) => (c.id === contact.id ? contact : c)),
    })),

  removeContact: (contactId) =>
    set((state) => ({
      contacts: state.contacts.filter((c) => c.id !== contactId),
    })),
}));

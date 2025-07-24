import { create } from 'zustand';

interface SidebarState {
  // State
  isOpen: boolean;

  // Actions
  openSidebar: () => void;
  closeSidebar: () => void;
  toggleSidebar: () => void;
}

export const useSidebarStore = create<SidebarState>((set) => ({
  // Initial state
  isOpen: false,

  // Actions
  openSidebar: () => set({ isOpen: true }),
  closeSidebar: () => set({ isOpen: false }),
  toggleSidebar: () => set((state) => ({ isOpen: !state.isOpen })),
}));

// Selectors for easy access
export const useSidebar = () => {
  const isOpen = useSidebarStore((state) => state.isOpen);
  const openSidebar = useSidebarStore((state) => state.openSidebar);
  const closeSidebar = useSidebarStore((state) => state.closeSidebar);
  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);

  return { isOpen, openSidebar, closeSidebar, toggleSidebar };
};

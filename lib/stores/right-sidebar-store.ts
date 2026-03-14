import { create } from 'zustand';

interface RightSidebarState {
  isOpen: boolean;
  toggle: () => void;
  open: () => void;
  close: () => void;
}

export const useRightSidebarStore = create<RightSidebarState>((set) => ({
  isOpen: false,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));

export const useRightSidebar = () => {
  const isOpen = useRightSidebarStore((state) => state.isOpen);
  const toggle = useRightSidebarStore((state) => state.toggle);
  const open = useRightSidebarStore((state) => state.open);
  const close = useRightSidebarStore((state) => state.close);
  return { isOpen, toggle, open, close };
};

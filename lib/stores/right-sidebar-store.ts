import { create } from 'zustand';

type RightSidebarPanel = 'manage-event-menu';

interface ManageEventSidebarContext {
  eventId: string;
  eventType?: string | null;
  eventStatus?: string | null;
}

interface RightSidebarState {
  isOpen: boolean;
  panel: RightSidebarPanel;
  manageEventContext: ManageEventSidebarContext | null;
  toggle: () => void;
  open: () => void;
  close: () => void;
  openManageEventMenu: (context: ManageEventSidebarContext) => void;
}

export const useRightSidebarStore = create<RightSidebarState>((set) => ({
  isOpen: false,
  panel: 'manage-event-menu',
  manageEventContext: null,
  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  openManageEventMenu: (context) =>
    set({
      isOpen: true,
      panel: 'manage-event-menu',
      manageEventContext: context,
    }),
}));

export const useRightSidebar = () => {
  const isOpen = useRightSidebarStore((state) => state.isOpen);
  const panel = useRightSidebarStore((state) => state.panel);
  const manageEventContext = useRightSidebarStore((state) => state.manageEventContext);
  const toggle = useRightSidebarStore((state) => state.toggle);
  const open = useRightSidebarStore((state) => state.open);
  const close = useRightSidebarStore((state) => state.close);
  const openManageEventMenu = useRightSidebarStore((state) => state.openManageEventMenu);

  return {
    isOpen,
    panel,
    manageEventContext,
    toggle,
    open,
    close,
    openManageEventMenu,
  };
};

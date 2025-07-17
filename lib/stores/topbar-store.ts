import { create } from 'zustand';
import type { ReactNode } from 'react';

interface TopBarState {
  // State
  title: string;
  subtitle: string;
  rightContent: ReactNode | null;
  isTransparent: boolean;
  
  // Actions
  setTopBar: (config: Partial<Pick<TopBarState, 'title' | 'subtitle' | 'rightContent' | 'isTransparent'>>) => void;
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  setRightContent: (content: ReactNode | null) => void;
  setTransparent: (isTransparent: boolean) => void;
  reset: () => void;
}

const initialState = {
  title: '',
  subtitle: '',
  rightContent: null,
  isTransparent: false,
};

export const useTopBarStore = create<TopBarState>((set) => ({
  // Initial state
  ...initialState,
  
  // Actions
  setTopBar: (config) => set((state) => ({ ...state, ...config })),
  setTitle: (title) => set({ title }),
  setSubtitle: (subtitle) => set({ subtitle }),
  setRightContent: (rightContent) => set({ rightContent }),
  setTransparent: (isTransparent) => set({ isTransparent }),
  reset: () => set(initialState),
}));

// Selector hook for easy access
export const useTopBar = () => {
  const title = useTopBarStore((state) => state.title);
  const subtitle = useTopBarStore((state) => state.subtitle);
  const rightContent = useTopBarStore((state) => state.rightContent);
  const isTransparent = useTopBarStore((state) => state.isTransparent);
  const setTopBar = useTopBarStore((state) => state.setTopBar);
  const setTitle = useTopBarStore((state) => state.setTitle);
  const setSubtitle = useTopBarStore((state) => state.setSubtitle);
  const setRightContent = useTopBarStore((state) => state.setRightContent);
  const setTransparent = useTopBarStore((state) => state.setTransparent);
  const reset = useTopBarStore((state) => state.reset);
  
  return {
    title,
    subtitle,
    rightContent,
    isTransparent,
    setTopBar,
    setTitle,
    setSubtitle,
    setRightContent,
    setTransparent,
    reset,
  };
};
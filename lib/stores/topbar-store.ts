import type { ReactNode } from "react";
import { create } from "zustand";
import { LucideIcon } from "lucide-react";

export type LeftMode = "menu" | "back";
export type CenterMode = "title" | "empty";

export interface TopBarButton {
  id: string;
  icon: LucideIcon;
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

interface TopBarState {
  // State
  leftMode: LeftMode;
  onBackPress: (() => void) | null;
  centerMode: CenterMode;
  title: string;
  subtitle: string;
  buttons: TopBarButton[];
  showAvatar: boolean;
  isOverlaid: boolean;

  // Actions
  setTopBar: (
    config: Partial<
      Pick<TopBarState, "leftMode" | "onBackPress" | "centerMode" | "title" | "subtitle" | "buttons" | "showAvatar" | "isOverlaid">
    >,
  ) => void;
  setLeftMode: (mode: LeftMode) => void;
  setBackHandler: (handler: (() => void) | null) => void;
  setCenterMode: (mode: CenterMode) => void;
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  setButtons: (buttons: TopBarButton[]) => void;
  setShowAvatar: (show: boolean) => void;
  setOverlaid: (isOverlaid: boolean) => void;
  reset: () => void;
}

const initialState = {
  leftMode: "menu" as LeftMode,
  onBackPress: null,
  centerMode: "title" as CenterMode,
  title: "",
  subtitle: "",
  buttons: [],
  showAvatar: true,
  isOverlaid: false,
};

export const useTopBarStore = create<TopBarState>((set) => ({
  // Initial state
  ...initialState,

  // Actions
  setTopBar: (config) => set((state) => ({ ...state, ...config })),
  setLeftMode: (leftMode) => set({ leftMode }),
  setBackHandler: (onBackPress) => set({ onBackPress }),
  setCenterMode: (centerMode) => set({ centerMode }),
  setTitle: (title) => set({ title }),
  setSubtitle: (subtitle) => set({ subtitle }),
  setButtons: (buttons) => set({ buttons }),
  setShowAvatar: (showAvatar) => set({ showAvatar }),
  setOverlaid: (isOverlaid) => set({ isOverlaid }),
  reset: () => set(initialState),
}));

// Selector hook for easy access
export const useTopBar = () => {
  const leftMode = useTopBarStore((state) => state.leftMode);
  const onBackPress = useTopBarStore((state) => state.onBackPress);
  const centerMode = useTopBarStore((state) => state.centerMode);
  const title = useTopBarStore((state) => state.title);
  const subtitle = useTopBarStore((state) => state.subtitle);
  const buttons = useTopBarStore((state) => state.buttons);
  const showAvatar = useTopBarStore((state) => state.showAvatar);
  const isOverlaid = useTopBarStore((state) => state.isOverlaid);
  const setTopBar = useTopBarStore((state) => state.setTopBar);
  const setLeftMode = useTopBarStore((state) => state.setLeftMode);
  const setBackHandler = useTopBarStore((state) => state.setBackHandler);
  const setCenterMode = useTopBarStore((state) => state.setCenterMode);
  const setTitle = useTopBarStore((state) => state.setTitle);
  const setSubtitle = useTopBarStore((state) => state.setSubtitle);
  const setButtons = useTopBarStore((state) => state.setButtons);
  const setShowAvatar = useTopBarStore((state) => state.setShowAvatar);
  const setOverlaid = useTopBarStore((state) => state.setOverlaid);
  const reset = useTopBarStore((state) => state.reset);

  return {
    leftMode,
    onBackPress,
    centerMode,
    title,
    subtitle,
    buttons,
    showAvatar,
    isOverlaid,
    setTopBar,
    setLeftMode,
    setBackHandler,
    setCenterMode,
    setTitle,
    setSubtitle,
    setButtons,
    setShowAvatar,
    setOverlaid,
    reset,
  };
};

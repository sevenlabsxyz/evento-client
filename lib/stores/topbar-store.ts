import { LucideIcon } from 'lucide-react';
import { create } from 'zustand';
import { VerificationStatus } from '../types/api';

export type LeftMode = 'menu' | 'back';
export type CenterMode = 'title' | 'empty' | 'logo' | 'chat-partner';

export interface TopBarButton {
  id: string;
  icon: LucideIcon;
  onClick: () => void;
  label?: string;
  disabled?: boolean;
}

interface TopBarConfig {
  leftMode: LeftMode;
  onBackPress: (() => void) | null;
  centerMode: CenterMode;
  title: string;
  subtitle: string;
  badge?: string;
  badgePath?: string;
  buttons: TopBarButton[];
  showAvatar: boolean;
  isOverlaid: boolean;
  chatPartner?: {
    name: string;
    image?: string;
    username?: string;
    verification_status?: VerificationStatus;
  };
}

interface TopBarState extends TopBarConfig {
  // Route tracking
  currentRoute: string | null;
  routeConfigs: Map<string, Partial<TopBarConfig>>;

  // Actions
  setTopBar: (config: Partial<TopBarConfig>) => void;
  setTopBarForRoute: (route: string, config: Partial<TopBarConfig>) => void;
  setLeftMode: (mode: LeftMode) => void;
  setBackHandler: (handler: (() => void) | null) => void;
  setCenterMode: (mode: CenterMode) => void;
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
  setButtons: (buttons: TopBarButton[]) => void;
  setShowAvatar: (show: boolean) => void;
  setOverlaid: (isOverlaid: boolean) => void;
  setChatPartner: (
    partner: { name: string; image?: string; username?: string } | undefined
  ) => void;
  reset: () => void;
  resetForRoute: (route: string) => void;
  clearRoute: (route: string) => void;
  applyRouteConfig: (route: string) => void;
}

const initialState: TopBarConfig = {
  leftMode: 'menu' as LeftMode,
  onBackPress: null,
  centerMode: 'title' as CenterMode,
  title: '',
  subtitle: '',
  buttons: [],
  showAvatar: true,
  isOverlaid: false,
};

export const useTopBarStore = create<TopBarState>((set, get) => ({
  // Initial state
  ...initialState,
  currentRoute: null,
  routeConfigs: new Map(),

  // Actions
  setTopBar: (config) => {
    const currentRoute = get().currentRoute;

    // Store configuration for current route
    if (currentRoute) {
      const routeConfigs = new Map(get().routeConfigs);
      routeConfigs.set(currentRoute, {
        ...routeConfigs.get(currentRoute),
        ...config,
      });
      set((state) => ({ ...state, ...config, routeConfigs }));
    } else {
      set((state) => ({ ...state, ...config }));
    }
  },

  setTopBarForRoute: (route, config) => {
    const routeConfigs = new Map(get().routeConfigs);
    routeConfigs.set(route, { ...routeConfigs.get(route), ...config });

    // Only update UI state if this is the current route
    if (get().currentRoute === route) {
      set((state) => ({
        ...state,
        ...config,
        routeConfigs,
        currentRoute: route,
      }));
    } else {
      set((state) => ({ ...state, routeConfigs }));
    }
  },

  applyRouteConfig: (route) => {
    const routeConfigs = get().routeConfigs;
    const routeConfig = routeConfigs.get(route);

    if (routeConfig) {
      set((state) => ({
        ...state,
        ...initialState,
        ...routeConfig,
        currentRoute: route,
      }));
    } else {
      set((state) => ({ ...state, ...initialState, currentRoute: route }));
    }
  },

  clearRoute: (route) => {
    const routeConfigs = new Map(get().routeConfigs);
    routeConfigs.delete(route);

    // Only reset state if clearing the current route
    if (get().currentRoute === route) {
      set({ ...initialState, currentRoute: null, routeConfigs });
    } else {
      // Just update routeConfigs without resetting everything
      set((state) => ({ ...state, routeConfigs }));
    }
  },

  setLeftMode: (leftMode) => set({ leftMode }),
  setBackHandler: (onBackPress) => set({ onBackPress }),
  setCenterMode: (centerMode) => set({ centerMode }),
  setTitle: (title) => set({ title }),
  setSubtitle: (subtitle) => set({ subtitle }),
  setButtons: (buttons) => set({ buttons }),
  setShowAvatar: (showAvatar) => set({ showAvatar }),
  setOverlaid: (isOverlaid) => set({ isOverlaid }),
  setChatPartner: (chatPartner) => set({ chatPartner }),

  reset: () => set({ ...initialState, currentRoute: null, routeConfigs: new Map() }),

  resetForRoute: (route) => {
    const currentRoute = get().currentRoute;
    if (currentRoute === route) {
      set({
        ...initialState,
        currentRoute: null,
        routeConfigs: new Map(get().routeConfigs),
      });
    }
  },
}));

// Selector hook for easy access
export const useTopBar = () => {
  const leftMode = useTopBarStore((state) => state.leftMode);
  const onBackPress = useTopBarStore((state) => state.onBackPress);
  const centerMode = useTopBarStore((state) => state.centerMode);
  const title = useTopBarStore((state) => state.title);
  const subtitle = useTopBarStore((state) => state.subtitle);
  const badge = useTopBarStore((state) => state.badge);
  const badgePath = useTopBarStore((state) => state.badgePath);
  const buttons = useTopBarStore((state) => state.buttons);
  const showAvatar = useTopBarStore((state) => state.showAvatar);
  const isOverlaid = useTopBarStore((state) => state.isOverlaid);
  const chatPartner = useTopBarStore((state) => state.chatPartner);
  const currentRoute = useTopBarStore((state) => state.currentRoute);
  const setTopBar = useTopBarStore((state) => state.setTopBar);
  const setTopBarForRoute = useTopBarStore((state) => state.setTopBarForRoute);
  const setLeftMode = useTopBarStore((state) => state.setLeftMode);
  const setBackHandler = useTopBarStore((state) => state.setBackHandler);
  const setCenterMode = useTopBarStore((state) => state.setCenterMode);
  const setTitle = useTopBarStore((state) => state.setTitle);
  const setSubtitle = useTopBarStore((state) => state.setSubtitle);
  const setButtons = useTopBarStore((state) => state.setButtons);
  const setShowAvatar = useTopBarStore((state) => state.setShowAvatar);
  const setOverlaid = useTopBarStore((state) => state.setOverlaid);
  const setChatPartner = useTopBarStore((state) => state.setChatPartner);
  const reset = useTopBarStore((state) => state.reset);
  const resetForRoute = useTopBarStore((state) => state.resetForRoute);
  const clearRoute = useTopBarStore((state) => state.clearRoute);
  const applyRouteConfig = useTopBarStore((state) => state.applyRouteConfig);

  return {
    leftMode,
    onBackPress,
    centerMode,
    title,
    subtitle,
    badge,
    badgePath,
    buttons,
    showAvatar,
    isOverlaid,
    chatPartner,
    currentRoute,
    setTopBar,
    setTopBarForRoute,
    setLeftMode,
    setBackHandler,
    setCenterMode,
    setTitle,
    setSubtitle,
    setButtons,
    setShowAvatar,
    setOverlaid,
    setChatPartner,
    reset,
    resetForRoute,
    clearRoute,
    applyRouteConfig,
  };
};

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DeveloperSettingsState {
  isDeveloperMode: boolean;
  setDeveloperMode: (enabled: boolean) => void;
  toggleDeveloperMode: () => void;
}

export const useDeveloperSettingsStore = create<DeveloperSettingsState>()(
  persist(
    (set) => ({
      isDeveloperMode: false,
      setDeveloperMode: (enabled) => set({ isDeveloperMode: enabled }),
      toggleDeveloperMode: () => set((state) => ({ isDeveloperMode: !state.isDeveloperMode })),
    }),
    {
      name: 'evento-developer-settings',
    }
  )
);

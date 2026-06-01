import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';

export type ColorScheme = 'light' | 'dark';

interface ThemeState {
  scheme: ColorScheme;
  /** True once the persisted choice has been read back from AsyncStorage. */
  hasHydrated: boolean;
  setHasHydrated: () => void;
  setScheme: (scheme: ColorScheme) => void;
  toggle: () => void;
}

/** First-launch default: follow the device appearance (persisted choice wins after). */
function deviceScheme(): ColorScheme {
  return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light';
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      scheme: deviceScheme(),
      hasHydrated: false,
      setHasHydrated: () => set({ hasHydrated: true }),
      setScheme: (scheme) => set({ scheme }),
      toggle: () => set((s) => ({ scheme: s.scheme === 'dark' ? 'light' : 'dark' })),
    }),
    {
      name: 'fujitex-theme',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({ scheme: s.scheme }),
      onRehydrateStorage: () => (state) => state?.setHasHydrated(),
    },
  ),
);

/* ----------------------------- selector hooks ----------------------------- */

export const useColorScheme = () => useThemeStore((s) => s.scheme);

export const useIsDark = () => useThemeStore((s) => s.scheme === 'dark');

export const useThemeActions = () =>
  useThemeStore(useShallow((s) => ({ setScheme: s.setScheme, toggle: s.toggle })));

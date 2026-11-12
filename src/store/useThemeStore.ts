import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export interface ThemeStoreState {
  themeMode: ThemeMode;
  /** true setelah tema tersimpan dibaca dari storage (lihat AppThemeProvider). */
  hasHydrated: boolean;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const customStorage = {
  getItem: (name: string): string | null => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        return localStorage.getItem(name);
      } catch {
        return null;
      }
    }
    return null;
  },
  setItem: (name: string, value: string): void => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        localStorage.setItem(name, value);
      } catch {
        // ignore
      }
    }
  },
  removeItem: (name: string): void => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      try {
        localStorage.removeItem(name);
      } catch {
        // ignore
      }
    }
  },
};

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set) => ({
      // Selalu mulai dari light: sama dengan HTML statis hasil export web, agar hydrate tidak
      // bercampur tema. Tema tersimpan diterapkan lewat rehydrate() setelah mount.
      themeMode: 'light',
      hasHydrated: false,
      setThemeMode: (themeMode: ThemeMode) => set({ themeMode }),
      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === 'dark' ? 'light' : 'dark',
        })),
    }),
    {
      name: 'bubox-theme-storage',
      storage: createJSONStorage(() => customStorage),
      partialize: (state) => ({ themeMode: state.themeMode }),
      skipHydration: true,
      onRehydrateStorage: () => () => {
        useThemeStore.setState({ hasHydrated: true });
      },
    }
  )
);

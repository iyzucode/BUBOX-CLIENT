import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Platform } from 'react-native';

export type ThemeMode = 'light' | 'dark';

export interface ThemeStoreState {
  themeMode: ThemeMode;
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

const getInitialTheme = (): ThemeMode => {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('bubox-theme-storage');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.state?.themeMode === 'dark' || parsed?.state?.themeMode === 'light') {
          return parsed.state.themeMode;
        }
      }
    } catch {
      // fallback
    }
  }
  return 'light';
};

export const useThemeStore = create<ThemeStoreState>()(
  persist(
    (set) => ({
      themeMode: getInitialTheme(),
      setThemeMode: (themeMode: ThemeMode) => set({ themeMode }),
      toggleTheme: () =>
        set((state) => ({
          themeMode: state.themeMode === 'dark' ? 'light' : 'dark',
        })),
    }),
    {
      name: 'bubox-theme-storage',
      storage: createJSONStorage(() => customStorage),
    }
  )
);

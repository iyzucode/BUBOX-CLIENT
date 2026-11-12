import React, { createContext, useContext, useEffect } from 'react';
import { Platform } from 'react-native';
import { Colors, ColorTheme } from '@/constants/theme';
import { useThemeStore, ThemeMode } from '@/store/useThemeStore';

export interface ThemeContextType {
  themeMode: ThemeMode;
  isDark: boolean;
  theme: ColorTheme;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

export const ThemeContext = createContext<ThemeContextType>({
  themeMode: 'light',
  isDark: false,
  theme: Colors.light,
  toggleTheme: () => {},
  setThemeMode: () => {},
});

export const AppThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const themeMode = useThemeStore((state) => state.themeMode);
  const setThemeMode = useThemeStore((state) => state.setThemeMode);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  const hasHydrated = useThemeStore((state) => state.hasHydrated);
  const isDark = themeMode === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

  // Baca tema tersimpan setelah mount (bukan saat render pertama), supaya render pertama di browser
  // sama dengan HTML statis (light) dan seluruh komponen ikut dirender ulang dengan tema yang benar.
  useEffect(() => {
    void useThemeStore.persist.rehydrate();
  }, []);

  useEffect(() => {
    // Tema sudah terpasang: tampilkan lagi konten yang disembunyikan script di +html.tsx
    if (hasHydrated && Platform.OS === 'web' && typeof document !== 'undefined') {
      document.documentElement.removeAttribute('data-theme-pending');
    }
  }, [hasHydrated, themeMode]);

  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.body.style.backgroundColor = theme.background;
      document.body.style.color = theme.text;
      document.documentElement.style.backgroundColor = theme.background;
      document.documentElement.style.color = theme.text;
      document.documentElement.setAttribute('data-theme', themeMode);

      const rootEl = document.getElementById('root');
      if (rootEl) {
        rootEl.style.backgroundColor = theme.background;
        rootEl.style.color = theme.text;
      }
    }
  }, [themeMode, theme]);

  const contextValue = React.useMemo(
    () => ({
      themeMode,
      isDark,
      theme,
      toggleTheme,
      setThemeMode,
    }),
    [themeMode, isDark, theme, toggleTheme, setThemeMode]
  );

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);

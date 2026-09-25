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
  const isDark = themeMode === 'dark';
  const theme = isDark ? Colors.dark : Colors.light;

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

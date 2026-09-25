import { useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import { Colors, ColorTheme } from '@/constants/theme';
import { useThemeStore } from '@/store/useThemeStore';

export function useTheme(): ColorTheme {
  const context = useContext(ThemeContext);
  if (context && context.theme) {
    return context.theme;
  }
  const mode = useThemeStore.getState().themeMode;
  return mode === 'dark' ? Colors.dark : Colors.light;
}

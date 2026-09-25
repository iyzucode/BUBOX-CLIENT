import { useContext } from 'react';
import { ThemeContext } from '@/context/ThemeContext';
import { useThemeStore } from '@/store/useThemeStore';

export function useColorScheme(): 'light' | 'dark' {
  const context = useContext(ThemeContext);
  if (context && context.themeMode) {
    return context.themeMode;
  }
  return useThemeStore.getState().themeMode;
}

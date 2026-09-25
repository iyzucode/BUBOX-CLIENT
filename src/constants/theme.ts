import '@/global.css';
import { DimensionValue, Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1E293B',
    textSecondary: '#64748B',
    background: '#F8F9FA',
    backgroundElement: '#F1F5F9',
    backgroundSelected: '#FFF0E8',
    primary: '#F36F21',
    primaryHover: '#D95305',
    primaryLight: '#FFF0E8',
    secondary: '#005B64',
    secondaryHover: '#004850',
    border: '#E5E7EB',
    card: '#FFFFFF',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
  dark: {
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    background: '#0B0F17',
    backgroundElement: '#141A23',
    backgroundSelected: '#2A1F18',
    primary: '#F36F21',
    primaryHover: '#FA823D',
    primaryLight: '#3D2214',
    secondary: '#007A87',
    secondaryHover: '#0097A7',
    border: '#ffffff15',
    card: '#111722',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export type ColorTheme = Record<ThemeColor, string>;

export const Fonts = Platform.select({
  ios: {
    sans: 'Open Sans',
    serif: 'ui-serif',
    rounded: 'Open Sans',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'Open Sans',
    serif: 'serif',
    rounded: 'Open Sans',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 72, android: 80, default: 68 });
export const MaxContentWidth: DimensionValue = '100%';

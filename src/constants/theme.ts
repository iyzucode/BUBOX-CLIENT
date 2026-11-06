import '@/global.css';
import { DimensionValue, Platform } from 'react-native';

/**
 * Palet brand BUBOX
 *   Brand Orange  #EE4D2D  aksi utama (tombol, pilihan aktif)
 *   Brand Red     #D0011B  hover/pressed, aksen, harga & peringatan
 *   Brand Navy    #113366  teks utama, header, elemen sekunder
 * Light mode memakai turunan terang dari ketiganya; dark mode berbasis hitam/abu netral
 * dengan oranye sebagai satu-satunya warna aksen.
 */
export const Brand = {
  orange: '#EE4D2D',
  red: '#D0011B',
  navy: '#113366',
} as const;

export const Colors = {
  light: {
    text: Brand.navy,
    textSecondary: '#5A6B86',
    background: '#FFF7F5',
    backgroundElement: '#FDEEEA',
    backgroundSelected: '#FDE3DC',
    primary: Brand.orange,
    primaryHover: Brand.red,
    primaryLight: '#FDE8E3',
    onPrimary: '#FFFFFF',
    secondary: Brand.navy,
    secondaryHover: '#0B2447',
    secondaryLight: '#E7ECF5',
    accent: Brand.red,
    border: '#F2DCD5',
    card: '#FFFFFF',
    success: '#16A34A',
    warning: '#F59E0B',
    danger: Brand.red,
  },
  dark: {
    text: '#F4F4F5',
    textSecondary: '#A1A1AA',
    background: '#0A0A0A',
    backgroundElement: '#18181B',
    backgroundSelected: '#2A1712',
    primary: Brand.orange,
    primaryHover: '#FF6B4D',
    primaryLight: '#2E1610',
    onPrimary: '#FFFFFF',
    secondary: '#A1B4D9',
    secondaryHover: '#C3D0EA',
    secondaryLight: '#232326',
    accent: '#FF5A6A',
    border: '#FFFFFF14',
    card: '#141416',
    success: '#22C55E',
    warning: '#F59E0B',
    danger: '#FF5A6A',
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

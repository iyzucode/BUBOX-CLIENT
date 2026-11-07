import { Brand } from '@/constants/theme';
import { useThemeContext } from '@/context/ThemeContext';

/** Warna halaman auth (login, daftar, OTP, reset), sama dengan layar login. */
export function useAuthPalette() {
  const { isDark } = useThemeContext();

  return {
    isDark,
    pageBg: isDark ? '#0A0A0A' : '#FFF7F5',
    cardBg: isDark ? '#18181B' : '#FFFFFF',
    inputBg: isDark ? '#232326' : '#FDEEEA',
    text: isDark ? '#F4F4F5' : Brand.navy,
    textMuted: isDark ? '#A1A1AA' : '#5A6B86',
    placeholder: isDark ? '#71717A' : '#8A96AC',
    icon: isDark ? '#E4E4E7' : Brand.navy,
    primary: Brand.orange,
    onPrimary: '#FFFFFF',
    danger: isDark ? '#FF5A6A' : Brand.red,
    border: isDark ? '#27272A' : '#F2DCD5',
  };
}

export type AuthPalette = ReturnType<typeof useAuthPalette>;

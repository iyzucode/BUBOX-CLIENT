import { Brand } from '@/constants/theme';
import { useThemeStore } from '@/store/useThemeStore';

export interface ProfilePalette {
  isDark: boolean;
  screenBg: string;
  cardBg: string;
  cardBorder: string;
  cardTitle: string;
  cardSubtext: string;
  divider: string;
  actionBoxBg: string;
  actionBoxBorder: string;
  actionIconColor: string;
  actionLabel: string;
  closeBtnBg: string;
  closeBtnIcon: string;
  heroOverlay: string;
  heroTitle: string;
  avatarBorder: string;
  menuItemBg: string;
  menuItemHover: string;
  menuIconColor: string;
  menuTextColor: string;
  chevronColor: string;
  switchTrackOff: string;
  switchTrackOn: string;
  switchThumb: string;
  logoutBg: string;
  logoutBorder: string;
  logoutText: string;
}

const DARK: ProfilePalette = {
  isDark: true,
  screenBg: '#0A0A0A',
  cardBg: '#18181B',
  cardBorder: 'rgba(255, 255, 255, 0.08)',
  cardTitle: '#F4F4F5',
  cardSubtext: '#A1A1AA',
  divider: 'rgba(255, 255, 255, 0.1)',
  actionBoxBg: '#232326',
  actionBoxBorder: 'rgba(255, 255, 255, 0.08)',
  actionIconColor: '#FF8A70',
  actionLabel: '#D4D4D8',
  closeBtnBg: '#FFFFFF',
  closeBtnIcon: '#0A0A0A',
  heroOverlay: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, rgba(10,10,10,0.95) 100%)',
  heroTitle: '#FFFFFF',
  avatarBorder: '#18181B',
  menuItemBg: 'transparent',
  menuItemHover: 'rgba(255, 255, 255, 0.04)',
  menuIconColor: '#F4F4F5',
  menuTextColor: '#F4F4F5',
  chevronColor: '#A1A1AA',
  switchTrackOff: '#3F3F46',
  switchTrackOn: Brand.orange,
  switchThumb: '#FFFFFF',
  logoutBg: '#18181B',
  logoutBorder: 'rgba(255, 255, 255, 0.08)',
  logoutText: '#FF5A6A',
};

const LIGHT: ProfilePalette = {
  isDark: false,
  screenBg: '#FFF7F5',
  cardBg: '#FFFFFF',
  cardBorder: '#F2DCD5',
  cardTitle: Brand.navy,
  cardSubtext: '#5A6B86',
  divider: '#F2DCD5',
  actionBoxBg: '#FDE8E3',
  actionBoxBorder: 'rgba(238, 77, 45, 0.12)',
  actionIconColor: Brand.orange,
  actionLabel: Brand.navy,
  closeBtnBg: '#FFFFFF',
  closeBtnIcon: Brand.navy,
  heroOverlay: 'linear-gradient(180deg, rgba(17,51,102,0.55) 0%, rgba(17,51,102,0.1) 60%, rgba(255,247,245,0.95) 100%)',
  heroTitle: '#FFFFFF',
  avatarBorder: '#FFFFFF',
  menuItemBg: 'transparent',
  menuItemHover: 'rgba(238, 77, 45, 0.05)',
  menuIconColor: Brand.navy,
  menuTextColor: Brand.navy,
  chevronColor: '#5A6B86',
  switchTrackOff: '#CBD5E1',
  switchTrackOn: Brand.orange,
  switchThumb: '#FFFFFF',
  logoutBg: '#FFFFFF',
  logoutBorder: '#F2DCD5',
  logoutText: Brand.red,
};

export function useProfilePalette(): ProfilePalette {
  const isDark = useThemeStore((s) => s.themeMode) === 'dark';
  return isDark ? DARK : LIGHT;
}

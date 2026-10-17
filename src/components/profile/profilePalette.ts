import { useTheme } from '@/hooks/use-theme';
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

export function useProfilePalette(): ProfilePalette {
  const theme = useTheme();
  const themeMode = useThemeStore((s) => s.themeMode);
  const isDark = themeMode === 'dark';

  if (isDark) {
    return {
      isDark: true,
      screenBg: '#0B0F17',
      cardBg: '#1A2230',
      cardBorder: 'rgba(255, 255, 255, 0.08)',
      cardTitle: '#F8FAFC',
      cardSubtext: '#94A3B8',
      divider: 'rgba(255, 255, 255, 0.1)',
      actionBoxBg: '#242F42',
      actionBoxBorder: 'rgba(255, 255, 255, 0.08)',
      actionIconColor: '#F8FAFC',
      actionLabel: '#CBD5E1',
      closeBtnBg: '#FFFFFF',
      closeBtnIcon: '#111827',
      heroOverlay: 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 60%, rgba(11,15,23,0.95) 100%)',
      heroTitle: '#FFFFFF',
      avatarBorder: '#1A2230',
      menuItemBg: 'transparent',
      menuItemHover: 'rgba(255, 255, 255, 0.04)',
      menuIconColor: '#F1F5F9',
      menuTextColor: '#F1F5F9',
      chevronColor: '#94A3B8',
      switchTrackOff: '#334155',
      switchTrackOn: '#F36F21',
      switchThumb: '#FFFFFF',
      logoutBg: '#1A2230',
      logoutBorder: 'rgba(255, 255, 255, 0.08)',
      logoutText: '#F8FAFC',
    };
  }

  // Light Mode matching user reference design
  return {
    isDark: false,
    screenBg: '#F3F4F6',
    cardBg: '#E2E5EB',
    cardBorder: 'rgba(0, 0, 0, 0.04)',
    cardTitle: '#111827',
    cardSubtext: '#6B7280',
    divider: '#D1D5DB',
    actionBoxBg: '#FFFFFF',
    actionBoxBorder: 'rgba(0, 0, 0, 0.06)',
    actionIconColor: '#111827',
    actionLabel: '#374151',
    closeBtnBg: '#FFFFFF',
    closeBtnIcon: '#111827',
    heroOverlay: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.1) 60%, rgba(243,244,246,0.95) 100%)',
    heroTitle: '#FFFFFF',
    avatarBorder: '#E2E5EB',
    menuItemBg: 'transparent',
    menuItemHover: 'rgba(0, 0, 0, 0.03)',
    menuIconColor: '#111827',
    menuTextColor: '#111827',
    chevronColor: '#4B5563',
    switchTrackOff: '#9CA3AF',
    switchTrackOn: '#374151',
    switchThumb: '#FFFFFF',
    logoutBg: '#E2E5EB',
    logoutBorder: 'rgba(0, 0, 0, 0.04)',
    logoutText: '#111827',
  };
}

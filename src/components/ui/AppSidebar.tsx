import React, { useEffect, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogout } from '@/features/auth/useLogout';

interface NavItem {
  id: string;
  label: string;
  path: string;
  badge?: string;
}

const CUSTOMER_NAV_ITEMS: NavItem[] = [
  { id: 'home', label: 'Beranda', path: '/' },
  { id: 'leads', label: 'Data Leads', path: '/order' },
  { id: 'activity', label: 'Activity', path: '/explore' },
  { id: 'orders', label: 'Pesanan Saya', path: '/orders' },
  { id: 'profile', label: 'Profile', path: '/profile' },
];

const ADMIN_NAV_ITEMS: NavItem[] = [
  { id: 'admin-dashboard', label: 'Ringkasan', path: '/admin' },
  { id: 'admin-orders', label: 'Pesanan Harian', path: '/admin/orders' },
  { id: 'admin-menu', label: 'Kelola Menu', path: '/admin/menu' },
  { id: 'admin-vouchers', label: 'Voucher', path: '/admin/vouchers' },
  { id: 'admin-settings', label: 'Cutoff & Bayar', path: '/admin/settings' },
];

interface SidebarIconProps {
  name: string;
  color: string;
  size?: number;
}

const SidebarIcon: React.FC<SidebarIconProps> = ({ name, color, size = 22 }) => {
  if (Platform.OS === 'web') {
    if (name === 'orders' || name === 'admin-orders') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2h12v20l-3-2-3 2-3-2-3 2z" />
          <line x1="9" y1="7" x2="15" y2="7" />
          <line x1="9" y1="11" x2="15" y2="11" />
          <line x1="9" y1="15" x2="13" y2="15" />
        </svg>
      );
    }
    if (name === 'admin-vouchers') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 0 0 0-4z" />
          <line x1="9.5" y1="14.5" x2="14.5" y2="9.5" />
          <circle cx="9.75" cy="9.75" r="0.6" />
          <circle cx="14.25" cy="14.25" r="0.6" />
        </svg>
      );
    }
    if (name === 'admin-settings') {
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="13" r="8" />
          <polyline points="12 9 12 13 15 15" />
          <line x1="9" y1="2" x2="15" y2="2" />
        </svg>
      );
    }
    if (name === 'home') {
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 9.5L12 3l9 6.5V20a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9.5z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      );
    }
    if (name === 'leads') {
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
    }
    if (name === 'activity') {
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2L2 7l10 5 10-5-10-5z" />
          <path d="M2 17l10 5 10-5" />
          <path d="M2 12l10 5 10-5" />
        </svg>
      );
    }
    if (name === 'profile') {
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      );
    }
    if (name === 'admin-dashboard') {
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      );
    }
    if (name === 'admin-menu') {
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
          <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
          <line x1="6" y1="1" x2="6" y2="4" />
          <line x1="10" y1="1" x2="10" y2="4" />
          <line x1="14" y1="1" x2="14" y2="4" />
        </svg>
      );
    }
    if (name === 'go-admin') {
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    }
  }

  const iconMap: Record<string, string> = {
    home: '🏠',
    leads: '📚',
    activity: '📊',
    profile: '👤',
    orders: '🧾',
    'admin-dashboard': '📊',
    'admin-menu': '🍲',
    'admin-orders': '🧾',
    'admin-settings': '⏰',
    'admin-vouchers': '🎟️',
    'go-admin': '⚙️',
  };

  return (
    <ThemedText style={{ fontSize: size * 0.9 }}>
      {iconMap[name] || '📌'}
    </ThemedText>
  );
};

/** Urutan peran dari yang tertinggi; yang tampil di sidebar adalah peran tertinggi pengguna. */
const ROLE_PRIORITY = ['Super Admin', 'Owner', 'Admin', 'Kitchen', 'Driver', 'Customer'];

function primaryRoleLabel(roles?: string[]): string | null {
  if (!roles || roles.length === 0) return null;
  const lower = roles.map((r) => r.toLowerCase());
  const top = ROLE_PRIORITY.find((r) => lower.includes(r.toLowerCase())) ?? roles[0];
  return top.toUpperCase();
}

export const AppSidebar: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logoutMutation = useLogout();

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showText, setShowText] = useState(true);
  const expandTimerRef = useRef<any>(null);

  const isAdminArea = pathname.startsWith('/admin');
  // Selalu aktifkan akses Panel Admin di masa development
  const hasAdminRole = true;

  const toggleSidebar = () => {
    if (expandTimerRef.current) {
      clearTimeout(expandTimerRef.current);
    }

    if (!isCollapsed) {
      // SEDANG TERBUKA -> AKAN MENUTUP
      setShowText(false);
      setIsCollapsed(true);
    } else {
      // SEDANG TERTUTUP -> AKAN MEMBUKA
      setShowText(false);
      setIsCollapsed(false);
      expandTimerRef.current = setTimeout(() => {
        setShowText(true);
      }, 260);
    }
  };

  useEffect(() => {
    return () => {
      if (expandTimerRef.current) {
        clearTimeout(expandTimerRef.current);
      }
    };
  }, []);

  const isTabActive = (tabPath: string) => {
    if (tabPath === '/') {
      return pathname === '/';
    }
    if (tabPath === '/admin') {
      return pathname === '/admin';
    }
    return pathname === tabPath || pathname.startsWith(tabPath + '/');
  };

  const handleNavPress = (tabPath: string) => {
    if (pathname !== tabPath) {
      router.push(tabPath as any);
    }
  };

  const currentNavItems = isAdminArea
    ? ADMIN_NAV_ITEMS
    : [
        ...CUSTOMER_NAV_ITEMS,
        ...(hasAdminRole
          ? [{ id: 'go-admin', label: 'Panel Admin', path: '/admin' }]
          : []),
      ];

  return (
    <View
      style={[
        styles.sidebarWrapper,
        isCollapsed ? styles.sidebarCollapsed : styles.sidebarExpanded,
        {
          backgroundColor: theme.card,
          borderRightColor: theme.border,
        },
      ]}
    >
      {/* Header with Brand and Toggle */}
      <View
        style={[
          styles.headerRow,
          isCollapsed && styles.headerRowCollapsed,
        ]}
      >
        {!isCollapsed && (
          <Pressable
            onPress={() => router.push((isAdminArea ? '/admin' : '/') as any)}
            style={styles.brandContainer}
          >
            {/* Bubox Bank-Style Logo */}
            <View style={styles.logoMarkContainer}>
              <View style={[styles.logoSquare, { backgroundColor: theme.primary }]}>
                <View style={styles.logoInnerWhite} />
              </View>
            </View>
            {showText && (
              <View style={styles.brandTextWrapper}>
                <ThemedText style={[styles.brandTitleText, { color: theme.secondary }]} numberOfLines={1}>
                  BUBOX
                </ThemedText>
              </View>
            )}
          </Pressable>
        )}

        {/* Hamburger Toggle Button */}
        <Pressable
          onPress={toggleSidebar}
          style={({ pressed }) => [
            styles.hamburgerBtn,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
            pressed && styles.pressed,
          ]}
          accessibilityLabel={isCollapsed ? 'Perluas Menu' : 'Perkecil Menu'}
        >
          {Platform.OS === 'web' ? (
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.text}
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          ) : (
            <ThemedText style={{ fontSize: 16 }}>☰</ThemedText>
          )}
        </Pressable>
      </View>

      {/* Navigation Items */}
      <View style={styles.navSection}>
        <View style={styles.navItemsList}>
          {currentNavItems.map((item) => {
            const active = isTabActive(item.path);
            const isSwitchBtn = item.id === 'go-admin';
            const activeColor = theme.primary;
            const inactiveColor = isSwitchBtn ? theme.secondary : theme.textSecondary;
            const itemColor = active ? activeColor : inactiveColor;

            return (
              <Pressable
                key={item.id}
                onPress={() => handleNavPress(item.path)}
                style={({ pressed }) => [
                  styles.navItem,
                  isCollapsed ? styles.navItemCollapsed : styles.navItemExpanded,
                  active && {
                    backgroundColor: theme.primaryLight || '#FFF0E8',
                  },
                  isSwitchBtn && !active && {
                    backgroundColor: theme.backgroundElement,
                    borderWidth: 1,
                    borderColor: theme.border,
                  },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={item.label}
              >
                <View style={styles.iconBox}>
                  <SidebarIcon name={item.id} color={itemColor} size={22} />
                </View>

                {!isCollapsed && showText && (
                  <View style={styles.labelFadeWrapper}>
                    <ThemedText
                      type="default"
                      numberOfLines={1}
                      style={[
                        styles.navItemLabel,
                        {
                          color: active ? theme.primary : isSwitchBtn ? theme.secondary : theme.textSecondary,
                          fontWeight: active || isSwitchBtn ? '700' : '500',
                        },
                      ]}
                    >
                      {item.label}
                    </ThemedText>
                  </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Bottom Profile / Auth Section */}
      <View
        style={[
          styles.bottomSection,
          {
            borderTopColor: theme.border,
          },
        ]}
      >
        {/* Pita peran pengguna, tepat di atas kartu profil (area admin) */}
        {isAdminArea && isAuthenticated && user && !isCollapsed && showText && primaryRoleLabel(user.roles) ? (
          <View style={[styles.roleBand, { backgroundColor: theme.primaryLight || '#FFF0E8' }]}>
            <ThemedText style={[styles.roleBandText, { color: theme.primary }]} numberOfLines={1}>
              {primaryRoleLabel(user.roles)}
            </ThemedText>
          </View>
        ) : null}

        {isAuthenticated && user ? (
          <View
            style={[
              styles.userCard,
              { backgroundColor: theme.backgroundElement },
              isCollapsed && styles.userCardCollapsed,
            ]}
          >
            <Pressable
              onPress={() => router.push('/profile')}
              style={styles.avatarButton}
            >
              <UserAvatar
                user={user}
                size={38}
                fallbackBackground={theme.primaryLight || '#FFF0E8'}
                fallbackTextColor={theme.primary}
                style={[styles.avatarCircle, { borderColor: theme.primary }]}
              />
            </Pressable>

            {!isCollapsed && showText && (
              <>
                <View style={{ flex: 1, gap: 1, overflow: 'hidden' }}>
                  <ThemedText type="smallBold" numberOfLines={1}>
                    {user.fullName}
                  </ThemedText>
                  <ThemedText
                    type="small"
                    style={{ color: '#94A3B8', fontSize: 11 }}
                    numberOfLines={1}
                  >
                    {user.username ? `@${user.username}` : user.email}
                  </ThemedText>
                </View>

                <Pressable
                  onPress={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  style={styles.logoutIconButton}
                  accessibilityLabel="Keluar"
                >
                  {Platform.OS === 'web' ? (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="2"
                      strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      {/* Lingkaran terbuka + panah keluar (seperti desain) */}
                      <path d="M15.5 5.2A8 8 0 1 0 15.5 18.8" />
                      <line x1="10" y1="12" x2="21" y2="12" />
                      <polyline points="17.5 8.5 21 12 17.5 15.5" />
                    </svg>
                  ) : (
                    <ThemedText style={{ fontSize: 16, color: theme.text }}>⇥</ThemedText>
                  )}
                </Pressable>
              </>
            )}
          </View>
        ) : (
          <View style={styles.guestContainer}>
            <Pressable
              onPress={() => router.push('/login')}
              style={[
                styles.guestBtn,
                { backgroundColor: theme.primary },
                (isCollapsed || !showText) && { paddingHorizontal: 0, paddingVertical: 10 },
              ]}
            >
              <ThemedText
                type="smallBold"
                style={{ color: '#FFFFFF', fontSize: 12, textAlign: 'center' }}
              >
                {isCollapsed || !showText ? '🔑' : 'Masuk Akun'}
              </ThemedText>
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
};

/** Tinggi tiap menu sidebar (terbuka & tertutup). */
const NAV_ITEM_HEIGHT = 52;
/** Jarak ikon dari tepi kiri menu: (52 - ikon 24) / 2, sehingga ikon di tengah saat sidebar tertutup. */
const NAV_ICON_INSET = (NAV_ITEM_HEIGHT - 24) / 2;

const styles = StyleSheet.create({
  sidebarWrapper: {
    height: '100%',
    borderRightWidth: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    zIndex: 50,
    transitionProperty: 'width',
    transitionDuration: '250ms',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
    overflow: 'hidden',
  } as any,
  sidebarExpanded: {
    width: 220,
  },
  sidebarCollapsed: {
    width: 76,
    alignItems: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
    minHeight: 76,
  },
  headerRowCollapsed: {
    justifyContent: 'center',
    paddingHorizontal: 0,
    width: '100%',
  },
  brandContainer: {
    flex: 1,
    minWidth: 0, // boleh menyusut; tombol burger tidak
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 8,
    cursor: 'pointer' as any,
  },
  logoMarkContainer: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSquare: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInnerWhite: {
    width: 14,
    height: 14,
    backgroundColor: '#FFFFFF',
    borderRadius: 3,
    transform: [{ rotate: '45deg' }],
  },
  brandTextWrapper: {
    flexShrink: 1,
    minWidth: 0,
    justifyContent: 'center',
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  brandTitleText: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  roleBand: {
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  roleBandText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  hamburgerBtn: {
    flexShrink: 0,
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  navSection: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 12,
    width: '100%',
  },
  navItemsList: {
    gap: 8,
    width: '100%',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    cursor: 'pointer' as any,
    transitionProperty: 'background-color, transform',
    transitionDuration: '150ms',
  } as any,
  // Menu sama persis di kedua keadaan: tinggi tetap & ikon rata kiri dengan jarak tetap, jadi saat
  // sidebar dibuka/ditutup ikon diam di tempat dan latar menu ikut menyempit/melebar bersama sidebar.
  // Lebar sidebar tertutup (76) = padding navSection 12×2 + menu 52, jadi ikon pas di tengah.
  navItemExpanded: {
    height: NAV_ITEM_HEIGHT,
    paddingLeft: NAV_ICON_INSET,
    paddingRight: 16,
    borderRadius: 16,
    gap: 12,
  },
  navItemCollapsed: {
    height: NAV_ITEM_HEIGHT,
    paddingLeft: NAV_ICON_INSET,
    borderRadius: 16,
  },
  iconBox: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelFadeWrapper: {
    flex: 1,
    overflow: 'hidden',
  },
  navItemLabel: {
    fontSize: 15,
    letterSpacing: -0.2,
  },
  // Pita peran & blok profil menempel penuh selebar sidebar (tanpa jarak), seperti desain
  bottomSection: {
    borderTopWidth: 1,
    width: '100%',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  userCardCollapsed: {
    justifyContent: 'center',
  },
  avatarButton: {
    cursor: 'pointer' as any,
  },
  avatarCircle: {
    borderWidth: 1.5,
  },
  logoutIconButton: {
    padding: 6,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  guestContainer: {
    width: '100%',
    alignItems: 'center',
    padding: 12,
  },
  guestBtn: {
    width: '100%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});

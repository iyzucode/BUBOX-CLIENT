import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { usePathname, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

interface TabItem {
  id: string;
  label: string;
  path: string;
}

const CUSTOMER_TABS: TabItem[] = [
  { id: 'home', label: 'Beranda', path: '/' },
  { id: 'leads', label: 'Data Leads', path: '/order' },
  { id: 'activity', label: 'Activity', path: '/explore' },
  { id: 'profile', label: 'Profile', path: '/profile' },
];

const ADMIN_TABS: TabItem[] = [
  { id: 'admin-dashboard', label: 'Ringkasan', path: '/admin' },
  { id: 'admin-menu', label: 'Menu', path: '/admin/menu' },
  { id: 'back-customer', label: 'Web Customer', path: '/' },
];

interface IconProps {
  name: string;
  color: string;
  size?: number;
}

const TabIcon: React.FC<IconProps> = ({ name, color, size = 22 }) => {
  if (Platform.OS === 'web') {
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
    if (name === 'back-customer') {
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
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      );
    }
  }

  const iconMap: Record<string, string> = {
    home: '🏠',
    leads: '📚',
    activity: '📊',
    profile: '👤',
    'admin-dashboard': '📊',
    'admin-menu': '🍲',
    'back-customer': '🌐',
  };

  return (
    <ThemedText style={{ fontSize: size * 0.9 }}>
      {iconMap[name] || '📌'}
    </ThemedText>
  );
};

export const BottomFooter: React.FC = () => {
  const theme = useTheme();
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  const isAdminArea = pathname.startsWith('/admin');
  const tabs = isAdminArea ? ADMIN_TABS : CUSTOMER_TABS;

  const isTabActive = (tabPath: string) => {
    if (tabPath === '/') {
      return pathname === '/';
    }
    if (tabPath === '/admin') {
      return pathname === '/admin';
    }
    return pathname === tabPath || pathname.startsWith(tabPath + '/');
  };

  const handleTabPress = (tabPath: string) => {
    if (pathname !== tabPath) {
      router.push(tabPath as any);
    }
  };

  return (
    <View
      style={[
        styles.footerWrapper,
        {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          paddingBottom: Math.max(insets.bottom, 8),
        },
      ]}
    >
      <View style={styles.footerContainer}>
        {tabs.map((tab) => {
          const active = isTabActive(tab.path);
          const activeColor = theme.primary;
          const inactiveColor = '#94A3B8';
          const itemColor = active ? activeColor : inactiveColor;

          return (
            <Pressable
              key={tab.id}
              onPress={() => handleTabPress(tab.path)}
              style={({ pressed }) => [
                styles.tabItem,
                pressed && styles.pressed,
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              accessibilityLabel={tab.label}
            >
              <View style={styles.tabContent}>
                <TabIcon name={tab.id} color={itemColor} size={22} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerWrapper: {
    width: '100%',
    borderTopWidth: 1,
    paddingTop: 8,
    zIndex: 100,
    elevation: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  footerContainer: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    cursor: 'pointer' as any,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.94 }],
  },
});

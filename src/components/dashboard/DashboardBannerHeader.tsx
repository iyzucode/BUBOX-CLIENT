import React from 'react';
import {
  ImageBackground,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAuthStore } from '@/store/useAuthStore';
import { useTheme } from '@/hooks/use-theme';

interface DashboardBannerHeaderProps {
  onNotificationPress?: () => void;
  notificationCount?: number;
}

export const DashboardBannerHeader: React.FC<DashboardBannerHeaderProps> = ({
  onNotificationPress,
  notificationCount = 1,
}) => {
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);

  const displayName = user?.fullName || 'User JRM2';
  const displaySubtitle = user?.username
    ? `@${user.username} - Bubox | 06312`
    : '39102 - JRM/AKS | 06312';

  return (
    <View style={styles.bannerOuter}>
      {/* Background with Dark Warm Gradient Overlay */}
      <ImageBackground
        source={{
          uri: 'https://images.unsplash.com/photo-1556740758-90de374c12ad?q=80&w=1200&auto=format&fit=crop',
        }}
        style={styles.bannerImage}
        imageStyle={styles.bannerImageInner}
      >
        <View style={styles.overlayGradient}>
          <View style={styles.contentRow}>
            {/* User Info Group */}
            <View style={styles.userGroup}>
              <View style={styles.avatarContainer}>
                {Platform.OS === 'web' ? (
                  <svg
                    width="44"
                    height="44"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                ) : (
                  <ThemedText style={{ fontSize: 26 }}>👤</ThemedText>
                )}
              </View>

              <View style={styles.userInfoText}>
                <ThemedText style={styles.greetingText} numberOfLines={1}>
                  Hi, {displayName}
                </ThemedText>
                <ThemedText style={styles.subtitleText} numberOfLines={1}>
                  {displaySubtitle}
                </ThemedText>
              </View>
            </View>

            {/* Notification Bell Button */}
            <Pressable
              onPress={onNotificationPress}
              style={({ pressed }) => [
                styles.notificationButton,
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Notifikasi"
            >
              {Platform.OS === 'web' ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke={theme.primary}
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
              ) : (
                <ThemedText style={{ fontSize: 18 }}>🔔</ThemedText>
              )}

              {notificationCount > 0 && (
                <View style={[styles.badgeDot, { backgroundColor: '#EF4444' }]} />
              )}
            </Pressable>
          </View>
        </View>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  bannerOuter: {
    width: '100%',
    height: 210,
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerImageInner: {
    resizeMode: 'cover',
    opacity: 0.5,
  },
  overlayGradient: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 58,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 1200,
    alignSelf: 'center',
  },
  userGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarContainer: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfoText: {
    flex: 1,
    gap: 3,
  },
  greetingText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitleText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    cursor: 'pointer' as any,
    position: 'relative',
  },
  badgeDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});

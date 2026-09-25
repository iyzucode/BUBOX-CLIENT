import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { Link, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useThemeContext } from '@/context/ThemeContext';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogout } from '@/features/auth/useLogout';
import { useHealthCheck } from '@/features/system/useHealthCheck';

export const Navbar: React.FC = () => {
  const { theme, isDark, toggleTheme } = useThemeContext();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logoutMutation = useLogout();
  const { data: health, isLoading, isError } = useHealthCheck();
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);

  const userInitial = user?.fullName
    ? user.fullName.trim()[0].toUpperCase()
    : user?.username
    ? user.username.trim()[0].toUpperCase()
    : 'U';

  return (
    <View
      style={[
        styles.navWrapper,
        {
          backgroundColor: theme.background,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <View style={styles.navContainer}>
        {/* Brand Logo & Live Status */}
        <View style={styles.brandRow}>
          <Link href="/" asChild>
            <Pressable style={styles.brandLink}>
              <View
                style={[
                  styles.logoSquare,
                  { backgroundColor: theme.primary },
                ]}
              >
                <ThemedText type="smallBold" style={styles.logoSquareText}>
                  B
                </ThemedText>
              </View>
              <ThemedText type="subtitle" style={styles.brandName}>
                Bubox
              </ThemedText>
            </Pressable>
          </Link>

          {/* System Health Dot */}
          <View
            style={[
              styles.healthPill,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            {isLoading ? (
              <ActivityIndicator size={10} color={theme.primary} />
            ) : (
              <View
                style={[
                  styles.statusDot,
                  isError ? styles.dotError : styles.dotSuccess,
                ]}
              />
            )}
            <ThemedText type="code" style={styles.healthText}>
              {isLoading
                ? 'PING'
                : isError
                ? 'OFFLINE'
                : (health?.status || 'ONLINE').toUpperCase()}
            </ThemedText>
          </View>
        </View>

        {/* Auth Action Buttons / User Menu */}
        <View style={styles.actionsRow}>
          {isAuthenticated && user ? (
            <>
              {/* Google-Style Circular Avatar Trigger */}
              <Pressable
                onPress={() => setIsAccountMenuOpen(true)}
                style={({ pressed }) => [
                  styles.avatarTrigger,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.border,
                  },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Menu Akun"
              >
                <ThemedText style={styles.avatarTriggerText}>
                  {userInitial}
                </ThemedText>
              </Pressable>

              {/* Google-Style Account Popover Modal */}
              <Modal
                visible={isAccountMenuOpen}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setIsAccountMenuOpen(false)}
              >
                <View style={styles.modalRoot}>
                  {/* Fullscreen Backdrop */}
                  <Pressable
                    style={styles.modalBackdrop}
                    onPress={() => setIsAccountMenuOpen(false)}
                  />

                  {/* Floating Card Positioned Top-Right Under Navbar */}
                  <View style={styles.modalCardPositioner}>
                    <View
                      style={[
                        styles.accountCard,
                        {
                          backgroundColor: theme.card,
                          borderColor: theme.border,
                        },
                      ]}
                    >
                      {/* Top / Main Profile Area */}
                      <View style={styles.cardHeaderArea}>
                        {/* Large Avatar */}
                        <View
                          style={[
                            styles.avatarLarge,
                            { backgroundColor: theme.primary },
                          ]}
                        >
                          <ThemedText style={styles.avatarLargeText}>
                            {userInitial}
                          </ThemedText>
                        </View>

                        {/* Full Name */}
                        <ThemedText
                          type="default"
                          numberOfLines={1}
                          style={styles.accountCardName}
                        >
                          {(user.fullName || user.username || 'PENGGUNA').toUpperCase()}
                        </ThemedText>

                        {/* Handle / Username */}
                        <ThemedText
                          type="small"
                          numberOfLines={1}
                          style={[
                            styles.accountCardHandle,
                            { color: theme.textSecondary },
                          ]}
                        >
                          {user.username ? `@${user.username}` : user.email || ''}
                        </ThemedText>
                      </View>

                      {/* Middle Section: Setting Tema Dark / Light Mode (Toggle Switch) */}
                      <Pressable
                        style={({ pressed }) => [
                          styles.themeSettingSection,
                          {
                            borderTopColor: theme.border,
                            backgroundColor: theme.backgroundElement + '30',
                          },
                          pressed && styles.pressed,
                        ]}
                        onPress={toggleTheme}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: isDark }}
                        accessibilityLabel="Toggle Dark / Light Mode"
                      >
                        <View style={styles.themeToggleRow}>
                          <View style={styles.themeToggleInfo}>
                            <ThemedText
                              type="smallBold"
                              style={styles.themeToggleLabel}
                            >
                              {isDark ? 'Mode Gelap' : 'Mode Terang'}
                            </ThemedText>
                            <ThemedText
                              type="small"
                              style={[
                                styles.themeToggleSub,
                                { color: theme.textSecondary },
                              ]}
                            >
                              {isDark
                                ? 'Ketuk untuk beralih ke terang'
                                : 'Ketuk untuk beralih ke gelap'}
                            </ThemedText>
                          </View>

                          {/* Sun / Moon Toggle Switch */}
                          <Pressable
                            style={[
                              styles.toggleTrack,
                              isDark
                                ? styles.toggleTrackDark
                                : styles.toggleTrackLight,
                            ]}
                            onPress={toggleTheme}
                          >
                            <View
                              style={[
                                styles.toggleKnob,
                                isDark
                                  ? styles.toggleKnobDark
                                  : styles.toggleKnobLight,
                              ]}
                            >
                              {isDark ? (
                                Platform.OS === 'web' ? (
                                  <svg
                                    width="13"
                                    height="13"
                                    viewBox="0 0 24 24"
                                    fill="#FFFFFF"
                                    stroke="#FFFFFF"
                                    strokeWidth="1"
                                  >
                                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                  </svg>
                                ) : (
                                  <ThemedText style={{ fontSize: 11 }}>
                                    🌙
                                  </ThemedText>
                                )
                              ) : Platform.OS === 'web' ? (
                                <svg
                                  width="14"
                                  height="14"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="#1E293B"
                                  strokeWidth="2.4"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <circle cx="12" cy="12" r="4" />
                                  <line x1="12" y1="2" x2="12" y2="5" />
                                  <line x1="12" y1="19" x2="12" y2="22" />
                                  <line
                                    x1="4.22"
                                    y1="4.22"
                                    x2="6.34"
                                    y2="6.34"
                                  />
                                  <line
                                    x1="17.66"
                                    y1="17.66"
                                    x2="19.78"
                                    y2="19.78"
                                  />
                                  <line x1="2" y1="12" x2="5" y2="12" />
                                  <line x1="19" y1="12" x2="22" y2="12" />
                                  <line
                                    x1="4.22"
                                    y1="19.78"
                                    x2="6.34"
                                    y2="17.66"
                                  />
                                  <line
                                    x1="17.66"
                                    y1="6.34"
                                    x2="19.78"
                                    y2="4.22"
                                  />
                                </svg>
                              ) : (
                                <ThemedText style={{ fontSize: 11 }}>
                                  ☀️
                                </ThemedText>
                              )}
                            </View>
                          </Pressable>
                        </View>
                      </Pressable>

                      {/* Bottom Split Action Buttons */}
                      <View
                        style={[
                          styles.accountCardActions,
                          {
                            borderTopColor: theme.border,
                            backgroundColor: theme.backgroundElement + '60',
                          },
                        ]}
                      >
                        {/* Left Half: Profil */}
                        <Pressable
                          style={({ pressed }) => [
                            styles.actionHalfBtn,
                            pressed && styles.pressed,
                          ]}
                          onPress={() => {
                            setIsAccountMenuOpen(false);
                            router.push('/profile');
                          }}
                        >
                          <ThemedText
                            type="smallBold"
                            style={[
                              styles.actionHalfText,
                              { color: theme.text },
                            ]}
                          >
                            Profil
                          </ThemedText>
                        </Pressable>

                        {/* Divider */}
                        <View
                          style={[
                            styles.actionDivider,
                            { backgroundColor: theme.border },
                          ]}
                        />

                        {/* Right Half: Keluar */}
                        <Pressable
                          style={({ pressed }) => [
                            styles.actionHalfBtn,
                            pressed && styles.pressed,
                          ]}
                          disabled={logoutMutation.isPending}
                          onPress={() => {
                            setIsAccountMenuOpen(false);
                            logoutMutation.mutate();
                          }}
                        >
                          <ThemedText
                            type="smallBold"
                            style={[
                              styles.actionHalfText,
                              { color: '#EF4444' },
                            ]}
                          >
                            {logoutMutation.isPending ? '...' : 'Keluar'}
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              </Modal>
            </>
          ) : (
            <View style={styles.guestSection}>
              <Link href="/login" asChild>
                <Pressable
                  style={({ pressed }) => [
                    styles.navLoginBtn,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText type="smallBold" style={styles.navLoginText}>
                    Masuk
                  </ThemedText>
                </Pressable>
              </Link>

              <Link href="/register" asChild>
                <Pressable
                  style={({ pressed }) => [
                    styles.navRegisterBtn,
                    { backgroundColor: theme.primary },
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText type="smallBold" style={styles.navRegisterText}>
                    Daftar
                  </ThemedText>
                </Pressable>
              </Link>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  navWrapper: {
    width: '100%',
    borderBottomWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 10,
    zIndex: 10,
  },
  navContainer: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brandLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    cursor: 'pointer' as any,
  },
  logoSquare: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoSquareText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  brandName: {
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 24,
  },
  healthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSuccess: {
    backgroundColor: '#10B981',
  },
  dotError: {
    backgroundColor: '#EF4444',
  },
  healthText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    opacity: 0.8,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  avatarTrigger: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  avatarTriggerText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  modalRoot: {
    flex: 1,
    position: 'relative',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    zIndex: 1,
  },
  modalCardPositioner: {
    position: 'absolute',
    top: Platform.OS === 'web' ? 56 : 64,
    right: 16,
    width: 310,
    maxWidth: '92%',
    zIndex: 10,
  },
  accountCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  cardHeaderArea: {
    paddingTop: 24,
    paddingBottom: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatarLarge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  avatarLargeText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  accountCardName: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
    textAlign: 'center',
    marginBottom: 4,
  },
  accountCardHandle: {
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  themeSettingSection: {
    borderTopWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    cursor: 'pointer' as any,
  },
  themeToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  themeToggleInfo: {
    flex: 1,
    gap: 2,
  },
  themeToggleLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  themeToggleSub: {
    fontSize: 11,
  },
  toggleTrack: {
    width: 60,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    position: 'relative',
    justifyContent: 'center',
    cursor: 'pointer' as any,
    transitionProperty: 'background-color, border-color',
    transitionDuration: '220ms',
    transitionTimingFunction: 'ease-in-out',
  } as any,
  toggleTrackLight: {
    backgroundColor: '#F1F5F9',
    borderColor: '#CBD5E1',
  },
  toggleTrackDark: {
    backgroundColor: '#262A33',
    borderColor: '#3B4252',
  },
  toggleKnob: {
    position: 'absolute',
    top: 2,
    width: 25,
    height: 25,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    transitionProperty: 'left, background-color',
    transitionDuration: '220ms',
    transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
  } as any,
  toggleKnobLight: {
    left: 3,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  toggleKnobDark: {
    left: 29,
    backgroundColor: '#11141A',
    borderWidth: 1,
    borderColor: '#2D3748',
  },
  accountCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    height: 48,
  },
  actionHalfBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  actionHalfText: {
    fontSize: 14,
    fontWeight: '600',
  },
  actionDivider: {
    width: 1,
    height: '100%',
  },
  guestSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navLoginBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  navLoginText: {
    fontSize: 13,
    fontWeight: '600',
  },
  navRegisterBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  navRegisterText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
});

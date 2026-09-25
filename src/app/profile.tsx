import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Navbar } from '@/components/ui/Navbar';
import { WebBadge } from '@/components/web-badge';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogout } from '@/features/auth/useLogout';
import { useAddresses } from '@/features/biodata/useAddresses';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const logoutMutation = useLogout();
  const { data: addresses } = useAddresses();
  const primaryAddress = addresses?.find((a) => a.isPrimary) ?? addresses?.[0];

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Modern Minimalist Navbar */}
        <Navbar />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerSection}>
            <View
              style={[
                styles.badge,
                {
                  backgroundColor: theme.primary + '15',
                  borderColor: theme.primary + '30',
                },
              ]}
            >
              <ThemedText
                type="code"
                style={[styles.badgeText, { color: theme.primary }]}
              >
                AKUN PENGGUNA
              </ThemedText>
            </View>

            <ThemedText type="title" style={styles.title}>
              Profil & Pengaturan
            </ThemedText>

            <ThemedText type="default" style={styles.subtitle}>
              Kelola informasi pribadi, preferensi katering, dan keamanan akun Anda
            </ThemedText>
          </View>

          {/* User Profile Card */}
          {isAuthenticated && user ? (
            <>
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={styles.profileHeader}>
                  <View
                    style={[
                      styles.avatarLarge,
                      {
                        backgroundColor: theme.primary + '20',
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    <ThemedText
                      type="title"
                      style={[styles.avatarText, { color: theme.primary }]}
                    >
                      {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                    </ThemedText>
                  </View>

                  <View style={styles.profileInfo}>
                    <ThemedText type="subtitle" style={styles.profileName}>
                      {user.fullName}
                    </ThemedText>
                    {user.username ? (
                      <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 13 }}>
                        @{user.username}
                      </ThemedText>
                    ) : null}
                    <ThemedText type="small" style={styles.profileEmail}>
                      {user.email}
                    </ThemedText>

                    <View style={styles.statusPillRow}>
                      <View
                        style={[
                          styles.statusPill,
                          user.isEmailVerified
                            ? styles.pillSuccess
                            : styles.pillWarning,
                        ]}
                      >
                        <ThemedText
                          type="code"
                          style={[
                            styles.pillText,
                            {
                              color: user.isEmailVerified
                                ? '#10B981'
                                : '#D97706',
                            },
                          ]}
                        >
                          {user.isEmailVerified
                            ? '✓ EMAIL TERVERIFIKASI'
                            : '⚠ EMAIL BELUM DIVERIFIKASI'}
                        </ThemedText>
                      </View>
                    </View>
                  </View>
                </View>

                {!user.isEmailVerified && (
                  <View style={styles.unverifiedBox}>
                    <ThemedText type="small" style={styles.unverifiedText}>
                      Verifikasi email Anda sekarang agar dapat melakukan pemesanan katering dengan lancar.
                    </ThemedText>
                    <Pressable
                      onPress={() =>
                        router.push({
                          pathname: '/verify-email',
                          params: { email: user.email },
                        })
                      }
                      style={styles.verifyBtn}
                    >
                      <ThemedText type="smallBold" style={styles.verifyBtnText}>
                        Verifikasi Kode OTP Sekarang →
                      </ThemedText>
                    </Pressable>
                  </View>
                )}

                <View
                  style={[
                    styles.metaBox,
                    { backgroundColor: theme.backgroundElement },
                  ]}
                >
                  {user.username ? (
                    <View style={styles.metaRow}>
                      <ThemedText type="small" style={styles.metaKey}>
                        Username:
                      </ThemedText>
                      <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 13 }}>
                        @{user.username}
                      </ThemedText>
                    </View>
                  ) : null}

                  <View style={styles.metaRow}>
                    <ThemedText type="small" style={styles.metaKey}>
                      UUID (Internal):
                    </ThemedText>
                    <ThemedText type="code" style={styles.metaVal}>
                      {user.id}
                    </ThemedText>
                  </View>

                  <View style={styles.metaRow}>
                    <ThemedText type="small" style={styles.metaKey}>
                      Peran Sistem:
                    </ThemedText>
                    <ThemedText type="smallBold" style={styles.metaVal}>
                      Member Pelanggan
                    </ThemedText>
                  </View>
                </View>
              </View>

              {/* Preferences / Settings Card */}
              <View
                style={[
                  styles.card,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                ]}
              >
                <ThemedText type="smallBold" style={styles.sectionHeading}>
                  PENGATURAN & KEAMANAN
                </ThemedText>

                <View style={styles.menuList}>
                  <Pressable
                    onPress={() => router.push('/forgot-password')}
                    style={({ pressed }) => [
                      styles.menuItem,
                      { borderColor: theme.border },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.menuLeft}>
                      <ThemedText style={{ fontSize: 18 }}>🔐</ThemedText>
                      <View>
                        <ThemedText type="smallBold">Ganti Kata Sandi</ThemedText>
                        <ThemedText type="small" style={styles.menuDesc}>
                          Perbarui kata sandi untuk keamanan akun
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText type="small" style={styles.arrowText}>
                      →
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push('/addresses')}
                    style={({ pressed }) => [
                      styles.menuItem,
                      { borderColor: theme.border },
                      pressed && styles.pressed,
                    ]}
                  >
                    <View style={styles.menuLeft}>
                      <ThemedText style={{ fontSize: 18 }}>📍</ThemedText>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <ThemedText type="smallBold">Alamat Pengiriman</ThemedText>
                          {primaryAddress ? (
                            <View
                              style={{
                                backgroundColor: '#10B98118',
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 4,
                              }}
                            >
                              <ThemedText type="code" style={{ color: '#10B981', fontSize: 9 }}>
                                ★ {primaryAddress.label}
                              </ThemedText>
                            </View>
                          ) : null}
                        </View>
                        <ThemedText type="small" style={styles.menuDesc} numberOfLines={1}>
                          {primaryAddress
                            ? `${primaryAddress.fullAddress}, ${primaryAddress.city}`
                            : 'Kelola alamat rumah dan lokasi antar katering'}
                        </ThemedText>
                      </View>
                    </View>
                    <ThemedText type="small" style={styles.arrowText}>
                      →
                    </ThemedText>
                  </Pressable>
                </View>

                {/* Logout Button */}
                <Pressable
                  onPress={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  style={({ pressed }) => [
                    styles.logoutBtn,
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText type="smallBold" style={styles.logoutBtnText}>
                    {logoutMutation.isPending
                      ? 'Mengeluarkan Akun...'
                      : 'Keluar dari Akun (Logout)'}
                  </ThemedText>
                </Pressable>
              </View>
            </>
          ) : (
            /* Guest View */
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              <View style={styles.guestCenter}>
                <View
                  style={[
                    styles.guestIconCircle,
                    {
                      backgroundColor: theme.primary + '15',
                      borderColor: theme.primary + '30',
                    },
                  ]}
                >
                  <ThemedText style={{ fontSize: 32 }}>👤</ThemedText>
                </View>

                <ThemedText type="subtitle" style={styles.guestTitle}>
                  Belum Masuk Akun
                </ThemedText>

                <ThemedText type="small" style={styles.guestDesc}>
                  Masuk atau buat akun baru untuk mengelola profil, melihat pesanan aktif, dan mengatur langganan MPASI si kecil.
                </ThemedText>

                <View style={styles.guestBtnGroup}>
                  <Pressable
                    onPress={() => router.push('/login')}
                    style={({ pressed }) => [
                      styles.guestPrimaryBtn,
                      { backgroundColor: theme.primary },
                      pressed && styles.pressed,
                    ]}
                  >
                    <ThemedText
                      type="smallBold"
                      style={styles.guestPrimaryBtnText}
                    >
                      Masuk ke Akun
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={() => router.push('/register')}
                    style={({ pressed }) => [
                      styles.guestSecondaryBtn,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <ThemedText
                      type="smallBold"
                      style={styles.guestSecondaryBtnText}
                    >
                      Daftar Akun Baru
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            </View>
          )}

          {Platform.OS === 'web' && <WebBadge />}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingTop: 12,
    paddingBottom: BottomTabInset + 16,
    gap: 12,
  },
  headerSection: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 16,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
    lineHeight: 36,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.75,
    maxWidth: 520,
    lineHeight: 20,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flexWrap: 'wrap',
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 28,
    lineHeight: 36,
  },
  profileInfo: {
    flex: 1,
    minWidth: 180,
    gap: 2,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 26,
  },
  profileEmail: {
    fontSize: 13,
    opacity: 0.7,
  },
  statusPillRow: {
    marginTop: 6,
  },
  statusPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  pillSuccess: {
    backgroundColor: '#10B98115',
  },
  pillWarning: {
    backgroundColor: '#F59E0B15',
  },
  pillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  unverifiedBox: {
    backgroundColor: '#F59E0B10',
    borderColor: '#F59E0B35',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  unverifiedText: {
    fontSize: 13,
    color: '#D97706',
    lineHeight: 18,
  },
  verifyBtn: {
    cursor: 'pointer' as any,
  },
  verifyBtnText: {
    fontSize: 13,
    color: '#D97706',
  },
  metaBox: {
    padding: 12,
    borderRadius: 10,
    gap: 8,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metaKey: {
    fontSize: 12,
    opacity: 0.6,
  },
  metaVal: {
    fontSize: 11,
    opacity: 0.9,
  },
  sectionHeading: {
    fontSize: 12,
    letterSpacing: 0.8,
    opacity: 0.6,
  },
  menuList: {
    gap: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuDesc: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 1,
  },
  arrowText: {
    fontSize: 14,
    opacity: 0.4,
  },
  logoutBtn: {
    borderWidth: 1,
    borderColor: '#EF444435',
    backgroundColor: '#EF444410',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
    cursor: 'pointer' as any,
    marginTop: 4,
  },
  logoutBtnText: {
    color: '#EF4444',
    fontSize: 14,
  },
  guestCenter: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 12,
  },
  guestIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  guestDesc: {
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.7,
    maxWidth: 380,
    lineHeight: 20,
  },
  guestBtnGroup: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 360,
  },
  guestPrimaryBtn: {
    flex: 1,
    minWidth: 140,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  guestPrimaryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  guestSecondaryBtn: {
    flex: 1,
    minWidth: 140,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  guestSecondaryBtnText: {
    fontSize: 14,
  },
  pressed: {
    opacity: 0.7,
  },
});

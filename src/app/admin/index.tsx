import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useGetWeeklyMenu } from '@/features/menu/useMenu';

export default function AdminDashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const { data: weeklyData, isLoading, refetch } = useGetWeeklyMenu();

  const totalMenus = weeklyData?.totalMenus ?? 0;
  const totalUtama = weeklyData?.days?.reduce((sum, d) => sum + (d.mainMenus?.length || 0), 0) ?? 0;
  const totalSekunder = weeklyData?.days?.reduce((sum, d) => sum + (d.secondaryMenus?.length || 0), 0) ?? 0;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Admin Header Banner */}
          <View
            style={[
              styles.bannerWrapper,
              {
                backgroundColor: theme.secondary || '#005B64',
              },
            ]}
          >
            <View style={styles.bannerContent}>
              <View style={styles.bannerTagRow}>
                <View style={styles.badgePill}>
                  <ThemedText style={styles.badgePillText}>ADMIN CONSOLE</ThemedText>
                </View>
                <ThemedText style={styles.bannerDateText}>
                  {new Date().toLocaleDateString('id-ID', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </ThemedText>
              </View>

              <ThemedText style={styles.bannerGreeting}>
                Halo, {user?.fullName || 'Administrator'}! 👋
              </ThemedText>
              <ThemedText style={styles.bannerSubtext}>
                Kelola menu harian MPASI 7 hari rotasi, pantau operasional katering, dan sinkronisasi pesanan Bubox.
              </ThemedText>
            </View>
          </View>

          {/* Quick Metrics Cards */}
          <View style={styles.metricsGrid}>
            <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.metricHeader}>
                <ThemedText style={styles.metricLabel}>TOTAL MENU</ThemedText>
                <ThemedText style={{ fontSize: 18 }}>📋</ThemedText>
              </View>
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <ThemedText style={[styles.metricValue, { color: theme.primary }]}>
                  {totalMenus}
                </ThemedText>
              )}
              <ThemedText style={styles.metricSub}>Terdaftar di 7 hari</ThemedText>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.metricHeader}>
                <ThemedText style={styles.metricLabel}>MENU UTAMA</ThemedText>
                <ThemedText style={{ fontSize: 18 }}>🍲</ThemedText>
              </View>
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <ThemedText style={[styles.metricValue, { color: '#0284C7' }]}>
                  {totalUtama}
                </ThemedText>
              )}
              <ThemedText style={styles.metricSub}>Rotasi harian</ThemedText>
            </View>

            <View style={[styles.metricCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.metricHeader}>
                <ThemedText style={styles.metricLabel}>MENU SEKUNDER</ThemedText>
                <ThemedText style={{ fontSize: 18 }}>🥗</ThemedText>
              </View>
              {isLoading ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : (
                <ThemedText style={[styles.metricValue, { color: '#16A34A' }]}>
                  {totalSekunder}
                </ThemedText>
              )}
              <ThemedText style={styles.metricSub}>Pelengkap & snack</ThemedText>
            </View>
          </View>

          {/* Main Action Shortcut Cards */}
          <View style={styles.actionsSection}>
            <ThemedText style={styles.sectionTitle}>Aksi Cepat Admin</ThemedText>

            <View style={styles.actionsGrid}>
              <Pressable
                onPress={() => router.push('/admin/menu')}
                style={({ pressed }) => [
                  styles.actionCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: theme.primaryLight || '#FFF0E8' }]}>
                  <ThemedText style={{ fontSize: 24 }}>🍲</ThemedText>
                </View>
                <View style={styles.actionInfo}>
                  <ThemedText style={[styles.actionTitle, { color: theme.secondary }]}>
                    Kelola Menu Harian (7 Hari)
                  </ThemedText>
                  <ThemedText style={styles.actionDesc}>
                    Atur menu utama & sekunder Senin s/d Minggu, ubah harga, dan aktifkan variasi menu MPASI.
                  </ThemedText>
                </View>
                <ThemedText style={[styles.actionArrow, { color: theme.primary }]}>➔</ThemedText>
              </Pressable>

              <Pressable
                onPress={() => router.push('/')}
                style={({ pressed }) => [
                  styles.actionCard,
                  {
                    backgroundColor: theme.card,
                    borderColor: theme.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View style={[styles.actionIconBox, { backgroundColor: '#F1F5F9' }]}>
                  <ThemedText style={{ fontSize: 24 }}>🌐</ThemedText>
                </View>
                <View style={styles.actionInfo}>
                  <ThemedText style={[styles.actionTitle, { color: theme.secondary }]}>
                    Lihat Web Pelanggan (Customer)
                  </ThemedText>
                  <ThemedText style={styles.actionDesc}>
                    Beralih ke tampilan beranda aplikasi utama untuk melihat pengalaman pelanggan.
                  </ThemedText>
                </View>
                <ThemedText style={[styles.actionArrow, { color: '#64748B' }]}>➔</ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Weekly Summary Table Preview */}
          <View style={[styles.summaryCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.summaryHeader}>
              <ThemedText style={styles.summaryTitle}>Jadwal Siklus 7 Hari (Senin - Minggu)</ThemedText>
              <Pressable onPress={() => refetch()} style={styles.refreshBtn}>
                <ThemedText style={[styles.refreshText, { color: theme.primary }]}>🔄 Refresh</ThemedText>
              </Pressable>
            </View>

            <View style={styles.daysList}>
              {weeklyData?.days?.map((day) => (
                <Pressable
                  key={day.dayOfWeek}
                  onPress={() => router.push(`/admin/menu`)}
                  style={({ pressed }) => [
                    styles.dayRow,
                    { borderBottomColor: theme.border },
                    pressed && styles.pressed,
                  ]}
                >
                  <View style={styles.dayBadge}>
                    <ThemedText style={[styles.dayBadgeText, { color: theme.primary }]}>
                      {day.dayName}
                    </ThemedText>
                  </View>

                  <View style={styles.dayDetails}>
                    <ThemedText style={styles.dayMenuCount}>
                      {day.mainMenus.length} Menu Utama • {day.secondaryMenus.length} Menu Sekunder
                    </ThemedText>
                    <ThemedText style={styles.dayMenuPreview} numberOfLines={1}>
                      {day.mainMenus.length > 0
                        ? day.mainMenus.map((m) => m.name).join(', ')
                        : 'Belum ada menu utama diinput'}
                    </ThemedText>
                  </View>

                  <ThemedText style={{ color: '#94A3B8', fontSize: 13 }}>Kelola ➔</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: BottomTabInset + 32,
    gap: 20,
  },
  bannerWrapper: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  bannerContent: {
    gap: 8,
  },
  bannerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  badgePill: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgePillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  bannerDateText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
  },
  bannerGreeting: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  bannerSubtext: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
    lineHeight: 19,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  metricCard: {
    flex: 1,
    minWidth: 140,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: '900',
    marginTop: 4,
  },
  metricSub: {
    color: '#94A3B8',
    fontSize: 11,
  },
  actionsSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  actionsGrid: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    cursor: 'pointer' as any,
  },
  actionIconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: {
    flex: 1,
    gap: 3,
  },
  actionTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  actionDesc: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 17,
  },
  actionArrow: {
    fontSize: 18,
    fontWeight: '700',
  },
  summaryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  refreshBtn: {
    padding: 6,
    cursor: 'pointer' as any,
  },
  refreshText: {
    fontSize: 12,
    fontWeight: '600',
  },
  daysList: {
    gap: 8,
  },
  dayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
    cursor: 'pointer' as any,
  },
  dayBadge: {
    width: 70,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  dayBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  dayDetails: {
    flex: 1,
    gap: 2,
  },
  dayMenuCount: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  dayMenuPreview: {
    fontSize: 13,
    color: '#1E293B',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.99 }],
  },
});

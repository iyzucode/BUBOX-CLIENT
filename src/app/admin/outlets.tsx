import React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAdminOutlets, useSetOutletActive } from '@/features/outlet/useOutlets';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import { Outlet } from '@/types/outlet';
import { showAlert } from '@/utils/alert';

/** Kelola outlet tempat customer mengambil pesanan (Admin / Super Admin). */
export default function AdminOutletsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: outlets, isPending, isError, error, refetch } = useAdminOutlets();
  const activeCount = outlets?.filter((o) => o.isActive).length ?? 0;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Outlet" fallbackHref="/admin" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable
          onPress={() => router.push('/admin/outlet-form')}
          style={({ pressed }) => [styles.addBtn, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}
          accessibilityRole="button"
        >
          <ThemedText style={styles.addText}>+ Outlet Baru</ThemedText>
        </Pressable>

        {isPending ? (
          <ActivityIndicator style={styles.loader} color={theme.primary} />
        ) : isError ? (
          <Pressable onPress={() => refetch()}>
            <ThemedText style={[styles.small, { color: theme.textSecondary }]}>
              {getApiErrorMessage(error, 'Gagal memuat outlet.')} Ketuk untuk coba lagi.
            </ThemedText>
          </Pressable>
        ) : outlets.length === 0 ? (
          <ThemedText style={[styles.small, { color: theme.textSecondary }]}>
            Belum ada outlet. Selama belum ada outlet aktif, customer tidak bisa memilih Ambil Sendiri.
          </ThemedText>
        ) : (
          <>
            {activeCount === 0 ? (
              <View style={[styles.warn, { backgroundColor: theme.backgroundElement, borderColor: theme.warning }]}>
                <ThemedText style={[styles.small, { color: theme.text }]}>
                  Tidak ada outlet aktif. Customer tidak bisa memilih Ambil Sendiri.
                </ThemedText>
              </View>
            ) : null}
            {outlets.map((o) => (
              <OutletRow key={o.id} outlet={o} />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const OutletRow: React.FC<{ outlet: Outlet }> = ({ outlet }) => {
  const theme = useTheme();
  const router = useRouter();
  const setActive = useSetOutletActive();

  const toggle = (isActive: boolean) =>
    setActive.mutate(
      { id: outlet.id, isActive },
      {
        onError: (err) =>
          showAlert('Gagal Mengubah', getApiErrorMessage(err, 'Status outlet tidak dapat diubah.'), { tone: 'error' }),
      }
    );

  const badge = (text: string, dot?: string) => (
    <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      <ThemedText style={[styles.tiny, styles.bold, { color: theme.text }]}>{text}</ThemedText>
    </View>
  );

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/admin/outlet-form', params: { id: outlet.id } })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Ubah outlet ${outlet.name}`}
    >
      <View style={styles.rowTop}>
        <View style={styles.flex}>
          <ThemedText style={[styles.name, { color: theme.text }]}>{outlet.name}</ThemedText>
          <ThemedText style={[styles.small, { color: theme.textSecondary }]} numberOfLines={2}>
            {outlet.fullAddress}
          </ThemedText>
          <ThemedText style={[styles.tiny, { color: theme.textSecondary }]} numberOfLines={1}>
            {outlet.wilayahPath}
          </ThemedText>
        </View>
        <Switch
          value={outlet.isActive}
          onValueChange={toggle}
          disabled={setActive.isPending}
          trackColor={{ true: theme.primary, false: theme.border }}
          accessibilityLabel={outlet.isActive ? `Nonaktifkan ${outlet.name}` : `Aktifkan ${outlet.name}`}
        />
      </View>

      <View style={styles.badges}>
        {badge(outlet.isActive ? 'Aktif' : 'Nonaktif', outlet.isActive ? theme.success : theme.textSecondary)}
        {outlet.pickupHours ? badge(`🕒 ${outlet.pickupHours}`) : null}
        {outlet.whatsappNumber ? badge(`WA ${outlet.whatsappNumber}`) : null}
        {badge(outlet.latitude != null ? '📍 Titik peta' : 'Tanpa titik peta')}
        {badge(`${outlet.orderCount ?? 0} pesanan`)}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 40, maxWidth: 640, width: '100%', alignSelf: 'center' },
  loader: { marginTop: 30 },
  addBtn: {
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  addText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  warn: { borderRadius: 12, borderWidth: 1, padding: 12 },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 4,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1, gap: 2 },
  name: { fontSize: 16, fontWeight: '800' },
  small: { fontSize: 13, lineHeight: 18 },
  tiny: { fontSize: 11, lineHeight: 15 },
  bold: { fontWeight: '700' },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  dot: { width: 7, height: 7, borderRadius: 4 },
});

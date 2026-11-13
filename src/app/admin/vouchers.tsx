import React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAdminVouchers, useSetVoucherActive } from '@/features/voucher/useVouchers';
import {
  formatWibDateTime,
  paymentMethodLabel,
  voucherHeadline,
  voucherMinimumLabel,
} from '@/features/voucher/voucherUtils';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import { VoucherAdmin } from '@/types/voucher';
import { showAlert } from '@/utils/alert';

type VoucherState = 'ACTIVE' | 'SCHEDULED' | 'ENDED' | 'INACTIVE' | 'EXHAUSTED';

function voucherState(v: VoucherAdmin, now = Date.now()): VoucherState {
  if (!v.isActive) return 'INACTIVE';
  if (new Date(v.endsAt).getTime() <= now) return 'ENDED';
  if (v.usageLimit != null && v.redemptionCount >= v.usageLimit) return 'EXHAUSTED';
  if (new Date(v.startsAt).getTime() > now) return 'SCHEDULED';
  return 'ACTIVE';
}

const STATE_LABEL: Record<VoucherState, string> = {
  ACTIVE: 'Berlaku',
  SCHEDULED: 'Terjadwal',
  ENDED: 'Berakhir',
  INACTIVE: 'Nonaktif',
  EXHAUSTED: 'Kuota habis',
};

/** Kelola voucher / kode promo (Admin / Super Admin). */
export default function AdminVouchersScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { data: vouchers, isPending, isError, error, refetch } = useAdminVouchers();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Voucher" fallbackHref="/admin" />

      <ScrollView contentContainerStyle={styles.scroll}>
        <Pressable
          onPress={() => router.push('/admin/voucher-form')}
          style={({ pressed }) => [styles.addBtn, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}
          accessibilityRole="button"
        >
          <ThemedText style={styles.addText}>+ Voucher Baru</ThemedText>
        </Pressable>

        {isPending ? (
          <ActivityIndicator style={styles.loader} color={theme.primary} />
        ) : isError ? (
          <Pressable onPress={() => refetch()}>
            <ThemedText style={[styles.small, { color: theme.textSecondary }]}>
              {getApiErrorMessage(error, 'Gagal memuat voucher.')} Ketuk untuk coba lagi.
            </ThemedText>
          </Pressable>
        ) : vouchers.length === 0 ? (
          <ThemedText style={[styles.small, { color: theme.textSecondary }]}>
            Belum ada voucher. Buat voucher pertama dengan tombol di atas.
          </ThemedText>
        ) : (
          vouchers.map((v) => <VoucherRow key={v.id} voucher={v} />)
        )}
      </ScrollView>
    </View>
  );
}

const VoucherRow: React.FC<{ voucher: VoucherAdmin }> = ({ voucher }) => {
  const theme = useTheme();
  const router = useRouter();
  const setActive = useSetVoucherActive();
  const state = voucherState(voucher);

  const stateColor =
    state === 'ACTIVE'
      ? theme.success
      : state === 'SCHEDULED'
        ? theme.warning
        : state === 'EXHAUSTED'
          ? theme.danger
          : theme.textSecondary;

  const toggle = (isActive: boolean) =>
    setActive.mutate(
      { id: voucher.id, isActive },
      {
        onError: (err) =>
          showAlert('Gagal Mengubah', getApiErrorMessage(err, 'Status voucher tidak dapat diubah.'), { tone: 'error' }),
      }
    );

  return (
    <Pressable
      onPress={() => router.push({ pathname: '/admin/voucher-form', params: { id: voucher.id } })}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.card, borderColor: theme.border, opacity: pressed ? 0.9 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Ubah voucher ${voucher.code}`}
    >
      <View style={styles.rowTop}>
        <View style={styles.flex}>
          <ThemedText style={[styles.code, { color: theme.text }]}>{voucher.code}</ThemedText>
          <ThemedText style={[styles.small, { color: theme.textSecondary }]} numberOfLines={1}>
            {voucher.title}
          </ThemedText>
        </View>
        <Switch
          value={voucher.isActive}
          onValueChange={toggle}
          disabled={setActive.isPending}
          trackColor={{ true: theme.primary, false: theme.border }}
          accessibilityLabel={voucher.isActive ? `Nonaktifkan ${voucher.code}` : `Aktifkan ${voucher.code}`}
        />
      </View>

      <ThemedText style={[styles.headline, { color: theme.text }]}>{voucherHeadline(voucher)}</ThemedText>
      <ThemedText style={[styles.small, { color: theme.textSecondary }]}>
        {voucherMinimumLabel(voucher.minSubtotal)} · {voucher.paymentMethods.map(paymentMethodLabel).join(' / ')}
      </ThemedText>
      <ThemedText style={[styles.tiny, { color: theme.textSecondary }]}>
        {formatWibDateTime(voucher.startsAt)} – {formatWibDateTime(voucher.endsAt)} WIB
      </ThemedText>

      <View style={styles.badges}>
        <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
          <View style={[styles.dot, { backgroundColor: stateColor }]} />
          <ThemedText style={[styles.tiny, styles.bold, { color: theme.text }]}>{STATE_LABEL[state]}</ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={[styles.tiny, styles.bold, { color: theme.text }]}>
            {voucher.isListed ? 'Tampil di daftar' : 'Kode rahasia'}
          </ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={[styles.tiny, styles.bold, { color: theme.text }]}>
            {voucher.usageLimit != null
              ? `Dipakai ${voucher.redemptionCount} / ${voucher.usageLimit}`
              : `Dipakai ${voucher.redemptionCount}× · tanpa batas`}
          </ThemedText>
        </View>
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
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 4,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  rowTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  flex: { flex: 1 },
  code: { fontSize: 16, fontWeight: '800', letterSpacing: 0.5 },
  headline: { fontSize: 17, fontWeight: '700', marginTop: 4 },
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

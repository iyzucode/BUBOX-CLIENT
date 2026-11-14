import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeContext } from '@/context/ThemeContext';
import { formatRupiah, toneColors } from '@/features/order/orderStatus';
import { useTheme } from '@/hooks/use-theme';
import type { AdminAttention, AdminBoardSummary, BoardView } from '@/types/adminOrders';
import type { ProductionMenuSummary } from '@/types/order';

const clickable = Platform.select({ web: { cursor: 'pointer' as const } }) ?? {};

// ==========================================
// Kartu ringkasan
// ==========================================

/** Empat angka utama sesuai daftar yang tampil (filter & tab aktif). */
export const BoardSummary: React.FC<{ view: BoardView; summary: AdminBoardSummary | undefined }> = ({ view, summary }) => {
  const theme = useTheme();
  const cards = [
    { label: view === 'days' ? 'Pengiriman' : 'Pesanan', value: String(summary?.rows ?? 0) },
    { label: 'Total porsi', value: String(summary?.portions ?? 0) },
    { label: 'Omzet lunas', value: formatRupiah(summary?.paidRevenue ?? 0) },
    { label: 'Menunggu bayar', value: String(summary?.awaitingPayment ?? 0) },
  ];

  return (
    <View style={[styles.cards, { backgroundColor: theme.card, borderColor: theme.border }]}>
      {cards.map((c, i) => (
        <View key={c.label} style={[styles.card, i > 0 && { borderLeftWidth: 1, borderLeftColor: theme.border }]}>
          <ThemedText style={[styles.cardLabel, { color: theme.textSecondary }]}>{c.label}</ThemedText>
          <ThemedText style={[styles.cardValue, { color: theme.text }]} numberOfLines={1}>{c.value}</ThemedText>
        </View>
      ))}
    </View>
  );
};

// ==========================================
// Banner "Perlu tindakan"
// ==========================================

interface AttentionBannerProps {
  view: BoardView;
  attention: AdminAttention | undefined;
  /** Admin: tombol aksi (driver & refund). Selain admin hanya informasi + "Lihat". */
  canManage: boolean;
  onAssignDrivers: () => void;
  onMarkRefunds: () => void;
  onReviewPayments: () => void;
  onShowAll: () => void;
}

/** Ringkasan semua jenis yang perlu ditindak, masing-masing dengan aksinya. Tidak tampil bila tidak ada. */
export const AttentionBanner: React.FC<AttentionBannerProps> = ({
  view, attention, canManage, onAssignDrivers, onMarkRefunds, onReviewPayments, onShowAll,
}) => {
  const theme = useTheme();
  const { isDark } = useThemeContext();
  if (!attention || attention.total === 0) return null;

  const tone = toneColors('danger', isDark);
  const unit = view === 'days' ? 'pengiriman' : 'pesanan';
  const parts = [
    attention.needsDriver > 0 ? `${attention.needsDriver} ${unit} belum memiliki driver` : null,
    attention.refundPending > 0 ? `${attention.refundPending} refund tertunda` : null,
    attention.paymentReview > 0 ? `${attention.paymentReview} pembayaran perlu ditinjau` : null,
  ].filter(Boolean);

  const actions: { key: string; label: string; onPress: () => void }[] = [];
  if (view === 'days' && canManage && attention.needsDriver > 0) {
    actions.push({ key: 'driver', label: `Atur driver untuk ${attention.needsDriver} ${unit}`, onPress: onAssignDrivers });
  }
  if (view === 'days' && canManage && attention.refundPending > 0) {
    actions.push({ key: 'refund', label: `Tandai refund (${attention.refundPending})`, onPress: onMarkRefunds });
  }
  if (attention.paymentReview > 0) {
    actions.push({ key: 'review', label: 'Tinjau pembayaran', onPress: onReviewPayments });
  }
  if (actions.length === 0) actions.push({ key: 'all', label: 'Lihat', onPress: onShowAll });

  return (
    <View style={[styles.banner, { backgroundColor: tone.bg, borderColor: tone.bg }]} accessibilityRole="alert">
      <ThemedText style={[styles.bannerIcon, { color: tone.text }]}>⚠</ThemedText>
      <View style={styles.bannerText}>
        <ThemedText style={[styles.bannerTitle, { color: tone.text }]}>{parts.join(' · ')}.</ThemedText>
        <ThemedText style={[styles.bannerHint, { color: tone.text }]}>
          {attention.needsDriver > 0 ? 'Tetapkan driver agar pengiriman siap diproses.' : 'Selesaikan agar tidak ada pesanan yang tertinggal.'}
        </ThemedText>
      </View>
      <View style={styles.bannerActions}>
        {actions.map((a, i) => (
          <Pressable
            key={a.key}
            onPress={a.onPress}
            style={[
              styles.bannerBtn,
              clickable,
              i === 0 ? { backgroundColor: theme.primary, borderColor: theme.primary } : { borderColor: tone.text, backgroundColor: 'transparent' },
            ]}
            accessibilityRole="button"
          >
            <ThemedText style={[styles.bannerBtnText, { color: i === 0 ? '#FFFFFF' : tone.text }]}>{a.label}</ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

// ==========================================
// Rekap dapur (dilipat)
// ==========================================

const RECAP_KEY = 'bubox-admin-kitchen-recap-open';

const readRecapOpen = () => {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem(RECAP_KEY) === '1';
  } catch {
    return false;
  }
};

/** Rekap porsi per menu; buka/tutup diingat per pengguna di perangkat ini. Klik menu = filter daftar. */
export const KitchenRecap: React.FC<{
  production: ProductionMenuSummary[];
  activeMenuId: string | null;
  onMenuPress: (menu: ProductionMenuSummary) => void;
}> = ({ production, activeMenuId, onMenuPress }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(readRecapOpen);
  const total = production.reduce((sum, m) => sum + m.totalQty, 0);

  const toggleOpen = () => {
    const next = !open;
    setOpen(next);
    try {
      localStorage.setItem(RECAP_KEY, next ? '1' : '0');
    } catch {
      // penyimpanan tidak tersedia: cukup berlaku di sesi ini
    }
  };

  return (
    <View style={[styles.recap, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Pressable onPress={toggleOpen} style={[styles.recapHead, clickable]} accessibilityRole="button" accessibilityState={{ expanded: open }}>
        <ThemedText style={styles.recapIcon}>🍳</ThemedText>
        <View style={styles.flex}>
          <ThemedText style={[styles.recapTitle, { color: theme.text }]}>Rekap dapur</ThemedText>
          <ThemedText style={[styles.small, { color: theme.textSecondary }]}>{total} porsi · Pesanan lunas & tidak batal</ThemedText>
        </View>
        <ThemedText style={[styles.small, { color: theme.textSecondary }]}>{open ? 'Tutup rincian menu ⌃' : 'Lihat rincian menu ⌄'}</ThemedText>
      </Pressable>
      {open ? (
        production.length === 0 ? (
          <ThemedText style={[styles.small, { color: theme.textSecondary }]}>Belum ada hari kirim yang sudah dibayar di periode & filter ini.</ThemedText>
        ) : (
          <View style={styles.chips}>
            {production.map((m) => {
              const active = m.menuId === activeMenuId;
              return (
                <Pressable
                  key={m.menuId}
                  onPress={() => onMenuPress(m)}
                  style={[styles.chip, clickable, { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primaryLight : theme.card }]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  accessibilityLabel={`Filter menu ${m.menuName}`}
                >
                  <ThemedText style={[styles.chipText, { color: active ? theme.primary : theme.text }]}>
                    {m.menuName} <ThemedText style={[styles.chipQty, { color: theme.primary }]}>{m.totalQty}</ThemedText>
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  cards: { flexDirection: 'row', borderWidth: 1, borderRadius: 12, paddingVertical: 14 },
  card: { flex: 1, paddingHorizontal: 16, gap: 4 },
  cardLabel: { fontSize: 12 },
  cardValue: { fontSize: 22, fontWeight: '700' },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  bannerIcon: { fontSize: 16 },
  bannerText: { flex: 1, gap: 1 },
  bannerTitle: { fontSize: 13, fontWeight: '700' },
  bannerHint: { fontSize: 12, opacity: 0.85 },
  bannerActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  bannerBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  bannerBtnText: { fontSize: 12, fontWeight: '700' },
  recap: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, gap: 10 },
  recapHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recapIcon: { fontSize: 16 },
  recapTitle: { fontSize: 14, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  chipText: { fontSize: 12, fontWeight: '500' },
  chipQty: { fontSize: 12, fontWeight: '800' },
  small: { fontSize: 12 },
});

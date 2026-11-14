import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { formatRupiah } from '@/features/order/orderStatus';
import { useTheme } from '@/hooks/use-theme';
import type { AdminBoardSummary, BoardView } from '@/types/adminOrders';
import type { ProductionMenuSummary } from '@/types/order';

interface BoardSummaryProps {
  view: BoardView;
  summary: AdminBoardSummary | undefined;
  production: ProductionMenuSummary[];
  activeMenuId: string | null;
  onMenuPress: (menu: ProductionMenuSummary) => void;
  onAttentionPress: () => void;
}

/** Kartu angka sesuai filter aktif + rekap dapur per menu (tampilan per hari kirim). */
export const BoardSummary: React.FC<BoardSummaryProps> = ({
  view, summary, production, activeMenuId, onMenuPress, onAttentionPress,
}) => {
  const theme = useTheme();
  const [showProduction, setShowProduction] = useState(true);
  const totalProduction = production.reduce((sum, m) => sum + m.totalQty, 0);

  const cards = [
    { label: view === 'days' ? 'Pengiriman' : 'Pesanan', value: String(summary?.rows ?? 0) },
    { label: 'Porsi', value: String(summary?.portions ?? 0) },
    { label: 'Omzet lunas', value: formatRupiah(summary?.paidRevenue ?? 0) },
    { label: 'Menunggu bayar', value: String(summary?.awaitingPayment ?? 0) },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.cards}>
        {cards.map((c) => (
          <View key={c.label} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ThemedText style={[styles.cardLabel, { color: theme.textSecondary }]}>{c.label}</ThemedText>
            <ThemedText style={[styles.cardValue, { color: theme.text }]} numberOfLines={1}>{c.value}</ThemedText>
          </View>
        ))}
        <Pressable
          onPress={onAttentionPress}
          style={[
            styles.card,
            styles.clickable,
            {
              backgroundColor: (summary?.needsAttention ?? 0) > 0 ? theme.primaryLight : theme.card,
              borderColor: (summary?.needsAttention ?? 0) > 0 ? theme.warning : theme.border,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Tampilkan yang perlu tindakan"
        >
          <ThemedText style={[styles.cardLabel, { color: theme.textSecondary }]}>⚠ Perlu tindakan</ThemedText>
          <ThemedText style={[styles.cardValue, { color: (summary?.needsAttention ?? 0) > 0 ? theme.warning : theme.text }]}>
            {summary?.needsAttention ?? 0}
          </ThemedText>
        </Pressable>
      </View>

      {view === 'days' ? (
        <View style={[styles.production, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Pressable
            onPress={() => setShowProduction((v) => !v)}
            style={[styles.prodHeader, styles.clickable]}
            accessibilityRole="button"
            accessibilityState={{ expanded: showProduction }}
          >
            <ThemedText style={[styles.prodTitle, { color: theme.text }]}>
              🍳 Rekap dapur · {totalProduction} porsi
            </ThemedText>
            <ThemedText style={[styles.small, { color: theme.textSecondary }]}>
              {showProduction ? 'Sembunyikan ▲' : 'Tampilkan ▼'}
            </ThemedText>
          </Pressable>
          {showProduction ? (
            production.length === 0 ? (
              <ThemedText style={[styles.small, { color: theme.textSecondary }]}>
                Belum ada hari kirim yang sudah dibayar di periode & filter ini.
              </ThemedText>
            ) : (
              <>
                <View style={styles.chips}>
                  {production.map((m) => {
                    const active = m.menuId === activeMenuId;
                    return (
                      <Pressable
                        key={m.menuId}
                        onPress={() => onMenuPress(m)}
                        style={[
                          styles.chip,
                          styles.clickable,
                          { backgroundColor: active ? theme.primary : theme.backgroundElement },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={`Filter menu ${m.menuName}`}
                      >
                        <ThemedText style={[styles.chipText, { color: active ? '#FFFFFF' : theme.text }]}>
                          {m.menuName} <ThemedText style={[styles.chipQty, { color: active ? '#FFFFFF' : theme.primary }]}>{m.totalQty}×</ThemedText>
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
                <ThemedText style={[styles.tiny, { color: theme.textSecondary }]}>
                  Hari kirim yang sudah dibayar & tidak batal. Klik menu untuk memfilter daftar.
                </ThemedText>
              </>
            )
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { gap: 10 },
  cards: { flexDirection: 'row', gap: 10 },
  card: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 2 },
  clickable: Platform.select({ web: { cursor: 'pointer' as const } }) ?? {},
  cardLabel: { fontSize: 11, fontWeight: '600' },
  cardValue: { fontSize: 18, fontWeight: '800' },
  production: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8 },
  prodHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  prodTitle: { fontSize: 14, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 12, fontWeight: '600' },
  chipQty: { fontSize: 12, fontWeight: '800' },
  small: { fontSize: 12 },
  tiny: { fontSize: 11 },
});

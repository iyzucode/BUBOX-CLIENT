import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { addDaysKey } from '@/features/order/adminBoardUtils';
import { toDateKey } from '@/features/order/dateUtils';
import { formatLongDate } from '@/features/order/orderStatus';
import { groupByCategory } from '@/features/menu/categoryOrder';
import { useTheme } from '@/hooks/use-theme';
import type { KitchenRecapMenu } from '@/types/kitchen';
import type { MenuCategory } from '@/types/menu';

const clickable = Platform.select({ web: { cursor: 'pointer' as const } }) ?? {};

// ==========================================
// Navigasi tanggal
// ==========================================

/** Satu tanggal kirim: Hari ini / Besok + geser ‹ ›. */
export const KitchenDateNav: React.FC<{ date: string; onChange: (date: string) => void }> = ({ date, onChange }) => {
  const theme = useTheme();
  const today = toDateKey(new Date());
  const tomorrow = addDaysKey(today, 1);
  const preset = (key: string, label: string) => {
    const active = date === key;
    return (
      <Pressable
        key={label}
        onPress={() => onChange(key)}
        style={[styles.preset, clickable, { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primaryLight : theme.card }]}
        accessibilityRole="button"
        accessibilityState={{ selected: active }}
      >
        <ThemedText style={[styles.presetText, { color: active ? theme.primary : theme.text }]}>{label}</ThemedText>
      </Pressable>
    );
  };

  return (
    <View style={styles.navRow}>
      {preset(today, 'Hari ini')}
      {preset(tomorrow, 'Besok')}
      <View style={[styles.nav, { borderColor: theme.border, backgroundColor: theme.card }]}>
        <Pressable onPress={() => onChange(addDaysKey(date, -1))} style={[styles.navBtn, clickable]} accessibilityRole="button" accessibilityLabel="Hari sebelumnya">
          <ThemedText style={[styles.navArrow, { color: theme.text }]}>‹</ThemedText>
        </Pressable>
        <ThemedText style={[styles.navLabel, { color: theme.text }]} numberOfLines={1}>
          🗓️ {formatLongDate(date)}
        </ThemedText>
        <Pressable onPress={() => onChange(addDaysKey(date, 1))} style={[styles.navBtn, clickable]} accessibilityRole="button" accessibilityLabel="Hari berikutnya">
          <ThemedText style={[styles.navArrow, { color: theme.text }]}>›</ThemedText>
        </Pressable>
      </View>
    </View>
  );
};

// ==========================================
// Rekap per kategori
// ==========================================

/** Total porsi per menu, dikelompokkan per kategori sesuai urutan dari admin. */
export const KitchenRecapList: React.FC<{
  recap: KitchenRecapMenu[];
  categories: MenuCategory[] | undefined;
  /** Huruf besar untuk dibaca dari jauh (layar dapur). */
  large?: boolean;
}> = ({ recap, categories, large = false }) => {
  const theme = useTheme();
  const groups = groupByCategory(recap, (m) => ({ name: m.categoryName }), categories);
  if (recap.length === 0) {
    return <ThemedText style={[styles.empty, { color: theme.textSecondary }]}>Belum ada menu yang dimasak.</ThemedText>;
  }

  return (
    <View style={styles.recap}>
      {groups.map((g) => {
        const total = g.items.reduce((sum, m) => sum + m.qty, 0);
        return (
          <View key={g.key} style={styles.recapGroup}>
            <View style={[styles.recapHead, { borderBottomColor: theme.border }]}>
              <ThemedText style={[large ? styles.catLarge : styles.cat, { color: theme.text }]}>{g.label}</ThemedText>
              <ThemedText style={[large ? styles.catTotalLarge : styles.catTotal, { color: theme.textSecondary }]}>{total} porsi</ThemedText>
            </View>
            {g.items.map((m) => (
              <View key={m.menuId} style={styles.recapRow}>
                <ThemedText style={[large ? styles.menuLarge : styles.menu, styles.flex, { color: theme.text }]}>{m.menuName}</ThemedText>
                <ThemedText style={[large ? styles.qtyLarge : styles.qty, { color: theme.primary }]}>{m.qty}</ThemedText>
              </View>
            ))}
          </View>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1 },
  navRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  preset: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 9 },
  presetText: { fontSize: 14, fontWeight: '600' },
  nav: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, flexGrow: 1, minWidth: 260 },
  navBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  navArrow: { fontSize: 18 },
  navLabel: { flex: 1, textAlign: 'center', fontSize: 15, fontWeight: '600' },
  empty: { fontSize: 13, paddingVertical: 8 },
  recap: { gap: 16 },
  recapGroup: { gap: 4 },
  recapHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', borderBottomWidth: 1, paddingBottom: 6, marginBottom: 2 },
  cat: { fontSize: 14, fontWeight: '700' },
  catLarge: { fontSize: 18, fontWeight: '800' },
  catTotal: { fontSize: 12, fontWeight: '600' },
  catTotalLarge: { fontSize: 15, fontWeight: '700' },
  recapRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 4 },
  menu: { fontSize: 14 },
  menuLarge: { fontSize: 18, fontWeight: '500' },
  qty: { fontSize: 16, fontWeight: '800', minWidth: 36, textAlign: 'right' },
  qtyLarge: { fontSize: 24, fontWeight: '800', minWidth: 48, textAlign: 'right' },
});

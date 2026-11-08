import React, { useMemo, useState } from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';
import { useThemeContext } from '@/context/ThemeContext';
import { formatLongDate, formatRupiah } from '@/features/order/orderStatus';
import { OrderDetail } from '@/types/order';
import { resolveApiAssetUri } from '@/utils/apiAsset';

const FALLBACK_IMAGE = require('@/assets/images/baby-puree-fallback.jpg');

type GroupMode = 'day' | 'category';

interface MenuRow {
  key: string;
  menuName: string;
  imageUrl: string | null;
  subtitle: string;
  total: number;
}

interface RowGroup {
  key: string;
  title: string;
  rows: MenuRow[];
}

/** Per hari: urutan hari, tiap item apa adanya. */
function groupByDay(order: OrderDetail): RowGroup[] {
  return order.days.map((day) => ({
    key: day.id,
    title: formatLongDate(day.deliveryDate),
    rows: day.items.map((item) => ({
      key: item.id,
      menuName: item.menuName,
      imageUrl: item.imageUrl,
      subtitle: `${item.qty} × ${formatRupiah(item.unitPrice)}`,
      total: item.lineTotal,
    })),
  }));
}

/** Per kategori: menu yang sama di beberapa hari digabung (porsi & total dijumlah). */
function groupByCategory(order: OrderDetail): RowGroup[] {
  const categories = new Map<string, { title: string; menus: Map<string, MenuRow & { qty: number }> }>();

  for (const day of order.days) {
    for (const item of day.items) {
      const categoryKey = item.categoryCode || item.categoryName;
      let category = categories.get(categoryKey);
      if (!category) {
        category = { title: item.categoryName, menus: new Map() };
        categories.set(categoryKey, category);
      }

      const menu = category.menus.get(item.menuId);
      if (menu) {
        menu.qty += item.qty;
        menu.total += item.lineTotal;
      } else {
        category.menus.set(item.menuId, {
          key: item.menuId,
          menuName: item.menuName,
          imageUrl: item.imageUrl,
          subtitle: '',
          total: item.lineTotal,
          qty: item.qty,
        });
      }
    }
  }

  return [...categories.entries()]
    .sort(([, a], [, b]) => a.title.localeCompare(b.title, 'id'))
    .map(([key, category]) => ({
      key,
      title: category.title,
      rows: [...category.menus.values()]
        .sort((a, b) => a.menuName.localeCompare(b.menuName, 'id'))
        .map(({ qty, ...row }) => ({ ...row, subtitle: `${qty} porsi` })),
    }));
}

/** Satu baris "label ...... nilai" di ringkasan biaya. */
const Line: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => {
  const { theme } = useThemeContext();
  return (
    <View style={styles.line}>
      <ThemedText style={[styles.lineLabel, { color: strong ? theme.text : theme.textSecondary }, strong && styles.strong]}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.lineValue, { color: theme.text }, strong && styles.strong]}>{value}</ThemedText>
    </View>
  );
};

/** Baris menu: gambar, nama, keterangan porsi/hari, subtotal. */
const MenuLine: React.FC<{ row: MenuRow }> = ({ row }) => {
  const { theme, isDark } = useThemeContext();
  const uri = resolveApiAssetUri(row.imageUrl);
  return (
    <View style={styles.menuRow}>
      <Image
        source={uri ? { uri } : FALLBACK_IMAGE}
        placeholder={FALLBACK_IMAGE}
        style={[styles.thumb, { backgroundColor: isDark ? '#27272A' : '#F4F4F5' }]}
        contentFit="cover"
        accessibilityIgnoresInvertColors
      />
      <View style={styles.menuText}>
        <ThemedText style={[styles.menuName, { color: theme.text }]} numberOfLines={2}>
          {row.menuName}
        </ThemedText>
        <ThemedText style={[styles.menuSub, { color: theme.textSecondary }]}>{row.subtitle}</ThemedText>
      </View>
      <ThemedText style={[styles.lineValue, { color: theme.text }]}>{formatRupiah(row.total)}</ThemedText>
    </View>
  );
};

const MODES: { value: GroupMode; label: string }[] = [
  { value: 'day', label: 'Per Hari' },
  { value: 'category', label: 'Per Kategori' },
];

/** Rincian Pesanan: bisa dibuka/tutup; menu dikelompokkan per hari atau per kategori, plus ringkasan biaya. */
export const OrderBreakdown: React.FC<{ order: OrderDetail }> = ({ order }) => {
  const { theme, isDark } = useThemeContext();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<GroupMode>('day');
  const cardBg = isDark ? '#18181B' : '#FFFFFF';
  const activeBg = isDark ? '#3F3F46' : Brand.navy;
  const trackBg = isDark ? '#27272A' : '#F1F3F8';

  const groups = useMemo(() => (mode === 'day' ? groupByDay(order) : groupByCategory(order)), [order, mode]);

  return (
    <View style={[styles.card, { backgroundColor: cardBg, borderColor: theme.border }]}>
      <Pressable
        onPress={() => setIsOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        style={[styles.header, styles.clickable]}
      >
        <ThemedText style={[styles.title, { color: theme.text }]}>Rincian Pesanan</ThemedText>
        <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
          {Platform.OS === 'web' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="2.4"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          ) : (
            <ThemedText style={{ color: theme.text }}>▾</ThemedText>
          )}
        </View>
      </Pressable>

      {isOpen ? (
        <View style={[styles.body, { borderTopColor: theme.border }]}>
          <View style={[styles.segment, { backgroundColor: trackBg }]} accessibilityRole="tablist">
            {MODES.map((m) => {
              const active = mode === m.value;
              return (
                <Pressable
                  key={m.value}
                  onPress={() => setMode(m.value)}
                  accessibilityRole="tab"
                  accessibilityState={{ selected: active }}
                  style={[styles.segmentBtn, styles.clickable, active && { backgroundColor: activeBg }]}
                >
                  <ThemedText style={[styles.segmentText, { color: active ? '#FFFFFF' : theme.textSecondary }]}>
                    {m.label}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>

          {groups.map((group) => (
            <View key={group.key} style={styles.group}>
              <ThemedText style={[styles.groupTitle, { color: theme.text }]}>{group.title}</ThemedText>
              {group.rows.map((row) => (
                <MenuLine key={row.key} row={row} />
              ))}
            </View>
          ))}

          <View style={[styles.summary, { borderTopColor: theme.border }]}>
            <Line label="Subtotal" value={formatRupiah(order.subtotal)} />
            {order.discountAmount > 0 ? (
              <Line label="Diskon" value={`- ${formatRupiah(order.discountAmount)}`} />
            ) : null}
            <Line
              label={order.fulfillmentType === 'PICKUP' ? 'Ambil sendiri' : 'Ongkos kirim'}
              value={order.deliveryFee > 0 ? formatRupiah(order.deliveryFee) : 'Gratis'}
            />
            <Line label="Total" value={formatRupiah(order.grandTotal)} strong />
          </View>
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  clickable: Platform.select({ web: { cursor: 'pointer' } as object, default: {} }),
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  title: { fontSize: 14, fontWeight: '700' },
  body: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 18, paddingVertical: 14, gap: 16 },
  segment: { flexDirection: 'row', borderRadius: 12, padding: 4, gap: 4 },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 9 },
  segmentText: { fontSize: 13, fontWeight: '600' },
  group: { gap: 10 },
  groupTitle: { fontSize: 13, fontWeight: '700' },
  menuRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumb: { width: 48, height: 48, borderRadius: 10 },
  menuText: { flex: 1, gap: 2 },
  menuName: { fontSize: 13, fontWeight: '600' },
  menuSub: { fontSize: 12 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  lineLabel: { fontSize: 13, flex: 1 },
  lineValue: { fontSize: 13, fontVariant: ['tabular-nums'] },
  strong: { fontSize: 14, fontWeight: '700' },
  summary: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 4 },
});

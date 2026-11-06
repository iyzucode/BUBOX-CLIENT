import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader';
import { CheckoutPalette, useCheckoutPalette } from '@/components/checkout/checkoutPalette';
import { useGetWeeklyMenu } from '@/features/menu/useMenu';
import {
  ACTIVE_ORDER_STATUSES,
  CANCELLED_ORDER_STATUSES,
  ORDER_STATUS_META,
  formatRupiah,
  formatShortDate,
} from '@/features/order/orderStatus';
import { useMyOrders } from '@/features/order/useOrders';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/useAuthStore';
import { OrderSummary } from '@/types/order';

const FALLBACK_IMAGE = require('@/assets/images/baby-puree-fallback.jpg');

export type OrdersTab = 'all' | 'unpaid' | 'active' | 'completed' | 'cancelled';

const TABS: { id: OrdersTab; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'unpaid', label: 'Belum Bayar' },
  { id: 'active', label: 'Aktif' },
  { id: 'completed', label: 'Selesai' },
  { id: 'cancelled', label: 'Dibatalkan' },
];

function matchesTab(order: OrderSummary, tab: OrdersTab): boolean {
  switch (tab) {
    case 'unpaid':
      return order.statusCode === 'AWAITING_PAYMENT';
    case 'active':
      return ACTIVE_ORDER_STATUSES.includes(order.statusCode);
    case 'completed':
      return order.statusCode === 'COMPLETED';
    case 'cancelled':
      return CANCELLED_ORDER_STATUSES.includes(order.statusCode);
    default:
      return true;
  }
}

export default function MyOrdersScreen() {
  const router = useRouter();
  const palette = useCheckoutPalette();
  const theme = useTheme();
  const params = useLocalSearchParams<{ tab?: OrdersTab }>();
  const token = useAuthStore((s) => s.token);
  const [tab, setTab] = useState<OrdersTab>(
    params.tab && TABS.some((t) => t.id === params.tab) ? params.tab : 'all'
  );

  const { data: orders, isLoading, isRefetching, refetch } = useMyOrders();
  const filtered = useMemo(() => (orders ?? []).filter((o) => matchesTab(o, tab)), [orders, tab]);

  // Foto menu diambil dari jadwal menu mingguan yang sudah di-cache (tanpa membebani API daftar order)
  const { data: weeklyMenu } = useGetWeeklyMenu();
  const menuImages = useMemo(() => {
    const map = new Map<string, string>();
    weeklyMenu?.days.forEach((day) =>
      [...day.mainMenus, ...day.secondaryMenus].forEach((m) => {
        if (m.imageUrl) map.set(m.id, m.imageUrl);
      })
    );
    return map;
  }, [weeklyMenu]);

  const openOrder = (order: OrderSummary) => {
    if (order.statusCode === 'AWAITING_PAYMENT') {
      router.push({ pathname: '/payment', params: { id: order.id } });
    } else {
      router.push({ pathname: '/order-detail', params: { id: order.id } });
    }
  };

  const renderEmpty = (message: string, actionLabel: string, onPress: () => void) => (
    <View style={styles.empty}>
      <ThemedText style={[styles.emptyText, { color: palette.cardSubtext }]}>{message}</ThemedText>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.emptyBtn, { backgroundColor: palette.actionPillBtnBg }, pressed && styles.pressed]}
      >
        <ThemedText style={[styles.emptyBtnText, { color: palette.actionPillBtnText }]}>{actionLabel}</ThemedText>
      </Pressable>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: palette.pageBg }]}>
      <CheckoutHeader title="Pesanan Saya" fallbackHref="/profile" />

      {/* Tab status */}
      <View style={[styles.tabBar, { backgroundColor: palette.cardBg }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabRow}>
          {TABS.map((item) => {
            const active = item.id === tab;
            return (
              <Pressable
                key={item.id}
                onPress={() => setTab(item.id)}
                style={[styles.tab, { borderBottomColor: active ? theme.primary : 'transparent' }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
              >
                <ThemedText style={[styles.tabText, { color: active ? theme.primary : palette.cardTitle }]}>
                  {item.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {!token ? (
        renderEmpty('Masuk untuk melihat pesanan', 'Masuk', () => router.push('/login'))
      ) : isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={renderEmpty('Belum ada pesanan', 'Pesan Sekarang', () => router.push('/order'))}
          renderItem={({ item }) => (
            <OrderCard
              order={item}
              imageUrl={item.firstMenuId ? menuImages.get(item.firstMenuId) : undefined}
              palette={palette}
              onPress={() => openOrder(item)}
            />
          )}
        />
      )}
    </View>
  );
}

interface OrderCardProps {
  order: OrderSummary;
  imageUrl?: string;
  palette: CheckoutPalette;
  onPress: () => void;
}

const OrderCard: React.FC<OrderCardProps> = ({ order, imageUrl, palette, onPress }) => {
  const otherItems = Math.max(0, order.itemLinesCount - 1);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, { backgroundColor: palette.cardBg }, pressed && styles.pressed]}
      accessibilityRole="button"
      accessibilityLabel={`Pesanan ${order.orderNumber}`}
    >
      {/* Header: nomor order + status */}
      <View style={styles.cardHeader}>
        <ThemedText style={[styles.orderNumber, { color: palette.cardTitle }]} numberOfLines={1}>
          {order.orderNumber}
        </ThemedText>
        <View style={[styles.statusPill, { backgroundColor: palette.optionBg }]}>
          <ThemedText style={[styles.statusText, { color: palette.cardTitle }]}>
            {ORDER_STATUS_META[order.statusCode]?.label ?? order.statusCode}
          </ThemedText>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: palette.optionActiveBorder }]} />

      {/* Isi: foto, menu, tanggal kirim */}
      <View style={styles.cardBody}>
        <Image
          source={imageUrl ? { uri: imageUrl } : FALLBACK_IMAGE}
          placeholder={FALLBACK_IMAGE}
          style={[styles.thumb, { backgroundColor: palette.optionBg }]}
          contentFit="cover"
        />
        <View style={styles.bodyCol}>
          <ThemedText style={[styles.menuName, { color: palette.cardTitle }]} numberOfLines={1}>
            {order.firstMenuName ?? 'Menu MPASI'}
          </ThemedText>
          {otherItems > 0 ? (
            <ThemedText style={[styles.moreItems, { color: palette.cardSubtext }]}>
              + {otherItems} produk lainnya
            </ThemedText>
          ) : null}

          <View style={styles.datesRow}>
            <ThemedText style={[styles.daysCount, { color: palette.cardTitle }]} numberOfLines={1}>
              {order.daysCount} hari
            </ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
              {order.deliveryDates.map((date) => (
                <View key={date} style={[styles.chip, { backgroundColor: palette.optionBg }]}>
                  <ThemedText style={[styles.chipText, { color: palette.cardTitle }]}>{formatShortDate(date)}</ThemedText>
                </View>
              ))}
            </ScrollView>
          </View>
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: palette.optionActiveBorder }]} />

      {/* Footer: total */}
      <View style={styles.cardFooter}>
        <ThemedText style={[styles.totalLabel, { color: palette.cardTitle }]}>Total Pembayaran</ThemedText>
        <ThemedText style={[styles.totalValue, { color: palette.cardTitle }]}>{formatRupiah(order.grandTotal)}</ThemedText>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabBar: {},
  tabRow: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    gap: 4,
  },
  tab: {
    paddingHorizontal: 10,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 2,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  tabText: { fontSize: 15, fontWeight: '500' },
  list: {
    padding: 16,
    gap: 16,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  card: {
    borderRadius: 14,
    overflow: 'hidden',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  orderNumber: { fontSize: 12, flex: 1 },
  statusPill: { paddingHorizontal: 16, paddingVertical: 6, borderRadius: 10 },
  statusText: { fontSize: 11 },
  divider: { height: 1 },
  cardBody: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  thumb: { width: 104, height: 104, borderRadius: 10 },
  bodyCol: { flex: 1, minWidth: 0, gap: 2, paddingTop: 6 },
  menuName: { fontSize: 15, fontWeight: '500' },
  moreItems: { fontSize: 11 },
  datesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  daysCount: { fontSize: 11, flexShrink: 0 },
  chips: { gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 999 },
  chipText: { fontSize: 11 },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  totalLabel: { fontSize: 14 },
  totalValue: { fontSize: 14, fontWeight: '500' },
  empty: { paddingVertical: 60, alignItems: 'center', gap: 14 },
  emptyText: { fontSize: 15 },
  emptyBtn: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 20 },
  emptyBtnText: { fontSize: 14, fontWeight: '500' },
  pressed: { opacity: 0.85 },
});

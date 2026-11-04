import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { StatusBadge } from '@/components/order/StatusBadge';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import {
  ACTIVE_ORDER_STATUSES,
  CANCELLED_ORDER_STATUSES,
  formatDateRange,
  formatRupiah,
} from '@/features/order/orderStatus';
import { useMyOrders } from '@/features/order/useOrders';
import { useTheme } from '@/hooks/use-theme';
import { useAuthStore } from '@/store/useAuthStore';
import { OrderSummary } from '@/types/order';

export type OrdersTab = 'all' | 'unpaid' | 'active' | 'completed' | 'cancelled';

const TABS: { id: OrdersTab; label: string }[] = [
  { id: 'all', label: 'Semua' },
  { id: 'unpaid', label: '⏳ Belum Bayar' },
  { id: 'active', label: '🍲 Aktif' },
  { id: 'completed', label: '✓ Selesai' },
  { id: 'cancelled', label: '✕ Batal' },
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
  const theme = useTheme();
  const params = useLocalSearchParams<{ tab?: OrdersTab }>();
  const token = useAuthStore((s) => s.token);
  const [tab, setTab] = useState<OrdersTab>(params.tab && TABS.some((t) => t.id === params.tab) ? params.tab : 'all');

  const { data: orders, isLoading, isRefetching, refetch } = useMyOrders();
  const filtered = useMemo(() => (orders ?? []).filter((o) => matchesTab(o, tab)), [orders, tab]);

  const openOrder = (order: OrderSummary) => {
    if (order.statusCode === 'AWAITING_PAYMENT') {
      router.push({ pathname: '/payment', params: { id: order.id } });
    } else {
      router.push({ pathname: '/order-detail', params: { id: order.id } });
    }
  };

  if (!token) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Pesanan Saya" fallbackHref="/profile" />
        <View style={styles.empty}>
          <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>🔒 Masuk untuk melihat pesanan</ThemedText>
          <Pressable onPress={() => router.push('/login')} style={[styles.primaryBtn, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.primaryBtnText}>Masuk</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Pesanan Saya" fallbackHref="/profile" />

      <View style={[styles.tabsWrap, { borderBottomColor: theme.border, backgroundColor: theme.card }]}>
        <FlatList
          horizontal
          data={TABS}
          keyExtractor={(t) => t.id}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}
          renderItem={({ item }) => {
            const active = item.id === tab;
            return (
              <Pressable
                onPress={() => setTab(item.id)}
                style={[
                  styles.tab,
                  { backgroundColor: active ? theme.primary : theme.backgroundElement },
                ]}
              >
                <ThemedText style={[styles.tabText, { color: active ? '#FFFFFF' : theme.text }]}>
                  {item.label}
                </ThemedText>
              </Pressable>
            );
          }}
        />
      </View>

      {isLoading ? (
        <View style={styles.empty}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(o) => o.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <View style={styles.empty}>
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>🧾 Belum ada pesanan</ThemedText>
              <Pressable onPress={() => router.push('/order')} style={[styles.primaryBtn, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.primaryBtnText}>🍲 Pesan Sekarang</ThemedText>
              </Pressable>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openOrder(item)}
              style={({ pressed }) => [
                styles.card,
                { backgroundColor: theme.card, borderColor: theme.border },
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.cardTop}>
                <ThemedText style={[styles.orderNumber, { color: theme.text }]}>{item.orderNumber}</ThemedText>
                <StatusBadge kind="order" status={item.statusCode} size="sm" />
              </View>
              <View style={styles.cardBottom}>
                <ThemedText style={[styles.meta, { color: theme.textSecondary }]}>
                  🗓️ {formatDateRange(item.firstDeliveryDate, item.lastDeliveryDate)} · {item.daysCount} hari ·{' '}
                  {item.fulfillmentType === 'DELIVERY' ? '🛵' : '🏪'}
                </ThemedText>
                <ThemedText style={[styles.total, { color: theme.text }]}>{formatRupiah(item.grandTotal)}</ThemedText>
              </View>
              {item.statusCode === 'AWAITING_PAYMENT' ? (
                <ThemedText style={[styles.payNow, { color: theme.primary }]}>Bayar QRIS →</ThemedText>
              ) : null}
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tabsWrap: { borderBottomWidth: 1 },
  tabs: { paddingHorizontal: 16, paddingVertical: 10, gap: 8 },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 999,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  tabText: { fontSize: 13, fontWeight: '600' },
  list: { padding: 16, gap: 12, maxWidth: 720, width: '100%', alignSelf: 'center' },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  orderNumber: { fontSize: 14, fontWeight: '700' },
  meta: { fontSize: 12, flex: 1 },
  total: { fontSize: 15, fontWeight: '800' },
  payNow: { fontSize: 13, fontWeight: '700' },
  empty: { paddingVertical: 60, alignItems: 'center', gap: 14 },
  emptyText: { fontSize: 15 },
  primaryBtn: { paddingHorizontal: 20, paddingVertical: 11, borderRadius: 12 },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.8 },
});

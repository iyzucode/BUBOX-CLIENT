import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { StatusBadge } from '@/components/order/StatusBadge';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import {
  DAY_STATUS_META,
  ORDER_STATUS_META,
  formatDateTime,
  formatRupiah,
  formatShortDate,
} from '@/features/order/orderStatus';
import { useOrderDetail } from '@/features/order/useOrders';
import { useTheme } from '@/hooks/use-theme';
import { OrderDayStatusCode, OrderStatusCode } from '@/types/order';

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { data: order, isLoading, isError, refetch } = useOrderDetail(id);

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Rincian Pesanan" fallbackHref="/orders" />
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      </View>
    );
  }

  if (isError || !order) {
    return (
      <View style={[styles.root, { backgroundColor: theme.background }]}>
        <ScreenHeader title="Rincian Pesanan" fallbackHref="/orders" />
        <View style={styles.center}>
          <ThemedText style={{ color: theme.textSecondary }}>Pesanan tidak ditemukan</ThemedText>
          <Pressable onPress={() => refetch()} style={[styles.primaryBtn, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.primaryBtnText}>↻ Coba Lagi</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  }

  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];
  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };

  const statusLabel = (scope: 'ORDER' | 'DAY', code: string) =>
    scope === 'ORDER'
      ? ORDER_STATUS_META[code as OrderStatusCode]?.label ?? code
      : DAY_STATUS_META[code as OrderDayStatusCode]?.label ?? code;

  const dayDateById = new Map(order.days.map((d) => [d.id, d.deliveryDate]));

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Rincian Pesanan" subtitle={order.orderNumber} fallbackHref="/orders" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Ringkasan */}
        <View style={card}>
          <View style={styles.rowBetween}>
            <StatusBadge kind="order" status={order.statusCode} />
            <ThemedText style={[styles.small, muted]}>{formatDateTime(order.createdAt)}</ThemedText>
          </View>
          <ThemedText style={[styles.amount, strong]}>{formatRupiah(order.grandTotal)}</ThemedText>
          {order.cancelReason ? (
            <ThemedText style={[styles.small, muted]}>📝 {order.cancelReason}</ThemedText>
          ) : null}
          {order.statusCode === 'AWAITING_PAYMENT' ? (
            <Pressable
              onPress={() => router.push({ pathname: '/payment', params: { id: order.id } })}
              style={[styles.primaryBtn, { backgroundColor: theme.primary }]}
            >
              <ThemedText style={styles.primaryBtnText}>Bayar QRIS →</ThemedText>
            </Pressable>
          ) : null}
        </View>

        {/* Pengambilan */}
        <View style={card}>
          <ThemedText style={[styles.sectionTitle, strong]}>
            {order.fulfillmentType === 'DELIVERY' ? '🛵 Pesan Antar' : '🏪 Ambil Sendiri'}
          </ThemedText>
          {order.address ? (
            <>
              <ThemedText style={[styles.body, strong]}>
                {order.address.recipientName} · {order.address.phoneNumber}
              </ThemedText>
              <ThemedText style={[styles.small, muted]}>
                {order.address.fullAddress}, {order.address.subdistrict}, {order.address.city}
              </ThemedText>
            </>
          ) : null}
          {order.notes ? <ThemedText style={[styles.small, muted]}>📝 {order.notes}</ThemedText> : null}
        </View>

        {/* Per hari */}
        {order.days.map((day) => (
          <View key={day.id} style={card}>
            <View style={styles.rowBetween}>
              <ThemedText style={[styles.sectionTitle, strong]}>🗓️ {formatShortDate(day.deliveryDate)}</ThemedText>
              <StatusBadge kind="day" status={day.statusCode} size="sm" />
            </View>
            {day.items.map((item) => (
              <View key={item.id} style={styles.rowBetween}>
                <ThemedText style={[styles.body, strong, styles.flex1]} numberOfLines={1}>
                  {item.qty}× {item.menuName}
                </ThemedText>
                <ThemedText style={[styles.small, muted]}>{formatRupiah(item.lineTotal)}</ThemedText>
              </View>
            ))}
            {day.statusCode === 'CANCELLED_BY_ADMIN' ? (
              <ThemedText style={[styles.small, { color: theme.danger }]}>
                ⚠ {day.cancelReason ?? 'Force majeure'} · refund diproses manual oleh admin
              </ThemedText>
            ) : null}
          </View>
        ))}

        {/* Pembayaran */}
        <View style={card}>
          <View style={styles.rowBetween}>
            <ThemedText style={[styles.small, muted]}>Subtotal</ThemedText>
            <ThemedText style={[styles.small, strong]}>{formatRupiah(order.subtotal)}</ThemedText>
          </View>
          <View style={styles.rowBetween}>
            <ThemedText style={[styles.small, muted]}>Ongkir</ThemedText>
            <ThemedText style={[styles.small, strong]}>
              {order.deliveryFee === 0 ? 'Gratis' : formatRupiah(order.deliveryFee)}
            </ThemedText>
          </View>
          <View style={styles.rowBetween}>
            <ThemedText style={[styles.small, muted]}>Metode</ThemedText>
            <ThemedText style={[styles.small, strong]}>QRIS{order.paidAt ? ` · ✓ ${formatDateTime(order.paidAt)}` : ''}</ThemedText>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <View style={styles.rowBetween}>
            <ThemedText style={[styles.body, strong]}>Total</ThemedText>
            <ThemedText style={[styles.body, strong, styles.bold]}>{formatRupiah(order.grandTotal)}</ThemedText>
          </View>
        </View>

        {/* Timeline status */}
        <View style={card}>
          <ThemedText style={[styles.sectionTitle, strong]}>⏱ Riwayat Status</ThemedText>
          {[...order.histories].reverse().map((h, index) => (
            <View key={`${h.entityId}-${h.createdAt}-${index}`} style={styles.timelineRow}>
              <View style={[styles.dot, { backgroundColor: index === 0 ? theme.primary : theme.border }]} />
              <View style={styles.flex1}>
                <ThemedText style={[styles.small, strong]}>
                  {h.scope === 'DAY' ? `${formatShortDate(dayDateById.get(h.entityId) ?? '')} · ` : ''}
                  {statusLabel(h.scope, h.toCode)}
                </ThemedText>
                {h.reason ? <ThemedText style={[styles.tiny, muted]}>{h.reason}</ThemedText> : null}
              </View>
              <ThemedText style={[styles.tiny, muted]}>{formatDateTime(h.createdAt)}</ThemedText>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 40, width: '100%', alignSelf: 'center' },
  center: { paddingVertical: 60, alignItems: 'center', gap: 14 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  amount: { fontSize: 24, fontWeight: '800' },
  body: { fontSize: 14 },
  small: { fontSize: 13 },
  tiny: { fontSize: 11 },
  bold: { fontWeight: '800' },
  flex1: { flex: 1 },
  divider: { height: 1, marginVertical: 2 },
  timelineRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  primaryBtn: {
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});

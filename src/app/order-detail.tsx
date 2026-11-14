import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { OrderBreakdown } from '@/components/order/OrderBreakdown';
import { StatusBadge } from '@/components/order/StatusBadge';
import { ScreenHeaderBar } from '@/components/ui/ScreenHeaderBar';
import { Brand } from '@/constants/theme';
import { useThemeContext } from '@/context/ThemeContext';
import {
  DAY_STATUS_META,
  ORDER_STATUS_META,
  formatDateTime,
  formatLongDate,
  formatRupiah,
} from '@/features/order/orderStatus';
import { useOrderDetail } from '@/features/order/useOrders';
import { openExternal, outletMapsUrl, whatsappUrl } from '@/features/outlet/outletUtils';
import { useCustomerLayout } from '@/hooks/use-customer-layout';
import { useAuthStore } from '@/store/useAuthStore';
import { OrderDayStatusCode, OrderDetail, OrderStatusCode } from '@/types/order';

const statusLabel = (scope: 'ORDER' | 'DAY', code: string) =>
  scope === 'ORDER'
    ? ORDER_STATUS_META[code as OrderStatusCode]?.label ?? code
    : DAY_STATUS_META[code as OrderDayStatusCode]?.label ?? code;

interface TimelineEntry {
  key: string;
  label: string;
  reason: string | null;
  createdAt: string;
  /** Tanggal kirim (yyyy-MM-dd) untuk entri per hari yang dikelompokkan; kosong untuk entri pesanan. */
  dates: string[];
}

/**
 * Riwayat terbaru di atas. Perubahan status per hari yang beruntun dengan status, alasan,
 * dan menit yang sama (mis. 7 hari dibatalkan karena QRIS kedaluwarsa) digabung jadi satu entri.
 */
function buildTimeline(order: OrderDetail): TimelineEntry[] {
  const dayDateById = new Map(order.days.map((d) => [d.id, d.deliveryDate]));
  const entries: (TimelineEntry & { groupKey: string | null })[] = [];

  [...order.histories].reverse().forEach((h, index) => {
    const date = h.scope === 'DAY' ? dayDateById.get(h.entityId) : undefined;
    const groupKey = date ? `${h.toCode}|${h.reason ?? ''}|${h.createdAt.slice(0, 16)}` : null;
    const last = entries[entries.length - 1];

    if (groupKey && last?.groupKey === groupKey) {
      last.dates.push(date!);
      return;
    }

    entries.push({
      key: `${h.entityId}-${h.createdAt}-${index}`,
      groupKey,
      label: statusLabel(h.scope, h.toCode),
      reason: h.reason,
      createdAt: h.createdAt,
      dates: date ? [date] : [],
    });
  });

  return entries.map(({ groupKey: _groupKey, dates, ...entry }) => ({ ...entry, dates: [...dates].sort() }));
}

/** Satu baris riwayat. Entri beberapa hari bisa dibuka untuk melihat tanggalnya. */
const HistoryEntry: React.FC<{ entry: TimelineEntry; isLatest: boolean; isLast: boolean }> = ({
  entry,
  isLatest,
  isLast,
}) => {
  const { theme, isDark } = useThemeContext();
  const [isOpen, setIsOpen] = useState(false);
  const isGroup = entry.dates.length > 1;
  const railColor = isDark ? '#3F3F46' : '#E4E4E7';

  const title =
    entry.dates.length === 1
      ? `${formatLongDate(entry.dates[0])} · ${entry.label}`
      : isGroup
        ? `${entry.label} · ${entry.dates.length} hari`
        : entry.label;

  const content = (
    <>
      {/* Rel kiri: titik + garis ke titik berikutnya */}
      <View style={styles.rail}>
        <View style={[styles.dot, { backgroundColor: isLatest ? Brand.orange : railColor }]} />
        {!isLast ? <View style={[styles.railLine, { backgroundColor: railColor }]} /> : null}
      </View>
      <View style={styles.flex1}>
        <View style={styles.entryTitleRow}>
          <ThemedText style={[styles.small, styles.flexShrink, { color: theme.text }]}>{title}</ThemedText>
          {isGroup ? (
            <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
              {Platform.OS === 'web' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary}
                  strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              ) : (
                <ThemedText style={[styles.tiny, { color: theme.textSecondary }]}>▾</ThemedText>
              )}
            </View>
          ) : null}
        </View>
        {entry.reason ? (
          <ThemedText style={[styles.tiny, { color: theme.textSecondary }]}>{entry.reason}</ThemedText>
        ) : null}
        {isGroup && isOpen ? (
          <View style={styles.entryDates}>
            {entry.dates.map((date) => (
              <ThemedText key={date} style={[styles.tiny, { color: theme.text }]}>
                • {formatLongDate(date)}
              </ThemedText>
            ))}
          </View>
        ) : null}
      </View>
      <ThemedText style={[styles.tiny, { color: theme.textSecondary }]}>{formatDateTime(entry.createdAt)}</ThemedText>
    </>
  );

  return isGroup ? (
    <Pressable
      onPress={() => setIsOpen((v) => !v)}
      accessibilityRole="button"
      accessibilityState={{ expanded: isOpen }}
      style={[styles.timelineRow, styles.clickable]}
    >
      {content}
    </Pressable>
  ) : (
    <View style={styles.timelineRow}>{content}</View>
  );
};

/** Rincian Pesanan: ringkasan, pengiriman, menu per hari/kategori, dan riwayat status. */
export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  const { width } = useCustomerLayout();
  const isDesktop = width > 768;
  const contentWidth = isDesktop ? 600 : '100%';
  const token = useAuthStore((s) => s.token);
  const { data: order, isPending, isError, refetch } = useOrderDetail(id);

  const cardBg = isDark ? '#18181B' : '#FFFFFF';
  const card = [styles.card, { backgroundColor: cardBg, borderColor: theme.border }];
  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/orders'));

  const renderBody = () => {
    // Web output "static": render server belum punya token. Server & render awal client sama-sama
    // menampilkan spinner, jadi tidak berkedip "Pesanan tidak ditemukan" sebelum data dimuat.
    const isServer = typeof window === 'undefined';
    if (!isServer && !token) {
      return (
        <View style={[card, styles.centerCard]}>
          <ThemedText style={[styles.small, { color: theme.textSecondary }]}>Masuk untuk melihat pesanan</ThemedText>
          <Pressable
            onPress={() => router.push('/login')}
            style={[styles.actionBtn, styles.clickable, { backgroundColor: isDark ? '#2A2A2E' : Brand.navy }]}
          >
            <ThemedText style={styles.actionBtnText}>Masuk</ThemedText>
          </Pressable>
        </View>
      );
    }

    if (isPending && id) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    if (isError || !order) {
      return (
        <View style={[card, styles.centerCard]}>
          <ThemedText style={[styles.small, { color: theme.textSecondary }]}>Pesanan tidak ditemukan</ThemedText>
          <Pressable
            onPress={() => refetch()}
            style={[styles.actionBtn, styles.clickable, { backgroundColor: isDark ? '#2A2A2E' : Brand.navy }]}
          >
            <ThemedText style={styles.actionBtnText}>Coba Lagi</ThemedText>
          </Pressable>
        </View>
      );
    }

    const timeline = buildTimeline(order);

    return (
      <>
        <View style={[styles.orderNumberCard, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={[styles.orderNumber, { color: theme.text }]} selectable>
            {order.orderNumber}
          </ThemedText>
        </View>

        {/* Ringkasan */}
        <View style={card}>
          <View style={styles.rowBetween}>
            <StatusBadge kind="order" status={order.statusCode} />
            <ThemedText style={[styles.small, { color: theme.textSecondary }]}>
              {formatDateTime(order.createdAt)}
            </ThemedText>
          </View>
          <ThemedText style={[styles.amount, { color: theme.text }]}>{formatRupiah(order.grandTotal)}</ThemedText>
          {order.cancelReason ? (
            <ThemedText style={[styles.small, { color: theme.textSecondary }]}>
              Alasan: {order.cancelReason}
            </ThemedText>
          ) : null}
          {order.statusCode === 'AWAITING_PAYMENT' ? (
            <Pressable
              onPress={() => router.push({ pathname: '/payment', params: { id: order.id, from: 'orders' } })}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.actionBtn,
                styles.clickable,
                { backgroundColor: isDark ? '#2A2A2E' : Brand.navy, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <ThemedText style={styles.actionBtnText}>Bayar Sekarang</ThemedText>
            </Pressable>
          ) : null}
        </View>

        {/* Pengiriman / pengambilan */}
        <View style={card}>
          <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
            {order.fulfillmentType === 'DELIVERY' ? 'Pesan Antar' : 'Ambil Sendiri'}
          </ThemedText>
          {order.address ? (
            <>
              <ThemedText style={[styles.body, { color: theme.text }]}>
                {order.address.recipientName} · {order.address.phoneNumber}
              </ThemedText>
              <ThemedText style={[styles.small, { color: theme.textSecondary }]}>
                {order.address.fullAddress}, {order.address.subdistrict}, {order.address.city}
              </ThemedText>
            </>
          ) : null}
          {order.outlet ? (
            <>
              <ThemedText style={[styles.body, { color: theme.text }]}>{order.outlet.name}</ThemedText>
              <ThemedText style={[styles.small, { color: theme.textSecondary }]}>
                {order.outlet.fullAddress}, {order.outlet.wilayahPath}
              </ThemedText>
              {order.outlet.pickupHours ? (
                <ThemedText style={[styles.small, { color: theme.textSecondary }]}>
                  Jam ambil: {order.outlet.pickupHours}
                </ThemedText>
              ) : null}
              <View style={styles.outletLinks}>
                {outletMapsUrl(order.outlet) ? (
                  <Pressable onPress={() => openExternal(outletMapsUrl(order.outlet!))} accessibilityRole="link" style={styles.clickable}>
                    <ThemedText style={[styles.small, styles.outletLink]}>Lihat di peta</ThemedText>
                  </Pressable>
                ) : null}
                {order.outlet.whatsappNumber ? (
                  <Pressable onPress={() => openExternal(whatsappUrl(order.outlet!.whatsappNumber))} accessibilityRole="link" style={styles.clickable}>
                    <ThemedText style={[styles.small, styles.outletLink]}>WhatsApp outlet</ThemedText>
                  </Pressable>
                ) : null}
              </View>
            </>
          ) : null}
          {order.notes ? (
            <ThemedText style={[styles.small, { color: theme.textSecondary }]}>Catatan: {order.notes}</ThemedText>
          ) : null}
        </View>

        {/* Menu per hari / kategori + ringkasan biaya */}
        <OrderBreakdown
          order={order}
          defaultOpen
          showDayStatus
          paymentMethod={order.paidAt ? `QRIS · Dibayar ${formatDateTime(order.paidAt)}` : 'QRIS'}
        />

        {/* Riwayat status */}
        {timeline.length > 0 ? (
          <View style={card}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Riwayat Status</ThemedText>
            {timeline.map((entry, index) => (
              <HistoryEntry
                key={entry.key}
                entry={entry}
                isLatest={index === 0}
                isLast={index === timeline.length - 1}
              />
            ))}
          </View>
        ) : null}
      </>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeaderBar title="Rincian Pesanan" onBack={goBack} maxWidth={contentWidth} />
      <ScrollView contentContainerStyle={[styles.scroll, { maxWidth: contentWidth }]}>{renderBody()}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { width: '100%', alignSelf: 'center', padding: 16, paddingBottom: 40, gap: 14 },
  outletLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 16, marginTop: 2 },
  outletLink: { color: Brand.orange, fontWeight: '700' },
  center: { paddingVertical: 60, alignItems: 'center' },
  card: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingVertical: 16,
    gap: 8,
  },
  centerCard: { alignItems: 'center', gap: 12, paddingVertical: 24 },
  orderNumberCard: { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  orderNumber: { fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  amount: { fontSize: 28, lineHeight: 36, fontWeight: '800' },
  body: { fontSize: 14 },
  small: { fontSize: 13 },
  tiny: { fontSize: 11 },
  flex1: { flex: 1 },
  timelineRow: { flexDirection: 'row', alignItems: 'stretch', gap: 10 },
  rail: { width: 10, alignItems: 'center' },
  // Garis menembus jarak antar-baris (gap kartu 8) sampai 3px sebelum titik berikutnya (marginTop 5).
  railLine: { flex: 1, width: 2, borderRadius: 1, marginTop: 3, marginBottom: -10 },
  entryTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  entryDates: { marginTop: 4, gap: 2 },
  flexShrink: { flexShrink: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 5 },
  actionBtn: {
    width: '100%',
    height: 46,
    marginTop: 4,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  clickable: Platform.select({ web: { cursor: 'pointer' } as object, default: {} }) as object,
});

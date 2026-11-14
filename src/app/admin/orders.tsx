import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';

import { ThemedText } from '@/components/themed-text';
import { DeliveryBoard } from '@/components/order/DeliveryBoard';
import { ReasonModal } from '@/components/order/ReasonModal';
import { StatusBadge } from '@/components/order/StatusBadge';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { toDateKey } from '@/features/order/dateUtils';
import {
  ADMIN_CANCELLABLE_DAY_STATUSES,
  DAY_STATUS_META,
  ORDER_STATUS_META,
  formatDateRange,
  formatRupiah,
  formatShortDate,
  nextDayStatus,
} from '@/features/order/orderStatus';
import {
  ORDER_QUERY_KEYS,
  useAdminOrders,
  useCancelDayByAdmin,
  useCancelOrderByAdmin,
  useDailyProduction,
  useUpdateDayStatus,
} from '@/features/order/useOrders';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import { DailyOrderDay, OrderStatusCode, OrderSummary } from '@/types/order';
import { showAlert } from '@/utils/alert';

type Tab = 'daily' | 'delivery' | 'all';

const TAB_LABEL: Record<Tab, string> = {
  daily: '🍳 Harian',
  delivery: '🛵 Antar',
  all: '🧾 Semua',
};

type CancelTarget =
  | { kind: 'day'; orderDayId: string; label: string }
  | { kind: 'order'; orderId: string; label: string };

const STATUS_FILTERS: (OrderStatusCode | 'ALL')[] = [
  'ALL',
  'AWAITING_PAYMENT',
  'PAID',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED_BY_ADMIN',
];

function shiftDate(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return toDateKey(new Date(y, m - 1, d + days));
}

/** Operasional pesanan untuk Admin, Kitchen, dan Driver (hak tiap aksi dicek ulang di server). */
export default function AdminOrdersScreen() {
  const router = useRouter();
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>('daily');
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [statusFilter, setStatusFilter] = useState<OrderStatusCode | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);

  const production = useDailyProduction(date);
  const adminOrders = useAdminOrders({
    status: statusFilter === 'ALL' ? undefined : statusFilter,
    search: search.trim() || undefined,
    page: 1,
    pageSize: 50,
  });

  const queryClient = useQueryClient();
  const updateStatus = useUpdateDayStatus();
  const cancelDay = useCancelDayByAdmin();
  const cancelOrder = useCancelOrderByAdmin();

  const handleAdvance = (day: DailyOrderDay) => {
    const next = nextDayStatus(day.statusCode, day.fulfillmentType);
    if (!next) return;
    updateStatus.mutate(
      { orderDayId: day.orderDayId, statusCode: next },
      { onError: (error) => showAlert('Gagal Memperbarui', getApiErrorMessage(error, 'Status tidak dapat diubah.'), { tone: 'error' }) }
    );
  };

  const handleSubmitCancel = (reason: string) => {
    if (!cancelTarget) return;
    const onSuccess = () => setCancelTarget(null);
    const onError = (error: unknown) => showAlert('Gagal Membatalkan', getApiErrorMessage(error, 'Pembatalan gagal.'), { tone: 'error' });

    if (cancelTarget.kind === 'day') {
      cancelDay.mutate({ orderDayId: cancelTarget.orderDayId, reason }, { onSuccess, onError });
    } else {
      cancelOrder.mutate({ orderId: cancelTarget.orderId, reason }, { onSuccess, onError });
    }
  };

  const busyDayId = updateStatus.isPending ? updateStatus.variables?.orderDayId : undefined;

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    production.data?.orders.forEach((o) => {
      counts[o.statusCode] = (counts[o.statusCode] ?? 0) + 1;
    });
    return counts;
  }, [production.data]);

  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];
  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };

  const renderDatePicker = () => (
    <>
      {/* Pilih tanggal */}
      <View style={[card, styles.dateRow]}>
        <Pressable onPress={() => setDate(shiftDate(date, -1))} style={[styles.navBtn, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={strong}>‹</ThemedText>
        </Pressable>
        <Pressable onPress={() => setDate(toDateKey(new Date()))} style={styles.flex1}>
          <ThemedText style={[styles.dateText, strong]}>🗓️ {formatShortDate(date)}</ThemedText>
          <ThemedText style={[styles.tiny, muted, styles.centerText]}>{date}</ThemedText>
        </Pressable>
        <Pressable onPress={() => setDate(shiftDate(date, 1))} style={[styles.navBtn, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={strong}>›</ThemedText>
        </Pressable>
      </View>
    </>
  );

  const renderDaily = () => (
    <>
      {renderDatePicker()}

      {production.isLoading ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : production.isError ? (
        <ThemedText style={[styles.centerText, muted]}>
          {getApiErrorMessage(production.error, 'Gagal memuat data.')}
        </ThemedText>
      ) : production.data ? (
        <>
          {/* Rekap dapur */}
          <View style={card}>
            <View style={styles.rowBetween}>
              <ThemedText style={[styles.sectionTitle, strong]}>🍳 Rekap Dapur</ThemedText>
              <ThemedText style={[styles.small, muted]}>
                {production.data.totalOrders} order · {production.data.totalPortions} porsi
              </ThemedText>
            </View>
            {production.data.menus.length === 0 ? (
              <ThemedText style={[styles.small, muted]}>Belum ada pesanan terbayar.</ThemedText>
            ) : (
              production.data.menus.map((m) => (
                <View key={m.menuId} style={styles.rowBetween}>
                  <ThemedText style={[styles.small, strong, styles.flex1]} numberOfLines={1}>
                    {m.menuName} <ThemedText style={[styles.tiny, muted]}>· {m.categoryName}</ThemedText>
                  </ThemedText>
                  <ThemedText style={[styles.qty, { color: theme.primary }]}>{m.totalQty}×</ThemedText>
                </View>
              ))
            )}
            {Object.keys(statusCounts).length > 0 ? (
              <View style={styles.chipsRow}>
                {Object.entries(statusCounts).map(([code, count]) => (
                  <ThemedText key={code} style={[styles.tiny, muted]}>
                    {DAY_STATUS_META[code as keyof typeof DAY_STATUS_META]?.icon} {count}
                  </ThemedText>
                ))}
              </View>
            ) : null}
          </View>

          {/* Per order */}
          {production.data.orders.map((day) => {
            const next = nextDayStatus(day.statusCode, day.fulfillmentType);
            const canCancel = ADMIN_CANCELLABLE_DAY_STATUSES.includes(day.statusCode);
            const busy = busyDayId === day.orderDayId;
            return (
              <View key={day.orderDayId} style={card}>
                <View style={styles.rowBetween}>
                  <ThemedText style={[styles.small, strong, styles.bold]}>
                    {day.fulfillmentType === 'DELIVERY' ? '🛵' : '🏪'} {day.orderNumber}
                  </ThemedText>
                  <StatusBadge kind="day" status={day.statusCode} size="sm" />
                </View>
                <ThemedText style={[styles.small, muted]}>
                  👤 {day.customerName}
                  {day.address ? ` · ${day.address.recipientName} ${day.address.phoneNumber}` : ''}
                </ThemedText>
                {day.address ? (
                  <ThemedText style={[styles.tiny, muted]}>
                    📍 {day.address.fullAddress}, {day.address.subdistrict}
                    {day.address.notes ? ` (${day.address.notes})` : ''}
                  </ThemedText>
                ) : null}
                {day.outlet ? (
                  <ThemedText style={[styles.tiny, muted]}>🏪 Ambil di {day.outlet.name}</ThemedText>
                ) : day.fulfillmentType === 'PICKUP' ? (
                  <ThemedText style={[styles.tiny, muted]}>🏪 Outlet tidak tercatat (pesanan lama)</ThemedText>
                ) : null}
                {day.items.map((item) => (
                  <ThemedText key={item.id} style={[styles.small, strong]}>
                    {item.qty}× {item.menuName}
                  </ThemedText>
                ))}
                {day.notes ? <ThemedText style={[styles.tiny, muted]}>📝 {day.notes}</ThemedText> : null}
                {day.fulfillmentType === 'DELIVERY' ? (
                  <ThemedText
                    style={[styles.tiny, day.driverUserId ? muted : { color: theme.warning, fontWeight: '700' }]}
                  >
                    🗺️ {day.zoneName ?? 'Tanpa zona'} · 🛵 {day.driverName ?? 'Belum ada driver'}
                  </ThemedText>
                ) : null}

                {next || canCancel ? (
                  <View style={styles.actionsRow}>
                    {next ? (
                      <Pressable
                        onPress={() => handleAdvance(day)}
                        disabled={busy}
                        style={[styles.actionBtn, styles.flex1, { backgroundColor: theme.primary, opacity: busy ? 0.6 : 1 }]}
                      >
                        {busy ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <ThemedText style={styles.actionBtnText}>
                            {DAY_STATUS_META[next].icon} {DAY_STATUS_META[next].label}
                          </ThemedText>
                        )}
                      </Pressable>
                    ) : null}
                    {canCancel ? (
                      <Pressable
                        onPress={() =>
                          setCancelTarget({ kind: 'day', orderDayId: day.orderDayId, label: `${day.orderNumber} · ${formatShortDate(date)}` })
                        }
                        style={[styles.actionBtn, styles.outlineBtn, { borderColor: theme.danger }]}
                        accessibilityLabel="Force majeure"
                      >
                        <ThemedText style={[styles.actionBtnText, { color: theme.danger }]}>⚠</ThemedText>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </>
      ) : null}
    </>
  );

  const renderAll = () => (
    <>
      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="🔍 No. order / nama / email"
        placeholderTextColor={theme.textSecondary}
        style={[styles.search, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
        {STATUS_FILTERS.map((s) => {
          const active = s === statusFilter;
          return (
            <Pressable
              key={s}
              onPress={() => setStatusFilter(s)}
              style={[styles.chip, { backgroundColor: active ? theme.primary : theme.backgroundElement }]}
            >
              <ThemedText style={[styles.tiny, styles.bold, { color: active ? '#FFFFFF' : theme.text }]}>
                {s === 'ALL' ? 'Semua' : ORDER_STATUS_META[s].label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>

      {adminOrders.isLoading ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : (
        <>
          <ThemedText style={[styles.tiny, muted]}>{adminOrders.data?.totalCount ?? 0} pesanan</ThemedText>
          {(adminOrders.data?.items ?? []).map((o: OrderSummary) => {
            const cancellable = o.statusCode === 'AWAITING_PAYMENT' || o.statusCode === 'PAID' || o.statusCode === 'IN_PROGRESS';
            return (
              <Pressable
                key={o.id}
                onPress={() => router.push({ pathname: '/order-detail', params: { id: o.id } })}
                style={card}
              >
                <View style={styles.rowBetween}>
                  <ThemedText style={[styles.small, strong, styles.bold]}>{o.orderNumber}</ThemedText>
                  <StatusBadge kind="order" status={o.statusCode} size="sm" />
                </View>
                <View style={styles.rowBetween}>
                  <ThemedText style={[styles.tiny, muted, styles.flex1]}>
                    👤 {o.customerName} · 🗓️ {formatDateRange(o.firstDeliveryDate, o.lastDeliveryDate)} ·{' '}
                    {o.fulfillmentType === 'DELIVERY' ? '🛵' : '🏪'}
                  </ThemedText>
                  <ThemedText style={[styles.small, strong, styles.bold]}>{formatRupiah(o.grandTotal)}</ThemedText>
                </View>
                {cancellable ? (
                  <Pressable
                    onPress={() => setCancelTarget({ kind: 'order', orderId: o.id, label: o.orderNumber })}
                    style={[styles.actionBtn, styles.outlineBtn, styles.alignEnd, { borderColor: theme.danger }]}
                  >
                    <ThemedText style={[styles.tiny, styles.bold, { color: theme.danger }]}>✕ Batalkan</ThemedText>
                  </Pressable>
                ) : null}
              </Pressable>
            );
          })}
        </>
      )}
    </>
  );

  const isCancelling = cancelDay.isPending || cancelOrder.isPending;
  const refreshing = tab === 'all' ? adminOrders.isRefetching : production.isRefetching;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Pesanan" subtitle="Dapur · Antar · Force majeure" fallbackHref="/admin" />

      <View style={[styles.tabs, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        {(['daily', 'delivery', 'all'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, { borderBottomColor: tab === t ? theme.primary : 'transparent' }]}
          >
            <ThemedText style={[styles.small, styles.bold, { color: tab === t ? theme.primary : theme.textSecondary }]}>
              {TAB_LABEL[t]}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => (tab === 'all' ? adminOrders.refetch() : queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all }))}
          />
        }
      >
        {tab === 'daily' ? (
          renderDaily()
        ) : tab === 'delivery' ? (
          <>
            {renderDatePicker()}
            {/* key: pilihan kiriman direset saat tanggal berganti */}
            <DeliveryBoard key={date} date={date} />
          </>
        ) : (
          renderAll()
        )}
      </ScrollView>

      <ReasonModal
        visible={!!cancelTarget}
        title={cancelTarget?.kind === 'day' ? '⚠ Force Majeure' : '✕ Batalkan Pesanan'}
        description={
          cancelTarget
            ? `${cancelTarget.label}. Jika sudah dibayar, refund dilakukan manual di luar sistem.`
            : undefined
        }
        confirmLabel="Batalkan"
        isSubmitting={isCancelling}
        onCancel={() => setCancelTarget(null)}
        onSubmit={handleSubmitCancel}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 40, maxWidth: 760, width: '100%', alignSelf: 'center' },
  tabs: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 16 },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 2,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  navBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  dateText: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  small: { fontSize: 13 },
  tiny: { fontSize: 11 },
  bold: { fontWeight: '700' },
  qty: { fontSize: 15, fontWeight: '800' },
  flex1: { flex: 1 },
  centerText: { textAlign: 'center' },
  loader: { marginTop: 30 },
  chipsRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  search: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 6 },
  actionBtn: {
    minHeight: 38,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  outlineBtn: { borderWidth: 1 },
  alignEnd: { alignSelf: 'flex-end', minHeight: 30 },
  actionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
});

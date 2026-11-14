import React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { StatusBadge } from '@/components/order/StatusBadge';
import { useThemeContext } from '@/context/ThemeContext';
import { NEXT_DAY_ACTION, formatTime } from '@/features/order/adminBoardUtils';
import { formatPercent } from '@/features/order/orderCharges';
import {
  ADMIN_CANCELLABLE_DAY_STATUSES,
  DAY_STATUS_META,
  ORDER_STATUS_META,
  formatDateTime,
  formatRupiah,
  formatShortDate,
  nextDayStatus,
  toneColors,
} from '@/features/order/orderStatus';
import { useAdminOrderDetail } from '@/features/order/useAdminBoard';
import { openExternal, whatsappUrl } from '@/features/outlet/outletUtils';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import type { OrderDay, OrderDayStatusCode, OrderDetail, OrderStatusCode } from '@/types/order';

const clickable = Platform.select({ web: { cursor: 'pointer' as const } }) ?? {};
const CANCELLABLE_ORDER: OrderStatusCode[] = ['AWAITING_PAYMENT', 'PAID', 'IN_PROGRESS'];

interface OrderDetailPanelProps {
  orderId: string;
  /** Hari kirim yang dibuka dari daftar per hari kirim (disorot). */
  focusDayId: string | null;
  canManage: boolean;
  canAdvance: boolean;
  busyDayId: string | null;
  onClose: () => void;
  onAdvanceDay: (day: OrderDay, next: OrderDayStatusCode, order: OrderDetail) => void;
  onAssignDriver: (dayIds: string[]) => void;
  onCancelDay: (day: OrderDay, order: OrderDetail) => void;
  onCancelOrder: (order: OrderDetail) => void;
  /** Tandai refund manual selesai untuk hari-hari ini. */
  onMarkRefund: (dayIds: string[], order: OrderDetail) => void;
}

/** Panel kanan: detail pesanan lengkap + aksi per hari, tanpa meninggalkan daftar. */
export const OrderDetailPanel: React.FC<OrderDetailPanelProps> = ({
  orderId, focusDayId, canManage, canAdvance, busyDayId, onClose, onAdvanceDay, onAssignDriver, onCancelDay, onCancelOrder,
  onMarkRefund,
}) => {
  const theme = useTheme();
  const { isDark } = useThemeContext();
  const { data, isPending, isError, error } = useAdminOrderDetail(orderId);
  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };
  const section = [styles.section, { borderColor: theme.border }];

  const renderBody = () => {
    if (isPending) return <ActivityIndicator style={styles.loader} color={theme.primary} />;
    if (isError || !data) {
      return <ThemedText style={[styles.small, muted]}>{getApiErrorMessage(error, 'Detail pesanan tidak dapat dimuat.')}</ThemedText>;
    }
    const order = data.order;
    const assignment = (dayId: string) => data.assignments.find((a) => a.orderDayId === dayId);
    const isDelivery = order.fulfillmentType === 'DELIVERY';
    const unpaid = order.statusCode === 'AWAITING_PAYMENT';
    const activeDeliveryDays = order.days.filter((d) => ['CONFIRMED', 'PREPARING', 'READY'].includes(d.statusCode));
    const refundPendingDays = order.days.filter((d) => d.requiresManualRefund && !assignment(d.id)?.refundedAt);

    return (
      <>
        {/* Pelanggan */}
        <View style={section}>
          <ThemedText style={[styles.sectionTitle, muted]}>PELANGGAN</ThemedText>
          <ThemedText style={[styles.body, styles.bold, strong]}>{data.customerName}</ThemedText>
          <ThemedText style={[styles.small, muted]}>{data.customerEmail}</ThemedText>
          {data.customerPhone ? (
            <Pressable onPress={() => openExternal(whatsappUrl(data.customerPhone))} style={clickable}>
              <ThemedText style={[styles.small, styles.link, { color: theme.primary }]}>WhatsApp {data.customerPhone}</ThemedText>
            </Pressable>
          ) : null}
        </View>

        {/* Pembayaran */}
        <View style={section}>
          <ThemedText style={[styles.sectionTitle, muted]}>PEMBAYARAN · QRIS</ThemedText>
          {data.paymentNeedsReview ? (
            <View style={[styles.alert, { backgroundColor: toneColors('warning', isDark).bg }]}>
              <ThemedText style={[styles.small, styles.bold, { color: toneColors('warning', isDark).text }]}>
                ⚠ Pembayaran perlu ditinjau
              </ThemedText>
              <ThemedText style={[styles.small, { color: toneColors('warning', isDark).text }]}>
                {data.paymentReviewNote ?? 'Nominal tidak cocok.'} Cocokkan dengan dashboard Midtrans.
              </ThemedText>
            </View>
          ) : null}
          <ThemedText style={[styles.body, strong]}>
            {order.paidAt ? `Lunas · ${formatDateTime(order.paidAt)}` : unpaid ? `Menunggu bayar · batas ${formatTime(order.paymentDueAt)}` : 'Tidak dibayar'}
          </ThemedText>
        </View>

        {/* Tujuan */}
        <View style={section}>
          <ThemedText style={[styles.sectionTitle, muted]}>{isDelivery ? 'PESAN ANTAR' : 'AMBIL SENDIRI'}</ThemedText>
          {order.address ? (
            <>
              <ThemedText style={[styles.body, strong]}>
                {order.address.recipientName} · {order.address.phoneNumber}
              </ThemedText>
              <ThemedText style={[styles.small, muted]}>
                {order.address.fullAddress}, {order.address.subdistrict}, {order.address.city}
                {order.address.notes ? ` (${order.address.notes})` : ''}
              </ThemedText>
            </>
          ) : null}
          {order.outlet ? (
            <>
              <ThemedText style={[styles.body, strong]}>{order.outlet.name}</ThemedText>
              <ThemedText style={[styles.small, muted]}>
                {order.outlet.fullAddress}
                {order.outlet.pickupHours ? ` · Ambil ${order.outlet.pickupHours}` : ''}
              </ThemedText>
            </>
          ) : null}
          {order.notes ? (
            <View style={[styles.alert, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={[styles.small, strong]}>📝 {order.notes}</ThemedText>
            </View>
          ) : null}
        </View>

        {/* Hari kirim */}
        <View style={section}>
          <View style={styles.rowBetween}>
            <ThemedText style={[styles.sectionTitle, muted]}>HARI KIRIM ({order.days.length})</ThemedText>
            <View style={styles.headActions}>
              {canManage && refundPendingDays.length > 1 ? (
                <Pressable onPress={() => onMarkRefund(refundPendingDays.map((d) => d.id), order)} style={clickable}>
                  <ThemedText style={[styles.small, styles.bold, { color: theme.primary }]}>Tandai semua direfund</ThemedText>
                </Pressable>
              ) : null}
              {isDelivery && canManage && activeDeliveryDays.length > 1 ? (
                <Pressable onPress={() => onAssignDriver(activeDeliveryDays.map((d) => d.id))} style={clickable}>
                  <ThemedText style={[styles.small, styles.bold, { color: theme.primary }]}>Atur driver semua hari</ThemedText>
                </Pressable>
              ) : null}
            </View>
          </View>
          {order.days.map((day, i) => {
            const a = assignment(day.id);
            const next = unpaid ? null : nextDayStatus(day.statusCode, order.fulfillmentType);
            const blocked = next === 'OUT_FOR_DELIVERY' && !a?.driverUserId;
            const canCancelDay = canManage && ADMIN_CANCELLABLE_DAY_STATUSES.includes(day.statusCode);
            const focused = day.id === focusDayId;
            const busy = busyDayId === day.id;
            const refundPending = canManage && day.requiresManualRefund && !a?.refundedAt;
            return (
              <View
                key={day.id}
                style={[
                  styles.dayCard,
                  { borderColor: focused ? theme.primary : theme.border, backgroundColor: focused ? theme.primaryLight : 'transparent' },
                ]}
              >
                <View style={styles.rowBetween}>
                  <ThemedText style={[styles.body, styles.bold, strong]}>
                    Hari {i + 1} · {formatShortDate(day.deliveryDate)}
                  </ThemedText>
                  <StatusBadge kind="day" status={day.statusCode} size="sm" />
                </View>
                {day.items.map((it) => (
                  <ThemedText key={it.id} style={[styles.small, strong]}>
                    {it.qty}× {it.menuName} <ThemedText style={[styles.small, muted]}>· {it.categoryName}</ThemedText>
                  </ThemedText>
                ))}
                {isDelivery ? (
                  <ThemedText style={[styles.small, a?.driverUserId ? muted : { color: theme.warning }]}>
                    🗺️ {a?.zoneName ?? 'Belum ada zona'} · 🛵 {a?.driverName ?? 'Belum ada driver'}
                  </ThemedText>
                ) : null}
                {day.requiresManualRefund && a?.refundedAt ? (
                  <View style={[styles.alert, { backgroundColor: toneColors('success', isDark).bg }]}>
                    <ThemedText style={[styles.small, styles.bold, { color: toneColors('success', isDark).text }]}>
                      ✓ Sudah direfund · {formatRupiah(day.daySubtotal)}
                    </ThemedText>
                    <ThemedText style={[styles.small, { color: toneColors('success', isDark).text }]}>
                      {formatDateTime(a.refundedAt)}{a.refundedByName ? ` · ${a.refundedByName}` : ''}{a.refundNote ? ` · ${a.refundNote}` : ''}
                    </ThemedText>
                  </View>
                ) : day.requiresManualRefund ? (
                  <ThemedText style={[styles.small, styles.bold, { color: theme.danger }]}>
                    Refund manual tertunda · {formatRupiah(day.daySubtotal)}
                  </ThemedText>
                ) : null}
                {day.cancelReason ? <ThemedText style={[styles.small, muted]}>Alasan: {day.cancelReason}</ThemedText> : null}

                {(next && canAdvance) || (isDelivery && canManage && ['CONFIRMED', 'PREPARING', 'READY'].includes(day.statusCode)) || canCancelDay || refundPending ? (
                  <View style={styles.actions}>
                    {refundPending ? (
                      <Pressable
                        onPress={() => onMarkRefund([day.id], order)}
                        style={[styles.btn, clickable, { backgroundColor: theme.primary, borderColor: theme.primary }]}
                      >
                        <ThemedText style={[styles.btnText, { color: '#FFFFFF' }]}>Tandai direfund</ThemedText>
                      </Pressable>
                    ) : null}
                    {isDelivery && canManage && ['CONFIRMED', 'PREPARING', 'READY'].includes(day.statusCode) ? (
                      <Pressable onPress={() => onAssignDriver([day.id])} style={[styles.btn, clickable, { borderColor: theme.border }]}>
                        <ThemedText style={[styles.btnText, strong]}>{a?.driverUserId ? 'Ganti driver' : 'Atur driver'}</ThemedText>
                      </Pressable>
                    ) : null}
                    {next && canAdvance && !blocked ? (
                      <Pressable
                        onPress={() => onAdvanceDay(day, next, order)}
                        disabled={busy}
                        style={[styles.btn, clickable, { backgroundColor: theme.primary, borderColor: theme.primary, opacity: busy ? 0.6 : 1 }]}
                      >
                        {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : (
                          <ThemedText style={[styles.btnText, { color: '#FFFFFF' }]}>
                            {NEXT_DAY_ACTION[next] ?? DAY_STATUS_META[next].label}
                          </ThemedText>
                        )}
                      </Pressable>
                    ) : null}
                    {canCancelDay ? (
                      <Pressable onPress={() => onCancelDay(day, order)} style={[styles.btn, clickable, { borderColor: theme.danger }]}>
                        <ThemedText style={[styles.btnText, { color: theme.danger }]}>Batalkan hari</ThemedText>
                      </Pressable>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })}
        </View>

        {/* Rincian biaya */}
        <View style={section}>
          <ThemedText style={[styles.sectionTitle, muted]}>RINCIAN BIAYA</ThemedText>
          <Line label="Subtotal" value={formatRupiah(order.subtotal)} />
          {order.discountAmount > 0 ? <Line label={`Diskon${order.voucherCode ? ` (${order.voucherCode})` : ''}`} value={`- ${formatRupiah(order.discountAmount)}`} /> : null}
          <Line
            label={`${isDelivery ? 'Ongkir' : 'Biaya ambil sendiri'}${order.deliveryFeeNote ? ` (${order.deliveryFeeNote})` : ''}`}
            value={order.deliveryFee > 0 ? formatRupiah(order.deliveryFee) : 'Gratis'}
          />
          {order.serviceFee > 0 ? (
            <Line label={`Biaya layanan${order.serviceFeePercent != null ? ` (${formatPercent(order.serviceFeePercent)})` : ''}`} value={formatRupiah(order.serviceFee)} />
          ) : null}
          {order.taxAmount > 0 ? <Line label={`Pajak (${formatPercent(order.taxPercent)})`} value={formatRupiah(order.taxAmount)} /> : null}
          <Line label="Total" value={formatRupiah(order.grandTotal)} strongValue />
        </View>

        {/* Riwayat */}
        <View style={section}>
          <ThemedText style={[styles.sectionTitle, muted]}>RIWAYAT STATUS</ThemedText>
          {[...order.histories].reverse().map((h, i) => {
            const meta = h.scope === 'ORDER'
              ? ORDER_STATUS_META[h.toCode as OrderStatusCode]
              : DAY_STATUS_META[h.toCode as OrderDayStatusCode];
            const dayIndex = h.scope === 'DAY' ? order.days.findIndex((d) => d.id === h.entityId) : -1;
            return (
              <View key={`${h.createdAt}-${i}`} style={styles.history}>
                <ThemedText style={[styles.small, strong]}>
                  {meta ? `${meta.icon} ${meta.label}` : h.toCode}
                  {dayIndex >= 0 ? <ThemedText style={[styles.small, muted]}> · hari {dayIndex + 1}</ThemedText> : null}
                </ThemedText>
                <ThemedText style={[styles.tiny, muted]}>
                  {formatDateTime(h.createdAt)} · {h.actorRole}{h.reason ? ` · ${h.reason}` : ''}
                </ThemedText>
              </View>
            );
          })}
        </View>

        {canManage && CANCELLABLE_ORDER.includes(order.statusCode) ? (
          <Pressable onPress={() => onCancelOrder(order)} style={[styles.cancelOrder, clickable, { borderColor: theme.danger }]}>
            <ThemedText style={[styles.btnText, { color: theme.danger }]}>Batalkan pesanan</ThemedText>
          </Pressable>
        ) : null}
      </>
    );
  };

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Tutup detail" />
      <View style={[styles.panel, { backgroundColor: theme.background, borderColor: theme.border }]}>
        <View style={[styles.header, { borderColor: theme.border, backgroundColor: theme.card }]}>
          <View style={styles.flex}>
            <ThemedText style={[styles.title, strong]} numberOfLines={1}>{data?.order.orderNumber ?? 'Detail pesanan'}</ThemedText>
            {data ? <StatusBadge kind="order" status={data.order.statusCode} size="sm" /> : null}
          </View>
          <Pressable onPress={onClose} style={[styles.close, clickable]} accessibilityRole="button" accessibilityLabel="Tutup">
            <ThemedText style={[styles.title, muted]}>✕</ThemedText>
          </Pressable>
        </View>
        <ScrollView contentContainerStyle={styles.content}>{renderBody()}</ScrollView>
      </View>
    </View>
  );
};

const Line: React.FC<{ label: string; value: string; strongValue?: boolean }> = ({ label, value, strongValue }) => {
  const theme = useTheme();
  return (
    <View style={styles.rowBetween}>
      <ThemedText style={[styles.small, { color: strongValue ? theme.text : theme.textSecondary }, strongValue && styles.bold]}>{label}</ThemedText>
      <ThemedText style={[styles.small, { color: theme.text }, strongValue && styles.bold]}>{value}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, flexDirection: 'row', zIndex: 20 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  panel: { width: 460, maxWidth: '100%', borderLeftWidth: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16, borderBottomWidth: 1 },
  flex: { flex: 1, gap: 6 },
  title: { fontSize: 16, fontWeight: '800' },
  close: { padding: 6 },
  content: { padding: 16, gap: 12, paddingBottom: 40 },
  loader: { marginTop: 30 },
  section: { gap: 6, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  sectionTitle: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  body: { fontSize: 14 },
  small: { fontSize: 12, lineHeight: 17 },
  tiny: { fontSize: 11 },
  bold: { fontWeight: '700' },
  link: { textDecorationLine: 'underline' },
  alert: { borderRadius: 10, padding: 10, gap: 2 },
  headActions: { flexDirection: 'row', gap: 12 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  dayCard: { borderWidth: 1, borderRadius: 12, padding: 10, gap: 4 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  btn: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 6, minHeight: 30, justifyContent: 'center' },
  btnText: { fontSize: 12, fontWeight: '700' },
  history: { gap: 1 },
  cancelOrder: { borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
});

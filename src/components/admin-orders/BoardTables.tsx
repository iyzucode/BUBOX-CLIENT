import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { StatusBadge } from '@/components/order/StatusBadge';
import { useThemeContext } from '@/context/ThemeContext';
import {
  NEXT_DAY_ACTION,
  dayStatusNote,
  orderAction,
  paymentSummary,
  shortOrderNumber,
} from '@/features/order/adminBoardUtils';
import { formatDateRange, formatDateTime, formatRupiah, formatShortDate, nextDayStatus, toneColors } from '@/features/order/orderStatus';
import { useTheme } from '@/hooks/use-theme';
import type { AdminDayRow, AdminOrderRow } from '@/types/adminOrders';

const clickable = Platform.select({ web: { cursor: 'pointer' as const } }) ?? {};

// ==========================================
// Per hari kirim
// ==========================================

interface DayTableProps {
  rows: AdminDayRow[];
  /** Tampilkan tanggal di kolom pesanan (periode lebih dari satu hari). */
  showDate: boolean;
  busyDayId: string | null;
  canAdvance: boolean;
  canAssignDriver: boolean;
  /** Admin: tandai refund manual selesai. */
  canMarkRefund: boolean;
  /** Pesanan yang dibuat setelah waktu ini diberi label "Baru". */
  newSince: string | null;
  /** Kolom centang untuk aksi massal (null = tanpa centang). */
  selection: { ids: Set<string>; onToggle: (row: AdminDayRow) => void; onTogglePage: (rows: AdminDayRow[], select: boolean) => void } | null;
  onOpen: (row: AdminDayRow) => void;
  onAdvance: (row: AdminDayRow) => void;
  onAssignDriver: (row: AdminDayRow) => void;
  onMarkRefund: (row: AdminDayRow) => void;
}

export const DayTable: React.FC<DayTableProps> = ({
  rows, showDate, busyDayId, canAdvance, canAssignDriver, canMarkRefund, newSince, selection,
  onOpen, onAdvance, onAssignDriver, onMarkRefund,
}) => {
  const theme = useTheme();
  const { isDark } = useThemeContext();
  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };
  const pageSelected = !!selection && rows.length > 0 && rows.every((r) => selection.ids.has(r.orderDayId));
  const pagePartly = !!selection && !pageSelected && rows.some((r) => selection.ids.has(r.orderDayId));

  return (
    <View style={[styles.table, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <View style={[styles.headRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {selection ? (
          <CheckBox
            checked={pageSelected}
            mixed={pagePartly}
            label={pageSelected ? 'Batal pilih semua di halaman ini' : 'Pilih semua di halaman ini'}
            onPress={() => selection.onTogglePage(rows, !pageSelected)}
          />
        ) : null}
        <ThemedText style={[styles.head, styles.colOrder, muted]}>Pesanan / pelanggan</ThemedText>
        <ThemedText style={[styles.head, styles.colMenu, muted]}>Menu & porsi</ThemedText>
        <ThemedText style={[styles.head, styles.colPlace, muted]}>Pengantaran / pengambilan</ThemedText>
        <ThemedText style={[styles.head, styles.colStatus, muted]}>Status harian</ThemedText>
        <ThemedText style={[styles.head, styles.colAction, muted]}>Tindakan</ThemedText>
      </View>

      {rows.map((row) => {
        const note = dayStatusNote(row);
        const next = row.orderStatus === 'AWAITING_PAYMENT' ? null : nextDayStatus(row.dayStatus, row.fulfillmentType);
        // Berangkat wajib punya driver (server menolak DRIVER_NOT_ASSIGNED)
        const blockedByDriver = next === 'OUT_FOR_DELIVERY' && !row.driverUserId;
        const busy = busyDayId === row.orderDayId;
        const isDelivery = row.fulfillmentType === 'DELIVERY';
        const checked = !!selection?.ids.has(row.orderDayId);
        const isNew = !!newSince && Date.parse(row.orderCreatedAt) > Date.parse(newSince);

        // Urutan: masalah pembayaran → driver (admin) → status berikutnya → lihat detail
        let action: { label: string; onPress: () => void; primary: boolean } = { label: 'Lihat detail', onPress: () => onOpen(row), primary: false };
        if (row.paymentNeedsReview) action = { label: 'Tinjau bayar', onPress: () => onOpen(row), primary: false };
        else if (row.refundPending) {
          action = canMarkRefund
            ? { label: 'Tandai direfund', onPress: () => onMarkRefund(row), primary: true }
            : { label: 'Lihat refund', onPress: () => onOpen(row), primary: false };
        }
        else if ((row.needsDriver || blockedByDriver) && isDelivery && canAssignDriver) action = { label: 'Atur driver', onPress: () => onAssignDriver(row), primary: true };
        else if (next && canAdvance && !blockedByDriver) action = { label: NEXT_DAY_ACTION[next] ?? 'Lanjut', onPress: () => onAdvance(row), primary: true };

        return (
          <Pressable
            key={row.orderDayId}
            onPress={() => onOpen(row)}
            style={({ pressed }) => [
              styles.row,
              clickable,
              { borderColor: theme.border },
              row.needsAttention && { backgroundColor: isDark ? '#2A2210' : '#FFF8E6' },
              checked && { backgroundColor: theme.primaryLight },
              pressed && { opacity: 0.85 },
            ]}
            // Tanpa role "button": di web baris berisi tombol aksi, dan <button> tidak boleh bersarang
            accessibilityLabel={`Detail ${row.orderNumber}`}
          >
            {selection ? (
              <CheckBox checked={checked} label={`Pilih ${row.orderNumber}`} onPress={() => selection.onToggle(row)} />
            ) : null}
            <View style={styles.colOrder}>
              <View style={styles.nameRow}>
                <ThemedText style={[styles.name, styles.shrink, strong]} numberOfLines={1}>
                  {row.needsAttention ? '⚠ ' : ''}{row.customerName}
                </ThemedText>
                {isNew ? <NewBadge /> : null}
              </View>
              <ThemedText style={[styles.small, muted]} numberOfLines={1}>
                {shortOrderNumber(row.orderNumber)} · Hari {row.dayIndex} dari {row.dayCount}
                {showDate ? ` · ${formatShortDate(row.deliveryDate)}` : ''}
              </ThemedText>
            </View>

            <View style={styles.colMenu}>
              <ThemedText style={[styles.cell, strong]} numberOfLines={1}>
                {row.firstMenuName ?? '-'}
                {row.menuCount > 1 ? <ThemedText style={[styles.small, muted]}> +{row.menuCount - 1} menu</ThemedText> : null}
              </ThemedText>
              <ThemedText style={[styles.small, muted]} numberOfLines={1}>
                {row.portions} porsi{row.notes ? '  📝 ada catatan' : ''}
              </ThemedText>
            </View>

            <View style={styles.colPlace}>
              <ThemedText style={[styles.cell, strong]} numberOfLines={1}>
                {isDelivery ? `🛵 Pesan Antar · ${row.zoneName ?? 'Belum ada zona'}` : `🏪 Ambil Sendiri · ${row.outletName ?? '-'}`}
              </ThemedText>
              {isDelivery ? (
                <>
                  <ThemedText style={[styles.small, muted]} numberOfLines={1}>
                    {row.addressLine ?? '-'}
                  </ThemedText>
                  <ThemedText style={[styles.small, row.driverName ? muted : { color: theme.warning }]} numberOfLines={1}>
                    {row.recipientName ?? ''}{row.recipientPhone ? ` · ${row.recipientPhone}` : ''} · {row.driverName ?? 'Tanpa driver'}
                  </ThemedText>
                </>
              ) : (
                <ThemedText style={[styles.small, muted]} numberOfLines={1}>
                  {row.pickupHours ? `Ambil ${row.pickupHours}` : 'Jam ambil belum diatur'}
                  {row.customerPhone ? ` · ${row.customerPhone}` : ''}
                </ThemedText>
              )}
            </View>

            <View style={styles.colStatus}>
              {row.orderStatus === 'AWAITING_PAYMENT' ? (
                <StatusBadge kind="order" status="AWAITING_PAYMENT" size="sm" />
              ) : (
                <StatusBadge kind="day" status={row.dayStatus} size="sm" />
              )}
              {note ? (
                <ThemedText style={[styles.small, { color: note.tone === 'neutral' ? theme.textSecondary : toneColors(note.tone, isDark).text }]} numberOfLines={1}>
                  {note.text}
                </ThemedText>
              ) : null}
            </View>

            <View style={styles.colAction}>
              <Pressable
                onPress={(e) => {
                  e.stopPropagation?.();
                  action.onPress();
                }}
                disabled={busy}
                style={[
                  styles.actionBtn,
                  clickable,
                  action.primary
                    ? { backgroundColor: theme.primary, borderColor: theme.primary }
                    : { borderColor: row.needsAttention ? theme.warning : theme.border },
                  busy && { opacity: 0.6 },
                ]}
                accessibilityRole="button"
              >
                {busy ? (
                  <ActivityIndicator size="small" color={action.primary ? '#FFFFFF' : theme.primary} />
                ) : (
                  <ThemedText style={[styles.actionText, { color: action.primary ? '#FFFFFF' : row.needsAttention ? theme.warning : theme.text }]}>
                    {action.label}
                  </ThemedText>
                )}
              </Pressable>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

// ==========================================
// Per pesanan
// ==========================================

export const OrderTable: React.FC<{ rows: AdminOrderRow[]; newSince: string | null; onOpen: (row: AdminOrderRow) => void }> = ({
  rows, newSince, onOpen,
}) => {
  const theme = useTheme();
  const { isDark } = useThemeContext();
  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };

  return (
    <View style={[styles.table, { borderColor: theme.border, backgroundColor: theme.card }]}>
      <View style={[styles.headRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText style={[styles.head, styles.colOrder, muted]}>Pesanan / pelanggan</ThemedText>
        <ThemedText style={[styles.head, styles.colMenu, muted]}>Periode & progres kirim</ThemedText>
        <ThemedText style={[styles.head, styles.colPay, muted]}>Pembayaran</ThemedText>
        <ThemedText style={[styles.head, styles.colTotal, muted]}>Total</ThemedText>
        <ThemedText style={[styles.head, styles.colStatus, muted]}>Status pesanan</ThemedText>
        <ThemedText style={[styles.head, styles.colAction, muted]}>Tindakan</ThemedText>
      </View>

      {rows.map((row) => {
        const pay = paymentSummary(row);
        const act = orderAction(row);
        const active = row.dayCount - row.cancelledDays;
        const progress = active > 0 ? row.doneDays / active : 0;
        return (
          <Pressable
            key={row.orderId}
            onPress={() => onOpen(row)}
            style={({ pressed }) => [
              styles.row,
              clickable,
              { borderColor: theme.border },
              row.needsAttention && { backgroundColor: isDark ? '#2A2210' : '#FFF8E6' },
              pressed && { opacity: 0.85 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Detail ${row.orderNumber}`}
          >
            <View style={styles.colOrder}>
              <View style={styles.nameRow}>
                <ThemedText style={[styles.name, styles.shrink, strong]} numberOfLines={1}>
                  {row.needsAttention ? '⚠ ' : ''}{row.customerName}
                </ThemedText>
                {newSince && Date.parse(row.createdAt) > Date.parse(newSince) ? <NewBadge /> : null}
              </View>
              <ThemedText style={[styles.small, muted]} numberOfLines={1}>
                {shortOrderNumber(row.orderNumber)} · Dipesan {formatDateTime(row.createdAt)}
              </ThemedText>
            </View>

            <View style={styles.colMenu}>
              <ThemedText style={[styles.cell, strong]} numberOfLines={1}>
                {formatDateRange(row.firstDeliveryDate, row.lastDeliveryDate)} · {row.dayCount} hari
              </ThemedText>
              <ThemedText style={[styles.small, muted]} numberOfLines={1}>
                {row.doneDays}/{active} hari selesai · {row.portions} porsi
                {row.cancelledDays > 0 ? ` · ${row.cancelledDays} batal` : ''}
              </ThemedText>
              <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: theme.success }]} />
              </View>
            </View>

            <View style={styles.colPay}>
              <ThemedText style={[styles.cell, styles.bold, { color: pay.tone === 'neutral' ? theme.textSecondary : toneColors(pay.tone, isDark).text }]}>
                {pay.title}
              </ThemedText>
              <ThemedText style={[styles.small, muted]} numberOfLines={1}>{pay.note}</ThemedText>
            </View>

            <View style={styles.colTotal}>
              <ThemedText style={[styles.cell, styles.bold, strong]}>{formatRupiah(row.grandTotal)}</ThemedText>
            </View>

            <View style={styles.colStatus}>
              <StatusBadge kind="order" status={row.orderStatus} size="sm" />
              <ThemedText style={[styles.small, muted]} numberOfLines={1}>
                {row.fulfillmentType === 'DELIVERY' ? `Pesan Antar${row.zoneName ? ` · ${row.zoneName}` : ''}` : `Ambil · ${row.outletName ?? '-'}`}
              </ThemedText>
            </View>

            <View style={styles.colAction}>
              <View
                style={[
                  styles.actionBtn,
                  { borderColor: act.emphasis ? theme.warning : theme.border },
                ]}
              >
                <ThemedText style={[styles.actionText, { color: act.emphasis ? theme.warning : theme.text }]}>{act.label}</ThemedText>
              </View>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
};

// ==========================================
// Bagian kecil
// ==========================================

const NewBadge: React.FC = () => {
  const theme = useTheme();
  return (
    <View style={[styles.newBadge, { backgroundColor: theme.primary }]}>
      <ThemedText style={styles.newBadgeText}>Baru</ThemedText>
    </View>
  );
};

const CheckBox: React.FC<{ checked: boolean; mixed?: boolean; label: string; onPress: () => void }> = ({
  checked, mixed, label, onPress,
}) => {
  const theme = useTheme();
  const on = checked || mixed;
  return (
    <Pressable
      onPress={(e) => {
        e.stopPropagation?.();
        onPress();
      }}
      hitSlop={8}
      style={[styles.checkCell, clickable]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: mixed ? 'mixed' : checked }}
      aria-checked={mixed ? 'mixed' : checked}
      accessibilityLabel={label}
    >
      <View style={[styles.box, { borderColor: on ? theme.primary : theme.border, backgroundColor: on ? theme.primary : theme.card }]}>
        {on ? <ThemedText style={styles.tick}>{mixed ? '–' : '✓'}</ThemedText> : null}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  table: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1 },
  head: { fontSize: 11, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11, borderBottomWidth: StyleSheet.hairlineWidth },
  colOrder: { flex: 1.3, gap: 2, minWidth: 0 },
  colMenu: { flex: 1.2, gap: 2, minWidth: 0 },
  colPlace: { flex: 1.6, gap: 2, minWidth: 0 },
  colPay: { flex: 1, gap: 2, minWidth: 0 },
  colTotal: { flex: 0.8, minWidth: 0 },
  colStatus: { flex: 1, gap: 4, minWidth: 0 },
  colAction: { width: 128, alignItems: 'stretch' },
  name: { fontSize: 14, fontWeight: '700' },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 0 },
  shrink: { flexShrink: 1 },
  newBadge: { borderRadius: 999, paddingHorizontal: 6, paddingVertical: 1 },
  newBadgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: '800' },
  checkCell: { width: 20, alignItems: 'center', justifyContent: 'center' },
  box: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tick: { color: '#FFFFFF', fontSize: 11, lineHeight: 13, fontWeight: '800' },
  cell: { fontSize: 13 },
  small: { fontSize: 11, lineHeight: 15 },
  bold: { fontWeight: '700' },
  actionBtn: { borderWidth: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center', justifyContent: 'center', minHeight: 34 },
  actionText: { fontSize: 12, fontWeight: '700' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 3 },
  progressFill: { height: 4, borderRadius: 2 },
});

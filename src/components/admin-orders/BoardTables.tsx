import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { StatusBadge } from '@/components/order/StatusBadge';
import { useThemeContext } from '@/context/ThemeContext';
import { NEXT_DAY_ACTION, orderAction, paymentSummary, shortOrderNumber } from '@/features/order/adminBoardUtils';
import { formatDateRange, formatRupiah, formatShortDate, nextDayStatus, toneColors } from '@/features/order/orderStatus';
import { useTheme } from '@/hooks/use-theme';
import type { AdminDayRow, AdminOrderRow } from '@/types/adminOrders';

const clickable = Platform.select({ web: { cursor: 'pointer' as const } }) ?? {};

// ==========================================
// Per hari kirim
// ==========================================

interface DayTableProps {
  rows: AdminDayRow[];
  /** Tampilkan tanggal kirim di baris (periode lebih dari satu hari). */
  showDate: boolean;
  busyDayId: string | null;
  canAdvance: boolean;
  canAssignDriver: boolean;
  /** Admin: tandai refund manual selesai. */
  canMarkRefund: boolean;
  /** Kolom centang untuk aksi massal (null = tanpa centang). */
  selection: { ids: Set<string>; onToggle: (row: AdminDayRow) => void; onTogglePage: (rows: AdminDayRow[], select: boolean) => void } | null;
  onOpen: (row: AdminDayRow) => void;
  onAdvance: (row: AdminDayRow) => void;
  onAssignDriver: (row: AdminDayRow) => void;
  onMarkRefund: (row: AdminDayRow) => void;
}

/** Aksi utama satu hari kirim. Urutan: pembayaran → refund → driver (admin) → status berikutnya. */
function dayAction(
  row: AdminDayRow,
  p: Pick<DayTableProps, 'canAdvance' | 'canAssignDriver' | 'canMarkRefund' | 'onOpen' | 'onAdvance' | 'onAssignDriver' | 'onMarkRefund'>
): { label: string; onPress: () => void } | null {
  const next = row.orderStatus === 'AWAITING_PAYMENT' ? null : nextDayStatus(row.dayStatus, row.fulfillmentType);
  // Berangkat wajib punya driver (server menolak DRIVER_NOT_ASSIGNED)
  const blockedByDriver = next === 'OUT_FOR_DELIVERY' && !row.driverUserId;
  if (row.paymentNeedsReview) return { label: 'Tinjau bayar', onPress: () => p.onOpen(row) };
  if (row.refundPending) {
    return p.canMarkRefund ? { label: 'Tandai direfund', onPress: () => p.onMarkRefund(row) } : { label: 'Lihat refund', onPress: () => p.onOpen(row) };
  }
  if ((row.needsDriver || blockedByDriver) && row.fulfillmentType === 'DELIVERY' && p.canAssignDriver) {
    return { label: 'Atur driver', onPress: () => p.onAssignDriver(row) };
  }
  if (next && p.canAdvance && !blockedByDriver) return { label: NEXT_DAY_ACTION[next] ?? 'Lanjut', onPress: () => p.onAdvance(row) };
  return null;
}

export const DayTable: React.FC<DayTableProps> = (props) => {
  const { rows, showDate, busyDayId, selection, onOpen } = props;
  const theme = useTheme();
  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };
  const pageSelected = !!selection && rows.length > 0 && rows.every((r) => selection.ids.has(r.orderDayId));
  const pagePartly = !!selection && !pageSelected && rows.some((r) => selection.ids.has(r.orderDayId));

  return (
    <View>
      <View style={[styles.headRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {selection ? (
          <CheckBox
            checked={pageSelected}
            mixed={pagePartly}
            label={pageSelected ? 'Batal pilih semua di halaman ini' : 'Pilih semua di halaman ini'}
            onPress={() => selection.onTogglePage(rows, !pageSelected)}
          />
        ) : null}
        <ThemedText style={[styles.head, styles.colOrder, muted]}>Pelanggan / pesanan</ThemedText>
        <ThemedText style={[styles.head, styles.colMenu, muted]}>Menu & porsi</ThemedText>
        <ThemedText style={[styles.head, styles.colPlace, muted]}>Pengantaran</ThemedText>
        <ThemedText style={[styles.head, styles.colStatus, muted]}>Status</ThemedText>
        <ThemedText style={[styles.head, styles.colAction, muted]}>Tindakan</ThemedText>
        <View style={styles.colChevron} />
      </View>

      {rows.map((row) => {
        const action = dayAction(row, props);
        const busy = busyDayId === row.orderDayId;
        const isDelivery = row.fulfillmentType === 'DELIVERY';
        const checked = !!selection?.ids.has(row.orderDayId);

        return (
          <Pressable
            key={row.orderDayId}
            onPress={() => onOpen(row)}
            style={({ pressed }) => [
              styles.row,
              clickable,
              { borderColor: theme.border },
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
              <ThemedText style={[styles.name, strong]} numberOfLines={1}>{row.customerName}</ThemedText>
              <ThemedText style={[styles.sub, muted]} numberOfLines={1}>
                {shortOrderNumber(row.orderNumber)} · Hari {row.dayIndex} dari {row.dayCount}
                {showDate ? ` · ${formatShortDate(row.deliveryDate)}` : ''}
              </ThemedText>
            </View>

            <View style={styles.colMenu}>
              <ThemedText style={[styles.cell, strong]} numberOfLines={1}>
                {row.firstMenuName ?? '-'}
                {row.menuCount > 1 ? <ThemedText style={[styles.sub, muted]}> +{row.menuCount - 1} menu</ThemedText> : null}
              </ThemedText>
              <ThemedText style={[styles.sub, muted]}>{row.portions} porsi</ThemedText>
            </View>

            <View style={styles.colPlace}>
              <ThemedText style={[styles.cell, strong]} numberOfLines={1}>{isDelivery ? 'Pesan Antar' : 'Ambil Sendiri'}</ThemedText>
              <ThemedText style={[styles.sub, muted]} numberOfLines={1}>
                {isDelivery ? row.zoneName ?? 'Belum ada zona' : row.outletName ?? '-'}
              </ThemedText>
            </View>

            <View style={styles.colStatus}>
              {row.orderStatus === 'AWAITING_PAYMENT' ? (
                <StatusBadge kind="order" status="AWAITING_PAYMENT" size="sm" />
              ) : (
                <StatusBadge kind="day" status={row.dayStatus} size="sm" />
              )}
            </View>

            <View style={styles.colAction}>
              {busy ? (
                <ActivityIndicator size="small" color={theme.primary} />
              ) : action ? (
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    action.onPress();
                  }}
                  style={[styles.actionLink, clickable]}
                  accessibilityRole="button"
                >
                  <ThemedText style={[styles.actionText, { color: theme.primary }]}>{action.label}</ThemedText>
                </Pressable>
              ) : null}
            </View>
            <ThemedText style={[styles.colChevron, styles.chevron, muted]}>›</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
};

// ==========================================
// Per pesanan
// ==========================================

export const OrderTable: React.FC<{ rows: AdminOrderRow[]; onOpen: (row: AdminOrderRow) => void }> = ({ rows, onOpen }) => {
  const theme = useTheme();
  const { isDark } = useThemeContext();
  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };

  return (
    <View>
      <View style={[styles.headRow, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <ThemedText style={[styles.head, styles.colOrder, muted]}>Pelanggan / pesanan</ThemedText>
        <ThemedText style={[styles.head, styles.colMenu, muted]}>Periode & progres</ThemedText>
        <ThemedText style={[styles.head, styles.colPay, muted]}>Pembayaran</ThemedText>
        <ThemedText style={[styles.head, styles.colTotal, muted]}>Total</ThemedText>
        <ThemedText style={[styles.head, styles.colStatus, muted]}>Status</ThemedText>
        <ThemedText style={[styles.head, styles.colAction, muted]}>Tindakan</ThemedText>
        <View style={styles.colChevron} />
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
            style={({ pressed }) => [styles.row, clickable, { borderColor: theme.border }, pressed && { opacity: 0.85 }]}
            accessibilityRole="button"
            accessibilityLabel={`Detail ${row.orderNumber}`}
          >
            <View style={styles.colOrder}>
              <ThemedText style={[styles.name, strong]} numberOfLines={1}>{row.customerName}</ThemedText>
              <ThemedText style={[styles.sub, muted]} numberOfLines={1}>
                {shortOrderNumber(row.orderNumber)} · {row.fulfillmentType === 'DELIVERY' ? 'Pesan Antar' : 'Ambil Sendiri'}
              </ThemedText>
            </View>

            <View style={styles.colMenu}>
              <ThemedText style={[styles.cell, strong]} numberOfLines={1}>
                {formatDateRange(row.firstDeliveryDate, row.lastDeliveryDate)} · {row.dayCount} hari
              </ThemedText>
              <ThemedText style={[styles.sub, muted]} numberOfLines={1}>
                {row.doneDays}/{active} selesai · {row.portions} porsi{row.cancelledDays > 0 ? ` · ${row.cancelledDays} batal` : ''}
              </ThemedText>
              <View style={[styles.progressTrack, { backgroundColor: theme.backgroundElement }]}>
                <View style={[styles.progressFill, { width: `${Math.round(progress * 100)}%`, backgroundColor: theme.success }]} />
              </View>
            </View>

            <View style={styles.colPay}>
              <ThemedText style={[styles.cell, { color: pay.tone === 'neutral' ? theme.textSecondary : toneColors(pay.tone, isDark).text }]} numberOfLines={1}>
                {pay.title}
              </ThemedText>
              <ThemedText style={[styles.sub, muted]} numberOfLines={1}>{pay.note}</ThemedText>
            </View>

            <View style={styles.colTotal}>
              <ThemedText style={[styles.cell, strong]}>{formatRupiah(row.grandTotal)}</ThemedText>
            </View>

            <View style={styles.colStatus}>
              <StatusBadge kind="order" status={row.orderStatus} size="sm" />
            </View>

            <View style={styles.colAction}>
              {act.emphasis ? <ThemedText style={[styles.actionText, { color: theme.primary }]}>{act.label}</ThemedText> : null}
            </View>
            <ThemedText style={[styles.colChevron, styles.chevron, muted]}>›</ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
};

// ==========================================
// Bagian kecil
// ==========================================

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
  headRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 10, borderTopWidth: 1, borderBottomWidth: 1 },
  head: { fontSize: 12, fontWeight: '500' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  colOrder: { flex: 1.3, gap: 3, minWidth: 0 },
  colMenu: { flex: 1.5, gap: 3, minWidth: 0 },
  colPlace: { flex: 1.3, gap: 3, minWidth: 0 },
  colPay: { flex: 1.1, gap: 3, minWidth: 0 },
  colTotal: { flex: 0.8, minWidth: 0 },
  colStatus: { flex: 1, minWidth: 0, alignItems: 'flex-start' },
  colAction: { width: 120, alignItems: 'flex-start' },
  colChevron: { width: 14 },
  chevron: { fontSize: 18, textAlign: 'center' },
  name: { fontSize: 14, fontWeight: '600' },
  cell: { fontSize: 13, fontWeight: '500' },
  sub: { fontSize: 12 },
  actionLink: { paddingVertical: 4 },
  actionText: { fontSize: 13, fontWeight: '600' },
  progressTrack: { height: 4, borderRadius: 2, overflow: 'hidden', marginTop: 3 },
  progressFill: { height: 4, borderRadius: 2 },
  checkCell: { width: 20, alignItems: 'center', justifyContent: 'center' },
  box: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tick: { color: '#FFFFFF', fontSize: 11, lineHeight: 13, fontWeight: '800' },
});

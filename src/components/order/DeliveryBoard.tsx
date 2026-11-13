import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { StatusBadge } from '@/components/order/StatusBadge';
import { PickerItem, SelectModalPicker } from '@/components/ui/SelectModalPicker';
import { useDrivers, useSetDayDriver } from '@/features/delivery/useDelivery';
import { DAY_STATUS_META, nextDayStatus } from '@/features/order/orderStatus';
import { useDailyDeliveries, useUpdateDayStatus } from '@/features/order/useOrders';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { AssignmentSource } from '@/types/delivery';
import { DailyOrderDay } from '@/types/order';
import { confirmAction, showAlert } from '@/utils/alert';

const FOLLOW_ZONE = '__zone__';
const UNASSIGNED_KEY = '__unassigned__';
const MANAGER_ROLES = ['admin', 'super admin'];

const SOURCE_LABEL: Record<AssignmentSource, string> = {
  ZONE: 'otomatis dari zona',
  MANUAL: 'dipilih manual',
  DISPATCHED: 'sudah berangkat',
  UNASSIGNED: 'belum ada driver',
};

interface DriverGroup {
  key: string;
  driverName: string | null;
  zones: string[];
  days: DailyOrderDay[];
}

interface Props {
  /** yyyy-MM-dd */
  date: string;
}

/**
 * Kiriman harian dikelompokkan per driver. "Belum ada driver" selalu di atas supaya tidak terlewat.
 * Admin bisa memindahkan satu/lebih kiriman ke driver lain (manual menang atas zona) sampai kiriman berangkat.
 */
export const DeliveryBoard: React.FC<Props> = ({ date }) => {
  const theme = useTheme();
  const roles = useAuthStore((s) => s.user?.roles);
  const canAssign = !!roles?.some((r) => MANAGER_ROLES.includes(r.toLowerCase()));

  const deliveries = useDailyDeliveries(date);
  const drivers = useDrivers(canAssign);
  const updateStatus = useUpdateDayStatus();
  const setDayDriver = useSetDayDriver();

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [pickerFor, setPickerFor] = useState<string[] | null>(null);

  const groups = useMemo<DriverGroup[]>(() => {
    const map = new Map<string, DriverGroup>();
    (deliveries.data?.deliveries ?? []).forEach((d) => {
      const key = d.driverUserId ?? UNASSIGNED_KEY;
      const group = map.get(key) ?? { key, driverName: d.driverName ?? null, zones: [], days: [] };
      group.days.push(d);
      if (d.zoneName && !group.zones.includes(d.zoneName)) group.zones.push(d.zoneName);
      map.set(key, group);
    });
    return [...map.values()].sort((a, b) => {
      if (a.key === UNASSIGNED_KEY) return -1;
      if (b.key === UNASSIGNED_KEY) return 1;
      return (a.driverName ?? '').localeCompare(b.driverName ?? '', 'id');
    });
  }, [deliveries.data]);

  const total = deliveries.data?.deliveries.length ?? 0;
  const unassignedCount = groups.find((g) => g.key === UNASSIGNED_KEY)?.days.length ?? 0;
  const driverCount = groups.filter((g) => g.key !== UNASSIGNED_KEY).length;

  const driverItems = useMemo<PickerItem[]>(
    () => [
      { value: FOLLOW_ZONE, label: 'Ikuti zona', subtitle: 'Hapus pilihan manual; driver mengikuti pemetaan zona' },
      ...(drivers.data ?? []).map((d) => ({
        value: d.userId,
        label: d.fullName,
        subtitle: d.zones.length ? `Zona: ${d.zones.join(', ')}` : 'Belum memegang zona',
      })),
    ],
    [drivers.data]
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handlePickDriver = async (item: PickerItem) => {
    const ids = pickerFor;
    setPickerFor(null);
    if (!ids || ids.length === 0) return;
    const driverUserId = item.value === FOLLOW_ZONE ? null : item.value;
    if (ids.length > 1) {
      const ok = await confirmAction(
        'Pindahkan Kiriman?',
        driverUserId
          ? `${ids.length} kiriman akan diantar ${item.label}.`
          : `${ids.length} kiriman akan kembali mengikuti driver zonanya.`,
        { confirmText: 'Pindahkan', tone: 'info' }
      );
      if (!ok) return;
    }
    setDayDriver.mutate(
      { orderDayIds: ids, driverUserId, reason: null },
      {
        onSuccess: (res) => {
          setSelected(new Set());
          if (res.updated < ids.length) {
            showAlert(
              'Sebagian Tidak Dipindah',
              `${ids.length - res.updated} kiriman sudah berangkat sehingga drivernya tidak bisa diubah lagi.`,
              { tone: 'warning' }
            );
          }
        },
        onError: (error) =>
          showAlert('Gagal Mengganti Driver', getApiErrorMessage(error, 'Driver tidak dapat diubah.'), { tone: 'error' }),
      }
    );
  };

  const handleAdvance = (day: DailyOrderDay) => {
    const next = nextDayStatus(day.statusCode, day.fulfillmentType);
    if (!next) return;
    updateStatus.mutate(
      { orderDayId: day.orderDayId, statusCode: next },
      { onError: (error) => showAlert('Gagal Memperbarui', getApiErrorMessage(error, 'Status tidak dapat diubah.'), { tone: 'error' }) }
    );
  };

  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };
  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];

  if (deliveries.isLoading) return <ActivityIndicator style={styles.loader} color={theme.primary} />;
  if (deliveries.isError) {
    return (
      <ThemedText style={[styles.small, muted, styles.center]}>
        {getApiErrorMessage(deliveries.error, 'Gagal memuat kiriman.')}
      </ThemedText>
    );
  }

  const busyStatusId = updateStatus.isPending ? updateStatus.variables?.orderDayId : undefined;
  const busyDriverIds = setDayDriver.isPending ? setDayDriver.variables?.orderDayIds ?? [] : [];

  return (
    <>
      <View style={card}>
        <View style={styles.rowBetween}>
          <ThemedText style={[styles.sectionTitle, strong]}>🛵 Kiriman</ThemedText>
          <ThemedText style={[styles.small, muted]}>
            {total} kiriman · {driverCount} driver
          </ThemedText>
        </View>
        {unassignedCount > 0 ? (
          <ThemedText style={[styles.small, styles.bold, { color: theme.warning }]}>
            ⚠ {unassignedCount} kiriman belum punya driver. Pilih driver atau pasang driver di zonanya.
          </ThemedText>
        ) : total > 0 ? (
          <ThemedText style={[styles.small, { color: theme.success }]}>✓ Semua kiriman sudah punya driver.</ThemedText>
        ) : (
          <ThemedText style={[styles.small, muted]}>Belum ada kiriman terbayar untuk tanggal ini.</ThemedText>
        )}
      </View>

      {canAssign && selected.size > 0 ? (
        <View style={[styles.bulkBar, { backgroundColor: theme.secondary }]}>
          <ThemedText style={[styles.small, styles.bold, { color: theme.card }]}>{selected.size} dipilih</ThemedText>
          <View style={styles.inlineRow}>
            <Pressable onPress={() => setSelected(new Set())} style={[styles.bulkBtn, styles.pointer]}>
              <ThemedText style={[styles.small, { color: theme.card }]}>Batal</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setPickerFor([...selected])}
              style={[styles.bulkBtn, styles.pointer, { backgroundColor: theme.primary }]}
            >
              <ThemedText style={[styles.small, styles.bold, { color: '#FFFFFF' }]}>Ganti driver</ThemedText>
            </Pressable>
          </View>
        </View>
      ) : null}

      {groups.map((group) => {
        const unassigned = group.key === UNASSIGNED_KEY;
        return (
          <View key={group.key} style={styles.group}>
            <View style={[styles.groupHeader, { borderLeftColor: unassigned ? theme.warning : theme.secondary }]}>
              <ThemedText style={[styles.groupTitle, { color: unassigned ? theme.warning : theme.text }]}>
                {unassigned ? '⚠ Belum ada driver' : `🛵 ${group.driverName}`}
              </ThemedText>
              <ThemedText style={[styles.tiny, muted]}>
                {group.days.length} kiriman{group.zones.length ? ` · ${group.zones.join(', ')}` : ''}
              </ThemedText>
            </View>

            {group.days.map((day) => {
              const next = nextDayStatus(day.statusCode, day.fulfillmentType);
              const dispatched = day.assignmentSource === 'DISPATCHED';
              const isSelected = selected.has(day.orderDayId);
              const statusBusy = busyStatusId === day.orderDayId;
              const driverBusy = busyDriverIds.includes(day.orderDayId);
              return (
                <View key={day.orderDayId} style={[card, isSelected && { borderColor: theme.primary }]}>
                  <View style={styles.rowBetween}>
                    <View style={[styles.inlineRow, styles.flex1]}>
                      {canAssign && !dispatched ? (
                        <Pressable
                          onPress={() => toggle(day.orderDayId)}
                          style={[
                            styles.checkbox,
                            styles.pointer,
                            { borderColor: isSelected ? theme.primary : theme.border, backgroundColor: isSelected ? theme.primary : 'transparent' },
                          ]}
                          accessibilityRole="checkbox"
                          aria-checked={isSelected}
                          accessibilityLabel={`Pilih ${day.orderNumber}`}
                        >
                          {isSelected ? <ThemedText style={styles.checkMark}>✓</ThemedText> : null}
                        </Pressable>
                      ) : null}
                      <ThemedText style={[styles.small, styles.bold, strong]}>{day.orderNumber}</ThemedText>
                    </View>
                    <StatusBadge kind="day" status={day.statusCode} size="sm" />
                  </View>

                  {day.address ? (
                    <>
                      <ThemedText style={[styles.small, strong]}>
                        👤 {day.address.recipientName} · {day.address.phoneNumber}
                      </ThemedText>
                      <ThemedText style={[styles.tiny, muted]}>
                        📍 {day.address.fullAddress}, {day.address.subdistrict}, {day.address.city}
                        {day.address.notes ? ` (${day.address.notes})` : ''}
                      </ThemedText>
                    </>
                  ) : (
                    <ThemedText style={[styles.small, strong]}>👤 {day.customerName}</ThemedText>
                  )}
                  <ThemedText style={[styles.tiny, muted]}>
                    {day.items.map((i) => `${i.qty}× ${i.menuName}`).join(' · ')}
                  </ThemedText>
                  {day.notes ? <ThemedText style={[styles.tiny, muted]}>📝 {day.notes}</ThemedText> : null}

                  <ThemedText style={[styles.tiny, muted]}>
                    🗺️ {day.zoneName ?? 'Tanpa zona'} · {SOURCE_LABEL[day.assignmentSource ?? 'UNASSIGNED']}
                  </ThemedText>

                  <View style={styles.actionsRow}>
                    {next ? (
                      <Pressable
                        onPress={() => handleAdvance(day)}
                        disabled={statusBusy}
                        style={[styles.actionBtn, styles.flex1, { backgroundColor: theme.primary, opacity: statusBusy ? 0.6 : 1 }]}
                      >
                        {statusBusy ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <ThemedText style={styles.actionBtnText}>
                            {DAY_STATUS_META[next].icon} {DAY_STATUS_META[next].label}
                          </ThemedText>
                        )}
                      </Pressable>
                    ) : null}
                    {canAssign && !dispatched ? (
                      <Pressable
                        onPress={() => setPickerFor([day.orderDayId])}
                        disabled={driverBusy}
                        style={[styles.actionBtn, styles.outlineBtn, { borderColor: theme.secondary, opacity: driverBusy ? 0.6 : 1 }]}
                      >
                        <ThemedText style={[styles.small, styles.bold, { color: theme.secondary }]}>
                          {driverBusy ? 'Memproses…' : unassigned ? 'Pilih driver' : 'Ganti driver'}
                        </ThemedText>
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        );
      })}

      <SelectModalPicker
        visible={!!pickerFor}
        title={pickerFor && pickerFor.length > 1 ? `Driver untuk ${pickerFor.length} kiriman` : 'Pilih driver'}
        placeholder="Cari driver..."
        items={driverItems}
        isLoading={drivers.isLoading}
        onSelect={handlePickDriver}
        onClose={() => setPickerFor(null)}
      />
    </>
  );
};

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 6 },
  group: { gap: 8 },
  groupHeader: { borderLeftWidth: 4, paddingLeft: 10, paddingVertical: 2, marginTop: 6 },
  groupTitle: { fontSize: 15, fontWeight: '700' },
  bulkBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 8,
    ...Platform.select({ web: { position: 'sticky' as any, top: 0, zIndex: 10 } }),
  },
  bulkBtn: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkbox: { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  checkMark: { color: '#FFFFFF', fontSize: 12, lineHeight: 14, fontWeight: '800' },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  small: { fontSize: 13 },
  tiny: { fontSize: 11 },
  bold: { fontWeight: '700' },
  flex1: { flex: 1 },
  center: { textAlign: 'center' },
  loader: { marginTop: 30 },
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
  actionBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  pointer: Platform.select({ web: { cursor: 'pointer' } }) ?? {},
});

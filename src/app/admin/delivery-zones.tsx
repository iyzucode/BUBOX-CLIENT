import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ZoneAreasPanel } from '@/components/delivery/ZoneAreasPanel';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { PickerItem, SelectModalPicker } from '@/components/ui/SelectModalPicker';
import {
  useDeleteZone,
  useDeliveryZones,
  useDrivers,
  useSaveZone,
  useSearchUsers,
  useSetDriverRole,
  useSetZoneDriver,
  useZoneDriverHistory,
} from '@/features/delivery/useDelivery';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import { DeliveryZone, Driver, UpsertZoneRequest } from '@/types/delivery';
import { confirmAction, showAlert } from '@/utils/alert';

type Tab = 'zones' | 'drivers';

const NO_DRIVER = '__none__';

function formatWib(iso: string): string {
  return new Date(iso).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** Admin: zona pengantaran ("driver wilayah"), driver yang memegang zona, dan daftar user ber-peran Driver. */
export default function AdminDeliveryZonesScreen() {
  const theme = useTheme();
  const [tab, setTab] = useState<Tab>('zones');
  const [editing, setEditing] = useState<DeliveryZone | 'new' | null>(null);
  const [driverPickerFor, setDriverPickerFor] = useState<DeliveryZone | null>(null);
  const [historyFor, setHistoryFor] = useState<string | null>(null);
  const [areasFor, setAreasFor] = useState<string | null>(null);
  const [userQuery, setUserQuery] = useState('');

  const zones = useDeliveryZones();
  const drivers = useDrivers();
  const users = useSearchUsers(userQuery);
  const saveZone = useSaveZone();
  const setZoneDriver = useSetZoneDriver();
  const setDriverRole = useSetDriverRole();
  const history = useZoneDriverHistory(historyFor);
  const deleteZone = useDeleteZone();

  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };
  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];

  const onError = (title: string) => (error: unknown) =>
    showAlert(title, getApiErrorMessage(error, 'Perubahan tidak tersimpan.'), { tone: 'error' });

  const driverItems = useMemo<PickerItem[]>(
    () => [
      { value: NO_DRIVER, label: 'Kosongkan zona', subtitle: 'Kiriman zona ini masuk antrean “Belum ada driver”' },
      ...(drivers.data ?? []).map((d) => ({
        value: d.userId,
        label: d.fullName,
        subtitle: [d.email, d.zones.length ? `Zona: ${d.zones.join(', ')}` : null].filter(Boolean).join(' · '),
      })),
    ],
    [drivers.data]
  );

  const handlePickDriver = async (item: PickerItem) => {
    const zone = driverPickerFor;
    setDriverPickerFor(null);
    if (!zone) return;
    const driverUserId = item.value === NO_DRIVER ? null : item.value;
    if (driverUserId === zone.driverUserId) return;
    const ok = await confirmAction(
      driverUserId ? 'Ganti Driver Zona?' : 'Kosongkan Zona?',
      driverUserId
        ? `${zone.name} akan dipegang ${item.label}. Kiriman yang belum berangkat ikut pindah ke driver ini.`
        : `${zone.name} tidak punya driver lagi. Kiriman yang belum berangkat masuk antrean “Belum ada driver”.`,
      { confirmText: driverUserId ? 'Ganti' : 'Kosongkan', tone: driverUserId ? 'info' : 'warning' }
    );
    if (!ok) return;
    setZoneDriver.mutate({ zoneId: zone.id, driverUserId }, { onError: onError('Gagal Mengganti Driver') });
  };

  const handleToggleActive = (zone: DeliveryZone, isActive: boolean) => {
    saveZone.mutate(
      {
        id: zone.id,
        data: { code: zone.code, name: zone.name, description: zone.description, isActive },
      },
      { onError: onError('Gagal Mengubah Zona') }
    );
  };

  const handleDelete = async (zone: DeliveryZone) => {
    if (zone.areaCount > 0 || zone.driverUserId) {
      showAlert(
        'Zona Belum Kosong',
        [
          zone.areaCount > 0 ? `Pindahkan ${zone.areaCount} wilayahnya ke zona lain di menu Wilayah Antar` : null,
          zone.driverUserId ? 'kosongkan drivernya' : null,
        ]
          .filter(Boolean)
          .join(' dan ') + ' dulu, atau cukup nonaktifkan zona ini.',
        { tone: 'warning' }
      );
      return;
    }
    const ok = await confirmAction(
      'Hapus Zona?',
      `${zone.name} (${zone.code}) dan riwayat drivernya akan dihapus permanen. Riwayat kiriman yang sudah berangkat tetap tersimpan.`,
      { confirmText: 'Hapus', tone: 'danger' }
    );
    if (!ok) return;
    deleteZone.mutate({ id: zone.id }, { onError: onError('Gagal Menghapus Zona') });
  };

  const handleRevoke = async (driver: Driver) => {
    const ok = await confirmAction(
      'Cabut Peran Driver?',
      driver.zones.length
        ? `${driver.fullName} memegang ${driver.zones.join(', ')}. Zona tersebut akan dikosongkan dan kiriman yang belum berangkat masuk antrean “Belum ada driver”.`
        : `${driver.fullName} tidak lagi bisa ditugaskan mengantar.`,
      { confirmText: 'Cabut', tone: 'danger' }
    );
    if (!ok) return;
    setDriverRole.mutate({ userId: driver.userId, grant: false }, { onError: onError('Gagal Mencabut Peran') });
  };

  const renderZones = () => (
    <>
      <Pressable
        onPress={() => setEditing('new')}
        style={({ pressed }) => [styles.addBtn, { backgroundColor: theme.primary, opacity: pressed ? 0.85 : 1 }]}
        accessibilityRole="button"
      >
        <ThemedText style={styles.addText}>+ Zona Baru</ThemedText>
      </Pressable>

      {zones.isPending ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : zones.isError ? (
        <ThemedText style={[styles.small, muted]}>{getApiErrorMessage(zones.error, 'Gagal memuat zona.')}</ThemedText>
      ) : zones.data.length === 0 ? (
        <View style={card}>
          <ThemedText style={[styles.small, muted]}>
            Belum ada zona. Buat zona (mis. “Kota Utara”), pasang drivernya, lalu pilihkan zona ini untuk wilayahnya di menu Wilayah Antar.
          </ThemedText>
        </View>
      ) : (
        zones.data.map((zone) => {
          const busy =
            (setZoneDriver.isPending && setZoneDriver.variables?.zoneId === zone.id) ||
            (saveZone.isPending && saveZone.variables?.id === zone.id);
          const showHistory = historyFor === zone.id;
          const showAreas = areasFor === zone.id;
          const deletable = zone.areaCount === 0 && !zone.driverUserId;
          return (
            <View key={zone.id} style={[card, !zone.isActive && styles.inactive]}>
              <View style={styles.rowBetween}>
                <View style={styles.flex1}>
                  <ThemedText style={[styles.title, strong]}>{zone.name}</ThemedText>
                  <ThemedText style={[styles.tiny, muted]}>
                    {zone.code} · {zone.areaCount} wilayah dipetakan
                  </ThemedText>
                </View>
                {busy ? <ActivityIndicator size="small" color={theme.primary} /> : null}
                <View style={styles.inlineRow}>
                  <ThemedText style={[styles.tiny, muted]}>{zone.isActive ? 'Aktif' : 'Nonaktif'}</ThemedText>
                  <Switch
                    value={zone.isActive}
                    onValueChange={(v) => handleToggleActive(zone, v)}
                    disabled={busy}
                    accessibilityLabel={`Aktifkan ${zone.name}`}
                  />
                </View>
              </View>

              {zone.description ? <ThemedText style={[styles.small, muted]}>{zone.description}</ThemedText> : null}

              <View style={[styles.driverBox, { backgroundColor: theme.backgroundElement }]}>
                <View style={styles.flex1}>
                  <ThemedText style={[styles.tiny, muted]}>Driver</ThemedText>
                  {zone.driverUserId ? (
                    <>
                      <ThemedText style={[styles.small, styles.bold, strong]}>🛵 {zone.driverName}</ThemedText>
                      <ThemedText style={[styles.tiny, muted]}>{zone.driverEmail}</ThemedText>
                    </>
                  ) : (
                    <ThemedText style={[styles.small, styles.bold, { color: theme.warning }]}>
                      ⚠ Belum ada driver — kiriman zona ini masuk antrean
                    </ThemedText>
                  )}
                </View>
                <Pressable
                  onPress={() => setDriverPickerFor(zone)}
                  disabled={busy}
                  style={({ pressed }) => [styles.pillBtn, { backgroundColor: theme.secondary, opacity: pressed ? 0.85 : 1 }]}
                  accessibilityRole="button"
                >
                  <ThemedText style={[styles.small, styles.bold, { color: theme.card }]}>
                    {zone.driverUserId ? 'Ganti' : 'Pasang'}
                  </ThemedText>
                </Pressable>
              </View>

              <View style={styles.actionsRow}>
                <Pressable onPress={() => setAreasFor(showAreas ? null : zone.id)} style={[styles.linkBtn, styles.pointer]}>
                  <ThemedText style={[styles.small, styles.bold, { color: theme.primary }]}>
                    {showAreas ? 'Tutup wilayah' : `Wilayah (${zone.areaCount})`}
                  </ThemedText>
                </Pressable>
                <Pressable onPress={() => setEditing(zone)} style={[styles.linkBtn, styles.pointer]}>
                  <ThemedText style={[styles.small, styles.bold, { color: theme.primary }]}>Ubah</ThemedText>
                </Pressable>
                <Pressable
                  onPress={() => setHistoryFor(showHistory ? null : zone.id)}
                  style={[styles.linkBtn, styles.pointer]}
                >
                  <ThemedText style={[styles.small, styles.bold, { color: theme.primary }]}>
                    {showHistory ? 'Tutup riwayat' : 'Riwayat driver'}
                  </ThemedText>
                </Pressable>
                <View style={styles.flex1} />
                <Pressable
                  onPress={() => handleDelete(zone)}
                  disabled={deleteZone.isPending}
                  style={[styles.linkBtn, styles.pointer, !deletable && styles.dimmed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Hapus ${zone.name}`}
                >
                  <ThemedText style={[styles.small, styles.bold, { color: theme.danger }]}>Hapus</ThemedText>
                </Pressable>
              </View>

              {showAreas ? <ZoneAreasPanel zone={zone} /> : null}

              {showHistory ? (
                <View style={[styles.historyBox, { borderTopColor: theme.border }]}>
                  {history.isLoading ? (
                    <ActivityIndicator size="small" color={theme.primary} />
                  ) : (history.data ?? []).length === 0 ? (
                    <ThemedText style={[styles.tiny, muted]}>Belum pernah ada driver.</ThemedText>
                  ) : (
                    (history.data ?? []).map((h, i) => (
                      <ThemedText key={`${h.driverUserId}-${h.assignedAt}-${i}`} style={[styles.tiny, muted]}>
                        <ThemedText style={[styles.tiny, styles.bold, strong]}>{h.driverName}</ThemedText> ·{' '}
                        {formatWib(h.assignedAt)} – {h.unassignedAt ? formatWib(h.unassignedAt) : 'sekarang'}
                      </ThemedText>
                    ))
                  )}
                </View>
              ) : null}
            </View>
          );
        })
      )}
    </>
  );

  const renderDrivers = () => (
    <>
      <View style={card}>
        <ThemedText style={[styles.small, styles.bold, strong]}>Tambah driver</ThemedText>
        <ThemedText style={[styles.tiny, muted]}>
          Cari akun yang sudah terdaftar (nama, email, atau username), lalu beri peran Driver.
        </ThemedText>
        <TextInput
          value={userQuery}
          onChangeText={setUserQuery}
          placeholder="🔍 Min. 3 huruf"
          placeholderTextColor={theme.textSecondary}
          style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
        />
        {userQuery.trim().length >= 3 ? (
          users.isLoading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (users.data ?? []).length === 0 ? (
            <ThemedText style={[styles.tiny, muted]}>Tidak ada akun yang cocok.</ThemedText>
          ) : (
            (users.data ?? []).map((u) => {
              const busy = setDriverRole.isPending && setDriverRole.variables?.userId === u.userId;
              return (
                <View key={u.userId} style={[styles.listRow, { borderBottomColor: theme.border }]}>
                  <View style={styles.flex1}>
                    <ThemedText style={[styles.small, styles.bold, strong]}>{u.fullName}</ThemedText>
                    <ThemedText style={[styles.tiny, muted]}>
                      {u.email}
                      {u.username ? ` · @${u.username}` : ''}
                    </ThemedText>
                  </View>
                  {u.isDriver ? (
                    <ThemedText style={[styles.tiny, styles.bold, { color: theme.success }]}>✓ Driver</ThemedText>
                  ) : (
                    <Pressable
                      onPress={() =>
                        setDriverRole.mutate({ userId: u.userId, grant: true }, { onError: onError('Gagal Menambah Driver') })
                      }
                      disabled={busy}
                      style={({ pressed }) => [styles.pillBtn, { backgroundColor: theme.primary, opacity: pressed || busy ? 0.7 : 1 }]}
                    >
                      <ThemedText style={[styles.small, styles.bold, { color: '#FFFFFF' }]}>
                        {busy ? 'Memproses…' : 'Jadikan driver'}
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              );
            })
          )
        ) : null}
      </View>

      {drivers.isPending ? (
        <ActivityIndicator style={styles.loader} color={theme.primary} />
      ) : drivers.isError ? (
        <ThemedText style={[styles.small, muted]}>{getApiErrorMessage(drivers.error, 'Gagal memuat driver.')}</ThemedText>
      ) : (
        <View style={card}>
          <ThemedText style={[styles.small, styles.bold, muted]}>{drivers.data.length} driver</ThemedText>
          {drivers.data.length === 0 ? (
            <ThemedText style={[styles.small, muted]}>Belum ada user ber-peran Driver.</ThemedText>
          ) : (
            drivers.data.map((d) => {
              const busy = setDriverRole.isPending && setDriverRole.variables?.userId === d.userId;
              return (
                <View key={d.userId} style={[styles.listRow, { borderBottomColor: theme.border }]}>
                  <View style={styles.flex1}>
                    <ThemedText style={[styles.small, styles.bold, strong]}>🛵 {d.fullName}</ThemedText>
                    <ThemedText style={[styles.tiny, muted]}>
                      {[d.email, d.phoneNumber].filter(Boolean).join(' · ')}
                    </ThemedText>
                    <ThemedText style={[styles.tiny, d.zones.length ? strong : muted]}>
                      {d.zones.length ? `Zona: ${d.zones.join(', ')}` : 'Belum memegang zona'}
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => handleRevoke(d)}
                    disabled={busy}
                    style={({ pressed }) => [styles.pillBtn, styles.outline, { borderColor: theme.danger, opacity: pressed || busy ? 0.7 : 1 }]}
                  >
                    <ThemedText style={[styles.small, styles.bold, { color: theme.danger }]}>Cabut</ThemedText>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>
      )}
    </>
  );

  const refreshing = tab === 'zones' ? zones.isRefetching : drivers.isRefetching;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Zona & Driver" subtitle="Siapa mengantar ke mana" fallbackHref="/admin" />

      <View style={[styles.tabs, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        {(['zones', 'drivers'] as Tab[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.tab, { borderBottomColor: tab === t ? theme.primary : 'transparent' }]}
          >
            <ThemedText style={[styles.small, styles.bold, { color: tab === t ? theme.primary : theme.textSecondary }]}>
              {t === 'zones' ? `🗺️ Zona${zones.data ? ` (${zones.data.length})` : ''}` : `🛵 Driver${drivers.data ? ` (${drivers.data.length})` : ''}`}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => (tab === 'zones' ? zones.refetch() : drivers.refetch())} />
        }
      >
        {tab === 'zones' ? renderZones() : renderDrivers()}
      </ScrollView>

      <SelectModalPicker
        visible={!!driverPickerFor}
        title={driverPickerFor ? `Driver ${driverPickerFor.name}` : 'Pilih driver'}
        placeholder="Cari driver..."
        items={driverItems}
        isLoading={drivers.isLoading}
        selectedValue={driverPickerFor ? driverPickerFor.driverUserId ?? NO_DRIVER : undefined}
        onSelect={handlePickDriver}
        onClose={() => setDriverPickerFor(null)}
      />

      <ZoneFormModal
        zone={editing}
        isSubmitting={saveZone.isPending}
        onCancel={() => setEditing(null)}
        onSubmit={(data) => {
          const id = editing && editing !== 'new' ? editing.id : undefined;
          saveZone.mutate(
            { id, data },
            { onSuccess: () => setEditing(null), onError: onError('Gagal Menyimpan Zona') }
          );
        }}
      />
    </View>
  );
}

interface ZoneFormModalProps {
  zone: DeliveryZone | 'new' | null;
  isSubmitting: boolean;
  onCancel: () => void;
  onSubmit: (data: UpsertZoneRequest) => void;
}

const ZoneFormModal: React.FC<ZoneFormModalProps> = ({ zone, ...rest }) => (
  <Modal visible={!!zone} transparent animationType="fade" onRequestClose={rest.onCancel}>
    {/* Form dipasang ulang tiap dibuka agar isinya selalu dari zona yang dipilih */}
    {zone ? <ZoneForm key={zone === 'new' ? 'new' : zone.id} zone={zone} {...rest} /> : null}
  </Modal>
);

const ZoneForm: React.FC<ZoneFormModalProps & { zone: DeliveryZone | 'new' }> = ({ zone, isSubmitting, onCancel, onSubmit }) => {
  const theme = useTheme();
  const initial = zone === 'new' ? null : zone;
  const [code, setCode] = useState(initial?.code ?? '');
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState('');

  const submit = () => {
    const normalizedCode = code.trim().toUpperCase().replace(/\s+/g, '_');
    if (!/^[A-Z0-9_-]{2,30}$/.test(normalizedCode)) {
      setError('Kode 2–30 karakter: huruf, angka, “_” atau “-”.');
      return;
    }
    if (!name.trim()) {
      setError('Nama zona wajib diisi.');
      return;
    }
    setError('');
    onSubmit({ code: normalizedCode, name: name.trim(), description: description.trim() || null, isActive });
  };

  const inputStyle = [styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }];

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.overlay}>
      <View style={[styles.modalCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <ThemedText style={[styles.title, { color: theme.text }]}>{initial ? 'Ubah Zona' : 'Zona Baru'}</ThemedText>

        <ThemedText style={[styles.tiny, { color: theme.textSecondary }]}>Kode</ThemedText>
        <TextInput
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          placeholder="mis. KOTA_UTARA"
          placeholderTextColor={theme.textSecondary}
          style={inputStyle}
        />
        <ThemedText style={[styles.tiny, { color: theme.textSecondary }]}>Nama</ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="mis. Kota Utara"
          placeholderTextColor={theme.textSecondary}
          style={inputStyle}
        />
        <ThemedText style={[styles.tiny, { color: theme.textSecondary }]}>Keterangan (opsional)</ThemedText>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="mis. Tegalrejo, Jetis, Gondokusuman"
          placeholderTextColor={theme.textSecondary}
          style={[inputStyle, styles.multiline]}
          multiline
        />
        <View style={styles.rowBetween}>
          <View style={styles.flex1}>
            <ThemedText style={[styles.small, styles.bold, { color: theme.text }]}>Aktif</ThemedText>
            <ThemedText style={[styles.tiny, { color: theme.textSecondary }]}>
              Zona nonaktif tidak menugaskan driver; kirimannya masuk antrean.
            </ThemedText>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} />
        </View>

        {error ? <ThemedText style={[styles.small, { color: theme.danger }]}>{error}</ThemedText> : null}

        <View style={styles.modalActions}>
          <Pressable onPress={onCancel} style={[styles.modalBtn, styles.outline, { borderColor: theme.border }]}>
            <ThemedText style={[styles.small, styles.bold, { color: theme.text }]}>Batal</ThemedText>
          </Pressable>
          <Pressable
            onPress={submit}
            disabled={isSubmitting}
            style={[styles.modalBtn, { backgroundColor: theme.primary, opacity: isSubmitting ? 0.7 : 1 }]}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={[styles.small, styles.bold, { color: '#FFFFFF' }]}>Simpan</ThemedText>
            )}
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

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
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  inactive: { opacity: 0.7 },
  addBtn: {
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  addText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  driverBox: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 10 },
  pillBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  outline: { borderWidth: 1 },
  actionsRow: { flexDirection: 'row', gap: 16 },
  linkBtn: { paddingVertical: 2 },
  dimmed: { opacity: 0.45 },
  historyBox: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 8, gap: 4 },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9, fontSize: 15 },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modalCard: { width: '100%', maxWidth: 440, borderRadius: 18, borderWidth: 1, padding: 18, gap: 8 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 6 },
  modalBtn: {
    minWidth: 96,
    minHeight: 40,
    borderRadius: 10,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  title: { fontSize: 16, fontWeight: '700' },
  small: { fontSize: 13 },
  tiny: { fontSize: 11 },
  bold: { fontWeight: '700' },
  flex1: { flex: 1 },
  loader: { marginTop: 30 },
  pointer: Platform.select({ web: { cursor: 'pointer' } }) ?? {},
});

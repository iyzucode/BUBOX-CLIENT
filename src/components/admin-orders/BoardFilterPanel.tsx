import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { AdminFacets, BoardView, FacetOption } from '@/types/adminOrders';

/** Pilihan filter panel kiri (multi pilih). Kosong = semua. */
export interface BoardFilters {
  fulfillment: string[];
  zones: string[];
  drivers: string[];
  outlets: string[];
  categories: string[];
  payments: string[];
  vouchers: string[];
  refunds: string[];
  /** Dari klik rekap dapur. */
  menu: { id: string; name: string } | null;
}

export const EMPTY_FILTERS: BoardFilters = {
  fulfillment: [], zones: [], drivers: [], outlets: [], categories: [], payments: [], vouchers: [], refunds: [], menu: null,
};

export const countActiveFilters = (f: BoardFilters, view: BoardView) =>
  f.fulfillment.length + f.zones.length + (view === 'days' ? f.drivers.length : 0) + f.outlets.length + f.categories.length +
  f.payments.length + f.vouchers.length + f.refunds.length + (f.menu ? 1 : 0);

interface BoardFilterPanelProps {
  view: BoardView;
  facets: AdminFacets | undefined;
  value: BoardFilters;
  onChange: (next: BoardFilters) => void;
}

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

/** Filter bertingkat: metode → zona / driver / outlet, dan kategori menu. Angka = jumlah di periode terpilih. */
export const BoardFilterPanel: React.FC<BoardFilterPanelProps> = ({ view, facets, value, onChange }) => {
  const theme = useTheme();
  const muted = { color: theme.textSecondary };
  const set = (patch: Partial<BoardFilters>) => onChange({ ...value, ...patch });

  const checkRow = (key: string, label: string, count: number | undefined, checked: boolean, onPress: () => void, bold = false) => (
    <Pressable
      key={key}
      onPress={onPress}
      style={({ pressed }) => [styles.checkRow, pressed && { opacity: 0.7 }]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={label}
    >
      <View
        style={[
          styles.box,
          { borderColor: checked ? theme.primary : theme.border, backgroundColor: checked ? theme.primary : 'transparent' },
        ]}
      >
        {checked ? <ThemedText style={styles.tick}>✓</ThemedText> : null}
      </View>
      <ThemedText style={[styles.label, bold && styles.bold, { color: theme.text }]} numberOfLines={1}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.count, muted]}>{count ?? 0}</ThemedText>
    </Pressable>
  );

  const options = (title: string, list: FacetOption[] | undefined, selected: string[], key: keyof BoardFilters) =>
    list && list.length > 0 ? (
      <View style={styles.subGroup}>
        <ThemedText style={[styles.caption, muted]}>{title}</ThemedText>
        {list.map((o) =>
          checkRow(`${key}-${o.id}`, o.label, o.count, selected.includes(o.id), () =>
            set({ [key]: toggle(selected, o.id) } as Partial<BoardFilters>)
          )
        )}
      </View>
    ) : null;

  // Grup filter datar dengan garis pemisah; disembunyikan bila tidak ada opsi di periode ini
  const group = (title: string, list: FacetOption[] | undefined, selected: string[], key: keyof BoardFilters) =>
    list && list.length > 0 ? (
      <>
        <View style={[styles.sep, { backgroundColor: theme.border }]} />
        <ThemedText style={[styles.section, muted]}>{title}</ThemedText>
        {list.map((o) =>
          checkRow(`${key}-${o.id}`, o.label, o.count, selected.includes(o.id), () =>
            set({ [key]: toggle(selected, o.id) } as Partial<BoardFilters>)
          )
        )}
      </>
    ) : null;

  const active = countActiveFilters(value, view);

  return (
    <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.header}>
        <ThemedText style={[styles.title, { color: theme.text }]}>☰ Filter{active > 0 ? ` (${active})` : ''}</ThemedText>
        {active > 0 ? (
          <Pressable
            onPress={() => onChange({ ...EMPTY_FILTERS })}
            style={styles.reset}
            accessibilityRole="button"
            accessibilityLabel="Hapus semua filter"
          >
            <ThemedText style={[styles.resetText, { color: theme.primary }]}>Reset</ThemedText>
          </Pressable>
        ) : null}
      </View>

      <ThemedText style={[styles.section, muted]}>METODE PEMESANAN</ThemedText>
      {checkRow('m-DELIVERY', 'Pesan Antar', facets?.deliveryCount, value.fulfillment.includes('DELIVERY'),
        () => set({ fulfillment: toggle(value.fulfillment, 'DELIVERY') }), true)}
      <View style={[styles.nested, { borderColor: theme.border }]}>
        {options('ZONA PENGANTARAN', facets?.zones, value.zones, 'zones')}
        {/* Driver hanya bermakna per hari kirim: satu pesanan bisa diantar beberapa driver */}
        {view === 'days' ? options('DRIVER', facets?.drivers, value.drivers, 'drivers') : null}
      </View>

      {checkRow('m-PICKUP', 'Ambil Sendiri', facets?.pickupCount, value.fulfillment.includes('PICKUP'),
        () => set({ fulfillment: toggle(value.fulfillment, 'PICKUP') }), true)}
      <View style={[styles.nested, { borderColor: theme.border }]}>
        {options('OUTLET PENGAMBILAN', facets?.outlets, value.outlets, 'outlets')}
      </View>

      <View style={[styles.sep, { backgroundColor: theme.border }]} />
      <ThemedText style={[styles.section, muted]}>KATEGORI MENU</ThemedText>
      {(facets?.categories ?? []).map((c) =>
        checkRow(`c-${c.id}`, c.label, c.count, value.categories.includes(c.id), () => set({ categories: toggle(value.categories, c.id) }))
      )}
      {facets && facets.categories.length === 0 ? <ThemedText style={[styles.small, muted]}>Belum ada menu di periode ini.</ThemedText> : null}

      {group('STATUS BAYAR', facets?.payments, value.payments, 'payments')}
      {group('VOUCHER', facets?.vouchers, value.vouchers, 'vouchers')}
      {group('REFUND MANUAL', facets?.refunds, value.refunds, 'refunds')}

      <View style={[styles.hint, { backgroundColor: theme.backgroundElement }]}>
        <ThemedText style={[styles.small, styles.bold, { color: theme.text }]}>Bisa pilih lebih dari satu.</ThemedText>
        <ThemedText style={[styles.small, muted]}>
          Tanpa pilihan = semua. Memilih zona / driver / outlet otomatis membatasi ke metodenya.
        </ThemedText>
      </View>
    </View>
  );
};

const clickable = Platform.select({ web: { cursor: 'pointer' as const } });

const styles = StyleSheet.create({
  panel: { borderWidth: 1, borderRadius: 14, padding: 14, gap: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  title: { fontSize: 16, fontWeight: '700' },
  reset: { paddingHorizontal: 6, paddingVertical: 2, ...clickable },
  resetText: { fontSize: 13, fontWeight: '700' },
  section: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, marginTop: 6, marginBottom: 2 },
  caption: { fontSize: 9, fontWeight: '700', letterSpacing: 0.4, marginTop: 4 },
  subGroup: { gap: 0 },
  nested: { borderLeftWidth: 1, marginLeft: 8, paddingLeft: 10, marginBottom: 6 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5, ...clickable },
  box: { width: 16, height: 16, borderRadius: 4, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tick: { color: '#FFFFFF', fontSize: 10, lineHeight: 12, fontWeight: '800' },
  label: { flex: 1, fontSize: 13 },
  bold: { fontWeight: '700' },
  count: { fontSize: 12 },
  sep: { height: 1, marginVertical: 8 },
  small: { fontSize: 11, lineHeight: 15 },
  hint: { borderRadius: 10, padding: 10, gap: 2, marginTop: 10 },
});

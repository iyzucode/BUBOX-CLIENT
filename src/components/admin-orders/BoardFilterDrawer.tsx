import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import type { AdminFacets, BoardView, FacetOption } from '@/types/adminOrders';

const clickable = Platform.select({ web: { cursor: 'pointer' as const } }) ?? {};

/** Pilihan filter layar Pesanan (multi pilih). Kosong = semua. */
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

const toggle = (list: string[], id: string) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

interface BoardFilterDrawerProps {
  view: BoardView;
  facets: AdminFacets | undefined;
  value: BoardFilters;
  onApply: (next: BoardFilters) => void;
  onClose: () => void;
}

/**
 * Panel filter (geser dari kanan). Pilihan disimpan sebagai draf dan baru dipakai saat "Terapkan filter",
 * sehingga daftar tidak dimuat ulang setiap kali satu pilihan diklik. Opsi hanya yang muncul di periode terpilih.
 * Hierarki metode: Pesan Antar saja → outlet disembunyikan; Ambil Sendiri saja → zona & driver disembunyikan.
 */
export const BoardFilterDrawer: React.FC<BoardFilterDrawerProps> = ({ view, facets, value, onApply, onClose }) => {
  const theme = useTheme();
  // Komponen dipasang ulang setiap panel dibuka, jadi draf selalu mulai dari filter yang sedang dipakai
  const [draft, setDraft] = useState<BoardFilters>(value);
  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };
  const active = countActiveFilters(draft, view);

  const methods = draft.fulfillment;
  const showDelivery = methods.length === 0 || methods.includes('DELIVERY');
  const showPickup = methods.length === 0 || methods.includes('PICKUP');

  const setMethods = (next: string[]) => {
    const deliveryOn = next.length === 0 || next.includes('DELIVERY');
    const pickupOn = next.length === 0 || next.includes('PICKUP');
    // Pilihan turunan metode yang disembunyikan ikut dikosongkan
    setDraft((d) => ({
      ...d,
      fulfillment: next,
      zones: deliveryOn ? d.zones : [],
      drivers: deliveryOn ? d.drivers : [],
      outlets: pickupOn ? d.outlets : [],
    }));
  };

  const methodCard = (id: 'DELIVERY' | 'PICKUP', label: string) => {
    const checked = methods.includes(id);
    return (
      <Pressable
        onPress={() => setMethods(toggle(methods, id))}
        style={[
          styles.methodCard,
          clickable,
          { borderColor: checked ? theme.primary : theme.border, backgroundColor: checked ? theme.primaryLight : theme.card },
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked }}
        aria-checked={checked}
      >
        <Box checked={checked} />
        <ThemedText style={[styles.body, strong]}>{label}</ThemedText>
      </Pressable>
    );
  };

  const checkList = (options: FacetOption[] | undefined, selected: string[], onChange: (next: string[]) => void) =>
    (options ?? []).map((o) => {
      const checked = selected.includes(o.id);
      return (
        <Pressable
          key={o.id}
          onPress={() => onChange(toggle(selected, o.id))}
          style={[styles.checkRow, clickable]}
          accessibilityRole="checkbox"
          accessibilityState={{ checked }}
          aria-checked={checked}
        >
          <Box checked={checked} />
          <ThemedText style={[styles.body, strong]}>{o.label}</ThemedText>
        </Pressable>
      );
    });

  const hasDelivery = showDelivery && ((facets?.zones.length ?? 0) > 0 || (view === 'days' && (facets?.drivers.length ?? 0) > 0));
  const hasPickup = showPickup && (facets?.outlets.length ?? 0) > 0;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Tutup filter" />
      <View style={[styles.panel, { backgroundColor: theme.card, borderColor: theme.border }]}>
        {/* Judul */}
        <View style={[styles.header, { borderColor: theme.border }]}>
          <View style={styles.flex}>
            <ThemedText style={[styles.title, strong]}>{view === 'days' ? 'Filter pengiriman' : 'Filter pesanan'}</ThemedText>
            <ThemedText style={[styles.small, muted]}>Persempit daftar sesuai kebutuhan.</ThemedText>
            {active > 0 ? (
              <View style={[styles.badge, { backgroundColor: theme.primaryLight }]}>
                <ThemedText style={[styles.tiny, { color: theme.primary }]}>{active} filter aktif</ThemedText>
              </View>
            ) : (
              <ThemedText style={[styles.tiny, muted, styles.badgeGap]}>Belum ada filter aktif</ThemedText>
            )}
          </View>
          <Pressable onPress={onClose} style={[styles.close, clickable, { backgroundColor: theme.backgroundElement }]} accessibilityRole="button" accessibilityLabel="Tutup">
            <ThemedText style={[styles.body, strong]}>✕</ThemedText>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          <Section title="Metode pemesanan">
            <View style={styles.methodRow}>
              {methodCard('DELIVERY', 'Pesan Antar')}
              {methodCard('PICKUP', 'Ambil Sendiri')}
            </View>
          </Section>

          {hasDelivery || hasPickup ? (
            <Section title="Pengantaran & pengambilan">
              {showDelivery && (facets?.zones.length ?? 0) > 0 ? (
                <MultiSelect
                  label="Zona pengantaran"
                  allLabel="Semua zona"
                  unit="zona"
                  options={facets?.zones ?? []}
                  selected={draft.zones}
                  onChange={(zones) => setDraft((d) => ({ ...d, zones }))}
                />
              ) : null}
              {showDelivery && view === 'days' && (facets?.drivers.length ?? 0) > 0 ? (
                <MultiSelect
                  label="Driver"
                  allLabel="Semua driver"
                  unit="driver"
                  options={facets?.drivers ?? []}
                  selected={draft.drivers}
                  onChange={(drivers) => setDraft((d) => ({ ...d, drivers }))}
                />
              ) : null}
              {hasPickup ? (
                <MultiSelect
                  label="Outlet pengambilan"
                  allLabel="Semua outlet"
                  unit="outlet"
                  options={facets?.outlets ?? []}
                  selected={draft.outlets}
                  onChange={(outlets) => setDraft((d) => ({ ...d, outlets }))}
                />
              ) : null}
            </Section>
          ) : null}

          {(facets?.categories.length ?? 0) > 0 ? (
            <Section title="Kategori menu">
              <View style={styles.chips}>
                {facets?.categories.map((c) => {
                  const on = draft.categories.includes(c.id);
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setDraft((d) => ({ ...d, categories: toggle(d.categories, c.id) }))}
                      style={[
                        styles.chip,
                        clickable,
                        { borderColor: on ? theme.primary : theme.border, backgroundColor: on ? theme.primaryLight : theme.card },
                      ]}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      aria-checked={on}
                    >
                      <ThemedText style={[styles.body, { color: on ? theme.primary : theme.text }]}>{c.label}</ThemedText>
                    </Pressable>
                  );
                })}
              </View>
            </Section>
          ) : null}

          {(facets?.payments.length ?? 0) > 0 ? (
            <Section title="Status bayar">
              {checkList(facets?.payments, draft.payments, (payments) => setDraft((d) => ({ ...d, payments })))}
            </Section>
          ) : null}

          {(facets?.refunds.length ?? 0) > 0 ? (
            <Section title="Refund manual">
              {checkList(facets?.refunds, draft.refunds, (refunds) => setDraft((d) => ({ ...d, refunds })))}
            </Section>
          ) : null}

          {(facets?.vouchers.length ?? 0) > 0 ? (
            <Section title="Voucher">
              <MultiSelect
                allLabel="Semua voucher"
                unit="voucher"
                options={facets?.vouchers ?? []}
                selected={draft.vouchers}
                onChange={(vouchers) => setDraft((d) => ({ ...d, vouchers }))}
              />
            </Section>
          ) : null}

          {draft.menu ? (
            <Section title="Menu (dari rekap dapur)">
              <Pressable onPress={() => setDraft((d) => ({ ...d, menu: null }))} style={[styles.checkRow, clickable]} accessibilityRole="checkbox" aria-checked>
                <Box checked />
                <ThemedText style={[styles.body, strong]}>{draft.menu.name}</ThemedText>
              </Pressable>
            </Section>
          ) : null}
        </ScrollView>

        {/* Kaki */}
        <View style={[styles.footer, { borderColor: theme.border }]}>
          <ThemedText style={[styles.small, muted]}>Kosongkan pilihan untuk menampilkan semua.</ThemedText>
          <View style={styles.footerRow}>
            <Pressable
              onPress={() => setDraft({ ...EMPTY_FILTERS })}
              style={[styles.btn, styles.btnReset, clickable, { borderColor: theme.border }]}
              accessibilityRole="button"
            >
              <ThemedText style={[styles.btnText, strong]}>Reset</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => onApply(draft)}
              style={[styles.btn, styles.flex, clickable, { backgroundColor: theme.primary, borderColor: theme.primary }]}
              accessibilityRole="button"
            >
              <ThemedText style={[styles.btnText, { color: '#FFFFFF' }]}>Terapkan filter</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
};

// ==========================================
// Bagian kecil
// ==========================================

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const theme = useTheme();
  return (
    <View style={styles.section}>
      <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>{title}</ThemedText>
      {children}
    </View>
  );
};

const Box: React.FC<{ checked: boolean }> = ({ checked }) => {
  const theme = useTheme();
  return (
    <View style={[styles.box, { borderColor: checked ? theme.primary : theme.border, backgroundColor: checked ? theme.primary : theme.card }]}>
      {checked ? <ThemedText style={styles.tick}>✓</ThemedText> : null}
    </View>
  );
};

/** Dropdown multi pilih: tertutup menampilkan ringkasan pilihan, terbuka menampilkan daftar centang di bawahnya. */
const MultiSelect: React.FC<{
  label?: string;
  allLabel: string;
  unit: string;
  options: FacetOption[];
  selected: string[];
  onChange: (next: string[]) => void;
}> = ({ label, allLabel, unit, options, selected, onChange }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const names = options.filter((o) => selected.includes(o.id)).map((o) => o.label);
  const summary = names.length === 0 ? allLabel : names.length <= 2 ? names.join(', ') : `${names.length} ${unit} dipilih`;
  const on = names.length > 0;

  return (
    <View style={styles.field}>
      {label ? <ThemedText style={[styles.small, { color: theme.textSecondary }]}>{label}</ThemedText> : null}
      <Pressable
        onPress={() => setOpen((v) => !v)}
        style={[styles.select, clickable, { borderColor: on || open ? theme.primary : theme.border, backgroundColor: theme.card }]}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
        accessibilityLabel={label ?? allLabel}
      >
        <ThemedText style={[styles.body, styles.flex, { color: theme.text }]} numberOfLines={1}>{summary}</ThemedText>
        <ThemedText style={[styles.body, { color: theme.textSecondary }]}>{open ? '⌃' : '⌄'}</ThemedText>
      </Pressable>
      {open ? (
        <View style={[styles.options, { borderColor: theme.border, backgroundColor: theme.backgroundElement }]}>
          {options.map((o) => {
            const checked = selected.includes(o.id);
            return (
              <Pressable
                key={o.id}
                onPress={() => onChange(toggle(selected, o.id))}
                style={[styles.checkRow, clickable]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked }}
                aria-checked={checked}
              >
                <Box checked={checked} />
                <ThemedText style={[styles.body, { color: theme.text }]} numberOfLines={1}>{o.label}</ThemedText>
              </Pressable>
            );
          })}
          {selected.length > 0 ? (
            <Pressable onPress={() => onChange([])} style={[styles.clearLink, clickable]} accessibilityRole="button">
              <ThemedText style={[styles.small, { color: theme.primary }]}>Kosongkan ({allLabel.toLowerCase()})</ThemedText>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, flexDirection: 'row', zIndex: 30 },
  backdrop: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.35)' },
  panel: { width: 420, maxWidth: '100%', borderLeftWidth: 1 },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 20, paddingBottom: 14, borderBottomWidth: 1 },
  title: { fontSize: 18, fontWeight: '700' },
  badge: { alignSelf: 'flex-start', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, marginTop: 6 },
  badgeGap: { marginTop: 6 },
  close: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 20, gap: 22 },
  section: { gap: 10 },
  sectionTitle: { fontSize: 14, fontWeight: '700' },
  methodRow: { flexDirection: 'row', gap: 10 },
  methodCard: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 11 },
  field: { gap: 6 },
  select: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  options: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 4 },
  clearLink: { paddingVertical: 6 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6 },
  box: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  tick: { color: '#FFFFFF', fontSize: 11, lineHeight: 13, fontWeight: '800' },
  footer: { borderTopWidth: 1, padding: 16, gap: 10 },
  footerRow: { flexDirection: 'row', gap: 10 },
  btn: { borderWidth: 1, borderRadius: 10, paddingVertical: 11, alignItems: 'center', justifyContent: 'center' },
  btnReset: { width: 110 },
  btnText: { fontSize: 14, fontWeight: '700' },
  body: { fontSize: 14 },
  small: { fontSize: 12 },
  tiny: { fontSize: 11, fontWeight: '600' },
});

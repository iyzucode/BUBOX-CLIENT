import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { addDaysKey, daysBetween } from '@/features/order/adminBoardUtils';
import { toDateKey } from '@/features/order/dateUtils';
import { formatLongDate, formatShortDate } from '@/features/order/orderStatus';
import { useTheme } from '@/hooks/use-theme';
import type { DateBasis } from '@/types/adminOrders';

type Preset = 'TODAY' | 'TOMORROW' | 'WEEK' | 'RANGE';

interface BoardTopBarProps {
  basis: DateBasis;
  onBasisChange: (basis: DateBasis) => void;
  from: string;
  to: string;
  onRangeChange: (from: string, to: string) => void;
}

const MAX_RANGE_DAYS = 93;

/** Acuan tanggal (kirim / pesan), pilihan cepat periode, dan navigasi periode. */
export const BoardTopBar: React.FC<BoardTopBarProps> = ({ basis, onBasisChange, from, to, onRangeChange }) => {
  const theme = useTheme();
  const [rangeOpen, setRangeOpen] = useState(false);
  const today = toDateKey(new Date());
  const length = daysBetween(from, to) + 1;

  const preset: Preset =
    from === today && to === today ? 'TODAY'
    : from === addDaysKey(today, 1) && to === from ? 'TOMORROW'
    : from === today && to === addDaysKey(today, 6) ? 'WEEK'
    : 'RANGE';

  const presets: { id: Preset; label: string; onPress: () => void }[] = [
    { id: 'TODAY', label: 'Hari ini', onPress: () => onRangeChange(today, today) },
    { id: 'TOMORROW', label: 'Besok', onPress: () => onRangeChange(addDaysKey(today, 1), addDaysKey(today, 1)) },
    { id: 'WEEK', label: '7 hari', onPress: () => onRangeChange(today, addDaysKey(today, 6)) },
    { id: 'RANGE', label: 'Rentang…', onPress: () => setRangeOpen(true) },
  ];

  // Geser periode sepanjang panjang periode saat ini (1 hari / 7 hari / rentang)
  const shift = (dir: 1 | -1) => onRangeChange(addDaysKey(from, dir * length), addDaysKey(to, dir * length));
  const label = from === to ? formatLongDate(from) : `${formatShortDate(from)} – ${formatShortDate(to)} · ${length} hari`;

  const seg = (active: boolean) => [
    styles.segBtn,
    { backgroundColor: active ? theme.primaryLight : 'transparent', borderColor: active ? theme.primary : theme.border },
  ];

  return (
    <View style={[styles.bar, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.group}>
        <ThemedText style={[styles.caption, { color: theme.textSecondary }]}>TANGGAL ACUAN</ThemedText>
        <View style={styles.row}>
          {(['DELIVERY', 'CREATED'] as const).map((b) => (
            <Pressable key={b} onPress={() => onBasisChange(b)} style={seg(basis === b)} accessibilityRole="button">
              <ThemedText style={[styles.segText, { color: basis === b ? theme.primary : theme.text }]}>
                {b === 'DELIVERY' ? 'Tanggal kirim' : 'Tanggal pesan'}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: theme.border }]} />

      <View style={[styles.group, styles.flex]}>
        <ThemedText style={[styles.caption, { color: theme.textSecondary }]}>
          {basis === 'DELIVERY' ? 'PERIODE PENGIRIMAN' : 'PERIODE PEMESANAN'}
        </ThemedText>
        <View style={styles.row}>
          {presets.map((p) => (
            <Pressable key={p.id} onPress={p.onPress} style={seg(preset === p.id)} accessibilityRole="button">
              <ThemedText style={[styles.segText, { color: preset === p.id ? theme.primary : theme.text }]}>{p.label}</ThemedText>
            </Pressable>
          ))}
          <View style={[styles.nav, { borderColor: theme.border }]}>
            <Pressable onPress={() => shift(-1)} style={styles.navBtn} accessibilityLabel="Periode sebelumnya">
              <ThemedText style={{ color: theme.text }}>‹</ThemedText>
            </Pressable>
            <ThemedText style={[styles.navLabel, { color: theme.text }]} numberOfLines={1}>
              📅 {label}
            </ThemedText>
            <Pressable onPress={() => shift(1)} style={styles.navBtn} accessibilityLabel="Periode berikutnya">
              <ThemedText style={{ color: theme.text }}>›</ThemedText>
            </Pressable>
          </View>
        </View>
      </View>

      <RangeModal
        visible={rangeOpen}
        from={from}
        to={to}
        onClose={() => setRangeOpen(false)}
        onApply={(f, t) => {
          onRangeChange(f, t);
          setRangeOpen(false);
        }}
      />
    </View>
  );
};

/** Input tanggal: <input type="date"> di web (admin selalu web), teks yyyy-mm-dd di aplikasi. */
const DateField: React.FC<{ value: string; onChange: (v: string) => void; label: string }> = ({ value, onChange, label }) => {
  const theme = useTheme();
  const style = { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement };
  return (
    <View style={styles.dateField}>
      <ThemedText style={[styles.caption, { color: theme.textSecondary }]}>{label}</ThemedText>
      {Platform.OS === 'web' ? (
        React.createElement('input', {
          type: 'date',
          value,
          onChange: (e: { target: { value: string } }) => onChange(e.target.value),
          'aria-label': label,
          style: {
            ...style,
            borderWidth: 1,
            borderStyle: 'solid',
            borderRadius: 10,
            padding: '8px 10px',
            fontSize: 14,
            fontFamily: 'inherit',
          },
        })
      ) : (
        <TextInput value={value} onChangeText={onChange} placeholder="yyyy-mm-dd" style={[styles.textInput, style]} />
      )}
    </View>
  );
};

const RangeModal: React.FC<{
  visible: boolean;
  from: string;
  to: string;
  onClose: () => void;
  onApply: (from: string, to: string) => void;
}> = ({ visible, from, to, onClose, onApply }) => {
  const theme = useTheme();
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const valid = /^\d{4}-\d{2}-\d{2}$/.test(draftFrom) && /^\d{4}-\d{2}-\d{2}$/.test(draftTo);
  const span = valid ? daysBetween(draftFrom, draftTo) + 1 : 0;
  const error = !valid ? 'Isi kedua tanggal.' : span < 1 ? 'Tanggal akhir sebelum tanggal awal.' : span > MAX_RANGE_DAYS ? `Maksimal ${MAX_RANGE_DAYS} hari.` : null;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose} onShow={() => { setDraftFrom(from); setDraftTo(to); }}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={[styles.modal, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => {}}>
          <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Pilih rentang tanggal</ThemedText>
          <View style={styles.row}>
            <DateField label="DARI" value={draftFrom} onChange={setDraftFrom} />
            <DateField label="SAMPAI" value={draftTo} onChange={setDraftTo} />
          </View>
          <ThemedText style={[styles.small, { color: error ? theme.danger : theme.textSecondary }]}>
            {error ?? `${span} hari`}
          </ThemedText>
          <View style={styles.row}>
            <Pressable onPress={onClose} style={[styles.modalBtn, { backgroundColor: theme.backgroundElement }]}>
              <ThemedText style={[styles.segText, { color: theme.text }]}>Batal</ThemedText>
            </Pressable>
            <Pressable
              onPress={() => !error && onApply(draftFrom, draftTo)}
              disabled={!!error}
              style={[styles.modalBtn, { backgroundColor: theme.primary, opacity: error ? 0.5 : 1 }]}
            >
              <ThemedText style={[styles.segText, { color: '#FFFFFF' }]}>Terapkan</ThemedText>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const clickable = Platform.select({ web: { cursor: 'pointer' as const } });

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'stretch', gap: 16, borderWidth: 1, borderRadius: 14, padding: 14 },
  group: { gap: 6 },
  flex: { flex: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  divider: { width: 1 },
  caption: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  segBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, ...clickable },
  segText: { fontSize: 13, fontWeight: '600' },
  nav: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, marginLeft: 4 },
  navBtn: { paddingHorizontal: 10, paddingVertical: 6, ...clickable },
  navLabel: { fontSize: 13, fontWeight: '600', minWidth: 200, textAlign: 'center' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', maxWidth: 420, borderWidth: 1, borderRadius: 16, padding: 18, gap: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  dateField: { flex: 1, gap: 4 },
  textInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  small: { fontSize: 12 },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', ...clickable },
});

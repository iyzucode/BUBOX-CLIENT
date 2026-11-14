import React, { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { MenuButton } from '@/components/admin-orders/MenuButton';
import { ThemedText } from '@/components/themed-text';
import { addDaysKey, daysBetween } from '@/features/order/adminBoardUtils';
import { toDateKey } from '@/features/order/dateUtils';
import { formatDateRange, formatShortDate } from '@/features/order/orderStatus';
import { useTheme } from '@/hooks/use-theme';
import type { DateBasis } from '@/types/adminOrders';

interface BoardTopBarProps {
  basis: DateBasis;
  onBasisChange: (basis: DateBasis) => void;
  from: string;
  to: string;
  onRangeChange: (from: string, to: string) => void;
}

const MAX_RANGE_DAYS = 93;

/** Kontrol periode di header: acuan tanggal (dropdown) + periode (pilihan cepat di menu, tombol geser ‹ ›). */
export const BoardTopBar: React.FC<BoardTopBarProps> = ({ basis, onBasisChange, from, to, onRangeChange }) => {
  const theme = useTheme();
  const [rangeOpen, setRangeOpen] = useState(false);
  const today = toDateKey(new Date());
  const tomorrow = addDaysKey(today, 1);
  const length = daysBetween(from, to) + 1;

  // Geser periode sepanjang panjang periode saat ini (1 hari / 7 hari / rentang)
  const shift = (dir: 1 | -1) => onRangeChange(addDaysKey(from, dir * length), addDaysKey(to, dir * length));
  const label = from === to ? formatShortDate(from) : formatDateRange(from, to);
  const hint = from === to ? (from === today ? 'Hari ini' : from === tomorrow ? 'Besok' : '1 hari') : `${length} hari`;
  const box = [styles.box, { backgroundColor: theme.card, borderColor: theme.border }];

  return (
    <View style={styles.row}>
      <MenuButton
        style={[box, styles.basisBox]}
        accessibilityLabel="Acuan tanggal"
        items={(['DELIVERY', 'CREATED'] as const).map((b) => ({
          key: b,
          label: b === 'DELIVERY' ? 'Tanggal kirim' : 'Tanggal pesan',
          selected: basis === b,
          onPress: () => onBasisChange(b),
        }))}
      >
        <ThemedText style={[styles.text, styles.flex, { color: theme.text }]}>{basis === 'DELIVERY' ? 'Tanggal kirim' : 'Tanggal pesan'}</ThemedText>
        <ThemedText style={[styles.chevron, { color: theme.textSecondary }]}>⌄</ThemedText>
      </MenuButton>

      <View style={[box, styles.periodBox]}>
        <MenuButton
          style={styles.periodBtn}
          accessibilityLabel="Pilih periode"
          menuWidth={200}
          items={[
            { key: 'today', label: 'Hari ini', selected: from === today && to === today, onPress: () => onRangeChange(today, today) },
            { key: 'tomorrow', label: 'Besok', selected: from === tomorrow && to === tomorrow, onPress: () => onRangeChange(tomorrow, tomorrow) },
            { key: 'week', label: '7 hari ke depan', selected: from === today && to === addDaysKey(today, 6), onPress: () => onRangeChange(today, addDaysKey(today, 6)) },
            { key: 'range', label: 'Pilih rentang…', onPress: () => setRangeOpen(true) },
          ]}
        >
          <ThemedText style={[styles.icon, { color: theme.textSecondary }]}>📅</ThemedText>
          <ThemedText style={[styles.text, styles.bold, { color: theme.text }]} numberOfLines={1}>{label}</ThemedText>
          <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>{hint}</ThemedText>
        </MenuButton>
        <Pressable onPress={() => shift(-1)} style={[styles.navBtn, clickable]} accessibilityRole="button" accessibilityLabel="Periode sebelumnya">
          <ThemedText style={[styles.nav, { color: theme.text }]}>‹</ThemedText>
        </Pressable>
        <Pressable onPress={() => shift(1)} style={[styles.navBtn, clickable]} accessibilityRole="button" accessibilityLabel="Periode berikutnya">
          <ThemedText style={[styles.nav, { color: theme.text }]}>›</ThemedText>
        </Pressable>
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

const clickable = Platform.select({ web: { cursor: 'pointer' as const } }) ?? {};

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  flex: { flex: 1 },
  box: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: 10, minHeight: 40 },
  basisBox: { width: 170, paddingHorizontal: 12, gap: 6 },
  periodBox: { paddingLeft: 4, paddingRight: 4 },
  periodBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8, paddingVertical: 8, minWidth: 220 },
  icon: { fontSize: 13 },
  text: { fontSize: 13 },
  bold: { fontWeight: '600' },
  hint: { fontSize: 12, marginLeft: 'auto', paddingLeft: 16 },
  chevron: { fontSize: 14, marginTop: -6 },
  navBtn: { paddingHorizontal: 9, paddingVertical: 6, borderRadius: 8 },
  nav: { fontSize: 16 },
  caption: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modal: { width: '100%', maxWidth: 420, borderWidth: 1, borderRadius: 16, padding: 18, gap: 12 },
  modalTitle: { fontSize: 16, fontWeight: '700' },
  dateField: { flex: 1, gap: 4 },
  textInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  small: { fontSize: 12 },
  segText: { fontSize: 13, fontWeight: '600' },
  modalBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center', ...clickable },
});

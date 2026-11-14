import React, { useEffect, useRef, useState } from 'react';
import {
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));

/** Tinggi satu baris roda & jumlah baris yang terlihat (ganjil, baris tengah = terpilih). */
const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;
const WHEEL_HEIGHT = ITEM_HEIGHT * VISIBLE_ROWS;
const WHEEL_PADDING = ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2);
/** Jeda setelah gulir berhenti sebelum roda dikunci ke baris terdekat (web tidak punya momentum end). */
const SETTLE_DELAY_MS = 120;

interface TimePickerFieldProps {
  /** "HH:mm" atau null bila belum dipilih. */
  value: string | null;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Judul pop-up, mis. "Jam mulai ambil". */
  title: string;
}

/**
 * Kolom pemilih jam: ketuk untuk membuka pop-up berisi roda gulir jam (00–23) dan menit (00–59).
 * Sama di web, Android, dan iOS.
 */
export const TimePickerField: React.FC<TimePickerFieldProps> = ({ value, onChange, placeholder = 'Pilih jam', title }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const [hourIndex, setHourIndex] = useState(6);
  const [minuteIndex, setMinuteIndex] = useState(0);

  const openPicker = () => {
    const [h, m] = (value ?? '').split(':');
    setHourIndex(HOURS.includes(h) ? HOURS.indexOf(h) : 6);
    setMinuteIndex(MINUTES.includes(m) ? MINUTES.indexOf(m) : 0);
    setOpen(true);
  };

  const confirm = () => {
    onChange(`${HOURS[hourIndex]}:${MINUTES[minuteIndex]}`);
    setOpen(false);
  };

  return (
    <>
      <Pressable
        onPress={openPicker}
        style={({ pressed }) => [
          styles.field,
          { borderColor: theme.border, backgroundColor: theme.backgroundElement, opacity: pressed ? 0.85 : 1 },
        ]}
        accessibilityRole="button"
        accessibilityLabel={`${title}: ${value ?? 'belum dipilih'}`}
      >
        <ThemedText style={[styles.fieldText, { color: value ? theme.text : theme.textSecondary }]}>
          {value ? value.replace(':', '.') : placeholder}
        </ThemedText>
        <ThemedText style={{ color: theme.textSecondary }}>🕒</ThemedText>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.overlay} onPress={() => setOpen(false)}>
          {/* Pressable dalam: klik di kartu tidak menutup pop-up */}
          <Pressable style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]} onPress={() => {}}>
            <ThemedText style={[styles.title, { color: theme.text }]}>{title}</ThemedText>

            <View style={[styles.wheels, { backgroundColor: theme.backgroundElement }]}>
              {/* Pita baris terpilih di tengah */}
              <View
                pointerEvents="none"
                style={[styles.band, { borderColor: theme.border, backgroundColor: theme.card }]}
              />
              <WheelColumn values={HOURS} selectedIndex={hourIndex} onChange={setHourIndex} label="Jam" />
              <ThemedText style={[styles.colon, { color: theme.text }]}>:</ThemedText>
              <WheelColumn values={MINUTES} selectedIndex={minuteIndex} onChange={setMinuteIndex} label="Menit" />
            </View>

            <View style={styles.actions}>
              <Pressable
                onPress={() => setOpen(false)}
                style={[styles.actionBtn, { backgroundColor: theme.backgroundElement }]}
                accessibilityRole="button"
              >
                <ThemedText style={[styles.actionText, { color: theme.text }]}>Batal</ThemedText>
              </Pressable>
              <Pressable
                onPress={confirm}
                style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                accessibilityRole="button"
              >
                <ThemedText style={[styles.actionText, { color: '#FFFFFF' }]}>Pilih</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
};

interface WheelColumnProps {
  values: string[];
  selectedIndex: number;
  onChange: (index: number) => void;
  /** Label aksesibilitas, mis. "Jam". */
  label: string;
}

/** Satu roda gulir: digulir (mouse/sentuh) atau diketuk, lalu terkunci ke baris terdekat di tengah. */
const WheelColumn: React.FC<WheelColumnProps> = ({ values, selectedIndex, onChange, label }) => {
  const theme = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [offset, setOffset] = useState(selectedIndex * ITEM_HEIGHT);

  const clampIndex = (i: number) => Math.max(0, Math.min(values.length - 1, i));

  // Posisi awal saat roda dibuka (tanpa animasi)
  useEffect(() => {
    const id = setTimeout(() => scrollRef.current?.scrollTo({ y: selectedIndex * ITEM_HEIGHT, animated: false }), 0);
    return () => clearTimeout(id);
    // Hanya saat dibuka; perubahan berikutnya berasal dari roda ini sendiri
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => () => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
  }, []);

  /**
   * Posisi gulir terkini. Di web dibaca langsung dari elemen: event onScroll di-throttle sehingga
   * posisi akhir bisa terlewat dan roda terkunci ke angka yang salah.
   */
  const currentY = (fallback: number) => {
    const node = (scrollRef.current as unknown as { getScrollableNode?: () => { scrollTop?: number } } | null)
      ?.getScrollableNode?.();
    return typeof node?.scrollTop === 'number' ? node.scrollTop : fallback;
  };

  const settle = (eventY: number) => {
    const y = currentY(eventY);
    const index = clampIndex(Math.round(y / ITEM_HEIGHT));
    if (Math.abs(y - index * ITEM_HEIGHT) > 1) {
      scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: true });
    }
    setOffset(index * ITEM_HEIGHT);
    onChange(index);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const y = e.nativeEvent.contentOffset.y;
    setOffset(y);
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => settle(y), SETTLE_DELAY_MS);
  };

  // Ketuk angka: langsung pindah (tanpa animasi) agar tidak ada posisi antara yang ikut terkunci
  const selectIndex = (index: number) => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    scrollRef.current?.scrollTo({ y: index * ITEM_HEIGHT, animated: false });
    setOffset(index * ITEM_HEIGHT);
    onChange(index);
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.column}
      contentContainerStyle={{ paddingVertical: WHEEL_PADDING }}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      onScroll={handleScroll}
      onMomentumScrollEnd={(e) => settle(e.nativeEvent.contentOffset.y)}
      scrollEventThrottle={16}
      accessibilityLabel={`${label}: ${values[selectedIndex]}`}
    >
      {values.map((v, i) => {
        // Makin jauh dari tengah makin pudar & kecil, seperti roda
        const distance = Math.min(Math.abs(i * ITEM_HEIGHT - offset) / ITEM_HEIGHT, 3);
        return (
          <Pressable
            key={v}
            onPress={() => selectIndex(i)}
            style={styles.item}
            accessibilityRole="button"
            accessibilityLabel={`${label} ${v}`}
          >
            <ThemedText
              style={[
                styles.itemText,
                {
                  color: distance < 0.5 ? theme.text : theme.textSecondary,
                  opacity: Math.max(0.2, 1 - distance * 0.35),
                  transform: [{ scale: Math.max(0.75, 1 - distance * 0.1) }],
                },
              ]}
            >
              {v}
            </ThemedText>
          </Pressable>
        );
      })}
    </ScrollView>
  );
};

const clickable = Platform.select({ web: { cursor: 'pointer' as const } });

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 11,
    ...clickable,
  },
  fieldText: { fontSize: 16 },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: { width: '100%', maxWidth: 340, borderRadius: 20, borderWidth: 1, padding: 18, gap: 14 },
  title: { fontSize: 16, fontWeight: '700' },
  wheels: {
    height: WHEEL_HEIGHT,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  band: {
    position: 'absolute',
    left: 10,
    right: 10,
    top: WHEEL_PADDING,
    height: ITEM_HEIGHT,
    borderRadius: 10,
    borderWidth: 1,
  },
  column: { width: 80, height: WHEEL_HEIGHT, flexGrow: 0 },
  colon: { fontSize: 26, fontWeight: '600', marginHorizontal: 8 },
  item: { height: ITEM_HEIGHT, alignItems: 'center', justifyContent: 'center', ...clickable },
  itemText: { fontSize: 26, fontWeight: '600', lineHeight: 32 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', ...clickable },
  actionText: { fontSize: 14, fontWeight: '700' },
});

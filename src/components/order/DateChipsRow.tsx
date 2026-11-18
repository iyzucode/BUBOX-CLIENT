import React, { useEffect, useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useOrderPalette } from './orderPalette';

export interface TrackedDay {
  key: string;
  /** Mis. "Sen, 16 Nov". */
  label: string;
  /** Mis. "Senin, 16 November 2026". */
  fullLabel: string;
  portions: number;
}

interface DateChipsRowProps {
  days: TrackedDay[];
  onSelectDay: (key: string) => void;
  /** Bila diisi, deretan chip bergeser agar hari ini selalu terlihat (dipakai saat menempel di atas layar). */
  followKey?: string | null;
}

// Ukuran chip tetap, sehingga posisi chip yang diikuti bisa dihitung tanpa mengukur
const CHIP_WIDTH = 100;
const CHIP_GAP = 8;
export const DATE_CHIP_HEIGHT = 32;

/** Posisi gulir agar chip ke-index berada di tengah deretan. */
const followOffset = (index: number, viewport: number) =>
  Math.max(0, index * (CHIP_WIDTH + CHIP_GAP) - (viewport - CHIP_WIDTH) / 2);

/** Deretan "N hari" + chip tanggal. Oranye tua = hari sudah ada menunya. Ketuk chip untuk melompat ke harinya. */
export const DateChipsRow: React.FC<DateChipsRowProps> = ({ days, onSelectDay, followKey }) => {
  const palette = useOrderPalette();
  const listRef = useRef<ScrollView>(null);
  const viewportWidth = useRef(0);
  const followIndex = followKey ? days.findIndex((d) => d.key === followKey) : -1;

  useEffect(() => {
    if (followIndex < 0) return;
    listRef.current?.scrollTo({ x: followOffset(followIndex, viewportWidth.current), animated: true });
  }, [followIndex]);

  return (
    <View style={styles.row}>
      <View style={styles.summary}>
        <ThemedText style={[styles.summaryText, { color: palette.summaryChipText }]}>{days.length} hari</ThemedText>
      </View>

      <ScrollView
        ref={listRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
        style={styles.list}
        onLayout={(e) => {
          viewportWidth.current = e.nativeEvent.layout.width;
          if (followIndex >= 0) listRef.current?.scrollTo({ x: followOffset(followIndex, viewportWidth.current), animated: false });
        }}
      >
        {days.map((day) => {
          const filled = day.portions > 0;
          return (
            <Pressable
              key={day.key}
              onPress={() => onSelectDay(day.key)}
              style={({ pressed }) => [
                styles.chip,
                { backgroundColor: filled ? palette.dateChipFilledBg : palette.dateChipBg },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${day.fullLabel}, ${filled ? `${day.portions} porsi` : 'belum ada menu'}`}
            >
              <ThemedText
                style={[styles.chipText, { color: filled ? palette.dateChipFilledText : palette.dateChipText }]}
                numberOfLines={1}
              >
                {day.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summary: {
    flexShrink: 0,
    paddingVertical: 6,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  list: {
    flex: 1,
  },
  chips: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: CHIP_GAP,
    paddingRight: 6,
  },
  chip: {
    width: CHIP_WIDTH,
    height: DATE_CHIP_HEIGHT,
    paddingHorizontal: 6,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.8,
  },
});

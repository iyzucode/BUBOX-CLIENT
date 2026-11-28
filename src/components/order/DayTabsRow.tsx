import React, { useEffect, useRef } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { TrackedDay } from './DateChipsRow';
import { DayListIcon } from './DayListIcon';
import { useOrderPalette } from './orderPalette';

interface DayTabsRowProps {
  days: TrackedDay[];
  /** Hari yang sedang ditampilkan menunya. */
  activeKey: string | null;
  onSelectDay: (key: string) => void;
  /** Ketuk ringkasan "N hari": membuka daftar semua tanggal. */
  onPressSummary?: () => void;
}

// Lebar tab tetap, sehingga posisi tab aktif bisa dihitung tanpa mengukur
const TAB_WIDTH = 108;
export const DAY_TABS_HEIGHT = 44;

/** Posisi gulir agar tab ke-index berada di tengah deretan. */
const centerOffset = (index: number, viewport: number) => Math.max(0, index * TAB_WIDTH - (viewport - TAB_WIDTH) / 2);

/**
 * Tab hari di layar order: "N hari" + satu tab per tanggal. Tab aktif bergaris bawah & tebal;
 * hari yang sudah berisi menu bertulisan oranye. Deretan bergeser agar tab aktif selalu terlihat.
 */
export const DayTabsRow: React.FC<DayTabsRowProps> = ({ days, activeKey, onSelectDay, onPressSummary }) => {
  const palette = useOrderPalette();
  const listRef = useRef<ScrollView>(null);
  const viewportWidth = useRef(0);
  const activeIndex = activeKey ? days.findIndex((d) => d.key === activeKey) : -1;

  useEffect(() => {
    if (activeIndex < 0) return;
    listRef.current?.scrollTo({ x: centerOffset(activeIndex, viewportWidth.current), animated: true });
  }, [activeIndex]);

  return (
    <View style={[styles.row, { borderBottomColor: palette.dashedDivider }]}>
      <Pressable
        onPress={onPressSummary}
        disabled={!onPressSummary}
        style={({ pressed }) => [styles.summary, { backgroundColor: palette.buttonBg }, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`${days.length} hari dipilih, buka daftar tanggal`}
      >
        <DayListIcon open={false} color={palette.summaryChipText} />
        <ThemedText style={[styles.summaryText, { color: palette.summaryChipText }]}>{days.length} hari</ThemedText>
      </Pressable>

      <ScrollView
        ref={listRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.list}
        onLayout={(e) => {
          viewportWidth.current = e.nativeEvent.layout.width;
          if (activeIndex >= 0) {
            listRef.current?.scrollTo({ x: centerOffset(activeIndex, viewportWidth.current), animated: false });
          }
        }}
      >
        {days.map((day) => {
          const active = day.key === activeKey;
          const filled = day.portions > 0;
          return (
            <Pressable
              key={day.key}
              onPress={() => onSelectDay(day.key)}
              style={({ pressed }) => [styles.tab, pressed && styles.pressed]}
              accessibilityRole="tab"
              aria-selected={active}
              accessibilityLabel={`${day.fullLabel}, ${filled ? `${day.portions} porsi` : 'belum ada menu'}`}
            >
              <ThemedText
                style={[
                  styles.tabText,
                  // Oranye = hari sudah berisi menu
                  { color: filled ? palette.dateChipFilledBg : active ? palette.dayMenuText : palette.dayMenuSubtext },
                  active && styles.tabTextActive,
                ]}
                numberOfLines={1}
              >
                {day.label}
              </ThemedText>
              <View style={[styles.underline, active && { backgroundColor: palette.buttonActiveBg }]} />
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
    alignItems: 'stretch',
    height: DAY_TABS_HEIGHT,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  // Blok penuh setinggi deretan tab, menempel di tepi kiri (tanpa jarak & sudut membulat)
  summary: {
    flexShrink: 0,
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  list: {
    flex: 1,
  },
  tab: {
    width: TAB_WIDTH,
    height: DAY_TABS_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    paddingHorizontal: 6,
  },
  tabTextActive: {
    fontWeight: '700',
  },
  underline: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 0,
    height: 3,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  pressed: {
    opacity: 0.75,
  },
});

import React from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { TrackedDay } from './DateChipsRow';
import { DayListIcon } from './DayListIcon';
import { DAY_TABS_HEIGHT } from './DayTabsRow';
import { useOrderPalette } from './orderPalette';

const formatRupiah = (value: number) => `Rp ${Number(value).toLocaleString('id-ID')}`;

interface DayListPanelProps {
  days: TrackedDay[];
  /** Subtotal menu per tanggal (key = tanggal). */
  subtotals: Record<string, number>;
  activeKey: string | null;
  onSelectDay: (key: string) => void;
  onClose: () => void;
}

/** Daftar semua tanggal pesanan (dibuka dari "N hari"): tanggal lengkap, subtotal hari itu, ketuk untuk pindah hari. */
export const DayListPanel: React.FC<DayListPanelProps> = ({ days, subtotals, activeKey, onSelectDay, onClose }) => {
  const palette = useOrderPalette();

  return (
    <View style={{ backgroundColor: palette.cardBg }}>
      <Pressable
        onPress={onClose}
        style={({ pressed }) => [styles.header, { backgroundColor: palette.buttonBg }, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel="Tutup daftar tanggal"
      >
        <ThemedText style={[styles.headerText, { color: palette.summaryChipText }]}>{days.length} hari</ThemedText>
        <DayListIcon open color={palette.summaryChipText} />
      </Pressable>

      <ScrollView style={styles.list} bounces={false}>
        {days.map((day) => {
          const active = day.key === activeKey;
          const filled = day.portions > 0;
          return (
            <Pressable
              key={day.key}
              onPress={() => onSelectDay(day.key)}
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: palette.dashedDivider },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              aria-selected={active}
              accessibilityLabel={`${day.fullLabel}, ${filled ? formatRupiah(subtotals[day.key] ?? 0) : 'belum ada pesanan'}`}
            >
              {/* Penanda hari yang sudah ada pesanannya: garis oranye di tepi kiri, sama seperti di daftar menu */}
              {filled ? <View style={[styles.filledMarker, { backgroundColor: palette.buttonActiveBg }]} /> : null}
              <ThemedText
                style={[styles.dateText, { color: palette.dayMenuText }]}
                numberOfLines={1}
              >
                {day.fullLabel}
              </ThemedText>
              {filled ? (
                <ThemedText style={[styles.subtotal, { color: palette.dayMenuText }]}>
                  {formatRupiah(subtotals[day.key] ?? 0)}
                </ThemedText>
              ) : (
                // Tanggal selalu utuh; di layar sempit teks ini yang turun ke baris kedua
                <ThemedText style={[styles.emptyText, { color: palette.dayMenuSubtext }]} numberOfLines={2}>
                  Kamu belum pesan hari ini
                </ThemedText>
              )}
              <View style={[styles.chevron, { backgroundColor: palette.buttonBg }]}>
                <ThemedText style={[styles.chevronText, { color: palette.summaryChipText }]}>›</ThemedText>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const WEB_POINTER = Platform.select({ web: { cursor: 'pointer' as const } });

const styles = StyleSheet.create({
  header: {
    height: DAY_TABS_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    ...WEB_POINTER,
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    maxHeight: 420,
  },
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    ...WEB_POINTER,
  },
  filledMarker: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
  },
  dateText: {
    flexShrink: 0,
    fontSize: 12.5,
    fontWeight: '500',
  },
  subtotal: {
    flex: 1,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    flex: 1,
    minWidth: 0,
    textAlign: 'right',
    fontSize: 10,
    lineHeight: 13,
  },
  chevron: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevronText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 20,
    marginLeft: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});

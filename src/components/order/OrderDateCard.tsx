import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { DateEntry } from '@/features/order/useOrderCart';
import { useOrderPalette } from './orderPalette';

interface OrderDateCardProps {
  orderDates: DateEntry[];
  onOpenCalendar: () => void;
}

export const OrderDateCard: React.FC<OrderDateCardProps> = ({
  orderDates,
  onOpenCalendar,
}) => {
  const palette = useOrderPalette();

  return (
    <View style={[styles.card, { backgroundColor: palette.cardBg }]}>
      {/* Header Row: Calendar Icon Box + Title */}
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: palette.iconBoxBg }]}>
          {Platform.OS === 'web' ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={palette.iconColor}
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
              {/* Calendar internal grid dots/lines */}
              <line x1="8" y1="14" x2="8.01" y2="14" strokeWidth="2.8" />
              <line x1="12" y1="14" x2="12.01" y2="14" strokeWidth="2.8" />
              <line x1="16" y1="14" x2="16.01" y2="14" strokeWidth="2.8" />
              <line x1="8" y1="18" x2="8.01" y2="18" strokeWidth="2.8" />
              <line x1="12" y1="18" x2="12.01" y2="18" strokeWidth="2.8" />
              <line x1="16" y1="18" x2="16.01" y2="18" strokeWidth="2.8" />
            </svg>
          ) : (
            <ThemedText style={{ fontSize: 16 }}>📅</ThemedText>
          )}
        </View>

        <ThemedText style={[styles.title, { color: palette.cardTitle }]}>
          Tanggal pemesanan
        </ThemedText>
      </View>

      {/* Date Chips Row: Sticky Summary (N hari) + horizontal scrollable list of dates */}
      <View style={styles.chipsRowContainer}>
        {/* Sticky Summary Chip on the left: "N hari" */}
        <View style={styles.summaryChipSticky}>
          <ThemedText style={[styles.summaryChipText, { color: palette.summaryChipText }]}>
            {orderDates.length > 0 ? `${orderDates.length} hari` : '0 hari'}
          </ThemedText>
        </View>

        {/* Date Chips: "Sen, 18 Okt", etc. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsScrollContent}
          style={styles.chipsScrollView}
        >
          {orderDates.map((entry) => (
            <View
              key={entry.key}
              style={[styles.dateChip, { backgroundColor: palette.dateChipBg }]}
            >
              <ThemedText style={[styles.dateChipText, { color: palette.dateChipText }]}>
                {entry.formattedChip}
              </ThemedText>
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Action Button: "Pilih tanggal" */}
      <Pressable
        onPress={onOpenCalendar}
        style={({ pressed }) => [
          styles.actionBtn,
          { backgroundColor: palette.buttonBg },
          pressed && styles.pressed,
        ]}
        accessibilityRole="button"
        accessibilityLabel="Buka kalender pilih tanggal"
      >
        <ThemedText style={[styles.actionBtnText, { color: palette.buttonText }]}>
          Pilih tanggal
        </ThemedText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  chipsRowContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryChipSticky: {
    flexShrink: 0,
    paddingVertical: 6,
    paddingHorizontal: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryChipText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  chipsScrollView: {
    flex: 1,
  },
  chipsScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingRight: 6,
  },
  dateChip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionBtn: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});

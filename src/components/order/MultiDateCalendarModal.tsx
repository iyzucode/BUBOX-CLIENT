import React, { useMemo, useState } from 'react';
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  formatIndonesianDate,
  INDONESIAN_MONTH_NAMES,
  toDateKey,
} from '@/features/order/dateUtils';
import { useOrderPalette } from './orderPalette';

interface MultiDateCalendarModalProps {
  visible: boolean;
  selectedDateKeys: string[];
  onClose: () => void;
  onSaveDates: (newKeys: string[]) => void;
}

const CALENDAR_HEADERS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export const MultiDateCalendarModal: React.FC<MultiDateCalendarModalProps> = ({
  visible,
  selectedDateKeys,
  onClose,
  onSaveDates,
}) => {
  const palette = useOrderPalette();

  // Temporary selection state while modal is open
  const [tempKeys, setTempKeys] = useState<string[]>([]);
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());

  // Synchronize initial state when modal opens
  React.useEffect(() => {
    if (visible) {
      setTempKeys([...selectedDateKeys]);
      if (selectedDateKeys.length > 0) {
        // Center calendar on first selected date or today
        const first = new Date(selectedDateKeys[0]);
        if (!isNaN(first.getTime())) {
          setCurrentMonthDate(new Date(first.getFullYear(), first.getMonth(), 1));
          return;
        }
      }
      const now = new Date();
      setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
    }
  }, [visible, selectedDateKeys]);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCurrentMonthDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonthDate(new Date(year, month + 1, 1));
  };

  const handleToggleDate = (key: string) => {
    if (tempKeys.includes(key)) {
      setTempKeys(tempKeys.filter((k) => k !== key));
    } else {
      setTempKeys([...tempKeys, key].sort());
    }
  };

  const handleQuickPreset = (count: number) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newKeys: string[] = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      newKeys.push(toDateKey(d));
    }
    setTempKeys(newKeys);
  };

  const handleSave = () => {
    onSaveDates(tempKeys);
    onClose();
  };

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: palette.cardBg }]}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <ThemedText style={[styles.modalTitle, { color: palette.cardTitle }]}>
                Pilih Tanggal Katering
              </ThemedText>
              <ThemedText style={[styles.modalSubtitle, { color: palette.dayMenuSubtext }]}>
                Pilih satu atau beberapa hari katering Anda
              </ThemedText>
            </View>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                { backgroundColor: palette.iconBoxBg },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Tutup modal"
              hitSlop={8}
            >
              <ThemedText style={[styles.closeIcon, { color: palette.iconColor }]}>✕</ThemedText>
            </Pressable>
          </View>

          {/* Preset Buttons for Quick Selection: +7 Hari, +30 Hari, Hapus Semua */}
          <View style={styles.presetRow}>
            <Pressable
              onPress={() => handleQuickPreset(7)}
              style={({ pressed }) => [
                styles.presetBtn,
                { backgroundColor: palette.buttonBg },
                pressed && styles.pressed,
              ]}
            >
              <ThemedText style={[styles.presetBtnText, { color: palette.buttonText }]}>
                +7 Hari
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => handleQuickPreset(30)}
              style={({ pressed }) => [
                styles.presetBtn,
                { backgroundColor: palette.buttonBg },
                pressed && styles.pressed,
              ]}
            >
              <ThemedText style={[styles.presetBtnText, { color: palette.buttonText }]}>
                +30 Hari
              </ThemedText>
            </Pressable>
            <Pressable
              onPress={() => setTempKeys([])}
              style={({ pressed }) => [
                styles.presetBtn,
                { backgroundColor: palette.buttonBg },
                pressed && styles.pressed,
              ]}
            >
              <ThemedText style={[styles.presetBtnText, { color: palette.buttonText }]}>
                Hapus Semua
              </ThemedText>
            </Pressable>
          </View>

          {/* Month Navigation */}
          <View style={styles.monthNavRow}>
            <Pressable
              onPress={handlePrevMonth}
              style={({ pressed }) => [
                styles.navArrowBtn,
                { backgroundColor: palette.buttonBg },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Bulan sebelumnya"
            >
              <ThemedText style={[styles.navArrowText, { color: palette.buttonText }]}>‹</ThemedText>
            </Pressable>

            <ThemedText style={[styles.monthLabel, { color: palette.cardTitle }]}>
              {INDONESIAN_MONTH_NAMES[month]} {year}
            </ThemedText>

            <Pressable
              onPress={handleNextMonth}
              style={({ pressed }) => [
                styles.navArrowBtn,
                { backgroundColor: palette.buttonBg },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Bulan berikutnya"
            >
              <ThemedText style={[styles.navArrowText, { color: palette.buttonText }]}>›</ThemedText>
            </Pressable>
          </View>

          {/* Calendar Headers (Min, Sen, ...) */}
          <View style={styles.daysHeaderRow}>
            {CALENDAR_HEADERS.map((h, i) => (
              <View key={h} style={styles.dayHeaderCell}>
                <ThemedText
                  style={[
                    styles.dayHeaderText,
                    { color: i === 0 ? '#EF4444' : palette.dayMenuSubtext },
                  ]}
                >
                  {h}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Calendar Grid */}
          <View style={styles.grid}>
            {/* Empty offset slots */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <View key={`empty-${i}`} style={styles.dateCell} />
            ))}

            {/* Days 1 to N */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const cellDate = new Date(year, month, dayNum);
              cellDate.setHours(0, 0, 0, 0);
              const key = toDateKey(cellDate);
              const isPast = cellDate < today;
              const isSelected = tempKeys.includes(key);

              return (
                <View key={key} style={styles.dateCell}>
                  <Pressable
                    onPress={() => !isPast && handleToggleDate(key)}
                    disabled={isPast}
                    style={({ pressed }) => [
                      styles.dateTile,
                      {
                        backgroundColor: isSelected
                          ? palette.buttonActiveBg
                          : isPast
                          ? 'transparent'
                          : palette.dayBodyBg,
                        borderColor: isSelected
                          ? palette.buttonActiveBg
                          : palette.dashedDivider,
                        opacity: isPast ? 0.35 : 1,
                      },
                      pressed && !isPast && styles.pressed,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.dateNumText,
                        {
                          color: isSelected
                            ? palette.buttonActiveText
                            : isPast
                            ? palette.dayMenuSubtext
                            : palette.dayMenuText,
                          fontWeight: isSelected ? '800' : '600',
                        },
                      ]}
                    >
                      {dayNum}
                    </ThemedText>
                  </Pressable>
                </View>
              );
            })}
          </View>

          {/* Footer & Actions */}
          <View style={[styles.footer, { borderTopColor: palette.dashedDivider }]}>
            <View style={styles.selectionInfo}>
              <ThemedText style={[styles.selectionCount, { color: palette.cardTitle }]}>
                {tempKeys.length} Hari Terpilih
              </ThemedText>
              <ThemedText style={[styles.selectionHint, { color: palette.dayMenuSubtext }]}>
                {tempKeys.length === 0
                  ? 'Pilih minimal 1 hari'
                  : 'Siap untuk pemesanan'}
              </ThemedText>
            </View>

            <View style={styles.footerButtons}>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.cancelBtn,
                  { backgroundColor: palette.buttonBg },
                  pressed && styles.pressed,
                ]}
              >
                <ThemedText style={[styles.cancelBtnText, { color: palette.buttonText }]}>
                  Batal
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={handleSave}
                disabled={tempKeys.length === 0}
                style={({ pressed }) => [
                  styles.saveBtn,
                  {
                    backgroundColor:
                      tempKeys.length > 0
                        ? palette.buttonActiveBg
                        : palette.checkoutBtnDisabledBg,
                  },
                  pressed && tempKeys.length > 0 && styles.pressed,
                ]}
              >
                <ThemedText
                  style={[
                    styles.saveBtnText,
                    {
                      color:
                        tempKeys.length > 0
                          ? palette.buttonActiveText
                          : palette.checkoutBtnDisabledText,
                    },
                  ]}
                >
                  Terapkan
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 20,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
    cursor: 'pointer' as any,
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: '800',
  },
  presetRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 14,
  },
  presetBtn: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  presetBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navArrowBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  navArrowText: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  monthLabel: {
    fontSize: 15,
    fontWeight: '800',
  },
  daysHeaderRow: {
    flexDirection: 'row',
    marginBottom: 6,
  },
  dayHeaderCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  dayHeaderText: {
    fontSize: 11,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    padding: 3,
  },
  dateTile: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  dateNumText: {
    fontSize: 13,
  },
  footer: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectionInfo: {
    flex: 1,
  },
  selectionCount: {
    fontSize: 14,
    fontWeight: '800',
  },
  selectionHint: {
    fontSize: 11,
  },
  footerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  cancelBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  saveBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.96 }],
  },
});

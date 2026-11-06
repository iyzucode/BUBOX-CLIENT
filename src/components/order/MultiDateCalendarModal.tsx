import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useThemeContext } from '@/context/ThemeContext';
import {
  INDONESIAN_MONTH_NAMES,
  parseDateKey,
  toDateKey,
} from '@/features/order/dateUtils';

const SCREEN_HEIGHT = Dimensions.get('window').height || 750;

interface MultiDateCalendarModalProps {
  visible: boolean;
  selectedDateKeys: string[];
  onClose: () => void;
  onSaveDates: (newKeys: string[]) => void;
  /** Tanggal kirim paling awal yang boleh dipilih (dari cutoff server), format yyyy-MM-dd. */
  minDateKey?: string;
  /** Tanggal kirim paling akhir yang boleh dipilih, format yyyy-MM-dd. */
  maxDateKey?: string;
}

const WEEKDAY_HEADERS = ['M', 'S', 'S', 'R', 'K', 'J', 'S'];

interface CalendarCell {
  date: Date;
  dateKey: string;
  dayNum: number;
  isCurrentMonth: boolean;
  isPast: boolean;
  isToday: boolean;
}

// Color theme tokens supporting light and dark modes
const getCalendarTheme = (isDark: boolean) => ({
  modalOverlayBg: isDark ? 'rgba(0, 0, 0, 0.75)' : 'rgba(15, 23, 42, 0.65)',
  modalCardBg: isDark ? '#18181B' : '#FFF7F5',
  modalCardBorder: isDark ? '#27272A' : 'transparent',

  navCircleBg: isDark ? '#27272A' : '#FFFFFF',
  navCircleBorder: isDark ? '#3F3F46' : '#F2DCD5',
  navChevron: isDark ? '#F4F4F5' : '#113366',

  headerSubtitle: isDark ? '#A1A1AA' : '#EE4D2D',
  headerMainTitle: isDark ? '#F4F4F5' : '#113366',

  calendarCardBg: isDark ? '#0A0A0A' : '#FFFFFF',
  calendarCardBorder: isDark ? '#27272A' : '#F2DCD5',

  weekdayText: isDark ? '#71717A' : '#5A6B86',

  dateTextNormal: isDark ? '#F4F4F5' : '#113366',
  dateTextPast: isDark ? '#3F3F46' : '#D7C7C2',
  dateTextOtherMonth: isDark ? '#3F3F46' : '#D7C7C2',

  todayRingBorder: '#EE4D2D',
  todayBg: isDark ? '#0A0A0A' : '#FFFFFF',
  todayText: isDark ? '#FF8A70' : '#EE4D2D',

  selectedTileBg: '#EE4D2D',
  selectedTileText: '#FFFFFF',
  checkBadgeBg: '#113366',
  checkBadgeBorder: isDark ? '#0A0A0A' : '#FFFFFF',
  checkBadgeIcon: '#FFFFFF',

  quickSelectTitle: isDark ? '#A1A1AA' : '#5A6B86',
  quickPillBg: isDark ? '#2E1610' : '#FDE8E3',
  quickPillBorder: '#EE4D2D',
  quickPillText: isDark ? '#FF8A70' : '#D0011B',

  clearBtnBg: '#D0011B',
  clearBtnText: '#FFFFFF',

  footerDivider: isDark ? '#27272A' : '#F2DCD5',
  cancelBtnBg: isDark ? '#27272A' : '#FFFFFF',
  cancelBtnBorder: isDark ? '#3F3F46' : '#F2DCD5',
  cancelBtnText: isDark ? '#F4F4F5' : '#113366',

  confirmBtnDisabledBg: isDark ? '#27272A' : '#F2DCD5',
  confirmBtnDisabledText: isDark ? '#71717A' : '#B48F86',
  confirmBtnActiveBg: '#EE4D2D',
  confirmBtnActiveText: '#FFFFFF',
});

export const MultiDateCalendarModal: React.FC<MultiDateCalendarModalProps> = ({
  visible,
  selectedDateKeys,
  onClose,
  onSaveDates,
  minDateKey,
  maxDateKey,
}) => {
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const colors = useMemo(() => getCalendarTheme(isDark), [isDark]);

  // Bottom Sheet animation states
  const [modalVisible, setModalVisible] = useState(visible);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const isClosingRef = useRef(false);

  // Temporary selection state while modal is open
  const [tempKeys, setTempKeys] = useState<string[]>([]);
  const [currentMonthDate, setCurrentMonthDate] = useState<Date>(() => new Date());

  // Synchronize initial state and trigger slide up/down animation
  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      setModalVisible(true);
      setTempKeys([...selectedDateKeys]);
      if (selectedDateKeys.length > 0) {
        // Center calendar on first selected date or today
        const first = new Date(selectedDateKeys[0]);
        if (!isNaN(first.getTime())) {
          setCurrentMonthDate(new Date(first.getFullYear(), first.getMonth(), 1));
        } else {
          const now = new Date();
          setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
        }
      } else {
        const now = new Date();
        setCurrentMonthDate(new Date(now.getFullYear(), now.getMonth(), 1));
      }

      translateY.setValue(SCREEN_HEIGHT);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else if (modalVisible && !isClosingRef.current) {
      isClosingRef.current = true;
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        isClosingRef.current = false;
        setModalVisible(false);
      });
    }
  }, [visible, selectedDateKeys]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      isClosingRef.current = false;
      setModalVisible(false);
      onClose();
    });
  };

  const today = useMemo(() => {
    const t = new Date();
    t.setHours(0, 0, 0, 0);
    return t;
  }, []);

  // Batas pilih tanggal dari cutoff server; tanpa info server, minimal hari ini
  const minDate = useMemo(() => {
    const fromServer = minDateKey ? parseDateKey(minDateKey) : null;
    return fromServer && fromServer.getTime() > today.getTime() ? fromServer : today;
  }, [minDateKey, today]);

  const maxDate = useMemo(() => (maxDateKey ? parseDateKey(maxDateKey) : null), [maxDateKey]);

  const year = currentMonthDate.getFullYear();
  const month = currentMonthDate.getMonth();

  // Horizontal Slide / Swipe Animation states
  const slideAnim = useRef(new Animated.Value(0)).current;
  const isTransitioningRef = useRef(false);

  const calendarOpacity = useMemo(() => {
    return slideAnim.interpolate({
      inputRange: [-150, 0, 150],
      outputRange: [0.65, 1, 0.65],
      extrapolate: 'clamp',
    });
  }, [slideAnim]);

  // Directional month transition
  const changeMonth = (delta: number) => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    const exitTo = delta > 0 ? -120 : 120;
    const enterFrom = delta > 0 ? 120 : -120;

    Animated.timing(slideAnim, {
      toValue: exitTo,
      duration: 120,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
      slideAnim.setValue(enterFrom);
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 150,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        isTransitioningRef.current = false;
      });
    });
  };

  // Navigation handlers
  const handlePrevMonth = () => {
    changeMonth(-1);
  };

  const handleNextMonth = () => {
    changeMonth(1);
  };

  // PanResponder to enable horizontal swipe/slide left and right across the calendar
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onStartShouldSetPanResponderCapture: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          return (
            Math.abs(gestureState.dx) > 10 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2
          );
        },
        onMoveShouldSetPanResponderCapture: (_, gestureState) => {
          return (
            Math.abs(gestureState.dx) > 10 &&
            Math.abs(gestureState.dx) > Math.abs(gestureState.dy) * 1.2
          );
        },
        onPanResponderGrant: () => {
          slideAnim.stopAnimation();
        },
        onPanResponderMove: (_, gestureState) => {
          slideAnim.setValue(gestureState.dx);
        },
        onPanResponderRelease: (_, gestureState) => {
          const threshold = 35;
          const velocity = gestureState.vx;

          if (gestureState.dx < -threshold || velocity < -0.2) {
            // Swiped left -> Next month
            changeMonth(1);
          } else if (gestureState.dx > threshold || velocity > 0.2) {
            // Swiped right -> Previous month
            changeMonth(-1);
          } else {
            // Did not cross threshold: spring back to 0
            Animated.spring(slideAnim, {
              toValue: 0,
              bounciness: 4,
              useNativeDriver: Platform.OS !== 'web',
            }).start();
          }
        },
        onPanResponderTerminate: () => {
          Animated.spring(slideAnim, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: Platform.OS !== 'web',
          }).start();
        },
      }),
    [slideAnim]
  );

  // Toggle selection for a specific date
  const handleToggleDate = (key: string) => {
    if (tempKeys.includes(key)) {
      setTempKeys(tempKeys.filter((k) => k !== key));
    } else {
      setTempKeys([...tempKeys, key].sort());
    }
  };

  // Quick Preset (+7 hari / +30 hari)
  const handleQuickPreset = (count: number) => {
    const start = new Date(minDate);
    const newKeys: string[] = [];
    for (let i = 0; i < count; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      if (maxDate && d.getTime() > maxDate.getTime()) break;
      newKeys.push(toDateKey(d));
    }
    setTempKeys(newKeys.sort());
  };

  // Clear all selections
  const handleClearAll = () => {
    setTempKeys([]);
  };

  // Confirm selection
  const handleSave = () => {
    if (tempKeys.length === 0) return;
    onSaveDates(tempKeys);
    handleClose();
  };

  // Generate 42 cells (6 rows x 7 days) with trailing and leading days
  const calendarCells = useMemo<CalendarCell[]>(() => {
    const cells: CalendarCell[] = [];

    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 is Sunday
    const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    // 1. Trailing days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const dayNum = daysInPrevMonth - i;
      const cellDate = new Date(year, month - 1, dayNum);
      cellDate.setHours(0, 0, 0, 0);
      const isPast = cellDate.getTime() < minDate.getTime() || (maxDate !== null && cellDate.getTime() > maxDate.getTime());
      const isToday = cellDate.getTime() === today.getTime();
      cells.push({
        date: cellDate,
        dateKey: toDateKey(cellDate),
        dayNum,
        isCurrentMonth: false,
        isPast,
        isToday,
      });
    }

    // 2. Days in current month
    for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) {
      const cellDate = new Date(year, month, dayNum);
      cellDate.setHours(0, 0, 0, 0);
      const isPast = cellDate.getTime() < minDate.getTime() || (maxDate !== null && cellDate.getTime() > maxDate.getTime());
      const isToday = cellDate.getTime() === today.getTime();
      cells.push({
        date: cellDate,
        dateKey: toDateKey(cellDate),
        dayNum,
        isCurrentMonth: true,
        isPast,
        isToday,
      });
    }

    // 3. Leading days from next month (fill up to 42 cells = 6 weeks)
    const remainingCells = 42 - cells.length;
    for (let dayNum = 1; dayNum <= remainingCells; dayNum++) {
      const cellDate = new Date(year, month + 1, dayNum);
      cellDate.setHours(0, 0, 0, 0);
      const isPast = cellDate.getTime() < minDate.getTime() || (maxDate !== null && cellDate.getTime() > maxDate.getTime());
      const isToday = cellDate.getTime() === today.getTime();
      cells.push({
        date: cellDate,
        dateKey: toDateKey(cellDate),
        dayNum,
        isCurrentMonth: false,
        isPast,
        isToday,
      });
    }

    return cells;
  }, [year, month, today, minDate, maxDate]);

  const hasSelections = tempKeys.length > 0;

  if (!modalVisible && !visible) return null;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlayBg }]}>
        {/* Backdrop tap to dismiss */}
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Tutup pemilihan tanggal"
        />

        <Animated.View
          style={[
            styles.bottomSheetCard,
            {
              backgroundColor: colors.modalCardBg,
              borderColor: colors.modalCardBorder,
              borderWidth: isDark ? 1 : 0,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* Drag Handle Indicator */}
          <Pressable
            onPress={handleClose}
            style={styles.dragHandleContainer}
            accessibilityRole="button"
            accessibilityLabel="Tutup pemilihan tanggal"
            hitSlop={8}
          >
            <View
              style={[
                styles.dragHandle,
                { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.2)' },
              ]}
            />
          </Pressable>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={[
              styles.cardContent,
              { paddingBottom: Math.max(insets.bottom, 24) },
            ]}
          >
            {/* 1. Month Header with Circular Navigation Buttons */}
            <View style={styles.headerRow}>
              <Pressable
                onPress={handlePrevMonth}
                style={({ pressed }) => [
                  styles.navCircleBtn,
                  {
                    backgroundColor: colors.navCircleBg,
                    borderColor: colors.navCircleBorder,
                  },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Bulan sebelumnya"
              >
                {Platform.OS === 'web' ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={colors.navChevron}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="15 18 9 12 15 6" />
                  </svg>
                ) : (
                  <ThemedText style={[styles.navChevron, { color: colors.navChevron }]}>
                    ‹
                  </ThemedText>
                )}
              </Pressable>

              <View style={styles.headerTitleBox}>
                <ThemedText
                  style={[styles.headerSubtitle, { color: colors.headerSubtitle }]}
                >
                  PILIH TANGGAL
                </ThemedText>
                <ThemedText
                  style={[styles.headerMainTitle, { color: colors.headerMainTitle }]}
                >
                  {INDONESIAN_MONTH_NAMES[month]} {year}
                </ThemedText>
              </View>

              <Pressable
                onPress={handleNextMonth}
                style={({ pressed }) => [
                  styles.navCircleBtn,
                  {
                    backgroundColor: colors.navCircleBg,
                    borderColor: colors.navCircleBorder,
                  },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Bulan berikutnya"
              >
                {Platform.OS === 'web' ? (
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={colors.navChevron}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                ) : (
                  <ThemedText style={[styles.navChevron, { color: colors.navChevron }]}>
                    ›
                  </ThemedText>
                )}
              </Pressable>
            </View>

            {/* 2. Swipeable Calendar Grid Card Container */}
            <Animated.View
              {...panResponder.panHandlers}
              style={[
                styles.calendarSwipeWrapper,
                {
                  transform: [{ translateX: slideAnim }],
                  opacity: calendarOpacity,
                },
              ]}
            >
              <View
                style={[
                  styles.calendarCard,
                  {
                    backgroundColor: colors.calendarCardBg,
                    borderColor: colors.calendarCardBorder,
                  },
                ]}
              >
              {/* Weekday Row (M, S, S, R, K, J, S) */}
              <View style={styles.weekdayRow}>
                {WEEKDAY_HEADERS.map((h, i) => (
                  <View key={`header-${i}`} style={styles.weekdayCell}>
                    <ThemedText
                      style={[styles.weekdayText, { color: colors.weekdayText }]}
                    >
                      {h}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {/* 42 Calendar Cells (6 rows x 7 columns) */}
              <View style={styles.grid}>
                {calendarCells.map((cell) => {
                  const isSelected = tempKeys.includes(cell.dateKey);
                  const isSelectable = !cell.isPast;

                  return (
                    <View key={cell.dateKey} style={styles.dateCell}>
                      <Pressable
                        onPress={() => isSelectable && handleToggleDate(cell.dateKey)}
                        disabled={!isSelectable}
                        style={({ pressed }) => [
                          styles.dateTile,
                          isSelected && [
                            styles.dateTileSelected,
                            { backgroundColor: colors.selectedTileBg },
                          ],
                          cell.isToday &&
                            !isSelected && [
                              styles.dateTileToday,
                              {
                                backgroundColor: colors.todayBg,
                                borderColor: colors.todayRingBorder,
                              },
                            ],
                          pressed && isSelectable && styles.pressed,
                        ]}
                      >
                        <ThemedText
                          style={[
                            styles.dateNumText,
                            { color: colors.dateTextNormal },
                            isSelected && {
                              color: colors.selectedTileText,
                              fontWeight: '500',
                            },
                            cell.isToday &&
                              !isSelected && {
                                color: colors.todayText,
                                fontWeight: '500',
                              },
                            cell.isPast && {
                              color: colors.dateTextPast,
                              fontWeight: '400',
                            },
                            !cell.isCurrentMonth &&
                              !isSelected &&
                              !cell.isPast && {
                                color: colors.dateTextOtherMonth,
                                fontWeight: '400',
                              },
                          ]}
                        >
                          {cell.dayNum}
                        </ThemedText>

                        {/* Top-Right Amber Badge with Checkmark */}
                        {isSelected && (
                          <View
                            style={[
                              styles.checkBadge,
                              {
                                backgroundColor: colors.checkBadgeBg,
                                borderColor: colors.checkBadgeBorder,
                              },
                            ]}
                          >
                            {Platform.OS === 'web' ? (
                              <svg
                                width="8"
                                height="8"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke={colors.checkBadgeIcon}
                                strokeWidth="3.6"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <ThemedText
                                style={[
                                  styles.checkBadgeText,
                                  { color: colors.checkBadgeIcon },
                                ]}
                              >
                                ✓
                              </ThemedText>
                            )}
                          </View>
                        )}
                      </Pressable>
                    </View>
                  );
                })}
              </View>
            </View>
          </Animated.View>

            {/* 3. Quick Select Section */}
            <View style={styles.quickSelectSection}>
              <ThemedText
                style={[styles.quickSelectTitle, { color: colors.quickSelectTitle }]}
              >
                PILIHAN CEPAT
              </ThemedText>

              {/* Row with +7 hari and +30 hari */}
              <View style={styles.quickSelectRow}>
                <Pressable
                  onPress={() => handleQuickPreset(7)}
                  style={({ pressed }) => [
                    styles.quickPillBtn,
                    {
                      backgroundColor: colors.quickPillBg,
                      borderColor: colors.quickPillBorder,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText
                    style={[styles.quickPillBtnText, { color: colors.quickPillText }]}
                  >
                    +7 hari
                  </ThemedText>
                </Pressable>

                <Pressable
                  onPress={() => handleQuickPreset(30)}
                  style={({ pressed }) => [
                    styles.quickPillBtn,
                    {
                      backgroundColor: colors.quickPillBg,
                      borderColor: colors.quickPillBorder,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText
                    style={[styles.quickPillBtnText, { color: colors.quickPillText }]}
                  >
                    +30 hari
                  </ThemedText>
                </Pressable>

                {/* Hapus semua tanggal terpilih (ikon tong sampah) */}
                <Pressable
                  onPress={handleClearAll}
                  accessibilityRole="button"
                  accessibilityLabel="Hapus semua tanggal terpilih"
                  style={({ pressed }) => [
                    styles.clearBtn,
                    { backgroundColor: colors.clearBtnBg },
                    pressed && styles.pressed,
                  ]}
                >
                  {Platform.OS === 'web' ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={colors.clearBtnText}
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden
                    >
                      <path d="M3 6h18" />
                      <path d="M8 6V4.5A1.5 1.5 0 0 1 9.5 3h5A1.5 1.5 0 0 1 16 4.5V6" />
                      <path d="M5.5 6l1 13.5A1.5 1.5 0 0 0 8 21h8a1.5 1.5 0 0 0 1.5-1.5L18.5 6" />
                      <path d="M10 10.5v6M14 10.5v6" />
                    </svg>
                  ) : (
                    <ThemedText style={[styles.clearBtnIconText, { color: colors.clearBtnText }]}>
                      🗑
                    </ThemedText>
                  )}
                </Pressable>
              </View>
            </View>

            {/* 4. Bottom Action Buttons: Batal (1) : Terapkan (3) */}
            <View
              style={[
                styles.footerSection,
                { borderTopColor: colors.footerDivider },
              ]}
            >
              <View style={styles.footerRow}>
                {/* Tombol Batal (Flex 1) */}
                <Pressable
                  onPress={handleClose}
                  style={({ pressed }) => [
                    styles.cancelBtn,
                    {
                      backgroundColor: colors.cancelBtnBg,
                      borderColor: colors.cancelBtnBorder,
                    },
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Batalkan pemilihan tanggal"
                >
                  <ThemedText
                    style={[
                      styles.cancelBtnText,
                      { color: colors.cancelBtnText },
                    ]}
                  >
                    Batal
                  </ThemedText>
                </Pressable>

                {/* Tombol Terapkan (Flex 3) */}
                <Pressable
                  onPress={handleSave}
                  disabled={!hasSelections}
                  style={({ pressed }) => [
                    styles.confirmBtn,
                    {
                      backgroundColor: hasSelections
                        ? colors.confirmBtnActiveBg
                        : colors.confirmBtnDisabledBg,
                    },
                    hasSelections && pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Terapkan tanggal terpilih"
                >
                  <ThemedText
                    style={[
                      styles.confirmBtnText,
                      {
                        color: hasSelections
                          ? colors.confirmBtnActiveText
                          : colors.confirmBtnDisabledText,
                      },
                    ]}
                  >
                    Terapkan
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bottomSheetCard: {
    width: '100%',
    maxWidth: 768,
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -6 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
      web: {
        boxShadow: '0 -6px 35px rgba(0, 0, 0, 0.35)',
      } as any,
    }),
  },
  dragHandleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 6,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  dragHandle: {
    width: 52,
    height: 5,
    borderRadius: 2.5,
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navCircleBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.06)',
      } as any,
    }),
  },
  navChevron: {
    fontSize: 22,
    fontWeight: '400',
    lineHeight: 24,
  },
  headerTitleBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerMainTitle: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  calendarSwipeWrapper: {
    width: '100%',
  },
  calendarCard: {
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingTop: 16,
    paddingBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.04)',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        touchAction: 'pan-y',
        cursor: 'grab',
      } as any,
    }),
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '500',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateCell: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 2,
  },
  dateTile: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    ...Platform.select({
      web: {
        cursor: 'pointer',
      } as any,
    }),
  },
  dateTileToday: {
    borderWidth: 2,
  },
  dateTileSelected: {},
  dateNumText: {
    fontSize: 14,
    fontWeight: '400',
  },
  checkBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 15,
    height: 15,
    borderRadius: 7.5,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  checkBadgeText: {
    fontSize: 9,
    fontWeight: '500',
    lineHeight: 10,
  },
  quickSelectSection: {
    marginTop: 18,
  },
  quickSelectTitle: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 1,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  quickSelectRow: {
    flexDirection: 'row',
    gap: 10,
  },
  quickPillBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  quickPillBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  clearBtn: {
    width: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  clearBtnIconText: {
    fontSize: 18,
    lineHeight: 22,
  },
  footerSection: {
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  cancelBtnText: {
    fontSize: 14,
    letterSpacing: -0.2,
    fontWeight: '500',
  },
  confirmBtn: {
    flex: 3,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  confirmBtnText: {
    fontSize: 14,
    letterSpacing: -0.2,
    fontWeight: '500', // Bold as requested
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

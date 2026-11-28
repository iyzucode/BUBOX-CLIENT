import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  GestureResponderEvent,
  Modal,
  PanResponder,
  PanResponderGestureState,
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
  /** Tanggal yang sudah berisi menu: hanya tanggal terpilih yang ada di sini diberi tanda centang. */
  filledDateKeys?: string[];
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

/** 42 sel (6 minggu × 7 hari) untuk satu bulan, termasuk sisa hari bulan sebelum & sesudahnya. */
function buildMonthCells(year: number, month: number, minDate: Date, maxDate: Date | null, today: Date): CalendarCell[] {
  const cells: CalendarCell[] = [];
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Minggu
  const daysInCurrentMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const push = (cellDate: Date, dayNum: number, isCurrentMonth: boolean) => {
    cellDate.setHours(0, 0, 0, 0);
    cells.push({
      date: cellDate,
      dateKey: toDateKey(cellDate),
      dayNum,
      isCurrentMonth,
      isPast: cellDate.getTime() < minDate.getTime() || (maxDate !== null && cellDate.getTime() > maxDate.getTime()),
      isToday: cellDate.getTime() === today.getTime(),
    });
  };

  for (let i = firstDayOfWeek - 1; i >= 0; i--) push(new Date(year, month - 1, daysInPrevMonth - i), daysInPrevMonth - i, false);
  for (let dayNum = 1; dayNum <= daysInCurrentMonth; dayNum++) push(new Date(year, month, dayNum), dayNum, true);
  const remainingCells = 42 - cells.length;
  for (let dayNum = 1; dayNum <= remainingCells; dayNum++) push(new Date(year, month + 1, dayNum), dayNum, false);
  return cells;
}

/** Jarak antarkartu bulan saat digeser. */
const MONTH_PAGE_GAP = 12;

/**
 * Geser bulan seperti slider gambar: kartu bulan sebelum & sesudah berada tepat di samping kartu aktif dan ikut
 * tergeser mengikuti jari. Dilepas melewati batas (atau dikibas) → meluncur ke bulan sebelah, selain itu kembali.
 * Status gesture disimpan di luar state React agar handler PanResponder selalu membaca nilai terbaru.
 */
class MonthCarouselController {
  readonly dragX = new Animated.Value(0);
  private pageWidth = 0;
  private busy = false;
  private readonly onCommit: (delta: number) => void;

  constructor(onCommit: (delta: number) => void) {
    this.onCommit = onCommit;
  }

  setPageWidth(width: number) {
    this.pageWidth = width;
  }

  /** Luncurkan ke bulan sebelah (delta -1 / +1), lalu ganti bulan. */
  go(delta: number) {
    if (this.busy) return;
    if (this.pageWidth <= 0) {
      this.onCommit(delta);
      return;
    }
    this.busy = true;
    Animated.timing(this.dragX, {
      toValue: -delta * (this.pageWidth + MONTH_PAGE_GAP),
      duration: 240,
      easing: Easing.out(Easing.cubic),
      // JS driver: posisi harus bisa dikembalikan ke tengah pada frame yang sama dengan pergantian bulan
      useNativeDriver: false,
    }).start(() => this.onCommit(delta));
  }

  /** Dipanggil setelah bulan berganti (sebelum layar digambar): kartu tengah kini bulan baru. */
  settle() {
    this.dragX.setValue(0);
    this.busy = false;
  }

  private springBack() {
    Animated.spring(this.dragX, { toValue: 0, bounciness: 0, speed: 18, useNativeDriver: false }).start();
  }

  private readonly isHorizontalSwipe = (_: GestureResponderEvent, g: PanResponderGestureState) =>
    !this.busy && Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 1.2;

  readonly panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onStartShouldSetPanResponderCapture: () => false,
    onMoveShouldSetPanResponder: this.isHorizontalSwipe,
    onMoveShouldSetPanResponderCapture: this.isHorizontalSwipe,
    onPanResponderGrant: () => this.dragX.stopAnimation(),
    onPanResponderMove: (_, g) => this.dragX.setValue(g.dx),
    onPanResponderRelease: (_, g) => {
      const threshold = Math.min(80, this.pageWidth * 0.25);
      if (g.dx < -threshold || g.vx < -0.3) this.go(1);
      else if (g.dx > threshold || g.vx > 0.3) this.go(-1);
      else this.springBack();
    },
    onPanResponderTerminate: () => this.springBack(),
  });
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
  filledDateKeys,
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

  // Geser bulan seperti slider: bulan sebelum & sesudah ikut terlihat di samping saat digeser
  const [pageWidth, setPageWidth] = useState(0);
  const [carousel] = useState(
    () =>
      new MonthCarouselController((delta) =>
        setCurrentMonthDate((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1))
      )
  );
  // Setelah bulan berganti, kembalikan posisi geser ke tengah sebelum layar digambar (tanpa kedip)
  useLayoutEffect(() => {
    carousel.settle();
  }, [carousel, currentMonthDate]);

  const handlePrevMonth = () => carousel.go(-1);
  const handleNextMonth = () => carousel.go(1);

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

  /** Satu kartu bulan (judul hari + 42 sel tanggal). */
  const renderMonth = (cells: CalendarCell[]) => (
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
        {cells.map((cell) => {
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

                {/* Lencana centang di kanan atas: hanya tanggal terpilih yang sudah berisi pesanan */}
                {isSelected && filledDateKeys?.includes(cell.dateKey) && (
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
  );

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
                    width="14"
                    height="14"
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
                    width="14"
                    height="14"
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

            {/* 2. Kalender bulan: digeser seperti slider, bulan sebelum & sesudah ikut terlihat di samping */}
            <View
              style={styles.calendarViewport}
              onLayout={(e) => {
                const width = e.nativeEvent.layout.width;
                carousel.setPageWidth(width);
                setPageWidth(width);
              }}
              {...carousel.panResponder.panHandlers}
            >
              {pageWidth > 0 ? (
                <Animated.View
                  style={[
                    styles.calendarStrip,
                    {
                      width: pageWidth * 3 + MONTH_PAGE_GAP * 2,
                      transform: [{ translateX: -(pageWidth + MONTH_PAGE_GAP) }, { translateX: carousel.dragX }],
                    },
                  ]}
                >
                  {[-1, 0, 1].map((offset) => (
                    <View
                      key={offset}
                      style={{ width: pageWidth }}
                      pointerEvents={offset === 0 ? 'auto' : 'none'}
                      accessibilityElementsHidden={offset !== 0}
                      importantForAccessibility={offset === 0 ? 'auto' : 'no-hide-descendants'}
                    >
                      {renderMonth(buildMonthCells(year, month + offset, minDate, maxDate, today))}
                    </View>
                  ))}
                </Animated.View>
              ) : (
                renderMonth(buildMonthCells(year, month, minDate, maxDate, today))
              )}
            </View>

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
                      width="16"
                      height="16"
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
    paddingTop: 8,
    paddingBottom: 4,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  cardContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  navCircleBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
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
    fontSize: 17,
    fontWeight: '400',
    lineHeight: 19,
  },
  headerTitleBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  headerSubtitle: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  headerMainTitle: {
    fontSize: 15,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  // Jendela slider: hanya kartu bulan aktif yang terlihat, kartu di sampingnya muncul saat digeser
  calendarViewport: {
    width: '100%',
    overflow: 'hidden',
  },
  calendarStrip: {
    flexDirection: 'row',
    gap: MONTH_PAGE_GAP,
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
    height: 30,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  quickPillBtnText: {
    fontSize: 13,
    fontWeight: '500',
  },
  clearBtn: {
    width: 40,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  clearBtnIconText: {
    fontSize: 14,
    lineHeight: 18,
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

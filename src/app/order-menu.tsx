import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Navbar } from '@/components/ui/Navbar';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useThemeContext } from '@/context/ThemeContext';
import { useGetWeeklyMenu } from '@/features/menu/useMenu';
import { Menu } from '@/types/menu';

// ---------------------------------------------------------------------------
// Helpers & Types
// ---------------------------------------------------------------------------

type PeriodMode = 'HARIAN' | 'MINGGUAN' | 'BULANAN';
type BulkCategoryMode = 'BUBUR' | 'NASI_TIM' | 'SUP' | 'MANUAL';

interface DateEntry {
  key: string; // YYYY-MM-DD
  dayOfWeek: number; // 1: Senin ... 7: Minggu
  formattedDate: string; // "Senin, 21 September 2026"
  dateObj: Date;
}

const INDONESIAN_DAY_NAMES = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
];

const INDONESIAN_MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const INDONESIAN_SHORT_MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

const CALENDAR_DAY_HEADERS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

function formatIndonesianDate(d: Date): string {
  const dayName = INDONESIAN_DAY_NAMES[d.getDay()];
  const dateNum = d.getDate();
  const monthName = INDONESIAN_MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${dateNum} ${monthName} ${year}`;
}

function toDateKey(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function generatePeriodDates(mode: PeriodMode, baseDate: Date = new Date()): DateEntry[] {
  const dates: DateEntry[] = [];
  const start = new Date(baseDate);
  start.setHours(0, 0, 0, 0);

  const totalDays = mode === 'HARIAN' ? 1 : mode === 'MINGGUAN' ? 7 : 30;

  for (let i = 0; i < totalDays; i++) {
    const current = new Date(start);
    current.setDate(start.getDate() + i);
    const dayIndex = current.getDay();
    const dayOfWeek = dayIndex === 0 ? 7 : dayIndex;

    dates.push({
      key: toDateKey(current),
      dayOfWeek,
      formattedDate: formatIndonesianDate(current),
      dateObj: current,
    });
  }

  return dates;
}

// ---------------------------------------------------------------------------
// Main Order Menu Screen (Step 2: Daftar Menu Harian)
// ---------------------------------------------------------------------------

export default function OrderMenuScreen() {
  const { theme, isDark } = useThemeContext();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const params = useLocalSearchParams<{
    period?: PeriodMode;
    bulk?: string;
    date?: string;
  }>();

  const periodMode: PeriodMode = (params.period as PeriodMode) || 'MINGGUAN';
  const rawBulk = params.bulk || 'MANUAL';
  const selectedBulkModes = useMemo(() => {
    if (!rawBulk || rawBulk === 'MANUAL') return [];
    return rawBulk.split(',').filter(Boolean) as BulkCategoryMode[];
  }, [rawBulk]);
  const baseDate = useMemo(() => {
    return params.date ? new Date(params.date) : new Date();
  }, [params.date]);

  // Accordion open/close state: dateKey -> boolean
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});

  // Skipped/Removed days: array of date keys removed via the circular 'X' button
  const [skippedDayKeys, setSkippedDayKeys] = useState<string[]>([]);

  // Manually added dates via the '+' calendar button
  const [addedDates, setAddedDates] = useState<DateEntry[]>([]);

  // Calendar Modal state
  const [isCalendarOpen, setIsCalendarOpen] = useState<boolean>(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date(baseDate);
    d.setDate(1);
    return d;
  });
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null);

  // Cart state: dateKey -> menuId -> quantity (number)
  const [cart, setCart] = useState<Record<string, Record<string, number>>>({});

  // Initialized flag so bulk preset runs once when data loads
  const [isBulkApplied, setIsBulkApplied] = useState<boolean>(false);

  // Detail Modal state
  const [detailModalMenu, setDetailModalMenu] = useState<Menu | null>(null);

  // TanStack Query: fetch weekly menu schedule
  const { data: weeklyData, isLoading } = useGetWeeklyMenu();

  // Computed initial period dates from configuration
  const initialPeriodDates = useMemo(() => {
    return generatePeriodDates(periodMode, baseDate);
  }, [periodMode, baseDate]);

  // All combined dates (initial + added), sorted chronologically by date
  const allOrderDates = useMemo(() => {
    const combined = [...initialPeriodDates];
    addedDates.forEach((ad) => {
      if (!combined.some((d) => d.key === ad.key)) {
        combined.push(ad);
      }
    });
    return combined.sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [initialPeriodDates, addedDates]);

  // Active period dates (excluding skipped days)
  const activePeriodDates = useMemo(() => {
    return allOrderDates.filter((d) => !skippedDayKeys.includes(d.key));
  }, [allOrderDates, skippedDayKeys]);

  // Auto-fill bulk preset when data arrives
  useEffect(() => {
    if (!weeklyData?.days || isBulkApplied) return;

    if (selectedBulkModes.length === 0) {
      setIsBulkApplied(true);
      return;
    }

    const keywords = selectedBulkModes
      .map((mode) =>
        mode === 'BUBUR' ? 'Bubur' : mode === 'NASI_TIM' ? 'Nasi Tim' : mode === 'SUP' ? 'Sup' : ''
      )
      .filter(Boolean);

    if (keywords.length === 0) {
      setIsBulkApplied(true);
      return;
    }

    const initialCart: Record<string, Record<string, number>> = {};

    initialPeriodDates.forEach((dateEntry) => {
      const daySchedule = weeklyData.days.find((d) => d.dayOfWeek === dateEntry.dayOfWeek);
      if (!daySchedule) return;

      const dayItems: Record<string, number> = {};

      keywords.forEach((kw) => {
        const match = daySchedule.mainMenus.find(
          (m) =>
            m.category.toLowerCase().includes(kw.toLowerCase()) ||
            m.name.toLowerCase().includes(kw.toLowerCase())
        );
        if (match) {
          dayItems[match.id] = 1; // Pre-fill with 1 portion
        }
      });

      if (Object.keys(dayItems).length > 0) {
        initialCart[dateEntry.key] = dayItems;
      }
    });

    setCart(initialCart);
    setIsBulkApplied(true);
  }, [weeklyData, selectedBulkModes, initialPeriodDates, isBulkApplied]);

  // Toggle Accordion Day
  const toggleDayAccordion = (dateKey: string) => {
    setExpandedDays((prev) => {
      const current = prev[dateKey] !== undefined ? prev[dateKey] : true;
      return {
        ...prev,
        [dateKey]: !current,
      };
    });
  };

  // Expand all / collapse all
  const handleExpandAll = (expand: boolean) => {
    const updated: Record<string, boolean> = {};
    activePeriodDates.forEach((d) => {
      updated[d.key] = expand;
    });
    setExpandedDays(updated);
  };

  // Remove / Skip day action
  const handleRemoveDay = (dateKey: string) => {
    setSkippedDayKeys((prev) => [...prev, dateKey]);
    setCart((prev) => {
      const updated = { ...prev };
      delete updated[dateKey];
      return updated;
    });
  };

  // Add new day action from Calendar
  const handleAddDateFromCalendar = (targetDate: Date) => {
    const key = toDateKey(targetDate);
    const dayIndex = targetDate.getDay();
    const dayOfWeek = dayIndex === 0 ? 7 : dayIndex;
    const formattedDate = formatIndonesianDate(targetDate);

    const newEntry: DateEntry = {
      key,
      dayOfWeek,
      formattedDate,
      dateObj: new Date(targetDate),
    };

    // If it was skipped previously, un-skip it
    if (skippedDayKeys.includes(key)) {
      setSkippedDayKeys((prev) => prev.filter((k) => k !== key));
    }

    // Add to addedDates if not present
    setAddedDates((prev) => {
      if (prev.some((d) => d.key === key)) return prev;
      return [...prev, newEntry];
    });

    // Auto-fill bulk preset if user chose bulk mode
    if (weeklyData?.days && selectedBulkModes.length > 0) {
      const keywords = selectedBulkModes
        .map((mode) =>
          mode === 'BUBUR' ? 'Bubur' : mode === 'NASI_TIM' ? 'Nasi Tim' : mode === 'SUP' ? 'Sup' : ''
        )
        .filter(Boolean);

      const daySchedule = weeklyData.days.find((d) => d.dayOfWeek === dayOfWeek);
      if (daySchedule) {
        const dayItems: Record<string, number> = {};
        keywords.forEach((kw) => {
          const match = daySchedule.mainMenus.find(
            (m) =>
              m.category.toLowerCase().includes(kw.toLowerCase()) ||
              m.name.toLowerCase().includes(kw.toLowerCase())
          );
          if (match) {
            dayItems[match.id] = 1;
          }
        });

        if (Object.keys(dayItems).length > 0) {
          setCart((prev) => ({
            ...prev,
            [key]: { ...(prev[key] || {}), ...dayItems },
          }));
        }
      }
    }

    // Auto-expand newly added day
    setExpandedDays((prev) => ({
      ...prev,
      [key]: true,
    }));

    // Reset selection and close calendar
    setSelectedCalendarDate(null);
    setIsCalendarOpen(false);
  };

  // Update item quantity on a specific date
  const updateItemQty = (dateKey: string, menuId: string, deltaOrValue: number | string) => {
    setCart((prev) => {
      const dayCart = { ...(prev[dateKey] || {}) };
      let newQty = 0;

      if (typeof deltaOrValue === 'string') {
        const parsed = parseInt(deltaOrValue, 10);
        newQty = isNaN(parsed) || parsed < 0 ? 0 : parsed;
      } else {
        const currentQty = dayCart[menuId] || 0;
        newQty = Math.max(0, currentQty + deltaOrValue);
      }

      if (newQty <= 0) {
        delete dayCart[menuId];
      } else {
        dayCart[menuId] = newQty;
      }

      return {
        ...prev,
        [dateKey]: dayCart,
      };
    });
  };

  // Map of all menus for easy price lookup: menuId -> Menu
  const allMenusMap = useMemo(() => {
    const map = new Map<string, Menu>();
    if (weeklyData?.days) {
      weeklyData.days.forEach((day) => {
        day.mainMenus.forEach((m) => map.set(m.id, m));
        day.secondaryMenus.forEach((m) => map.set(m.id, m));
      });
    }
    return map;
  }, [weeklyData]);

  // Calculate Subtotal for a given day
  const calculateDaySubtotal = (dateKey: string): number => {
    const dayCart = cart[dateKey];
    if (!dayCart) return 0;

    let subtotal = 0;
    Object.entries(dayCart).forEach(([menuId, qty]) => {
      const menu = allMenusMap.get(menuId);
      if (menu && qty > 0) {
        subtotal += Number(menu.price) * qty;
      }
    });
    return subtotal;
  };

  // Calculate Grand Total & Total Items across active days
  const { grandTotal, totalItemsCount } = useMemo(() => {
    let total = 0;
    let count = 0;

    Object.entries(cart).forEach(([dateKey, dayCart]) => {
      const isDateActive = activePeriodDates.some((d) => d.key === dateKey);
      if (!isDateActive || !dayCart) return;

      Object.entries(dayCart).forEach(([menuId, qty]) => {
        const menu = allMenusMap.get(menuId);
        if (menu && qty > 0) {
          total += Number(menu.price) * qty;
          count += qty;
        }
      });
    });

    return { grandTotal: total, totalItemsCount: count };
  }, [cart, activePeriodDates, allMenusMap]);

  // Handle Checkout / Lanjut Pemesanan
  const handleProceedOrder = () => {
    if (totalItemsCount === 0) {
      Alert.alert(
        'Keranjang Kosong',
        'Silakan tentukan minimal 1 porsi menu MPASI pada jadwal katering.'
      );
      return;
    }

    Alert.alert(
      'Konfirmasi Pesanan MPASI',
      `Periode: ${periodMode === 'HARIAN' ? 'Harian (1 Hari)' : periodMode === 'MINGGUAN' ? 'Mingguan (7 Hari)' : 'Bulanan (30 Hari)'}\n` +
      `Hari Aktif: ${activePeriodDates.length} hari\n` +
      `Total Porsi: ${totalItemsCount} porsi\n` +
      `Total Pembayaran: Rp ${grandTotal.toLocaleString('id-ID')}\n\n` +
      'Lanjutkan ke halaman pengiriman dan pembayaran?',
      [
        { text: 'Periksa Kembali', style: 'cancel' },
        {
          text: 'Ya, Lanjutkan',
          onPress: () => {
            Alert.alert('Sukses', 'Pesanan Anda telah berhasil dicatat ke sistem!');
          },
        },
      ]
    );
  };



  // Calendar calculations
  const calendarYear = calendarMonth.getFullYear();
  const calendarMonthIndex = calendarMonth.getMonth();
  const firstDayOfMonth = new Date(calendarYear, calendarMonthIndex, 1).getDay();
  const daysInCurrentMonth = new Date(calendarYear, calendarMonthIndex + 1, 0).getDate();

  const handlePrevMonth = () => {
    setCalendarMonth(new Date(calendarYear, calendarMonthIndex - 1, 1));
    setSelectedCalendarDate(null);
  };

  const handleNextMonth = () => {
    setCalendarMonth(new Date(calendarYear, calendarMonthIndex + 1, 1));
    setSelectedCalendarDate(null);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/order');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Navbar */}
        <Navbar />

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: 110,
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Section - Simple & Icon-First */}
          <View style={styles.headerSection}>
            <Pressable
              onPress={handleBack}
              style={({ pressed }) => [
                styles.backBtn,
                {
                  backgroundColor: isDark ? '#1E293B' : '#F1F5F9',
                  borderColor: theme.border,
                },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Kembali ke konfigurasi"
            >
              <ThemedText style={[styles.backBtnIcon, { color: theme.primary }]}>
                ←
              </ThemedText>
              <ThemedText style={[styles.backBtnText, { color: theme.textSecondary }]}>
                Konfigurasi
              </ThemedText>
            </Pressable>

            <View style={styles.headerTitleRow}>
              <ThemedText style={[styles.title, { color: theme.text }]}>
                Daftar Menu Katering
              </ThemedText>
            </View>
          </View>

          {/* Quick Accordion Controls (Expand All / Collapse All) - Icon-First */}
          <View style={styles.accordionControlsRow}>

            <View style={{ flexDirection: 'row', gap: 6 }}>
              <Pressable
                onPress={() => handleExpandAll(true)}
                style={({ pressed }) => [
                  styles.smallCtrlBtn,
                  { borderColor: theme.border, backgroundColor: theme.card },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Buka Semua Rincian"
              >
                <ThemedText style={[styles.smallCtrlBtnIcon, { color: theme.primary }]}>
                  ▾
                </ThemedText>
                <ThemedText style={[styles.smallCtrlBtnText, { color: theme.textSecondary }]}>
                  Buka
                </ThemedText>
              </Pressable>

              <Pressable
                onPress={() => handleExpandAll(false)}
                style={({ pressed }) => [
                  styles.smallCtrlBtn,
                  { borderColor: theme.border, backgroundColor: theme.card },
                  pressed && styles.pressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel="Tutup Semua Rincian"
              >
                <ThemedText style={[styles.smallCtrlBtnIcon, { color: theme.primary }]}>
                  ▴
                </ThemedText>
                <ThemedText style={[styles.smallCtrlBtnText, { color: theme.textSecondary }]}>
                  Tutup
                </ThemedText>
              </Pressable>
            </View>
          </View>

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText style={{ color: theme.textSecondary, marginTop: 10 }}>
                Menyiapkan daftar hidangan harian...
              </ThemedText>
            </View>
          )}

          {/* ACCORDION CARDS LIST (Mengikuti Sketsa Wireframe) */}
          {!isLoading && (
            <View style={styles.accordionContainer}>
              {activePeriodDates.length === 0 ? (
                <View style={[styles.allRemovedBox, { backgroundColor: theme.card, borderColor: theme.border }]}>
                  <ThemedText style={{ fontSize: 14, fontWeight: '700', textAlign: 'center', color: theme.text }}>
                    Semua hari telah dihapus dari jadwal katering.
                  </ThemedText>
                  <Pressable
                    onPress={() => setSkippedDayKeys([])}
                    style={[styles.resetDaysBtn, { backgroundColor: theme.primary }]}
                  >
                    <ThemedText style={styles.resetDaysBtnText}>
                      Pulihkan Semua Hari Awal
                    </ThemedText>
                  </Pressable>
                </View>
              ) : (
                activePeriodDates.map((dateEntry, index) => {
                  // Default: Semua hari terbuka (expanded) untuk semua indeks saat screen pertama kali dibuka
                  const isExpanded =
                    expandedDays[dateEntry.key] !== undefined
                      ? expandedDays[dateEntry.key]
                      : true;

                  const daySchedule = weeklyData?.days?.find(
                    (d) => d.dayOfWeek === dateEntry.dayOfWeek
                  );

                  const mainMenus = daySchedule?.mainMenus || [];
                  const secondaryMenus = daySchedule?.secondaryMenus || [];
                  const allAvailableMenus = [...mainMenus, ...secondaryMenus];

                  const daySubtotal = calculateDaySubtotal(dateEntry.key);

                  return (
                    <View
                      key={dateEntry.key}
                      style={[
                        styles.dayCard,
                        {
                          borderColor: isDark ? '#334155' : '#E2E8F0',
                          backgroundColor: theme.card,
                        },
                      ]}
                    >
                      {/* 1. HEADER BAR ABU-ABU DENGAN TOMBOL 'X' DI KANAN */}
                      <View
                        style={[
                          styles.cardHeaderBar,
                          {
                            backgroundColor: isDark ? '#1E293B' : '#E5E7EB',
                            borderBottomColor: isDark ? '#334155' : '#D1D5DB',
                          },
                        ]}
                      >
                        <Pressable
                          onPress={() => toggleDayAccordion(dateEntry.key)}
                          style={({ pressed }) => [
                            styles.cardHeaderTitleRow,
                            pressed && styles.pressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityLabel={`Buka tutup menu ${dateEntry.formattedDate}`}
                        >
                          <ThemedText style={[styles.cardHeaderDate, { color: isDark ? '#F1F5F9' : '#1F2937' }]}>
                            {dateEntry.formattedDate}
                          </ThemedText>
                        </Pressable>

                        {/* Dua Tombol Lingkaran Samping-Menyamping: Segitiga & X */}
                        <View style={styles.cardHeaderActionsRow}>
                          {/* Tombol Lingkaran Segitiga (Buka / Tutup) */}
                          <Pressable
                            onPress={() => toggleDayAccordion(dateEntry.key)}
                            style={({ pressed }) => [
                              styles.circleActionBtn,
                              {
                                backgroundColor: isDark ? '#475569' : '#B0B7C3',
                              },
                              pressed && styles.pressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={isExpanded ? 'Tutup rincian' : 'Buka rincian'}
                            hitSlop={6}
                          >
                            <View
                              style={[
                                styles.triangleWrapper,
                                isExpanded && styles.triangleWrapperRotated,
                              ]}
                            >
                              <ThemedText
                                style={[
                                  styles.circleActionTriangle,
                                  { color: isDark ? '#FFFFFF' : '#000000' },
                                ]}
                              >
                                ▲
                              </ThemedText>
                            </View>
                          </Pressable>

                          {/* Tombol Lingkaran 'X' (Hapus Hari) */}
                          <Pressable
                            onPress={() => handleRemoveDay(dateEntry.key)}
                            style={({ pressed }) => [
                              styles.circleActionBtn,
                              {
                                backgroundColor: isDark ? '#475569' : '#B0B7C3',
                              },
                              pressed && styles.pressed,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Hapus hari ${dateEntry.formattedDate}`}
                            hitSlop={6}
                          >
                            <ThemedText
                              style={[
                                styles.circleActionClose,
                                { color: isDark ? '#FFFFFF' : '#000000' },
                              ]}
                            >
                              X
                            </ThemedText>
                          </Pressable>
                        </View>
                      </View>

                      {/* 2. BODI KARTU BERWARNA WARM ORANYE BUBOX */}
                      <View
                        style={[
                          styles.cardBody,
                          {
                            backgroundColor: isDark ? '#1F1712' : '#FFFBF7',
                          },
                        ]}
                      >
                        {/* A. TAMPILAN TERBUKA (EXPANDED) - GAMBAR 1 & 2 */}
                        {isExpanded ? (
                          <View style={styles.expandedContent}>
                            {/* Rincian Hidangan ("Lorem Ipsum" pada Sketsa) */}
                            <View style={styles.menuItemsList}>
                              {allAvailableMenus.length === 0 ? (
                                <View style={styles.emptyDayNotice}>
                                  <ThemedText style={{ color: '#94A3B8', fontSize: 13 }}>
                                    Belum ada hidangan terdaftar untuk hari ini.
                                  </ThemedText>
                                </View>
                              ) : (
                                allAvailableMenus.map((menu) => {
                                  const isUtama = menu.menuType === 'UTAMA';
                                  const currentQty = cart[dateEntry.key]?.[menu.id] || 0;

                                  return (
                                    <View
                                      key={menu.id}
                                      style={[
                                        styles.menuItemRow,
                                        { borderBottomColor: isDark ? '#2D2018' : '#FED7AA33' },
                                      ]}
                                    >
                                      {/* Info Menu */}
                                      <Pressable
                                        onPress={() => setDetailModalMenu(menu)}
                                        style={styles.menuInfoLeft}
                                        accessibilityRole="button"
                                        accessibilityLabel={`Detail menu ${menu.name}`}
                                      >
                                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                          <ThemedText style={{ fontSize: 13 }}>
                                            {isUtama ? '🍲' : '🥗'}
                                          </ThemedText>
                                          <ThemedText
                                            style={[styles.menuItemName, { color: theme.text }]}
                                            numberOfLines={1}
                                          >
                                            {menu.name}
                                          </ThemedText>
                                        </View>

                                        <ThemedText style={styles.menuItemPrice}>
                                          ↳ Rp{Number(menu.price).toLocaleString('id-ID')}
                                        </ThemedText>
                                      </Pressable>

                                      {/* Stepper Kontrol Kuantitas */}
                                      <View style={styles.qtyControlRight}>
                                        <Pressable
                                          onPress={() => updateItemQty(dateEntry.key, menu.id, -1)}
                                          style={({ pressed }) => [
                                            styles.stepperBtn,
                                            {
                                              borderColor: isDark ? '#475569' : '#CBD5E1',
                                              backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                                            },
                                            pressed && styles.pressed,
                                          ]}
                                          disabled={currentQty === 0}
                                        >
                                          <ThemedText style={[styles.stepperBtnText, { opacity: currentQty === 0 ? 0.3 : 1 }]}>
                                            −
                                          </ThemedText>
                                        </Pressable>

                                        <TextInput
                                          style={[
                                            styles.qtyInputBox,
                                            {
                                              borderColor: currentQty > 0 ? theme.primary : (isDark ? '#475569' : '#CBD5E1'),
                                              backgroundColor: currentQty > 0 ? (theme.primaryLight || '#FFF0E8') : (isDark ? '#1E293B' : '#FFFFFF'),
                                              color: currentQty > 0 ? theme.primary : theme.text,
                                            },
                                          ]}
                                          keyboardType="numeric"
                                          value={String(currentQty)}
                                          onChangeText={(val) => updateItemQty(dateEntry.key, menu.id, val)}
                                          selectTextOnFocus
                                        />

                                        <Pressable
                                          onPress={() => updateItemQty(dateEntry.key, menu.id, 1)}
                                          style={({ pressed }) => [
                                            styles.stepperBtn,
                                            {
                                              borderColor: theme.primary,
                                              backgroundColor: isDark ? '#2A1F18' : '#FFF0E8',
                                            },
                                            pressed && styles.pressed,
                                          ]}
                                        >
                                          <ThemedText style={[styles.stepperBtnText, { color: theme.primary }]}>
                                            +
                                          </ThemedText>
                                        </Pressable>
                                      </View>
                                    </View>
                                  );
                                })
                              )}
                            </View>

                            {/* GARIS PEMBATAS PUTUS-PUTUS (DASHED LINE DIVIDER) */}
                            <View
                              style={[
                                styles.dashedDivider,
                                {
                                  borderColor: isDark ? '#7C2D12' : '#FDBA74',
                                },
                              ]}
                            />

                            {/* SUB-TOTAL HARIAN "Rp XXX" */}
                            <View style={styles.expandedSubtotalRow}>
                              <ThemedText style={[styles.priceTagText, { color: theme.primary }]}>
                                Rp {daySubtotal.toLocaleString('id-ID')}
                              </ThemedText>
                            </View>
                          </View>
                        ) : (
                          /* B. TAMPILAN RINGKAS (COLLAPSED) - GAMBAR 1 & 3 */
                          <Pressable
                            onPress={() => toggleDayAccordion(dateEntry.key)}
                            style={styles.collapsedContent}
                            accessibilityRole="button"
                          >
                            <ThemedText style={[styles.priceTagText, { color: theme.primary }]}>
                              Rp {daySubtotal.toLocaleString('id-ID')}
                            </ThemedText>
                          </Pressable>
                        )}
                      </View>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* DETAIL MODAL (Pop-up Nutrisi & Bahan Pangan Saat Menu Diklik) */}
          <Modal
            visible={!!detailModalMenu}
            transparent
            animationType="fade"
            onRequestClose={() => setDetailModalMenu(null)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.detailModalCard, { backgroundColor: theme.card }]}>
                {detailModalMenu && (
                  <>
                    <View style={styles.modalHeaderRow}>
                      <View style={{ flex: 1, gap: 2 }}>
                        <ThemedText style={styles.modalCatLabel}>
                          {detailModalMenu.category.toUpperCase()} • {detailModalMenu.menuType === 'UTAMA' ? 'MENU UTAMA' : 'MENU SEKUNDER'}
                        </ThemedText>
                        <ThemedText style={[styles.modalFoodTitle, { color: theme.secondary }]}>
                          {detailModalMenu.name}
                        </ThemedText>
                      </View>
                      <Pressable
                        onPress={() => setDetailModalMenu(null)}
                        style={styles.modalCloseBtn}
                        accessibilityLabel="Tutup"
                      >
                        <ThemedText style={{ fontSize: 22, color: '#94A3B8' }}>✕</ThemedText>
                      </Pressable>
                    </View>

                    {detailModalMenu.imageUrl && (
                      <Image
                        source={{ uri: detailModalMenu.imageUrl }}
                        style={styles.modalFoodImage}
                        resizeMode="cover"
                      />
                    )}

                    <View
                      style={[
                        styles.modalPriceBanner,
                        {
                          backgroundColor: theme.primaryLight || '#FFF0E8',
                          borderColor: theme.primary,
                        },
                      ]}
                    >
                      <ThemedText style={[styles.modalPriceLabel, { color: theme.secondary }]}>
                        Harga per Porsi
                      </ThemedText>
                      <ThemedText style={[styles.modalPriceValue, { color: theme.primary }]}>
                        Rp {Number(detailModalMenu.price).toLocaleString('id-ID')}
                      </ThemedText>
                    </View>

                    <ScrollView style={{ maxHeight: 220 }} showsVerticalScrollIndicator={false}>
                      <View style={[styles.modalDetailBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: theme.border }]}>
                        <ThemedText style={[styles.modalDetailLabel, { color: theme.primary }]}>🥣 Bahan Pangan (Ingredients):</ThemedText>
                        <ThemedText style={[styles.modalDetailText, { color: theme.text }]}>
                          {detailModalMenu.ingredients || 'Komposisi pangan alami pilihan untuk bayi.'}
                        </ThemedText>
                      </View>

                      <View style={[styles.modalDetailBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: theme.border }]}>
                        <ThemedText style={[styles.modalDetailLabel, { color: theme.primary }]}>📊 Informasi Gizi & Nutrisi:</ThemedText>
                        <ThemedText style={[styles.modalDetailText, { color: theme.text }]}>
                          {detailModalMenu.nutritionInfo || 'Kandungan makronutrien dan mikronutrien seimbang.'}
                        </ThemedText>
                      </View>

                      {detailModalMenu.description && (
                        <View style={[styles.modalDetailBox, { backgroundColor: isDark ? '#1E293B' : '#F8FAFC', borderColor: theme.border }]}>
                          <ThemedText style={[styles.modalDetailLabel, { color: theme.primary }]}>📝 Deskripsi Menu:</ThemedText>
                          <ThemedText style={[styles.modalDetailText, { color: theme.text }]}>
                            {detailModalMenu.description}
                          </ThemedText>
                        </View>
                      )}
                    </ScrollView>

                    <Pressable
                      onPress={() => setDetailModalMenu(null)}
                      style={[styles.modalDoneBtn, { backgroundColor: theme.primary }]}
                    >
                      <ThemedText style={styles.modalDoneBtnText}>Tutup Rincian</ThemedText>
                    </Pressable>
                  </>
                )}
              </View>
            </View>
          </Modal>

          {/* MODAL KALENDER PEMILIH TANGGAL (+ TAMBAH HARI) */}
          <Modal
            visible={isCalendarOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setIsCalendarOpen(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={[styles.calendarModalCard, { backgroundColor: theme.card }]}>
                {/* Header Modal */}
                <View style={styles.calendarModalHeader}>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.calendarModalTitle}>
                      Tambah Hari Katering
                    </ThemedText>
                    <ThemedText style={styles.calendarModalSubtitle}>
                      Pilih tanggal baru untuk ditambahkan ke jadwal
                    </ThemedText>
                  </View>
                  <Pressable
                    onPress={() => setIsCalendarOpen(false)}
                    style={styles.modalCloseBtn}
                    accessibilityLabel="Tutup Kalender"
                  >
                    <ThemedText style={{ fontSize: 22, color: '#94A3B8' }}>✕</ThemedText>
                  </Pressable>
                </View>

                {/* Navigasi Bulan & Tahun */}
                <View style={styles.monthNavRow}>
                  <Pressable
                    onPress={handlePrevMonth}
                    style={({ pressed }) => [
                      styles.monthNavBtn,
                      { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Bulan Sebelumnya"
                  >
                    <ThemedText style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>
                      ‹
                    </ThemedText>
                  </Pressable>

                  <ThemedText style={[styles.monthNavTitle, { color: theme.text }]}>
                    {INDONESIAN_MONTH_NAMES[calendarMonthIndex]} {calendarYear}
                  </ThemedText>

                  <Pressable
                    onPress={handleNextMonth}
                    style={({ pressed }) => [
                      styles.monthNavBtn,
                      { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                      pressed && styles.pressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel="Bulan Berikutnya"
                  >
                    <ThemedText style={{ fontSize: 16, fontWeight: '800', color: theme.text }}>
                      ›
                    </ThemedText>
                  </Pressable>
                </View>

                {/* Header Nama Hari (Min, Sen, Sel, ...) */}
                <View style={styles.calendarDaysHeaderRow}>
                  {CALENDAR_DAY_HEADERS.map((dayName, idx) => (
                    <View key={dayName} style={styles.calendarDayHeaderCell}>
                      <ThemedText
                        style={[
                          styles.calendarDayHeaderText,
                          { color: idx === 0 ? '#EF4444' : theme.textSecondary },
                        ]}
                      >
                        {dayName}
                      </ThemedText>
                    </View>
                  ))}
                </View>

                {/* Grid Tanggal Bulan */}
                <View style={styles.calendarGrid}>
                  {/* Slot kosong awal bulan */}
                  {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                    <View key={`empty-${idx}`} style={styles.calendarDateCell} />
                  ))}

                  {/* Hari 1 sampai akhir bulan */}
                  {Array.from({ length: daysInCurrentMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateObj = new Date(calendarYear, calendarMonthIndex, dayNum);
                    dateObj.setHours(0, 0, 0, 0);
                    const key = toDateKey(dateObj);

                    const today = new Date();
                    today.setHours(0, 0, 0, 0);

                    const isPast = dateObj < today;
                    const isExisting = activePeriodDates.some((entry) => entry.key === key);
                    const isDisabled = isPast || isExisting;
                    const isSelected = selectedCalendarDate
                      ? toDateKey(selectedCalendarDate) === key
                      : false;

                    return (
                      <View key={key} style={styles.calendarDateCell}>
                        <Pressable
                          onPress={() => {
                            if (!isDisabled) {
                              setSelectedCalendarDate(dateObj);
                            }
                          }}
                          disabled={isDisabled}
                          style={({ pressed }) => [
                            styles.dateTile,
                            isExisting && [
                              styles.dateTileExisting,
                              {
                                backgroundColor: isDark ? '#3D2214' : '#FFEDD5',
                                borderColor: theme.primary,
                              },
                            ],
                            isPast && styles.dateTilePast,
                            isSelected && [
                              styles.dateTileSelected,
                              { backgroundColor: theme.primary, borderColor: theme.primary },
                            ],
                            !isDisabled && !isSelected && [
                              styles.dateTileAvailable,
                              { borderColor: theme.border, backgroundColor: isDark ? '#1E293B' : '#FFFFFF' },
                            ],
                            pressed && !isDisabled && styles.pressed,
                          ]}
                          accessibilityRole="button"
                          accessibilityState={{ disabled: isDisabled, selected: isSelected }}
                        >
                          <ThemedText
                            style={[
                              styles.dateTileNum,
                              isExisting && { color: theme.primary, fontWeight: '800' },
                              isPast && { color: '#94A3B8', opacity: 0.4 },
                              isSelected && { color: '#FFFFFF', fontWeight: '900' },
                              !isDisabled && !isSelected && { color: theme.text },
                            ]}
                          >
                            {dayNum}
                          </ThemedText>

                          {/* Indikator "Ada" untuk tanggal yang sudah ada */}
                          {isExisting && (
                            <ThemedText style={[styles.existingIndicatorText, { color: theme.primary }]}>
                              ✓ Ada
                            </ThemedText>
                          )}
                        </Pressable>
                      </View>
                    );
                  })}
                </View>

                {/* Keterangan Legenda Status Tanggal */}
                <View style={styles.calendarLegendRow}>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: isDark ? '#3D2214' : '#FFEDD5', borderColor: theme.primary }]} />
                    <ThemedText style={styles.legendText}>Sudah ada (Tidak dapat dipilih)</ThemedText>
                  </View>
                  <View style={styles.legendItem}>
                    <View style={[styles.legendBox, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: theme.border }]} />
                    <ThemedText style={styles.legendText}>Tersedia</ThemedText>
                  </View>
                </View>

                {/* Footer Modal: Tanggal Terpilih & Tombol Tambah */}
                <View style={styles.calendarModalFooter}>
                  {selectedCalendarDate ? (
                    <View style={{ gap: 10 }}>
                      <View style={[styles.selectedDateBanner, { backgroundColor: theme.primaryLight || '#FFF0E8', borderColor: theme.primary }]}>
                        <ThemedText style={[styles.selectedDateBannerLabel, { color: theme.primary }]}>
                          Tanggal Baru Terpilih:
                        </ThemedText>
                        <ThemedText style={[styles.selectedDateBannerValue, { color: theme.text }]}>
                          {formatIndonesianDate(selectedCalendarDate)}
                        </ThemedText>
                      </View>

                      <Pressable
                        onPress={() => handleAddDateFromCalendar(selectedCalendarDate)}
                        style={({ pressed }) => [
                          styles.confirmAddDateBtn,
                          { backgroundColor: theme.primary },
                          pressed && styles.pressed,
                        ]}
                      >
                        <ThemedText style={styles.confirmAddDateBtnText}>
                          Tambahkan ke Jadwal Katering ➔
                        </ThemedText>
                      </Pressable>
                    </View>
                  ) : (
                    <ThemedText style={styles.selectPromptText}>
                      Ketuk salah satu tanggal yang tersedia pada kalender di atas.
                    </ThemedText>
                  )}
                </View>
              </View>
            </View>
          </Modal>
        </ScrollView>

        {/* 3. FLOATING ACTION BUTTON (+) UNTUK MENAMBAHKAN HARI (SESUAI GAMBAR) */}
        <Pressable
          onPress={() => {
            setCalendarMonth(new Date(baseDate));
            setSelectedCalendarDate(null);
            setIsCalendarOpen(true);
          }}
          style={({ pressed }) => [
            styles.floatingAddBtn,
            {
              bottom: 88,
              backgroundColor: isDark ? '#334155' : '#E2E8F0',
            },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Tambah Hari Katering"
        >
          <ThemedText style={[styles.floatingAddBtnText, { color: isDark ? '#F8FAFC' : '#1E293B' }]}>
            +
          </ThemedText>
        </Pressable>

        {/* 4. STICKY CHECKOUT FOOTER (BERADA TEPAT MENEMPEL DI ATAS FOOTER MENU EKSISTING) */}
        <View
          style={[
            styles.stickyCheckoutBar,
            {
              backgroundColor: theme.card,
              borderTopColor: theme.border,
              bottom: 0,
            },
          ]}
        >
          {/* Kolom Total Harga "Rp XXX" di Sisi Kiri Sesuai Sketsa */}
          <View style={styles.footerLeftCol}>
            <ThemedText style={[styles.footerTotalPrice, { color: theme.primary }]}>
              Rp {grandTotal.toLocaleString('id-ID')}
            </ThemedText>
            <ThemedText style={styles.footerSubText}>
              {totalItemsCount} Porsi Terpilih • {activePeriodDates.length} Hari
            </ThemedText>
          </View>

          {/* Tombol "CHEKOUT" di Sisi Kanan Sesuai Sketsa */}
          <Pressable
            onPress={handleProceedOrder}
            style={({ pressed }) => [
              styles.checkoutActionBtn,
              {
                backgroundColor: totalItemsCount > 0 ? theme.primary : (isDark ? '#334155' : '#CBD5E1'),
              },
              pressed && styles.pressed,
            ]}
            disabled={totalItemsCount === 0}
            accessibilityRole="button"
            accessibilityLabel="Tombol Checkout"
          >
            <ThemedText style={styles.checkoutActionBtnText}>
              CHEKOUT
            </ThemedText>
          </Pressable>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

// ---------------------------------------------------------------------------
// Stylesheet
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  headerSection: {
    gap: 8,
  },
  backBtn: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  backBtnIcon: {
    fontSize: 14,
    fontWeight: '800',
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitleRow: {
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  infoPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  infoPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  accordionControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  accordionListTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  smallCtrlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  smallCtrlBtnIcon: {
    fontSize: 12,
    fontWeight: '800',
  },
  smallCtrlBtnText: {
    fontSize: 11,
    fontWeight: '700',
  },
  loadingBox: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  accordionContainer: {
    gap: 14,
  },
  allRemovedBox: {
    padding: 24,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    gap: 12,
  },
  resetDaysBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  resetDaysBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
  },

  // STILE KARTU MODULAR SESUAI SKETSA
  dayCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottomWidth: 1,
  },
  cardHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingVertical: 4,
    paddingRight: 10,
    cursor: 'pointer' as any,
  },
  cardHeaderDate: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardHeaderActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleActionBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  circleActionTriangle: {
    fontSize: 12,
    fontWeight: '900',
    textAlign: 'center',
    lineHeight: 14,
  },
  triangleWrapper: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triangleWrapperRotated: {
    transform: [{ rotate: '180deg' }],
  },
  circleActionClose: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 15,
  },
  cardBody: {
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },

  // Konten Terbuka (Expanded)
  expandedContent: {
    paddingTop: 8,
  },
  menuItemsList: {
    paddingHorizontal: 16,
  },
  emptyDayNotice: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    gap: 12,
  },
  menuInfoLeft: {
    flex: 1,
    gap: 4,
    cursor: 'pointer' as any,
  },
  menuItemName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
    flexShrink: 1,
  },
  menuItemPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  qtyControlRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
  },
  qtyInputBox: {
    width: 44,
    height: 30,
    borderRadius: 6,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    padding: 0,
  },

  // Garis Pembatas Putus-Putus
  dashedDivider: {
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    width: '100%',
    marginTop: 12,
    marginBottom: 10,
  },
  expandedSubtotalRow: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },

  // Konten Ringkas (Collapsed)
  collapsedContent: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    cursor: 'pointer' as any,
  },
  priceTagText: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  subtotalHint: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },

  // DETAIL MODAL STYLES
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  detailModalCard: {
    maxWidth: 500,
    width: '100%',
    maxHeight: '85%',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 6,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  modalCatLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  modalFoodTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  modalCloseBtn: {
    padding: 4,
    cursor: 'pointer' as any,
  },
  modalFoodImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  modalPriceBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  modalPriceLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  modalPriceValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  modalDetailBox: {
    borderRadius: 10,
    padding: 10,
    gap: 4,
    marginBottom: 8,
    borderWidth: 1,
  },
  modalDetailLabel: {
    fontSize: 11,
    fontWeight: '800',
  },
  modalDetailText: {
    fontSize: 12,
    lineHeight: 18,
  },
  modalDoneBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  modalDoneBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },

  // KALENDER MODAL STYLES
  calendarModalCard: {
    maxWidth: 440,
    width: '100%',
    borderRadius: 20,
    padding: 20,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 8,
  },
  calendarModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  calendarModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  calendarModalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  monthNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  monthNavBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  monthNavTitle: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  calendarDaysHeaderRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingBottom: 6,
  },
  calendarDayHeaderCell: {
    flex: 1,
    alignItems: 'center',
  },
  calendarDayHeaderText: {
    fontSize: 11,
    fontWeight: '700',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDateCell: {
    width: '14.285%',
    padding: 2,
  },
  dateTile: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  dateTileNum: {
    fontSize: 13,
    fontWeight: '700',
  },
  existingIndicatorText: {
    fontSize: 8,
    fontWeight: '800',
    marginTop: 1,
  },
  dateTileExisting: {
    cursor: 'not-allowed' as any,
    opacity: 0.9,
  },
  dateTilePast: {
    cursor: 'not-allowed' as any,
    borderColor: 'transparent',
    backgroundColor: 'transparent',
  },
  dateTileSelected: {
    shadowColor: '#F36F21',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  dateTileAvailable: {
    borderColor: '#E2E8F0',
  },
  calendarLegendRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendBox: {
    width: 12,
    height: 12,
    borderRadius: 3,
    borderWidth: 1,
  },
  legendText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  calendarModalFooter: {
    paddingTop: 4,
  },
  selectedDateBanner: {
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 2,
  },
  selectedDateBannerLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  selectedDateBannerValue: {
    fontSize: 13,
    fontWeight: '800',
  },
  confirmAddDateBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  confirmAddDateBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  selectPromptText: {
    fontSize: 11,
    color: '#94A3B8',
    textAlign: 'center',
    paddingVertical: 4,
  },

  // FLOATING ACTION BUTTON (+) SESUAI SKETSA
  floatingAddBtn: {
    position: 'absolute',
    right: 20,
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 60,
    cursor: 'pointer' as any,
  },
  floatingAddBtnText: {
    fontSize: 34,
    fontWeight: '400',
    lineHeight: 36,
    textAlign: 'center',
  },

  // STICKY CHECKOUT BAR (DI ATAS FOOTER EKSISTING)
  stickyCheckoutBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 50,
  },
  footerLeftCol: {
    gap: 2,
  },
  footerTotalPrice: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  footerSubText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  checkoutActionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
    shadowColor: '#F36F21',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  checkoutActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.985 }],
  },
});

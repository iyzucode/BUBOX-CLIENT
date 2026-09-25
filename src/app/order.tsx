import React, { useMemo, useRef, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Navbar } from '@/components/ui/Navbar';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useThemeContext } from '@/context/ThemeContext';

export type PeriodMode = 'HARIAN' | 'MINGGUAN' | 'BULANAN';
export type BulkCategoryMode = 'BUBUR' | 'NASI_TIM' | 'SUP' | 'MANUAL';

interface PeriodOption {
  id: PeriodMode;
  name: string;
  duration: string;
}

interface BulkOption {
  id: BulkCategoryMode;
  label: string;
}

const PERIOD_OPTIONS: PeriodOption[] = [
  { id: 'HARIAN', name: 'Harian', duration: '1 Hari' },
  { id: 'MINGGUAN', name: 'Mingguan', duration: '7 Hari' },
  { id: 'BULANAN', name: 'Bulanan', duration: '30 Hari' },
];

const BULK_OPTIONS: BulkOption[] = [
  { id: 'BUBUR', label: 'Bubur' },
  { id: 'NASI_TIM', label: 'Nasi Tim' },
  { id: 'SUP', label: 'Sup & Kuah' },
];

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

function formatIndonesianDate(d: Date): string {
  const dayName = INDONESIAN_DAY_NAMES[d.getDay()];
  const dateNum = d.getDate();
  const monthName = INDONESIAN_MONTH_NAMES[d.getMonth()];
  const year = d.getFullYear();
  return `${dayName}, ${dateNum} ${monthName} ${year}`;
}

function formatShortDate(d: Date): string {
  const dateNum = d.getDate();
  const monthName = INDONESIAN_SHORT_MONTHS[d.getMonth()];
  const year = d.getFullYear();
  return `${dateNum} ${monthName} ${year}`;
}

function toISODateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function OrderSetupScreen() {
  const { theme, isDark } = useThemeContext();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width >= 768;

  // State 1: Periode Pemesanan
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodMode>('MINGGUAN');

  // State 2: Tanggal Mulai Pemesanan
  const [startDate, setStartDate] = useState<Date>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });

  // State 3: Kategori Menu (Multi-select: array kosong berarti Pilih Manual)
  const [selectedCategories, setSelectedCategories] = useState<BulkCategoryMode[]>([]);

  const handleToggleCategory = (catId: BulkCategoryMode) => {
    setSelectedCategories((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  // Total durasi hari
  const totalDays = selectedPeriod === 'HARIAN' ? 1 : selectedPeriod === 'MINGGUAN' ? 7 : 30;
  const showDeliveryTimeframe = selectedPeriod !== 'HARIAN';

  // Tanggal Selesai
  const endDate = useMemo(() => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + (totalDays - 1));
    return d;
  }, [startDate, totalDays]);

  const dateInputRef = useRef<any>(null);

  const handleOpenDatePicker = () => {
    if (Platform.OS === 'web' && dateInputRef.current) {
      try {
        if (typeof dateInputRef.current.showPicker === 'function') {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.focus();
          dateInputRef.current.click();
        }
      } catch {
        try {
          dateInputRef.current.focus();
          dateInputRef.current.click();
        } catch {}
      }
    }
  };

  const handleProceedToMenu = () => {
    const bulkParam = selectedCategories.length > 0 ? selectedCategories.join(',') : 'MANUAL';
    router.push({
      pathname: '/order-menu',
      params: {
        period: selectedPeriod,
        bulk: bulkParam,
        date: startDate.toISOString(),
      },
    });
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Navbar */}
        <Navbar />

        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* 2. JUDUL HALAMAN */}
          <View style={styles.headerSection}>
            <ThemedText style={styles.subtextStep}>
              Langkah 1 dari 2
            </ThemedText>
            <ThemedText style={[styles.pageTitle, { color: theme.text }]}>
              Konfigurasi Pemesanan MPASI
            </ThemedText>
          </View>

          {/* 3. BAGIAN 1: PILIH PERIODE PEMESANAN */}
          <View
            style={[
              styles.sectionCard,
              isDesktop && styles.sectionCardDesktop,
              {
                backgroundColor: isDark ? '#111722' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              },
            ]}
          >
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Pilih Periode Pemesanan
            </ThemedText>

            <View style={[styles.periodList, isDesktop && styles.periodListDesktop]}>
              {PERIOD_OPTIONS.map((item) => {
                const isSelected = selectedPeriod === item.id;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => setSelectedPeriod(item.id)}
                    style={({ pressed }) => [
                      styles.periodCard,
                      isDesktop && styles.periodCardDesktop,
                      {
                        backgroundColor: isSelected
                          ? (isDark ? 'rgba(249, 115, 22, 0.08)' : '#FFFBF7')
                          : (isDark ? '#161F2E' : '#F8FAFC'),
                        borderColor: isSelected ? '#F97316' : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'),
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    {/* Label Box Durasi di Sudut Kanan Atas seperti Contoh Gambar */}
                    <View
                      style={[
                        styles.periodDurationBadge,
                        {
                          backgroundColor: isSelected
                            ? '#F97316'
                            : (isDark ? '#232D3F' : '#F1F5F9'),
                          borderColor: isSelected
                            ? '#EA580C'
                            : (isDark ? '#334155' : '#E2E8F0'),
                        },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.periodDurationText,
                          {
                            color: isSelected
                              ? '#FFFFFF'
                              : (isDark ? '#94A3B8' : '#64748B'),
                          },
                        ]}
                      >
                        {item.duration}
                      </ThemedText>
                    </View>

                    {/* Nama Periode */}
                    <View style={styles.periodCardContent}>
                      <ThemedText
                        style={[
                          styles.periodCardTitle,
                          { color: isSelected ? '#F97316' : theme.text },
                        ]}
                      >
                        {item.name}
                      </ThemedText>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* 4. BAGIAN 2: TANGGAL MULAI PEMESANAN */}
          <View
            style={[
              styles.sectionCard,
              isDesktop && styles.sectionCardDesktop,
              {
                backgroundColor: isDark ? '#111722' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              },
            ]}
          >
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Tanggal Mulai Pemesanan
            </ThemedText>

            {/* Unified Date & Timeframe Card (Harmonis dengan Tema Brand Oranye) */}
            <View
              style={[
                styles.unifiedDateCard,
                showDeliveryTimeframe
                  ? (isDesktop ? styles.unifiedDateCardDesktop : styles.unifiedDateCardMobile)
                  : styles.unifiedDateCardSingle,
                {
                  backgroundColor: showDeliveryTimeframe
                    ? (isDark ? 'rgba(249, 115, 22, 0.12)' : '#FFF7ED')
                    : (isDark ? '#EA580C' : '#F97316'),
                  borderColor: isDark ? 'rgba(249, 115, 22, 0.35)' : '#FED7AA',
                },
              ]}
            >
              {/* Segmen 1: Pemilihan Tanggal (Brand Orange dengan Sudut Melengkung - Interaktif) */}
              <Pressable
                onPress={handleOpenDatePicker}
                style={({ pressed }) => [
                  styles.datePickerSegment,
                  showDeliveryTimeframe
                    ? (isDesktop ? styles.datePickerSegmentDesktop : styles.datePickerSegmentMobile)
                    : styles.datePickerSegmentFull,
                  {
                    backgroundColor: isDark ? '#EA580C' : '#F97316',
                  },
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.calendarIconWrapper} pointerEvents="none">
                  {Platform.OS === 'web' ? (
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="4" width="18" height="18" rx="3" ry="3" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                      <rect x="7" y="13" width="2" height="2" fill="#FFFFFF" />
                      <rect x="11" y="13" width="2" height="2" fill="#FFFFFF" />
                      <rect x="15" y="13" width="2" height="2" fill="#FFFFFF" />
                      <rect x="7" y="17" width="2" height="2" fill="#FFFFFF" />
                      <rect x="11" y="17" width="2" height="2" fill="#FFFFFF" />
                      <rect x="15" y="17" width="2" height="2" fill="#FFFFFF" />
                    </svg>
                  ) : (
                    <ThemedText style={{ fontSize: 16 }}>📅</ThemedText>
                  )}
                </View>

                <ThemedText style={styles.datePickerText} pointerEvents="none">
                  {formatIndonesianDate(startDate)}
                </ThemedText>

                {/* Native Web Date Picker Overlay */}
                {Platform.OS === 'web' && (
                  <input
                    ref={dateInputRef}
                    type="date"
                    value={toISODateString(startDate)}
                    onClick={(e) => {
                      try {
                        (e.target as any).showPicker?.();
                      } catch {}
                    }}
                    onChange={(e) => {
                      if (e.target.value) {
                        const parts = e.target.value.split('-');
                        const picked = new Date(
                          parseInt(parts[0], 10),
                          parseInt(parts[1], 10) - 1,
                          parseInt(parts[2], 10)
                        );
                        picked.setHours(0, 0, 0, 0);
                        setStartDate(picked);
                      }
                    }}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      width: '100%',
                      height: '100%',
                      opacity: 0,
                      zIndex: 2,
                      cursor: 'pointer',
                    }}
                  />
                )}
              </Pressable>

              {/* Segmen 2: Jangka Waktu Pengantaran (Hanya untuk Mingguan & Bulanan) */}
              {showDeliveryTimeframe && (
                <View
                  style={[
                    styles.deliveryRangeSegment,
                    isDesktop ? styles.deliveryRangeSegmentDesktop : styles.deliveryRangeSegmentMobile,
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.deliveryRangeText,
                      { color: isDark ? '#FB923C' : '#EA580C' },
                    ]}
                  >
                    {formatShortDate(startDate)} → {formatShortDate(endDate)}
                  </ThemedText>
                </View>
              )}
            </View>
          </View>

          {/* 5. BAGIAN 3: KATEGORI MENU */}
          <View
            style={[
              styles.sectionCard,
              isDesktop && styles.sectionCardDesktop,
              {
                backgroundColor: isDark ? '#111722' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
              },
            ]}
          >
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>
              Kategori Menu
            </ThemedText>

            <View style={[styles.bulkList, isDesktop && styles.bulkListDesktop]}>
              {BULK_OPTIONS.map((item) => {
                const isSelected = selectedCategories.includes(item.id);
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => handleToggleCategory(item.id)}
                    style={({ pressed }) => [
                      styles.bulkCard,
                      isDesktop && styles.bulkCardDesktop,
                      {
                        backgroundColor: isSelected
                          ? (isDark ? 'rgba(249, 115, 22, 0.08)' : '#FFFBF7')
                          : (isDark ? '#161F2E' : '#F8FAFC'),
                        borderColor: isSelected ? '#F97316' : (isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0'),
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.bulkCardLabel,
                        { color: isSelected ? '#F97316' : theme.text },
                      ]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </View>

            {/* TIP / INFORMASI TAMBAHAN */}
            <View style={styles.tipInlineRow}>
              <ThemedText style={{ fontSize: 14 }}>💡</ThemedText>
              <ThemedText style={styles.tipInlineText}>
                {selectedCategories.length > 0
                  ? `Kategori ${selectedCategories
                      .map((c) => BULK_OPTIONS.find((b) => b.id === c)?.label || c)
                      .join(', ')} akan diisi otomatis ke dalam menu. Anda tetap dapat mengubahnya di langkah berikutnya.`
                  : 'Tidak ada kategori dipilih (Pilih Manual). Anda bebas memilih menu sendiri di langkah berikutnya.'}
              </ThemedText>
            </View>
          </View>

        </ScrollView>

        {/* 7. STICKY FOOTER BAR (DI ATAS FOOTER UTAMA) */}
        <View
          style={[
            styles.stickyFooterBar,
            {
              backgroundColor: isDark ? '#111722' : '#FFFFFF',
              borderTopColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#E2E8F0',
            },
          ]}
        >
          <View style={styles.stickyFooterInner}>
            <Pressable
              onPress={handleProceedToMenu}
              style={({ pressed }) => [
                styles.stickyActionBtn,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Lanjut ke daftar menu"
            >
              <ThemedText style={styles.stickyActionBtnText}>
                LANJUT
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 20,
  },
  headerSection: {
    gap: 4,
  },
  subtextStep: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    gap: 14,
  },
  sectionCardDesktop: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  periodList: {
    flexDirection: 'column',
    gap: 10,
  },
  periodListDesktop: {
    flexDirection: 'row',
    gap: 12,
  },
  periodCard: {
    borderRadius: 12,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 16,
    overflow: 'hidden',
    position: 'relative',
    cursor: 'pointer' as any,
  },
  periodCardDesktop: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 16,
    paddingHorizontal: 14,
  },
  periodDurationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 11,
    borderBottomLeftRadius: 10,
    borderLeftWidth: 1,
    borderBottomWidth: 1,
  },
  periodDurationText: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  periodCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  periodCardTitle: {
    fontSize: 15,
    fontWeight: '500',
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  unifiedDateCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
  unifiedDateCardMobile: {
    flexDirection: 'column',
  },
  unifiedDateCardDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  unifiedDateCardSingle: {
    flexDirection: 'row',
  },
  datePickerSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 16,
    position: 'relative',
    cursor: 'pointer' as any,
  },
  datePickerSegmentMobile: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 16,
  },
  datePickerSegmentDesktop: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  datePickerSegmentFull: {
    width: '100%',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 16,
  },
  calendarIconWrapper: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  datePickerText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '400',
    flex: 1,
  },
  deliveryRangeSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deliveryRangeSegmentMobile: {
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  deliveryRangeSegmentDesktop: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 18,
  },
  deliveryRangeText: {
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  bulkList: {
    flexDirection: 'column',
    gap: 10,
  },
  bulkListDesktop: {
    flexDirection: 'row',
    gap: 12,
  },
  bulkCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    cursor: 'pointer' as any,
  },
  bulkCardDesktop: {
    flex: 1,
    minWidth: 0,
    paddingVertical: 18,
    paddingHorizontal: 14,
  },
  bulkCardLabel: {
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  tipInlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  tipInlineText: {
    fontSize: 12,
    color: '#64748B',
    flex: 1,
    lineHeight: 18,
  },
  stickyFooterBar: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 40,
  },
  stickyFooterInner: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  stickyActionBtn: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
    shadowColor: '#F97316',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  stickyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});

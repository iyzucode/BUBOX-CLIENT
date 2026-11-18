import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useIsFocused, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { DayMenuCard } from '@/components/order/DayMenuCard';
import { DATE_CHIP_HEIGHT, DateChipsRow, TrackedDay } from '@/components/order/DateChipsRow';
import { MenuDetailModal } from '@/components/order/MenuDetailModal';
import { MultiDateCalendarModal } from '@/components/order/MultiDateCalendarModal';
import { OrderCategoryCard } from '@/components/order/OrderCategoryCard';
import { OrderCheckoutBar } from '@/components/order/OrderCheckoutBar';
import { useLeavePageWarning } from '@/hooks/use-leave-page-warning';
import { useScrollActivity } from '@/hooks/use-scroll-activity';
import { OrderDateCard } from '@/components/order/OrderDateCard';
import { OrderHeroHeader } from '@/components/order/OrderHeroHeader';
import { useOrderPalette } from '@/components/order/orderPalette';
import { MaxContentWidth } from '@/constants/theme';
import { useGetMainCategories, useGetMenuCategories, useGetWeeklyMenu } from '@/features/menu/useMenu';
import { CategoryId, CATEGORY_KEYWORDS, useOrderCart } from '@/features/order/useOrderCart';
import { useDayTracker } from '@/features/order/useDayTracker';
import { useOrderCutoffInfo } from '@/features/order/useOrders';
import { confirmAction, showAlert } from '@/utils/alert';
import { Menu } from '@/types/menu';
import { useCartStore } from '@/store/useCartStore';

// Jarak atas & bawah deretan tanggal saat menempel di atas layar
const PINNED_ROW_PADDING = 8;

export default function OrderScreen() {
  const router = useRouter();
  const palette = useOrderPalette();
  const insets = useSafeAreaInsets();
  const { isScrolling, onScroll } = useScrollActivity();
  const stickyTop = insets.top > 0 ? insets.top : 0;
  const pinnedHeight = stickyTop + DATE_CHIP_HEIGHT + PINNED_ROW_PADDING * 2;
  const { scrollRef, rootRef, chipsRowRef, activeKey, isPinned, registerDay, handleScroll, jumpTo } = useDayTracker(pinnedHeight);

  // 1. Fetch weekly menu and main categories from API
  const { data: weeklyData, isLoading, isError, refetch } = useGetWeeklyMenu();
  const { data: mainCategories } = useGetMainCategories();
  // Semua kategori (utama & pelengkap) untuk judul & urutan kelompok menu per hari
  const { data: allCategories } = useGetMenuCategories();
  // Batas tanggal kirim (cutoff H-N jam X) dari pengaturan admin di server
  const { data: cutoffInfo } = useOrderCutoffInfo();

  // 2. Cart & Selection Logic (default: empty dates)
  const {
    selectedDateKeys,
    orderDates,
    categoryQuantities,
    activeCategories,
    cart,
    allMenusMap,
    grandTotal,
    totalItemsCount,
    handleSetCategoryQuantity,
    handleToggleCategory,
    handleUpdateSelectedDates,
    handleRemoveDate,
    updateItemQty,
    calculateDaySubtotal,
  } = useOrderCart(weeklyData, mainCategories);

  // Pilihan tanggal & menu hanya ada di memori: peringatkan sebelum refresh / tutup tab.
  // Hanya saat layar ini aktif, karena di web layar order tetap terpasang di bawah checkout/payment.
  const isFocused = useIsFocused();
  useLeavePageWarning(isFocused && (selectedDateKeys.length > 0 || totalItemsCount > 0));

  // 3. UI States: Expanded Accordion, Calendar Modal, Menu Detail Modal
  const [expandedDays, setExpandedDays] = useState<Record<string, boolean>>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedDetailMenu, setSelectedDetailMenu] = useState<Menu | null>(null);

  // Accordion toggle handler
  const handleToggleExpand = (key: string) => {
    setExpandedDays((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key], // default was true
    }));
  };

  const setOrderData = useCartStore((s) => s.setOrderData);

  // Status tiap hari untuk strip pelacak & peringatan hari kosong (hitungan sama dengan totalItemsCount)
  const trackedDays: TrackedDay[] = orderDates.map((entry) => ({
    key: entry.key,
    label: entry.formattedChip,
    fullLabel: entry.formattedFull,
    portions: Object.entries(cart[entry.key] ?? {}).reduce(
      (sum, [menuId, qty]) => (allMenusMap.has(menuId) && qty > 0 ? sum + qty : sum),
      0
    ),
  }));
  const emptyDays = trackedDays.filter((d) => d.portions === 0);

  // Buka kartu hari lalu gulir ke sana
  const openDay = (key: string) => {
    setExpandedDays((prev) => ({ ...prev, [key]: true }));
    jumpTo(key);
  };

  // Checkout submission handler
  const handleProceed = async () => {
    if (orderDates.length === 0) {
      showAlert(
        'Tanggal Belum Dipilih',
        'Silakan tentukan minimal 1 hari jadwal katering sebelum melanjutkan pemesanan.',
        { tone: 'warning' }
      );
      return;
    }

    if (totalItemsCount === 0) {
      showAlert(
        'Porsi Belum Dipilih',
        'Silakan pilih minimal 1 porsi menu MPASI sebelum melanjutkan pemesanan.',
        { tone: 'warning' }
      );
      return;
    }

    // Hari yang belum diisi: isi dulu, atau lanjut tanpa hari itu
    if (emptyDays.length > 0) {
      const proceedWithout = await confirmAction(`${emptyDays.length} hari belum ada pesanan menu`, undefined, {
        confirmText: 'Lanjut pesan',
        cancelText: 'Isi dulu',
        tone: 'warning',
      });
      if (!proceedWithout) {
        openDay(emptyDays[0].key);
        return;
      }
    }

    const emptyKeys = new Set(emptyDays.map((d) => d.key));
    const keptDateKeys = selectedDateKeys.filter((k) => !emptyKeys.has(k));

    // Tanggal yang terpilih sebelum cutoff lewat (halaman dibuka lama) harus diganti dulu
    const earliest = cutoffInfo?.earliestDeliveryDate;
    const passed = earliest ? keptDateKeys.filter((k) => k < earliest) : [];
    if (passed.length > 0) {
      showAlert(
        'Batas Pemesanan Lewat',
        `Tanggal ${passed.join(', ')} sudah melewati batas pemesanan (H-${cutoffInfo?.cutoffDaysBefore} pukul ${cutoffInfo?.cutoffTime}). Hapus atau ganti tanggalnya.`,
        { tone: 'warning' }
      );
      return;
    }

    // Convert allMenusMap to Record<string, Menu>
    const menusRecord: Record<string, Menu> = {};
    allMenusMap.forEach((m, id) => {
      menusRecord[id] = m;
    });

    // Hari kosong yang dilewati ikut dihapus dari pilihan tanggal
    emptyDays.forEach((d) => handleRemoveDate(d.key));

    setOrderData({
      selectedDateKeys: keptDateKeys,
      categoryQuantities,
      cart,
      allMenus: menusRecord,
    });

    router.push('/checkout');
  };

  // Helper to get available menus for a specific dayOfWeek filtered by active categories
  const getDisplayedMenusForDay = (dayOfWeek: number, dateKey: string): Menu[] => {
    if (!weeklyData?.days) return [];
    const daySchedule = weeklyData.days.find((d) => d.dayOfWeek === dayOfWeek);
    if (!daySchedule) return [];

    const allDayMenus = [...daySchedule.mainMenus, ...daySchedule.secondaryMenus];
    if (activeCategories.length === 0) {
      return allDayMenus;
    }

    const dayCart = cart[dateKey] || {};

    return allDayMenus.filter((menu) => {
      // 1. Always show secondary menus (Snack / Pelengkap) so parents can add them as complements
      if (menu.menuType === 'SEKUNDER') return true;

      // 2. Always show if already in cart with qty > 0
      if ((dayCart[menu.id] || 0) > 0) return true;

      // 3. Match against active categories
      return activeCategories.some((catKey) => {
        const target = catKey.toLowerCase();
        const catObj = mainCategories?.find((c) => c.id.toLowerCase() === target || c.code.toLowerCase() === target);

        // Match by UUID
        if (menu.categoryId && menu.categoryId.toLowerCase() === target) return true;
        if (catObj && menu.categoryId && menu.categoryId.toLowerCase() === catObj.id.toLowerCase()) return true;

        // Match by Category Name
        const catLower = (menu.category || '').toLowerCase();
        if (catObj && catObj.name && (catLower === catObj.name.toLowerCase() || catLower.includes(catObj.name.toLowerCase()))) {
          return true;
        }
        if (catLower && (catLower === target || target.includes(catLower) || catLower.includes(target))) {
          return true;
        }

        // Match by Fallback Keywords
        const codeOrTarget = (catObj?.code || catKey).toUpperCase();
        const keywords = CATEGORY_KEYWORDS[codeOrTarget] || [];
        const nameLower = (menu.name || '').toLowerCase();
        return keywords.some((kw) => catLower.includes(kw) || nameLower.includes(kw));
      });
    });
  };

  return (
    <View ref={rootRef} collapsable={false} style={[styles.root, { backgroundColor: palette.pageBg }]}>
      <ScrollView
        ref={scrollRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          onScroll();
          handleScroll(event);
        }}
        scrollEventThrottle={16}
      >
        {/* 1. HERO HEADER IMAGE (~200px) WITH CLOSE 'X' & 'PESAN MENU LUANNA' */}
        <OrderHeroHeader selectedPortions={totalItemsCount} />

        {/* 2. OVERLAPPING CONTAINER (marginTop: -55px) */}
        <View style={styles.overlapContainer}>
          {/* Configuration Panel: Both components in ONE single div */}
          <View style={[styles.configPanel, { backgroundColor: palette.panelBg }]}>
            {/* Card 1: Tanggal Pemesanan */}
            <OrderDateCard
              days={trackedDays}
              onOpenCalendar={() => setIsCalendarOpen(true)}
              onSelectDay={openDay}
              chipsRowRef={chipsRowRef}
            />

            {/* Card 2: Kategori Menu */}
            <OrderCategoryCard
              categoryQuantities={categoryQuantities}
              onSetCategoryQuantity={handleSetCategoryQuantity}
              onToggleCategory={handleToggleCategory}
            />
          </View>

          {/* 3. PER-DAY MENU ACCORDION CARDS SECTION */}
          <View style={styles.menuSection}>
            {isLoading ? (
              <View style={styles.loadingWrapper}>
                <ActivityIndicator size="large" color={palette.buttonActiveBg} />
                <ThemedText style={[styles.loadingText, { color: palette.dayMenuSubtext }]}>
                  Memuat daftar menu MPASI harian...
                </ThemedText>
              </View>
            ) : isError ? (
              <View style={[styles.emptyCard, { backgroundColor: palette.cardBg }]}>
                <ThemedText style={[styles.emptyTitle, { color: palette.cardTitle }]}>
                  Gagal Memuat Menu
                </ThemedText>
                <ThemedText style={[styles.emptySubtitle, { color: palette.dayMenuSubtext }]}>
                  Terjadi kendala saat mengambil data menu. Pastikan koneksi server aktif.
                </ThemedText>
                <Pressable
                  onPress={() => refetch()}
                  style={({ pressed }) => [
                    styles.retryButton,
                    { backgroundColor: palette.buttonActiveBg },
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText style={[styles.retryText, { color: palette.buttonActiveText }]}>
                    Coba Lagi
                  </ThemedText>
                </Pressable>
              </View>
            ) : orderDates.length === 0 ? null : (
              orderDates.map((entry) => {
                const isExpanded = expandedDays[entry.key] !== false; // Default true
                const availableMenus = getDisplayedMenusForDay(entry.dayOfWeek, entry.key);
                const dayCart = cart[entry.key] || {};
                const subtotal = calculateDaySubtotal(entry.key);

                return (
                  <View
                    key={entry.key}
                    collapsable={false}
                    ref={(node) => {
                      registerDay(entry.key, node);
                    }}
                  >
                    <DayMenuCard
                      dateEntry={entry}
                      isExpanded={isExpanded}
                      onToggleExpand={() => handleToggleExpand(entry.key)}
                      onRemoveDay={() => handleRemoveDate(entry.key)}
                      availableMenus={availableMenus}
                      dayCart={dayCart}
                      subtotal={subtotal}
                      onUpdateQty={(menuId, delta) => updateItemQty(entry.key, menuId, delta)}
                      onOpenDetailModal={(menu) => setSelectedDetailMenu(menu)}
                      categories={allCategories}
                    />
                  </View>
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* 4. DERETAN TANGGAL MENEMPEL DI ATAS: muncul setelah deretan aslinya tergulir keluar layar */}
      {isPinned && orderDates.length > 0 ? (
        <View
          style={[
            styles.pinnedRow,
            { backgroundColor: palette.cardBg, height: pinnedHeight, paddingTop: stickyTop + PINNED_ROW_PADDING },
          ]}
        >
          <View style={styles.pinnedRowInner}>
            <DateChipsRow days={trackedDays} onSelectDay={openDay} followKey={activeKey ?? orderDates[0].key} />
          </View>
        </View>
      ) : null}

      {/* 5. STICKY BOTTOM CHECKOUT BAR */}
      <OrderCheckoutBar
        totalItemsCount={totalItemsCount}
        filledDaysCount={trackedDays.length - emptyDays.length}
        activeDaysCount={orderDates.length}
        grandTotal={grandTotal}
        onProceed={handleProceed}
        compact={isScrolling}
      />

      {/* 6. MODAL: MULTI-DATE CALENDAR */}
      <MultiDateCalendarModal
        visible={isCalendarOpen}
        selectedDateKeys={selectedDateKeys}
        onClose={() => setIsCalendarOpen(false)}
        onSaveDates={handleUpdateSelectedDates}
        minDateKey={cutoffInfo?.earliestDeliveryDate}
        maxDateKey={cutoffInfo?.latestDeliveryDate}
      />

      {/* 7. MODAL: MENU DETAIL / NUTRITION INFO */}
      <MenuDetailModal
        menu={selectedDetailMenu}
        onClose={() => setSelectedDetailMenu(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 110, // Padding for sticky checkout bar
  },
  overlapContainer: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    marginTop: -55, // Negative margin creates overlapping aesthetic from reference design
    zIndex: 10,
  },
  configPanel: {
    borderRadius: 24,
    padding: 14,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  menuSection: {
    marginTop: 18,
    gap: 14,
  },
  pinnedRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 6px 16px rgba(0, 0, 0, 0.18)',
      },
    }),
  },
  pinnedRowInner: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    // Ditambah jarak bawaan label "N hari" (8), teksnya sejajar dengan tepi kartu di bawahnya (16)
    paddingLeft: 8,
  },
  loadingWrapper: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 290,
  },
  retryButton: {
    marginTop: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    cursor: 'pointer' as any,
  },
  retryText: {
    fontSize: 13,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

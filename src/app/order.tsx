import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { DayMenuCard } from '@/components/order/DayMenuCard';
import { MenuDetailModal } from '@/components/order/MenuDetailModal';
import { MultiDateCalendarModal } from '@/components/order/MultiDateCalendarModal';
import { OrderCategoryCard } from '@/components/order/OrderCategoryCard';
import { OrderCheckoutBar } from '@/components/order/OrderCheckoutBar';
import { OrderDateCard } from '@/components/order/OrderDateCard';
import { OrderHeroHeader } from '@/components/order/OrderHeroHeader';
import { useOrderPalette } from '@/components/order/orderPalette';
import { MaxContentWidth } from '@/constants/theme';
import { useGetMainCategories, useGetWeeklyMenu } from '@/features/menu/useMenu';
import { CategoryId, CATEGORY_KEYWORDS, useOrderCart } from '@/features/order/useOrderCart';
import { Menu } from '@/types/menu';

export default function OrderScreen() {
  const router = useRouter();
  const palette = useOrderPalette();
  const insets = useSafeAreaInsets();
  const stickyTop = insets.top > 0 ? insets.top : 0;

  // 1. Fetch weekly menu and main categories from API
  const { data: weeklyData, isLoading, isError, refetch } = useGetWeeklyMenu();
  const { data: mainCategories } = useGetMainCategories();

  // 2. Cart & Selection Logic (default: empty dates)
  const {
    selectedDateKeys,
    orderDates,
    categoryQuantities,
    activeCategories,
    cart,
    grandTotal,
    totalItemsCount,
    handleSetCategoryQuantity,
    handleToggleCategory,
    handleUpdateSelectedDates,
    handleRemoveDate,
    updateItemQty,
    calculateDaySubtotal,
  } = useOrderCart(weeklyData, mainCategories);

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

  // Checkout submission handler
  const handleProceed = () => {
    if (orderDates.length === 0) {
      Alert.alert(
        'Tanggal Belum Dipilih',
        'Silakan tentukan minimal 1 hari jadwal katering sebelum melanjutkan pemesanan.'
      );
      return;
    }

    if (totalItemsCount === 0) {
      Alert.alert(
        'Porsi Belum Dipilih',
        'Silakan pilih minimal 1 porsi menu MPASI sebelum melanjutkan pemesanan.'
      );
      return;
    }

    Alert.alert(
      'Konfirmasi Pesanan MPASI',
      `Jadwal Katering: ${orderDates.length} Hari\n` +
        `Total Porsi: ${totalItemsCount} Porsi\n` +
        `Total Pembayaran: Rp ${grandTotal.toLocaleString('id-ID')}\n\n` +
        'Lanjutkan proses pesanan?',
      [
        { text: 'Periksa Kembali', style: 'cancel' },
        {
          text: 'Ya, Lanjutkan',
          onPress: () => {
            Alert.alert(
              'Pesanan Diterima',
              'Terima kasih! Pesanan katering MPASI Luanna Anda sedang diproses.'
            );
          },
        },
      ]
    );
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
    <View style={[styles.root, { backgroundColor: palette.pageBg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. HERO HEADER IMAGE (~200px) WITH CLOSE 'X' & 'PESAN MENU LUANNA' */}
        <OrderHeroHeader />

        {/* 2. OVERLAPPING CONTAINER (marginTop: -55px) */}
        <View style={styles.overlapContainer}>
          {/* Configuration Panel: Both components in ONE single div */}
          <View style={[styles.configPanel, { backgroundColor: palette.panelBg }]}>
            {/* Card 1: Tanggal Pemesanan */}
            <OrderDateCard
              orderDates={orderDates}
              onOpenCalendar={() => setIsCalendarOpen(true)}
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
                  <DayMenuCard
                    key={entry.key}
                    dateEntry={entry}
                    isExpanded={isExpanded}
                    onToggleExpand={() => handleToggleExpand(entry.key)}
                    onRemoveDay={() => handleRemoveDate(entry.key)}
                    availableMenus={availableMenus}
                    dayCart={dayCart}
                    subtotal={subtotal}
                    onUpdateQty={(menuId, delta) => updateItemQty(entry.key, menuId, delta)}
                    onOpenDetailModal={(menu) => setSelectedDetailMenu(menu)}
                  />
                );
              })
            )}
          </View>
        </View>
      </ScrollView>

      {/* 4. STICKY BOTTOM CHECKOUT BAR */}
      <OrderCheckoutBar
        totalItemsCount={totalItemsCount}
        activeDaysCount={orderDates.length}
        grandTotal={grandTotal}
        onProceed={handleProceed}
      />

      {/* 5. MODAL: MULTI-DATE CALENDAR */}
      <MultiDateCalendarModal
        visible={isCalendarOpen}
        selectedDateKeys={selectedDateKeys}
        onClose={() => setIsCalendarOpen(false)}
        onSaveDates={handleUpdateSelectedDates}
      />

      {/* 6. MODAL: MENU DETAIL / NUTRITION INFO */}
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
    fontWeight: '800',
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
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

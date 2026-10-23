import React, { useMemo, useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { formatIndonesianDate, parseDateKey } from '@/features/order/dateUtils';
import { useCartStore } from '@/store/useCartStore';
import { useCheckoutPalette } from './checkoutPalette';

type GroupByMode = 'HARI' | 'KATEGORI';

export const OrderItemsSummaryCard: React.FC = () => {
  const palette = useCheckoutPalette();
  const [groupBy, setGroupBy] = useState<GroupByMode>('HARI');
  const [isExpanded, setIsExpanded] = useState(false);

  const selectedDateKeys = useCartStore((s) => s.selectedDateKeys);
  const cart = useCartStore((s) => s.cart);
  const allMenus = useCartStore((s) => s.allMenus);

  // 1. Grouping by Date (Hari)
  const itemsByDate = useMemo(() => {
    return selectedDateKeys.map((dateKey) => {
      const d = parseDateKey(dateKey);
      const dayCart = cart[dateKey] || {};
      const items = Object.entries(dayCart)
        .filter(([_, qty]) => qty > 0)
        .map(([menuId, qty]) => {
          const menu = allMenus[menuId];
          return {
            menuId,
            qty,
            menuName: menu?.name || 'Menu MPASI',
            category: menu?.category || 'Utama',
            price: menu?.price || 0,
            subtotal: (menu?.price || 0) * qty,
          };
        });

      return {
        dateKey,
        formattedDate: formatIndonesianDate(d),
        items,
        totalItems: items.reduce((acc, it) => acc + it.qty, 0),
        daySubtotal: items.reduce((acc, it) => acc + it.subtotal, 0),
      };
    }).filter((group) => group.items.length > 0);
  }, [selectedDateKeys, cart, allMenus]);

  // 2. Grouping by Category (Kategori)
  const itemsByCategory = useMemo(() => {
    const catMap: Record<
      string,
      {
        categoryName: string;
        menus: Record<string, { menuName: string; qty: number; price: number }>;
        totalQty: number;
        subtotal: number;
      }
    > = {};

    selectedDateKeys.forEach((dateKey) => {
      const dayCart = cart[dateKey] || {};
      Object.entries(dayCart).forEach(([menuId, qty]) => {
        if (qty <= 0) return;
        const menu = allMenus[menuId];
        const cat = menu?.category || 'Menu Utama';

        if (!catMap[cat]) {
          catMap[cat] = {
            categoryName: cat,
            menus: {},
            totalQty: 0,
            subtotal: 0,
          };
        }

        if (!catMap[cat].menus[menuId]) {
          catMap[cat].menus[menuId] = {
            menuName: menu?.name || 'Menu MPASI',
            qty: 0,
            price: menu?.price || 0,
          };
        }

        catMap[cat].menus[menuId].qty += qty;
        catMap[cat].totalQty += qty;
        catMap[cat].subtotal += qty * (menu?.price || 0);
      });
    });

    return Object.values(catMap);
  }, [selectedDateKeys, cart, allMenus]);

  const hasItems =
    groupBy === 'HARI' ? itemsByDate.length > 0 : itemsByCategory.length > 0;

  // Visible items limit when collapsed
  const visibleDates = isExpanded ? itemsByDate : itemsByDate.slice(0, 2);
  const visibleCategories = isExpanded ? itemsByCategory : itemsByCategory.slice(0, 2);

  return (
    <View style={[styles.card, { backgroundColor: palette.cardBg }]}>
      {/* 1. Header with Segmented Toggle on the Right */}
      <View style={styles.headerRow}>
        <ThemedText style={[styles.cardTitle, { color: palette.cardTitle }]}>
          Pesananmu
        </ThemedText>

        <View style={styles.toggleWrapper}>
          <ThemedText style={[styles.toggleLabel, { color: palette.cardSubtext }]}>
            Berdasarkan
          </ThemedText>

          <View style={[styles.segmentedBox, { backgroundColor: palette.segmentedBg }]}>
            {/* Hari Button */}
            <Pressable
              onPress={() => setGroupBy('HARI')}
              style={[
                styles.segmentBtn,
                groupBy === 'HARI' && [
                  styles.segmentBtnActive,
                  { backgroundColor: palette.segmentedActiveBg },
                ],
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: groupBy === 'HARI' }}
            >
              <ThemedText
                style={[
                  styles.segmentText,
                  {
                    color:
                      groupBy === 'HARI'
                        ? palette.segmentedActiveText
                        : palette.segmentedText,
                  },
                ]}
              >
                Hari
              </ThemedText>
            </Pressable>

            {/* Kategori Button */}
            <Pressable
              onPress={() => setGroupBy('KATEGORI')}
              style={[
                styles.segmentBtn,
                groupBy === 'KATEGORI' && [
                  styles.segmentBtnActive,
                  { backgroundColor: palette.segmentedActiveBg },
                ],
              ]}
              accessibilityRole="tab"
              accessibilityState={{ selected: groupBy === 'KATEGORI' }}
            >
              <ThemedText
                style={[
                  styles.segmentText,
                  {
                    color:
                      groupBy === 'KATEGORI'
                        ? palette.segmentedActiveText
                        : palette.segmentedText,
                  },
                ]}
              >
                Kategori
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>

      {/* 2. Items Content List */}
      <View style={styles.contentArea}>
        {!hasItems ? (
          <View style={styles.emptyBox}>
            <ThemedText style={[styles.emptyText, { color: palette.cardSubtext }]}>
              Belum ada menu yang dipilih dalam keranjang.
            </ThemedText>
          </View>
        ) : groupBy === 'HARI' ? (
          /* ==========================================
             View Mode: Grouped by Date (Hari)
             ========================================== */
          <View style={styles.groupsContainer}>
            {visibleDates.map((group) => (
              <View key={group.dateKey} style={styles.dateGroupCard}>
                <View style={[styles.groupHeader, { borderBottomColor: palette.dividerColor }]}>
                  <ThemedText style={[styles.dateTitle, { color: palette.cardTitle }]}>
                    📅 {group.formattedDate}
                  </ThemedText>
                  <ThemedText style={[styles.groupBadge, { color: palette.cardSubtext }]}>
                    {group.totalItems} Porsi
                  </ThemedText>
                </View>

                {group.items.map((item) => (
                  <View key={item.menuId} style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <ThemedText style={[styles.itemName, { color: palette.cardTitle }]}>
                        {item.menuName}
                      </ThemedText>
                      <ThemedText style={[styles.itemSub, { color: palette.cardSubtext }]}>
                        {item.category} • {item.qty}x @ Rp {item.price.toLocaleString('id-ID')}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.itemPrice, { color: palette.cardTitle }]}>
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ))}
          </View>
        ) : (
          /* ==========================================
             View Mode: Grouped by Category (Kategori)
             ========================================== */
          <View style={styles.groupsContainer}>
            {visibleCategories.map((group) => (
              <View key={group.categoryName} style={styles.dateGroupCard}>
                <View style={[styles.groupHeader, { borderBottomColor: palette.dividerColor }]}>
                  <ThemedText style={[styles.dateTitle, { color: palette.cardTitle }]}>
                    🥣 {group.categoryName}
                  </ThemedText>
                  <ThemedText style={[styles.groupBadge, { color: palette.cardSubtext }]}>
                    Total {group.totalQty} Porsi
                  </ThemedText>
                </View>

                {Object.values(group.menus).map((menu, idx) => (
                  <View key={`cat-menu-${idx}`} style={styles.itemRow}>
                    <View style={styles.itemLeft}>
                      <ThemedText style={[styles.itemName, { color: palette.cardTitle }]}>
                        {menu.menuName}
                      </ThemedText>
                      <ThemedText style={[styles.itemSub, { color: palette.cardSubtext }]}>
                        {menu.qty} Porsi
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.itemPrice, { color: palette.cardTitle }]}>
                      Rp {(menu.qty * menu.price).toLocaleString('id-ID')}
                    </ThemedText>
                  </View>
                ))}
              </View>
            ))}
          </View>
        )}
      </View>

      {/* 3. Bottom Expand Link: Lebih lengkap -> */}
      {(itemsByDate.length > 2 || itemsByCategory.length > 2) && (
        <Pressable
          onPress={() => setIsExpanded((prev) => !prev)}
          style={styles.moreLinkRow}
        >
          <ThemedText style={[styles.moreLinkText, { color: palette.cardTitle }]}>
            {isExpanded ? 'Tampilkan lebih sedikit ↑' : 'Lebih lengkap →'}
          </ThemedText>
        </Pressable>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  toggleWrapper: {
    alignItems: 'center',
    gap: 2,
  },
  toggleLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  segmentedBox: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 2,
    alignItems: 'center',
  },
  segmentBtn: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  segmentBtnActive: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12)',
      } as any,
    }),
  },
  segmentText: {
    fontSize: 12,
    fontWeight: '500',
  },
  contentArea: {
    minHeight: 100,
  },
  emptyBox: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  groupsContainer: {
    gap: 16,
  },
  dateGroupCard: {
    borderRadius: 14,
    gap: 8,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 6,
    borderBottomWidth: 1,
  },
  dateTitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  groupBadge: {
    fontSize: 11,
    fontWeight: '500',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  itemLeft: {
    flex: 1,
    paddingRight: 8,
  },
  itemName: {
    fontSize: 13,
    fontWeight: '500',
  },
  itemSub: {
    fontSize: 11,
    marginTop: 1,
  },
  itemPrice: {
    fontSize: 13,
    fontWeight: '500',
  },
  moreLinkRow: {
    alignSelf: 'flex-end',
    paddingVertical: 4,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  moreLinkText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

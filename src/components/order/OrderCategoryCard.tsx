import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useGetMainCategories } from '@/features/menu/useMenu';
import { CategoryId } from '@/features/order/useOrderCart';
import { useOrderPalette } from './orderPalette';

interface OrderCategoryCardProps {
  categoryQuantities: Record<string, number>;
  onSetCategoryQuantity: (catId: CategoryId, qty: number) => void;
  onToggleCategory?: (catId: CategoryId) => void;
}

export const OrderCategoryCard: React.FC<OrderCategoryCardProps> = ({
  categoryQuantities,
  onSetCategoryQuantity,
  onToggleCategory,
}) => {
  const palette = useOrderPalette();
  const { data: mainCategories, isLoading } = useGetMainCategories();

  return (
    <View style={[styles.card, { backgroundColor: palette.cardBg }]}>
      {/* Header Row: Category / Menu Icon Box + Title */}
      <View style={styles.headerRow}>
        <View style={[styles.iconBox, { backgroundColor: palette.iconBoxBg }]}>
          {Platform.OS === 'web' ? (
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke={palette.iconColor}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="4" y1="6" x2="20" y2="6" strokeWidth="2.8" />
              <line x1="4" y1="12" x2="20" y2="12" strokeWidth="2.8" />
              <line x1="4" y1="18" x2="20" y2="18" strokeWidth="2.8" />
            </svg>
          ) : (
            <ThemedText style={{ fontSize: 16 }}>☰</ThemedText>
          )}
        </View>

        <ThemedText style={[styles.title, { color: palette.cardTitle }]}>
          Kategori menu
        </ThemedText>
      </View>

      {/* Dynamic Stack of Category Options with Custom Portion Controls */}
      {isLoading ? (
        <View style={styles.loadingWrapper}>
          <ActivityIndicator size="small" color={palette.buttonActiveBg} />
        </View>
      ) : (
        <View style={styles.categoryList}>
          {mainCategories?.map((item) => {
            const currentQty =
              categoryQuantities[item.id] ?? (categoryQuantities[item.code] ?? 0);
            const isSelected = currentQty > 0;

            if (!isSelected) {
              return (
                <Pressable
                  key={item.id}
                  onPress={() => onSetCategoryQuantity(item.id, 1)}
                  style={({ pressed }) => [
                    styles.categoryBtn,
                    { backgroundColor: palette.buttonBg },
                    pressed && styles.pressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Pilih kategori ${item.name}`}
                  accessibilityState={{ selected: false }}
                >
                  <ThemedText
                    style={[
                      styles.categoryBtnText,
                      { color: palette.buttonText },
                    ]}
                  >
                    {item.name}
                  </ThemedText>
                </Pressable>
              );
            }

            return (
              <View
                key={item.id}
                style={[
                  styles.categoryActiveRow,
                  { backgroundColor: palette.buttonActiveBg },
                ]}
              >
                {/* Left: Category Info with clickable area to toggle off */}
                <Pressable
                  onPress={() => onSetCategoryQuantity(item.id, 0)}
                  style={styles.activeLeftInfo}
                  accessibilityRole="button"
                  accessibilityLabel={`Non-aktifkan kategori ${item.name}`}
                >
                  <View style={styles.activeNameContainer}>
                    <ThemedText
                      style={[
                        styles.activeCategoryName,
                        { color: palette.buttonActiveText },
                      ]}
                      numberOfLines={1}
                    >
                      {item.name}
                    </ThemedText>
                    <ThemedText
                      style={[
                        styles.portionSubtext,
                        { color: 'rgba(255, 255, 255, 0.88)' },
                      ]}
                    >
                      {currentQty} porsi / hari
                    </ThemedText>
                  </View>
                </Pressable>

                {/* Right: Integrated Stepper Control [ - ] [ Qty ] [ + ] */}
                <View style={styles.stepperContainer}>
                  {/* Minus Button */}
                  <Pressable
                    onPress={() =>
                      onSetCategoryQuantity(item.id, Math.max(0, currentQty - 1))
                    }
                    style={({ pressed }) => [
                      styles.stepperActionBtn,
                      pressed && styles.stepperPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Kurangi porsi ${item.name}`}
                    hitSlop={6}
                  >
                    <ThemedText
                      style={[
                        styles.stepperActionIcon,
                        { color: palette.buttonActiveBg },
                      ]}
                    >
                      −
                    </ThemedText>
                  </Pressable>

                  {/* Quantity Display */}
                  <View style={styles.portionCountBadge}>
                    <ThemedText style={styles.portionCountText}>
                      {currentQty}
                    </ThemedText>
                  </View>

                  {/* Plus Button */}
                  <Pressable
                    onPress={() =>
                      onSetCategoryQuantity(
                        item.id,
                        Math.min(20, currentQty + 1)
                      )
                    }
                    style={({ pressed }) => [
                      styles.stepperActionBtn,
                      pressed && styles.stepperPressed,
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Tambah porsi ${item.name}`}
                    hitSlop={6}
                  >
                    <ThemedText
                      style={[
                        styles.stepperActionIcon,
                        { color: palette.buttonActiveBg },
                      ]}
                    >
                      +
                    </ThemedText>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
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
  categoryList: {
    gap: 10,
  },
  loadingWrapper: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBtn: {
    width: '100%',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  categoryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryActiveRow: {
    width: '100%',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 50,
  },
  activeLeftInfo: {
    flex: 1,
    paddingRight: 8,
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  activeNameContainer: {
    gap: 2,
  },
  activeCategoryName: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  portionSubtext: {
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperActionBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
      default: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.15,
        shadowRadius: 2,
        elevation: 2,
      },
    }),
  },
  stepperActionIcon: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
  portionCountBadge: {
    minWidth: 26,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  portionCountText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  stepperPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});

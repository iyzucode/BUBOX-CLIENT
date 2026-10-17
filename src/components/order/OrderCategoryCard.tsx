import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { CategoryId } from '@/features/order/useOrderCart';
import { useOrderPalette } from './orderPalette';

interface CategoryOption {
  id: CategoryId;
  label: string;
}

const CATEGORY_OPTIONS: CategoryOption[] = [
  { id: 'BUBUR', label: 'Bubur' },
  { id: 'NASI_TIM', label: 'Nasi Tim' },
  { id: 'SUP', label: 'Sup' },
];

interface OrderCategoryCardProps {
  activeCategories: CategoryId[];
  onToggleCategory: (catId: CategoryId) => void;
}

export const OrderCategoryCard: React.FC<OrderCategoryCardProps> = ({
  activeCategories,
  onToggleCategory,
}) => {
  const palette = useOrderPalette();

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

      {/* Vertical Stack of Category Options (Bubur, Nasi Tim, Sup) */}
      <View style={styles.categoryList}>
        {CATEGORY_OPTIONS.map((item) => {
          const isSelected = activeCategories.includes(item.id);

          return (
            <Pressable
              key={item.id}
              onPress={() => onToggleCategory(item.id)}
              style={({ pressed }) => [
                styles.categoryBtn,
                {
                  backgroundColor: isSelected
                    ? palette.buttonActiveBg
                    : palette.buttonBg,
                },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Pilih kategori ${item.label}`}
              accessibilityState={{ selected: isSelected }}
            >
              <ThemedText
                style={[
                  styles.categoryBtnText,
                  {
                    color: isSelected
                      ? palette.buttonActiveText
                      : palette.buttonText,
                  },
                ]}
              >
                {item.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
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
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
});

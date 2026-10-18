import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { DateEntry } from '@/features/order/useOrderCart';
import { Menu } from '@/types/menu';
import { useOrderPalette } from './orderPalette';

interface DayMenuCardProps {
  dateEntry: DateEntry;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onRemoveDay: () => void;
  availableMenus: Menu[];
  dayCart: Record<string, number>;
  subtotal: number;
  onUpdateQty: (menuId: string, deltaOrValue: number | string) => void;
  onOpenDetailModal: (menu: Menu) => void;
}

export const DayMenuCard: React.FC<DayMenuCardProps> = ({
  dateEntry,
  isExpanded,
  onToggleExpand,
  onRemoveDay,
  availableMenus,
  dayCart,
  subtotal,
  onUpdateQty,
  onOpenDetailModal,
}) => {
  const palette = useOrderPalette();

  return (
    <View style={styles.cardWrapper}>
      {/* 1. Header Bar: Full Date + [▲] + [X] Actions */}
      <View
        style={[
          styles.headerBar,
          {
            backgroundColor: palette.dayHeaderBg,
          },
        ]}
      >
        <Pressable
          onPress={onToggleExpand}
          style={styles.headerTitlePressable}
          accessibilityRole="button"
          accessibilityLabel={`Buka tutup menu ${dateEntry.formattedFull}`}
        >
          <ThemedText style={[styles.headerDateText, { color: palette.dayHeaderText }]}>
            {dateEntry.formattedFull}
          </ThemedText>
        </Pressable>

        {/* Action Buttons: [▲] and [X] */}
        <View style={styles.actionButtonsRow}>
          {/* Toggle Accordion [▲] */}
          <Pressable
            onPress={onToggleExpand}
            style={({ pressed }) => [
              styles.circleBtn,
              { backgroundColor: palette.dayActionBtnBg },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={isExpanded ? 'Tutup rincian' : 'Buka rincian'}
            hitSlop={6}
          >
            <ThemedText
              style={[
                styles.triangleIcon,
                { color: palette.dayActionBtnIcon },
                !isExpanded && styles.triangleRotated,
              ]}
            >
              ▲
            </ThemedText>
          </Pressable>

          {/* Remove Day [X] */}
          <Pressable
            onPress={onRemoveDay}
            style={({ pressed }) => [
              styles.circleBtn,
              { backgroundColor: palette.dayActionBtnBg },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Hapus hari ${dateEntry.formattedFull}`}
            hitSlop={6}
          >
            <ThemedText style={[styles.closeIcon, { color: palette.dayActionBtnIcon }]}>
              ✕
            </ThemedText>
          </Pressable>
        </View>
      </View>

      {/* 2. Card Body: Menu list + Steppers + Dashed line + Subtotal */}
      <View
        style={[
          styles.body,
          !isExpanded && styles.bodyCollapsed,
          {
            backgroundColor: palette.dayBodyBg,
          },
        ]}
      >
        {isExpanded ? (
          <View style={styles.expandedContent}>
            {/* List of Dishes */}
            <View style={styles.menuItemsList}>
              {availableMenus.length === 0 ? (
                <View style={styles.emptyNotice}>
                  <ThemedText style={[styles.emptyNoticeText, { color: palette.dayMenuSubtext }]}>
                    Belum ada hidangan terdaftar untuk hari ini.
                  </ThemedText>
                </View>
              ) : (
                availableMenus.map((menu) => {
                  const currentQty = dayCart[menu.id] || 0;
                  const isUtama = menu.menuType === 'UTAMA';

                  return (
                    <View key={menu.id} style={styles.menuItemRow}>
                      {/* Left: Dish info (click to view details) */}
                      <Pressable
                        onPress={() => onOpenDetailModal(menu)}
                        style={styles.menuInfoPressable}
                        accessibilityRole="button"
                        accessibilityLabel={`Lihat rincian ${menu.name}`}
                      >
                        <View style={styles.menuTitleRow}>
                          <ThemedText style={{ fontSize: 13 }}>
                            {isUtama ? '🍲' : '🥗'}
                          </ThemedText>
                          <ThemedText
                            style={[styles.menuName, { color: palette.dayMenuText }]}
                            numberOfLines={1}
                          >
                            {menu.name}
                          </ThemedText>
                        </View>
                        <ThemedText
                          style={[styles.menuPrice, { color: palette.dayMenuSubtext }]}
                        >
                          ↳ Rp{Number(menu.price).toLocaleString('id-ID')}
                        </ThemedText>
                      </Pressable>

                      {/* Right: Quantity Stepper */}
                      <View style={styles.qtyControlRow}>
                        <Pressable
                          onPress={() => onUpdateQty(menu.id, -1)}
                          disabled={currentQty === 0}
                          style={({ pressed }) => [
                            styles.stepperBtn,
                            {
                              borderColor: palette.stepperBorder,
                              backgroundColor: palette.stepperBg,
                              opacity: currentQty === 0 ? 0.35 : 1,
                            },
                            pressed && currentQty > 0 && styles.pressed,
                          ]}
                          accessibilityLabel="Kurangi porsi"
                        >
                          <ThemedText
                            style={[styles.stepperBtnText, { color: palette.stepperText }]}
                          >
                            −
                          </ThemedText>
                        </Pressable>

                        <TextInput
                          style={[
                            styles.qtyInput,
                            {
                              borderColor:
                                currentQty > 0
                                  ? palette.stepperActiveBorder
                                  : palette.stepperBorder,
                              backgroundColor:
                                currentQty > 0
                                  ? palette.stepperActiveBg
                                  : palette.stepperBg,
                              color:
                                currentQty > 0
                                  ? palette.stepperActiveText
                                  : palette.stepperText,
                            },
                          ]}
                          keyboardType="numeric"
                          value={String(currentQty)}
                          onChangeText={(val) => onUpdateQty(menu.id, val)}
                          selectTextOnFocus
                        />

                        <Pressable
                          onPress={() => onUpdateQty(menu.id, 1)}
                          style={({ pressed }) => [
                            styles.stepperBtn,
                            {
                              borderColor: palette.stepperActiveBorder,
                              backgroundColor: palette.stepperActiveBg,
                            },
                            pressed && styles.pressed,
                          ]}
                          accessibilityLabel="Tambah porsi"
                        >
                          <ThemedText
                            style={[
                              styles.stepperBtnText,
                              { color: palette.stepperActiveText },
                            ]}
                          >
                            +
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  );
                })
              )}
            </View>

            {/* Dashed line divider */}
            <View
              style={[
                styles.dashedDivider,
                { borderBottomColor: palette.dashedDivider },
              ]}
            />

            {/* Subtotal "Rp XXX" */}
            <View style={styles.subtotalRow}>
              <ThemedText style={[styles.subtotalText, { color: palette.priceText }]}>
                Rp {subtotal.toLocaleString('id-ID')}
              </ThemedText>
            </View>
          </View>
        ) : (
          /* Collapsed state: just show subtotal cleanly */
          <Pressable onPress={onToggleExpand} style={styles.collapsedContent}>
            <ThemedText style={[styles.subtotalText, { color: palette.priceText }]}>
              Rp {subtotal.toLocaleString('id-ID')}
            </ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 14,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  headerTitlePressable: {
    flex: 1,
    paddingVertical: 2,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  headerDateText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  triangleIcon: {
    fontSize: 10,
    fontWeight: '800',
    marginTop: -1,
  },
  triangleRotated: {
    transform: [{ rotate: '180deg' }],
  },
  closeIcon: {
    fontSize: 11,
    fontWeight: '800',
  },
  body: {
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  bodyCollapsed: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  expandedContent: {
    gap: 12,
  },
  collapsedContent: {
    paddingVertical: 2,
    alignItems: 'flex-start',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  menuItemsList: {
    gap: 10,
  },
  emptyNotice: {
    paddingVertical: 12,
  },
  emptyNoticeText: {
    fontSize: 13,
    fontStyle: 'italic',
  },
  menuItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 4,
  },
  menuInfoPressable: {
    flex: 1,
    minWidth: 0,
    gap: 2,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  menuTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  menuName: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  menuPrice: {
    fontSize: 12,
    fontWeight: '500',
    paddingLeft: 20,
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  stepperBtnText: {
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  qtyInput: {
    width: 38,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    padding: 0,
  },
  dashedDivider: {
    borderBottomWidth: 1.5,
    borderStyle: 'dashed',
    marginVertical: 4,
  },
  subtotalRow: {
    alignItems: 'flex-start',
    paddingTop: 2,
  },
  subtotalText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});

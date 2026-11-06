import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { DateEntry } from '@/features/order/useOrderCart';
import { Menu } from '@/types/menu';
import { ConfirmRemoveButton } from './ConfirmRemoveButton';
import { useOrderPalette } from './orderPalette';

const FALLBACK_IMAGE = require('@/assets/images/baby-puree-fallback.jpg');

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
  const hasSelectedItems = Object.values(dayCart).some((qty) => qty > 0);

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
          <ThemedText style={[styles.headerDateText, { color: palette.dayHeaderText }]} numberOfLines={1}>
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

          {/* Remove Day [X]: minta konfirmasi bila sudah ada menu yang dipilih */}
          <ConfirmRemoveButton
            requireConfirm={hasSelectedItems}
            onConfirm={onRemoveDay}
            backgroundColor={palette.dayActionBtnBg}
            color={palette.dayActionBtnIcon}
            accessibilityLabel={`Hapus hari ${dateEntry.formattedFull}`}
          />
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
                availableMenus.map((menu, index) => {
                  const currentQty = dayCart[menu.id] || 0;

                  return (
                    <View
                      key={menu.id}
                      style={[
                        styles.menuItemRow,
                        // Garis tipis pemisah antarmenu (tidak untuk menu pertama)
                        index > 0 && [styles.menuItemSeparator, { borderTopColor: palette.dashedDivider }],
                      ]}
                    >
                      {/* Atas: Dish info selebar penuh (click to view details) */}
                      <Pressable
                        onPress={() => onOpenDetailModal(menu)}
                        style={styles.menuInfoPressable}
                        accessibilityRole="button"
                        accessibilityLabel={`Lihat rincian ${menu.name}`}
                      >
                        {/* Foto 1:1 setinggi 1 baris nama + 1 baris harga (tetap walau nama 2 baris) */}
                        <Image
                          source={menu.imageUrl ? { uri: menu.imageUrl } : FALLBACK_IMAGE}
                          placeholder={FALLBACK_IMAGE}
                          style={[styles.menuThumb, { backgroundColor: palette.stepperBg }]}
                          contentFit="cover"
                          accessibilityLabel={menu.name}
                        />
                        <View style={styles.menuTextCol}>
                          <ThemedText
                            style={[styles.menuName, { color: palette.dayMenuText }]}
                            numberOfLines={2}
                          >
                            {menu.name}
                          </ThemedText>
                          <ThemedText
                            style={[styles.menuPrice, { color: palette.dayMenuSubtext }]}
                          >
                            ↳ Rp{Number(menu.price).toLocaleString('id-ID')}
                          </ThemedText>
                        </View>
                      </Pressable>

                      {/* Bawah, rata kanan: Quantity Stepper (− dan jumlah hanya tampil bila porsi > 0) */}
                      <View style={styles.qtyControlRow}>
                        {currentQty > 0 ? (
                          <>
                            <Pressable
                              onPress={() => onUpdateQty(menu.id, -1)}
                              style={({ pressed }) => [
                                styles.stepperBtn,
                                {
                                  borderColor: palette.stepperBorder,
                                  backgroundColor: palette.stepperBg,
                                },
                                pressed && styles.pressed,
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
                                  borderColor: palette.stepperActiveBorder,
                                  backgroundColor: palette.stepperActiveBg,
                                  color: palette.stepperActiveText,
                                },
                              ]}
                              keyboardType="numeric"
                              value={String(currentQty)}
                              // Isi kosong diabaikan agar input tidak langsung hilang saat angka dihapus untuk diganti
                              onChangeText={(val) => {
                                if (val.trim() !== '') onUpdateQty(menu.id, val);
                              }}
                              selectTextOnFocus
                              accessibilityLabel="Jumlah porsi"
                            />
                          </>
                        ) : null}

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

// Tinggi foto = 1 baris nama + jarak + 1 baris harga (nama 2 baris tidak mengubah ukuran foto)
const MENU_NAME_LINE_HEIGHT = 20;
const MENU_PRICE_LINE_HEIGHT = 16;
const MENU_TEXT_GAP = 2;
const MENU_THUMB_SIZE = MENU_NAME_LINE_HEIGHT + MENU_TEXT_GAP + MENU_PRICE_LINE_HEIGHT; // 38

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
    fontWeight: '500',
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
    fontWeight: '500',
    marginTop: -1,
  },
  triangleRotated: {
    transform: [{ rotate: '180deg' }],
  },
  closeIcon: {
    fontSize: 11,
    fontWeight: '500',
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
    gap: 0, // jarak antarmenu diatur oleh padding + garis pemisah di menuItemRow
  },
  emptyNotice: {
    paddingVertical: 12,
  },
  emptyNoticeText: {
    fontSize: 13,
  },
  // Baris menu: info (foto + nama + harga) selebar penuh, stepper di bawahnya rata kanan
  menuItemRow: {
    flexDirection: 'column',
    gap: 6,
    paddingVertical: 10,
  },
  menuItemSeparator: {
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  menuInfoPressable: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  menuThumb: {
    width: MENU_THUMB_SIZE,
    height: MENU_THUMB_SIZE, // 1:1
    borderRadius: 8,
  },
  menuTextCol: {
    flex: 1,
    minWidth: 0,
    gap: MENU_TEXT_GAP,
  },
  menuName: {
    fontSize: 14,
    lineHeight: MENU_NAME_LINE_HEIGHT,
    fontWeight: '500',
  },
  menuPrice: {
    fontSize: 12,
    lineHeight: MENU_PRICE_LINE_HEIGHT,
    fontWeight: '500',
  },
  qtyControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
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
    fontWeight: '500',
    lineHeight: 18,
  },
  qtyInput: {
    width: 38,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
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
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});

import React, { useMemo } from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Image } from 'expo-image';

import { ThemedText } from '@/components/themed-text';
import { groupByCategory } from '@/features/menu/categoryOrder';
import { Menu, MenuCategory } from '@/types/menu';
import { useOrderPalette } from './orderPalette';

const FALLBACK_IMAGE = require('@/assets/images/baby-puree-fallback.jpg');

interface DayMenuPanelProps {
  availableMenus: Menu[];
  dayCart: Record<string, number>;
  /** Semua kategori (utama & pelengkap) untuk judul & urutan kelompok menu. */
  categories?: MenuCategory[];
  onUpdateQty: (menuId: string, deltaOrValue: number | string) => void;
  onOpenDetailModal: (menu: Menu) => void;
}

const formatRupiah = (value: number) => `Rp ${Number(value).toLocaleString('id-ID')}`;

/** Isi satu hari pada layar order: menu per kategori. Hari dipilih lewat tab di atasnya. */
export const DayMenuPanel: React.FC<DayMenuPanelProps> = ({
  availableMenus,
  dayCart,
  categories,
  onUpdateQty,
  onOpenDetailModal,
}) => {
  const palette = useOrderPalette();
  const groups = useMemo(
    () => groupByCategory(availableMenus, (m) => ({ id: m.categoryId, name: m.category }), categories),
    [availableMenus, categories]
  );

  return (
    <View>
      <View style={[styles.body, { backgroundColor: palette.dayBodyBg }]}>
        {availableMenus.length === 0 ? (
          <ThemedText style={[styles.emptyText, { color: palette.dayMenuSubtext }]}>
            Belum ada hidangan terdaftar untuk hari ini.
          </ThemedText>
        ) : (
          groups.map((group) => (
            <View key={group.key} style={styles.group}>
              <ThemedText
                style={[styles.groupTitle, { color: palette.dayMenuText, borderBottomColor: palette.dashedDivider }]}
                accessibilityRole="header"
              >
                {group.label}
              </ThemedText>
              {group.items.map((menu, index) => (
                <MenuItemRow
                  key={menu.id}
                  menu={menu}
                  qty={dayCart[menu.id] || 0}
                  isFirst={index === 0}
                  onUpdateQty={(value) => onUpdateQty(menu.id, value)}
                  onOpenDetail={() => onOpenDetailModal(menu)}
                />
              ))}
            </View>
          ))
        )}
      </View>
    </View>
  );
};

interface MenuItemRowProps {
  menu: Menu;
  qty: number;
  isFirst: boolean;
  onUpdateQty: (deltaOrValue: number | string) => void;
  onOpenDetail: () => void;
}

/** Satu menu: nama, deskripsi & harga di kiri; foto + tombol Tambah (berubah jadi − n +) di kanan. */
const MenuItemRow: React.FC<MenuItemRowProps> = ({ menu, qty, isFirst, onUpdateQty, onOpenDetail }) => {
  const palette = useOrderPalette();

  return (
    <View style={[styles.item, !isFirst && [styles.itemSeparator, { borderTopColor: palette.dashedDivider }]]}>
      <Pressable
        onPress={onOpenDetail}
        style={styles.itemInfo}
        accessibilityRole="button"
        accessibilityLabel={`Lihat rincian ${menu.name}`}
      >
        <ThemedText style={[styles.itemName, { color: palette.dayMenuText }]} numberOfLines={2}>
          {menu.name}
        </ThemedText>
        {menu.description ? (
          <ThemedText style={[styles.itemDesc, { color: palette.dayMenuSubtext }]} numberOfLines={2}>
            {menu.description}
          </ThemedText>
        ) : null}
        <ThemedText style={[styles.itemPrice, { color: palette.dayMenuText }]}>{formatRupiah(menu.price)}</ThemedText>
      </Pressable>

      <View style={styles.itemSide}>
        <Pressable onPress={onOpenDetail} accessibilityLabel={`Foto ${menu.name}`}>
          <Image
            source={menu.imageUrl ? { uri: menu.imageUrl } : FALLBACK_IMAGE}
            placeholder={FALLBACK_IMAGE}
            style={[styles.itemImage, { backgroundColor: palette.stepperBg }]}
            contentFit="cover"
          />
        </Pressable>

        {qty > 0 ? (
          <View style={[styles.stepper, { borderColor: palette.stepperActiveBorder, backgroundColor: palette.stepperBg }]}>
            <Pressable
              onPress={() => onUpdateQty(-1)}
              style={({ pressed }) => [styles.stepperBtn, { backgroundColor: palette.stepperActiveBg }, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Kurangi porsi ${menu.name}`}
              hitSlop={4}
            >
              <ThemedText style={[styles.stepperBtnText, { color: palette.stepperActiveText }]}>−</ThemedText>
            </Pressable>
            <TextInput
              style={[styles.qtyInput, { color: palette.dayMenuText }]}
              keyboardType="numeric"
              value={String(qty)}
              // Isi kosong diabaikan agar input tidak langsung hilang saat angka dihapus untuk diganti
              onChangeText={(val) => {
                if (val.trim() !== '') onUpdateQty(val);
              }}
              selectTextOnFocus
              accessibilityLabel={`Jumlah porsi ${menu.name}`}
            />
            <Pressable
              onPress={() => onUpdateQty(1)}
              style={({ pressed }) => [styles.stepperBtn, { backgroundColor: palette.stepperActiveBg }, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel={`Tambah porsi ${menu.name}`}
              hitSlop={4}
            >
              <ThemedText style={[styles.stepperBtnText, { color: palette.stepperActiveText }]}>+</ThemedText>
            </Pressable>
          </View>
        ) : (
          <Pressable
            onPress={() => onUpdateQty(1)}
            style={({ pressed }) => [
              styles.addButton,
              { borderColor: palette.stepperActiveBorder, backgroundColor: palette.stepperBg },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Tambah ${menu.name}`}
          >
            <ThemedText style={[styles.addText, { color: palette.stepperActiveText }]}>Tambah</ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const IMAGE_SIZE = 96;
const WEB_POINTER = Platform.select({ web: { cursor: 'pointer' as const } });

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  emptyText: {
    fontSize: 13,
    paddingVertical: 16,
  },
  group: {
    marginTop: 10,
  },
  groupTitle: {
    fontSize: 17,
    fontWeight: '700',
    paddingBottom: 8,
    borderBottomWidth: 1,
  },
  item: {
    flexDirection: 'row',
    gap: 14,
    paddingVertical: 14,
  },
  itemSeparator: {
    borderTopWidth: 1,
    borderStyle: 'dashed',
  },
  itemInfo: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    ...WEB_POINTER,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  itemDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  itemSide: {
    width: IMAGE_SIZE,
    gap: 8,
    alignItems: 'stretch',
  },
  itemImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 12,
  },
  addButton: {
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...WEB_POINTER,
  },
  addText: {
    fontSize: 13,
    fontWeight: '600',
  },
  stepper: {
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 3,
  },
  stepperBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...WEB_POINTER,
  },
  stepperBtnText: {
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 17,
  },
  qtyInput: {
    flex: 1,
    minWidth: 0,
    height: 28,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '600',
    padding: 0,
  },
  pressed: {
    opacity: 0.8,
  },
});

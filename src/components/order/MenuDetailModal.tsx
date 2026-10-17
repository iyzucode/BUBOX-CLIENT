import React from 'react';
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Menu } from '@/types/menu';
import { useOrderPalette } from './orderPalette';

interface MenuDetailModalProps {
  menu: Menu | null;
  onClose: () => void;
}

export const MenuDetailModal: React.FC<MenuDetailModalProps> = ({
  menu,
  onClose,
}) => {
  const palette = useOrderPalette();

  if (!menu) return null;

  return (
    <Modal
      visible={Boolean(menu)}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: palette.cardBg }]}>
          {/* Header Image if available */}
          {menu.imageUrl ? (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: menu.imageUrl }}
                style={styles.image}
                resizeMode="cover"
              />
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.imageCloseBtn,
                  { backgroundColor: palette.closeBtnBg },
                  pressed && styles.pressed,
                ]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Tutup"
              >
                <ThemedText style={[styles.closeIcon, { color: palette.closeBtnIcon }]}>✕</ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.noImageHeader}>
              <View style={[styles.categoryBadge, { backgroundColor: palette.iconBoxBg }]}>
                <ThemedText style={[styles.categoryBadgeText, { color: palette.iconColor }]}>
                  {menu.category}
                </ThemedText>
              </View>
              <Pressable
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeBtn,
                  { backgroundColor: palette.iconBoxBg },
                  pressed && styles.pressed,
                ]}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Tutup"
              >
                <ThemedText style={[styles.closeIcon, { color: palette.iconColor }]}>✕</ThemedText>
              </Pressable>
            </View>
          )}

          <ScrollView style={styles.bodyScroll} showsVerticalScrollIndicator={false}>
            {/* Title & Price */}
            <View style={styles.titleSection}>
              {menu.imageUrl && (
                <View style={[styles.categoryBadge, { backgroundColor: palette.buttonBg, marginBottom: 8 }]}>
                  <ThemedText style={[styles.categoryBadgeText, { color: palette.buttonText }]}>
                    {menu.category}
                  </ThemedText>
                </View>
              )}
              <ThemedText style={[styles.menuTitle, { color: palette.cardTitle }]}>
                {menu.name}
              </ThemedText>
              <ThemedText style={[styles.priceTag, { color: palette.buttonActiveBg }]}>
                Rp {menu.price.toLocaleString('id-ID')}
              </ThemedText>
            </View>

            {/* Description */}
            {Boolean(menu.description) && (
              <View style={styles.sectionBlock}>
                <ThemedText style={[styles.sectionHeading, { color: palette.cardTitle }]}>
                  Deskripsi Menu
                </ThemedText>
                <ThemedText style={[styles.sectionBody, { color: palette.dayMenuText }]}>
                  {menu.description}
                </ThemedText>
              </View>
            )}

            {/* Ingredients */}
            {Boolean(menu.ingredients) && (
              <View style={styles.sectionBlock}>
                <ThemedText style={[styles.sectionHeading, { color: palette.cardTitle }]}>
                  Komposisi & Bahan
                </ThemedText>
                <ThemedText style={[styles.sectionBody, { color: palette.dayMenuText }]}>
                  {menu.ingredients}
                </ThemedText>
              </View>
            )}

            {/* Nutrition info */}
            {Boolean(menu.nutritionInfo) && (
              <View style={styles.sectionBlock}>
                <ThemedText style={[styles.sectionHeading, { color: palette.cardTitle }]}>
                  Informasi Nilai Gizi
                </ThemedText>
                <ThemedText style={[styles.sectionBody, { color: palette.dayMenuText }]}>
                  {menu.nutritionInfo}
                </ThemedText>
              </View>
            )}
          </ScrollView>

          {/* Bottom Button */}
          <View style={[styles.bottomRow, { borderTopColor: palette.dashedDivider }]}>
            <Pressable
              onPress={onClose}
              style={({ pressed }) => [
                styles.dismissBtn,
                { backgroundColor: palette.buttonActiveBg },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Tutup rincian menu"
            >
              <ThemedText style={[styles.dismissBtnText, { color: palette.buttonActiveText }]}>
                Tutup Rincian
              </ThemedText>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
      },
    }),
  },
  imageContainer: {
    width: '100%',
    height: 190,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageCloseBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  noImageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  closeIcon: {
    fontSize: 14,
    fontWeight: '800',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  bodyScroll: {
    paddingHorizontal: 18,
    paddingVertical: 14,
  },
  titleSection: {
    marginBottom: 14,
  },
  menuTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
    marginBottom: 4,
  },
  priceTag: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionBlock: {
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  sectionBody: {
    fontSize: 12,
    lineHeight: 18,
  },
  bottomRow: {
    padding: 14,
    borderTopWidth: 1,
  },
  dismissBtn: {
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  dismissBtnText: {
    fontSize: 14,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.97 }],
  },
});

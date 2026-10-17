import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
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

const FALLBACK_IMAGE = require('@/assets/images/baby-puree-fallback.jpg');
const SCREEN_HEIGHT = Dimensions.get('window').height || 700;

interface MenuDetailModalProps {
  menu: Menu | null;
  onClose: () => void;
}

export const MenuDetailModal: React.FC<MenuDetailModalProps> = ({
  menu,
  onClose,
}) => {
  const palette = useOrderPalette();
  const [internalMenu, setInternalMenu] = useState<Menu | null>(menu);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (menu) {
      isClosingRef.current = false;
      setInternalMenu(menu);
      translateY.setValue(SCREEN_HEIGHT);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else if (internalMenu && !isClosingRef.current) {
      isClosingRef.current = true;
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        isClosingRef.current = false;
        setInternalMenu(null);
      });
    }
  }, [menu]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      isClosingRef.current = false;
      setInternalMenu(null);
      onClose();
    });
  };

  const activeMenu = internalMenu || menu;
  if (!activeMenu) return null;

  return (
    <Modal
      visible={Boolean(activeMenu)}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Backdrop pressable: instantly in place, tap outside to dismiss */}
        <Pressable
          style={styles.backdropPressable}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Tutup rincian menu"
        />

        {/* Bottom Sheet Card - Only this slides up */}
        <Animated.View
          style={[
            styles.sheetCard,
            {
              backgroundColor: palette.cardBg,
              transform: [{ translateY }],
            },
          ]}
        >
          {/* 1. Drag Handle Indicator */}
          <Pressable
            onPress={handleClose}
            style={styles.dragHandleContainer}
            accessibilityRole="button"
            accessibilityLabel="Tutup rincian menu"
            hitSlop={8}
          >
            <View style={styles.dragHandle} />
          </Pressable>

          {/* 2. Inset Rounded Image Banner (Matching Gambar 2) */}
          <View style={styles.imageWrapper}>
            <Image
              source={
                activeMenu.imageUrl ? { uri: activeMenu.imageUrl } : FALLBACK_IMAGE
              }
              style={styles.image}
              resizeMode="cover"
            />
          </View>

          {/* 3. Scrollable Content (Clean, No Bottom Button) */}
          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Category Badge & Menu Title */}
            <View style={styles.titleSection}>
              {Boolean(activeMenu.category) && (
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: palette.buttonBg },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.categoryBadgeText,
                      { color: palette.buttonText },
                    ]}
                  >
                    {activeMenu.category}
                  </ThemedText>
                </View>
              )}

              <ThemedText style={[styles.menuTitle, { color: palette.cardTitle }]}>
                {activeMenu.name}
              </ThemedText>

              <ThemedText
                style={[styles.priceTag, { color: palette.buttonActiveBg }]}
              >
                Rp {activeMenu.price.toLocaleString('id-ID')}
              </ThemedText>
            </View>

            {/* Section: Deskripsi Menu */}
            {Boolean(activeMenu.description) && (
              <View style={styles.sectionBlock}>
                <ThemedText
                  style={[styles.sectionHeading, { color: palette.cardTitle }]}
                >
                  Deskripsi Menu
                </ThemedText>
                <ThemedText
                  style={[styles.sectionBody, { color: palette.dayMenuText }]}
                >
                  {activeMenu.description}
                </ThemedText>
              </View>
            )}

            {/* Section: Komposisi & Bahan */}
            {Boolean(activeMenu.ingredients) && (
              <View style={styles.sectionBlock}>
                <ThemedText
                  style={[styles.sectionHeading, { color: palette.cardTitle }]}
                >
                  Komposisi & Bahan
                </ThemedText>
                <ThemedText
                  style={[styles.sectionBody, { color: palette.dayMenuText }]}
                >
                  {activeMenu.ingredients}
                </ThemedText>
              </View>
            )}

            {/* Section: Informasi Nilai Gizi */}
            {Boolean(activeMenu.nutritionInfo) && (
              <View style={styles.sectionBlock}>
                <ThemedText
                  style={[styles.sectionHeading, { color: palette.cardTitle }]}
                >
                  Informasi Nilai Gizi
                </ThemedText>
                <ThemedText
                  style={[styles.sectionBody, { color: palette.dayMenuText }]}
                >
                  {activeMenu.nutritionInfo}
                </ThemedText>
              </View>
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  sheetCard: {
    width: '100%',
    maxWidth: 500,
    maxHeight: '82%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 -4px 30px rgba(0, 0, 0, 0.35)',
      },
    }),
  },
  dragHandleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    paddingBottom: 10,
    cursor: 'pointer' as any,
  },
  dragHandle: {
    width: 52,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
  },
  imageWrapper: {
    marginHorizontal: 16,
    height: 185,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bodyScroll: {
    flexGrow: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 40, // Generous clean bottom padding
  },
  titleSection: {
    marginBottom: 16,
    gap: 4,
  },
  categoryBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  priceTag: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  sectionBlock: {
    marginBottom: 16,
    gap: 4,
  },
  sectionHeading: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  sectionBody: {
    fontSize: 13,
    lineHeight: 19,
  },
});

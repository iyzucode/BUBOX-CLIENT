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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { CUSTOMER_MAX_WIDTH } from '@/hooks/use-customer-layout';
import { Menu } from '@/types/menu';
import { useOrderPalette } from './orderPalette';

const FALLBACK_IMAGE = require('@/assets/images/baby-puree-fallback.jpg');
const SCREEN_HEIGHT = Dimensions.get('window').height || 700;

interface MenuDetailModalProps {
  menu: Menu | null;
  onClose: () => void;
  /** Tambah satu porsi menu ini ke hari yang sedang dibuka; modal langsung tertutup. */
  onAdd: (menu: Menu) => void;
}

export const MenuDetailModal: React.FC<MenuDetailModalProps> = ({
  menu,
  onClose,
  onAdd,
}) => {
  const palette = useOrderPalette();
  const insets = useSafeAreaInsets();
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

  const handleAdd = () => {
    if (isClosingRef.current) return;
    onAdd(activeMenu);
    handleClose();
  };

  // Simpan, nilai gizi & komposisi belum tersedia: tombolnya tampil tetapi nonaktif
  const disabledPillStyle = [styles.pill, { backgroundColor: palette.buttonBg }];
  const pillTextStyle = [styles.pillText, { color: palette.buttonText }];

  return (
    <Modal
      visible={Boolean(activeMenu)}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        {/* Ketuk di luar kartu untuk menutup */}
        <Pressable
          style={styles.backdropPressable}
          onPress={handleClose}
          accessibilityRole="button"
          accessibilityLabel="Tutup rincian menu"
        />

        <Animated.View
          style={[
            styles.sheetCard,
            {
              backgroundColor: palette.cardBg,
              transform: [{ translateY }],
            },
          ]}
        >
          <Pressable
            onPress={handleClose}
            style={styles.dragHandleContainer}
            accessibilityRole="button"
            accessibilityLabel="Tutup rincian menu"
            hitSlop={8}
          >
            <View style={[styles.dragHandle, { backgroundColor: palette.dashedDivider }]} />
          </Pressable>

          <ScrollView
            style={styles.bodyScroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Foto persegi berbingkai oranye, label kategori di pojok kiri bawah */}
            <View style={[styles.imageFrame, { borderColor: palette.buttonActiveBg }]}>
              <Image
                source={activeMenu.imageUrl ? { uri: activeMenu.imageUrl } : FALLBACK_IMAGE}
                style={styles.image}
                resizeMode="cover"
              />
              {Boolean(activeMenu.category) && (
                <View style={[styles.categoryTab, { backgroundColor: palette.buttonActiveBg }]}>
                  <ThemedText
                    style={[styles.categoryTabText, { color: palette.buttonActiveText }]}
                    numberOfLines={1}
                  >
                    {activeMenu.category}
                  </ThemedText>
                </View>
              )}
            </View>

            <View style={styles.infoSection}>
              <ThemedText style={[styles.menuTitle, { color: palette.cardTitle }]}>
                {activeMenu.name}
              </ThemedText>
              {Boolean(activeMenu.description) && (
                <ThemedText style={[styles.description, { color: palette.dayMenuSubtext }]}>
                  {activeMenu.description}
                </ThemedText>
              )}
              <ThemedText style={[styles.price, { color: palette.cardTitle }]}>
                Rp {activeMenu.price.toLocaleString('id-ID')}
              </ThemedText>
            </View>

            <View style={styles.pillRow}>
              <View
                style={disabledPillStyle}
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
                accessibilityLabel="Simpan (belum tersedia)"
              >
                <HeartIcon color={palette.buttonText} />
                <ThemedText style={pillTextStyle}>Simpan</ThemedText>
              </View>
              <View style={styles.pillGroup}>
                <View
                  style={disabledPillStyle}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: true }}
                  accessibilityLabel="Nilai gizi (belum tersedia)"
                >
                  <View style={[styles.kcalBadge, { backgroundColor: palette.buttonText }]}>
                    <ThemedText style={[styles.kcalText, { color: palette.buttonBg }]}>kcal</ThemedText>
                  </View>
                  <ThemedText style={pillTextStyle}>Nilai gizi</ThemedText>
                </View>
                <View
                  style={disabledPillStyle}
                  accessibilityRole="button"
                  accessibilityState={{ disabled: true }}
                  accessibilityLabel="Komposisi (belum tersedia)"
                >
                  <LeafIcon color={palette.buttonText} />
                  <ThemedText style={pillTextStyle}>Komposisi</ThemedText>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Selalu "Tambah pembelian" meski menu ini sudah ada porsinya: menambah satu porsi lalu menutup */}
          <View style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}>
            <Pressable
              onPress={handleAdd}
              style={({ pressed }) => [
                styles.addButton,
                { backgroundColor: palette.checkoutBtnBg },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Tambah pembelian ${activeMenu.name}`}
            >
              <ThemedText style={[styles.addButtonText, { color: palette.checkoutBtnText }]}>
                Tambah pembelian
              </ThemedText>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const HeartIcon = ({ color }: { color: string }) =>
  Platform.OS === 'web' ? (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 0 0 0-7.8z" />
    </svg>
  ) : (
    <ThemedText style={[styles.iconGlyph, { color }]}>♡</ThemedText>
  );

const LeafIcon = ({ color }: { color: string }) =>
  Platform.OS === 'web' ? (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.5 19 2c1 2 2 4.2 2 8 0 5.5-4.8 10-10 10Z" />
      <path d="M2 21c0-3 1.9-5.4 5.2-6.1C9.6 14.4 12 13 13 12" />
    </svg>
  ) : (
    <ThemedText style={[styles.iconGlyph, { color }]}>🌿</ThemedText>
  );

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
    maxWidth: CUSTOMER_MAX_WIDTH, // selebar kolom customer (modal digambar di atas seluruh jendela)
    maxHeight: '92%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
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
    paddingTop: 10,
    paddingBottom: 12,
    cursor: 'pointer' as any,
  },
  dragHandle: {
    width: 120,
    height: 3,
    borderRadius: 1.5,
  },
  bodyScroll: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  imageFrame: {
    width: '100%',
    aspectRatio: 1,
    borderWidth: 3,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#FDE8E3',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  categoryTab: {
    position: 'absolute',
    left: 0,
    bottom: 0,
    minWidth: '42%',
    maxWidth: '80%',
    height: 40,
    paddingHorizontal: 20,
    borderTopRightRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoSection: {
    paddingTop: 20,
    paddingHorizontal: 2,
    gap: 6,
  },
  menuTitle: {
    fontSize: 19,
    fontWeight: '700',
    lineHeight: 25,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
  price: {
    fontSize: 16,
    fontWeight: '700',
    marginTop: 4,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 28,
  },
  pillGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    opacity: 0.45,
    ...Platform.select({ web: { cursor: 'not-allowed' as any } }),
  },
  pillText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  kcalBadge: {
    width: 14,
    height: 14,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kcalText: {
    fontSize: 5.5,
    lineHeight: 7,
    fontWeight: '700',
  },
  iconGlyph: {
    fontSize: 14,
    lineHeight: 16,
  },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  addButton: {
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
  },
});

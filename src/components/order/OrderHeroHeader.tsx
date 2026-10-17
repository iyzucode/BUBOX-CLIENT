import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth } from '@/constants/theme';
import { useOrderPalette } from './orderPalette';

const orderHeroImage = require('@/assets/images/order-hero.jpg');

export const OrderHeroHeader: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = useOrderPalette();

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const topOffset = insets.top > 0 ? insets.top + 10 : 16;

  return (
    <View style={styles.container}>
      {/* Background Image */}
      <Image source={orderHeroImage} style={styles.heroImage} resizeMode="cover" />

      {/* Dark Gradient Overlay for Contrast */}
      <View
        style={[
          styles.overlay,
          Platform.OS === 'web'
            ? ({ backgroundImage: palette.heroOverlay } as any)
            : { backgroundColor: 'rgba(0,0,0,0.35)' },
        ]}
      />

      {/* Top Bar with 'X' button on left and 'PESAN MENU LUANNA' on right */}
      <View style={[styles.topBarContainer, { top: topOffset }]}>
        <View style={styles.topBar}>
          {/* Circular Close Button 'X' */}
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [
              styles.closeBtn,
              { backgroundColor: palette.closeBtnBg },
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Tutup dan kembali ke Beranda"
            accessibilityRole="button"
          >
            {Platform.OS === 'web' ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={palette.closeBtnIcon}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <ThemedText style={[styles.closeIconText, { color: palette.closeBtnIcon }]}>
                ✕
              </ThemedText>
            )}
          </Pressable>

          {/* Title 'PESAN MENU LUANNA' */}
          <ThemedText style={[styles.headerTitle, { color: palette.heroTitle }]}>
            PESAN MENU LUANNA
          </ThemedText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 220,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#1E293B',
  },
  heroImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    maxWidth: MaxContentWidth,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)',
        cursor: 'pointer',
      },
      default: {
        elevation: 4,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
    }),
  },
  closeIconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.2,
    ...Platform.select({
      web: {
        textShadow: '0 2px 6px rgba(0, 0, 0, 0.65)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.65)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
      },
    }),
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});

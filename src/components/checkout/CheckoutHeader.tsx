import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useCheckoutPalette } from './checkoutPalette';

export const CheckoutHeader: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = useCheckoutPalette();

  const topPadding = insets.top > 0 ? insets.top + 10 : 16;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.headerBg,
          paddingTop: topPadding,
        },
      ]}
    >
      <View style={styles.contentRow}>
        {/* Left Circular Back Button */}
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: palette.backBtnBg },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Kembali ke halaman sebelumnya"
        >
          {Platform.OS === 'web' ? (
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke={palette.backBtnIcon}
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          ) : (
            <ThemedText style={[styles.backIconText, { color: palette.backBtnIcon }]}>
              ‹
            </ThemedText>
          )}
        </Pressable>

        {/* Right Title: Checkout */}
        <ThemedText style={[styles.title, { color: palette.headerText }]}>
          Checkout
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 20,
    paddingBottom: 16,
    zIndex: 10,
  },
  contentRow: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 3,
      },
      web: {
        cursor: 'pointer',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
      } as any,
    }),
  },
  backIconText: {
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 26,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
});

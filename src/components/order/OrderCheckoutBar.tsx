import React from 'react';
import { Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { FloatingGlassBar, useCompactProgress } from '@/components/ui/FloatingGlassBar';
import { Fonts } from '@/constants/theme';
import { useOrderPalette } from './orderPalette';

interface OrderCheckoutBarProps {
  totalItemsCount: number;
  activeDaysCount: number;
  grandTotal: number;
  onProceed: () => void;
  /** true saat halaman sedang di-scroll: bar mengecil, kembali normal saat scroll berhenti. */
  compact?: boolean;
}

/** Ikon keranjang dengan garis kecepatan. */
const FastCartIcon: React.FC<{ size: number; color: string }> = ({ size, color }) => {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M2 7h4M1 10.5h5M3 14h3" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
        <path
          d="M5.5 4h2.2l2.2 10.2c.1.5.5.8 1 .8h8.4c.5 0 .9-.3 1-.8L22 7.5H8.4"
          stroke={color}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M9 7.5h13l-1.6 6.5H10.4z" fill={color} />
        <circle cx="11.5" cy="19" r="1.6" fill={color} />
        <circle cx="18.5" cy="19" r="1.6" fill={color} />
      </svg>
    );
  }
  return <Text style={{ fontSize: size * 0.8, lineHeight: size, color }}>🛒</Text>;
};

export const OrderCheckoutBar: React.FC<OrderCheckoutBarProps> = ({
  totalItemsCount,
  activeDaysCount,
  grandTotal,
  onProceed,
  compact = false,
}) => {
  const palette = useOrderPalette();
  const lerp = useCompactProgress(compact);
  const isEnabled = totalItemsCount > 0;

  const btnBg = isEnabled ? palette.checkoutBtnBg : palette.checkoutBtnDisabledBg;
  const btnFg = isEnabled ? palette.checkoutBtnText : palette.checkoutBtnDisabledText;

  return (
    <FloatingGlassBar
      lerp={lerp}
      backgroundColor={palette.checkoutGlassBg}
      borderColor={palette.checkoutGlassBorder}
    >
      {/* Kiri: total & ringkasan */}
      <View style={styles.leftCol}>
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.totalPrice,
            { color: palette.checkoutTotalText, fontSize: lerp(19, 13), lineHeight: lerp(24, 18) },
          ]}
        >
          Rp{grandTotal.toLocaleString('id-ID')}
        </Animated.Text>
        <Animated.View style={{ height: lerp(16, 0), opacity: lerp(1, 0), overflow: 'hidden' }}>
          <Text numberOfLines={1} style={[styles.summaryText, { color: palette.checkoutSubtext }]}>
            {totalItemsCount} porsi · {activeDaysCount} hari
          </Text>
        </Animated.View>
      </View>

      {/* Kanan: tombol Pesan */}
      <Pressable
        onPress={onProceed}
        disabled={!isEnabled}
        accessibilityRole="button"
        accessibilityLabel="Pesan sekarang"
        style={({ pressed }) => [styles.pressable, pressed && isEnabled && styles.pressed]}
      >
        <Animated.View
          style={[
            styles.button,
            {
              backgroundColor: btnBg,
              height: lerp(46, 32),
              paddingHorizontal: lerp(18, 12),
              borderRadius: lerp(14, 11),
            },
          ]}
        >
          <Animated.View
            style={{ maxWidth: lerp(64, 0), marginRight: lerp(10, 0), opacity: lerp(1, 0), overflow: 'hidden' }}
          >
            <Text numberOfLines={1} style={[styles.buttonText, { color: btnFg }]}>
              Pesan
            </Text>
          </Animated.View>
          <Animated.View style={{ transform: [{ scale: lerp(1, 0.82) }] }}>
            <FastCartIcon size={22} color={btnFg} />
          </Animated.View>
        </Animated.View>
      </Pressable>
    </FloatingGlassBar>
  );
};

const styles = StyleSheet.create({
  leftCol: {
    flex: 1,
    minWidth: 0,
  },
  totalPrice: {
    fontFamily: Fonts.sans,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  summaryText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 16,
  },
  pressable: {
    ...Platform.select({ web: { cursor: 'pointer' } as object }),
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.97 }],
  },
});

import React from 'react';
import { ActivityIndicator, Animated, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { FloatingGlassBar, useCompactProgress } from '@/components/ui/FloatingGlassBar';
import { Fonts } from '@/constants/theme';
import { useCheckoutTotals } from '@/features/order/useCheckoutTotals';
import { useCheckoutPalette } from './checkoutPalette';

interface CheckoutStickyFooterProps {
  onPayPress: () => void;
  isSubmitting?: boolean;
  /** true saat halaman sedang di-scroll: footer mengecil, kembali normal saat scroll berhenti. */
  compact?: boolean;
}

/** Ikon dompet. */
const WalletIcon: React.FC<{ size: number; color: string; holeColor: string }> = ({ size, color, holeColor }) => {
  if (Platform.OS === 'web') {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden>
        <path d="M5 4.5h11.5a1.5 1.5 0 0 1 1.5 1.5v1H5.5a1 1 0 0 1 0-2" fill={color} />
        <path
          d="M3.5 7.5A2.5 2.5 0 0 0 6 10h13a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 19 20H6a2.5 2.5 0 0 1-2.5-2.5z"
          fill={color}
        />
        <path d="M3.5 7a2.5 2.5 0 0 1 2.5-2.5" stroke={color} strokeWidth="1.5" />
        <circle cx="16.5" cy="15" r="1.4" fill={holeColor} />
      </svg>
    );
  }
  return <Text style={{ fontSize: size * 0.8, lineHeight: size, color }}>👛</Text>;
};

export const CheckoutStickyFooter: React.FC<CheckoutStickyFooterProps> = ({
  onPayPress,
  isSubmitting = false,
  compact = false,
}) => {
  const palette = useCheckoutPalette();
  const { grandTotal } = useCheckoutTotals();
  const lerp = useCompactProgress(compact);

  return (
    <FloatingGlassBar lerp={lerp} backgroundColor={palette.footerGlassBg} borderColor={palette.footerGlassBorder}>
      {/* Kiri: Total Pembayaran */}
      <View style={styles.totalInfo}>
        <Animated.View style={{ height: lerp(16, 0), opacity: lerp(1, 0), overflow: 'hidden' }}>
          <Text numberOfLines={1} style={[styles.totalLabel, { color: palette.footerTotalLabel }]}>
            Total Pembayaran
          </Text>
        </Animated.View>
        <Animated.Text
          numberOfLines={1}
          style={[
            styles.totalAmount,
            { color: palette.footerTotalAmount, fontSize: lerp(19, 13), lineHeight: lerp(24, 18) },
          ]}
        >
          Rp{grandTotal.toLocaleString('id-ID')}
        </Animated.Text>
      </View>

      {/* Kanan: Bayar + ikon dompet; saat scroll hanya ikon */}
      <Pressable
        onPress={onPayPress}
        disabled={isSubmitting}
        accessibilityRole="button"
        accessibilityLabel="Bayar pesanan"
        style={({ pressed }) => [styles.pressable, { opacity: isSubmitting ? 0.6 : pressed ? 0.85 : 1 }]}
      >
        <Animated.View
          style={[
            styles.payBtn,
            {
              backgroundColor: palette.payBtnBg,
              height: lerp(46, 32),
              paddingHorizontal: lerp(18, 12),
              borderRadius: lerp(14, 11),
            },
          ]}
        >
          {isSubmitting ? (
            <ActivityIndicator size="small" color={palette.payBtnText} />
          ) : (
            <>
              <Animated.View
                style={{ maxWidth: lerp(64, 0), marginRight: lerp(10, 0), opacity: lerp(1, 0), overflow: 'hidden' }}
              >
                <Text numberOfLines={1} style={[styles.payBtnText, { color: palette.payBtnText }]}>
                  Bayar
                </Text>
              </Animated.View>
              <Animated.View style={{ transform: [{ scale: lerp(1, 0.82) }] }}>
                <WalletIcon size={22} color={palette.payBtnText} holeColor={palette.payBtnBg} />
              </Animated.View>
            </>
          )}
        </Animated.View>
      </Pressable>
    </FloatingGlassBar>
  );
};

const styles = StyleSheet.create({
  totalInfo: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
  },
  totalLabel: {
    fontFamily: Fonts.sans,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '400',
  },
  totalAmount: {
    fontFamily: Fonts.sans,
    fontWeight: '500',
    letterSpacing: -0.3,
  },
  pressable: {
    ...Platform.select({ web: { cursor: 'pointer' } as object }),
  },
  payBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  payBtnText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '500',
  },
});

import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useCartStore } from '@/store/useCartStore';
import { useCheckoutPalette } from './checkoutPalette';

interface CheckoutStickyFooterProps {
  onPayPress?: () => void;
}

export const CheckoutStickyFooter: React.FC<CheckoutStickyFooterProps> = ({
  onPayPress,
}) => {
  const insets = useSafeAreaInsets();
  const palette = useCheckoutPalette();

  const grandTotal = useCartStore((s) => s.getGrandTotal());

  const handlePress = () => {
    if (onPayPress) {
      onPayPress();
    }
    // Kept inert for this UI phase per user requirement
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: palette.footerBg,
          borderTopColor: palette.footerBorder,
          paddingBottom: Math.max(insets.bottom, 14),
        },
      ]}
    >
      <View style={styles.content}>
        {/* Left: Total Pembayaran Info */}
        <View style={styles.totalInfo}>
          <ThemedText style={[styles.totalLabel, { color: palette.footerTotalLabel }]}>
            Total Pembayaran
          </ThemedText>
          <ThemedText style={[styles.totalAmount, { color: palette.footerTotalAmount }]}>
            Rp {grandTotal.toLocaleString('id-ID')}
          </ThemedText>
        </View>

        {/* Right: Bayar Button (Inert for now) */}
        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [
            styles.payBtn,
            {
              backgroundColor: palette.payBtnBg,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <ThemedText style={[styles.payBtnText, { color: palette.payBtnText }]}>
            Bayar
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingTop: 12,
    paddingHorizontal: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.08,
        shadowRadius: 5,
      },
      android: {
        elevation: 6,
      },
      web: {
        boxShadow: '0 -2px 10px rgba(0,0,0,0.06)',
      },
    }),
  },
  content: {
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '400',
    marginBottom: 2,
  },
  totalAmount: {
    fontSize: 17,
    fontWeight: '500',
  },
  payBtn: {
    height: 44,
    paddingHorizontal: 36,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      web: {
        cursor: 'pointer',
      },
    }),
  },
  payBtnText: {
    fontSize: 15,
    fontWeight: '500',
  },
});

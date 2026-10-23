import React from 'react';
import {
  Platform,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useCartStore } from '@/store/useCartStore';
import { useCheckoutPalette } from './checkoutPalette';

export const PaymentDetailCard: React.FC = () => {
  const palette = useCheckoutPalette();

  const fulfillmentType = useCartStore((s) => s.fulfillmentType);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const deliveryFee = useCartStore((s) => s.getDeliveryFee());
  const discount = useCartStore((s) => s.getDiscountAmount());
  const grandTotal = useCartStore((s) => s.getGrandTotal());

  return (
    <View style={[styles.card, { backgroundColor: palette.cardBg }]}>
      {/* 1. Header Title */}
      <ThemedText style={[styles.cardTitle, { color: palette.cardTitle }]}>
        Detail Pembayaran
      </ThemedText>

      {/* 2. Subtotal Menu Katering */}
      <View style={styles.detailRow}>
        <ThemedText style={[styles.label, { color: palette.financeLabel }]}>
          Subtotal Menu Katering
        </ThemedText>
        <ThemedText style={[styles.value, { color: palette.financeValue }]}>
          Rp {subtotal.toLocaleString('id-ID')}
        </ThemedText>
      </View>

      {/* 3. Biaya Pengantaran */}
      <View style={styles.detailRow}>
        <ThemedText style={[styles.label, { color: palette.financeLabel }]}>
          Biaya Pengantaran
        </ThemedText>
        <ThemedText style={[styles.value, { color: palette.financeValue }]}>
          {deliveryFee === 0
            ? fulfillmentType === 'PICKUP'
              ? 'Gratis'
              : 'Gratis'
            : `Rp ${deliveryFee.toLocaleString('id-ID')}`}
        </ThemedText>
      </View>

      {/* 4. Diskon Kupon (if applied) */}
      {appliedCoupon && discount > 0 ? (
        <View style={styles.detailRow}>
          <ThemedText style={[styles.label, { color: palette.financeLabel }]}>
            Diskon Kupon ({appliedCoupon.code})
          </ThemedText>
          <ThemedText style={[styles.value, styles.discountValue]}>
            -Rp {discount.toLocaleString('id-ID')}
          </ThemedText>
        </View>
      ) : null}

      {/* 5. Divider */}
      <View style={[styles.divider, { backgroundColor: palette.dividerColor }]} />

      {/* 6. Total Pembayaran */}
      <View style={styles.detailRow}>
        <ThemedText style={[styles.totalLabel, { color: palette.cardTitle }]}>
          Total Pembayaran
        </ThemedText>
        <ThemedText style={[styles.totalValue, { color: palette.financeTotal }]}>
          Rp {grandTotal.toLocaleString('id-ID')}
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
      },
    }),
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
    marginBottom: 14,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: '400',
  },
  value: {
    fontSize: 13,
    fontWeight: '500',
  },
  discountValue: {
    color: '#10B981',
  },
  divider: {
    height: 1,
    marginVertical: 10,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 15,
    fontWeight: '500',
  },
});

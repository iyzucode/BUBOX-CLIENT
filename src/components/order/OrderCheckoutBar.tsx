import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth } from '@/constants/theme';
import { useOrderPalette } from './orderPalette';

interface OrderCheckoutBarProps {
  totalItemsCount: number;
  activeDaysCount: number;
  grandTotal: number;
  onProceed: () => void;
}

export const OrderCheckoutBar: React.FC<OrderCheckoutBarProps> = ({
  totalItemsCount,
  activeDaysCount,
  grandTotal,
  onProceed,
}) => {
  const palette = useOrderPalette();
  const isEnabled = totalItemsCount > 0;

  return (
    <View
      style={[
        styles.outerContainer,
        {
          backgroundColor: palette.checkoutBarBg,
          borderTopColor: palette.checkoutBarBorder,
        },
      ]}
    >
      <View style={styles.innerContent}>
        {/* Left: Total & Count */}
        <View style={styles.leftCol}>
          <ThemedText style={[styles.totalPrice, { color: palette.checkoutTotalText }]}>
            Rp {grandTotal.toLocaleString('id-ID')}
          </ThemedText>
          <ThemedText style={[styles.summaryText, { color: palette.checkoutSubtext }]}>
            {totalItemsCount} porsi • {activeDaysCount} hari
          </ThemedText>
        </View>

        {/* Right: Action Button "Lanjut" */}
        <Pressable
          onPress={onProceed}
          disabled={!isEnabled}
          style={({ pressed }) => [
            styles.proceedButton,
            {
              backgroundColor: isEnabled
                ? palette.checkoutBtnBg
                : palette.checkoutBtnDisabledBg,
            },
            pressed && isEnabled && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Lanjut pemesanan"
        >
          <ThemedText
            style={[
              styles.proceedButtonText,
              {
                color: isEnabled
                  ? palette.checkoutBtnText
                  : palette.checkoutBtnDisabledText,
              },
            ]}
          >
            Lanjut ➔
          </ThemedText>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
        zIndex: 50,
      },
    }),
  },
  innerContent: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftCol: {
    flex: 1,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  summaryText: {
    fontSize: 11,
    marginTop: 1,
  },
  proceedButton: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  proceedButtonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

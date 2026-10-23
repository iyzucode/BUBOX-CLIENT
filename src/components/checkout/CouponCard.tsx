import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useCartStore } from '@/store/useCartStore';
import { useCheckoutPalette } from './checkoutPalette';

export const CouponCard: React.FC = () => {
  const palette = useCheckoutPalette();
  const [couponCode, setCouponCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);

  const handleApply = () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!couponCode.trim()) {
      setErrorMessage('Silakan masukkan kode promo.');
      return;
    }

    const result = applyCoupon(couponCode);
    if (result.success) {
      setSuccessMessage(result.message);
      setCouponCode('');
    } else {
      setErrorMessage(result.message);
    }
  };

  const handleRemove = () => {
    removeCoupon();
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  return (
    <View style={[styles.card, { backgroundColor: palette.cardBg }]}>
      {/* Title */}
      <ThemedText style={[styles.cardTitle, { color: palette.cardTitle }]}>
        Kupon
      </ThemedText>

      {appliedCoupon ? (
        // Applied state
        <View style={[styles.appliedBox, { backgroundColor: palette.nestedBoxBg }]}>
          <View style={styles.appliedLeft}>
            <View style={styles.badgeRow}>
              <View style={styles.tagIcon}>
                <ThemedText style={styles.tagIconText}>%</ThemedText>
              </View>
              <ThemedText style={[styles.appliedCode, { color: palette.cardTitle }]}>
                {appliedCoupon.code}
              </ThemedText>
            </View>
            <ThemedText style={[styles.appliedDesc, { color: palette.cardSubtext }]}>
              {appliedCoupon.description}
            </ThemedText>
          </View>

          <Pressable
            onPress={handleRemove}
            style={({ pressed }) => [
              styles.removeBtn,
              { backgroundColor: palette.actionPillBtnBg, opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <ThemedText style={[styles.removeBtnText, { color: palette.actionPillBtnText }]}>
              Hapus
            </ThemedText>
          </Pressable>
        </View>
      ) : (
        // Input state
        <View style={styles.inputContainer}>
          <View style={[styles.inputWrapper, { backgroundColor: palette.inputBg }]}>
            <TextInput
              value={couponCode}
              onChangeText={(text) => {
                setCouponCode(text);
                if (errorMessage) setErrorMessage(null);
              }}
              placeholder="Masukkan kode promo"
              placeholderTextColor={palette.inputPlaceholder}
              autoCapitalize="characters"
              autoCorrect={false}
              style={[styles.textInput, { color: palette.inputText }]}
            />
          </View>

          <Pressable
            onPress={handleApply}
            style={({ pressed }) => [
              styles.applyBtn,
              {
                backgroundColor: palette.actionPillBtnBg,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <ThemedText style={[styles.applyBtnText, { color: palette.actionPillBtnText }]}>
              Pakai
            </ThemedText>
          </Pressable>
        </View>
      )}

      {/* Feedback Messages */}
      {errorMessage ? (
        <ThemedText style={styles.errorText}>
          {errorMessage}
        </ThemedText>
      ) : null}

      {successMessage ? (
        <ThemedText style={styles.successText}>
          {successMessage}
        </ThemedText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    gap: 12,
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
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  inputWrapper: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 14,
    justifyContent: 'center',
  },
  textInput: {
    fontSize: 14,
    fontWeight: '400',
    paddingVertical: 0,
    outlineStyle: 'none' as any,
  },
  applyBtn: {
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  appliedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
  },
  appliedLeft: {
    flex: 1,
    marginRight: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  tagIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagIconText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '500',
  },
  appliedCode: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  appliedDesc: {
    fontSize: 12,
    fontWeight: '400',
  },
  removeBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  removeBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 8,
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '400',
  },
  successText: {
    marginTop: 8,
    fontSize: 12,
    color: '#10B981',
    fontWeight: '400',
  },
});

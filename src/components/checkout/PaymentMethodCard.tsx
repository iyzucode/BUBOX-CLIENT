import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useCheckoutPalette } from './checkoutPalette';

export type PaymentMethod = 'QRIS' | 'CASH';

interface PaymentOption {
  id: PaymentMethod;
  title: string;
  subtitle: string;
  enabled: boolean;
}

// Saat ini hanya QRIS yang didukung backend. Tunai ditampilkan tetapi dinonaktifkan.
const OPTIONS: PaymentOption[] = [
  { id: 'QRIS', title: 'QRIS', subtitle: 'E-wallet & m-banking', enabled: true },
  { id: 'CASH', title: 'Tunai', subtitle: 'Segera hadir', enabled: false },
];

const SELECTED: PaymentMethod = 'QRIS';

const PaymentIcon: React.FC<{ method: PaymentMethod; color: string }> = ({ method, color }) => {
  if (Platform.OS !== 'web') {
    return (
      <ThemedText style={[styles.fallbackIcon, { color }]}>{method === 'QRIS' ? '▣' : '💵'}</ThemedText>
    );
  }

  if (method === 'QRIS') {
    return (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <path d="M14 14h3v3h-3zM20 14v.01M14 20h.01M17 20h4M20 17v3" />
      </svg>
    );
  }

  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </svg>
  );
};

/** Pilihan metode pembayaran. Default QRIS; Tunai belum tersedia (disabled). */
export const PaymentMethodCard: React.FC = () => {
  const palette = useCheckoutPalette();

  return (
    <View style={[styles.card, { backgroundColor: palette.cardBg }]}>
      <ThemedText style={[styles.cardTitle, { color: palette.cardTitle }]}>
        Metode Pembayaran
      </ThemedText>

      <View style={styles.optionsRow}>
        {OPTIONS.map((option) => {
          const active = option.id === SELECTED;
          return (
            <Pressable
              key={option.id}
              disabled={!option.enabled}
              style={({ pressed }) => [
                styles.optionBtn,
                {
                  backgroundColor: active ? palette.optionActiveBg : palette.optionBg,
                  borderColor: active ? palette.optionActiveBorder : palette.optionBorder,
                  opacity: option.enabled ? 1 : 0.5,
                },
                pressed && option.enabled && styles.pressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: active, disabled: !option.enabled }}
              accessibilityLabel={`Bayar dengan ${option.title}${option.enabled ? '' : ' (belum tersedia)'}`}
            >
              <View style={styles.optionTextCol}>
                <ThemedText style={[styles.optionTitle, { color: palette.optionText }]}>
                  {option.title}
                </ThemedText>
                <ThemedText style={[styles.optionSubtext, { color: palette.optionSubtext }]}>
                  {option.subtitle}
                </ThemedText>
              </View>

              <View style={styles.iconWrapper}>
                <PaymentIcon method={option.id} color={palette.optionIconColor} />
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionBtn: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 80,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  optionTextCol: {
    flex: 1,
    gap: 2,
    paddingRight: 6,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionSubtext: {
    fontSize: 10,
    lineHeight: 13,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIcon: {
    fontSize: 22,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

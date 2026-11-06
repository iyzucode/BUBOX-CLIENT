import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useCheckoutPalette } from './checkoutPalette';

/**
 * Input kode promo (tampilan saja).
 * Belum terhubung ke backend: kupon di-hold untuk v1, sehingga tombol Pakai hanya memberi info.
 */
export const PromoCodeCard: React.FC = () => {
  const palette = useCheckoutPalette();
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const canApply = code.trim().length > 0;

  const handleApply = () => {
    if (!canApply) return;
    setMessage('Kode promo belum bisa digunakan saat ini.');
  };

  return (
    <View style={[styles.card, { backgroundColor: palette.cardBg }]}>
      <ThemedText style={[styles.cardTitle, { color: palette.cardTitle }]}>
        Kode Promo
      </ThemedText>

      <View style={styles.inputRow}>
        <View style={[styles.inputWrapper, { backgroundColor: palette.inputBg }]}>
          <TextInput
            value={code}
            onChangeText={(text) => {
              setCode(text.toUpperCase());
              if (message) setMessage(null);
            }}
            onSubmitEditing={handleApply}
            placeholder="Masukkan kode promo"
            placeholderTextColor={palette.inputPlaceholder}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={30}
            returnKeyType="done"
            style={[styles.textInput, { color: palette.inputText }]}
            accessibilityLabel="Kode promo"
          />
        </View>

        <Pressable
          onPress={handleApply}
          disabled={!canApply}
          style={({ pressed }) => [
            styles.applyBtn,
            {
              backgroundColor: palette.actionPillBtnBg,
              opacity: !canApply ? 0.5 : pressed ? 0.8 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Pakai kode promo"
        >
          <ThemedText style={[styles.applyBtnText, { color: palette.actionPillBtnText }]}>
            Pakai
          </ThemedText>
        </Pressable>
      </View>

      {message ? (
        <ThemedText style={[styles.message, { color: palette.cardSubtext }]}>{message}</ThemedText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  inputRow: {
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
    // 16px mencegah iOS Safari melakukan auto-zoom saat input difokuskan
    fontSize: 16,
    fontWeight: '400',
    paddingVertical: 0,
    ...Platform.select({ web: { outlineWidth: 0 } }),
  },
  applyBtn: {
    height: 44,
    paddingHorizontal: 22,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  applyBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
  message: {
    fontSize: 12,
    fontWeight: '400',
  },
});

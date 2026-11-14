import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useCheckoutPalette } from '@/components/checkout/checkoutPalette';

/** Tampil sesaat ketika keranjang kosong, sementara layar checkout mengalihkan ke /order. */
export function CheckoutEmptyState() {
  const palette = useCheckoutPalette();

  return (
    <View style={styles.container}>
      <ActivityIndicator size="small" color={palette.cardSubtext} />
      <ThemedText style={[styles.title, { color: palette.cardTitle }]}>Keranjang kosong</ThemedText>
      <ThemedText style={[styles.subtitle, { color: palette.cardSubtext }]}>
        Mengalihkan ke halaman pesan…
      </ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 64,
  },
  title: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '500',
  },
  subtitle: {
    fontSize: 13,
  },
});

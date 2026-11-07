import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

// Halaman ini dibuka di popup login Google. Hasil login dikirim ke jendela utama,
// lalu popup ditutup otomatis.
WebBrowser.maybeCompleteAuthSession();

export default function OAuthRedirectScreen() {
  const theme = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ActivityIndicator color={theme.primary} />
      <ThemedText style={[styles.text, { color: theme.textSecondary }]}>Menyelesaikan login…</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  text: {
    fontSize: 14,
  },
});

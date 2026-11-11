import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useOrderPalette } from './orderPalette';

/** Tombol bulat ▲ penanda buka/tutup kartu (sama dengan DayMenuCard). Area klik ada di header kartu. */
export const CardCollapseToggle: React.FC<{ isOpen: boolean }> = ({ isOpen }) => {
  const palette = useOrderPalette();
  return (
    <View style={[styles.circle, { backgroundColor: palette.buttonBg }]}>
      <ThemedText style={[styles.icon, { color: palette.buttonText }, !isOpen && styles.rotated]}>▲</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  circle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  icon: { fontSize: 10, lineHeight: 12, fontWeight: '500', marginTop: -1 },
  rotated: { transform: [{ rotate: '180deg' }] },
});

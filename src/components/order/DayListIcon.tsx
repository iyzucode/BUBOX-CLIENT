import React, { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * Ikon buka/tutup daftar tanggal: chevron ke bawah (ketuk untuk membuka). Saat daftar terbuka chevron yang sama
 * diputar 180° (berputar saat daftar dibuka), sehingga menunjuk ke atas = ketuk untuk menutup.
 * Chevron digambar dengan border (bukan karakter teks) agar ukurannya pas dan tampak tepat di tengah.
 */
export const DayListIcon: React.FC<{ open: boolean; color: string }> = ({ open, color }) => {
  // 0 = tertutup (chevron ke bawah), 1 = terbuka (diputar 180°)
  const [turn] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.timing(turn, {
      toValue: open ? 1 : 0,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: USE_NATIVE_DRIVER,
    }).start();
  }, [open, turn]);

  const rotate = turn.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <Animated.View
      style={[styles.icon, { transform: [{ rotate }] }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View style={[styles.chevron, { borderColor: color }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  icon: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Sudut kanan-bawah sebuah persegi yang diputar 45° = chevron ke bawah; digeser naik agar titik beratnya di tengah
  chevron: {
    width: 8,
    height: 8,
    marginTop: -4,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    transform: [{ rotate: '45deg' }],
  },
});

import React, { useEffect, useState } from 'react';
import { Animated, Easing, Platform, StyleSheet, View } from 'react-native';

const USE_NATIVE_DRIVER = Platform.OS !== 'web';

/**
 * Ikon buka/tutup daftar tanggal: tiga garis dengan segitiga kecil ke bawah. Saat daftar terbuka ikon yang sama
 * diputar 180° (berputar saat daftar dibuka), sehingga panahnya menunjuk ke atas = ketuk untuk menutup.
 * Segitiga digambar dengan border (bukan karakter teks) agar tinggi ikon pas dan tampak tepat di tengah.
 */
export const DayListIcon: React.FC<{ open: boolean; color: string }> = ({ open, color }) => {
  // 0 = tertutup (panah ke bawah), 1 = terbuka (diputar 180°)
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
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={[styles.bar, { backgroundColor: color }]} />
      <View style={[styles.caret, { borderTopColor: color }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  icon: {
    width: 11,
    alignItems: 'center',
    gap: 1.5,
  },
  bar: {
    width: 10,
    height: 1.5,
    borderRadius: 1,
  },
  caret: {
    width: 0,
    height: 0,
    borderLeftWidth: 3,
    borderRightWidth: 3,
    borderTopWidth: 3.5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});

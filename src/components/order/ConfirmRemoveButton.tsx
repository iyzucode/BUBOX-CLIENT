import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';

const COLLAPSED_WIDTH = 28;
const EXPANDED_WIDTH = 132;
const ANIMATION_MS = 220;
const AUTO_RESET_MS = 5000;

interface ConfirmRemoveButtonProps {
  /** Bila true, ketukan pertama meminta konfirmasi; bila false, langsung menghapus. */
  requireConfirm: boolean;
  onConfirm: () => void;
  backgroundColor: string;
  color: string;
  accessibilityLabel: string;
}

/**
 * Tombol ✕ yang melebar (animasi geser) menjadi "Konfirmasi Hapus" sebelum menghapus.
 * Kembali menjadi ✕ otomatis setelah 5 detik bila tidak diketuk.
 */
export const ConfirmRemoveButton: React.FC<ConfirmRemoveButtonProps> = ({
  requireConfirm,
  onConfirm,
  backgroundColor,
  color,
  accessibilityLabel,
}) => {
  const [confirming, setConfirming] = useState(false);
  // Nilai animasi stabil sepanjang umur komponen (useState lazy, bukan ref, agar aman dibaca saat render)
  const [progress] = useState(() => new Animated.Value(0));
  const resetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Bersihkan timer bila kartu dihapus / unmount
  useEffect(
    () => () => {
      if (resetTimer.current) clearTimeout(resetTimer.current);
    },
    []
  );

  const animateTo = (value: 0 | 1) => {
    Animated.timing(progress, {
      toValue: value,
      duration: ANIMATION_MS,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // lebar tidak didukung native driver
    }).start();
  };

  const collapse = () => {
    if (resetTimer.current) clearTimeout(resetTimer.current);
    resetTimer.current = null;
    setConfirming(false);
    animateTo(0);
  };

  const handlePress = () => {
    if (!requireConfirm || confirming) {
      collapse();
      onConfirm();
      return;
    }

    setConfirming(true);
    animateTo(1);
    resetTimer.current = setTimeout(collapse, AUTO_RESET_MS);
  };

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [COLLAPSED_WIDTH, EXPANDED_WIDTH],
  });
  const iconOpacity = progress.interpolate({ inputRange: [0, 0.4], outputRange: [1, 0], extrapolate: 'clamp' });
  const labelOpacity = progress.interpolate({ inputRange: [0.5, 1], outputRange: [0, 1], extrapolate: 'clamp' });
  const labelShift = progress.interpolate({ inputRange: [0, 1], outputRange: [12, 0] });

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={confirming ? `Konfirmasi: ${accessibilityLabel}` : accessibilityLabel}
      style={({ pressed }) => [styles.pressable, pressed && styles.pressed]}
    >
      <Animated.View style={[styles.pill, { width, backgroundColor }]}>
        <Animated.View style={[styles.layer, { opacity: iconOpacity }]} pointerEvents="none">
          <ThemedText style={[styles.closeIcon, { color }]}>✕</ThemedText>
        </Animated.View>
        <Animated.View
          style={[styles.layer, { opacity: labelOpacity, transform: [{ translateX: labelShift }] }]}
          pointerEvents="none"
        >
          <ThemedText style={[styles.label, { color }]} numberOfLines={1}>
            Konfirmasi Hapus
          </ThemedText>
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  pressable: {
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  pill: {
    height: COLLAPSED_WIDTH,
    borderRadius: COLLAPSED_WIDTH / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '500',
  },
  label: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.8,
  },
});

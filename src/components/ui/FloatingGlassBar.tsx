import React, { useEffect, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const useNativeGlass = Platform.OS === 'ios' && isLiquidGlassAvailable();

/**
 * Nilai animasi 0 (normal) → 1 (mengecil) yang mengikuti `compact`,
 * plus helper `lerp(normal, compact)` untuk menginterpolasi style.
 */
export function useCompactProgress(compact: boolean) {
  const [progress] = useState(() => new Animated.Value(0));

  useEffect(() => {
    Animated.spring(progress, {
      toValue: compact ? 1 : 0,
      useNativeDriver: false,
      speed: 16,
      bounciness: compact ? 0 : 6,
    }).start();
  }, [compact, progress]);

  const lerp = (normal: number, compacted: number) =>
    progress.interpolate({ inputRange: [0, 1], outputRange: [normal, compacted], extrapolate: 'clamp' });

  return lerp;
}

export type Lerp = ReturnType<typeof useCompactProgress>;

interface FloatingGlassBarProps {
  lerp: Lerp;
  backgroundColor: string;
  borderColor: string;
  children: React.ReactNode;
}

/**
 * Bar mengambang ala liquid glass di dasar layar.
 * iOS 26+: efek kaca native; web: backdrop blur; lainnya: latar semi-transparan.
 */
export const FloatingGlassBar: React.FC<FloatingGlassBarProps> = ({
  lerp,
  backgroundColor,
  borderColor,
  children,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View pointerEvents="box-none" style={[styles.wrapper, { bottom: Math.max(insets.bottom, 12) }]}>
      <Animated.View
        style={[
          styles.bar,
          {
            marginHorizontal: lerp(16, 40),
            paddingVertical: lerp(12, 7),
            paddingLeft: lerp(22, 18),
            paddingRight: lerp(12, 8),
            borderRadius: lerp(22, 18),
            borderColor,
            backgroundColor: useNativeGlass ? 'transparent' : backgroundColor,
          },
        ]}
      >
        {useNativeGlass ? <GlassView glassEffectStyle="regular" style={StyleSheet.absoluteFill} /> : null}
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 50,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
      web: {
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.14), inset 0 1px 0 rgba(255, 255, 255, 0.35)',
        backdropFilter: 'blur(18px) saturate(180%)',
        WebkitBackdropFilter: 'blur(18px) saturate(180%)',
      } as object,
    }),
  },
});

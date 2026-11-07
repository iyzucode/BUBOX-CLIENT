import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';
import { useThemeContext } from '@/context/ThemeContext';

interface ScreenHeaderBarProps {
  title: string;
  onBack: () => void;
  /** Lebar maksimum isi header (ikuti kolom konten). */
  maxWidth?: number | '100%';
}

/** Header navy: tombol kembali bulat di kiri, judul di kanan (pola screen Alamat). */
export const ScreenHeaderBar: React.FC<ScreenHeaderBarProps> = ({ title, onBack, maxWidth = '100%' }) => {
  const { isDark } = useThemeContext();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          paddingTop: insets.top > 0 ? insets.top + 8 : 16,
          backgroundColor: isDark ? '#141416' : Brand.navy,
        },
      ]}
    >
      <View style={[styles.inner, { maxWidth }]}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityLabel="Kembali"
          accessibilityRole="button"
        >
          {Platform.OS === 'web' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#111827" strokeWidth="2.4"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="15 18 9 12 15 6" />
            </svg>
          ) : (
            <ThemedText style={styles.backText}>‹</ThemedText>
          )}
        </Pressable>
        <ThemedText style={styles.title} numberOfLines={1}>
          {title}
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    width: '100%',
    paddingBottom: 16,
    paddingHorizontal: 20,
    zIndex: 20,
  },
  inner: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)', cursor: 'pointer' } as object,
      default: {
        elevation: 4,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
    }),
  },
  backText: {
    fontSize: 26,
    lineHeight: 28,
    fontWeight: '600',
    color: Brand.navy,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.2,
    flexShrink: 1,
    marginLeft: 16,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});

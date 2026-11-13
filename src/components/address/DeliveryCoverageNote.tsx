import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeContext } from '@/context/ThemeContext';

interface Props {
  /** Teks pendek; default menjelaskan alamat belum terjangkau pengantaran. */
  message?: string;
}

/** Penanda alamat di luar jangkauan pengantaran (dipakai di kartu alamat & checkout). */
export const DeliveryCoverageNote: React.FC<Props> = ({
  message = 'Di luar jangkauan pengantaran. Pilih alamat lain atau ambil sendiri.',
}) => {
  const { isDark } = useThemeContext();
  const bg = isDark ? 'rgba(239, 68, 68, 0.14)' : '#FDECEC';
  const fg = isDark ? '#FCA5A5' : '#B42318';

  return (
    <View style={[styles.box, { backgroundColor: bg }]} accessibilityRole="alert">
      {Platform.OS === 'web' ? (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7.5v5" />
          <path d="M12 16.2v.3" />
        </svg>
      ) : (
        <ThemedText style={[styles.icon, { color: fg }]}>!</ThemedText>
      )}
      <ThemedText style={[styles.text, { color: fg }]}>{message}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  icon: {
    fontSize: 12,
    fontWeight: '700',
  },
  text: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '500',
  },
});

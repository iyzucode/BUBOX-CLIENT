import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { Href, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** Tujuan tombol kembali bila tidak ada riwayat navigasi (mis. dibuka langsung dari URL). */
  fallbackHref?: Href;
  right?: React.ReactNode;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({ title, subtitle, fallbackHref = '/', right }) => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(fallbackHref);
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top > 0 ? insets.top + 8 : 16,
          backgroundColor: theme.card,
          borderBottomColor: theme.border,
        },
      ]}
    >
      <View style={styles.row}>
        <Pressable
          onPress={handleBack}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: theme.backgroundElement },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Kembali"
        >
          <ThemedText style={[styles.backIcon, { color: theme.text }]}>←</ThemedText>
        </Pressable>

        <View style={styles.titleCol}>
          <ThemedText style={[styles.title, { color: theme.text }]} numberOfLines={1}>
            {title}
          </ThemedText>
          {subtitle ? (
            <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </ThemedText>
          ) : null}
        </View>

        {right ? <View>{right}</View> : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  row: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  backIcon: {
    fontSize: 20,
    fontWeight: '600',
    lineHeight: 24,
  },
  titleCol: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  pressed: {
    opacity: 0.75,
  },
});

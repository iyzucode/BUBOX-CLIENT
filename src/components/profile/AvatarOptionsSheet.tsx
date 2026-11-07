import React, { useEffect, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';
import { CUSTOMER_MAX_WIDTH } from '@/hooks/use-customer-layout';
import { useProfilePalette } from './profilePalette';

const SLIDE_DISTANCE = 320;
const USE_NATIVE_DRIVER = Platform.OS !== 'web';

interface AvatarOptionsSheetProps {
  visible: boolean;
  onChoose: () => void;
  onRemove: () => void;
  onClose: () => void;
}

/** Bottom sheet "Ganti foto / Hapus foto / Batal" untuk foto profil yang sudah ada. */
export const AvatarOptionsSheet: React.FC<AvatarOptionsSheetProps> = ({
  visible,
  onChoose,
  onRemove,
  onClose,
}) => {
  const palette = useProfilePalette();
  const insets = useSafeAreaInsets();
  // Nilai animasi dibuat sekali (state, bukan ref, agar aman dibaca saat render).
  const [translateY] = useState(() => new Animated.Value(SLIDE_DISTANCE));
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  // Modal tetap tampil selama animasi turun berjalan, walau induk sudah menutupnya.
  const [isClosing, setIsClosing] = useState(false);

  // Buka: latar menggelap, kartu naik dari bawah.
  useEffect(() => {
    if (!visible) return;
    translateY.setValue(SLIDE_DISTANCE);
    backdropOpacity.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start();
  }, [visible, translateY, backdropOpacity]);

  /**
   * Tutup: jalankan aksi (tutup/ganti/hapus) lalu kartu meluncur turun & latar memudar.
   * Aksi dipanggil langsung (bukan setelah animasi) agar pemilih foto tetap dianggap
   * dibuka oleh ketukan pengguna di browser.
   */
  const dismissThen = (action: () => void) => {
    if (isClosing) return;
    setIsClosing(true);
    action();
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SLIDE_DISTANCE,
        duration: 220,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 220,
        useNativeDriver: USE_NATIVE_DRIVER,
      }),
    ]).start(() => setIsClosing(false));
  };

  return (
    <Modal
      visible={visible || isClosing}
      transparent
      animationType="none"
      onRequestClose={() => dismissThen(onClose)}
    >
      <View style={styles.root}>
        <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => dismissThen(onClose)}
            accessibilityLabel="Tutup pilihan foto profil"
          />
        </Animated.View>
        <Animated.View
          style={[
            styles.sheet,
            {
              backgroundColor: palette.cardBg,
              paddingBottom: Math.max(insets.bottom, 12) + 8,
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: palette.divider }]} />

          <Pressable
            onPress={() => dismissThen(onChoose)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <ThemedText style={[styles.itemText, { color: palette.cardTitle }]}>Ganti foto</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => dismissThen(onRemove)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <ThemedText style={[styles.itemText, { color: Brand.red }]}>Hapus foto</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => dismissThen(onClose)}
            accessibilityRole="button"
            style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
          >
            <ThemedText style={[styles.itemText, { color: palette.cardSubtext }]}>Batal</ThemedText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheet: {
    width: '100%',
    maxWidth: CUSTOMER_MAX_WIDTH,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 10,
    overflow: 'hidden',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  item: {
    paddingVertical: 15,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as object }),
  },
  itemPressed: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  itemText: {
    fontSize: 15,
    fontWeight: '600',
  },
});

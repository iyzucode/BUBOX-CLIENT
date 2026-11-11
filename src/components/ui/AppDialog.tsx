import React from 'react';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';

import { ThemedText } from '@/components/themed-text';
import { Fonts, type ColorTheme } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useDialogStore, type DialogRequest, type DialogTone } from '@/store/useDialogStore';

const ICON_GLYPH: Record<DialogTone, string> = {
  info: 'i',
  success: '✓',
  warning: '!',
  error: '✕',
  danger: '!',
};

function toneColor(theme: ColorTheme, tone: DialogTone): string {
  switch (tone) {
    case 'success':
      return theme.success;
    case 'warning':
      return theme.warning;
    case 'error':
    case 'danger':
      return theme.danger;
    default:
      return theme.primary;
  }
}

/** Latar ikon: warna tone dengan transparansi ±12%. Warna tema selalu hex 6 digit. */
function tint(hex: string): string {
  return /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}1F` : hex;
}

/**
 * Penampil dialog global. Pasang sekali di root layout; panggil lewat showAlert / confirmAction
 * dari '@/utils/alert'. Dialog yang dipanggil bersamaan ditampilkan bergantian.
 */
export function AppDialogHost() {
  const current = useDialogStore((s) => s.queue[0]);
  const close = useDialogStore((s) => s.close);

  return (
    <Modal
      visible={!!current}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => close(false)}
    >
      {current ? <DialogCard key={current.id} dialog={current} onClose={close} /> : null}
    </Modal>
  );
}

interface DialogCardProps {
  dialog: DialogRequest;
  onClose: (confirmed: boolean) => void;
}

function DialogCard({ dialog, onClose }: DialogCardProps) {
  const theme = useTheme();
  const color = toneColor(theme, dialog.tone);
  const isConfirm = dialog.kind === 'confirm';
  // Tombol utama konfirmasi non-danger tetap oranye brand; pemberitahuan memakai warna tone-nya
  const primaryBg = isConfirm && dialog.tone !== 'danger' ? theme.primary : color;

  return (
    <View style={styles.overlay}>
      {/* Ketuk latar = batal / tutup */}
      <Pressable
        style={StyleSheet.absoluteFill}
        onPress={() => onClose(false)}
        accessibilityLabel="Tutup dialog"
      />

      <Animated.View
        entering={ZoomIn.duration(180)}
        style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}
        accessibilityViewIsModal
        accessibilityRole="alert"
      >
        <View style={[styles.iconCircle, { backgroundColor: tint(color) }]}>
          <Text style={[styles.iconGlyph, { color }]}>{ICON_GLYPH[dialog.tone]}</Text>
        </View>

        <ThemedText style={[styles.title, { color: theme.text }]}>{dialog.title}</ThemedText>
        {dialog.message ? (
          <ThemedText style={[styles.message, { color: theme.textSecondary }]}>{dialog.message}</ThemedText>
        ) : null}

        <View style={styles.actions}>
          {isConfirm ? (
            <Pressable
              onPress={() => onClose(false)}
              style={({ pressed }) => [
                styles.btn,
                styles.btnOutline,
                { borderColor: theme.border, backgroundColor: theme.backgroundElement },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
            >
              <ThemedText style={[styles.btnText, { color: theme.text }]}>{dialog.cancelText}</ThemedText>
            </Pressable>
          ) : null}
          <Pressable
            onPress={() => onClose(true)}
            style={({ pressed }) => [styles.btn, { backgroundColor: primaryBg }, pressed && styles.pressed]}
            accessibilityRole="button"
          >
            <ThemedText style={[styles.btnText, { color: theme.onPrimary }]}>{dialog.confirmText}</ThemedText>
          </Pressable>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 22,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: 'center',
    ...Platform.select({
      web: { boxShadow: '0 18px 48px rgba(15, 23, 42, 0.25)' },
      default: {
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        elevation: 12,
      },
    }),
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  iconGlyph: { fontSize: 30, lineHeight: 36, fontWeight: '800', fontFamily: Fonts?.sans },
  title: { fontSize: 18, lineHeight: 24, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: 14, lineHeight: 21, textAlign: 'center', marginTop: 6 },
  actions: { flexDirection: 'row', gap: 10, alignSelf: 'stretch', marginTop: 22 },
  btn: {
    flex: 1,
    minHeight: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  btnOutline: { borderWidth: 1 },
  btnText: { fontSize: 15, fontWeight: '700' },
  pressed: { opacity: 0.85 },
});

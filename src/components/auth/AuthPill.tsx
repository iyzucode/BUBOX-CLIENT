import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useAuthPalette } from './authPalette';

type PillIcon = 'mail' | 'lock';

const ICON_PATHS: Record<PillIcon, string> = {
  mail: 'M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z',
  lock: 'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z',
};
const ICON_FALLBACK: Record<PillIcon, string> = { mail: '✉', lock: '🔒' };

interface AuthPillInputProps extends Omit<TextInputProps, 'style'> {
  icon: PillIcon;
  /** Tampilkan tombol mata untuk lihat/sembunyikan kata sandi. */
  isPassword?: boolean;
}

/** Input berbentuk pil dengan ikon kiri, sama dengan input di layar Login/Daftar. */
export const AuthPillInput: React.FC<AuthPillInputProps> = ({ icon, isPassword = false, ...inputProps }) => {
  const palette = useAuthPalette();
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.pillWrapper, { backgroundColor: palette.inputBg }]}>
      <View style={styles.leftIcon}>
        {Platform.OS === 'web' ? (
          <svg width="19" height="19" viewBox="0 0 24 24" fill={palette.icon} aria-hidden>
            <path d={ICON_PATHS[icon]} />
          </svg>
        ) : (
          <ThemedText style={{ fontSize: 15 }}>{ICON_FALLBACK[icon]}</ThemedText>
        )}
      </View>

      <TextInput
        {...inputProps}
        secureTextEntry={isPassword && !showPassword}
        placeholderTextColor={palette.placeholder}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, { color: palette.text }]}
        {...(Platform.OS === 'web' ? ({ className: 'auth-pill-input' } as object) : {})}
      />

      {isPassword ? (
        <Pressable
          onPress={() => setShowPassword((v) => !v)}
          style={styles.eyeBtn}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
        >
          {Platform.OS === 'web' ? (
            showPassword ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.icon} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={palette.icon} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            )
          ) : (
            <ThemedText style={{ fontSize: 16 }}>{showPassword ? '👁' : '🙈'}</ThemedText>
          )}
        </Pressable>
      ) : null}
    </View>
  );
};

interface AuthPillButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

/** Tombol utama oranye berbentuk pil, sama dengan tombol Login/Daftar. */
export const AuthPillButton: React.FC<AuthPillButtonProps> = ({ title, onPress, isLoading = false, disabled = false }) => {
  const palette = useAuthPalette();
  const inactive = disabled || isLoading;

  return (
    <Pressable
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: palette.primary, opacity: disabled ? 0.5 : isLoading ? 0.8 : 1 },
        pressed && !inactive && styles.pressed,
      ]}
    >
      {isLoading ? (
        <ActivityIndicator color={palette.onPrimary} size="small" />
      ) : (
        <ThemedText style={[styles.buttonText, { color: palette.onPrimary }]}>{title}</ThemedText>
      )}
    </Pressable>
  );
};

interface AuthFooterLinkProps {
  prompt: string;
  linkText: string;
  onPress: () => void;
  /** Tautan non-aktif (mis. masih hitung mundur kirim ulang). */
  disabled?: boolean;
}

/** Baris "Belum memiliki akun? Daftar di sini" di bawah kartu auth. */
export const AuthFooterLink: React.FC<AuthFooterLinkProps> = ({ prompt, linkText, onPress, disabled = false }) => {
  const palette = useAuthPalette();

  return (
    <View style={styles.footerRow}>
      <ThemedText style={[styles.footerPrompt, { color: palette.text }]}>{prompt} </ThemedText>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        style={({ pressed }) => [styles.footerLinkBtn, pressed && !disabled && styles.pressed]}
      >
        <ThemedText
          style={[
            styles.footerLink,
            disabled ? { color: palette.textMuted } : { color: palette.text, textDecorationLine: 'underline' },
          ]}
        >
          {linkText}
        </ThemedText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  footerPrompt: {
    fontSize: 13,
    opacity: 0.7,
  },
  footerLinkBtn: {
    ...Platform.select({ web: { cursor: 'pointer' } as object }),
  },
  footerLink: {
    fontSize: 13,
    fontWeight: '700',
  },
  pillWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    gap: 12,
    overflow: 'hidden',
  },
  leftIcon: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 16, // 16px mencegah zoom otomatis di iOS Safari
    fontWeight: '500',
    paddingVertical: 0,
    backgroundColor: 'transparent',
    ...Platform.select({ web: { outlineWidth: 0 } as object }),
  },
  eyeBtn: {
    padding: 6,
    ...Platform.select({ web: { cursor: 'pointer' } as object }),
  },
  button: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } as object }),
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  pressed: {
    opacity: 0.75,
  },
});

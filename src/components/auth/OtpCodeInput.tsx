import React, { useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useAuthPalette } from './authPalette';

const OTP_LENGTH = 6;

interface OtpCodeInputProps {
  value: string;
  onChange: (code: string) => void;
  /** Dipanggil sekali saat 6 digit terisi (mis. untuk langsung verifikasi). */
  onComplete?: (code: string) => void;
  hasError?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
  /** Keterangan di atas kotak supaya pengguna tahu ini tempat mengisi kode. */
  label?: string;
}

/**
 * Input OTP 6 kotak. Di baliknya satu TextInput tak terlihat, jadi tempel (paste)
 * dan isi otomatis dari SMS/email (one-time-code) tetap bekerja.
 */
export const OtpCodeInput: React.FC<OtpCodeInputProps> = ({
  value,
  onChange,
  onComplete,
  hasError = false,
  disabled = false,
  autoFocus = false,
  label = 'Kode OTP (6 digit dari email)',
}) => {
  const palette = useAuthPalette();
  const inputRef = useRef<TextInput>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleChange = (text: string) => {
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    onChange(digits);
    if (digits.length === OTP_LENGTH && value.length !== OTP_LENGTH) {
      onComplete?.(digits);
    }
  };

  const activeIndex = Math.min(value.length, OTP_LENGTH - 1);

  return (
    <Pressable
      onPress={() => inputRef.current?.focus()}
      disabled={disabled}
      accessibilityLabel="Kode OTP 6 digit"
      style={styles.wrapper}
    >
      <Text style={[styles.label, { color: hasError ? palette.danger : palette.textMuted }]}>{label}</Text>

      <View style={styles.row} pointerEvents="none">
        {Array.from({ length: OTP_LENGTH }, (_, index) => {
          const digit = value[index] ?? '';
          const isActive = isFocused && index === activeIndex;
          const borderColor = hasError ? palette.danger : isActive ? palette.primary : 'transparent';

          return (
            <View
              key={index}
              style={[
                styles.box,
                {
                  borderColor,
                  backgroundColor: palette.inputBg,
                },
              ]}
            >
              {digit ? (
                <Text style={[styles.digit, { color: palette.text }]}>{digit}</Text>
              ) : !isActive ? (
                // Penanda kotak kosong
                <View style={[styles.placeholderDash, { backgroundColor: palette.placeholder }]} />
              ) : null}
              {isActive && !digit ? <View style={[styles.caret, { backgroundColor: palette.primary }]} /> : null}
            </View>
          );
        })}
      </View>

      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={handleChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        editable={!disabled}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={OTP_LENGTH}
        caretHidden
        style={styles.hiddenInput}
        accessibilityLabel="Kode OTP"
      />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    ...Platform.select({ web: { cursor: 'text' } as object }),
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 10,
  },
  placeholderDash: {
    width: 12,
    height: 2,
    borderRadius: 1,
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    // Kotak mengisi lebar di layar sempit; di layar lebar berhenti di maxWidth dan dirapatkan ke tengah.
    justifyContent: 'center',
    gap: 10,
  },
  box: {
    flex: 1,
    maxWidth: 56,
    aspectRatio: 0.85,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {
    fontFamily: Fonts.sans,
    fontSize: 24,
    fontWeight: '500',
  },
  caret: {
    position: 'absolute',
    width: 2,
    height: 24,
    borderRadius: 1,
  },
  hiddenInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    ...Platform.select({ web: { color: 'transparent', caretColor: 'transparent', outlineWidth: 0 } as object }),
  },
});

import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AlertBanner } from '@/components/auth/AlertBanner';
import { AuthHeroShell } from '@/components/auth/AuthHeroShell';
import { AuthFooterLink, AuthPillButton, AuthPillInput } from '@/components/auth/AuthPill';
import { OtpCodeInput } from '@/components/auth/OtpCodeInput';
import { useAuthPalette } from '@/components/auth/authPalette';
import { describeOtpError } from '@/features/auth/otpErrors';
import { useResendCooldown } from '@/features/auth/useResendCooldown';
import { useResendOtp } from '@/features/auth/useResendOtp';
import { useResetPassword } from '@/features/auth/useResetPassword';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const palette = useAuthPalette();
  const params = useLocalSearchParams<{ email?: string; initialMessage?: string }>();

  const [email, setEmail] = useState(params.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(params.initialMessage || null);

  const resetMutation = useResetPassword();
  const resendMutation = useResendOtp();
  // Datang dari "Lupa kata sandi": kode baru saja dikirim, kirim ulang aktif setelah 60 detik.
  const cooldown = useResendCooldown(true);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/login'));

  const handleResend = () => {
    if (!cooldown.canResend || resendMutation.isPending) return;
    setErrorMessage(null);
    if (!email.trim()) {
      setErrorMessage('Alamat email wajib diisi.');
      return;
    }

    resendMutation.mutate(
      { email: email.trim(), type: 'PasswordReset' },
      {
        onSuccess: (data) => {
          setSuccessMessage(data.message);
          setOtpCode('');
          cooldown.restart();
        },
        onError: (err) => setErrorMessage(describeOtpError(err, 'Gagal mengirim ulang kode OTP.').message),
      }
    );
  };

  const handleReset = () => {
    setErrorMessage(null);
    if (!email.trim() || otpCode.length !== 6 || !newPassword) {
      setErrorMessage('Isi email, 6 digit kode, dan kata sandi baru.');
      return;
    }
    if (newPassword.length < 6) {
      setErrorMessage('Kata sandi baru minimal 6 karakter.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    resetMutation.mutate(
      { email: email.trim(), otpCode, newPassword },
      {
        onSuccess: (data) => {
          setSuccessMessage(data.message);
          setTimeout(() => router.replace('/login'), 1500);
        },
        onError: (err) => {
          setErrorMessage(
            describeOtpError(err, 'Gagal mengatur ulang kata sandi. Pastikan kode OTP benar.').message
          );
          setOtpCode('');
        },
      }
    );
  };

  const resendLabel = resendMutation.isPending
    ? 'Mengirim…'
    : cooldown.canResend
      ? 'Kirim ulang'
      : `Kirim ulang (${cooldown.secondsLeft} dtk)`;

  return (
    <AuthHeroShell
      greeting="Kata sandi baru"
      greetingSubtitle="Buat kata sandi baru untuk akunmu"
      cardTitle="RESET KATA SANDI"
      navIcon="back"
      onNavPress={goBack}
    >
      <ThemedText style={[styles.lead, { color: palette.textMuted }]}>
        Masukkan kode 6 digit dari email, lalu buat kata sandi baru.
      </ThemedText>

      {errorMessage ? (
        <View style={styles.alert}>
          <AlertBanner type="error" message={errorMessage} />
        </View>
      ) : successMessage ? (
        <View style={styles.alert}>
          <AlertBanner type="success" message={successMessage} />
        </View>
      ) : null}

      <View style={styles.formGroup}>
        <AuthPillInput
          icon="mail"
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
        />

        <OtpCodeInput
          value={otpCode}
          onChange={(code) => {
            setOtpCode(code);
            if (errorMessage) setErrorMessage(null);
          }}
          hasError={!!errorMessage && otpCode.length === 0}
          disabled={resetMutation.isPending}
        />

        <AuthPillInput
          icon="lock"
          placeholder="Kata sandi baru"
          value={newPassword}
          onChangeText={setNewPassword}
          isPassword
          autoComplete="new-password"
        />
        <AuthPillInput
          icon="lock"
          placeholder="Ulangi kata sandi baru"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          isPassword
          autoComplete="new-password"
          onSubmitEditing={handleReset}
        />

        <View style={styles.buttonSpacer} />
        <AuthPillButton title="Simpan Kata Sandi" onPress={handleReset} isLoading={resetMutation.isPending} />
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />

      <AuthFooterLink
        prompt="Belum menerima kode?"
        linkText={resendLabel}
        onPress={handleResend}
        disabled={!cooldown.canResend || resendMutation.isPending}
      />
    </AuthHeroShell>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  alert: {
    marginBottom: 14,
  },
  formGroup: {
    gap: 14,
  },
  buttonSpacer: {
    height: 4,
  },
  divider: {
    height: 1,
    marginVertical: 26,
  },
});

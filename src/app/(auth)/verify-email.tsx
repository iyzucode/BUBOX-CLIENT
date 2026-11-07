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
import { useVerifyEmail } from '@/features/auth/useVerifyEmail';

const isEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export default function VerifyEmailScreen() {
  const router = useRouter();
  const palette = useAuthPalette();
  const params = useLocalSearchParams<{ email?: string; initialMessage?: string; otpSent?: string }>();

  const initialEmail = params.email ?? '';
  const [email, setEmail] = useState(initialEmail);
  const [isEditingEmail, setIsEditingEmail] = useState(!isEmail(initialEmail));
  const [otpCode, setOtpCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(params.initialMessage || null);

  // Setelah daftar, OTP baru saja dikirim: kirim ulang aktif setelah 60 detik.
  // Dari layar login (akun belum terverifikasi), belum ada OTP: kirim ulang langsung aktif.
  const cooldown = useResendCooldown(params.otpSent === '1');

  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendOtp();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/login'));

  const submit = (code: string) => {
    setErrorMessage(null);
    if (!isEmail(email)) {
      setErrorMessage('Masukkan alamat email yang valid.');
      return;
    }
    if (code.length !== 6) {
      setErrorMessage('Masukkan 6 digit kode OTP.');
      return;
    }

    verifyMutation.mutate(
      { email: email.trim(), otpCode: code },
      {
        onSuccess: () => router.replace('/'),
        onError: (err) => {
          setErrorMessage(describeOtpError(err, 'Verifikasi gagal. Pastikan kode OTP benar.').message);
          setOtpCode('');
        },
      }
    );
  };

  const handleResend = () => {
    if (!cooldown.canResend || resendMutation.isPending) return;
    setErrorMessage(null);
    if (!isEmail(email)) {
      setErrorMessage('Masukkan alamat email yang valid.');
      return;
    }

    resendMutation.mutate(
      { email: email.trim(), type: 'EmailVerification' },
      {
        onSuccess: (data) => {
          setSuccessMessage(data.message);
          setOtpCode('');
          setIsEditingEmail(false);
          cooldown.restart();
        },
        onError: (err) => setErrorMessage(describeOtpError(err, 'Gagal mengirim ulang kode OTP.').message),
      }
    );
  };

  const resendLabel = resendMutation.isPending
    ? 'Mengirim…'
    : cooldown.canResend
      ? isEditingEmail
        ? 'Kirim kode'
        : 'Kirim ulang'
      : `Kirim ulang (${cooldown.secondsLeft} dtk)`;

  return (
    <AuthHeroShell
      greeting="Satu langkah lagi!"
      greetingSubtitle="Verifikasi email akun LUANNA kamu"
      cardTitle="VERIFIKASI"
      navIcon="back"
      onNavPress={goBack}
    >
      {isEditingEmail ? (
        <ThemedText style={[styles.lead, { color: palette.textMuted }]}>
          Masukkan email akunmu, lalu tekan &quot;Kirim kode&quot; untuk menerima kode 6 digit.
        </ThemedText>
      ) : (
        <ThemedText style={[styles.lead, { color: palette.textMuted }]}>
          Masukkan kode 6 digit yang kami kirim ke{' '}
          <ThemedText style={[styles.leadStrong, { color: palette.text }]}>{email.trim()}</ThemedText>
          {'  '}
          <ThemedText onPress={() => setIsEditingEmail(true)} style={[styles.link, { color: palette.primary }]}>
            Ubah
          </ThemedText>
        </ThemedText>
      )}

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
        {isEditingEmail ? (
          <AuthPillInput
            icon="mail"
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoComplete="email"
          />
        ) : null}

        <OtpCodeInput
          value={otpCode}
          onChange={(code) => {
            setOtpCode(code);
            if (errorMessage) setErrorMessage(null);
          }}
          onComplete={submit}
          hasError={!!errorMessage}
          disabled={verifyMutation.isPending}
          autoFocus={!isEditingEmail}
        />

        <View style={styles.buttonSpacer} />
        <AuthPillButton
          title="Verifikasi"
          onPress={() => submit(otpCode)}
          isLoading={verifyMutation.isPending}
          disabled={otpCode.length !== 6}
        />
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />

      <AuthFooterLink
        prompt={isEditingEmail ? 'Belum punya kode?' : 'Belum menerima kode?'}
        linkText={resendLabel}
        onPress={handleResend}
        disabled={!cooldown.canResend || resendMutation.isPending}
      />

      <ThemedText style={[styles.hint, { color: palette.textMuted }]}>
        Kode berlaku 10 menit. Tidak ada di kotak masuk? Cek folder spam atau promosi.
      </ThemedText>
    </AuthHeroShell>
  );
}

const styles = StyleSheet.create({
  lead: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 20,
  },
  leadStrong: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  link: {
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
    textDecorationLine: 'underline',
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
  hint: {
    marginTop: 14,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
});

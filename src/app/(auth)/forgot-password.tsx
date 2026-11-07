import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { AlertBanner } from '@/components/auth/AlertBanner';
import { AuthHeroShell } from '@/components/auth/AuthHeroShell';
import { AuthFooterLink, AuthPillButton, AuthPillInput } from '@/components/auth/AuthPill';
import { useAuthPalette } from '@/components/auth/authPalette';
import { describeOtpError } from '@/features/auth/otpErrors';
import { useForgotPassword } from '@/features/auth/useForgotPassword';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const palette = useAuthPalette();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const forgotMutation = useForgotPassword();

  const goBack = () => (router.canGoBack() ? router.back() : router.replace('/login'));

  const handleSubmit = () => {
    setErrorMessage(null);
    if (!email.trim()) {
      setErrorMessage('Alamat email wajib diisi.');
      return;
    }

    forgotMutation.mutate(
      { email: email.trim() },
      {
        onSuccess: (data) => {
          router.push({
            pathname: '/reset-password',
            params: { email: email.trim(), initialMessage: data.message },
          });
        },
        onError: (err) =>
          setErrorMessage(describeOtpError(err, 'Gagal memproses permintaan reset kata sandi.').message),
      }
    );
  };

  return (
    <AuthHeroShell
      greeting="Lupa kata sandi?"
      greetingSubtitle="Tenang, kami bantu pulihkan akunmu"
      cardTitle="LUPA KATA SANDI"
      navIcon="back"
      onNavPress={goBack}
    >
      <ThemedText style={[styles.lead, { color: palette.textMuted }]}>
        Masukkan email akunmu. Kami akan mengirim kode 6 digit untuk membuat kata sandi baru.
      </ThemedText>

      {errorMessage ? (
        <View style={styles.alert}>
          <AlertBanner type="error" message={errorMessage} />
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
          onSubmitEditing={handleSubmit}
        />
        <View style={styles.buttonSpacer} />
        <AuthPillButton title="Kirim Kode" onPress={handleSubmit} isLoading={forgotMutation.isPending} />
      </View>

      <View style={[styles.divider, { backgroundColor: palette.border }]} />

      <AuthFooterLink prompt="Ingat kata sandimu?" linkText="Login di sini" onPress={() => router.replace('/login')} />
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

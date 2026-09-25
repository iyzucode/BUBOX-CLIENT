import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { AlertBanner } from '@/components/auth/AlertBanner';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useResetPassword } from '@/features/auth/useResetPassword';
import { ApiErrorResponse } from '@/types/auth';

export default function ResetPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; initialMessage?: string }>();

  const [email, setEmail] = useState(params.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    params.initialMessage || null
  );

  const resetMutation = useResetPassword();

  const handleReset = () => {
    setErrorMessage(null);

    if (!email.trim() || !otpCode.trim() || !newPassword) {
      setErrorMessage('Semua field wajib diisi.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Kata sandi baru minimal terdiri dari 6 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    resetMutation.mutate(
      {
        email: email.trim(),
        otpCode: otpCode.trim(),
        newPassword,
      },
      {
        onSuccess: (data) => {
          setSuccessMessage(data.message);
          setTimeout(() => {
            router.replace('/login');
          }, 1500);
        },
        onError: (err) => {
          const apiError = (err as any)?.response?.data as ApiErrorResponse | undefined;
          setErrorMessage(
            apiError?.message || 'Gagal mengatur ulang kata sandi. Pastikan kode OTP benar.'
          );
        },
      }
    );
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Minimalist Card */}
            <View
              style={[
                styles.authCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              {/* Header */}
              <View style={styles.header}>
                <View
                  style={[
                    styles.logoMark,
                    { backgroundColor: theme.primary },
                  ]}
                >
                  <ThemedText type="smallBold" style={styles.logoMarkText}>
                    🔒
                  </ThemedText>
                </View>

                <ThemedText type="subtitle" style={styles.title}>
                  Kata Sandi Baru
                </ThemedText>

                <ThemedText type="small" style={styles.subtitle}>
                  Masukkan kode OTP dan buat kata sandi baru untuk akun Anda
                </ThemedText>
              </View>

              {/* Alerts */}
              {successMessage ? (
                <AlertBanner type="success" message={successMessage} />
              ) : null}

              {errorMessage ? (
                <AlertBanner type="error" message={errorMessage} />
              ) : null}

              {/* Form Fields */}
              <View style={styles.form}>
                <AuthInput
                  label="Alamat Email"
                  placeholder="nama@perusahaan.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoComplete="email"
                />

                <AuthInput
                  label="Kode OTP (6 Digit)"
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  maxLength={6}
                  style={styles.otpInput}
                />

                <AuthInput
                  label="Kata Sandi Baru"
                  placeholder="Minimal 6 karakter"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  isPassword
                />

                <AuthInput
                  label="Konfirmasi Kata Sandi Baru"
                  placeholder="Ulangi kata sandi baru"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  isPassword
                />

                <AuthButton
                  title="Simpan Kata Sandi Baru"
                  onPress={handleReset}
                  isLoading={resetMutation.isPending}
                  style={styles.submitBtn}
                />
              </View>
            </View>

            {/* Back to Login Link */}
            <Pressable
              onPress={() => router.replace('/login')}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <ThemedText type="small" style={styles.backText}>
                ← Kembali ke Halaman Login
              </ThemedText>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: Spacing.four,
    alignItems: 'center',
    gap: Spacing.three,
  },
  authCard: {
    maxWidth: 420,
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    paddingBottom: 4,
  },
  logoMark: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  logoMarkText: {
    fontSize: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
  },
  form: {
    gap: Spacing.three,
    marginTop: 4,
  },
  otpInput: {
    letterSpacing: 8,
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  submitBtn: {
    marginTop: 6,
  },
  backButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    cursor: 'pointer' as any,
  },
  backText: {
    fontSize: 13,
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.7,
  },
});

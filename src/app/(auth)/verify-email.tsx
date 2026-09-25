import React, { useEffect, useState } from 'react';
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
import { useVerifyEmail } from '@/features/auth/useVerifyEmail';
import { useResendOtp } from '@/features/auth/useResendOtp';
import { ApiErrorResponse } from '@/types/auth';

export default function VerifyEmailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ email?: string; initialMessage?: string }>();

  const [email, setEmail] = useState(params.email || '');
  const [otpCode, setOtpCode] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    params.initialMessage || null
  );
  const [countdown, setCountdown] = useState(60);

  const verifyMutation = useVerifyEmail();
  const resendMutation = useResendOtp();

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleVerify = () => {
    setErrorMessage(null);

    if (!email.trim() || !otpCode.trim()) {
      setErrorMessage('Email dan kode OTP 6-digit wajib diisi.');
      return;
    }

    verifyMutation.mutate(
      { email: email.trim(), otpCode: otpCode.trim() },
      {
        onSuccess: (data) => {
          setSuccessMessage(data.message);
          setTimeout(() => {
            router.replace('/login');
          }, 1500);
        },
        onError: (err) => {
          const apiError = (err as any)?.response?.data as ApiErrorResponse | undefined;
          setErrorMessage(apiError?.message || 'Verifikasi gagal. Pastikan kode OTP benar.');
        },
      }
    );
  };

  const handleResend = () => {
    if (countdown > 0) return;
    setErrorMessage(null);

    resendMutation.mutate(
      { email: email.trim(), type: 'EmailVerification' },
      {
        onSuccess: (data) => {
          setSuccessMessage(data.message);
          setCountdown(60);
        },
        onError: (err) => {
          const apiError = (err as any)?.response?.data as ApiErrorResponse | undefined;
          setErrorMessage(apiError?.message || 'Gagal mengirim ulang kode OTP.');
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
                    ✉
                  </ThemedText>
                </View>

                <ThemedText type="subtitle" style={styles.title}>
                  Verifikasi Email
                </ThemedText>

                <ThemedText type="small" style={styles.subtitle}>
                  Masukkan kode OTP 6-digit yang dikirimkan ke alamat email Anda
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

                <AuthButton
                  title="Verifikasi Akun"
                  onPress={handleVerify}
                  isLoading={verifyMutation.isPending}
                  style={styles.submitBtn}
                />
              </View>

              {/* Resend Section */}
              <View style={styles.resendSection}>
                <ThemedText type="small" style={styles.resendLabel}>
                  Belum menerima kode OTP?{' '}
                </ThemedText>
                <Pressable
                  onPress={handleResend}
                  disabled={countdown > 0 || resendMutation.isPending}
                  style={styles.resendBtn}
                >
                  <ThemedText
                    type="smallBold"
                    style={[
                      styles.resendText,
                      { color: theme.primary },
                      countdown > 0 && styles.disabledResend,
                    ]}
                  >
                    {countdown > 0 ? `Kirim Ulang (${countdown}d)` : 'Kirim Ulang'}
                  </ThemedText>
                </Pressable>
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
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
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
  resendSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ffffff10',
    marginTop: 4,
    flexWrap: 'wrap',
  },
  resendLabel: {
    fontSize: 13,
    opacity: 0.7,
  },
  resendBtn: {
    cursor: 'pointer' as any,
  },
  resendText: {
    fontSize: 13,
    fontWeight: '600',
  },
  disabledResend: {
    opacity: 0.4,
    cursor: 'not-allowed' as any,
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

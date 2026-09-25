import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthButton } from '@/components/auth/AuthButton';
import { AlertBanner } from '@/components/auth/AlertBanner';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useLogin } from '@/features/auth/useLogin';
import { ApiErrorResponse } from '@/types/auth';

export default function LoginScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);

  const loginMutation = useLogin();

  const handleLogin = () => {
    setErrorMessage(null);
    setIsUnverified(false);

    if (!email.trim() || !password) {
      setErrorMessage('Email/Username dan kata sandi wajib diisi.');
      return;
    }

    loginMutation.mutate(
      { email: email.trim(), password },
      {
        onSuccess: () => {
          router.replace('/');
        },
        onError: (err) => {
          const apiError = (err as any)?.response?.data as ApiErrorResponse | undefined;
          if (apiError?.errorCode === 'EMAIL_NOT_VERIFIED') {
            setIsUnverified(true);
            setErrorMessage(apiError.message || 'Akun Anda belum diverifikasi.');
          } else {
            setErrorMessage(apiError?.message || 'Login gagal. Periksa kembali email dan kata sandi Anda.');
          }
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
            {/* Minimalist Card Container */}
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
                    B
                  </ThemedText>
                </View>

                <ThemedText type="subtitle" style={styles.title}>
                  Masuk ke Bubox
                </ThemedText>

                <ThemedText type="small" style={styles.subtitle}>
                  Gunakan kredensial Anda untuk mengakses dashboard
                </ThemedText>
              </View>

              {/* Error / Warning Alerts */}
              {isUnverified ? (
                <AlertBanner
                  type="warning"
                  title="Akun Belum Terverifikasi"
                  message="Email Anda belum diverifikasi. Masukkan kode OTP 6-digit untuk mengaktifkan akun."
                  actionText="Verifikasi Sekarang"
                  onAction={() =>
                    router.push({
                      pathname: '/verify-email',
                      params: { email: email.trim() },
                    })
                  }
                />
              ) : errorMessage ? (
                <AlertBanner type="error" message={errorMessage} />
              ) : null}

              {/* Form Fields */}
              <View style={styles.form}>
                <AuthInput
                  label="Email atau Username"
                  placeholder="nama@email.com atau username"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                />

                <AuthInput
                  label="Kata Sandi"
                  placeholder="••••••••"
                  value={password}
                  onChangeText={setPassword}
                  isPassword
                />

                <View style={styles.forgotRow}>
                  <Pressable
                    onPress={() => router.push('/forgot-password')}
                    style={styles.forgotBtn}
                  >
                    <ThemedText
                      type="small"
                      style={[styles.linkText, { color: theme.primary }]}
                    >
                      Lupa kata sandi?
                    </ThemedText>
                  </Pressable>
                </View>

                <AuthButton
                  title="Masuk ke Akun"
                  onPress={handleLogin}
                  isLoading={loginMutation.isPending}
                />
              </View>

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <ThemedText type="small" style={styles.footerPrompt}>
                  Belum memiliki akun?{' '}
                </ThemedText>
                <Pressable
                  onPress={() => router.push('/register')}
                  style={styles.registerLink}
                >
                  <ThemedText
                    type="smallBold"
                    style={[styles.linkText, { color: theme.primary }]}
                  >
                    Daftar di sini
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* Back to Home Link */}
            <Pressable
              onPress={() => router.replace('/')}
              style={({ pressed }) => [
                styles.backButton,
                pressed && styles.pressed,
              ]}
            >
              <ThemedText type="small" style={styles.backText}>
                ← Kembali ke Beranda
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
    fontSize: 20,
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
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: -4,
  },
  forgotBtn: {
    cursor: 'pointer' as any,
    paddingVertical: 2,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ffffff10',
    marginTop: 4,
  },
  footerPrompt: {
    fontSize: 13,
    opacity: 0.7,
  },
  registerLink: {
    cursor: 'pointer' as any,
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

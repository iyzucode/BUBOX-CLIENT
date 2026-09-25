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
import { useForgotPassword } from '@/features/auth/useForgotPassword';
import { ApiErrorResponse } from '@/types/auth';

export default function ForgotPasswordScreen() {
  const theme = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const forgotMutation = useForgotPassword();

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
            params: {
              email: email.trim(),
              initialMessage: data.message,
            },
          });
        },
        onError: (err) => {
          const apiError = (err as any)?.response?.data as ApiErrorResponse | undefined;
          setErrorMessage(
            apiError?.message || 'Gagal memproses permintaan reset kata sandi.'
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
                    🔑
                  </ThemedText>
                </View>

                <ThemedText type="subtitle" style={styles.title}>
                  Lupa Kata Sandi
                </ThemedText>

                <ThemedText type="small" style={styles.subtitle}>
                  Masukkan alamat email Anda untuk menerima kode pemulihan kata sandi
                </ThemedText>
              </View>

              {/* Error Alert */}
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

                <AuthButton
                  title="Kirim Kode OTP"
                  onPress={handleSubmit}
                  isLoading={forgotMutation.isPending}
                  style={styles.submitBtn}
                />
              </View>

              {/* Card Footer */}
              <View style={styles.cardFooter}>
                <ThemedText type="small" style={styles.footerPrompt}>
                  Ingat kata sandi Anda?{' '}
                </ThemedText>
                <Pressable
                  onPress={() => router.push('/login')}
                  style={styles.loginLink}
                >
                  <ThemedText
                    type="smallBold"
                    style={[styles.linkText, { color: theme.primary }]}
                  >
                    Masuk di sini
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
  submitBtn: {
    marginTop: 6,
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
  loginLink: {
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

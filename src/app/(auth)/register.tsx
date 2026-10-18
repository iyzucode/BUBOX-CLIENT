import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { AlertBanner } from '@/components/auth/AlertBanner';
import { useThemeContext } from '@/context/ThemeContext';
import { useRegister } from '@/features/auth/useRegister';
import { ApiErrorResponse } from '@/types/auth';

const babyHeroImage = require('@/assets/images/login-hero.jpg');

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isDark } = useThemeContext();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const registerMutation = useRegister();

  const handleRegister = () => {
    setErrorMessage(null);

    const trimmedFullName = fullName.trim();
    const trimmedUsername = username.trim().toLowerCase();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedFullName || !trimmedUsername || !trimmedEmail || !password) {
      setErrorMessage('Semua field formulir wajib diisi.');
      return;
    }

    if (!/^[a-zA-Z0-9_]{3,30}$/.test(trimmedUsername)) {
      setErrorMessage('Username harus 3-30 karakter alfanumerik (huruf, angka, atau _).');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Kata sandi minimal terdiri dari 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    registerMutation.mutate(
      {
        fullName: trimmedFullName,
        username: trimmedUsername,
        email: trimmedEmail,
        password,
      },
      {
        onSuccess: (data) => {
          router.push({
            pathname: '/verify-email',
            params: {
              email: trimmedEmail,
              initialMessage: data.message,
            },
          });
        },
        onError: (err) => {
          const apiError = (err as any)?.response?.data as ApiErrorResponse | undefined;
          setErrorMessage(
            apiError?.message || 'Registrasi gagal. Silakan coba kembali nanti.'
          );
        },
      }
    );
  };

  const cardBg = isDark ? '#1F2937' : '#F5F5F7';
  const inputBg = isDark ? '#374151' : '#B2B6BC';
  const textColor = isDark ? '#F9FAFB' : '#111827';
  const placeholderColor = isDark ? '#9CA3AF' : '#5C6370';
  const iconColor = isDark ? '#E5E7EB' : '#1A1C1E';
  const primaryButtonBg = '#636974';
  const socialButtonBg = isDark ? '#374151' : '#737882';
  const dividerLineColor = isDark ? '#374151' : '#D1D5DB';

  // Inject autofill stylesheet on web to eliminate the white rectangle clash
  useEffect(() => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const styleId = 'register-pill-autofill-fix';
      let style = document.getElementById(styleId) as HTMLStyleElement | null;
      if (!style) {
        style = document.createElement('style');
        style.id = styleId;
        document.head.appendChild(style);
      }
      style.innerHTML = `
        input.pill-input,
        input.pill-input:focus,
        input.pill-input:active {
          background-color: transparent !important;
          color: ${textColor} !important;
        }
        input.pill-input:-webkit-autofill,
        input.pill-input:-webkit-autofill:hover, 
        input.pill-input:-webkit-autofill:focus, 
        input.pill-input:-webkit-autofill:active {
          -webkit-box-shadow: 0 0 0 1000px ${inputBg} inset !important;
          -webkit-text-fill-color: ${textColor} !important;
          caret-color: ${textColor} !important;
          transition: background-color 5000000s ease-in-out 0s !important;
          border-radius: 24px !important;
          background-color: ${inputBg} !important;
        }
      `;
    }
  }, [inputBg, textColor]);

  return (
    <View style={[styles.rootContainer, { backgroundColor: isDark ? '#111827' : '#F5F5F7' }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isDesktop && styles.desktopScrollContent,
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Main Form Wrapper */}
          <View style={[styles.cardContainer, isDesktop && styles.desktopCardContainer]}>
            {/* Top Baby Hero Banner */}
            <View style={styles.heroBanner}>
              <Image
                source={babyHeroImage}
                style={styles.heroImage}
                resizeMode="cover"
              />

              {/* Gradient / Shadow Overlay */}
              <View style={styles.heroOverlay} />

              {/* Back to Login Button */}
              <Pressable
                onPress={() => router.replace('/login')}
                style={[
                  styles.backBtn,
                  { top: insets.top > 0 ? insets.top + 8 : 16 },
                ]}
                accessibilityLabel="Kembali ke Login"
                accessibilityRole="button"
              >
                {Platform.OS === 'web' ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="19" y1="12" x2="5" y2="12" />
                    <polyline points="12 19 5 12 12 5" />
                  </svg>
                ) : (
                  <ThemedText style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '700' }}>←</ThemedText>
                )}
              </Pressable>

              {/* Hero Greeting Text */}
              <View style={[styles.heroTextContainer, { top: insets.top > 0 ? insets.top + 74 : 80 }]}>
                <ThemedText style={styles.greetingTitle}>Halo!</ThemedText>
                <ThemedText style={styles.greetingSubtitle}>
                  Daftar akun di LUANNA
                </ThemedText>
              </View>
            </View>

            {/* Bottom Form Card */}
            <View style={[styles.formCard, { backgroundColor: cardBg }]}>
              {/* Card Title */}
              <ThemedText style={[styles.registerTitle, { color: textColor }]}>
                REGISTER
              </ThemedText>

              {/* Error Alert */}
              {errorMessage ? (
                <View style={{ marginBottom: 14 }}>
                  <AlertBanner type="error" message={errorMessage} />
                </View>
              ) : null}

              {/* Form Inputs */}
              <View style={styles.formGroup}>
                {/* 1. Full Name */}
                <View style={[styles.pillInputWrapper, { backgroundColor: inputBg }]}>
                  <View style={styles.inputLeftIcon}>
                    {Platform.OS === 'web' ? (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill={iconColor}>
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                      </svg>
                    ) : (
                      <ThemedText style={{ fontSize: 15 }}>👤</ThemedText>
                    )}
                  </View>
                  <TextInput
                    style={[styles.pillInput, { color: textColor, backgroundColor: 'transparent' }]}
                    placeholder="Nama Lengkap"
                    placeholderTextColor={placeholderColor}
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                    {...(Platform.OS === 'web' ? ({ className: 'pill-input' } as any) : {})}
                  />
                </View>

                {/* 2. Username */}
                <View style={[styles.pillInputWrapper, { backgroundColor: inputBg }]}>
                  <View style={styles.inputLeftIcon}>
                    {Platform.OS === 'web' ? (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="4" />
                        <path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94" />
                      </svg>
                    ) : (
                      <ThemedText style={{ fontSize: 15 }}>@</ThemedText>
                    )}
                  </View>
                  <TextInput
                    style={[styles.pillInput, { color: textColor, backgroundColor: 'transparent' }]}
                    placeholder="Username"
                    placeholderTextColor={placeholderColor}
                    value={username}
                    onChangeText={(text) =>
                      setUsername(text.toLowerCase().replace(/[^a-zA-Z0-9_]/g, ''))
                    }
                    autoCapitalize="none"
                    autoCorrect={false}
                    {...(Platform.OS === 'web' ? ({ className: 'pill-input' } as any) : {})}
                  />
                </View>

                {/* 3. Email */}
                <View style={[styles.pillInputWrapper, { backgroundColor: inputBg }]}>
                  <View style={styles.inputLeftIcon}>
                    {Platform.OS === 'web' ? (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill={iconColor}>
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                      </svg>
                    ) : (
                      <ThemedText style={{ fontSize: 15 }}>✉</ThemedText>
                    )}
                  </View>
                  <TextInput
                    style={[styles.pillInput, { color: textColor, backgroundColor: 'transparent' }]}
                    placeholder="Email"
                    placeholderTextColor={placeholderColor}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    {...(Platform.OS === 'web' ? ({ className: 'pill-input' } as any) : {})}
                  />
                </View>

                {/* 4. Password */}
                <View style={[styles.pillInputWrapper, { backgroundColor: inputBg }]}>
                  <View style={styles.inputLeftIcon}>
                    {Platform.OS === 'web' ? (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill={iconColor}>
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                      </svg>
                    ) : (
                      <ThemedText style={{ fontSize: 15 }}>🔒</ThemedText>
                    )}
                  </View>
                  <TextInput
                    style={[styles.pillInput, { color: textColor, backgroundColor: 'transparent' }]}
                    placeholder="Kata Sandi (min. 6 karakter)"
                    placeholderTextColor={placeholderColor}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                    {...(Platform.OS === 'web' ? ({ className: 'pill-input' } as any) : {})}
                  />
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeToggleBtn}
                    accessibilityLabel={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    accessibilityRole="button"
                  >
                    {Platform.OS === 'web' ? (
                      showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )
                    ) : (
                      <ThemedText style={{ fontSize: 16 }}>{showPassword ? '👁' : '🙈'}</ThemedText>
                    )}
                  </Pressable>
                </View>

                {/* 5. Confirm Password */}
                <View style={[styles.pillInputWrapper, { backgroundColor: inputBg }]}>
                  <View style={styles.inputLeftIcon}>
                    {Platform.OS === 'web' ? (
                      <svg width="19" height="19" viewBox="0 0 24 24" fill={iconColor}>
                        <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                      </svg>
                    ) : (
                      <ThemedText style={{ fontSize: 15 }}>🔒</ThemedText>
                    )}
                  </View>
                  <TextInput
                    style={[styles.pillInput, { color: textColor, backgroundColor: 'transparent' }]}
                    placeholder="Konfirmasi Kata Sandi"
                    placeholderTextColor={placeholderColor}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    autoCapitalize="none"
                    {...(Platform.OS === 'web' ? ({ className: 'pill-input' } as any) : {})}
                  />
                  <Pressable
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.eyeToggleBtn}
                    accessibilityLabel={showConfirmPassword ? 'Sembunyikan password' : 'Lihat password'}
                    accessibilityRole="button"
                  >
                    {Platform.OS === 'web' ? (
                      showConfirmPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                          <line x1="1" y1="1" x2="23" y2="23" />
                        </svg>
                      )
                    ) : (
                      <ThemedText style={{ fontSize: 16 }}>{showConfirmPassword ? '👁' : '🙈'}</ThemedText>
                    )}
                  </Pressable>
                </View>

                {/* Submit Register Button */}
                <Pressable
                  onPress={handleRegister}
                  disabled={registerMutation.isPending}
                  style={({ pressed }) => [
                    styles.registerButton,
                    { backgroundColor: primaryButtonBg },
                    pressed && styles.pressed,
                    registerMutation.isPending && { opacity: 0.8 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Tombol Daftar"
                >
                  {registerMutation.isPending ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <ThemedText style={styles.registerButtonText}>Daftar</ThemedText>
                  )}
                </Pressable>
              </View>

              {/* Divider: "Atau daftar dengan" */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: dividerLineColor }]} />
                <ThemedText style={styles.dividerText}>Atau daftar dengan</ThemedText>
                <View style={[styles.dividerLine, { backgroundColor: dividerLineColor }]} />
              </View>

              {/* Social Registration Buttons (Facebook, Google, Apple) */}
              <View style={styles.socialRow}>
                {/* Facebook */}
                <Pressable
                  style={({ pressed }) => [
                    styles.socialTile,
                    { backgroundColor: socialButtonBg },
                    pressed && styles.pressed,
                  ]}
                  accessibilityLabel="Daftar dengan Facebook"
                  accessibilityRole="button"
                >
                  {Platform.OS === 'web' ? (
                    <svg width="28" height="28" viewBox="0 0 24 24">
                      <circle cx="12" cy="12" r="12" fill={isDark ? '#F9FAFB' : '#1A1C1E'} />
                      <path
                        d="M14.5 12.3h-1.8v6.2h-2.6v-6.2H8.8v-2.3h1.3V8.4c0-1.7 1-2.9 2.9-2.9 0.9 0 1.6 0.1 1.6 0.1v2.1h-1c-0.8 0-1.1 0.5-1.1 1.1v1.3h2.3l-0.4 2.2z"
                        fill={isDark ? '#1F2937' : '#FFFFFF'}
                      />
                    </svg>
                  ) : (
                    <ThemedText style={{ fontSize: 20, color: isDark ? '#F9FAFB' : '#1A1C1E', fontWeight: '800' }}>f</ThemedText>
                  )}
                </Pressable>

                {/* Google */}
                <Pressable
                  style={({ pressed }) => [
                    styles.socialTile,
                    { backgroundColor: socialButtonBg },
                    pressed && styles.pressed,
                  ]}
                  accessibilityLabel="Daftar dengan Google"
                  accessibilityRole="button"
                >
                  {Platform.OS === 'web' ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={isDark ? '#F9FAFB' : '#1A1C1E'}>
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                  ) : (
                    <ThemedText style={{ fontSize: 20, color: isDark ? '#F9FAFB' : '#1A1C1E', fontWeight: '800' }}>G</ThemedText>
                  )}
                </Pressable>

                {/* Apple */}
                <Pressable
                  style={({ pressed }) => [
                    styles.socialTile,
                    { backgroundColor: socialButtonBg },
                    pressed && styles.pressed,
                  ]}
                  accessibilityLabel="Daftar dengan Apple"
                  accessibilityRole="button"
                >
                  {Platform.OS === 'web' ? (
                    <svg width="22" height="22" viewBox="0 0 24 24" fill={isDark ? '#F9FAFB' : '#1A1C1E'}>
                      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.87c.6-.74 1.02-1.76.9-2.79-.89.04-1.99.6-2.63 1.34-.56.65-.99 1.69-.88 2.69.99.08 2.01-.5 2.61-1.24z" />
                    </svg>
                  ) : (
                    <ThemedText style={{ fontSize: 20, color: isDark ? '#F9FAFB' : '#1A1C1E', fontWeight: '800' }}></ThemedText>
                  )}
                </Pressable>
              </View>

              {/* Login Link */}
              <View style={styles.footerRow}>
                <ThemedText style={[styles.footerPrompt, { color: textColor }]}>
                  Sudah memiliki akun?{' '}
                </ThemedText>
                <Pressable
                  onPress={() => router.push('/login')}
                  style={({ pressed }) => [pressed && styles.pressed]}
                >
                  <ThemedText style={[styles.loginLinkText, { color: textColor }]}>
                    Masuk di sini
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  desktopScrollContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  cardContainer: {
    width: '100%',
    flex: 1,
  },
  desktopCardContainer: {
    maxWidth: 440,
    borderRadius: 32,
    overflow: 'hidden',
    boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
  } as any,
  heroBanner: {
    height: 270,
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.28)',
  },
  backBtn: {
    position: 'absolute',
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  heroTextContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 5,
  },
  greetingTitle: {
    color: '#FFFFFF',
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  greetingSubtitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '400',
    opacity: 0.95,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  formCard: {
    flex: 1,
    marginTop: -32,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 28,
    paddingTop: 34,
    paddingBottom: 48,
  },
  registerTitle: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 24,
  },
  formGroup: {
    gap: 14,
  },
  pillInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    gap: 12,
    overflow: 'hidden',
  },
  inputLeftIcon: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillInput: {
    flex: 1,
    height: '100%',
    fontSize: 16, // Enforces 16px to prevent iOS Safari auto-zoom
    fontWeight: '500',
    paddingVertical: 0,
    backgroundColor: 'transparent',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
        backgroundColor: 'transparent',
      } as any,
    }),
  },
  eyeToggleBtn: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  registerButton: {
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  registerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: 12,
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    marginBottom: 28,
  },
  socialTile: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerPrompt: {
    fontSize: 13,
    opacity: 0.7,
  },
  loginLinkText: {
    fontSize: 13,
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  pressed: {
    opacity: 0.75,
  },
});

import React, { useEffect } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useCustomerLayout } from '@/hooks/use-customer-layout';
import { useAuthPalette } from './authPalette';

const heroImage = require('@/assets/images/login-hero.jpg');

interface AuthHeroShellProps {
  /** Sapaan besar di atas foto, mis. "Halo!" */
  greeting: string;
  /** Kalimat kecil di bawah sapaan. */
  greetingSubtitle: string;
  /** Judul besar di kartu form, mis. "VERIFIKASI". */
  cardTitle: string;
  /** Tombol kiri atas: "back" (panah) atau "close" (silang). */
  navIcon?: 'back' | 'close';
  onNavPress: () => void;
  children: React.ReactNode;
}

/**
 * Kerangka halaman auth yang sama dengan Login/Daftar:
 * foto hero + sapaan, lalu kartu form melengkung yang menimpa foto.
 */
export const AuthHeroShell: React.FC<AuthHeroShellProps> = ({
  greeting,
  greetingSubtitle,
  cardTitle,
  navIcon = 'back',
  onNavPress,
  children,
}) => {
  const insets = useSafeAreaInsets();
  const palette = useAuthPalette();
  const { width } = useCustomerLayout();
  const isDesktop = width > 768;

  // Isi otomatis browser (autofill) jangan menimpa latar input pil.
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const styleId = 'auth-pill-autofill-fix';
    let style = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement('style');
      style.id = styleId;
      document.head.appendChild(style);
    }
    style.innerHTML = `
      input.auth-pill-input, input.auth-pill-input:focus { background-color: transparent !important; color: ${palette.text} !important; }
      input.auth-pill-input:-webkit-autofill,
      input.auth-pill-input:-webkit-autofill:hover,
      input.auth-pill-input:-webkit-autofill:focus {
        -webkit-box-shadow: 0 0 0 1000px ${palette.inputBg} inset !important;
        -webkit-text-fill-color: ${palette.text} !important;
        caret-color: ${palette.text} !important;
        transition: background-color 5000000s ease-in-out 0s !important;
      }
    `;
  }, [palette.inputBg, palette.text]);

  const navTop = insets.top > 0 ? insets.top + 8 : 16;

  return (
    <View style={[styles.root, { backgroundColor: palette.pageBg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scrollContent, isDesktop && styles.desktopScrollContent]}
          showsVerticalScrollIndicator={false}
          bounces={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.cardContainer, isDesktop && styles.desktopCardContainer]}>
            {/* Foto hero */}
            <View style={styles.heroBanner}>
              <Image source={heroImage} style={styles.heroImage} resizeMode="cover" />
              <View style={styles.heroOverlay} />

              <Pressable
                onPress={onNavPress}
                style={[styles.navBtn, { top: navTop }]}
                accessibilityRole="button"
                accessibilityLabel={navIcon === 'close' ? 'Tutup' : 'Kembali'}
              >
                {Platform.OS === 'web' ? (
                  navIcon === 'close' ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                  ) : (
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="19" y1="12" x2="5" y2="12" />
                      <polyline points="12 19 5 12 12 5" />
                    </svg>
                  )
                ) : (
                  <ThemedText style={styles.navFallback}>{navIcon === 'close' ? '✕' : '←'}</ThemedText>
                )}
              </Pressable>

              <View style={[styles.heroText, { top: insets.top > 0 ? insets.top + 74 : 80 }]}>
                <ThemedText style={styles.greeting}>{greeting}</ThemedText>
                <ThemedText style={styles.greetingSubtitle}>{greetingSubtitle}</ThemedText>
              </View>
            </View>

            {/* Kartu form */}
            <View style={[styles.formCard, { backgroundColor: palette.cardBg }]}>
              <ThemedText style={[styles.cardTitle, { color: palette.text }]}>{cardTitle}</ThemedText>
              {children}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1 },
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
    ...Platform.select({ web: { boxShadow: '0 20px 40px rgba(0,0,0,0.15)' } as object }),
  },
  heroBanner: {
    height: 270,
    width: '100%',
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
  navBtn: {
    position: 'absolute',
    left: 18,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...Platform.select({ web: { cursor: 'pointer' } as object }),
  },
  navFallback: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  heroText: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 5,
  },
  greeting: {
    color: '#FFFFFF',
    fontSize: 34,
    lineHeight: 40,
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
  cardTitle: {
    fontSize: 26,
    lineHeight: 32,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
});

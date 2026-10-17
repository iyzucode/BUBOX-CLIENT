import React, { useState } from 'react';
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useThemeContext } from '@/context/ThemeContext';
import { ProfileBottomSheetModal } from '@/components/profile/ProfileBottomSheetModal';

// Asset Hero Image
const babyHeroImage = require('@/assets/images/baby-hero.jpg');

const HEADER_MIN_HEIGHT = 270;

export default function HomeScreen() {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  const insets = useSafeAreaInsets();
  const { width, height: windowHeight } = useWindowDimensions();
  const isDesktop = width > 768;

  const [isProfileSheetOpen, setIsProfileSheetOpen] = useState(false);

  // Hero banner takes ~80-84% of viewport height on mobile, creating a tall immersive hero section
  const HEADER_MAX_HEIGHT = isDesktop
    ? 680
    : Math.min(Math.max(Math.round(windowHeight * 0.82), 640), 760);
  const SCROLL_DISTANCE = HEADER_MAX_HEIGHT - HEADER_MIN_HEIGHT;

  const [scrollY, setScrollY] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setScrollY(offsetY);
  };

  // Calculate dynamic header height: from HEADER_MAX_HEIGHT down to HEADER_MIN_HEIGHT
  const clampedScroll = Math.min(Math.max(scrollY, 0), SCROLL_DISTANCE);
  const overscroll = scrollY < 0 ? -scrollY : 0;
  const headerHeight = HEADER_MAX_HEIGHT - clampedScroll + overscroll;
  const imageHeight = HEADER_MAX_HEIGHT + overscroll;
  const imageTop = -overscroll * 0.4;

  const topBarTop = insets.top > 0 ? insets.top + 14 : 20;

  return (
    <ThemedView style={styles.container}>
      {/* 1. COLLAPSIBLE HERO HEADER (CROPPED VERTICALLY ON SCROLL) */}
      <View
        style={[
          styles.heroHeader,
          {
            height: headerHeight,
            maxWidth: isDesktop ? 600 : '100%',
          },
        ]}
      >
        {/* Background Image: Fixed at top, bottom gets cropped as container height decreases */}
        <Image
          source={babyHeroImage}
          style={[
            styles.heroImage,
            {
              top: imageTop,
              height: imageHeight,
            },
          ]}
          resizeMode="cover"
        />

        {/* Smooth Natural Vignette Overlay for top buttons and bottom text contrast */}
        <View style={styles.gradientOverlay} />

        {/* Top Floating Navigation Buttons (Cart & Profile) */}
        <View style={[styles.topBar, { top: topBarTop }]}>
          {/* Cart Button */}
          <Pressable
            onPress={() => router.push('/order')}
            style={({ pressed }) => [
              styles.circleButton,
              pressed && styles.buttonPressed,
            ]}
            accessibilityLabel="Keranjang Pesanan"
            accessibilityRole="button"
          >
            {Platform.OS === 'web' ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#111827"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="9" cy="21" r="1.5" />
                <circle cx="20" cy="21" r="1.5" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
            ) : (
              <ThemedText style={styles.emojiIcon}>🛒</ThemedText>
            )}
          </Pressable>

          {/* User Profile Button - Opens Bottom Sheet Overlay */}
          <Pressable
            onPress={() => setIsProfileSheetOpen(true)}
            style={({ pressed }) => [
              styles.circleButton,
              pressed && styles.buttonPressed,
            ]}
            accessibilityLabel="Menu Profil"
            accessibilityRole="button"
          >
            {Platform.OS === 'web' ? (
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#111827"
                strokeWidth="2.3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            ) : (
              <ThemedText style={styles.emojiIcon}>👤</ThemedText>
            )}
          </Pressable>
        </View>

        {/* Bottom Hero Brand & CTA (Anchored above the bottom curve) */}
        <View style={styles.heroBottomContent}>
          <ThemedText style={styles.brandTitle}>LUANNA</ThemedText>
          <ThemedText style={styles.brandSubtitle}>your baby</ThemedText>
          <ThemedText style={styles.brandSubtitle}>our story</ThemedText>

          <Pressable
            onPress={() => router.push('/order')}
            style={({ pressed }) => [
              styles.pesanButton,
              pressed && styles.pesanButtonPressed,
            ]}
            accessibilityLabel="Pesan Katering MPASI"
            accessibilityRole="button"
          >
            <ThemedText style={styles.pesanButtonText}>Pesan</ThemedText>
          </Pressable>
        </View>
      </View>

      {/* 2. SCROLLABLE FEED & BLUEPRINT PLACEHOLDERS */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: HEADER_MAX_HEIGHT + 20,
            maxWidth: isDesktop ? 600 : '100%',
          },
        ]}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        {/* Section 1: Info terbaru */}
        <View style={styles.sectionContainer}>
          <ThemedText style={[styles.sectionHeading, { color: theme.text }]}>
            Info terbaru
          </ThemedText>
          <View
            style={[
              styles.blueprintCardLarge,
              { backgroundColor: isDark ? '#374151' : '#D1D5DB' },
            ]}
          />
        </View>

        {/* Section 2: Kebanggan kami */}
        <View style={styles.sectionContainer}>
          <ThemedText style={[styles.sectionHeading, { color: theme.text }]}>
            Kebanggan kami
          </ThemedText>
          <View style={styles.blueprintRow}>
            <View
              style={[
                styles.blueprintCardColumn,
                { backgroundColor: isDark ? '#374151' : '#D1D5DB' },
              ]}
            />
            <View
              style={[
                styles.blueprintCardColumn,
                { backgroundColor: isDark ? '#374151' : '#D1D5DB' },
              ]}
            />
            <View
              style={[
                styles.blueprintCardColumn,
                { backgroundColor: isDark ? '#374151' : '#D1D5DB' },
              ]}
            />
          </View>
        </View>

        {/* Section 3: Testimoni */}
        <View style={styles.sectionContainer}>
          <ThemedText style={[styles.sectionHeading, { color: theme.text }]}>
            Testimoni
          </ThemedText>
          <View
            style={[
              styles.blueprintCardLarge,
              { backgroundColor: isDark ? '#374151' : '#D1D5DB' },
            ]}
          />
        </View>
      </ScrollView>

      {/* Profile Bottom Sheet Modal */}
      <ProfileBottomSheetModal
        visible={isProfileSheetOpen}
        onClose={() => setIsProfileSheetOpen(false)}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  heroHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    alignSelf: 'center',
    marginHorizontal: 'auto',
    width: '100%',
    overflow: 'hidden',
    borderBottomLeftRadius: 36,
    borderBottomRightRadius: 36,
    backgroundColor: '#0F172A',
    pointerEvents: 'none' as any,
    ...Platform.select({
      web: {
        boxShadow: '0 10px 24px -4px rgba(0, 0, 0, 0.18)',
      },
      default: {
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 10,
      },
    }),
  },
  heroImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    ...Platform.select({
      web: {
        backgroundImage:
          'linear-gradient(180deg, rgba(0, 0, 0, 0.28) 0%, rgba(0, 0, 0, 0) 24%, rgba(0, 0, 0, 0.04) 52%, rgba(0, 0, 0, 0.58) 100%)',
      },
      default: {
        backgroundColor: 'rgba(0, 0, 0, 0.12)',
      },
    }),
  },
  topBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  circleButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    pointerEvents: 'auto' as any,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.22)',
        cursor: 'pointer',
        transition: 'transform 0.15s ease',
      },
      default: {
        elevation: 6,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 6,
      },
    }),
  },
  buttonPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.94 }],
  },
  emojiIcon: {
    fontSize: 20,
  },
  heroBottomContent: {
    position: 'absolute',
    left: 22,
    bottom: 24,
    zIndex: 15,
  },
  brandTitle: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
    ...Platform.select({
      web: {
        textShadow: '0 2px 8px rgba(0, 0, 0, 0.55)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.55)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
      },
    }),
  },
  brandSubtitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '400',
    lineHeight: 25,
    opacity: 0.96,
    ...Platform.select({
      web: {
        textShadow: '0 2px 6px rgba(0, 0, 0, 0.55)',
      },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.55)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 6,
      },
    }),
  },
  pesanButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 9,
    paddingHorizontal: 36,
    borderRadius: 24,
    alignSelf: 'flex-start',
    marginTop: 14,
    pointerEvents: 'auto' as any,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 14px rgba(0, 0, 0, 0.22)',
        cursor: 'pointer',
        transition: 'transform 0.15s ease',
      },
      default: {
        elevation: 5,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.22,
        shadowRadius: 5,
      },
    }),
  },
  pesanButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.96 }],
  },
  pesanButtonText: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingBottom: 48,
  },
  sectionContainer: {
    marginTop: 22,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    letterSpacing: 0.2,
  },
  blueprintCardLarge: {
    width: '100%',
    height: 190,
    borderRadius: 20,
  },
  blueprintRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  blueprintCardColumn: {
    flex: 1,
    height: 170,
    borderRadius: 20,
  },
});


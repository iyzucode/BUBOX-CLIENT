import React from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { useProfilePalette } from './profilePalette';

const profileHeroImage = require('@/assets/images/profile-hero.jpg');

export const ProfileHeroHeader: React.FC = () => {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const palette = useProfilePalette();

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/');
    }
  };

  const topOffset = insets.top > 0 ? insets.top + 12 : 16;

  return (
    <View style={styles.container}>
      {/* Background Image: Monochrome artistic mother & baby */}
      <Image
        source={profileHeroImage}
        style={styles.heroImage}
        resizeMode="cover"
      />

      {/* Dark vignette gradient overlay for contrast */}
      <View
        style={[
          styles.overlay,
          Platform.OS === 'web'
            ? ({
                backgroundImage:
                  'linear-gradient(180deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.85) 100%)',
              } as any)
            : { backgroundColor: 'rgba(0,0,0,0.35)' },
        ]}
      />

      {/* Top Bar with 'X' button on left and 'PROFIL' on right */}
      <View style={[styles.topBarContainer, { top: topOffset }]}>
        <View style={styles.topBar}>
          {/* Circular Close Button 'X' */}
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [
              styles.closeBtn,
              { backgroundColor: palette.closeBtnBg },
              pressed && styles.pressed,
            ]}
            accessibilityLabel="Kembali"
            accessibilityRole="button"
          >
            {Platform.OS === 'web' ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke={palette.closeBtnIcon}
                strokeWidth="2.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <ThemedText
                style={[styles.closeIconText, { color: palette.closeBtnIcon }]}
              >
                ✕
              </ThemedText>
            )}
          </Pressable>

          {/* Title 'PROFIL' */}
          <ThemedText style={styles.headerTitle}>PROFIL</ThemedText>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    height: 290,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: Platform.OS === 'web' ? 16 : 0,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  topBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: 20,
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      web: {
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
      } as any,
    }),
  },
  closeIconText: {
    fontSize: 16,
    fontWeight: '800',
    lineHeight: 18,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.95 }],
  },
});

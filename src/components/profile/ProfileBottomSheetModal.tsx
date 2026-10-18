import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useAuthStore } from '@/store/useAuthStore';
import { useLogout } from '@/features/auth/useLogout';
import { ProfileThemeSwitch } from './ProfileThemeSwitch';
import { useProfilePalette } from './profilePalette';

const defaultBabyAvatar = require('@/assets/images/profile-avatar-baby.jpg');
const SCREEN_HEIGHT = Dimensions.get('window').height || 700;

interface ProfileBottomSheetModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ProfileBottomSheetModal: React.FC<ProfileBottomSheetModalProps> = ({
  visible,
  onClose,
}) => {
  const router = useRouter();
  const palette = useProfilePalette();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isMobile = width <= 768;

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const logoutMutation = useLogout();

  const [isRendered, setIsRendered] = useState(visible);
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      isClosingRef.current = false;
      setIsRendered(true);
      translateY.setValue(SCREEN_HEIGHT);
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start();
    } else if (isRendered && !isClosingRef.current) {
      isClosingRef.current = true;
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 200,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: Platform.OS !== 'web',
      }).start(() => {
        isClosingRef.current = false;
        setIsRendered(false);
      });
    }
  }, [visible]);

  const handleClose = (callback?: () => void) => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.timing(translateY, {
      toValue: SCREEN_HEIGHT,
      duration: 200,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: Platform.OS !== 'web',
    }).start(() => {
      isClosingRef.current = false;
      setIsRendered(false);
      onClose();
      if (callback) {
        callback();
      }
    });
  };

  if (!isRendered && !visible) return null;

  const displayName = (
    isAuthenticated && user?.fullName ? user.fullName : 'NO NAME'
  ).toUpperCase();

  const displayHandle =
    isAuthenticated && user?.username
      ? `@${user.username}`
      : isAuthenticated && user?.email
      ? `@${user.email.split('@')[0]}`
      : '@noname';

  // Card background: Solid sleek slate gray matching reference image
  const sheetBg = palette.isDark ? '#2D3748' : '#6B7280';

  return (
    <Modal
      visible={Boolean(isRendered || visible)}
      transparent
      animationType="none"
      onRequestClose={() => handleClose()}
    >
      <View style={styles.overlay}>
        {/* Instant Backdrop: tap outside to dismiss */}
        <Pressable
          style={styles.backdropPressable}
          onPress={() => handleClose()}
          accessibilityRole="button"
          accessibilityLabel="Tutup overlay profil"
        />

        {/* Animated Bottom Sheet Card */}
        <Animated.View
          style={[
            styles.sheetCard,
            {
              backgroundColor: sheetBg,
              maxWidth: isMobile ? '100%' : 500,
              paddingBottom: isMobile && insets.bottom > 0 ? insets.bottom : 0,
              transform: [{ translateY }],
            },
          ]}
        >
          {isAuthenticated ? (
            /* ==============================================================
               STATE A: SUDAH LOGIN (Avatar + Nama + Handle + Switch + Actions)
               ============================================================== */
            <View style={styles.authenticatedContent}>
              {/* Overlapping Baby Avatar */}
              <View style={[styles.avatarCircle, { borderColor: sheetBg }]}>
                <Image
                  source={defaultBabyAvatar}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              </View>

              {/* User Name in bold uppercase */}
              <ThemedText style={styles.userName} numberOfLines={1}>
                {displayName}
              </ThemedText>

              {/* User Handle */}
              <ThemedText style={styles.userHandle} numberOfLines={1}>
                {displayHandle}
              </ThemedText>

              {/* Centered Theme Toggle Switch */}
              <View style={styles.switchWrapper}>
                <ProfileThemeSwitch />
              </View>

              {/* Horizontal Divider Line */}
              <View style={styles.horizontalDivider} />

              {/* Bottom 2-Column Action Bar: PROFILE | LOG OUT */}
              <View style={styles.actionBar}>
                {/* Left: PROFILE */}
                <Pressable
                  onPress={() => handleClose(() => router.push('/profile'))}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    pressed && styles.btnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Buka Profil Lengkap"
                >
                  <ThemedText style={styles.actionBtnText}>PROFILE</ThemedText>
                </Pressable>

                {/* Vertical Center Divider */}
                <View style={styles.verticalDivider} />

                {/* Right: LOG OUT */}
                <Pressable
                  onPress={() =>
                    handleClose(() => {
                      logoutMutation.mutate();
                    })
                  }
                  style={({ pressed }) => [
                    styles.actionBtn,
                    pressed && styles.btnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Keluar dari akun"
                >
                  <View style={styles.logoutBtnContent}>
                    <ThemedText style={styles.actionBtnText}>LOG OUT</ThemedText>
                    {Platform.OS === 'web' ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#FFFFFF"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="M9 21H5C4.45 21 4 20.55 4 20V4C4 3.45 4.45 3 5 3H9" />
                        <path d="M16 17L21 12L16 7" />
                        <path d="M21 12H9" />
                      </svg>
                    ) : (
                      <ThemedText style={styles.logoutIconFallback}>🚪</ThemedText>
                    )}
                  </View>
                </Pressable>
              </View>
            </View>
          ) : (
            /* ==============================================================
               STATE B: TAMU / BELUM LOGIN (Compact Bar: LOGIN | SIGN UP)
               ============================================================== */
            <View style={styles.guestContent}>
              <View style={styles.actionBarGuest}>
                {/* Left: LOGIN */}
                <Pressable
                  onPress={() => handleClose(() => router.push('/login'))}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    pressed && styles.btnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Masuk ke Akun"
                >
                  <ThemedText style={styles.actionBtnTextGuest}>LOGIN</ThemedText>
                </Pressable>

                {/* Vertical Center Divider */}
                <View style={styles.verticalDivider} />

                {/* Right: SIGN UP */}
                <Pressable
                  onPress={() => handleClose(() => router.push('/register'))}
                  style={({ pressed }) => [
                    styles.actionBtn,
                    pressed && styles.btnPressed,
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Daftar Akun Baru"
                >
                  <ThemedText style={styles.actionBtnTextGuest}>
                    SIGN UP
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  sheetCard: {
    width: '100%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    overflow: 'visible',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 12,
      },
      web: {
        boxShadow: '0 -4px 25px rgba(0, 0, 0, 0.35)',
      } as any,
    }),
  },
  authenticatedContent: {
    width: '100%',
    alignItems: 'center',
    paddingTop: 16,
    overflow: 'visible',
  },
  avatarCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    overflow: 'hidden',
    marginTop: -45, // Half of avatar sits cleanly above card without being clipped
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 10,
    textAlign: 'center',
  },
  userHandle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },
  switchWrapper: {
    marginTop: 12,
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  actionBar: {
    width: '100%',
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  guestContent: {
    width: '100%',
  },
  actionBarGuest: {
    width: '100%',
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  actionBtnTextGuest: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  logoutBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  logoutIconFallback: {
    fontSize: 14,
  },
  verticalDivider: {
    width: 1,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  btnPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
});

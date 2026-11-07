import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useAuthStore } from '@/store/useAuthStore';
import { useProfilePalette } from './profilePalette';

const AVATAR_SIZE = 96;
const AVATAR_BORDER = 4;

/** Kartu nama di halaman Profil. Foto hanya ditampilkan; ubah foto lewat Detail Profil. */
export const ProfileIdentityCard: React.FC = () => {
  const palette = useProfilePalette();

  const user = useAuthStore((s) => s.user);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  // If authenticated use user data, otherwise fallback to 'No Name' and '@noname'
  const displayName = isAuthenticated && user?.fullName ? user.fullName : 'No Name';
  const displayHandle =
    isAuthenticated && user?.username
      ? `@${user.username}`
      : isAuthenticated && user?.email
      ? `@${user.email.split('@')[0]}`
      : '@noname';

  return (
    <View style={styles.wrapper}>
      {/* 1. Overlapping Circular Avatar (foto profil atau huruf awal nama) */}
      <View
        style={[
          styles.avatarContainer,
          {
            backgroundColor: palette.avatarBorder,
            borderColor: palette.avatarBorder,
          },
        ]}
      >
        <UserAvatar
          user={isAuthenticated ? user : null}
          size={AVATAR_SIZE - AVATAR_BORDER * 2}
        />
      </View>

      {/* 2. Identity Card Body */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: palette.cardBg,
            borderColor: palette.cardBorder,
            borderRadius: 36,
          },
        ]}
      >
        <ThemedText
          style={[styles.fullName, { color: palette.cardTitle }]}
          numberOfLines={1}
        >
          {displayName}
        </ThemedText>

        <ThemedText
          style={[styles.handle, { color: palette.cardSubtext }]}
          numberOfLines={1}
        >
          {displayHandle}
        </ThemedText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
    marginTop: -130, // Half of card height sits on top of the banner!
    zIndex: 5,
  },
  avatarContainer: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: AVATAR_BORDER,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    marginBottom: -44, // Half of avatar above card
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  card: {
    width: '100%',
    borderRadius: 36,
    borderWidth: 0,
    paddingTop: 56, // Space for the overlapping avatar
    paddingBottom: 22,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  fullName: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  handle: {
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.2,
    textAlign: 'center',
  },
});

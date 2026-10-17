import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useLogout } from '@/features/auth/useLogout';
import { useProfilePalette } from './profilePalette';
import { MenuIconLogout } from './ProfileIcons';

export const ProfileLogoutButton: React.FC = () => {
  const palette = useProfilePalette();
  const logoutMutation = useLogout();

  return (
    <Pressable
      onPress={() => logoutMutation.mutate()}
      disabled={logoutMutation.isPending}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: palette.logoutBg,
          borderColor: palette.logoutBorder,
        },
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel="Keluar dari akun"
    >
      <View style={styles.iconWrapper}>
        <MenuIconLogout size={18} color={palette.logoutText} />
      </View>
      <ThemedText style={[styles.text, { color: palette.logoutText }]}>
        {logoutMutation.isPending ? 'Logging out...' : 'Log out'}
      </ThemedText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 10,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  iconWrapper: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.99 }],
  },
});

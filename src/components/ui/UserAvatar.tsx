import React, { useState } from 'react';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Brand } from '@/constants/theme';
import { User } from '@/types/auth';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5073/api';
// avatarUrl dari server berupa path "/api/…"; gabungkan dengan origin API.
const API_ORIGIN = API_URL.replace(/\/api\/?$/, '');

/** Warna latar huruf awal, dipilih tetap per pengguna supaya tidak berganti-ganti. */
const INITIAL_COLORS = [Brand.orange, Brand.red, Brand.navy, '#E0712B', '#2F5D9B'] as const;

type AvatarUser = Pick<User, 'fullName' | 'username' | 'email'> & {
  id?: string;
  avatarUrl?: string | null;
};

export function resolveAvatarUri(avatarUrl?: string | null): string | null {
  if (!avatarUrl) return null;
  return /^https?:\/\//.test(avatarUrl) ? avatarUrl : `${API_ORIGIN}${avatarUrl}`;
}

/** Huruf pertama nama lengkap → username → email; "?" bila tidak ada. */
export function getUserInitial(user?: Partial<AvatarUser> | null): string {
  const source = [user?.fullName, user?.username, user?.email].find((v) => v && v.trim());
  const firstChar = source?.trim().match(/[\p{L}\p{N}]/u)?.[0];
  return firstChar ? firstChar.toLocaleUpperCase('id-ID') : '?';
}

function pickColor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return INITIAL_COLORS[Math.abs(hash) % INITIAL_COLORS.length];
}

export interface UserAvatarProps {
  user?: AvatarUser | null;
  size: number;
  /** Warna latar huruf awal; default dipilih otomatis dari palet brand. */
  fallbackBackground?: string;
  fallbackTextColor?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Foto profil pengguna. Bila belum ada foto (atau gagal dimuat),
 * tampil lingkaran berwarna dengan huruf pertama nama.
 */
export const UserAvatar: React.FC<UserAvatarProps> = ({
  user,
  size,
  fallbackBackground,
  fallbackTextColor = '#FFFFFF',
  style,
}) => {
  const uri = resolveAvatarUri(user?.avatarUrl);
  // Simpan URI yang gagal; URI baru (foto diganti) otomatis dicoba lagi.
  const [failedUri, setFailedUri] = useState<string | null>(null);
  const showImage = !!uri && failedUri !== uri;

  const initial = getUserInitial(user);
  const background =
    fallbackBackground ?? pickColor(user?.id || user?.username || user?.email || initial);

  return (
    <View
      style={[
        styles.base,
        { width: size, height: size, borderRadius: size / 2 },
        !showImage && { backgroundColor: background },
        style,
      ]}
      accessibilityRole="image"
      accessibilityLabel={user?.fullName ? `Foto profil ${user.fullName}` : 'Foto profil'}
    >
      {showImage ? (
        <Image
          source={{ uri }}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          onError={() => setFailedUri(uri)}
        />
      ) : (
        <ThemedText
          style={{
            color: fallbackTextColor,
            fontSize: Math.round(size * 0.42),
            lineHeight: Math.round(size * 0.5),
            fontWeight: '700',
          }}
        >
          {initial}
        </ThemedText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});

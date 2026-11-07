import React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Redirect, useRouter } from 'expo-router';

import { AvatarOptionsSheet } from '@/components/profile/AvatarOptionsSheet';
import { CameraIcon } from '@/components/profile/CameraIcon';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { ScreenHeaderBar } from '@/components/ui/ScreenHeaderBar';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { Brand } from '@/constants/theme';
import { useThemeContext } from '@/context/ThemeContext';
import { useAvatarActions } from '@/features/auth/useAvatar';
import { useProfile } from '@/features/auth/useProfile';
import { useCustomerLayout } from '@/hooks/use-customer-layout';
import { useAuthStore } from '@/store/useAuthStore';
import { EditableProfileField } from '@/types/profile';

const AVATAR_SIZE = 120;

interface RowProps {
  label: string;
  value?: string | null;
  placeholder?: string;
  onPress?: () => void;
  isLast?: boolean;
}

/** Satu baris "Label  Nilai  ›"; tanpa onPress = hanya tampil (mis. Email). */
const Row: React.FC<RowProps> = ({ label, value, placeholder = 'Belum diisi', onPress, isLast }) => {
  const { theme, isDark } = useThemeContext();
  const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : '#F2DCD5';

  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityLabel={onPress ? `Ubah ${label}` : undefined}
      style={({ pressed }) => [
        styles.row,
        !isLast && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: dividerColor },
        onPress && styles.clickable,
        pressed && onPress && { backgroundColor: theme.backgroundSelected },
      ]}
    >
      <ThemedText style={[styles.rowLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
      <ThemedText
        style={[styles.rowValue, { color: value ? theme.text : theme.textSecondary }]}
        numberOfLines={1}
      >
        {value || placeholder}
      </ThemedText>
      <View style={styles.chevronSlot}>
        {onPress ? (
          Platform.OS === 'web' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.textSecondary}
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="9 6 15 12 9 18" />
            </svg>
          ) : (
            <ThemedText style={{ color: theme.textSecondary, fontSize: 20 }}>›</ThemedText>
          )
        ) : null}
      </View>
    </Pressable>
  );
};

export default function ProfileDetailScreen() {
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  const { width } = useCustomerLayout();
  const isDesktop = width > 768;

  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const { data: profile, isLoading, isError, refetch } = useProfile();

  const hasPhoto = !!(profile?.avatarUrl ?? user?.avatarUrl);
  const avatar = useAvatarActions({
    hasPhoto,
    changeAvailableAt: profile?.avatarChangeAvailableAt,
  });

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile');
    }
  };

  const openEdit = (field: EditableProfileField) =>
    router.push({ pathname: '/profile-edit', params: { field } });

  const groupStyle = [
    styles.group,
    { backgroundColor: isDark ? '#18181B' : '#FFFFFF', borderColor: theme.border },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScreenHeaderBar title="Detail Profil" onBack={handleBack} maxWidth={isDesktop ? 600 : '100%'} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { maxWidth: isDesktop ? 600 : '100%' }]}
        showsVerticalScrollIndicator={false}
      >
        {isLoading && !profile ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : isError && !profile ? (
          <View style={styles.centerBox}>
            <ThemedText style={{ color: theme.textSecondary, textAlign: 'center' }}>
              Gagal memuat profil.
            </ThemedText>
            <Pressable
              onPress={() => refetch()}
              style={[styles.retryButton, { backgroundColor: theme.primary }]}
              accessibilityRole="button"
            >
              <ThemedText style={styles.retryText}>Coba Lagi</ThemedText>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Foto profil: ketuk untuk ganti/hapus */}
            <View style={styles.photoSection}>
              <Pressable
                onPress={avatar.openActions}
                disabled={avatar.isBusy}
                accessibilityRole="button"
                accessibilityLabel={hasPhoto ? 'Ubah foto profil' : 'Tambah foto profil'}
                style={styles.clickable}
              >
                <View style={styles.photoButton}>
                  <UserAvatar user={profile ?? user} size={AVATAR_SIZE} />
                  {/* Ada foto: lapisan gelap + kamera (sesuai desain). Tanpa foto: huruf awal tetap terlihat. */}
                  {hasPhoto || avatar.isBusy ? (
                    <View style={styles.photoOverlay}>
                      {avatar.isBusy ? (
                        <ActivityIndicator color="#FFFFFF" />
                      ) : (
                        <CameraIcon size={30} color="#FFFFFF" />
                      )}
                    </View>
                  ) : null}
                </View>
                {!hasPhoto && !avatar.isBusy ? (
                  <View style={[styles.cameraBadge, { borderColor: theme.background }]}>
                    <CameraIcon size={16} color="#FFFFFF" />
                  </View>
                ) : null}
              </Pressable>
              <Pressable onPress={avatar.openActions} disabled={avatar.isBusy} style={styles.clickable}>
                <ThemedText style={[styles.photoLabel, { color: theme.text }]}>
                  {hasPhoto ? 'Ubah foto' : 'Tambah foto'}
                </ThemedText>
              </Pressable>
              {avatar.errorMessage ? (
                <ThemedText style={styles.errorText}>{avatar.errorMessage}</ThemedText>
              ) : null}
            </View>

            <View style={groupStyle}>
              <Row label="Nama" value={profile?.fullName} onPress={() => openEdit('name')} />
              <Row
                label="Nama Pengguna"
                value={profile?.username ? `@${profile.username}` : null}
                onPress={() => openEdit('username')}
                isLast
              />
            </View>

            <View style={groupStyle}>
              <Row label="Email" value={profile?.email} />
              <Row label="No Handphone" value={profile?.phoneNumber} onPress={() => openEdit('phone')} />
              <Row
                label="No WhatsApp"
                value={profile?.whatsappNumber}
                onPress={() => openEdit('whatsapp')}
                isLast
              />
            </View>
          </>
        )}
      </ScrollView>

      <AvatarOptionsSheet
        visible={avatar.isMenuOpen}
        onChoose={avatar.choosePhoto}
        onRemove={avatar.removePhoto}
        onClose={avatar.closeMenu}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 28,
    paddingBottom: 48,
    gap: 16,
  },
  centerBox: {
    paddingVertical: 80,
    alignItems: 'center',
    gap: 14,
  },
  retryButton: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  photoSection: {
    alignItems: 'center',
    marginBottom: 8,
  },
  photoButton: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    overflow: 'hidden',
  },
  photoOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraBadge: {
    position: 'absolute',
    right: 2,
    bottom: 2,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
    backgroundColor: Brand.orange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoLabel: {
    marginTop: 12,
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 17,
    color: Brand.red,
    textAlign: 'center',
  },
  group: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingLeft: 18,
    paddingRight: 10,
  },
  rowLabel: {
    width: 128,
    fontSize: 14,
    fontWeight: '500',
  },
  rowValue: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
  },
  chevronSlot: {
    width: 24,
    alignItems: 'center',
  },
  clickable: Platform.select({ web: { cursor: 'pointer' } as object, default: {} }) as object,
});

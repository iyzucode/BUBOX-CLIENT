import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset } from '@/constants/theme';
import { useAuthStore } from '@/store/useAuthStore';
import { useProfilePalette } from '@/components/profile/profilePalette';
import { ProfileHeroHeader } from '@/components/profile/ProfileHeroHeader';
import { ProfileIdentityCard } from '@/components/profile/ProfileIdentityCard';
import { ProfileOrderStatusBar } from '@/components/profile/ProfileOrderStatusBar';
import {
  ProfileMenuGroup,
  ProfileMenuItemProps,
} from '@/components/profile/ProfileMenuGroup';
import { ProfileThemeSwitch } from '@/components/profile/ProfileThemeSwitch';
import { ProfileLogoutButton } from '@/components/profile/ProfileLogoutButton';
import {
  MenuIconDetailProfile,
  MenuIconPassword,
  MenuIconAddress,
  MenuIconTheme,
  MenuIconHelp,
  MenuIconReport,
  MenuIconAbout,
  MenuIconLanguage,
} from '@/components/profile/ProfileIcons';

export default function ProfileScreen() {
  const palette = useProfilePalette();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Simple state for info / about dialogs
  const [activeDialog, setActiveDialog] = useState<{
    title: string;
    message: string;
  } | null>(null);

  // Menu Group 1: Akun & Tema
  const accountMenuItems: ProfileMenuItemProps[] = [
    {
      id: 'detail-profile',
      label: 'Detail Profile',
      icon: (color) => <MenuIconDetailProfile size={20} color={color} />,
      onPress: () => {
        if (isAuthenticated && user) {
          setActiveDialog({
            title: 'Detail Profil',
            message: `Nama: ${user.fullName || '-'}\nUsername: @${user.username || '-'}\nEmail: ${user.email || '-'}\nStatus: ${user.isEmailVerified ? 'Email Terverifikasi' : 'Belum Diverifikasi'}`,
          });
        } else {
          router.push('/login');
        }
      },
    },
    {
      id: 'kata-sandi',
      label: 'Kata Sandi',
      icon: (color) => <MenuIconPassword size={20} color={color} />,
      onPress: () => router.push('/forgot-password'),
    },
    {
      id: 'alamat',
      label: 'Alamat',
      icon: (color) => <MenuIconAddress size={20} color={color} />,
      onPress: () => router.push('/addresses'),
    },
    {
      id: 'tema',
      label: 'Tema',
      icon: (color) => <MenuIconTheme size={20} color={color} />,
      rightElement: <ProfileThemeSwitch />,
    },
  ];

  // Menu Group 2: Bantuan & Informasi
  const supportMenuItems: ProfileMenuItemProps[] = [
    {
      id: 'bantuan',
      label: 'Bantuan',
      icon: (color) => <MenuIconHelp size={20} color={color} />,
      onPress: () => {
        setActiveDialog({
          title: 'Pusat Bantuan Luanna',
          message:
            'Ada pertanyaan seputar paket katering atau jadwal pengantaran? Hubungi layanan pelanggan kami via WhatsApp di 0812-3456-7890.',
        });
      },
    },
    {
      id: 'laporkan-masalah',
      label: 'Laporkan Masalah',
      icon: (color) => <MenuIconReport size={20} color={color} />,
      onPress: () => {
        setActiveDialog({
          title: 'Laporkan Masalah',
          message:
            'Jika Anda menemukan kendala teknis atau pengiriman, silakan kirim email ke support@bubox.id atau hubungi Customer Care.',
        });
      },
    },
    {
      id: 'tentang-luanna',
      label: 'Tentang Luanna',
      icon: (color) => <MenuIconAbout size={20} color={color} />,
      onPress: () => {
        setActiveDialog({
          title: 'Tentang Luanna',
          message:
            'Luanna adalah layanan katering MPASI premium harian yang menyediakan nutrisi seimbang dari bahan organik pilihan tanpa bahan pengawet & non-MSG untuk tumbuh kembang optimal si kecil.',
        });
      },
    },
    {
      id: 'bahasa',
      label: 'Bahasa',
      icon: (color) => <MenuIconLanguage size={20} color={color} />,
      onPress: () => {
        setActiveDialog({
          title: 'Pilihan Bahasa',
          message: 'Saat ini aplikasi menggunakan Bahasa Indonesia (ID) secara default.',
        });
      },
    },
  ];

  return (
    <ThemedView style={[styles.container, { backgroundColor: palette.screenBg }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* 1. Artistic Top Cover Hero with Close (X) & PROFIL title */}
        <ProfileHeroHeader />

        {/* 2. Overlapping Baby Avatar + Name + @handle: NO margin width, half height on banner */}
        <View style={styles.identityWrapper}>
          <ProfileIdentityCard />
        </View>

        {/* 3. Main Content Cards (Pesanan Saya, Menu Groups, Logout): WITH margin width */}
        <View style={styles.bodyWrapper}>
          {/* Section: Pesanan Saya (4 Status Action Buttons) */}
          <ProfileOrderStatusBar />

          {/* Section: Group Menu 1 (Detail Profile, Kata Sandi, Alamat, Tema) */}
          <ProfileMenuGroup items={accountMenuItems} />

          {/* Section: Group Menu 2 (Bantuan, Laporkan Masalah, Tentang Luanna, Bahasa) */}
          <ProfileMenuGroup items={supportMenuItems} />

          {/* Section: Standalone Log out Button or Guest Login */}
          {isAuthenticated ? (
            <ProfileLogoutButton />
          ) : (
            <View style={styles.guestRow}>
              <Pressable
                onPress={() => router.push('/login')}
                style={({ pressed }) => [
                  styles.guestBtn,
                  styles.guestLoginBtn,
                  pressed && styles.pressed,
                ]}
              >
                <ThemedText style={styles.guestLoginText}>Masuk ke Akun</ThemedText>
              </Pressable>
              <Pressable
                onPress={() => router.push('/register')}
                style={({ pressed }) => [
                  styles.guestBtn,
                  styles.guestRegisterBtn,
                  { borderColor: palette.cardBorder, backgroundColor: palette.cardBg },
                  pressed && styles.pressed,
                ]}
              >
                <ThemedText style={[styles.guestRegisterText, { color: palette.cardTitle }]}>
                  Daftar
                </ThemedText>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Info / About Popup Dialog */}
      {activeDialog && (
        <Modal
          visible={Boolean(activeDialog)}
          transparent
          animationType="fade"
          onRequestClose={() => setActiveDialog(null)}
        >
          <View style={styles.dialogOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setActiveDialog(null)}
            />
            <View
              style={[
                styles.dialogCard,
                { backgroundColor: palette.cardBg, borderColor: palette.cardBorder },
              ]}
            >
              <ThemedText
                style={[styles.dialogTitle, { color: palette.cardTitle }]}
              >
                {activeDialog.title}
              </ThemedText>
              <ThemedText
                style={[styles.dialogMessage, { color: palette.cardSubtext }]}
              >
                {activeDialog.message}
              </ThemedText>
              <Pressable
                onPress={() => setActiveDialog(null)}
                style={styles.dialogOkBtn}
              >
                <ThemedText style={styles.dialogOkBtnText}>Tutup</ThemedText>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: BottomTabInset + 40,
    alignItems: 'center',
  },
  identityWrapper: {
    width: '100%',
    paddingHorizontal: 0, // NO margin width! Full width edge-to-edge
    alignItems: 'center',
    zIndex: 5,
  },
  bodyWrapper: {
    width: '100%',
    maxWidth: 500,
    paddingHorizontal: 16, // Inset with margin width for lower cards!
    gap: 14,
    marginTop: 18,
  },
  guestRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  guestBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  guestLoginBtn: {
    backgroundColor: '#F36F21',
  },
  guestLoginText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  guestRegisterBtn: {
    borderWidth: 1,
  },
  guestRegisterText: {
    fontSize: 14,
    fontWeight: '700',
  },
  dialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    gap: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      web: {
        boxShadow: '0 8px 30px rgba(0, 0, 0, 0.25)',
      } as any,
    }),
  },
  dialogTitle: {
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  dialogMessage: {
    fontSize: 13,
    lineHeight: 20,
  },
  dialogOkBtn: {
    marginTop: 6,
    alignSelf: 'flex-end',
    backgroundColor: '#F36F21',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  dialogOkBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
});

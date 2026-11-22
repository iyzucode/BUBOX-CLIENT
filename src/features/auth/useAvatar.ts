import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { Platform } from 'react-native';

import type { AvatarCropRect, AvatarCropSource } from '@/components/profile/AvatarCropModal';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { User } from '@/types/auth';

/** Foto diperkecil di perangkat sebelum diunggah: hemat kuota & penyimpanan. */
const AVATAR_SIZE = 512;
const AVATAR_QUALITY = 0.82;

/**
 * Buka galeri dan baca ukuran asli foto (dalam koordinat yang sama dengan crop).
 * Null bila pengguna membatalkan. Posisi & zoom lalu diatur pengguna di AvatarCropModal.
 */
export async function pickAvatarSource(): Promise<AvatarCropSource | null> {
  if (Platform.OS !== 'web') {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      throw new Error('Izin akses galeri dibutuhkan untuk memilih foto profil.');
    }
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    // Editor bawaan Android/iOS tidak dipakai: semua platform memakai AvatarCropModal (lingkaran).
    allowsEditing: false,
    quality: 1,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const { uri } = result.assets[0];
  // Ukuran dibaca lewat manipulator (ukuran dari picker bisa 0) agar sama persis dengan dasar crop.
  const loaded = await ImageManipulator.ImageManipulator.manipulate(uri).renderAsync();
  if (!loaded.width || !loaded.height) {
    throw new Error('Foto tidak bisa dibaca. Coba pilih foto lain.');
  }
  return { uri, width: loaded.width, height: loaded.height };
}

/** Potong area pilihan pengguna, perkecil ke 512px, simpan sebagai JPEG. */
export async function renderAvatar(uri: string, rect: AvatarCropRect): Promise<string> {
  const context = ImageManipulator.ImageManipulator.manipulate(uri).crop(rect);
  if (rect.width > AVATAR_SIZE) {
    context.resize({ width: AVATAR_SIZE, height: AVATAR_SIZE });
  }

  const image = await context.renderAsync();
  const saved = await image.saveAsync({
    compress: AVATAR_QUALITY,
    format: ImageManipulator.SaveFormat.JPEG,
  });
  return saved.uri;
}

async function buildAvatarForm(uri: string): Promise<FormData> {
  const form = new FormData();
  if (Platform.OS === 'web') {
    const blob = await (await fetch(uri)).blob();
    form.append('file', blob, 'avatar.jpg');
  } else {
    // React Native membaca file langsung dari uri.
    form.append('file', { uri, name: 'avatar.jpg', type: 'image/jpeg' } as unknown as Blob);
  }
  return form;
}

function useSyncUser() {
  const setUser = useAuthStore((s) => s.setUser);
  const queryClient = useQueryClient();
  return (user: User) => {
    setUser(user);
    queryClient.setQueryData(['auth', 'me'], user);
    // Detail Profil butuh tanggal "bisa diubah lagi" yang baru.
    queryClient.invalidateQueries({ queryKey: ['profile'] });
  };
}

export const useUpdateAvatar = () => {
  const syncUser = useSyncUser();
  return useMutation({
    mutationFn: async (uri: string) => {
      const form = await buildAvatarForm(uri);
      // WAJIB: instance `api` default-nya application/json, dan dengan header itu axios
      // mengubah FormData menjadi JSON (server membalas 415). Header multipart mencegahnya;
      // axios lalu menghapus header ini agar browser/RN mengisi boundary sendiri.
      const response = await api.put<User>('/Biodata/Avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: syncUser,
  });
};

export const useRemoveAvatar = () => {
  const syncUser = useSyncUser();
  return useMutation({
    mutationFn: async () => (await api.delete<User>('/Biodata/Avatar')).data,
    onSuccess: syncUser,
  });
};

export function avatarErrorMessage(error: unknown): string {
  const err = error as { response?: { data?: { message?: string } }; message?: string };
  return err?.response?.data?.message || err?.message || 'Gagal memperbarui foto profil. Coba lagi.';
}

/**
 * Alur ubah foto profil yang dipakai kartu profil & Detail Profil:
 * belum ada foto → langsung buka galeri; sudah ada → buka menu Ganti/Hapus.
 * `changeAvailableAt` (dari /Biodata/Profile) menandai foto masih dalam batas 7 hari.
 */
export function useAvatarActions(options: { hasPhoto: boolean; changeAvailableAt?: string | null }) {
  const updateAvatar = useUpdateAvatar();
  const removeAvatar = useRemoveAvatar();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isPicking, setIsPicking] = useState(false);
  const [cropSource, setCropSource] = useState<AvatarCropSource | null>(null);
  const [isSavingCrop, setIsSavingCrop] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const isBusy = isPicking || isSavingCrop || updateAvatar.isPending || removeAvatar.isPending;
  const isChangeLocked = !!options.changeAvailableAt;
  const lockedMessage = options.changeAvailableAt
    ? `Foto profil bisa diganti lagi pada ${new Date(options.changeAvailableAt).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })}.`
    : '';

  const choosePhoto = async () => {
    setIsMenuOpen(false);
    setErrorMessage('');
    if (isChangeLocked) {
      setErrorMessage(lockedMessage);
      return;
    }
    setIsPicking(true);
    try {
      // Foto belum diunggah: pengguna mengatur posisi & zoom dulu di modal crop.
      const source = await pickAvatarSource();
      if (source) setCropSource(source);
    } catch (error) {
      setErrorMessage(avatarErrorMessage(error));
    } finally {
      setIsPicking(false);
    }
  };

  /** Simpan dari modal crop: potong → unggah. Batal tidak mengunggah apa pun (batas 7 hari aman). */
  const confirmCrop = async (rect: AvatarCropRect) => {
    if (!cropSource) return;
    setIsSavingCrop(true);
    try {
      const uri = await renderAvatar(cropSource.uri, rect);
      await updateAvatar.mutateAsync(uri);
      setCropSource(null);
    } catch (error) {
      setCropSource(null);
      setErrorMessage(avatarErrorMessage(error));
    } finally {
      setIsSavingCrop(false);
    }
  };

  const removePhoto = async () => {
    setIsMenuOpen(false);
    setErrorMessage('');
    try {
      await removeAvatar.mutateAsync();
    } catch (error) {
      setErrorMessage(avatarErrorMessage(error));
    }
  };

  const openActions = () => {
    if (isBusy) return;
    if (options.hasPhoto) {
      setIsMenuOpen(true);
    } else {
      choosePhoto();
    }
  };

  return {
    isBusy,
    isMenuOpen,
    closeMenu: () => setIsMenuOpen(false),
    isChangeLocked,
    lockedMessage,
    errorMessage,
    openActions,
    choosePhoto,
    removePhoto,
    /** Props untuk <AvatarCropModal />. */
    crop: {
      source: cropSource,
      isSaving: isSavingCrop,
      onCancel: () => setCropSource(null),
      onConfirm: confirmCrop,
    },
  };
}

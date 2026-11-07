import { useState } from 'react';
import { Platform } from 'react-native';
import { useMutation } from '@tanstack/react-query';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { AxiosError } from 'axios';

import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { ApiErrorResponse, AuthResponse } from '@/types/auth';

// Menutup popup Google di web setelah kembali ke halaman redirect.
WebBrowser.maybeCompleteAuthSession();

const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '';

/** Halaman tujuan popup Google; harus terdaftar di "Authorized redirect URIs" Google Cloud Console. */
export const GOOGLE_REDIRECT_PATH = 'oauth-redirect';

interface UseGoogleSignInOptions {
  onSuccess: () => void;
  onError: (message: string) => void;
}

/**
 * Masuk/daftar dengan Google (alur ID token):
 * popup Google → ID token → POST /auth/google → token BUBOX.
 * Saat ini hanya web; Android/iOS menyusul (perlu Client ID per platform & development build).
 */
export function useGoogleSignIn({ onSuccess, onError }: UseGoogleSignInOptions) {
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isPrompting, setIsPrompting] = useState(false);

  // clientId dipakai sebagai cadangan agar hook tidak error di platform yang belum dikonfigurasi.
  const [request, , promptAsync] = Google.useIdTokenAuthRequest(
    { webClientId: WEB_CLIENT_ID, clientId: WEB_CLIENT_ID || 'not-configured', selectAccount: true },
    { path: GOOGLE_REDIRECT_PATH }
  );

  const exchange = useMutation<AuthResponse, AxiosError<ApiErrorResponse>, string>({
    mutationFn: async (idToken) => {
      const response = await api.post<AuthResponse>('/auth/google', { idToken });
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user);
      onSuccess();
    },
    onError: (err) => {
      onError(err.response?.data?.message || 'Login Google gagal. Silakan coba lagi.');
    },
  });

  const signIn = async () => {
    if (Platform.OS !== 'web') {
      onError('Login Google di aplikasi ponsel segera hadir. Untuk sementara gunakan email.');
      return;
    }
    if (!WEB_CLIENT_ID || !request) {
      onError('Login Google belum siap. Coba muat ulang halaman.');
      return;
    }

    setIsPrompting(true);
    try {
      const result = await promptAsync();
      if (result.type === 'success') {
        const idToken = result.params.id_token ?? result.authentication?.idToken;
        if (idToken) {
          exchange.mutate(idToken);
        } else {
          onError('Google tidak mengirim data login. Silakan coba lagi.');
        }
      } else if (result.type === 'error') {
        onError(result.error?.message || 'Login Google dibatalkan karena terjadi kesalahan.');
      }
      // "cancel"/"dismiss": pengguna menutup popup, tidak perlu pesan.
    } catch (err) {
      // promptAsync melempar error (bukan result.type "error") bila popup diblokir browser
      // atau gagal dibuka. Tampilkan sebagai pesan, jangan biarkan jadi error yang tak tertangani.
      const message = err instanceof Error ? err.message : '';
      onError(
        /popup/i.test(message)
          ? 'Popup login Google diblokir browser. Izinkan popup untuk situs ini, lalu coba lagi.'
          : 'Login Google gagal dibuka. Silakan coba lagi.'
      );
    } finally {
      setIsPrompting(false);
    }
  };

  return {
    signIn,
    isPending: isPrompting || exchange.isPending,
  };
}

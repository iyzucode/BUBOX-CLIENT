import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';

import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';

export const useLogout = () => {
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      try {
        await api.post('/auth/logout');
      } catch {
        // Even if server call fails, clear client storage
      }
    },
    onSettled: () => {
      logout();
      queryClient.clear();
      // Selesai logout → kembali ke Beranda (replace: tombol back tidak membuka halaman akun lagi).
      router.replace('/');
    },
  });
};

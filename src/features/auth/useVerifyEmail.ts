import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { VerifyEmailRequest, VerifyEmailResponse } from '@/types/auth';

/** Verifikasi email; bila berhasil server mengembalikan token dan pengguna langsung masuk. */
export const useVerifyEmail = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation<VerifyEmailResponse, AxiosError, VerifyEmailRequest>({
    mutationFn: async (data: VerifyEmailRequest) => {
      const response = await api.post<VerifyEmailResponse>('/auth/verify-email', data);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user);
    },
  });
};

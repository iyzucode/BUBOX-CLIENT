import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { AuthResponse, LoginRequest } from '@/types/auth';
import { useAuthStore } from '@/store/useAuthStore';
import { AxiosError } from 'axios';

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation<AuthResponse, AxiosError, LoginRequest>({
    mutationFn: async (data: LoginRequest) => {
      const response = await api.post<AuthResponse>('/auth/login', data);
      return response.data;
    },
    onSuccess: (data) => {
      setAuth(data.token, data.user);
    },
  });
};

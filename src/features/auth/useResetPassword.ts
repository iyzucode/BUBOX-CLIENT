import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { MessageResponse, ResetPasswordRequest } from '@/types/auth';
import { AxiosError } from 'axios';

export const useResetPassword = () => {
  return useMutation<MessageResponse, AxiosError, ResetPasswordRequest>({
    mutationFn: async (data: ResetPasswordRequest) => {
      const response = await api.post<MessageResponse>('/auth/reset-password', data);
      return response.data;
    },
  });
};

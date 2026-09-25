import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { ForgotPasswordRequest, MessageResponse } from '@/types/auth';
import { AxiosError } from 'axios';

export const useForgotPassword = () => {
  return useMutation<MessageResponse, AxiosError, ForgotPasswordRequest>({
    mutationFn: async (data: ForgotPasswordRequest) => {
      const response = await api.post<MessageResponse>('/auth/forgot-password', data);
      return response.data;
    },
  });
};

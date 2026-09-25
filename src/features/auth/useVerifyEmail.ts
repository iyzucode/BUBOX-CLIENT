import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { MessageResponse, VerifyEmailRequest } from '@/types/auth';
import { AxiosError } from 'axios';

export const useVerifyEmail = () => {
  return useMutation<MessageResponse, AxiosError, VerifyEmailRequest>({
    mutationFn: async (data: VerifyEmailRequest) => {
      const response = await api.post<MessageResponse>('/auth/verify-email', data);
      return response.data;
    },
  });
};

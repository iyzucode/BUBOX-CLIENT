import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { MessageResponse, RegisterRequest } from '@/types/auth';
import { AxiosError } from 'axios';

export const useRegister = () => {
  return useMutation<MessageResponse, AxiosError, RegisterRequest>({
    mutationFn: async (data: RegisterRequest) => {
      const response = await api.post<MessageResponse>('/auth/register', data);
      return response.data;
    },
  });
};

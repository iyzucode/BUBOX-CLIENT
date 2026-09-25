import { useMutation } from '@tanstack/react-query';
import { api } from '@/services/api';
import { MessageResponse, ResendOtpRequest } from '@/types/auth';
import { AxiosError } from 'axios';

export const useResendOtp = () => {
  return useMutation<MessageResponse, AxiosError, ResendOtpRequest>({
    mutationFn: async (data: ResendOtpRequest) => {
      const response = await api.post<MessageResponse>('/auth/resend-otp', data);
      return response.data;
    },
  });
};

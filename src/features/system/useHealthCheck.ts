import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { HealthCheckResponse } from '@/types/api';

export const useHealthCheck = () => {
  return useQuery<HealthCheckResponse, Error>({
    queryKey: ['system', 'health'],
    queryFn: async () => {
      const response = await api.get<HealthCheckResponse>('/health');
      return response.data;
    },
    retry: 1,
  });
};

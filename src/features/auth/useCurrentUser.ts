import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import { User } from '@/types/auth';
import { useAuthStore } from '@/store/useAuthStore';

export const useCurrentUser = () => {
  const token = useAuthStore((state) => state.token);
  const setUser = useAuthStore((state) => state.setUser);

  return useQuery<User, Error>({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const response = await api.get<User>('/auth/me');
      setUser(response.data);
      return response.data;
    },
    enabled: !!token,
    retry: false,
  });
};

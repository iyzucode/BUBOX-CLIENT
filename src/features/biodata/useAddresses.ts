import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/services/api';
import { useAuthStore } from '@/store/useAuthStore';
import { Address, CreateAddressRequest, UpdateAddressRequest } from '@/types/address';

export const ADDRESSES_QUERY_KEY = ['biodata', 'addresses'] as const;

export const useAddresses = () => {
  const token = useAuthStore((state) => state.token);

  return useQuery<Address[], AxiosError<{ message?: string }>>({
    queryKey: ADDRESSES_QUERY_KEY,
    queryFn: async () => {
      const response = await api.get<Address[]>('/biodata/GetAddresses');
      return response.data;
    },
    enabled: !!token,
  });
};

export const useAddress = (id?: string) => {
  const token = useAuthStore((state) => state.token);

  return useQuery<Address, AxiosError<{ message?: string }>>({
    queryKey: ['biodata', 'address', id],
    queryFn: async () => {
      const response = await api.get<Address>('/biodata/GetDetailAddress', {
        params: { id },
      });
      return response.data;
    },
    enabled: !!token && !!id,
  });
};

export const useCreateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation<Address, AxiosError<{ message?: string }>, CreateAddressRequest>({
    mutationFn: async (data: CreateAddressRequest) => {
      const response = await api.post<Address>('/biodata/SaveAddress', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
};

export const useUpdateAddress = () => {
  const queryClient = useQueryClient();

  return useMutation<Address, AxiosError<{ message?: string }>, { id: string; data: UpdateAddressRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await api.put<Address>('/biodata/UpdateAddress', data, {
        params: { id },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
};

export const useSetPrimaryAddress = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosError<{ message?: string }>, string>({
    mutationFn: async (id: string) => {
      const response = await api.put<{ message: string }>('/biodata/SetPrimaryAddress', null, {
        params: { id },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
};

export const useDeleteAddress = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosError<{ message?: string }>, string>({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ message: string }>('/biodata/DeleteAddress', {
        params: { id },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ADDRESSES_QUERY_KEY });
    },
  });
};

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '@/services/api';
import { ApiErrorBody } from '@/services/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { AvailableOutlets, Outlet, UpsertOutletRequest } from '@/types/outlet';

type ApiError = AxiosError<ApiErrorBody>;

export const OUTLET_QUERY_KEYS = {
  all: ['outlets'] as const,
  // Outlet terakhir berbeda per pengguna: status login ikut di key agar dimuat ulang setelah login/logout
  available: (signedIn: boolean) => [...OUTLET_QUERY_KEYS.all, 'available', signedIn] as const,
  admin: () => [...OUTLET_QUERY_KEYS.all, 'admin'] as const,
};

// ==========================================
// Pelanggan
// ==========================================

/** Outlet aktif untuk Ambil Sendiri + outlet yang terakhir dipakai. Bisa tanpa login. */
export const useAvailableOutlets = (enabled = true) => {
  const signedIn = !!useAuthStore((s) => s.token);
  return useQuery<AvailableOutlets, ApiError>({
    queryKey: OUTLET_QUERY_KEYS.available(signedIn),
    queryFn: async () => (await api.get<AvailableOutlets>('/Outlet/GetAvailable')).data,
    enabled,
  });
};

// ==========================================
// Admin
// ==========================================

export const useAdminOutlets = () =>
  useQuery<Outlet[], ApiError>({
    queryKey: OUTLET_QUERY_KEYS.admin(),
    queryFn: async () => (await api.get<Outlet[]>('/Outlet/GetAll')).data,
  });

export const useSaveOutlet = () => {
  const queryClient = useQueryClient();
  return useMutation<Outlet, ApiError, { id?: string; data: UpsertOutletRequest }>({
    mutationFn: async ({ id, data }) =>
      id
        ? (await api.put<Outlet>('/Outlet/Update', data, { params: { id } })).data
        : (await api.post<Outlet>('/Outlet/Create', data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OUTLET_QUERY_KEYS.all }),
  });
};

export const useSetOutletActive = () => {
  const queryClient = useQueryClient();
  return useMutation<Outlet, ApiError, { id: string; isActive: boolean }>({
    mutationFn: async ({ id, isActive }) =>
      (await api.put<Outlet>('/Outlet/SetActive', { isActive }, { params: { id } })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OUTLET_QUERY_KEYS.all }),
  });
};

export const useDeleteOutlet = () => {
  const queryClient = useQueryClient();
  return useMutation<unknown, ApiError, string>({
    mutationFn: async (id) => (await api.delete('/Outlet/Delete', { params: { id } })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: OUTLET_QUERY_KEYS.all }),
  });
};

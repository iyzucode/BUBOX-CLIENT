import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '@/services/api';
import { ApiErrorBody } from '@/services/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import {
  CheckVoucherRequest,
  UpsertVoucherRequest,
  VoucherAdmin,
  VoucherOption,
  VoucherPaymentMethod,
} from '@/types/voucher';

type ApiError = AxiosError<ApiErrorBody>;

export const VOUCHER_QUERY_KEYS = {
  all: ['vouchers'] as const,
  available: (subtotal: number, method: VoucherPaymentMethod) =>
    [...VOUCHER_QUERY_KEYS.all, 'available', subtotal, method] as const,
  admin: () => [...VOUCHER_QUERY_KEYS.all, 'admin'] as const,
};

// ==========================================
// Pelanggan
// ==========================================

/** Voucher yang tampil di daftar beserta kelayakannya untuk subtotal keranjang. */
export const useAvailableVouchers = (subtotal: number, paymentMethod: VoucherPaymentMethod = 'QRIS') => {
  const token = useAuthStore((s) => s.token);
  return useQuery<VoucherOption[], ApiError>({
    queryKey: VOUCHER_QUERY_KEYS.available(subtotal, paymentMethod),
    queryFn: async () =>
      (await api.get<VoucherOption[]>('/Voucher/GetAvailable', { params: { subtotal, paymentMethod } })).data,
    enabled: !!token,
  });
};

/** Cek kode yang diketik (voucher rahasia juga bisa). */
export const useCheckVoucher = () =>
  useMutation<VoucherOption, ApiError, CheckVoucherRequest>({
    mutationFn: async (data) => (await api.post<VoucherOption>('/Voucher/Check', data)).data,
  });

// ==========================================
// Admin
// ==========================================

export const useAdminVouchers = () =>
  useQuery<VoucherAdmin[], ApiError>({
    queryKey: VOUCHER_QUERY_KEYS.admin(),
    queryFn: async () => (await api.get<VoucherAdmin[]>('/Voucher/GetAll')).data,
  });

export const useSaveVoucher = () => {
  const queryClient = useQueryClient();
  return useMutation<VoucherAdmin, ApiError, { id?: string; data: UpsertVoucherRequest }>({
    mutationFn: async ({ id, data }) =>
      id
        ? (await api.put<VoucherAdmin>('/Voucher/Update', data, { params: { id } })).data
        : (await api.post<VoucherAdmin>('/Voucher/Create', data)).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VOUCHER_QUERY_KEYS.all }),
  });
};

export const useSetVoucherActive = () => {
  const queryClient = useQueryClient();
  return useMutation<VoucherAdmin, ApiError, { id: string; isActive: boolean }>({
    mutationFn: async ({ id, isActive }) =>
      (await api.put<VoucherAdmin>('/Voucher/SetActive', { isActive }, { params: { id } })).data,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: VOUCHER_QUERY_KEYS.all }),
  });
};

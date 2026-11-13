import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '@/services/api';
import { ApiErrorBody } from '@/services/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import {
  AdminCancelRequest,
  CreateOrderRequest,
  CreateOrderResponse,
  DailyDeliveries,
  DailyProduction,
  OrderCutoffInfo,
  OrderDetail,
  OrderDayStatusCode,
  OrderPaymentStatus,
  OrderSearchParams,
  OrderSettings,
  OrderStatusCode,
  OrderSummary,
  PagedResult,
  UpdateOrderSettingsRequest,
} from '@/types/order';

type ApiError = AxiosError<ApiErrorBody>;

export const ORDER_QUERY_KEYS = {
  all: ['orders'] as const,
  mine: () => [...ORDER_QUERY_KEYS.all, 'mine'] as const,
  detail: (id: string) => [...ORDER_QUERY_KEYS.all, 'detail', id] as const,
  paymentStatus: (id: string) => [...ORDER_QUERY_KEYS.all, 'payment-status', id] as const,
  adminList: (params: OrderSearchParams) => [...ORDER_QUERY_KEYS.all, 'admin', params] as const,
  production: (date: string) => [...ORDER_QUERY_KEYS.all, 'production', date] as const,
  deliveries: (date: string) => [...ORDER_QUERY_KEYS.all, 'deliveries', date] as const,
  cutoff: ['settings', 'cutoff'] as const,
  settings: ['settings', 'order'] as const,
};

// ==========================================
// Customer
// ==========================================

export const useOrderCutoffInfo = () =>
  useQuery<OrderCutoffInfo, ApiError>({
    queryKey: ORDER_QUERY_KEYS.cutoff,
    queryFn: async () => (await api.get<OrderCutoffInfo>('/Settings/GetOrderCutoffInfo')).data,
    // Cutoff bisa terlewati saat halaman terbuka lama: refresh tiap 5 menit
    staleTime: 60_000,
    refetchInterval: 5 * 60_000,
  });

export const useCreateOrder = () => {
  const queryClient = useQueryClient();
  return useMutation<CreateOrderResponse, ApiError, CreateOrderRequest>({
    mutationFn: async (data) => (await api.post<CreateOrderResponse>('/Order/CreateOrder', data)).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.mine() });
    },
  });
};

export const useMyOrders = () => {
  const token = useAuthStore((s) => s.token);
  return useQuery<OrderSummary[], ApiError>({
    queryKey: ORDER_QUERY_KEYS.mine(),
    queryFn: async () => (await api.get<OrderSummary[]>('/Order/GetMyOrders')).data,
    enabled: !!token,
  });
};

/** Detail order lengkap (hari, item, histori). Diambil sekali; tidak di-poll. */
export const useOrderDetail = (id?: string) => {
  const token = useAuthStore((s) => s.token);
  return useQuery<OrderDetail, ApiError>({
    queryKey: ORDER_QUERY_KEYS.detail(id || ''),
    queryFn: async () => (await api.get<OrderDetail>('/Order/GetDetailOrder', { params: { id } })).data,
    enabled: !!token && !!id,
  });
};

const PAYMENT_POLL_MS = 5000;

/**
 * Polling ringan halaman QRIS: hanya GET /Order/GetPaymentStatus tiap 5 detik
 * selama masih AWAITING_PAYMENT. Begitu status berubah (dibayar/kedaluwarsa/batal),
 * detail lengkap & daftar pesanan diambil ulang sekali.
 */
export const usePaymentStatus = (id?: string, currentStatus?: OrderStatusCode) => {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const isAwaiting = currentStatus === 'AWAITING_PAYMENT';

  return useQuery<OrderPaymentStatus, ApiError>({
    queryKey: ORDER_QUERY_KEYS.paymentStatus(id || ''),
    queryFn: async () => {
      const status = (await api.get<OrderPaymentStatus>('/Order/GetPaymentStatus', { params: { id } })).data;
      if (status.statusCode !== currentStatus) {
        queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.detail(id || '') });
        queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.mine() });
      }
      return status;
    },
    // Hanya aktif selama detail menyatakan masih menunggu pembayaran.
    enabled: !!token && !!id && isAwaiting,
    refetchInterval: (query) =>
      !query.state.data || query.state.data.statusCode === 'AWAITING_PAYMENT' ? PAYMENT_POLL_MS : false,
  });
};

export const useCancelOrder = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, { id: string; reason?: string }>({
    mutationFn: async ({ id, reason }) =>
      (await api.put<{ message: string }>('/Order/CancelOrder', { reason: reason ?? null }, { params: { id } })).data,
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.detail(id) });
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.mine() });
    },
  });
};

// ==========================================
// Admin / Kitchen / Driver
// ==========================================

export const useAdminOrders = (params: OrderSearchParams) =>
  useQuery<PagedResult<OrderSummary>, ApiError>({
    queryKey: ORDER_QUERY_KEYS.adminList(params),
    queryFn: async () => (await api.get<PagedResult<OrderSummary>>('/OrderAdmin/GetOrders', { params })).data,
  });

export const useDailyProduction = (date: string) =>
  useQuery<DailyProduction, ApiError>({
    queryKey: ORDER_QUERY_KEYS.production(date),
    queryFn: async () =>
      (await api.get<DailyProduction>('/OrderAdmin/GetDailyProduction', { params: { date } })).data,
    enabled: !!date,
    refetchInterval: 60_000,
  });

/** Kiriman DELIVERY terbayar pada tanggal tsb, lengkap dengan zona & driver efektif. */
export const useDailyDeliveries = (date: string, enabled = true) =>
  useQuery<DailyDeliveries, ApiError>({
    queryKey: ORDER_QUERY_KEYS.deliveries(date),
    queryFn: async () =>
      (await api.get<DailyDeliveries>('/OrderAdmin/GetDailyDeliveries', { params: { date } })).data,
    enabled: !!date && enabled,
    refetchInterval: 60_000,
  });

const invalidateOrders = (queryClient: ReturnType<typeof useQueryClient>) =>
  queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });

export const useUpdateDayStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, { orderDayId: string; statusCode: OrderDayStatusCode }>({
    mutationFn: async ({ orderDayId, statusCode }) =>
      (await api.put<{ message: string }>('/OrderAdmin/UpdateDayStatus', { statusCode }, { params: { id: orderDayId } })).data,
    onSuccess: () => invalidateOrders(queryClient),
  });
};

export const useCancelDayByAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, { orderDayId: string } & AdminCancelRequest>({
    mutationFn: async ({ orderDayId, reason }) =>
      (await api.put<{ message: string }>('/OrderAdmin/CancelDayByAdmin', { reason }, { params: { id: orderDayId } })).data,
    onSuccess: () => invalidateOrders(queryClient),
  });
};

export const useCancelOrderByAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, { orderId: string } & AdminCancelRequest>({
    mutationFn: async ({ orderId, reason }) =>
      (await api.put<{ message: string }>('/OrderAdmin/CancelOrderByAdmin', { reason }, { params: { id: orderId } })).data,
    onSuccess: () => invalidateOrders(queryClient),
  });
};

// ==========================================
// Settings (Admin)
// ==========================================

export const useOrderSettings = () =>
  useQuery<OrderSettings, ApiError>({
    queryKey: ORDER_QUERY_KEYS.settings,
    queryFn: async () => (await api.get<OrderSettings>('/Settings/GetOrderSettings')).data,
  });

export const useUpdateOrderSettings = () => {
  const queryClient = useQueryClient();
  return useMutation<OrderSettings, ApiError, UpdateOrderSettingsRequest>({
    mutationFn: async (data) => (await api.put<OrderSettings>('/Settings/UpdateOrderSettings', data)).data,
    onSuccess: (data) => {
      queryClient.setQueryData(ORDER_QUERY_KEYS.settings, data);
      queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.cutoff });
    },
  });
};

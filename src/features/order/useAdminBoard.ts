import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '@/services/api';
import { ApiErrorBody } from '@/services/apiError';
import type {
  AdminBoardParams,
  AdminBoardResult,
  AdminDayRow,
  AdminOrderDetail,
  AdminOrderRow,
} from '@/types/adminOrders';
import { ORDER_QUERY_KEYS } from './useOrders';

type ApiError = AxiosError<ApiErrorBody>;

/** Di bawah ORDER_QUERY_KEYS.all, sehingga ikut diperbarui setiap aksi status / pembatalan / driver. */
export const ADMIN_BOARD_KEYS = {
  days: (p: AdminBoardParams) => [...ORDER_QUERY_KEYS.all, 'board', 'days', p] as const,
  orders: (p: AdminBoardParams) => [...ORDER_QUERY_KEYS.all, 'board', 'orders', p] as const,
  detail: (id: string) => [...ORDER_QUERY_KEYS.all, 'board', 'detail', id] as const,
};

/** Buang parameter kosong agar URL ringkas. */
const clean = (p: AdminBoardParams) =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const useAdminBoardDays = (params: AdminBoardParams, enabled: boolean) =>
  useQuery<AdminBoardResult<AdminDayRow>, ApiError>({
    queryKey: ADMIN_BOARD_KEYS.days(params),
    queryFn: async () => (await api.get<AdminBoardResult<AdminDayRow>>('/OrderAdmin/SearchDays', { params: clean(params) })).data,
    enabled,
    placeholderData: keepPreviousData,
  });

export const useAdminBoardOrders = (params: AdminBoardParams, enabled: boolean) =>
  useQuery<AdminBoardResult<AdminOrderRow>, ApiError>({
    queryKey: ADMIN_BOARD_KEYS.orders(params),
    queryFn: async () => (await api.get<AdminBoardResult<AdminOrderRow>>('/OrderAdmin/SearchOrders', { params: clean(params) })).data,
    enabled,
    placeholderData: keepPreviousData,
  });

export const useAdminOrderDetail = (orderId: string | null) =>
  useQuery<AdminOrderDetail, ApiError>({
    queryKey: ADMIN_BOARD_KEYS.detail(orderId ?? ''),
    queryFn: async () => (await api.get<AdminOrderDetail>('/OrderAdmin/GetOrderDetail', { params: { id: orderId } })).data,
    enabled: !!orderId,
  });

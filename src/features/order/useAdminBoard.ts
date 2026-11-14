import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { api } from '@/services/api';
import { ApiErrorBody } from '@/services/apiError';
import type {
  AdminBoardParams,
  AdminBoardResult,
  AdminDayRow,
  AdminOrderDetail,
  AdminOrderRow,
  BoardActivity,
  BulkActionResult,
  KitchenSheet,
} from '@/types/adminOrders';
import type { OrderDayStatusCode } from '@/types/order';
import { ORDER_QUERY_KEYS } from './useOrders';

type ApiError = AxiosError<ApiErrorBody>;

/** Di bawah ORDER_QUERY_KEYS.all, sehingga ikut diperbarui setiap aksi status / pembatalan / driver. */
export const ADMIN_BOARD_KEYS = {
  days: (p: AdminBoardParams) => [...ORDER_QUERY_KEYS.all, 'board', 'days', p] as const,
  orders: (p: AdminBoardParams) => [...ORDER_QUERY_KEYS.all, 'board', 'orders', p] as const,
  detail: (id: string) => [...ORDER_QUERY_KEYS.all, 'board', 'detail', id] as const,
  activity: (since: string) => [...ORDER_QUERY_KEYS.all, 'board', 'activity', since] as const,
};

/** Daftar diperbarui otomatis tiap menit selama tab browser aktif. */
export const BOARD_REFRESH_MS = 60_000;

/** Buang parameter kosong agar URL ringkas. */
const clean = (p: Partial<AdminBoardParams>) =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== null && v !== ''));

export const useAdminBoardDays = (params: AdminBoardParams, enabled: boolean) =>
  useQuery<AdminBoardResult<AdminDayRow>, ApiError>({
    queryKey: ADMIN_BOARD_KEYS.days(params),
    queryFn: async () => (await api.get<AdminBoardResult<AdminDayRow>>('/OrderAdmin/SearchDays', { params: clean(params) })).data,
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: BOARD_REFRESH_MS,
  });

export const useAdminBoardOrders = (params: AdminBoardParams, enabled: boolean) =>
  useQuery<AdminBoardResult<AdminOrderRow>, ApiError>({
    queryKey: ADMIN_BOARD_KEYS.orders(params),
    queryFn: async () => (await api.get<AdminBoardResult<AdminOrderRow>>('/OrderAdmin/SearchOrders', { params: clean(params) })).data,
    enabled,
    placeholderData: keepPreviousData,
    refetchInterval: BOARD_REFRESH_MS,
  });

export const useAdminOrderDetail = (orderId: string | null) =>
  useQuery<AdminOrderDetail, ApiError>({
    queryKey: ADMIN_BOARD_KEYS.detail(orderId ?? ''),
    queryFn: async () => (await api.get<AdminOrderDetail>('/OrderAdmin/GetOrderDetail', { params: { id: orderId } })).data,
    enabled: !!orderId,
  });

/** Jumlah pesanan baru & baru dibayar sejak `since` (ISO UTC), dicek tiap menit. */
export const useBoardActivity = (since: string, enabled: boolean) =>
  useQuery<BoardActivity, ApiError>({
    queryKey: ADMIN_BOARD_KEYS.activity(since),
    queryFn: async () => (await api.get<BoardActivity>('/OrderAdmin/GetBoardActivity', { params: { since } })).data,
    enabled,
    refetchInterval: BOARD_REFRESH_MS,
  });

// ---------- Aksi massal ----------

export const useBulkDayStatus = () => {
  const queryClient = useQueryClient();
  return useMutation<BulkActionResult, ApiError, { orderDayIds: string[]; statusCode: OrderDayStatusCode }>({
    mutationFn: async (data) => (await api.put<BulkActionResult>('/OrderAdmin/BulkUpdateDayStatus', data)).data,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all }),
  });
};

export const useBulkCancelDays = () => {
  const queryClient = useQueryClient();
  return useMutation<BulkActionResult, ApiError, { orderDayIds: string[]; reason: string }>({
    mutationFn: async (data) => (await api.put<BulkActionResult>('/OrderAdmin/BulkCancelDays', data)).data,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all }),
  });
};

export const useMarkDaysRefunded = () => {
  const queryClient = useQueryClient();
  return useMutation<BulkActionResult, ApiError, { orderDayIds: string[]; note: string | null }>({
    mutationFn: async (data) => (await api.put<BulkActionResult>('/OrderAdmin/MarkDaysRefunded', data)).data,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all }),
  });
};

// ---------- Ekspor & lembar dapur ----------

/** Parameter daftar tanpa paging (ekspor & cetak mengambil semua baris sesuai filter, tab, dan urutan). */
const unpaged = (p: AdminBoardParams) => clean({ ...p, page: undefined, pageSize: undefined });

export const fetchKitchenSheet = async (params: AdminBoardParams) =>
  (await api.get<KitchenSheet>('/OrderAdmin/GetKitchenSheet', { params: unpaged(params) })).data;

/** Unduh Excel (web). Nama file dari server (Content-Disposition), cadangan dari `fallbackName`. */
export const downloadBoardExport = async (kind: 'days' | 'orders', params: AdminBoardParams, fallbackName: string) => {
  const response = await api.get<Blob>(kind === 'days' ? '/OrderAdmin/ExportDays' : '/OrderAdmin/ExportOrders', {
    params: unpaged(params),
    responseType: 'blob',
  });
  const disposition = String(response.headers['content-disposition'] ?? '');
  const match = /filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(disposition);
  const fileName = match ? decodeURIComponent(match[1]) : fallbackName;

  const blobUrl = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  return fileName;
};

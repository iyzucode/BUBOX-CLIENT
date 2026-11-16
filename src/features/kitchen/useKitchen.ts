import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { ORDER_QUERY_KEYS } from '@/features/order/useOrders';
import { api } from '@/services/api';
import { ApiErrorBody } from '@/services/apiError';
import type { BulkActionResult } from '@/types/adminOrders';
import type { KitchenBoard, KitchenValidation } from '@/types/kitchen';

type ApiError = AxiosError<ApiErrorBody>;

/** Di bawah ORDER_QUERY_KEYS.all, sehingga ikut diperbarui setiap aksi status / pembatalan / driver. */
export const KITCHEN_KEYS = {
  validation: (date: string) => [...ORDER_QUERY_KEYS.all, 'kitchen', 'validation', date] as const,
  board: (date: string) => [...ORDER_QUERY_KEYS.all, 'kitchen', 'board', date] as const,
};

const REFRESH_MS = 60_000;

export const useKitchenValidation = (date: string) =>
  useQuery<KitchenValidation, ApiError>({
    queryKey: KITCHEN_KEYS.validation(date),
    queryFn: async () => (await api.get<KitchenValidation>('/Kitchen/GetValidation', { params: { date } })).data,
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH_MS,
  });

export const useKitchenBoard = (date: string) =>
  useQuery<KitchenBoard, ApiError>({
    queryKey: KITCHEN_KEYS.board(date),
    queryFn: async () => (await api.get<KitchenBoard>('/Kitchen/GetBoard', { params: { date } })).data,
    placeholderData: keepPreviousData,
    refetchInterval: REFRESH_MS,
  });

const useInvalidateOrders = () => {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
};

export const useReleaseKitchen = () => {
  const invalidate = useInvalidateOrders();
  return useMutation<KitchenValidation, ApiError, { date: string }>({
    mutationFn: async (data) => (await api.put<KitchenValidation>('/Kitchen/Release', data)).data,
    onSettled: invalidate,
  });
};

export const useCancelKitchenRelease = () => {
  const invalidate = useInvalidateOrders();
  return useMutation<{ message: string }, ApiError, { date: string }>({
    mutationFn: async (data) => (await api.put<{ message: string }>('/Kitchen/CancelRelease', data)).data,
    onSettled: invalidate,
  });
};

export const useMarkKitchenReady = () => {
  const invalidate = useInvalidateOrders();
  return useMutation<BulkActionResult, ApiError, { date: string; orderDayIds: string[] }>({
    mutationFn: async (data) => (await api.put<BulkActionResult>('/Kitchen/MarkReady', data)).data,
    onSettled: invalidate,
  });
};

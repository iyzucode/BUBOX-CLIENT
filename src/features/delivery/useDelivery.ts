import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { ORDER_QUERY_KEYS } from '@/features/order/useOrders';
import { api } from '@/services/api';
import { ApiErrorBody } from '@/services/apiError';
import {
  AreaChildren,
  AreaNode,
  DeliveryZone,
  Driver,
  SetDayDriverRequest,
  UpsertZoneRequest,
  UserSearchResult,
  WilayahSearchItem,
  ZoneArea,
  ZoneDriverHistory,
} from '@/types/delivery';

type ApiError = AxiosError<ApiErrorBody>;

export const DELIVERY_QUERY_KEYS = {
  all: ['delivery'] as const,
  areas: (parent: string | null) => [...DELIVERY_QUERY_KEYS.all, 'areas', parent ?? 'root'] as const,
  search: (q: string) => [...DELIVERY_QUERY_KEYS.all, 'search', q] as const,
  zones: () => [...DELIVERY_QUERY_KEYS.all, 'zones'] as const,
  zoneAreas: (zoneId: string) => [...DELIVERY_QUERY_KEYS.all, 'zone-areas', zoneId] as const,
  zoneHistory: (zoneId: string) => [...DELIVERY_QUERY_KEYS.all, 'zone-history', zoneId] as const,
  drivers: () => [...DELIVERY_QUERY_KEYS.all, 'drivers'] as const,
  users: (q: string) => [...DELIVERY_QUERY_KEYS.all, 'users', q] as const,
};

/** Perubahan cakupan/zona/driver memengaruhi pohon area, zona, driver, dan driver kiriman sekaligus. */
const invalidateDelivery = (queryClient: ReturnType<typeof useQueryClient>) => {
  queryClient.invalidateQueries({ queryKey: DELIVERY_QUERY_KEYS.all });
  queryClient.invalidateQueries({ queryKey: ORDER_QUERY_KEYS.all });
};

// ---------- Area ----------

export const useAreaChildren = (parentCode: string | null) =>
  useQuery<AreaChildren, ApiError>({
    queryKey: DELIVERY_QUERY_KEYS.areas(parentCode),
    queryFn: async () =>
      (await api.get<AreaChildren>('/DeliveryAdmin/GetAreaChildren', { params: { parentCode: parentCode ?? undefined } })).data,
    placeholderData: keepPreviousData,
  });

export const useSearchWilayah = (query: string) => {
  const q = query.trim();
  return useQuery<WilayahSearchItem[], ApiError>({
    queryKey: DELIVERY_QUERY_KEYS.search(q),
    queryFn: async () => (await api.get<WilayahSearchItem[]>('/DeliveryAdmin/SearchWilayah', { params: { q } })).data,
    enabled: q.length >= 3,
    staleTime: 60_000,
  });
};

export const useSetCoverage = () => {
  const queryClient = useQueryClient();
  return useMutation<AreaNode, ApiError, { wilayahCode: string; isCovered: boolean | null }>({
    mutationFn: async (data) => (await api.put<AreaNode>('/DeliveryAdmin/SetCoverage', data)).data,
    onSuccess: () => invalidateDelivery(queryClient),
  });
};

export const useSetZoneArea = () => {
  const queryClient = useQueryClient();
  return useMutation<AreaNode, ApiError, { wilayahCode: string; zoneId: string | null }>({
    mutationFn: async (data) => (await api.put<AreaNode>('/DeliveryAdmin/SetZoneArea', data)).data,
    onSuccess: () => invalidateDelivery(queryClient),
  });
};

// ---------- Zona ----------

export const useDeliveryZones = () =>
  useQuery<DeliveryZone[], ApiError>({
    queryKey: DELIVERY_QUERY_KEYS.zones(),
    queryFn: async () => (await api.get<DeliveryZone[]>('/DeliveryAdmin/GetZones')).data,
  });

export const useSaveZone = () => {
  const queryClient = useQueryClient();
  return useMutation<DeliveryZone, ApiError, { id?: string; data: UpsertZoneRequest }>({
    mutationFn: async ({ id, data }) =>
      id
        ? (await api.put<DeliveryZone>('/DeliveryAdmin/UpdateZone', data, { params: { id } })).data
        : (await api.post<DeliveryZone>('/DeliveryAdmin/CreateZone', data)).data,
    onSuccess: () => invalidateDelivery(queryClient),
  });
};

export const useSetZoneDriver = () => {
  const queryClient = useQueryClient();
  return useMutation<DeliveryZone, ApiError, { zoneId: string; driverUserId: string | null }>({
    mutationFn: async ({ zoneId, driverUserId }) =>
      (await api.put<DeliveryZone>('/DeliveryAdmin/SetZoneDriver', { driverUserId }, { params: { zoneId } })).data,
    onSuccess: () => invalidateDelivery(queryClient),
  });
};

export const useZoneDriverHistory = (zoneId: string | null) =>
  useQuery<ZoneDriverHistory[], ApiError>({
    queryKey: DELIVERY_QUERY_KEYS.zoneHistory(zoneId ?? ''),
    queryFn: async () =>
      (await api.get<ZoneDriverHistory[]>('/DeliveryAdmin/GetZoneDriverHistory', { params: { zoneId } })).data,
    enabled: !!zoneId,
  });

export const useZoneAreas = (zoneId: string | null) =>
  useQuery<ZoneArea[], ApiError>({
    queryKey: DELIVERY_QUERY_KEYS.zoneAreas(zoneId ?? ''),
    queryFn: async () => (await api.get<ZoneArea[]>('/DeliveryAdmin/GetZoneAreas', { params: { zoneId } })).data,
    enabled: !!zoneId,
  });

/** Hanya berhasil bila zona tidak punya wilayah & driver aktif (selain itu 409 DELIVERY_ZONE_NOT_EMPTY). */
export const useDeleteZone = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, { id: string }>({
    mutationFn: async ({ id }) => (await api.delete<{ message: string }>('/DeliveryAdmin/DeleteZone', { params: { id } })).data,
    onSuccess: () => invalidateDelivery(queryClient),
  });
};

// ---------- Driver ----------

export const useDrivers = (enabled = true) =>
  useQuery<Driver[], ApiError>({
    queryKey: DELIVERY_QUERY_KEYS.drivers(),
    queryFn: async () => (await api.get<Driver[]>('/DeliveryAdmin/GetDrivers')).data,
    enabled,
  });

export const useSearchUsers = (query: string) => {
  const q = query.trim();
  return useQuery<UserSearchResult[], ApiError>({
    queryKey: DELIVERY_QUERY_KEYS.users(q),
    queryFn: async () => (await api.get<UserSearchResult[]>('/DeliveryAdmin/SearchUsers', { params: { q } })).data,
    enabled: q.length >= 3,
  });
};

export const useSetDriverRole = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, ApiError, { userId: string; grant: boolean }>({
    mutationFn: async ({ userId, grant }) =>
      (await api.put<{ message: string }>(grant ? '/DeliveryAdmin/GrantDriver' : '/DeliveryAdmin/RevokeDriver', undefined, {
        params: { userId },
      })).data,
    onSuccess: () => invalidateDelivery(queryClient),
  });
};

// ---------- Penugasan manual kiriman ----------

export const useSetDayDriver = () => {
  const queryClient = useQueryClient();
  return useMutation<{ updated: number }, ApiError, SetDayDriverRequest>({
    mutationFn: async (data) => (await api.put<{ updated: number }>('/DeliveryAdmin/SetDayDriver', data)).data,
    onSuccess: () => invalidateDelivery(queryClient),
  });
};

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/services/api';
import {
  CreateMenuRequest,
  DayMenuSchedule,
  Menu,
  UpdateMenuRequest,
  WeeklyMenuScheduleResponse,
} from '@/types/menu';

export const MENU_QUERY_KEYS = {
  all: ['menus'] as const,
  weekly: () => [...MENU_QUERY_KEYS.all, 'weekly'] as const,
  byDay: (dayOfWeek: number) => [...MENU_QUERY_KEYS.all, 'day', dayOfWeek] as const,
  detail: (id: string) => [...MENU_QUERY_KEYS.all, 'detail', id] as const,
};

export const useGetWeeklyMenu = () => {
  return useQuery<WeeklyMenuScheduleResponse, AxiosError<{ message?: string }>>({
    queryKey: MENU_QUERY_KEYS.weekly(),
    queryFn: async () => {
      const response = await api.get<WeeklyMenuScheduleResponse>('/menu/GetWeeklyMenu');
      return response.data;
    },
  });
};

export const useGetMenuByDay = (dayOfWeek: number) => {
  return useQuery<DayMenuSchedule, AxiosError<{ message?: string }>>({
    queryKey: MENU_QUERY_KEYS.byDay(dayOfWeek),
    queryFn: async () => {
      const response = await api.get<DayMenuSchedule>('/menu/GetMenuByDay', {
        params: { dayOfWeek },
      });
      return response.data;
    },
    enabled: dayOfWeek >= 1 && dayOfWeek <= 7,
  });
};

export const useGetDetailMenu = (id?: string) => {
  return useQuery<Menu, AxiosError<{ message?: string }>>({
    queryKey: MENU_QUERY_KEYS.detail(id || ''),
    queryFn: async () => {
      const response = await api.get<Menu>('/menu/GetDetailMenu', {
        params: { id },
      });
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateMenu = () => {
  const queryClient = useQueryClient();

  return useMutation<{ id: string; message: string }, AxiosError<{ message?: string }>, CreateMenuRequest>({
    mutationFn: async (data: CreateMenuRequest) => {
      const response = await api.post<{ id: string; message: string }>('/menu/CreateMenu', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.all });
    },
  });
};

export const useUpdateMenu = () => {
  const queryClient = useQueryClient();

  return useMutation<{ id: string; message: string }, AxiosError<{ message?: string }>, { id: string; data: UpdateMenuRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await api.put<{ id: string; message: string }>('/menu/UpdateMenu', data, {
        params: { id },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.all });
    },
  });
};

export const useDeleteMenu = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, AxiosError<{ message?: string }>, string>({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ message: string }>('/menu/DeleteMenu', {
        params: { id },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.all });
    },
  });
};

export const useToggleMenuStatus = () => {
  const queryClient = useQueryClient();

  return useMutation<{ id: string; isActive: boolean; message: string }, AxiosError<{ message?: string }>, { id: string; isActive: boolean }>({
    mutationFn: async ({ id, isActive }) => {
      const response = await api.put<{ id: string; isActive: boolean; message: string }>('/menu/ToggleMenuStatus', null, {
        params: { id, isActive },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.all });
    },
  });
};

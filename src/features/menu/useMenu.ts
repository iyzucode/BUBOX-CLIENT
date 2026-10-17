import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { api } from '@/services/api';
import {
  AssignMenuRequest,
  BatchAssignMenusRequest,
  CreateMasterMenuRequest,
  CreateMenuCategoryRequest,
  CreateMenuRequest,
  DayMenuSchedule,
  MasterMenu,
  Menu,
  MenuCategory,
  UpdateMasterMenuRequest,
  UpdateMenuCategoryRequest,
  UpdateMenuRequest,
  WeeklyMenuScheduleResponse,
} from '@/types/menu';

export const MENU_QUERY_KEYS = {
  all: ['menus'] as const,
  weekly: () => [...MENU_QUERY_KEYS.all, 'weekly'] as const,
  byDay: (dayOfWeek: number) => [...MENU_QUERY_KEYS.all, 'day', dayOfWeek] as const,
  detail: (id: string) => [...MENU_QUERY_KEYS.all, 'detail', id] as const,
  master: (categoryId?: string, search?: string) => [...MENU_QUERY_KEYS.all, 'master', categoryId || '', search || ''] as const,
  masterDetail: (id: string) => [...MENU_QUERY_KEYS.all, 'masterDetail', id] as const,
  categories: (type?: string) => ['menuCategories', type || 'all'] as const,
  mainCategories: () => ['menuCategories', 'main'] as const,
};

// ==========================================
// 1. KATEGORI MENU (rf_menu_categories)
// ==========================================

export const useGetMenuCategories = (categoryType?: string, includeInactive = false) => {
  return useQuery<MenuCategory[], AxiosError<{ message?: string }>>({
    queryKey: MENU_QUERY_KEYS.categories(categoryType),
    queryFn: async () => {
      const response = await api.get<MenuCategory[]>('/MenuCategory/GetCategories', {
        params: { categoryType, includeInactive },
      });
      return response.data;
    },
  });
};

export const useGetMainCategories = () => {
  return useQuery<MenuCategory[], AxiosError<{ message?: string }>>({
    queryKey: MENU_QUERY_KEYS.mainCategories(),
    queryFn: async () => {
      const response = await api.get<MenuCategory[]>('/MenuCategory/GetMainCategories');
      return response.data;
    },
  });
};

export const useCreateMenuCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<{ id: string; message: string }, AxiosError<{ message?: string }>, CreateMenuCategoryRequest>({
    mutationFn: async (data) => {
      const response = await api.post<{ id: string; message: string }>('/MenuCategory/CreateCategory', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuCategories'] });
    },
  });
};

export const useUpdateMenuCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<{ id: string; message: string }, AxiosError<{ message?: string }>, { id: string; data: UpdateMenuCategoryRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await api.put<{ id: string; message: string }>('/MenuCategory/UpdateCategory', data, {
        params: { id },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuCategories'] });
    },
  });
};

export const useDeleteMenuCategory = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, AxiosError<{ message?: string }>, string>({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ message: string }>('/MenuCategory/DeleteCategory', {
        params: { id },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['menuCategories'] });
    },
  });
};

// ==========================================
// 2. KATALOG MASTER MENU
// ==========================================

export const useGetMasterMenus = (categoryId?: string, search?: string, includeInactive = false) => {
  return useQuery<MasterMenu[], AxiosError<{ message?: string }>>({
    queryKey: MENU_QUERY_KEYS.master(categoryId, search),
    queryFn: async () => {
      const response = await api.get<MasterMenu[]>('/Menu/GetMasterMenus', {
        params: { categoryId, search, includeInactive },
      });
      return response.data;
    },
  });
};

export const useGetDetailMasterMenu = (id?: string) => {
  return useQuery<MasterMenu, AxiosError<{ message?: string }>>({
    queryKey: MENU_QUERY_KEYS.masterDetail(id || ''),
    queryFn: async () => {
      const response = await api.get<MasterMenu>('/Menu/GetDetailMasterMenu', {
        params: { id },
      });
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateMasterMenu = () => {
  const queryClient = useQueryClient();
  return useMutation<{ id: string; message: string }, AxiosError<{ message?: string }>, CreateMasterMenuRequest>({
    mutationFn: async (data) => {
      const response = await api.post<{ id: string; message: string }>('/Menu/CreateMasterMenu', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.all });
    },
  });
};

export const useUpdateMasterMenu = () => {
  const queryClient = useQueryClient();
  return useMutation<{ id: string; message: string }, AxiosError<{ message?: string }>, { id: string; data: UpdateMasterMenuRequest }>({
    mutationFn: async ({ id, data }) => {
      const response = await api.put<{ id: string; message: string }>('/Menu/UpdateMasterMenu', data, {
        params: { id },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.all });
    },
  });
};

export const useDeleteMasterMenu = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, AxiosError<{ message?: string }>, string>({
    mutationFn: async (id: string) => {
      const response = await api.delete<{ message: string }>('/Menu/DeleteMasterMenu', {
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
      const response = await api.put<{ id: string; isActive: boolean; message: string }>('/Menu/ToggleMenuStatus', null, {
        params: { id, isActive },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.all });
    },
  });
};

// ==========================================
// 3. PENUGASAN JADWAL HARIAN (ASSIGNMENTS)
// ==========================================

export const useAssignMenuToDay = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, AxiosError<{ message?: string }>, AssignMenuRequest>({
    mutationFn: async (data) => {
      const response = await api.post<{ message: string }>('/Menu/AssignMenuToDay', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.all });
    },
  });
};

export const useBatchAssignMenusToDay = () => {
  const queryClient = useQueryClient();
  return useMutation<{ count: number; message: string }, AxiosError<{ message?: string }>, BatchAssignMenusRequest>({
    mutationFn: async (data) => {
      const response = await api.post<{ count: number; message: string }>('/Menu/BatchAssignMenusToDay', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.all });
    },
  });
};

export const useRemoveMenuFromDay = () => {
  const queryClient = useQueryClient();
  return useMutation<{ message: string }, AxiosError<{ message?: string }>, string>({
    mutationFn: async (assignmentId: string) => {
      const response = await api.delete<{ message: string }>('/Menu/RemoveMenuFromDay', {
        params: { assignmentId },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: MENU_QUERY_KEYS.all });
    },
  });
};

// ==========================================
// 4. JADWAL MINGGUAN & HARIAN (PEMESANAN PELANGGAN)
// ==========================================

export const useGetWeeklyMenu = () => {
  return useQuery<WeeklyMenuScheduleResponse, AxiosError<{ message?: string }>>({
    queryKey: MENU_QUERY_KEYS.weekly(),
    queryFn: async () => {
      const response = await api.get<WeeklyMenuScheduleResponse>('/Menu/GetWeeklyMenu');
      return response.data;
    },
  });
};

export const useGetMenuByDay = (dayOfWeek: number) => {
  return useQuery<DayMenuSchedule, AxiosError<{ message?: string }>>({
    queryKey: MENU_QUERY_KEYS.byDay(dayOfWeek),
    queryFn: async () => {
      const response = await api.get<DayMenuSchedule>('/Menu/GetMenuByDay', {
        params: { dayOfWeek },
      });
      return response.data;
    },
    enabled: dayOfWeek >= 1 && dayOfWeek <= 7,
  });
};

// Legacy support
export const useGetDetailMenu = (id?: string) => {
  return useQuery<Menu, AxiosError<{ message?: string }>>({
    queryKey: MENU_QUERY_KEYS.detail(id || ''),
    queryFn: async () => {
      const response = await api.get<Menu>('/Menu/GetDetailMasterMenu', {
        params: { id },
      });
      return response.data;
    },
    enabled: !!id,
  });
};

export const useCreateMenu = useCreateMasterMenu;
export const useUpdateMenu = useUpdateMasterMenu;
export const useDeleteMenu = useDeleteMasterMenu;

export type MenuType = 'UTAMA' | 'SEKUNDER';

export interface MenuCategory {
  id: string;
  code: string;
  name: string;
  categoryType: MenuType;
  displayOrder: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMenuCategoryRequest {
  code: string;
  name: string;
  categoryType: MenuType;
  displayOrder?: number;
  isActive?: boolean;
}

export interface UpdateMenuCategoryRequest {
  name: string;
  categoryType: MenuType;
  displayOrder?: number;
  isActive?: boolean;
}

export interface MasterMenu {
  id: string;
  categoryId: string;
  categoryCode: string;
  categoryName: string;
  categoryType: MenuType;
  name: string;
  description?: string | null;
  ingredients?: string | null;
  nutritionInfo?: string | null;
  price: number;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  assignedDaysCount?: number;
}

export interface CreateMasterMenuRequest {
  categoryId: string;
  name: string;
  price: number;
  description?: string;
  ingredients?: string;
  nutritionInfo?: string;
  imageUrl?: string | null;
  isActive?: boolean;
}

export interface UpdateMasterMenuRequest {
  categoryId: string;
  name: string;
  price: number;
  description?: string;
  ingredients?: string;
  nutritionInfo?: string;
  imageUrl?: string | null;
  isActive?: boolean;
}

export interface AssignMenuRequest {
  menuId: string;
  dayOfWeek: number;
}

export interface BatchAssignMenusRequest {
  dayOfWeek: number;
  menuIds: string[];
}

export interface Menu {
  id: string;
  dayOfWeek: number; // 1: Senin, ..., 7: Minggu
  dayName: string;
  menuType: MenuType;
  category: string; // Bubur, Nasi Tim, Sup, Snack, Pelengkap
  name: string;
  description?: string | null;
  ingredients?: string | null;
  nutritionInfo?: string | null;
  price: number;
  imageUrl?: string | null;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
  categoryId?: string;
  assignmentId?: string;
}

export interface CreateMenuRequest {
  dayOfWeek: number;
  menuType: MenuType;
  category: string;
  name: string;
  description?: string;
  ingredients?: string;
  nutritionInfo?: string;
  price: number;
  imageUrl?: string | null;
  isActive?: boolean;
}

export interface UpdateMenuRequest {
  dayOfWeek: number;
  menuType: MenuType;
  category: string;
  name: string;
  description?: string;
  ingredients?: string;
  nutritionInfo?: string;
  price: number;
  imageUrl?: string | null;
  isActive: boolean;
}

export interface DayMenuSchedule {
  dayOfWeek: number;
  dayName: string;
  mainMenus: Menu[];
  secondaryMenus: Menu[];
}

export interface WeeklyMenuScheduleResponse {
  days: DayMenuSchedule[];
  totalMenus: number;
}

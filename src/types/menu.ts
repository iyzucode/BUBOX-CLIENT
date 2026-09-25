export type MenuType = 'UTAMA' | 'SEKUNDER';

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

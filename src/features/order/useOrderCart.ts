import { useMemo, useState } from 'react';
import { Menu, MenuCategory, WeeklyMenuScheduleResponse } from '@/types/menu';
import {
  formatChipDate,
  formatIndonesianDate,
  getDayOfWeekNumber,
  nextNDays,
  parseDateKey,
} from './dateUtils';

export type CategoryId = string;

export interface DateEntry {
  key: string;
  dateObj: Date;
  dayOfWeek: number;
  formattedFull: string;
  formattedChip: string;
}

export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  BUBUR: ['bubur', 'porridge'],
  NASI_TIM: ['nasi tim', 'tim'],
  SUP: ['sup', 'soup', 'kuah'],
};

export function useOrderCart(weeklyData?: WeeklyMenuScheduleResponse, categories?: MenuCategory[]) {
  // 1. Single source of truth for ordered dates (default: empty array, user selects freely)
  const [selectedDateKeys, setSelectedDateKeys] = useState<string[]>([]);

  // 2. Active categories (multi-select: Bubur, Nasi Tim, Sup)
  const [activeCategories, setActiveCategories] = useState<CategoryId[]>([]);

  // 3. Cart: dateKey -> menuId -> quantity
  const [cart, setCart] = useState<Record<string, Record<string, number>>>({});

  // Lookup map of all menus: menuId -> Menu
  const allMenusMap = useMemo(() => {
    const map = new Map<string, Menu>();
    if (weeklyData?.days) {
      weeklyData.days.forEach((day) => {
        day.mainMenus.forEach((m) => map.set(m.id, m));
        day.secondaryMenus.forEach((m) => map.set(m.id, m));
      });
    }
    return map;
  }, [weeklyData]);

  // Sorted list of active date entries
  const orderDates: DateEntry[] = useMemo(() => {
    return selectedDateKeys
      .map((key) => {
        const d = parseDateKey(key);
        return {
          key,
          dateObj: d,
          dayOfWeek: getDayOfWeekNumber(d),
          formattedFull: formatIndonesianDate(d),
          formattedChip: formatChipDate(d),
        };
      })
      .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());
  }, [selectedDateKeys]);

  // Helper to find matching menus for a category on a given dayOfWeek
  const getMatchingMenusForCategory = (dayOfWeek: number, categoryId: CategoryId): Menu[] => {
    if (!weeklyData?.days) return [];
    const daySchedule = weeklyData.days.find((d) => d.dayOfWeek === dayOfWeek);
    if (!daySchedule) return [];

    const allDayMenus = [...daySchedule.mainMenus, ...daySchedule.secondaryMenus];
    const target = categoryId.toLowerCase();
    const catObj = categories?.find((c) => c.id.toLowerCase() === target || c.code.toLowerCase() === target);

    return allDayMenus.filter((m) => {
      // 1. Direct match on CategoryId (UUID)
      if (m.categoryId && m.categoryId.toLowerCase() === target) {
        return true;
      }
      if (catObj && m.categoryId && m.categoryId.toLowerCase() === catObj.id.toLowerCase()) {
        return true;
      }
      // 2. Direct match or substring on category name/code
      const catLower = (m.category || '').toLowerCase();
      if (catObj && catObj.name) {
        if (catLower === catObj.name.toLowerCase() || catLower.includes(catObj.name.toLowerCase())) {
          return true;
        }
      }
      if (catLower && (catLower === target || target.includes(catLower) || catLower.includes(target))) {
        return true;
      }
      // 3. Fallback keywords
      const codeOrTarget = (catObj?.code || categoryId).toUpperCase();
      const keywords = CATEGORY_KEYWORDS[codeOrTarget] || [];
      const nameLower = (m.name || '').toLowerCase();
      return keywords.some((kw) => catLower.includes(kw) || nameLower.includes(kw));
    });
  };

  // Toggle Category multi-select with instant effect on all active days
  const handleToggleCategory = (catId: CategoryId) => {
    const isCurrentlyActive = activeCategories.includes(catId);
    const newCategories = isCurrentlyActive
      ? activeCategories.filter((id) => id !== catId)
      : [...activeCategories, catId];

    setActiveCategories(newCategories);

    if (!weeklyData?.days) return;

    setCart((prevCart) => {
      const nextCart = { ...prevCart };

      orderDates.forEach((entry) => {
        const dayCart = { ...(nextCart[entry.key] || {}) };
        const matchingMenus = getMatchingMenusForCategory(entry.dayOfWeek, catId);

        if (isCurrentlyActive) {
          // REMOVED category: delete items from cart
          matchingMenus.forEach((m) => {
            delete dayCart[m.id];
          });
        } else {
          // ADDED category: add items with 1 portion (only if not already in cart)
          matchingMenus.forEach((m) => {
            if (!dayCart[m.id]) {
              dayCart[m.id] = 1;
            }
          });
        }

        if (Object.keys(dayCart).length === 0) {
          delete nextCart[entry.key];
        } else {
          nextCart[entry.key] = dayCart;
        }
      });

      return nextCart;
    });
  };

  // Set multiple dates from Calendar modal
  const handleUpdateSelectedDates = (newDateKeys: string[]) => {
    const prevKeySet = new Set(selectedDateKeys);
    setSelectedDateKeys(newDateKeys);

    if (!weeklyData?.days || activeCategories.length === 0) {
      // Clean up removed dates from cart
      setCart((prev) => {
        const next = { ...prev };
        const newKeySet = new Set(newDateKeys);
        Object.keys(next).forEach((k) => {
          if (!newKeySet.has(k)) delete next[k];
        });
        return next;
      });
      return;
    }

    // Auto-fill active categories for newly added dates
    setCart((prevCart) => {
      const nextCart = { ...prevCart };
      const newKeySet = new Set(newDateKeys);

      // Clean up removed
      Object.keys(nextCart).forEach((k) => {
        if (!newKeySet.has(k)) delete nextCart[k];
      });

      // Apply active categories to brand new dates
      newDateKeys.forEach((key) => {
        if (!prevKeySet.has(key)) {
          const d = parseDateKey(key);
          const dayOfWeek = getDayOfWeekNumber(d);
          const dayCart = { ...(nextCart[key] || {}) };

          activeCategories.forEach((catId) => {
            const matches = getMatchingMenusForCategory(dayOfWeek, catId);
            matches.forEach((m) => {
              if (!dayCart[m.id]) {
                dayCart[m.id] = 1;
              }
            });
          });

          if (Object.keys(dayCart).length > 0) {
            nextCart[key] = dayCart;
          }
        }
      });

      return nextCart;
    });
  };

  // Remove a single date (via 'X' button in Day card)
  const handleRemoveDate = (dateKey: string) => {
    setSelectedDateKeys((prev) => prev.filter((k) => k !== dateKey));
    setCart((prev) => {
      const next = { ...prev };
      delete next[dateKey];
      return next;
    });
  };

  // Update item quantity on a specific date
  const updateItemQty = (dateKey: string, menuId: string, deltaOrValue: number | string) => {
    setCart((prev) => {
      const dayCart = { ...(prev[dateKey] || {}) };
      let newQty = 0;

      if (typeof deltaOrValue === 'string') {
        const parsed = parseInt(deltaOrValue, 10);
        newQty = isNaN(parsed) || parsed < 0 ? 0 : parsed;
      } else {
        const currentQty = dayCart[menuId] || 0;
        newQty = Math.max(0, currentQty + deltaOrValue);
      }

      if (newQty <= 0) {
        delete dayCart[menuId];
      } else {
        dayCart[menuId] = newQty;
      }

      const next = { ...prev };
      if (Object.keys(dayCart).length === 0) {
        delete next[dateKey];
      } else {
        next[dateKey] = dayCart;
      }

      return next;
    });
  };

  // Day subtotal
  const calculateDaySubtotal = (dateKey: string): number => {
    const dayCart = cart[dateKey];
    if (!dayCart) return 0;

    let subtotal = 0;
    Object.entries(dayCart).forEach(([menuId, qty]) => {
      const menu = allMenusMap.get(menuId);
      if (menu && qty > 0) {
        subtotal += Number(menu.price) * qty;
      }
    });
    return subtotal;
  };

  // Grand total & total items across all selected dates
  const { grandTotal, totalItemsCount } = useMemo(() => {
    let total = 0;
    let count = 0;
    const keySet = new Set(selectedDateKeys);

    Object.entries(cart).forEach(([dateKey, dayCart]) => {
      if (!keySet.has(dateKey) || !dayCart) return;

      Object.entries(dayCart).forEach(([menuId, qty]) => {
        const menu = allMenusMap.get(menuId);
        if (menu && qty > 0) {
          total += Number(menu.price) * qty;
          count += qty;
        }
      });
    });

    return { grandTotal: total, totalItemsCount: count };
  }, [cart, selectedDateKeys, allMenusMap]);

  return {
    selectedDateKeys,
    orderDates,
    activeCategories,
    cart,
    allMenusMap,
    grandTotal,
    totalItemsCount,
    handleToggleCategory,
    handleUpdateSelectedDates,
    handleRemoveDate,
    updateItemQty,
    calculateDaySubtotal,
  };
}

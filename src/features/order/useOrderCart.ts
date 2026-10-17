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

  // 2. Custom portion quantities per category (e.g. { "34e8efb8-...": 2 })
  const [categoryQuantities, setCategoryQuantities] = useState<Record<string, number>>({});

  // Active category keys (where qty > 0)
  const activeCategories = useMemo(() => {
    return Object.keys(categoryQuantities).filter((k) => (categoryQuantities[k] || 0) > 0);
  }, [categoryQuantities]);

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

  // Set custom portion quantity for a specific category across all active days
  const handleSetCategoryQuantity = (catId: CategoryId, rawQty: number) => {
    const qty = Math.max(0, Math.min(20, Math.floor(rawQty)));

    setCategoryQuantities((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[catId];
      } else {
        next[catId] = qty;
      }
      return next;
    });

    if (!weeklyData?.days) return;

    setCart((prevCart) => {
      const nextCart = { ...prevCart };

      orderDates.forEach((entry) => {
        const dayCart = { ...(nextCart[entry.key] || {}) };
        const matchingMenus = getMatchingMenusForCategory(entry.dayOfWeek, catId);

        if (qty <= 0) {
          // REMOVED / 0 portion: delete items from cart
          matchingMenus.forEach((m) => {
            delete dayCart[m.id];
          });
        } else {
          // SET custom portion: update each matching dish to `qty`
          matchingMenus.forEach((m) => {
            dayCart[m.id] = qty;
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

  // Toggle Category: if active -> 0 (remove), if inactive -> 1 portion
  const handleToggleCategory = (catId: CategoryId) => {
    const currentQty = categoryQuantities[catId] || 0;
    if (currentQty > 0) {
      handleSetCategoryQuantity(catId, 0);
    } else {
      handleSetCategoryQuantity(catId, 1);
    }
  };

  const handleIncrementCategory = (catId: CategoryId) => {
    const currentQty = categoryQuantities[catId] || 0;
    handleSetCategoryQuantity(catId, Math.min(20, currentQty + 1));
  };

  const handleDecrementCategory = (catId: CategoryId) => {
    const currentQty = categoryQuantities[catId] || 0;
    handleSetCategoryQuantity(catId, Math.max(0, currentQty - 1));
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

    // Auto-fill active category portions for newly added dates
    setCart((prevCart) => {
      const nextCart = { ...prevCart };
      const newKeySet = new Set(newDateKeys);

      // Clean up removed
      Object.keys(nextCart).forEach((k) => {
        if (!newKeySet.has(k)) delete nextCart[k];
      });

      // Apply active categories with custom quantities to brand new dates
      newDateKeys.forEach((key) => {
        if (!prevKeySet.has(key)) {
          const d = parseDateKey(key);
          const dayOfWeek = getDayOfWeekNumber(d);
          const dayCart = { ...(nextCart[key] || {}) };

          Object.entries(categoryQuantities).forEach(([catId, catQty]) => {
            if (catQty > 0) {
              const matches = getMatchingMenusForCategory(dayOfWeek, catId);
              matches.forEach((m) => {
                dayCart[m.id] = catQty;
              });
            }
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
    categoryQuantities,
    activeCategories,
    cart,
    allMenusMap,
    grandTotal,
    totalItemsCount,
    handleSetCategoryQuantity,
    handleIncrementCategory,
    handleDecrementCategory,
    handleToggleCategory,
    handleUpdateSelectedDates,
    handleRemoveDate,
    updateItemQty,
    calculateDaySubtotal,
  };
}

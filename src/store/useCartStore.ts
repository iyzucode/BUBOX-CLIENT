import { create } from 'zustand';
import { Menu } from '@/types/menu';
import { CreateOrderDayRequest } from '@/types/order';

export type FulfillmentType = 'DELIVERY' | 'PICKUP';

export interface CartStoreState {
  selectedDateKeys: string[];
  categoryQuantities: Record<string, number>;
  cart: Record<string, Record<string, number>>; // dateKey -> menuId -> quantity
  allMenus: Record<string, Menu>; // menuId -> Menu
  fulfillmentType: FulfillmentType;
  selectedAddressId: string | null;
  notes: string;

  // Actions
  setOrderData: (data: {
    selectedDateKeys: string[];
    categoryQuantities: Record<string, number>;
    cart: Record<string, Record<string, number>>;
    allMenus: Record<string, Menu>;
  }) => void;
  setFulfillmentType: (type: FulfillmentType) => void;
  setSelectedAddressId: (id: string | null) => void;
  setNotes: (notes: string) => void;
  clearCart: () => void;

  // Computed helpers
  /** Estimasi subtotal di client. Harga final selalu dihitung ulang oleh server saat CreateOrder. */
  getSubtotal: () => number;
  getTotalItemsCount: () => number;
  /** Payload hari & item untuk POST /Order/CreateOrder (hanya tanggal terpilih dengan qty > 0). */
  buildOrderDays: () => CreateOrderDayRequest[];
}

// Catatan: kupon promo di-hold (belum ada di v1). Ongkir & total final ditentukan server.
export const useCartStore = create<CartStoreState>((set, get) => ({
  selectedDateKeys: [],
  categoryQuantities: {},
  cart: {},
  allMenus: {},
  fulfillmentType: 'DELIVERY',
  selectedAddressId: null,
  notes: '',

  setOrderData: (data) =>
    set({
      selectedDateKeys: data.selectedDateKeys,
      categoryQuantities: data.categoryQuantities,
      cart: data.cart,
      allMenus: data.allMenus,
    }),

  setFulfillmentType: (type) => set({ fulfillmentType: type }),

  setSelectedAddressId: (id) => set({ selectedAddressId: id }),

  setNotes: (notes) => set({ notes }),

  clearCart: () =>
    set({
      selectedDateKeys: [],
      categoryQuantities: {},
      cart: {},
      allMenus: {},
      fulfillmentType: 'DELIVERY',
      selectedAddressId: null,
      notes: '',
    }),

  getSubtotal: () => {
    const { cart, allMenus, selectedDateKeys } = get();
    let total = 0;
    selectedDateKeys.forEach((dateKey) => {
      const dayItems = cart[dateKey] || {};
      Object.keys(dayItems).forEach((menuId) => {
        const qty = dayItems[menuId] || 0;
        const price = allMenus[menuId]?.price || 0;
        total += qty * price;
      });
    });
    return total;
  },

  getTotalItemsCount: () => {
    const { cart, selectedDateKeys } = get();
    let count = 0;
    selectedDateKeys.forEach((dateKey) => {
      const dayItems = cart[dateKey] || {};
      Object.keys(dayItems).forEach((menuId) => {
        count += dayItems[menuId] || 0;
      });
    });
    return count;
  },

  buildOrderDays: () => {
    const { cart, selectedDateKeys } = get();
    return [...selectedDateKeys]
      .sort()
      .map((dateKey) => ({
        deliveryDate: dateKey,
        items: Object.entries(cart[dateKey] || {})
          .filter(([, qty]) => qty > 0)
          .map(([menuId, qty]) => ({ menuId, qty })),
      }))
      .filter((day) => day.items.length > 0);
  },
}));

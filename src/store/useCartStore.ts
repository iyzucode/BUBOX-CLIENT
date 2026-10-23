import { create } from 'zustand';
import { Menu } from '@/types/menu';

export type FulfillmentType = 'DELIVERY' | 'PICKUP';

export interface AppliedCoupon {
  code: string;
  discountAmount: number;
  description: string;
}

export interface CartStoreState {
  selectedDateKeys: string[];
  categoryQuantities: Record<string, number>;
  cart: Record<string, Record<string, number>>; // dateKey -> menuId -> quantity
  allMenus: Record<string, Menu>; // menuId -> Menu
  fulfillmentType: FulfillmentType;
  selectedAddressId: string | null;
  appliedCoupon: AppliedCoupon | null;

  // Actions
  setOrderData: (data: {
    selectedDateKeys: string[];
    categoryQuantities: Record<string, number>;
    cart: Record<string, Record<string, number>>;
    allMenus: Record<string, Menu>;
  }) => void;
  setFulfillmentType: (type: FulfillmentType) => void;
  setSelectedAddressId: (id: string | null) => void;
  applyCoupon: (code: string) => { success: boolean; message: string };
  removeCoupon: () => void;
  clearCart: () => void;

  // Computed helpers
  getSubtotal: () => number;
  getDeliveryFee: () => number;
  getDiscountAmount: () => number;
  getGrandTotal: () => number;
  getTotalItemsCount: () => number;
}

// Mock valid promo coupons for demonstration
const AVAILABLE_COUPONS: Record<string, { discountAmount: number; description: string }> = {
  LUANNAHEMAT: { discountAmount: 15000, description: 'Potongan Rp 15.000 Spesial Luanna' },
  MPASIBARU: { discountAmount: 20000, description: 'Diskon Pengguna Baru Rp 20.000' },
  BUBOX2026: { discountAmount: 10000, description: 'Promo Diskon Rp 10.000' },
};

export const useCartStore = create<CartStoreState>((set, get) => ({
  selectedDateKeys: [],
  categoryQuantities: {},
  cart: {},
  allMenus: {},
  fulfillmentType: 'DELIVERY',
  selectedAddressId: null,
  appliedCoupon: null,

  setOrderData: (data) =>
    set({
      selectedDateKeys: data.selectedDateKeys,
      categoryQuantities: data.categoryQuantities,
      cart: data.cart,
      allMenus: data.allMenus,
    }),

  setFulfillmentType: (type) => set({ fulfillmentType: type }),

  setSelectedAddressId: (id) => set({ selectedAddressId: id }),

  applyCoupon: (rawCode: string) => {
    const code = (rawCode || '').trim().toUpperCase();
    if (!code) {
      return { success: false, message: 'Silakan masukkan kode promo.' };
    }

    const coupon = AVAILABLE_COUPONS[code];
    if (coupon) {
      set({
        appliedCoupon: {
          code,
          discountAmount: coupon.discountAmount,
          description: coupon.description,
        },
      });
      return { success: true, message: `Kupon ${code} berhasil dipasang!` };
    }

    return {
      success: false,
      message: 'Kode promo tidak valid atau telah kedaluwarsa.',
    };
  },

  removeCoupon: () => set({ appliedCoupon: null }),

  clearCart: () =>
    set({
      selectedDateKeys: [],
      categoryQuantities: {},
      cart: {},
      allMenus: {},
      fulfillmentType: 'DELIVERY',
      selectedAddressId: null,
      appliedCoupon: null,
    }),

  getSubtotal: () => {
    const { cart, allMenus } = get();
    let total = 0;
    Object.keys(cart).forEach((dateKey) => {
      const dayItems = cart[dateKey] || {};
      Object.keys(dayItems).forEach((menuId) => {
        const qty = dayItems[menuId] || 0;
        const menu = allMenus[menuId];
        const price = menu?.price || 0;
        total += qty * price;
      });
    });
    return total;
  },

  getDeliveryFee: () => {
    // Free shipping (Rp 0) per user specification
    return 0;
  },

  getDiscountAmount: () => {
    const { appliedCoupon } = get();
    return appliedCoupon?.discountAmount || 0;
  },

  getGrandTotal: () => {
    const subtotal = get().getSubtotal();
    const deliveryFee = get().getDeliveryFee();
    const discount = get().getDiscountAmount();
    const grand = subtotal + deliveryFee - discount;
    return grand > 0 ? grand : 0;
  },

  getTotalItemsCount: () => {
    const { cart } = get();
    let count = 0;
    Object.keys(cart).forEach((dateKey) => {
      const dayItems = cart[dateKey] || {};
      Object.keys(dayItems).forEach((menuId) => {
        count += dayItems[menuId] || 0;
      });
    });
    return count;
  },
}));

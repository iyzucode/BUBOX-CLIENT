export type VoucherDiscountType = 'PERCENT' | 'FIXED';
export type VoucherPaymentMethod = 'QRIS' | 'CASH';

/** Voucher untuk pelanggan beserta kelayakan terhadap keranjang (GET /Voucher/GetAvailable, POST /Voucher/Check). */
export interface VoucherOption {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minSubtotal: number;
  paymentMethods: VoucherPaymentMethod[];
  endsAt: string;
  isEligible: boolean;
  ineligibleReason: string | null;
  estimatedDiscount: number;
}

export interface CheckVoucherRequest {
  code: string;
  subtotal: number;
  paymentMethod: VoucherPaymentMethod;
}

export interface VoucherAdmin {
  id: string;
  code: string;
  title: string;
  description: string | null;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minSubtotal: number;
  paymentMethods: VoucherPaymentMethod[];
  /** Kuota total pemakaian untuk semua pengguna; null = tanpa batas. */
  usageLimit: number | null;
  startsAt: string;
  endsAt: string;
  isListed: boolean;
  isActive: boolean;
  /** Jumlah pemakaian aktif (pesanan yang batal sebelum dibayar tidak dihitung). */
  redemptionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UpsertVoucherRequest {
  code: string;
  title: string;
  description: string | null;
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minSubtotal: number;
  paymentMethods: VoucherPaymentMethod[];
  /** Kuota total pemakaian; null = tanpa batas. */
  usageLimit: number | null;
  /** ISO 8601 dengan zona waktu, contoh 2026-11-30T23:59:00+07:00 */
  startsAt: string;
  endsAt: string;
  isListed: boolean;
  isActive: boolean;
}

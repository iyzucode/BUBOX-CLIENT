import type { ServiceFeeType } from '@/types/order';

export interface ChargeSettings {
  serviceFeeType: ServiceFeeType;
  serviceFeeValue: number;
  taxPercent: number;
}

export interface OrderChargeAmounts {
  serviceFee: number;
  /** Tarif bila biaya layanan berupa persen; null bila nominal tetap. */
  serviceFeePercent: number | null;
  taxAmount: number;
  taxPercent: number;
}

/**
 * ceil(amount × percent%) ke Rupiah penuh, memakai bilangan bulat (basis poin) agar hasil
 * seperti 100.000 × 11% tidak menjadi 11.000,0000001 lalu terbulatkan ke 11.001.
 */
function ceilPercent(amount: number, percent: number): number {
  const basisPoints = Math.round(percent * 100);
  if (basisPoints <= 0 || amount <= 0) return 0;
  return Math.floor((Math.round(amount) * basisPoints + 9999) / 10000);
}

/**
 * Biaya layanan & pajak (rumus sama dengan server, OrderCharges.cs):
 *   dasar = subtotal − diskon
 *   biaya layanan = ceil(dasar × %) atau nominal tetap
 *   pajak = ceil((dasar + biaya layanan) × %)
 */
export function computeOrderCharges(subtotalAfterDiscount: number, settings: ChargeSettings | null | undefined): OrderChargeAmounts {
  if (!settings) return { serviceFee: 0, serviceFeePercent: null, taxAmount: 0, taxPercent: 0 };
  const base = Math.max(0, subtotalAfterDiscount);
  const isPercent = settings.serviceFeeType === 'PERCENT';
  const serviceFee = isPercent ? ceilPercent(base, settings.serviceFeeValue) : Math.max(0, settings.serviceFeeValue);
  return {
    serviceFee,
    serviceFeePercent: isPercent ? settings.serviceFeeValue : null,
    taxAmount: ceilPercent(base + serviceFee, settings.taxPercent),
    taxPercent: settings.taxPercent,
  };
}

/** 2.5 → "2,5%". */
export const formatPercent = (value: number) =>
  `${value.toLocaleString('id-ID', { maximumFractionDigits: 2 })}%`;

/** Label baris biaya layanan, mis. "Biaya Layanan (2,5%)" atau "Biaya Layanan". */
export const serviceFeeLabel = (percent: number | null | undefined, label = 'Biaya Layanan') =>
  percent != null ? `${label} (${formatPercent(percent)})` : label;

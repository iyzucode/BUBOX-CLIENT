import { estimateVoucherDiscount } from '@/features/voucher/voucherUtils';
import { computeFulfillmentFee } from './fulfillmentFee';
import { computeOrderCharges } from './orderCharges';
import { useCartStore } from '@/store/useCartStore';
import { useOrderCutoffInfo } from './useOrders';

/**
 * Estimasi total checkout. Ongkir, biaya layanan & pajak dari setting server; potongan voucher dihitung
 * ulang dari isi keranjang saat ini. Total final tetap dihitung server.
 */
export function useCheckoutTotals() {
  const fulfillmentType = useCartStore((s) => s.fulfillmentType);
  const subtotal = useCartStore((s) => s.getSubtotal());
  // Jumlah hari kirim yang benar-benar berisi menu (dasar ongkir per hari)
  const dayCount = useCartStore((s) => s.buildOrderDays().length);
  const voucher = useCartStore((s) => s.selectedVoucher);
  const { data: cutoff } = useOrderCutoffInfo();

  const feeRule = fulfillmentType === 'DELIVERY' ? cutoff?.deliveryFeeRule : cutoff?.pickupFeeRule;
  const { fee: deliveryFee, note: deliveryFeeNote } = computeFulfillmentFee(feeRule, dayCount);
  const discount = voucher ? estimateVoucherDiscount(voucher, subtotal) : 0;
  // Keranjang berubah sehingga minimal pembelian tidak lagi terpenuhi
  const voucherBelowMinimum = !!voucher && subtotal < voucher.minSubtotal;
  const charges = computeOrderCharges(subtotal - discount, cutoff);

  return {
    subtotal,
    deliveryFee,
    deliveryFeeNote,
    discount,
    voucher,
    voucherBelowMinimum,
    ...charges,
    grandTotal: subtotal - discount + charges.serviceFee + charges.taxAmount + deliveryFee,
  };
}

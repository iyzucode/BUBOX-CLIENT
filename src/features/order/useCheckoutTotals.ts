import { estimateVoucherDiscount } from '@/features/voucher/voucherUtils';
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
  const voucher = useCartStore((s) => s.selectedVoucher);
  const { data: cutoff } = useOrderCutoffInfo();

  const deliveryFee = fulfillmentType === 'DELIVERY' ? cutoff?.deliveryFee ?? 0 : 0;
  const discount = voucher ? estimateVoucherDiscount(voucher, subtotal) : 0;
  // Keranjang berubah sehingga minimal pembelian tidak lagi terpenuhi
  const voucherBelowMinimum = !!voucher && subtotal < voucher.minSubtotal;
  const charges = computeOrderCharges(subtotal - discount, cutoff);

  return {
    subtotal,
    deliveryFee,
    discount,
    voucher,
    voucherBelowMinimum,
    ...charges,
    grandTotal: subtotal - discount + charges.serviceFee + charges.taxAmount + deliveryFee,
  };
}

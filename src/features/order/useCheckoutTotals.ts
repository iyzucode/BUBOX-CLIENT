import { useCartStore } from '@/store/useCartStore';
import { useOrderCutoffInfo } from './useOrders';

/** Estimasi total checkout. Ongkir dari setting server; total final tetap dihitung server. */
export function useCheckoutTotals() {
  const fulfillmentType = useCartStore((s) => s.fulfillmentType);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const { data: cutoff } = useOrderCutoffInfo();

  const deliveryFee = fulfillmentType === 'DELIVERY' ? cutoff?.deliveryFee ?? 0 : 0;

  return {
    subtotal,
    deliveryFee,
    grandTotal: subtotal + deliveryFee,
  };
}

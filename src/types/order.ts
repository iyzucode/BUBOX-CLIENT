import type { OutletSnapshot } from '@/types/outlet';
import type { AssignmentSource } from '@/types/delivery';

// Kontrak API modul Order (lihat Server/docs/ORDER_FLOW_PLANNING.md)

export type FulfillmentType = 'DELIVERY' | 'PICKUP';

export type OrderStatusCode =
  | 'AWAITING_PAYMENT'
  | 'PAID'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED_BY_CUSTOMER'
  | 'CANCELLED_BY_ADMIN'
  | 'EXPIRED'
  | 'PAYMENT_FAILED';

export type OrderDayStatusCode =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'PREPARING'
  | 'READY'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'PICKED_UP'
  | 'CANCELLED'
  | 'CANCELLED_BY_ADMIN';

// ---------- Request ----------

export interface CreateOrderItemRequest {
  menuId: string;
  qty: number;
}

export interface CreateOrderDayRequest {
  deliveryDate: string; // yyyy-MM-dd
  items: CreateOrderItemRequest[];
}

export interface CreateOrderRequest {
  fulfillmentType: FulfillmentType;
  addressId?: string | null;
  notes?: string | null;
  days: CreateOrderDayRequest[];
  /** Opsional; syarat & potongan dicek ulang server. */
  voucherCode?: string | null;
  /** Wajib untuk PICKUP: outlet tempat ambil. */
  outletId?: string | null;
  /** Total yang dilihat customer; bila berbeda dengan hitungan server → error PRICE_CHANGED + OrderPrice. */
  expectedGrandTotal?: number | null;
}

/** Rincian harga terbaru dari server (data pada error PRICE_CHANGED). */
export interface OrderPrice {
  subtotal: number;
  discountAmount: number;
  deliveryFee: number;
  deliveryFeeNote: string | null;
  serviceFee: number;
  serviceFeePercent: number | null;
  taxAmount: number;
  taxPercent: number;
  grandTotal: number;
}

export interface UpdateDayStatusRequest {
  statusCode: OrderDayStatusCode;
}

export interface AdminCancelRequest {
  reason: string;
}

export interface OrderSearchParams {
  status?: OrderStatusCode;
  deliveryDate?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

// ---------- Response ----------

export interface QrisPayment {
  qrString: string | null;
  qrUrl: string | null;
  acquirer: string | null;
  transactionStatus: string;
  grossAmount: number;
  expiresAt: string | null;
  paidAt: string | null;
}

/** GET /Order/GetPaymentStatus: status saja, untuk polling halaman QRIS. */
export interface OrderPaymentStatus {
  orderId: string;
  statusCode: OrderStatusCode;
  paymentDueAt: string;
  paidAt: string | null;
  cancelReason: string | null;
}

export interface CreateOrderResponse {
  orderId: string;
  orderNumber: string;
  statusCode: OrderStatusCode;
  grandTotal: number;
  paymentDueAt: string;
  payment: QrisPayment;
}

export interface AddressSnapshot {
  addressId: string;
  label: string;
  recipientName: string;
  phoneNumber: string;
  fullAddress: string;
  subdistrict: string;
  city: string;
  province: string;
  postalCode: string;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
}

export interface OrderSummary {
  id: string;
  orderNumber: string;
  statusCode: OrderStatusCode;
  fulfillmentType: FulfillmentType;
  grandTotal: number;
  daysCount: number;
  firstDeliveryDate: string | null;
  lastDeliveryDate: string | null;
  paymentDueAt: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  deliveryDates: string[]; // yyyy-MM-dd, urut naik
  itemLinesCount: number; // jumlah baris item (menu × hari)
  firstMenuId: string | null;
  firstMenuName: string | null;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
}

export interface OrderItem {
  id: string;
  menuId: string;
  menuName: string;
  categoryCode: string;
  categoryName: string;
  unitPrice: number;
  qty: number;
  lineTotal: number;
  /** Path gambar menu (berversi), null bila menu tanpa gambar. */
  imageUrl: string | null;
}

export interface OrderDay {
  id: string;
  deliveryDate: string;
  dayOfWeek: number;
  dayName: string;
  statusCode: OrderDayStatusCode;
  daySubtotal: number;
  requiresManualRefund: boolean;
  cancelReason: string | null;
  cancelledAt: string | null;
  items: OrderItem[];
}

export interface OrderStatusHistory {
  scope: 'ORDER' | 'DAY';
  entityId: string;
  fromCode: string | null;
  toCode: string;
  actorRole: string;
  reason: string | null;
  createdAt: string;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  userId: string;
  statusCode: OrderStatusCode;
  fulfillmentType: FulfillmentType;
  address: AddressSnapshot | null;
  notes: string | null;
  subtotal: number;
  discountAmount: number;
  voucherCode: string | null;
  deliveryFee: number;
  grandTotal: number;
  paymentDueAt: string;
  paidAt: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  payment: QrisPayment | null;
  days: OrderDay[];
  histories: OrderStatusHistory[];
  /** PICKUP: outlet tempat ambil (null pada pesanan lama sebelum ada outlet). */
  outlet?: OutletSnapshot | null;
  /** Biaya layanan & pajak (0 pada pesanan lama). serviceFeePercent null = nominal tetap. */
  serviceFee: number;
  serviceFeePercent: number | null;
  taxAmount: number;
  taxPercent: number;
  /** Keterangan ongkir, mis. "10 hari × Rp 1.500" (null bila gratis / nominal tetap). */
  deliveryFeeNote?: string | null;
}

export interface DailyOrderDay {
  orderDayId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  fulfillmentType: FulfillmentType;
  statusCode: OrderDayStatusCode;
  address: AddressSnapshot | null;
  notes: string | null;
  items: OrderItem[];
  /** Pengantaran (DELIVERY saja): zona & driver efektif. */
  zoneName?: string | null;
  driverUserId?: string | null;
  driverName?: string | null;
  assignmentSource?: AssignmentSource | null;
  /** Pengambilan (PICKUP saja): outlet tempat ambil. */
  outlet?: OutletSnapshot | null;
}

export interface DailyDeliveries {
  date: string;
  deliveries: DailyOrderDay[];
}

export interface ProductionMenuSummary {
  menuId: string;
  menuName: string;
  categoryName: string;
  totalQty: number;
}

export interface DailyProduction {
  date: string;
  totalOrders: number;
  totalPortions: number;
  menus: ProductionMenuSummary[];
  orders: DailyOrderDay[];
}

// ---------- Settings ----------

/** PERCENT = persen dari subtotal − diskon; FIXED = Rupiah per pesanan. */
export type ServiceFeeType = 'PERCENT' | 'FIXED';

/** FREE = gratis; FIXED = Rupiah per pesanan; PER_DAY = jumlah hari × tarif tingkat. */
export type FulfillmentFeeMode = 'FREE' | 'FIXED' | 'PER_DAY';

/** Tingkat tarif per hari: berlaku mulai minDays hari kirim dalam satu pesanan. */
export interface FeeTier {
  minDays: number;
  perDay: number;
}

/** Aturan ongkir satu metode pemesanan. */
export interface FulfillmentFeeRule {
  mode: FulfillmentFeeMode;
  /** Untuk FIXED. */
  amount: number;
  /** Untuk PER_DAY, urut dari minDays terkecil. */
  tiers: FeeTier[];
}

export interface OrderSettings {
  cutoffDaysBefore: number;
  cutoffTime: string; // HH:mm
  timeZone: string;
  paymentTimeoutMinutes: number;
  /** Aturan ongkir Pesan Antar. */
  deliveryFeeRule: FulfillmentFeeRule;
  /** Aturan biaya Ambil Sendiri. */
  pickupFeeRule: FulfillmentFeeRule;
  serviceFeeType: ServiceFeeType;
  /** Persen atau Rupiah, sesuai serviceFeeType. */
  serviceFeeValue: number;
  /** Pajak (persen) dari subtotal − diskon + biaya layanan. */
  taxPercent: number;
  updatedAt: string | null;
}

export type UpdateOrderSettingsRequest = Omit<OrderSettings, 'updatedAt'>;

export interface OrderCutoffInfo {
  cutoffDaysBefore: number;
  cutoffTime: string;
  timeZone: string;
  serverTimeUtc: string;
  earliestDeliveryDate: string;
  latestDeliveryDate: string;
  deliveryFeeRule: FulfillmentFeeRule;
  pickupFeeRule: FulfillmentFeeRule;
  serviceFeeType: ServiceFeeType;
  serviceFeeValue: number;
  taxPercent: number;
}

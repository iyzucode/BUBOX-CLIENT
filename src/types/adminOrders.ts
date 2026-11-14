import type { FulfillmentType, OrderDayStatusCode, OrderDetail, OrderStatusCode, ProductionMenuSummary } from '@/types/order';

/** Layar admin Pesanan: tampilan per hari kirim atau per pesanan. */
export type BoardView = 'days' | 'orders';
/** Acuan tanggal periode: tanggal kirim atau tanggal pesan. */
export type DateBasis = 'DELIVERY' | 'CREATED';

export type DayTab =
  | 'ALL' | 'AWAITING_PAYMENT' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'OUT_FOR_DELIVERY' | 'DONE' | 'CANCELLED' | 'ATTENTION';
export type OrderTab = 'ALL' | 'AWAITING_PAYMENT' | 'PAID' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'ATTENTION';

/** Parameter GET /OrderAdmin/SearchDays & SearchOrders. Daftar multi-nilai dipisah koma; "NONE" = belum ada. */
export interface AdminBoardParams {
  dateBasis: DateBasis;
  dateFrom: string; // yyyy-MM-dd
  dateTo: string;
  q?: string;
  fulfillment?: string;
  zoneIds?: string;
  driverIds?: string;
  outletIds?: string;
  categoryCodes?: string;
  payments?: string;
  vouchers?: string;
  refunds?: string;
  menuId?: string;
  tab: string;
  sort?: string;
  page: number;
  pageSize: number;
}

export interface FacetOption {
  id: string;
  label: string;
  count: number;
}

export interface AdminFacets {
  deliveryCount: number;
  pickupCount: number;
  zones: FacetOption[];
  drivers: FacetOption[];
  outlets: FacetOption[];
  categories: FacetOption[];
  payments: FacetOption[];
  vouchers: FacetOption[];
  refunds: FacetOption[];
}

/** Status bayar per pesanan (kolom & filter). */
export type PaymentStatus = 'PAID' | 'AWAITING' | 'REVIEW' | 'EXPIRED' | 'FAILED' | 'CANCELLED';

export interface AdminBoardSummary {
  rows: number;
  orders: number;
  portions: number;
  paidRevenue: number;
  awaitingPayment: number;
  needsAttention: number;
}

export interface AdminDayRow {
  orderDayId: string;
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string | null;
  deliveryDate: string;
  dayIndex: number;
  dayCount: number;
  dayStatus: OrderDayStatusCode;
  orderStatus: OrderStatusCode;
  fulfillmentType: FulfillmentType;
  dayUpdatedAt: string;
  orderCreatedAt: string;
  firstMenuName: string | null;
  menuCount: number;
  portions: number;
  notes: string | null;
  recipientName: string | null;
  recipientPhone: string | null;
  addressLine: string | null;
  zoneId: string | null;
  zoneName: string | null;
  driverUserId: string | null;
  driverName: string | null;
  assignmentSource: string | null;
  outletId: string | null;
  outletName: string | null;
  pickupHours: string | null;
  paymentDueAt: string;
  paidAt: string | null;
  paymentNeedsReview: boolean;
  paymentStatus: PaymentStatus;
  voucherCode: string | null;
  /** Dibatalkan setelah dibayar (perlu / pernah direfund manual). */
  requiresManualRefund: boolean;
  /** Refund manual belum ditandai selesai. */
  refundPending: boolean;
  daySubtotal: number;
  refundedAt: string | null;
  needsDriver: boolean;
  needsAttention: boolean;
}

export interface AdminOrderRow {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string | null;
  createdAt: string;
  orderStatus: OrderStatusCode;
  fulfillmentType: FulfillmentType;
  zoneName: string | null;
  outletName: string | null;
  firstDeliveryDate: string;
  lastDeliveryDate: string;
  dayCount: number;
  doneDays: number;
  cancelledDays: number;
  portions: number;
  grandTotal: number;
  paymentDueAt: string;
  paidAt: string | null;
  paymentNeedsReview: boolean;
  paymentStatus: PaymentStatus;
  voucherCode: string | null;
  refundPendingDays: number;
  refundPendingAmount: number;
  refundedDays: number;
  needsDriverDays: number;
  needsAttention: boolean;
}

export interface AdminBoardResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  tabCounts: Record<string, number>;
  facets: AdminFacets;
  summary: AdminBoardSummary;
  production: ProductionMenuSummary[];
}

export interface AdminDayAssignment {
  orderDayId: string;
  zoneName: string | null;
  driverUserId: string | null;
  driverName: string | null;
  assignmentSource: string | null;
  refundedAt: string | null;
  refundedByName: string | null;
  refundNote: string | null;
}

export interface AdminOrderDetail {
  order: OrderDetail;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  paymentNeedsReview: boolean;
  paymentReviewNote: string | null;
  assignments: AdminDayAssignment[];
}

export interface BulkActionFailure {
  orderDayId: string;
  orderNumber: string | null;
  message: string;
}

export interface BulkActionResult {
  succeeded: number;
  failed: BulkActionFailure[];
}

export interface KitchenSheetItem {
  menuName: string;
  categoryName: string;
  qty: number;
}

export interface KitchenSheetDay {
  orderDayId: string;
  deliveryDate: string;
  orderNumber: string;
  dayIndex: number;
  dayCount: number;
  customerName: string;
  fulfillmentType: FulfillmentType;
  recipientName: string | null;
  recipientPhone: string | null;
  addressLine: string | null;
  zoneName: string | null;
  driverName: string | null;
  outletName: string | null;
  pickupHours: string | null;
  notes: string | null;
  dayStatus: OrderDayStatusCode;
  portions: number;
  items: KitchenSheetItem[];
}

export interface KitchenSheet {
  dateFrom: string;
  dateTo: string;
  generatedAt: string;
  portions: number;
  menus: ProductionMenuSummary[];
  dates: { deliveryDate: string; portions: number; menus: ProductionMenuSummary[] }[];
  days: KitchenSheetDay[];
}

export interface BoardActivity {
  newOrders: number;
  newlyPaid: number;
  latestAt: string | null;
  serverTime: string;
}

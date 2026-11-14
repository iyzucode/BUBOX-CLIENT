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
}

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
  requiresManualRefund: boolean;
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
  refundPendingDays: number;
  refundPendingAmount: number;
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

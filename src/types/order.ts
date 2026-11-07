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

export interface OrderSettings {
  cutoffDaysBefore: number;
  cutoffTime: string; // HH:mm
  timeZone: string;
  paymentTimeoutMinutes: number;
  deliveryFee: number;
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
  deliveryFee: number;
}

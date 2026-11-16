import type { OrderDayStatusCode } from '@/types/order';

export type KitchenGroupKind = 'OUTLET' | 'ZONE';

export interface KitchenReleaseInfo {
  releasedAt: string;
  releasedByName: string | null;
  dayCount: number;
  portions: number;
}

export interface KitchenRecapMenu {
  menuId: string;
  menuName: string;
  categoryName: string;
  qty: number;
}

/** Hal yang perlu diperiksa admin sebelum rilis. orderDayId hanya untuk hari tanpa driver. */
export interface KitchenIssue {
  orderId: string;
  orderDayId: string | null;
  orderNumber: string;
  name: string;
  detail: string | null;
}

export interface KitchenGroupSummary {
  key: string;
  kind: KitchenGroupKind;
  name: string;
  subtitle: string | null;
  packages: number;
  portions: number;
}

/** GET /Kitchen/GetValidation */
export interface KitchenValidation {
  date: string;
  release: KitchenReleaseInfo | null;
  cutoffAt: string;
  cutoffPassed: boolean;
  paymentClosesAt: string;
  awaitingPayment: KitchenIssue[];
  needsDriver: KitchenIssue[];
  paymentReview: KitchenIssue[];
  canRelease: boolean;
  blockers: string[];
  packages: number;
  portions: number;
  recap: KitchenRecapMenu[];
  groups: KitchenGroupSummary[];
}

export interface KitchenItem {
  menuName: string;
  categoryName: string;
  qty: number;
}

export interface KitchenPackage {
  orderDayId: string;
  orderNumber: string;
  recipientName: string;
  items: KitchenItem[];
  notes: string | null;
  dayStatus: OrderDayStatusCode;
  isReady: boolean;
  /** Dibatalkan admin setelah dirilis: jangan dikemas. */
  cancelledAfterRelease: boolean;
}

export interface KitchenGroup {
  key: string;
  kind: KitchenGroupKind;
  name: string;
  subtitle: string | null;
  packages: number;
  readyPackages: number;
  portions: number;
  recap: KitchenRecapMenu[];
  items: KitchenPackage[];
}

/** GET /Kitchen/GetBoard — released = false bila admin belum merilis tanggal ini. */
export interface KitchenBoard {
  date: string;
  released: boolean;
  release: KitchenReleaseInfo | null;
  packages: number;
  readyPackages: number;
  portions: number;
  recap: KitchenRecapMenu[];
  groups: KitchenGroup[];
}

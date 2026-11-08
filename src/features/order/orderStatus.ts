import { OrderDayStatusCode, OrderStatusCode } from '@/types/order';

export type StatusTone = 'warning' | 'info' | 'success' | 'danger' | 'neutral';

interface StatusMeta {
  label: string;
  icon: string;
  tone: StatusTone;
}

export const ORDER_STATUS_META: Record<OrderStatusCode, StatusMeta> = {
  AWAITING_PAYMENT: { label: 'Belum Bayar', icon: '⏳', tone: 'warning' },
  PAID: { label: 'Dibayar', icon: '✓', tone: 'info' },
  IN_PROGRESS: { label: 'Diproses', icon: '🍲', tone: 'info' },
  COMPLETED: { label: 'Selesai', icon: '✓', tone: 'success' },
  CANCELLED_BY_CUSTOMER: { label: 'Dibatalkan', icon: '✕', tone: 'neutral' },
  CANCELLED_BY_ADMIN: { label: 'Dibatalkan Admin', icon: '✕', tone: 'danger' },
  EXPIRED: { label: 'Kedaluwarsa', icon: '⌛', tone: 'neutral' },
  PAYMENT_FAILED: { label: 'Gagal Bayar', icon: '✕', tone: 'danger' },
};

export const DAY_STATUS_META: Record<OrderDayStatusCode, StatusMeta> = {
  SCHEDULED: { label: 'Terjadwal', icon: '🗓️', tone: 'neutral' },
  CONFIRMED: { label: 'Terkonfirmasi', icon: '✓', tone: 'info' },
  PREPARING: { label: 'Dimasak', icon: '🍳', tone: 'warning' },
  READY: { label: 'Siap', icon: '📦', tone: 'info' },
  OUT_FOR_DELIVERY: { label: 'Diantar', icon: '🛵', tone: 'warning' },
  DELIVERED: { label: 'Terkirim', icon: '✓', tone: 'success' },
  PICKED_UP: { label: 'Diambil', icon: '✓', tone: 'success' },
  CANCELLED: { label: 'Dibatalkan', icon: '✕', tone: 'neutral' },
  CANCELLED_BY_ADMIN: { label: 'Force Majeure', icon: '⚠', tone: 'danger' },
};

export const ACTIVE_ORDER_STATUSES: OrderStatusCode[] = ['PAID', 'IN_PROGRESS'];
export const CANCELLED_ORDER_STATUSES: OrderStatusCode[] = [
  'CANCELLED_BY_CUSTOMER',
  'CANCELLED_BY_ADMIN',
  'EXPIRED',
  'PAYMENT_FAILED',
];

/** Status berikutnya yang bisa di-set staf dari layar operasional (sesuai rf_order_status_transitions). */
export function nextDayStatus(
  current: OrderDayStatusCode,
  fulfillmentType: 'DELIVERY' | 'PICKUP'
): OrderDayStatusCode | null {
  switch (current) {
    case 'CONFIRMED':
      return 'PREPARING';
    case 'PREPARING':
      return 'READY';
    case 'READY':
      return fulfillmentType === 'DELIVERY' ? 'OUT_FOR_DELIVERY' : 'PICKED_UP';
    case 'OUT_FOR_DELIVERY':
      return 'DELIVERED';
    default:
      return null;
  }
}

export const ADMIN_CANCELLABLE_DAY_STATUSES: OrderDayStatusCode[] = [
  'CONFIRMED',
  'PREPARING',
  'READY',
  'OUT_FOR_DELIVERY',
];

export function toneColors(tone: StatusTone, isDark: boolean): { bg: string; text: string } {
  switch (tone) {
    case 'warning':
      return isDark ? { bg: '#3B2A0B', text: '#FBBF24' } : { bg: '#FEF3C7', text: '#92400E' };
    case 'info':
      return isDark ? { bg: '#0B2A3B', text: '#38BDF8' } : { bg: '#E0F2FE', text: '#075985' };
    case 'success':
      return isDark ? { bg: '#0B3B24', text: '#34D399' } : { bg: '#D1FAE5', text: '#065F46' };
    case 'danger':
      return isDark ? { bg: '#3B0B0B', text: '#F87171' } : { bg: '#FEE2E2', text: '#991B1B' };
    default:
      return isDark ? { bg: '#1E293B', text: '#94A3B8' } : { bg: '#F1F5F9', text: '#475569' };
  }
}

export function formatRupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const SHORT_DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

/** "2026-11-06" → "Jum, 6 Nov" */
export function formatShortDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${SHORT_DAYS[date.getDay()]}, ${d} ${SHORT_MONTHS[m - 1]}`;
}

const LONG_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const LONG_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

/** "2026-11-06" → "Jumat, 6 November 2026" */
export function formatLongDate(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${LONG_DAYS[date.getDay()]}, ${d} ${LONG_MONTHS[m - 1]} ${y}`;
}

/** Rentang tanggal kirim ringkas: "6 – 8 Nov" atau "6 Nov" */
export function formatDateRange(first: string | null, last: string | null): string {
  if (!first) return '-';
  const [, m1, d1] = first.split('-').map(Number);
  if (!last || last === first) return `${d1} ${SHORT_MONTHS[m1 - 1]}`;
  const [, m2, d2] = last.split('-').map(Number);
  return m1 === m2
    ? `${d1} – ${d2} ${SHORT_MONTHS[m2 - 1]}`
    : `${d1} ${SHORT_MONTHS[m1 - 1]} – ${d2} ${SHORT_MONTHS[m2 - 1]}`;
}

/** ISO UTC → "6 Nov, 14.05" (waktu lokal perangkat) */
export function formatDateTime(iso: string | null): string {
  if (!iso) return '-';
  const date = new Date(iso);
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${date.getDate()} ${SHORT_MONTHS[date.getMonth()]}, ${hh}.${mm}`;
}

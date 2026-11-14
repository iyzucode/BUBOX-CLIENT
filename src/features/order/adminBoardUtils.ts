import { toDateKey } from '@/features/order/dateUtils';
import { formatRupiah } from '@/features/order/orderStatus';
import type { StatusTone } from '@/features/order/orderStatus';
import type { AdminDayRow, AdminOrderRow, DayTab, OrderTab } from '@/types/adminOrders';
import type { OrderDayStatusCode } from '@/types/order';

export const DAY_TABS: { id: DayTab; label: string }[] = [
  { id: 'ALL', label: 'Semua' },
  { id: 'AWAITING_PAYMENT', label: 'Menunggu Bayar' },
  { id: 'CONFIRMED', label: 'Dikonfirmasi' },
  { id: 'PREPARING', label: 'Disiapkan' },
  { id: 'READY', label: 'Siap' },
  { id: 'OUT_FOR_DELIVERY', label: 'Dibawa Kurir' },
  { id: 'DONE', label: 'Selesai' },
  { id: 'CANCELLED', label: 'Dibatalkan' },
  { id: 'ATTENTION', label: 'Perlu Tindakan' },
];

export const ORDER_TABS: { id: OrderTab; label: string }[] = [
  { id: 'ALL', label: 'Semua' },
  { id: 'AWAITING_PAYMENT', label: 'Menunggu Bayar' },
  { id: 'PAID', label: 'Dibayar' },
  { id: 'IN_PROGRESS', label: 'Diproses' },
  { id: 'COMPLETED', label: 'Selesai' },
  { id: 'CANCELLED', label: 'Dibatalkan' },
  { id: 'ATTENTION', label: 'Perlu Tindakan' },
];

export const DAY_SORTS = [
  { id: 'DATE_ASC', label: 'Tanggal kirim terdekat' },
  { id: 'DATE_DESC', label: 'Tanggal kirim terjauh' },
  { id: 'NEWEST', label: 'Pesanan terbaru' },
  { id: 'CUSTOMER', label: 'Nama pelanggan (A-Z)' },
];

export const ORDER_SORTS = [
  { id: 'NEWEST', label: 'Pesanan terbaru' },
  { id: 'OLDEST', label: 'Pesanan terlama' },
  { id: 'DATE_ASC', label: 'Tanggal kirim terdekat' },
  { id: 'TOTAL_DESC', label: 'Total terbesar' },
];

export const PAGE_SIZES = [10, 20, 50, 100];

/** Label tombol aksi utama untuk status hari berikutnya. */
export const NEXT_DAY_ACTION: Partial<Record<OrderDayStatusCode, string>> = {
  PREPARING: 'Siapkan',
  READY: 'Tandai Siap',
  OUT_FOR_DELIVERY: 'Berangkatkan',
  DELIVERED: 'Tandai Diterima',
  PICKED_UP: 'Sudah Diambil',
};

/** ISO → "10.30" (jam lokal). */
export function formatTime(iso: string | null | undefined): string {
  if (!iso) return '-';
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}.${String(d.getMinutes()).padStart(2, '0')}`;
}

export function addDaysKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  return toDateKey(new Date(y, m - 1, d + days));
}

export function daysBetween(fromKey: string, toKey: string): number {
  const [y1, m1, d1] = fromKey.split('-').map(Number);
  const [y2, m2, d2] = toKey.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

/** 6 karakter terakhir nomor pesanan (BBX-20261114-HCDCML → HCDCML) untuk tampilan ringkas. */
export const shortOrderNumber = (orderNumber: string) => orderNumber.split('-').pop() ?? orderNumber;

export interface StatusNote {
  text: string;
  tone: StatusTone;
}

/** Keterangan di bawah status harian, mis. "Belum ada driver" / "Batas bayar 10.30". */
export function dayStatusNote(row: AdminDayRow): StatusNote | null {
  if (row.requiresManualRefund) return { text: 'Refund manual tertunda', tone: 'danger' };
  if (row.paymentNeedsReview) return { text: 'Pembayaran perlu ditinjau', tone: 'warning' };
  if (row.orderStatus === 'AWAITING_PAYMENT') return { text: `Batas bayar ${formatTime(row.paymentDueAt)}`, tone: 'warning' };
  if (row.needsDriver) return { text: 'Belum ada driver', tone: 'warning' };
  switch (row.dayStatus) {
    case 'CONFIRMED':
      return { text: 'Menunggu disiapkan', tone: 'neutral' };
    case 'PREPARING':
      return { text: 'Dapur menyiapkan', tone: 'neutral' };
    case 'READY':
      return { text: row.fulfillmentType === 'PICKUP' ? 'Menunggu diambil' : 'Menunggu berangkat', tone: 'neutral' };
    case 'OUT_FOR_DELIVERY':
      return { text: `Berangkat ${formatTime(row.dayUpdatedAt)}`, tone: 'neutral' };
    case 'DELIVERED':
      return { text: `Diterima ${formatTime(row.dayUpdatedAt)}`, tone: 'success' };
    case 'PICKED_UP':
      return { text: `Diambil ${formatTime(row.dayUpdatedAt)}`, tone: 'success' };
    default:
      return null;
  }
}

/** Ringkasan pembayaran per pesanan (QRIS, dibayar penuh). */
export function paymentSummary(row: AdminOrderRow): { title: string; note: string; tone: StatusTone } {
  if (row.paymentNeedsReview) return { title: 'Perlu ditinjau', note: 'Nominal QRIS tidak cocok', tone: 'warning' };
  if (row.refundPendingDays > 0) {
    return { title: 'Refund manual', note: `${formatRupiah(row.refundPendingAmount)} tertunda`, tone: 'danger' };
  }
  switch (row.orderStatus) {
    case 'AWAITING_PAYMENT':
      return { title: 'Menunggu bayar', note: `Batas ${formatTime(row.paymentDueAt)}`, tone: 'warning' };
    case 'EXPIRED':
      return { title: 'Kedaluwarsa', note: 'Tidak dibayar', tone: 'neutral' };
    case 'PAYMENT_FAILED':
      return { title: 'Gagal', note: 'Pembayaran gagal', tone: 'danger' };
    default:
      return row.paidAt
        ? { title: 'Lunas', note: `QRIS · ${formatTime(row.paidAt)}`, tone: 'success' }
        : { title: 'Dibatalkan', note: 'Belum dibayar', tone: 'neutral' };
  }
}

/** Tindakan utama baris per pesanan. */
export function orderAction(row: AdminOrderRow): { label: string; emphasis: boolean } {
  if (row.paymentNeedsReview) return { label: 'Tinjau bayar', emphasis: true };
  if (row.refundPendingDays > 0) return { label: 'Lihat refund', emphasis: true };
  if (row.needsDriverDays > 0) return { label: 'Atur driver', emphasis: true };
  return { label: 'Lihat pesanan', emphasis: false };
}

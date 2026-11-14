import { toDateKey } from '@/features/order/dateUtils';
import { formatRupiah, nextDayStatus } from '@/features/order/orderStatus';
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
  if (row.refundPending) return { text: `Refund ${formatRupiah(row.daySubtotal)} tertunda`, tone: 'danger' };
  if (row.requiresManualRefund && row.refundedAt) return { text: `Direfund ${formatShortDateTime(row.refundedAt)}`, tone: 'success' };
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
      if (!row.paidAt) return { title: 'Dibatalkan', note: 'Belum dibayar', tone: 'neutral' };
      return {
        title: 'Lunas',
        note: [
          `QRIS · ${formatTime(row.paidAt)}`,
          row.voucherCode ? `🎟 ${row.voucherCode}` : null,
          row.refundedDays > 0 ? `${row.refundedDays} hari direfund` : null,
        ].filter(Boolean).join(' · '),
        tone: 'success',
      };
  }
}

/** "14 Nov 10.30" (jam lokal). */
export function formatShortDateTime(iso: string): string {
  const d = new Date(iso);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${d.getDate()} ${months[d.getMonth()]} ${formatTime(iso)}`;
}

// ==========================================
// Aksi massal
// ==========================================

/** Status hari yang drivernya masih boleh diatur (belum berangkat). */
const DRIVER_EDITABLE: OrderDayStatusCode[] = ['SCHEDULED', 'CONFIRMED', 'PREPARING', 'READY'];
/** Status hari yang boleh dibatalkan admin (force majeure). */
const ADMIN_CANCELLABLE: OrderDayStatusCode[] = ['CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'];

export interface BulkTargets {
  /** Per status tujuan: hari yang bisa dimajukan ke status itu. */
  advance: { status: OrderDayStatusCode; label: string; ids: string[] }[];
  /** Hari yang mau berangkat tapi belum punya driver (dilewati). */
  blockedNoDriver: number;
  driver: string[];
  refund: string[];
  cancel: string[];
}

/** Kelompokkan baris terpilih menurut aksi yang berlaku, agar tiap tombol hanya mengirim hari yang valid. */
export function bulkTargets(rows: AdminDayRow[]): BulkTargets {
  const advance = new Map<OrderDayStatusCode, string[]>();
  let blockedNoDriver = 0;
  for (const row of rows) {
    if (row.orderStatus === 'AWAITING_PAYMENT') continue;
    const next = nextDayStatus(row.dayStatus, row.fulfillmentType);
    if (!next) continue;
    if (next === 'OUT_FOR_DELIVERY' && !row.driverUserId) {
      blockedNoDriver++;
      continue;
    }
    advance.set(next, [...(advance.get(next) ?? []), row.orderDayId]);
  }

  return {
    advance: [...advance.entries()].map(([status, ids]) => ({ status, label: NEXT_DAY_ACTION[status] ?? status, ids })),
    blockedNoDriver,
    driver: rows.filter((r) => r.fulfillmentType === 'DELIVERY' && DRIVER_EDITABLE.includes(r.dayStatus)).map((r) => r.orderDayId),
    refund: rows.filter((r) => r.refundPending).map((r) => r.orderDayId),
    cancel: rows
      .filter((r) => r.orderStatus !== 'AWAITING_PAYMENT' && ADMIN_CANCELLABLE.includes(r.dayStatus))
      .map((r) => r.orderDayId),
  };
}

/** Pesan hasil aksi massal: jumlah berhasil + daftar yang gagal (maks 5). */
export function bulkResultMessage(succeeded: number, failed: { orderNumber: string | null; message: string }[], doneText: string) {
  const lines = [`${succeeded} hari kirim ${doneText}.`];
  if (failed.length > 0) {
    lines.push('', `${failed.length} gagal:`);
    failed.slice(0, 5).forEach((f) => lines.push(`• ${f.orderNumber ? shortOrderNumber(f.orderNumber) : '-'}: ${f.message}`));
    if (failed.length > 5) lines.push(`• …dan ${failed.length - 5} lainnya`);
  }
  return lines.join('\n');
}

/** Tindakan utama baris per pesanan. */
export function orderAction(row: AdminOrderRow): { label: string; emphasis: boolean } {
  if (row.paymentNeedsReview) return { label: 'Tinjau bayar', emphasis: true };
  if (row.refundPendingDays > 0) return { label: 'Lihat refund', emphasis: true };
  if (row.needsDriverDays > 0) return { label: 'Atur driver', emphasis: true };
  return { label: 'Lihat pesanan', emphasis: false };
}

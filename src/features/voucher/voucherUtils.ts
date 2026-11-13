import { VoucherDiscountType, VoucherPaymentMethod } from '@/types/voucher';

interface VoucherRule {
  discountType: VoucherDiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minSubtotal: number;
}

/**
 * Perkiraan potongan di client (sama dengan VoucherPricing di server) agar total checkout ikut
 * berubah saat isi keranjang berubah. Nilai final selalu dihitung server saat CreateOrder.
 */
export function estimateVoucherDiscount(voucher: VoucherRule, subtotal: number): number {
  if (subtotal <= 0 || subtotal < voucher.minSubtotal) return 0;
  let discount =
    voucher.discountType === 'PERCENT' ? (subtotal * voucher.discountValue) / 100 : voucher.discountValue;
  if (voucher.maxDiscount != null) discount = Math.min(discount, voucher.maxDiscount);
  return Math.max(0, Math.floor(Math.min(discount, subtotal)));
}

/** "Rp50RB", "Rp1,5JT" untuk judul voucher. */
export function formatRupiahShort(amount: number): string {
  if (amount >= 1_000_000) {
    const jt = amount / 1_000_000;
    return `Rp${Number.isInteger(jt) ? jt : jt.toFixed(1).replace('.', ',')}JT`;
  }
  if (amount >= 1_000) {
    const rb = amount / 1_000;
    return `Rp${Number.isInteger(rb) ? rb : rb.toFixed(1).replace('.', ',')}RB`;
  }
  return `Rp${amount}`;
}

/** Judul besar kartu: "Diskon 10% s.d. Rp50RB" atau "Diskon 30RB". */
export function voucherHeadline(voucher: VoucherRule): string {
  if (voucher.discountType === 'PERCENT') {
    const pct = Number.isInteger(voucher.discountValue)
      ? voucher.discountValue
      : voucher.discountValue.toFixed(1).replace('.', ',');
    return voucher.maxDiscount != null
      ? `Diskon ${pct}% s.d. ${formatRupiahShort(voucher.maxDiscount)}`
      : `Diskon ${pct}%`;
  }
  return `Diskon ${formatRupiahShort(voucher.discountValue).replace(/^Rp/, '')}`;
}

/** "Minimal pembelian Rp200RB" */
export function voucherMinimumLabel(minSubtotal: number): string {
  return minSubtotal > 0 ? `Minimal pembelian ${formatRupiahShort(minSubtotal)}` : 'Tanpa minimal pembelian';
}

/** Nominal ringkas tanpa "Rp": 36000 → "36RB". */
export function formatAmountShort(amount: number): string {
  return formatRupiahShort(amount).replace(/^Rp/, '');
}

/** "Kamu bakal hemat s.d. 36RB" (persen) / "Kamu bakal hemat 30RB" (nominal). */
export function voucherSavingLabel(discountType: VoucherDiscountType, discount: number): string {
  return discountType === 'PERCENT'
    ? `Kamu bakal hemat s.d. ${formatAmountShort(discount)}`
    : `Kamu bakal hemat ${formatAmountShort(discount)}`;
}

/** "Tambah 20RB lagi buat pakai voucher ini" */
export function voucherShortfallLabel(shortfall: number): string {
  return `Tambah ${formatAmountShort(shortfall)} lagi buat pakai voucher ini`;
}

export function paymentMethodLabel(method: VoucherPaymentMethod): string {
  return method === 'CASH' ? 'Tunai' : 'QRIS';
}

const LONG_MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];
const WIB_OFFSET_MS = 7 * 3_600_000;

/** Bagian tanggal & jam dalam WIB (UTC+7, tanpa DST), tanpa bergantung zona waktu perangkat. */
export function toWibParts(iso: string): { y: number; m: number; d: number; hh: number; mm: number } {
  const wib = new Date(new Date(iso).getTime() + WIB_OFFSET_MS);
  return {
    y: wib.getUTCFullYear(),
    m: wib.getUTCMonth() + 1,
    d: wib.getUTCDate(),
    hh: wib.getUTCHours(),
    mm: wib.getUTCMinutes(),
  };
}

/** "30 November 2026" (WIB) */
export function formatWibLongDate(iso: string): string {
  const { y, m, d } = toWibParts(iso);
  return `${d} ${LONG_MONTHS[m - 1]} ${y}`;
}

/** "Berakhir 2 jam lagi" bila < 24 jam, selain itu "Hingga: 30 November 2026". */
export function voucherExpiryLabel(endsAt: string, now: number = Date.now()): string {
  const ms = new Date(endsAt).getTime() - now;
  if (ms <= 0) return 'Sudah berakhir';
  const hours = Math.floor(ms / 3_600_000);
  if (hours < 1) return `Berakhir ${Math.max(1, Math.floor(ms / 60_000))} menit lagi`;
  if (hours < 24) return `Berakhir ${hours} jam lagi`;
  return `Hingga: ${formatWibLongDate(endsAt)}`;
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const pad2 = (n: number) => String(n).padStart(2, '0');

/** "30 Nov 2026, 23.59" (WIB) */
export function formatWibDateTime(iso: string): string {
  const { y, m, d, hh, mm } = toWibParts(iso);
  return `${d} ${SHORT_MONTHS[m - 1]} ${y}, ${pad2(hh)}.${pad2(mm)}`;
}

/** Nilai awal form admin: { date: "30-11-2026", time: "23:59" } dalam WIB. */
export function toWibInput(iso: string): { date: string; time: string } {
  const { y, m, d, hh, mm } = toWibParts(iso);
  return { date: `${pad2(d)}-${pad2(m)}-${y}`, time: `${pad2(hh)}:${pad2(mm)}` };
}

/** "30-11-2026" + "23:59" (WIB) → "2026-11-30T23:59:00+07:00", atau null bila format/tanggal salah. */
export function fromWibInput(date: string, time: string): string | null {
  const dm = /^(\d{2})-(\d{2})-(\d{4})$/.exec(date.trim());
  const tm = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time.trim());
  if (!dm || !tm) return null;
  const [, dd, mo, yyyy] = dm;
  const check = new Date(Date.UTC(Number(yyyy), Number(mo) - 1, Number(dd)));
  if (check.getUTCDate() !== Number(dd) || check.getUTCMonth() !== Number(mo) - 1) return null;
  return `${yyyy}-${mo}-${dd}T${tm[1]}:${tm[2]}:00+07:00`;
}

import { shortOrderNumber } from '@/features/order/adminBoardUtils';
import { formatDateTime, formatLongDate, formatShortDate } from '@/features/order/orderStatus';
import type { KitchenSheet, KitchenSheetDay } from '@/types/adminOrders';
import type { ProductionMenuSummary } from '@/types/order';

const esc = (value: string | number | null | undefined) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const menuTable = (menus: ProductionMenuSummary[], total: number) => `
  <table class="recap">
    <thead><tr><th>Menu</th><th>Kategori</th><th class="num">Porsi</th></tr></thead>
    <tbody>
      ${menus.map((m) => `<tr><td>${esc(m.menuName)}</td><td>${esc(m.categoryName)}</td><td class="num">${m.totalQty}</td></tr>`).join('')}
    </tbody>
    <tfoot><tr><td colspan="2">Total</td><td class="num">${total}</td></tr></tfoot>
  </table>`;

const dayCard = (d: KitchenSheetDay) => {
  const place =
    d.fulfillmentType === 'DELIVERY'
      ? `🛵 ${esc(d.zoneName ?? 'Belum ada zona')} · ${esc(d.driverName ?? 'Belum ada driver')}`
      : `🏪 ${esc(d.outletName ?? '-')}${d.pickupHours ? ` · ambil ${esc(d.pickupHours)}` : ''}`;
  const who =
    d.fulfillmentType === 'DELIVERY'
      ? `${esc(d.recipientName ?? d.customerName)}${d.recipientPhone ? ` · ${esc(d.recipientPhone)}` : ''}`
      : esc(d.customerName);
  return `
    <div class="card">
      <div class="card-head">
        <span class="check"></span>
        <strong>${esc(shortOrderNumber(d.orderNumber))}</strong>
        <span class="muted">Hari ${d.dayIndex}/${d.dayCount}</span>
        <span class="portions">${d.portions} porsi</span>
      </div>
      <div class="who">${who}</div>
      <div class="muted">${place}</div>
      ${d.fulfillmentType === 'DELIVERY' && d.addressLine ? `<div class="muted small">${esc(d.addressLine)}</div>` : ''}
      <ul>${d.items.map((i) => `<li><strong>${i.qty}×</strong> ${esc(i.menuName)} <span class="muted">· ${esc(i.categoryName)}</span></li>`).join('')}</ul>
      ${d.notes ? `<div class="note">📝 ${esc(d.notes)}</div>` : ''}
    </div>`;
};

export interface KitchenSheetMeta {
  /** Mis. "Tanggal kirim" / "Tanggal pesan". */
  basisLabel: string;
  /** Ringkasan filter aktif, mis. ["Pesan Antar", "Zona: Wates"]. */
  filters: string[];
}

/** Dokumen HTML lembar dapur siap cetak (A4): rekap per menu, rekap per tanggal, dan kartu tiap kiriman. */
export function buildKitchenSheetHtml(sheet: KitchenSheet, meta: KitchenSheetMeta): string {
  const period =
    sheet.dateFrom === sheet.dateTo ? formatLongDate(sheet.dateFrom) : `${formatLongDate(sheet.dateFrom)} – ${formatLongDate(sheet.dateTo)}`;
  const byDate = new Map<string, KitchenSheetDay[]>();
  sheet.days.forEach((d) => byDate.set(d.deliveryDate, [...(byDate.get(d.deliveryDate) ?? []), d]));

  const body =
    sheet.days.length === 0
      ? '<p class="empty">Tidak ada hari kirim yang sudah dibayar pada periode & filter ini.</p>'
      : `
        <h2>Rekap menu · ${sheet.portions} porsi</h2>
        ${menuTable(sheet.menus, sheet.portions)}
        ${sheet.dates.length > 1
          ? `<h2>Rekap per tanggal kirim</h2>
             <div class="dates">${sheet.dates
               .map((d) => `<div class="date-box"><h3>${esc(formatShortDate(d.deliveryDate))} · ${d.portions} porsi</h3>${menuTable(d.menus, d.portions)}</div>`)
               .join('')}</div>`
          : ''}
        <h2 class="break">Daftar kiriman (${sheet.days.length})</h2>
        ${[...byDate.entries()]
          .map(([date, days]) => `<h3>${esc(formatLongDate(date))} · ${days.length} kiriman</h3><div class="grid">${days.map(dayCard).join('')}</div>`)
          .join('')}`;

  return `<!doctype html>
<html lang="id">
<head>
<meta charset="utf-8" />
<title>Lembar Dapur · ${esc(period)}</title>
<style>
  @page { size: A4; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #1f2937; font-size: 11px; margin: 0; }
  h1 { font-size: 18px; margin: 0 0 4px; }
  h2 { font-size: 14px; margin: 16px 0 6px; border-bottom: 2px solid #1f2937; padding-bottom: 3px; }
  h3 { font-size: 12px; margin: 12px 0 6px; }
  .meta { color: #4b5563; margin-bottom: 4px; }
  .muted { color: #6b7280; }
  .small { font-size: 10px; }
  table.recap { border-collapse: collapse; width: 100%; }
  table.recap th, table.recap td { border: 1px solid #d1d5db; padding: 4px 6px; text-align: left; }
  table.recap th { background: #f3f4f6; }
  table.recap tfoot td { font-weight: bold; background: #f9fafb; }
  .num { text-align: right !important; width: 60px; }
  .dates { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .date-box h3 { margin-top: 0; }
  .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
  .card { border: 1px solid #9ca3af; border-radius: 6px; padding: 7px 8px; break-inside: avoid; page-break-inside: avoid; }
  .card-head { display: flex; align-items: center; gap: 6px; font-size: 12px; }
  .check { width: 12px; height: 12px; border: 1.5px solid #1f2937; border-radius: 2px; display: inline-block; }
  .portions { margin-left: auto; font-weight: bold; }
  .who { font-weight: bold; margin-top: 3px; }
  ul { margin: 4px 0 0; padding-left: 16px; }
  li { margin: 1px 0; }
  .note { margin-top: 5px; border: 1.5px dashed #b45309; background: #fffbeb; padding: 4px 6px; font-weight: bold; }
  .empty { margin-top: 24px; color: #6b7280; }
  .break { break-before: auto; }
</style>
</head>
<body>
  <h1>🍳 Lembar Dapur</h1>
  <div class="meta">${esc(meta.basisLabel)}: <strong>${esc(period)}</strong> · Dicetak ${esc(formatDateTime(sheet.generatedAt))}</div>
  ${meta.filters.length > 0 ? `<div class="meta">Filter: ${meta.filters.map(esc).join(' · ')}</div>` : ''}
  <div class="meta">Hanya hari kirim yang sudah dibayar dan tidak dibatalkan.</div>
  ${body}
</body>
</html>`;
}

/** Cetak dokumen HTML lewat iframe tersembunyi (tidak terblokir popup blocker; web saja). */
export function printHtml(html: string) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  iframe.onload = () => {
    const win = iframe.contentWindow;
    if (!win) return cleanup();
    win.onafterprint = cleanup;
    win.focus();
    win.print();
    // Cadangan bila afterprint tidak terpicu (sebagian browser)
    setTimeout(cleanup, 60_000);
  };
  iframe.srcdoc = html;
  document.body.appendChild(iframe);
}

import type { FulfillmentFeeRule } from '@/types/order';

export interface FulfillmentFeeResult {
  fee: number;
  /** Keterangan, mis. "10 hari × Rp 1.500"; null bila gratis / nominal tetap. */
  note: string | null;
}

const rupiah = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;

/**
 * Ongkir sebuah pesanan (rumus sama dengan server, FulfillmentFees.cs):
 *   FREE    → 0
 *   FIXED   → nominal per pesanan
 *   PER_DAY → jumlah hari × tarif tingkat dengan minDays terbesar yang ≤ jumlah hari
 *             (seluruh hari memakai tarif tingkat itu).
 */
export function computeFulfillmentFee(rule: FulfillmentFeeRule | null | undefined, days: number): FulfillmentFeeResult {
  if (!rule) return { fee: 0, note: null };
  if (rule.mode === 'FIXED') return { fee: Math.max(0, rule.amount), note: null };
  if (rule.mode === 'PER_DAY' && days > 0) {
    const tier = [...(rule.tiers ?? [])]
      .filter((t) => t.minDays <= days)
      .sort((a, b) => b.minDays - a.minDays)[0];
    if (!tier || tier.perDay <= 0) return { fee: 0, note: null };
    return { fee: days * tier.perDay, note: `${days} hari × ${rupiah(tier.perDay)}` };
  }
  return { fee: 0, note: null };
}

/** Ringkasan aturan untuk admin, mis. "Gratis", "Rp 5.000 per pesanan", "Mulai 1 hari Rp 2.000/hari · …". */
export function describeFeeRule(rule: FulfillmentFeeRule): string {
  if (rule.mode === 'FIXED') return rule.amount > 0 ? `${rupiah(rule.amount)} per pesanan` : 'Gratis';
  if (rule.mode === 'PER_DAY') {
    return [...(rule.tiers ?? [])]
      .sort((a, b) => a.minDays - b.minDays)
      .map((t) => `${t.minDays}+ hari ${rupiah(t.perDay)}/hari`)
      .join(' · ');
  }
  return 'Gratis';
}

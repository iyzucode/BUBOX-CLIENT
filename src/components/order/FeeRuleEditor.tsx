import React from 'react';
import { Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { computeFulfillmentFee } from '@/features/order/fulfillmentFee';
import { useTheme } from '@/hooks/use-theme';
import type { FulfillmentFeeMode, FulfillmentFeeRule } from '@/types/order';

const MAX_TIERS = 10;
const MAX_DAYS = 31;
const MAX_AMOUNT = 1_000_000;
const PREVIEW_DAYS = [1, 5, 7, 14, 30];

const MODES: { id: FulfillmentFeeMode; label: string }[] = [
  { id: 'FREE', label: 'Gratis' },
  { id: 'FIXED', label: 'Tetap per pesanan' },
  { id: 'PER_DAY', label: 'Per hari kirim' },
];

export interface FeeTierDraft {
  key: string;
  minDays: string;
  perDay: string;
}

/** Isian form (teks) untuk satu aturan ongkir. */
export interface FeeRuleDraft {
  mode: FulfillmentFeeMode;
  amount: string;
  tiers: FeeTierDraft[];
}

let tierKeySeq = 0;
const newTierKey = () => `tier-${++tierKeySeq}`;
const digits = (v: string) => v.replace(/[^0-9]/g, '');

export function ruleToDraft(rule: FulfillmentFeeRule): FeeRuleDraft {
  const tiers = [...(rule.tiers ?? [])].sort((a, b) => a.minDays - b.minDays);
  return {
    mode: rule.mode,
    amount: String(rule.amount ?? 0),
    tiers: (tiers.length > 0 ? tiers : [{ minDays: 1, perDay: 0 }]).map((t) => ({
      key: newTierKey(),
      minDays: String(t.minDays),
      perDay: String(t.perDay),
    })),
  };
}

/** Ubah isian jadi aturan siap kirim; kembalikan pesan kesalahan bila tidak valid. */
export function draftToRule(draft: FeeRuleDraft, label: string): { rule: FulfillmentFeeRule } | { error: string } {
  if (draft.mode === 'FREE') return { rule: { mode: 'FREE', amount: 0, tiers: [] } };

  if (draft.mode === 'FIXED') {
    const amount = Number(draft.amount || '0');
    if (!Number.isInteger(amount) || amount < 0 || amount > MAX_AMOUNT) {
      return { error: `Biaya ${label} harus Rupiah bulat antara 0 sampai 1.000.000.` };
    }
    return { rule: { mode: 'FIXED', amount, tiers: [] } };
  }

  if (draft.tiers.length === 0) return { error: `Tarif ${label} butuh minimal 1 tingkat.` };
  // Tarif kosong tidak dianggap Rp 0, agar tingkat baru tidak diam-diam membuat ongkir gratis
  if (draft.tiers.some((t) => t.minDays.trim() === '' || t.perDay.trim() === '')) {
    return { error: `Lengkapi batas hari dan tarif per hari untuk semua tingkat ${label} (isi 0 bila memang gratis).` };
  }
  const tiers = draft.tiers.map((t) => ({ minDays: Number(t.minDays), perDay: Number(t.perDay) }));
  if (tiers.some((t) => !Number.isInteger(t.minDays) || t.minDays < 1 || t.minDays > MAX_DAYS)) {
    return { error: `Batas hari tarif ${label} harus antara 1 sampai ${MAX_DAYS}.` };
  }
  if (new Set(tiers.map((t) => t.minDays)).size !== tiers.length) {
    return { error: `Batas hari tarif ${label} tidak boleh sama.` };
  }
  if (!tiers.some((t) => t.minDays === 1)) return { error: `Tarif ${label} harus punya tingkat yang mulai dari 1 hari.` };
  if (tiers.some((t) => !Number.isInteger(t.perDay) || t.perDay < 0 || t.perDay > MAX_AMOUNT)) {
    return { error: `Tarif per hari ${label} harus Rupiah bulat antara 0 sampai 1.000.000.` };
  }
  return { rule: { mode: 'PER_DAY', amount: 0, tiers: tiers.sort((a, b) => a.minDays - b.minDays) } };
}

interface FeeRuleEditorProps {
  title: string;
  value: FeeRuleDraft;
  onChange: (draft: FeeRuleDraft) => void;
}

/** Form aturan ongkir satu metode pemesanan: gratis / tetap / per hari bertingkat + pratinjau. */
export const FeeRuleEditor: React.FC<FeeRuleEditorProps> = ({ title, value, onChange }) => {
  const theme = useTheme();
  const input = [styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }];
  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };

  // Pratinjau dari baris yang sudah terisi benar (baris setengah jadi diabaikan)
  const previewRule: FulfillmentFeeRule = {
    mode: value.mode,
    amount: Number(value.amount || '0') || 0,
    tiers: value.tiers
      .map((t) => ({ minDays: Number(t.minDays), perDay: Number(t.perDay || '0') }))
      .filter((t) => Number.isInteger(t.minDays) && t.minDays >= 1),
  };

  const setTier = (key: string, patch: Partial<FeeTierDraft>) =>
    onChange({ ...value, tiers: value.tiers.map((t) => (t.key === key ? { ...t, ...patch } : t)) });

  const addTier = () => {
    const used = value.tiers.map((t) => Number(t.minDays)).filter(Number.isFinite);
    const next = Math.min(MAX_DAYS, (used.length ? Math.max(...used) : 0) + 1);
    onChange({ ...value, tiers: [...value.tiers, { key: newTierKey(), minDays: String(next), perDay: '' }] });
  };

  // Urutkan saat kolom hari selesai diisi, agar urutan tampil sama dengan urutan berlaku
  const sortTiers = () =>
    onChange({ ...value, tiers: [...value.tiers].sort((a, b) => (Number(a.minDays) || 0) - (Number(b.minDays) || 0)) });

  return (
    <View style={styles.root}>
      <ThemedText style={[styles.title, strong]}>{title}</ThemedText>

      <View style={styles.segment}>
        {MODES.map((m) => {
          const active = m.id === value.mode;
          return (
            <Pressable
              key={m.id}
              onPress={() => onChange({ ...value, mode: m.id })}
              style={[styles.segmentBtn, { backgroundColor: active ? theme.primary : theme.backgroundElement }]}
              accessibilityRole="button"
              accessibilityState={{ selected: active }}
            >
              <ThemedText style={[styles.small, styles.bold, { color: active ? '#FFFFFF' : theme.text }]}>{m.label}</ThemedText>
            </Pressable>
          );
        })}
      </View>

      {value.mode === 'FREE' ? (
        <ThemedText style={[styles.tiny, muted]}>Customer tidak dikenai biaya.</ThemedText>
      ) : null}

      {value.mode === 'FIXED' ? (
        <>
          <ThemedText style={[styles.label, strong]}>Biaya per pesanan (Rp)</ThemedText>
          <TextInput
            value={value.amount}
            onChangeText={(v) => onChange({ ...value, amount: digits(v) })}
            keyboardType="number-pad"
            placeholder="5000"
            placeholderTextColor={theme.textSecondary}
            style={input}
          />
          <ThemedText style={[styles.tiny, muted]}>Sama berapa pun jumlah hari kirim dalam pesanan.</ThemedText>
        </>
      ) : null}

      {value.mode === 'PER_DAY' ? (
        <>
          <ThemedText style={[styles.tiny, muted]}>
            Biaya = jumlah hari kirim × tarif tingkat yang berlaku. Seluruh hari memakai tarif tingkat tertinggi yang
            tercapai.
          </ThemedText>
          {value.tiers.map((t, index) => (
            <View key={t.key} style={styles.tierRow}>
              <ThemedText style={[styles.small, muted]}>Mulai</ThemedText>
              <TextInput
                value={t.minDays}
                onChangeText={(v) => setTier(t.key, { minDays: digits(v).slice(0, 2) })}
                onBlur={sortTiers}
                keyboardType="number-pad"
                editable={index !== 0 || t.minDays !== '1'}
                style={[input, styles.daysInput]}
                accessibilityLabel={`Tingkat ${index + 1}: mulai berapa hari`}
              />
              <ThemedText style={[styles.small, muted]}>hari →</ThemedText>
              <TextInput
                value={t.perDay}
                onChangeText={(v) => setTier(t.key, { perDay: digits(v) })}
                keyboardType="number-pad"
                placeholder="Rp"
                placeholderTextColor={theme.textSecondary}
                style={[input, styles.flex]}
                accessibilityLabel={`Tingkat ${index + 1}: tarif per hari`}
              />
              <ThemedText style={[styles.small, muted]}>/hari</ThemedText>
              {/* Tingkat "mulai 1 hari" wajib ada, jadi tidak bisa dihapus */}
              {value.tiers.length > 1 && !(index === 0 && t.minDays === '1') ? (
                <Pressable
                  onPress={() => onChange({ ...value, tiers: value.tiers.filter((x) => x.key !== t.key) })}
                  style={styles.removeBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Hapus tingkat ${index + 1}`}
                >
                  <ThemedText style={[styles.small, styles.bold, { color: theme.danger }]}>✕</ThemedText>
                </Pressable>
              ) : null}
            </View>
          ))}
          {value.tiers.length < MAX_TIERS ? (
            <Pressable onPress={addTier} style={styles.linkBtn} accessibilityRole="button">
              <ThemedText style={[styles.small, styles.bold, { color: theme.primary }]}>+ Tambah tingkat</ThemedText>
            </Pressable>
          ) : null}
        </>
      ) : null}

      {value.mode !== 'FREE' ? (
        <View style={[styles.preview, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={[styles.tiny, styles.bold, muted]}>PRATINJAU</ThemedText>
          {(value.mode === 'FIXED' ? [1, 7] : PREVIEW_DAYS).map((d) => {
            const r = computeFulfillmentFee(previewRule, d);
            return (
              <View key={d} style={styles.previewRow}>
                <ThemedText style={[styles.small, muted]}>
                  {d} hari{r.note ? ` (${r.note.replace(`${d} hari × `, '')}/hari)` : ''}
                </ThemedText>
                <ThemedText style={[styles.small, strong]}>
                  {r.fee > 0 ? `Rp ${r.fee.toLocaleString('id-ID')}` : 'Gratis'}
                </ThemedText>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};

const clickable = Platform.select({ web: { cursor: 'pointer' as const } });

const styles = StyleSheet.create({
  root: { gap: 8 },
  title: { fontSize: 14, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  small: { fontSize: 13 },
  tiny: { fontSize: 11, lineHeight: 15 },
  bold: { fontWeight: '700' },
  flex: { flex: 1 },
  segment: { flexDirection: 'row', gap: 6 },
  segmentBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', ...clickable },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  tierRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  daysInput: { width: 60, textAlign: 'center' },
  removeBtn: { paddingHorizontal: 6, paddingVertical: 4, ...clickable },
  linkBtn: { alignSelf: 'flex-start', paddingVertical: 4, ...clickable },
  preview: { borderRadius: 12, padding: 12, gap: 6, marginTop: 4 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between' },
});

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useAdminVouchers, useSaveVoucher } from '@/features/voucher/useVouchers';
import {
  estimateVoucherDiscount,
  fromWibInput,
  toWibInput,
  voucherHeadline,
  voucherMinimumLabel,
} from '@/features/voucher/voucherUtils';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import { VoucherAdmin, VoucherDiscountType, VoucherPaymentMethod } from '@/types/voucher';
import { showAlert } from '@/utils/alert';

const PAYMENT_OPTIONS: { id: VoucherPaymentMethod; label: string }[] = [
  { id: 'QRIS', label: 'QRIS' },
  { id: 'CASH', label: 'Tunai' },
];

/** Buat / ubah voucher (Admin / Super Admin). Tanpa `id` = voucher baru. */
export default function AdminVoucherFormScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: vouchers, isPending, isError, error } = useAdminVouchers();
  const voucher = id ? vouchers?.find((v) => v.id === id) : undefined;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title={id ? 'Ubah Voucher' : 'Voucher Baru'} fallbackHref="/admin/vouchers" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {id && isPending ? (
          <ActivityIndicator style={styles.loader} color={theme.primary} />
        ) : id && (isError || !voucher) ? (
          <ThemedText style={[styles.small, { color: theme.textSecondary }]}>
            {getApiErrorMessage(error, 'Voucher tidak ditemukan.')}
          </ThemedText>
        ) : (
          // key: form dibuat ulang dari data server untuk voucher yang berbeda
          <VoucherForm key={voucher?.id ?? 'new'} voucher={voucher} />
        )}
      </ScrollView>
    </View>
  );
}

function defaultWindow() {
  const now = new Date();
  const end = new Date(now.getTime() + 30 * 24 * 3_600_000);
  return { start: toWibInput(now.toISOString()), end: { ...toWibInput(end.toISOString()), time: '23:59' } };
}

const VoucherForm: React.FC<{ voucher?: VoucherAdmin }> = ({ voucher }) => {
  const theme = useTheme();
  const router = useRouter();
  const save = useSaveVoucher();

  const initialWindow = voucher
    ? { start: toWibInput(voucher.startsAt), end: toWibInput(voucher.endsAt) }
    : defaultWindow();

  const [code, setCode] = useState(voucher?.code ?? '');
  const [title, setTitle] = useState(voucher?.title ?? 'PROMO TERUS LUANNA');
  const [description, setDescription] = useState(voucher?.description ?? '');
  const [discountType, setDiscountType] = useState<VoucherDiscountType>(voucher?.discountType ?? 'PERCENT');
  const [discountValue, setDiscountValue] = useState(voucher ? String(voucher.discountValue) : '');
  const [maxDiscount, setMaxDiscount] = useState(voucher?.maxDiscount != null ? String(voucher.maxDiscount) : '');
  const [minSubtotal, setMinSubtotal] = useState(voucher ? String(voucher.minSubtotal) : '0');
  const [methods, setMethods] = useState<VoucherPaymentMethod[]>(voucher?.paymentMethods ?? ['QRIS']);
  const [usageLimit, setUsageLimit] = useState(voucher?.usageLimit != null ? String(voucher.usageLimit) : '');
  const [startDate, setStartDate] = useState(initialWindow.start.date);
  const [startTime, setStartTime] = useState(initialWindow.start.time);
  const [endDate, setEndDate] = useState(initialWindow.end.date);
  const [endTime, setEndTime] = useState(initialWindow.end.time);
  const [isListed, setIsListed] = useState(voucher?.isListed ?? true);
  const [isActive, setIsActive] = useState(voucher?.isActive ?? true);

  const numeric = (v: string) => v.replace(/[^0-9]/g, '');
  const preview = {
    discountType,
    discountValue: Number(discountValue) || 0,
    maxDiscount: discountType === 'PERCENT' && maxDiscount ? Number(maxDiscount) : null,
    minSubtotal: Number(minSubtotal) || 0,
  };
  const exampleSubtotal = Math.max(preview.minSubtotal, 100_000);

  const toggleMethod = (method: VoucherPaymentMethod) =>
    setMethods((prev) => (prev.includes(method) ? prev.filter((m) => m !== method) : [...prev, method]));

  const handleSave = () => {
    const startsAt = fromWibInput(startDate, startTime);
    const endsAt = fromWibInput(endDate, endTime);
    if (!startsAt || !endsAt) {
      showAlert('Tanggal Tidak Valid', 'Gunakan format tanggal DD-MM-YYYY dan jam HH:mm, contoh 30-11-2026 23:59.', {
        tone: 'warning',
      });
      return;
    }
    if (methods.length === 0) {
      showAlert('Metode Pembayaran', 'Pilih minimal satu metode pembayaran.', { tone: 'warning' });
      return;
    }

    save.mutate(
      {
        id: voucher?.id,
        data: {
          code: code.trim(),
          title: title.trim(),
          description: description.trim() || null,
          discountType,
          discountValue: preview.discountValue,
          maxDiscount: preview.maxDiscount,
          minSubtotal: preview.minSubtotal,
          paymentMethods: methods,
          usageLimit: usageLimit ? Number(usageLimit) : null,
          startsAt,
          endsAt,
          isListed,
          isActive,
        },
      },
      {
        onSuccess: async () => {
          await showAlert('Tersimpan', `Voucher ${code.trim().toUpperCase()} berhasil disimpan.`, { tone: 'success' });
          if (router.canGoBack()) router.back();
          else router.replace('/admin/vouchers');
        },
        onError: (err) =>
          showAlert('Gagal Menyimpan', getApiErrorMessage(err, 'Voucher tidak dapat disimpan.'), { tone: 'error' }),
      }
    );
  };

  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];
  const input = [styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }];
  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };

  return (
    <>
      {/* Pratinjau seperti yang dilihat pelanggan */}
      <View style={[card, { backgroundColor: theme.primaryLight }]}>
        <ThemedText style={[styles.tiny, styles.bold, muted]}>{(title || 'JUDUL VOUCHER').toUpperCase()}</ThemedText>
        <ThemedText style={[styles.preview, strong]}>{voucherHeadline(preview)}</ThemedText>
        <ThemedText style={[styles.small, muted]}>{voucherMinimumLabel(preview.minSubtotal)}</ThemedText>
        <ThemedText style={[styles.tiny, muted]}>
          Contoh: belanja Rp {exampleSubtotal.toLocaleString('id-ID')} → potongan Rp{' '}
          {estimateVoucherDiscount(preview, exampleSubtotal).toLocaleString('id-ID')}
        </ThemedText>
      </View>

      <View style={card}>
        <ThemedText style={[styles.label, strong]}>Kode voucher</ThemedText>
        <TextInput
          value={code}
          onChangeText={(v) => setCode(v.toUpperCase().replace(/[^A-Z0-9_-]/g, ''))}
          placeholder="LUANNA10"
          placeholderTextColor={theme.textSecondary}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={30}
          style={input}
        />
        <ThemedText style={[styles.tiny, muted]}>3-30 karakter: huruf, angka, - atau _.</ThemedText>

        <ThemedText style={[styles.label, strong]}>Judul</ThemedText>
        <TextInput value={title} onChangeText={setTitle} maxLength={100} style={input} />

        <ThemedText style={[styles.label, strong]}>Deskripsi (opsional)</ThemedText>
        <TextInput value={description} onChangeText={setDescription} maxLength={300} multiline style={[input, styles.multiline]} />
      </View>

      <View style={card}>
        <ThemedText style={[styles.label, strong]}>Jenis diskon</ThemedText>
        <View style={styles.segment}>
          {(['PERCENT', 'FIXED'] as const).map((type) => {
            const active = type === discountType;
            return (
              <Pressable
                key={type}
                onPress={() => setDiscountType(type)}
                style={[styles.segmentBtn, { backgroundColor: active ? theme.primary : theme.backgroundElement }]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <ThemedText style={[styles.small, styles.bold, { color: active ? '#FFFFFF' : theme.text }]}>
                  {type === 'PERCENT' ? 'Persen (%)' : 'Nominal (Rp)'}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={[styles.label, strong]}>
          {discountType === 'PERCENT' ? 'Besar diskon (%)' : 'Potongan (Rp)'}
        </ThemedText>
        <TextInput
          value={discountValue}
          onChangeText={(v) => setDiscountValue(numeric(v))}
          keyboardType="number-pad"
          placeholder={discountType === 'PERCENT' ? '10' : '30000'}
          placeholderTextColor={theme.textSecondary}
          style={input}
        />

        {discountType === 'PERCENT' ? (
          <>
            <ThemedText style={[styles.label, strong]}>Maksimal potongan (Rp, opsional)</ThemedText>
            <TextInput
              value={maxDiscount}
              onChangeText={(v) => setMaxDiscount(numeric(v))}
              keyboardType="number-pad"
              placeholder="50000"
              placeholderTextColor={theme.textSecondary}
              style={input}
            />
          </>
        ) : null}

        <ThemedText style={[styles.label, strong]}>Minimal pembelian (Rp)</ThemedText>
        <TextInput
          value={minSubtotal}
          onChangeText={(v) => setMinSubtotal(numeric(v))}
          keyboardType="number-pad"
          style={input}
        />
        <ThemedText style={[styles.tiny, muted]}>Dihitung dari subtotal menu, tanpa ongkir.</ThemedText>

        <ThemedText style={[styles.label, strong]}>Metode pembayaran</ThemedText>
        <View style={styles.segment}>
          {PAYMENT_OPTIONS.map((opt) => {
            const active = methods.includes(opt.id);
            return (
              <Pressable
                key={opt.id}
                onPress={() => toggleMethod(opt.id)}
                style={[styles.segmentBtn, { backgroundColor: active ? theme.primary : theme.backgroundElement }]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: active }}
              >
                <ThemedText style={[styles.small, styles.bold, { color: active ? '#FFFFFF' : theme.text }]}>
                  {opt.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        <ThemedText style={[styles.tiny, muted]}>Saat ini pesanan hanya bisa dibayar dengan QRIS.</ThemedText>

        <ThemedText style={[styles.label, strong]}>Kuota pemakaian (opsional)</ThemedText>
        <TextInput
          value={usageLimit}
          onChangeText={(v) => setUsageLimit(numeric(v))}
          keyboardType="number-pad"
          placeholder="Kosongkan untuk tanpa batas"
          placeholderTextColor={theme.textSecondary}
          style={input}
        />
        <ThemedText style={[styles.tiny, muted]}>
          Total pemakaian untuk semua pelanggan.
          {voucher ? ` Sudah dipakai ${voucher.redemptionCount}×.` : ''} Pesanan yang batal sebelum dibayar
          mengembalikan kuotanya.
        </ThemedText>
      </View>

      <View style={card}>
        <ThemedText style={[styles.label, strong]}>Mulai berlaku (WIB)</ThemedText>
        <View style={styles.dateRow}>
          <TextInput value={startDate} onChangeText={setStartDate} placeholder="DD-MM-YYYY" maxLength={10}
            placeholderTextColor={theme.textSecondary} keyboardType="numbers-and-punctuation" style={[input, styles.flex]} />
          <TextInput value={startTime} onChangeText={setStartTime} placeholder="HH:mm" maxLength={5}
            placeholderTextColor={theme.textSecondary} keyboardType="numbers-and-punctuation" style={[input, styles.time]} />
        </View>

        <ThemedText style={[styles.label, strong]}>Berakhir (WIB)</ThemedText>
        <View style={styles.dateRow}>
          <TextInput value={endDate} onChangeText={setEndDate} placeholder="DD-MM-YYYY" maxLength={10}
            placeholderTextColor={theme.textSecondary} keyboardType="numbers-and-punctuation" style={[input, styles.flex]} />
          <TextInput value={endTime} onChangeText={setEndTime} placeholder="HH:mm" maxLength={5}
            placeholderTextColor={theme.textSecondary} keyboardType="numbers-and-punctuation" style={[input, styles.time]} />
        </View>
      </View>

      <View style={card}>
        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <ThemedText style={[styles.label, strong]}>Tampil di daftar voucher</ThemedText>
            <ThemedText style={[styles.tiny, muted]}>
              Matikan untuk kode rahasia: hanya bisa dipakai dengan mengetik kodenya.
            </ThemedText>
          </View>
          <Switch value={isListed} onValueChange={setIsListed} trackColor={{ true: theme.primary, false: theme.border }} />
        </View>
        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <ThemedText style={[styles.label, strong]}>Aktif</ThemedText>
            <ThemedText style={[styles.tiny, muted]}>Voucher nonaktif tidak bisa dipakai sama sekali.</ThemedText>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: theme.primary, false: theme.border }} />
        </View>
        <ThemedText style={[styles.tiny, muted]}>
          Setiap pelanggan hanya bisa memakai voucher ini 1×. Bila pesanannya batal sebelum dibayar, voucher bisa
          dipakai lagi.
        </ThemedText>
      </View>

      <Pressable
        onPress={handleSave}
        disabled={save.isPending}
        style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: save.isPending ? 0.6 : 1 }]}
        accessibilityRole="button"
      >
        {save.isPending ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText style={styles.saveText}>Simpan</ThemedText>}
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 40, maxWidth: 560, width: '100%', alignSelf: 'center' },
  loader: { marginTop: 30 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  preview: { fontSize: 20, fontWeight: '700' },
  small: { fontSize: 13 },
  tiny: { fontSize: 11, lineHeight: 15 },
  bold: { fontWeight: '700' },
  flex: { flex: 1 },
  segment: { flexDirection: 'row', gap: 8 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
  dateRow: { flexDirection: 'row', gap: 8 },
  time: { width: 96 },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

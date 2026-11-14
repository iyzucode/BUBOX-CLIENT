import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { computeOrderCharges, formatPercent, serviceFeeLabel } from '@/features/order/orderCharges';
import { formatDateTime, formatShortDate } from '@/features/order/orderStatus';
import { useOrderCutoffInfo, useOrderSettings, useUpdateOrderSettings } from '@/features/order/useOrders';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import { OrderSettings, ServiceFeeType } from '@/types/order';
import { showAlert } from '@/utils/alert';

const DAY_OPTIONS = [0, 1, 2, 3];
const SERVICE_FEE_TYPES: { id: ServiceFeeType; label: string }[] = [
  { id: 'PERCENT', label: 'Persen (%)' },
  { id: 'FIXED', label: 'Nominal (Rp)' },
];
/** Contoh subtotal untuk pratinjau perhitungan di form. */
const EXAMPLE_SUBTOTAL = 100_000;

/** "2,5" / "2.5" → 2.5; null bila bukan angka. */
const parseDecimal = (v: string): number | null => {
  const n = Number(v.trim().replace(',', '.'));
  return v.trim() !== '' && Number.isFinite(n) ? n : null;
};
/** Persen 0–100 dengan maksimal 2 angka desimal. */
const isValidPercent = (n: number | null): n is number =>
  n != null && n >= 0 && n <= 100 && Math.round(n * 100) === n * 100;
/** Hanya angka & satu pemisah desimal. */
const decimalInput = (v: string) => v.replace(/[^0-9.,]/g, '');

/** Pengaturan cutoff pemesanan, batas waktu bayar QRIS, ongkir, biaya layanan & pajak (Admin / Super Admin). */
export default function AdminSettingsScreen() {
  const theme = useTheme();
  const { data: settings, isLoading, isError, error } = useOrderSettings();

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Cutoff & Pembayaran" fallbackHref="/admin" />

      <ScrollView contentContainerStyle={styles.scroll}>
        {isLoading ? (
          <ActivityIndicator style={styles.loader} color={theme.primary} />
        ) : isError || !settings ? (
          <ThemedText style={[styles.small, { color: theme.textSecondary }]}>
            {getApiErrorMessage(error, 'Gagal memuat pengaturan.')}
          </ThemedText>
        ) : (
          // key: form di-reset dari data server setiap kali pengaturan tersimpan
          <SettingsForm key={settings.updatedAt ?? 'default'} settings={settings} />
        )}
      </ScrollView>
    </View>
  );
}

const SettingsForm: React.FC<{ settings: OrderSettings }> = ({ settings }) => {
  const theme = useTheme();
  const { data: cutoff } = useOrderCutoffInfo();
  const update = useUpdateOrderSettings();

  const [daysBefore, setDaysBefore] = useState(settings.cutoffDaysBefore);
  const [cutoffTime, setCutoffTime] = useState(settings.cutoffTime);
  const [timeout, setTimeoutMinutes] = useState(String(settings.paymentTimeoutMinutes));
  const [deliveryFee, setDeliveryFee] = useState(String(settings.deliveryFee));
  const [serviceFeeType, setServiceFeeType] = useState<ServiceFeeType>(settings.serviceFeeType);
  const [serviceFeeValue, setServiceFeeValue] = useState(String(settings.serviceFeeValue).replace('.', ','));
  const [taxPercent, setTaxPercent] = useState(String(settings.taxPercent).replace('.', ','));

  const serviceValue = parseDecimal(serviceFeeValue) ?? 0;
  const taxValue = parseDecimal(taxPercent) ?? 0;
  const example = computeOrderCharges(EXAMPLE_SUBTOTAL, {
    serviceFeeType,
    serviceFeeValue: serviceValue,
    taxPercent: taxValue,
  });

  const handleSave = () => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(cutoffTime.trim())) {
      showAlert('Jam Tidak Valid', 'Gunakan format HH:mm, contoh 17:00.', { tone: 'warning' });
      return;
    }
    const parsedService = serviceFeeValue.trim() === '' ? 0 : parseDecimal(serviceFeeValue);
    const serviceValid =
      serviceFeeType === 'PERCENT'
        ? isValidPercent(parsedService)
        : parsedService != null && Number.isInteger(parsedService) && parsedService >= 0 && parsedService <= 1_000_000;
    if (parsedService == null || !serviceValid) {
      showAlert(
        'Biaya Layanan Tidak Valid',
        serviceFeeType === 'PERCENT'
          ? 'Isi persen antara 0 sampai 100, maksimal 2 angka desimal (contoh 2,5).'
          : 'Isi nominal Rupiah bulat, contoh 2000.',
        { tone: 'warning' }
      );
      return;
    }
    const parsedTax = taxPercent.trim() === '' ? 0 : parseDecimal(taxPercent);
    if (!isValidPercent(parsedTax)) {
      showAlert('Pajak Tidak Valid', 'Isi persen antara 0 sampai 100, maksimal 2 angka desimal (contoh 11).', { tone: 'warning' });
      return;
    }

    update.mutate(
      {
        cutoffDaysBefore: daysBefore,
        cutoffTime: cutoffTime.trim(),
        timeZone: settings.timeZone,
        paymentTimeoutMinutes: Number(timeout) || 0,
        deliveryFee: Number(deliveryFee) || 0,
        serviceFeeType,
        serviceFeeValue: parsedService,
        taxPercent: parsedTax,
      },
      {
        onSuccess: () => showAlert('Tersimpan', 'Pengaturan pesanan berhasil diperbarui.', { tone: 'success' }),
        onError: (err) => showAlert('Gagal Menyimpan', getApiErrorMessage(err, 'Pengaturan tidak dapat disimpan.'), { tone: 'error' }),
      }
    );
  };

  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];
  const input = [styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }];
  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };

  return (
    <>
      {/* Ringkasan aturan yang berlaku */}
      <View style={[card, { backgroundColor: theme.primaryLight }]}>
        <ThemedText style={[styles.sectionTitle, strong]}>
          ⏰ Pesan paling lambat {settings.cutoffDaysBefore === 0 ? 'hari H' : `H-${settings.cutoffDaysBefore}`} pukul{' '}
          {settings.cutoffTime}
        </ThemedText>
        {cutoff ? (
          <ThemedText style={[styles.small, muted]}>
            Saat ini tanggal kirim paling awal: {formatShortDate(cutoff.earliestDeliveryDate)}
          </ThemedText>
        ) : null}
        <ThemedText style={[styles.tiny, muted]}>
          🌐 {settings.timeZone}
          {settings.updatedAt ? ` · diubah ${formatDateTime(settings.updatedAt)}` : ''}
        </ThemedText>
      </View>

      {/* Cutoff */}
      <View style={card}>
        <ThemedText style={[styles.label, strong]}>Hari cutoff</ThemedText>
        <View style={styles.segment}>
          {DAY_OPTIONS.map((d) => {
            const active = d === daysBefore;
            return (
              <Pressable
                key={d}
                onPress={() => setDaysBefore(d)}
                style={[styles.segmentBtn, { backgroundColor: active ? theme.primary : theme.backgroundElement }]}
              >
                <ThemedText style={[styles.small, styles.bold, { color: active ? '#FFFFFF' : theme.text }]}>
                  {d === 0 ? 'Hari H' : `H-${d}`}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={[styles.label, strong]}>Jam cutoff</ThemedText>
        <TextInput
          value={cutoffTime}
          onChangeText={setCutoffTime}
          placeholder="17:00"
          placeholderTextColor={theme.textSecondary}
          maxLength={5}
          keyboardType="numbers-and-punctuation"
          style={input}
        />
        <ThemedText style={[styles.tiny, muted]}>
          Pembayaran yang selesai setelah jam ini tetap diterima selama masih dalam batas waktu bayar.
        </ThemedText>
      </View>

      {/* Pembayaran & ongkir */}
      <View style={card}>
        <ThemedText style={[styles.label, strong]}>⏱ Batas waktu bayar QRIS (menit)</ThemedText>
        <TextInput
          value={timeout}
          onChangeText={(v) => setTimeoutMinutes(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          style={input}
        />

        <ThemedText style={[styles.label, strong]}>🛵 Ongkir per pesanan (Rp)</ThemedText>
        <TextInput
          value={deliveryFee}
          onChangeText={(v) => setDeliveryFee(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          style={input}
        />
      </View>

      {/* Biaya layanan & pajak */}
      <View style={card}>
        <ThemedText style={[styles.label, strong]}>🧾 Biaya layanan</ThemedText>
        <View style={styles.segment}>
          {SERVICE_FEE_TYPES.map((t) => {
            const active = t.id === serviceFeeType;
            return (
              <Pressable
                key={t.id}
                onPress={() => {
                  setServiceFeeType(t.id);
                  setServiceFeeValue('0');
                }}
                style={[styles.segmentBtn, { backgroundColor: active ? theme.primary : theme.backgroundElement }]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <ThemedText style={[styles.small, styles.bold, { color: active ? '#FFFFFF' : theme.text }]}>
                  {t.label}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        <TextInput
          value={serviceFeeValue}
          onChangeText={(v) => setServiceFeeValue(serviceFeeType === 'PERCENT' ? decimalInput(v) : v.replace(/[^0-9]/g, ''))}
          keyboardType={serviceFeeType === 'PERCENT' ? 'decimal-pad' : 'number-pad'}
          placeholder={serviceFeeType === 'PERCENT' ? 'Contoh 2,5' : 'Contoh 2000'}
          placeholderTextColor={theme.textSecondary}
          style={input}
        />
        <ThemedText style={[styles.tiny, muted]}>
          {serviceFeeType === 'PERCENT'
            ? 'Persen dari subtotal menu setelah diskon voucher, dibulatkan ke atas.'
            : 'Rupiah tetap per pesanan.'}{' '}
          Isi 0 untuk tanpa biaya layanan.
        </ThemedText>

        <ThemedText style={[styles.label, strong]}>🏛 Pajak (%)</ThemedText>
        <TextInput
          value={taxPercent}
          onChangeText={(v) => setTaxPercent(decimalInput(v))}
          keyboardType="decimal-pad"
          placeholder="Contoh 11"
          placeholderTextColor={theme.textSecondary}
          style={input}
        />
        <ThemedText style={[styles.tiny, muted]}>
          Dari subtotal setelah diskon + biaya layanan, dibulatkan ke atas. Isi 0 untuk tanpa pajak. Berlaku untuk Pesan
          Antar dan Ambil Sendiri.
        </ThemedText>

        {/* Pratinjau perhitungan */}
        <View style={[styles.preview, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={[styles.tiny, styles.bold, muted]}>
            CONTOH PESANAN Rp {EXAMPLE_SUBTOTAL.toLocaleString('id-ID')} (tanpa voucher & ongkir)
          </ThemedText>
          <View style={styles.previewRow}>
            <ThemedText style={[styles.small, muted]}>{serviceFeeLabel(example.serviceFeePercent)}</ThemedText>
            <ThemedText style={[styles.small, strong]}>Rp {example.serviceFee.toLocaleString('id-ID')}</ThemedText>
          </View>
          <View style={styles.previewRow}>
            <ThemedText style={[styles.small, muted]}>Pajak ({formatPercent(example.taxPercent)})</ThemedText>
            <ThemedText style={[styles.small, strong]}>Rp {example.taxAmount.toLocaleString('id-ID')}</ThemedText>
          </View>
          <View style={styles.previewRow}>
            <ThemedText style={[styles.small, styles.bold, strong]}>Total</ThemedText>
            <ThemedText style={[styles.small, styles.bold, strong]}>
              Rp {(EXAMPLE_SUBTOTAL + example.serviceFee + example.taxAmount).toLocaleString('id-ID')}
            </ThemedText>
          </View>
        </View>
      </View>

      <Pressable
        onPress={handleSave}
        disabled={update.isPending}
        style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: update.isPending ? 0.6 : 1 }]}
      >
        {update.isPending ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText style={styles.saveText}>Simpan</ThemedText>}
      </Pressable>
    </>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 40, maxWidth: 560, width: '100%', alignSelf: 'center' },
  loader: { marginTop: 30 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  label: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  small: { fontSize: 13 },
  tiny: { fontSize: 11 },
  bold: { fontWeight: '700' },
  segment: { flexDirection: 'row', gap: 8 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  preview: { borderRadius: 12, padding: 12, gap: 6, marginTop: 4 },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between' },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});

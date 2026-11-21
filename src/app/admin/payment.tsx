import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { FeeRuleDraft, FeeRuleEditor, draftToRule, ruleToDraft } from '@/components/order/FeeRuleEditor';
import {
  OrderSettingsScreen,
  SettingsSaveButton,
  settingsStyles as styles,
  useSaveOrderSettings,
} from '@/components/order/OrderSettingsShell';
import { ThemedText } from '@/components/themed-text';
import { computeOrderCharges, formatPercent, serviceFeeLabel } from '@/features/order/orderCharges';
import { useTheme } from '@/hooks/use-theme';
import { OrderSettings, ServiceFeeType } from '@/types/order';
import { showAlert } from '@/utils/alert';

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

/** Batas waktu bayar QRIS, ongkir, biaya layanan & pajak (Admin / Super Admin). */
export default function AdminPaymentScreen() {
  return (
    <OrderSettingsScreen title="Pembayaran" subtitle="Batas waktu bayar, ongkir, biaya layanan & pajak">
      {(settings) => <PaymentForm key={settings.updatedAt ?? 'default'} settings={settings} />}
    </OrderSettingsScreen>
  );
}

const PaymentForm: React.FC<{ settings: OrderSettings }> = ({ settings }) => {
  const theme = useTheme();
  const { save, isPending } = useSaveOrderSettings(settings);

  const [timeout, setTimeoutMinutes] = useState(String(settings.paymentTimeoutMinutes));
  const [deliveryRule, setDeliveryRule] = useState<FeeRuleDraft>(() => ruleToDraft(settings.deliveryFeeRule));
  const [pickupRule, setPickupRule] = useState<FeeRuleDraft>(() => ruleToDraft(settings.pickupFeeRule));
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
    const delivery = draftToRule(deliveryRule, 'Pesan Antar');
    const pickup = draftToRule(pickupRule, 'Ambil Sendiri');
    for (const r of [delivery, pickup]) {
      if ('error' in r) {
        showAlert('Ongkir Tidak Valid', r.error, { tone: 'warning' });
        return;
      }
    }
    if ('error' in delivery || 'error' in pickup) return;

    save({
      paymentTimeoutMinutes: Number(timeout) || 0,
      deliveryFeeRule: delivery.rule,
      pickupFeeRule: pickup.rule,
      serviceFeeType,
      serviceFeeValue: parsedService,
      taxPercent: parsedTax,
    });
  };

  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];
  const input = [styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }];
  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };

  return (
    <>
      <View style={card}>
        <ThemedText style={[styles.label, strong]}>⏱ Batas waktu bayar QRIS (menit)</ThemedText>
        <TextInput
          value={timeout}
          onChangeText={(v) => setTimeoutMinutes(v.replace(/[^0-9]/g, ''))}
          keyboardType="number-pad"
          style={input}
        />
      </View>

      {/* Ongkir per metode pemesanan */}
      <View style={card}>
        <FeeRuleEditor title="🛵 Ongkir Pesan Antar" value={deliveryRule} onChange={setDeliveryRule} />
      </View>
      <View style={card}>
        <FeeRuleEditor title="🏪 Biaya Ambil Sendiri" value={pickupRule} onChange={setPickupRule} />
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

      <SettingsSaveButton onPress={handleSave} isPending={isPending} />
    </>
  );
};

import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { VoucherTicket } from '@/components/voucher/VoucherTicket';
import { formatRupiah } from '@/features/order/orderStatus';
import { useCheckoutTotals } from '@/features/order/useCheckoutTotals';
import { useCheckoutPalette } from './checkoutPalette';

/**
 * Voucher di checkout: baris "Voucher ›" membuka layar Pilih Voucher; voucher yang dipakai tampil
 * sebagai tiket di bawahnya. Melepas voucher: ketuk tiketnya lagi di layar Pilih Voucher.
 */
export const PromoCodeCard: React.FC = () => {
  const palette = useCheckoutPalette();
  const router = useRouter();
  const { voucher, discount, subtotal, voucherBelowMinimum } = useCheckoutTotals();

  const openPicker = () => router.push('/voucher');

  return (
    <View style={styles.section}>
      <Pressable
        onPress={openPicker}
        style={({ pressed }) => [styles.row, { backgroundColor: palette.cardBg, opacity: pressed ? 0.85 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={voucher ? `Voucher ${voucher.code} dipakai. Ganti voucher` : 'Pilih voucher'}
      >
        <TicketIcon color={palette.cardTitle} cutout={palette.cardBg} />
        <ThemedText style={[styles.label, { color: palette.cardTitle }]}>Voucher</ThemedText>
        {voucher && !voucherBelowMinimum ? (
          <ThemedText style={[styles.saving, { color: palette.optionIconColor }]} numberOfLines={1}>
            Hemat {formatRupiah(discount)}
          </ThemedText>
        ) : null}
        <ThemedText style={[styles.chevron, { color: palette.cardTitle }]}>›</ThemedText>
      </Pressable>

      {/* Panel menyambung dari bawah tombol Voucher, berisi tiket voucher yang dipakai */}
      {voucher ? (
        <View style={[styles.panel, { backgroundColor: palette.voucherPanelBg }]}>
          {/* Pesan "Tambah … lagi" muncul otomatis bila keranjang berubah di bawah minimal pembelian */}
          <VoucherTicket
            voucher={voucher}
            subtotal={subtotal}
            selected
            onPress={openPicker}
            cutoutColor={palette.voucherPanelBg}
          />
        </View>
      ) : null}
    </View>
  );
};

/** Ikon tiket kecil dengan tanda % dan lekukan di kedua sisi. */
const TicketIcon: React.FC<{ color: string; cutout: string }> = ({ color, cutout }) => (
  <View style={[styles.ticketIcon, { backgroundColor: color }]}>
    <View style={[styles.notch, styles.notchLeft, { backgroundColor: cutout }]} />
    <View style={[styles.notch, styles.notchRight, { backgroundColor: cutout }]} />
    <ThemedText style={[styles.ticketIconText, { color: cutout }]}>%</ThemedText>
  </View>
);

/** Seberapa jauh panel voucher menyelip di bawah tombol Voucher (px). */
const PANEL_TUCK = 20;

const styles = StyleSheet.create({
  section: {},
  row: {
    zIndex: 1,
    minHeight: 60,
    borderRadius: 20,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Platform.select({
      web: { cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' },
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: { elevation: 2 },
    }),
  },
  // Lebih sempit dari tombol & menyelip di bawahnya, jadi tampak keluar dari tombol Voucher
  panel: {
    marginHorizontal: 20,
    marginTop: -PANEL_TUCK,
    paddingTop: PANEL_TUCK + 12,
    paddingHorizontal: 12,
    paddingBottom: 12,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  label: { flex: 1, fontSize: 16, fontWeight: '500', letterSpacing: -0.2 },
  saving: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  chevron: { fontSize: 26, lineHeight: 28, fontWeight: '400' },
  ticketIcon: {
    width: 28,
    height: 20,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  notch: { position: 'absolute', width: 6, height: 6, borderRadius: 3, top: 7 },
  notchLeft: { left: -3 },
  notchRight: { right: -3 },
  ticketIconText: { fontSize: 12, lineHeight: 14, fontWeight: '800' },
});

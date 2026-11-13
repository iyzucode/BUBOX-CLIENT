import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  estimateVoucherDiscount,
  voucherHeadline,
  voucherMinimumLabel,
  voucherSavingLabel,
  voucherShortfallLabel,
} from '@/features/voucher/voucherUtils';
import { useTheme } from '@/hooks/use-theme';
import { VoucherOption } from '@/types/voucher';

export interface VoucherTicketAction {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  /** primary = tombol oranye penuh; outline = sudah dipilih. */
  variant?: 'primary' | 'outline';
}

interface VoucherTicketProps {
  voucher: VoucherOption;
  /** Subtotal keranjang saat ini: dasar pesan "hemat …" / "tambah … lagi". */
  subtotal: number;
  /** Bingkai oranye. */
  selected?: boolean;
  /** Tombol di kanan (mis. "Pakai"). Bila ada, kartu sendiri tidak bisa diketuk (hindari tombol bertumpuk). */
  action?: VoucherTicketAction;
  /** Ketuk seluruh kartu (dipakai bila tanpa `action`). */
  onPress?: () => void;
  /** Warna potongan kiri/kanan (= warna latar di belakang kartu). Default: latar halaman. */
  cutoutColor?: string;
}

/** Diameter potongan setengah lingkaran di kiri & kanan garis putus-putus. */
const NOTCH_SIZE = 24;
const RADIUS = 16;

type Tone = 'saving' | 'shortfall' | 'blocked';

/**
 * Kartu voucher: ikon %, judul, besar diskon & minimal pembelian di atas (tombol aksi di kanan),
 * garis putus-putus mendatar dengan potongan di kedua sisi, lalu chip pesan di bawah:
 * "Kamu bakal hemat …", "Tambah … lagi buat pakai voucher ini", atau alasan lain dari server.
 */
export const VoucherTicket: React.FC<VoucherTicketProps> = ({
  voucher,
  subtotal,
  selected = false,
  action,
  onPress,
  cutoutColor,
}) => {
  const theme = useTheme();
  const cutout = cutoutColor ?? theme.background;
  const edgeColor = selected ? theme.primary : theme.border;
  const edgeWidth = selected ? 2 : 1;

  // Garis putus-putus & potongan berada di batas bawah bagian atas (diukur; tidak memengaruhi tata letak)
  const [dividerY, setDividerY] = useState(0);
  const handleTopLayout = (e: LayoutChangeEvent) => {
    const next = e.nativeEvent.layout.y + e.nativeEvent.layout.height;
    setDividerY((prev) => (Math.abs(prev - next) < 1 ? prev : next));
  };

  const shortfall = voucher.minSubtotal - subtotal;
  let tone: Tone;
  let message: string;
  if (shortfall > 0) {
    tone = 'shortfall';
    message = voucherShortfallLabel(shortfall);
  } else if (!voucher.isEligible) {
    tone = 'blocked';
    message = voucher.ineligibleReason ?? 'Voucher belum bisa dipakai.';
  } else {
    tone = 'saving';
    message = voucherSavingLabel(voucher.discountType, estimateVoucherDiscount(voucher, subtotal));
  }
  const usable = tone === 'saving';
  const iconColor = usable ? theme.primary : theme.textSecondary;

  const chip =
    tone === 'saving'
      ? { bg: theme.primaryLight, fg: theme.primary }
      : tone === 'shortfall'
        ? { bg: theme.backgroundElement, fg: theme.text }
        : { bg: theme.backgroundElement, fg: theme.danger };

  const outline = action?.variant === 'outline';

  const content = (
    <>
      {/* Bingkai */}
      <View pointerEvents="none" style={[styles.frame, { borderColor: edgeColor, borderWidth: edgeWidth }]} />

      {/* Bagian atas */}
      <View style={styles.top} onLayout={handleTopLayout}>
        <View style={styles.burst}>
          <View style={[styles.burstSquare, { backgroundColor: iconColor }]} />
          <View style={[styles.burstSquare, styles.burstRotated, { backgroundColor: iconColor }]} />
          <ThemedText style={[styles.burstText, { color: theme.onPrimary }]}>%</ThemedText>
        </View>

        <View style={[styles.info, !usable && styles.dimmed]}>
          <ThemedText style={[styles.title, { color: theme.textSecondary }]} numberOfLines={1}>
            {voucher.title.toUpperCase()}
          </ThemedText>
          <ThemedText style={[styles.headline, { color: theme.text }]}>{voucherHeadline(voucher)}</ThemedText>
          <ThemedText style={[styles.meta, { color: theme.textSecondary }]}>
            {voucherMinimumLabel(voucher.minSubtotal)}
          </ThemedText>
        </View>

        {action ? (
          <Pressable
            onPress={action.onPress}
            disabled={action.disabled}
            style={({ pressed }) => [
              styles.actionBtn,
              outline
                ? { borderWidth: 1.5, borderColor: theme.primary, backgroundColor: theme.card }
                : { backgroundColor: action.disabled ? theme.backgroundElement : theme.primary },
              { opacity: pressed ? 0.85 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityState={{ disabled: !!action.disabled }}
            accessibilityLabel={`${action.label} voucher ${voucherHeadline(voucher)}`}
          >
            <ThemedText
              style={[
                styles.actionText,
                { color: outline ? theme.primary : action.disabled ? theme.textSecondary : theme.onPrimary },
              ]}
            >
              {action.label}
            </ThemedText>
          </Pressable>
        ) : null}
      </View>

      {/* Garis putus-putus */}
      <View style={[styles.divider, { borderColor: theme.border }]} />

      {/* Bagian bawah: chip pesan */}
      <View style={styles.bottom}>
        <View style={[styles.chip, { backgroundColor: chip.bg }]}>
          <ThemedText style={[styles.chipText, { color: chip.fg }]}>{message}</ThemedText>
        </View>
      </View>

      {/* Potongan setengah lingkaran di kiri & kanan garis putus-putus */}
      {dividerY > 0
        ? (['left', 'right'] as const).map((side) => (
            <View
              key={side}
              pointerEvents="none"
              style={[
                styles.notch,
                {
                  top: dividerY - NOTCH_SIZE / 2,
                  // Pusat lingkaran tepat di tengah garis bingkai → menutup garis & menggigit ke dalam
                  [side]: edgeWidth / 2 - NOTCH_SIZE / 2,
                  backgroundColor: cutout,
                  borderColor: edgeColor,
                  borderWidth: edgeWidth,
                },
              ]}
            />
          ))
        : null}
    </>
  );

  const cardStyle = [styles.ticket, { backgroundColor: theme.card }];
  const label = `${voucher.title}, ${voucherHeadline(voucher)}, ${message}`;

  if (action || !onPress) {
    return (
      <View style={cardStyle} accessibilityLabel={label}>
        {content}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [cardStyle, styles.clickable, { opacity: pressed ? 0.9 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {content}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  ticket: { borderRadius: RADIUS, overflow: 'hidden' },
  clickable: { ...Platform.select({ web: { cursor: 'pointer' } }) },
  frame: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, borderRadius: RADIUS, zIndex: 2 },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingTop: 16,
    paddingBottom: 14,
    paddingLeft: 18,
    paddingRight: 16,
  },
  burst: { width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  burstSquare: { position: 'absolute', width: 38, height: 38, borderRadius: 7 },
  burstRotated: { transform: [{ rotate: '45deg' }] },
  burstText: { fontSize: 22, lineHeight: 26, fontWeight: '800' },
  info: { flex: 1, gap: 2 },
  dimmed: { opacity: 0.65 },
  title: { fontSize: 12, lineHeight: 16, fontWeight: '600', letterSpacing: 0.4 },
  headline: { fontSize: 22, lineHeight: 28, fontWeight: '700', letterSpacing: -0.3 },
  meta: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  actionBtn: {
    minWidth: 72,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  actionText: { fontSize: 14, fontWeight: '700' },
  divider: {
    height: 0,
    borderTopWidth: 1.5,
    borderStyle: 'dashed',
    marginHorizontal: NOTCH_SIZE / 2 + 6,
  },
  bottom: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 14, flexDirection: 'row' },
  chip: { borderRadius: 999, paddingHorizontal: 14, paddingVertical: 6, flexShrink: 1 },
  chipText: { fontSize: 13, lineHeight: 18, fontWeight: '600' },
  notch: {
    position: 'absolute',
    width: NOTCH_SIZE,
    height: NOTCH_SIZE,
    borderRadius: NOTCH_SIZE / 2,
    zIndex: 3,
  },
});

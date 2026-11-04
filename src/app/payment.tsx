import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { ThemedText } from '@/components/themed-text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { StatusBadge } from '@/components/order/StatusBadge';
import { useThemeContext } from '@/context/ThemeContext';
import { formatRupiah, toneColors } from '@/features/order/orderStatus';
import { formatCountdown, useCountdown } from '@/features/order/useCountdown';
import { useCancelOrder, useOrderDetail } from '@/features/order/useOrders';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import { confirmAction, showAlert } from '@/utils/alert';

/** Halaman pembayaran QRIS: tampilkan QR, hitung mundur, dan pantau status sampai dibayar. */
export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const theme = useTheme();
  const { isDark } = useThemeContext();

  const { data: order, isLoading, isError, refetch } = useOrderDetail(id, { pollWhileAwaitingPayment: true });
  const cancelOrder = useCancelOrder();
  const remaining = useCountdown(order?.paymentDueAt);

  const goToDetail = () => router.replace({ pathname: '/order-detail', params: { id: id ?? '' } });

  const handleCancel = async () => {
    if (!id) return;
    const ok = await confirmAction('Batalkan Pesanan?', 'QR pembayaran akan ditutup dan pesanan dibatalkan.', 'Batalkan');
    if (!ok) return;
    cancelOrder.mutate(
      { id },
      {
        onError: (error) => showAlert('Gagal Membatalkan', getApiErrorMessage(error, 'Pesanan tidak dapat dibatalkan.')),
      }
    );
  };

  const handleOpenQr = async () => {
    if (order?.payment?.qrUrl) {
      await WebBrowser.openBrowserAsync(order.payment.qrUrl);
    }
  };

  const renderBody = () => {
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    if (isError || !order) {
      return (
        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText style={[styles.title, { color: theme.text }]}>Pesanan tidak ditemukan</ThemedText>
          <Pressable onPress={() => refetch()} style={[styles.primaryBtn, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.primaryBtnText}>↻ Coba Lagi</ThemedText>
          </Pressable>
        </View>
      );
    }

    // Sudah dibayar
    if (order.statusCode === 'PAID' || order.statusCode === 'IN_PROGRESS' || order.statusCode === 'COMPLETED') {
      const good = toneColors('success', isDark);
      return (
        <View style={[styles.card, styles.centerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.resultIcon, { backgroundColor: good.bg }]}>
            <ThemedText style={[styles.resultIconText, { color: good.text }]}>✓</ThemedText>
          </View>
          <ThemedText style={[styles.title, { color: theme.text }]}>Pembayaran Berhasil</ThemedText>
          <ThemedText style={[styles.amount, { color: theme.text }]}>{formatRupiah(order.grandTotal)}</ThemedText>
          <ThemedText style={[styles.muted, { color: theme.textSecondary }]}>{order.orderNumber}</ThemedText>
          <Pressable onPress={goToDetail} style={[styles.primaryBtn, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.primaryBtnText}>Lihat Pesanan →</ThemedText>
          </Pressable>
        </View>
      );
    }

    // Ditutup tanpa pembayaran
    if (order.statusCode !== 'AWAITING_PAYMENT') {
      const bad = toneColors('danger', isDark);
      return (
        <View style={[styles.card, styles.centerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.resultIcon, { backgroundColor: bad.bg }]}>
            <ThemedText style={[styles.resultIconText, { color: bad.text }]}>✕</ThemedText>
          </View>
          <StatusBadge kind="order" status={order.statusCode} />
          <ThemedText style={[styles.muted, { color: theme.textSecondary }]}>
            {order.cancelReason ?? 'Pesanan ini sudah tidak dapat dibayar.'}
          </ThemedText>
          <Pressable onPress={() => router.replace('/order')} style={[styles.primaryBtn, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.primaryBtnText}>🍲 Pesan Lagi</ThemedText>
          </Pressable>
        </View>
      );
    }

    // Menunggu pembayaran: tampilkan QR
    const expired = remaining === 0;
    const warn = toneColors(expired ? 'danger' : 'warning', isDark);
    return (
      <View style={[styles.card, styles.centerCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <ThemedText style={[styles.muted, { color: theme.textSecondary }]}>Total Bayar</ThemedText>
        <ThemedText style={[styles.amount, { color: theme.text }]}>{formatRupiah(order.grandTotal)}</ThemedText>

        <View style={[styles.timerPill, { backgroundColor: warn.bg }]}>
          <ThemedText style={[styles.timerText, { color: warn.text }]}>
            {expired ? '⌛ Waktu habis' : `⏱ ${formatCountdown(remaining)}`}
          </ThemedText>
        </View>

        <View style={styles.qrBox}>
          {order.payment?.qrUrl ? (
            <Image
              source={{ uri: order.payment.qrUrl }}
              style={styles.qrImage}
              contentFit="contain"
              accessibilityLabel="Kode QR QRIS"
            />
          ) : (
            <ActivityIndicator color="#0F172A" />
          )}
        </View>

        <ThemedText style={[styles.qrisLabel, { color: theme.text }]}>QRIS</ThemedText>
        <ThemedText style={[styles.muted, { color: theme.textSecondary }]}>
          📱 Scan dengan e-wallet atau m-banking
        </ThemedText>

        {Platform.OS !== 'web' && order.payment?.qrUrl ? (
          <Pressable onPress={handleOpenQr} style={[styles.secondaryBtn, { borderColor: theme.border }]}>
            <ThemedText style={[styles.secondaryBtnText, { color: theme.text }]}>⤓ Buka / Simpan Gambar QR</ThemedText>
          </Pressable>
        ) : null}

        <View style={[styles.waitingRow, { borderTopColor: theme.border }]}>
          <ActivityIndicator size="small" color={theme.primary} />
          <ThemedText style={[styles.muted, { color: theme.textSecondary }]}>Menunggu pembayaran…</ThemedText>
        </View>

        <View style={styles.actionsRow}>
          <Pressable onPress={goToDetail} style={[styles.secondaryBtn, styles.flex1, { borderColor: theme.border }]}>
            <ThemedText style={[styles.secondaryBtnText, { color: theme.text }]}>🧾 Rincian</ThemedText>
          </Pressable>
          <Pressable
            onPress={handleCancel}
            disabled={cancelOrder.isPending}
            style={[styles.secondaryBtn, styles.flex1, { borderColor: theme.danger, opacity: cancelOrder.isPending ? 0.6 : 1 }]}
          >
            <ThemedText style={[styles.secondaryBtnText, { color: theme.danger }]}>✕ Batalkan</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Pembayaran" subtitle={order?.orderNumber} fallbackHref="/orders" />
      <ScrollView contentContainerStyle={styles.scroll}>{renderBody()}</ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, paddingBottom: 40 },
  center: { paddingVertical: 60, alignItems: 'center' },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 10,
  },
  centerCard: { alignItems: 'center' },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  amount: { fontSize: 28, fontWeight: '800' },
  muted: { fontSize: 13, textAlign: 'center' },
  timerPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999 },
  timerText: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  qrBox: {
    marginTop: 6,
    width: 256,
    height: 256,
    borderRadius: 16,
    backgroundColor: '#FFFFFF', // QR selalu di atas putih agar terbaca scanner (juga di dark mode)
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: { width: '100%', height: '100%' },
  qrisLabel: { fontSize: 14, fontWeight: '800', letterSpacing: 2 },
  waitingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderTopWidth: 1,
    paddingTop: 12,
    marginTop: 4,
    alignSelf: 'stretch',
    justifyContent: 'center',
  },
  actionsRow: { flexDirection: 'row', gap: 10, alignSelf: 'stretch' },
  flex1: { flex: 1 },
  primaryBtn: {
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  secondaryBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  secondaryBtnText: { fontSize: 13, fontWeight: '600' },
  resultIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  resultIconText: { fontSize: 30, fontWeight: '800' },
});

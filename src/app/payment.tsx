import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';

import { ThemedText } from '@/components/themed-text';
import { StatusBadge } from '@/components/order/StatusBadge';
import { ScreenHeaderBar } from '@/components/ui/ScreenHeaderBar';
import { Brand } from '@/constants/theme';
import { useThemeContext } from '@/context/ThemeContext';
import { formatRupiah, formatShortDate, toneColors } from '@/features/order/orderStatus';
import { formatCountdown, useCountdown } from '@/features/order/useCountdown';
import { useCancelOrder, useOrderDetail, usePaymentStatus } from '@/features/order/useOrders';
import { useCustomerLayout } from '@/hooks/use-customer-layout';
import { getApiErrorMessage } from '@/services/apiError';
import { OrderDetail } from '@/types/order';
import { confirmAction, showAlert } from '@/utils/alert';

const PAID_STATUSES = ['PAID', 'IN_PROGRESS', 'COMPLETED'];

/** Simpan gambar QR. Web: unduh file; bila diblokir (CORS), buka di tab baru. Ponsel: buka di browser. */
async function saveQrImage(url: string, orderNumber: string) {
  if (Platform.OS !== 'web') {
    await WebBrowser.openBrowserAsync(url);
    return;
  }
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blobUrl = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `QRIS-${orderNumber}.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch {
    window.open(url, '_blank', 'noopener');
  }
}

/** Satu baris "label ...... nilai" di Rincian Pesanan. */
const Line: React.FC<{ label: string; value: string; strong?: boolean }> = ({ label, value, strong }) => {
  const { theme } = useThemeContext();
  return (
    <View style={styles.line}>
      <ThemedText style={[styles.lineLabel, { color: strong ? theme.text : theme.textSecondary }, strong && styles.strong]}>
        {label}
      </ThemedText>
      <ThemedText style={[styles.lineValue, { color: theme.text }, strong && styles.strong]}>{value}</ThemedText>
    </View>
  );
};

/** Rincian Pesanan: bisa dibuka/tutup; berisi menu per hari dan ringkasan biaya. */
const OrderBreakdown: React.FC<{ order: OrderDetail }> = ({ order }) => {
  const { theme, isDark } = useThemeContext();
  const [isOpen, setIsOpen] = useState(false);
  const cardBg = isDark ? '#18181B' : '#FFFFFF';

  return (
    <View style={[styles.sectionCard, { backgroundColor: cardBg, borderColor: theme.border }]}>
      <Pressable
        onPress={() => setIsOpen((v) => !v)}
        accessibilityRole="button"
        accessibilityState={{ expanded: isOpen }}
        style={[styles.accordionHeader, styles.clickable]}
      >
        <ThemedText style={[styles.accordionTitle, { color: theme.text }]}>Rincian Pesanan</ThemedText>
        <View style={{ transform: [{ rotate: isOpen ? '180deg' : '0deg' }] }}>
          {Platform.OS === 'web' ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={theme.text} strokeWidth="2.4"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <polyline points="6 9 12 15 18 9" />
            </svg>
          ) : (
            <ThemedText style={{ color: theme.text }}>▾</ThemedText>
          )}
        </View>
      </Pressable>

      {isOpen ? (
        <View style={[styles.accordionBody, { borderTopColor: theme.border }]}>
          {order.days.map((day) => (
            <View key={day.id} style={styles.dayBlock}>
              <ThemedText style={[styles.dayTitle, { color: theme.text }]}>
                {/* formatShortDate → "Min, 8 Nov"; ambil tanggalnya saja, nama hari lengkap dari server */}
                {day.dayName}, {formatShortDate(day.deliveryDate).split(', ')[1]}
              </ThemedText>
              {day.items.map((item) => (
                <Line key={item.id} label={`${item.menuName} × ${item.qty}`} value={formatRupiah(item.lineTotal)} />
              ))}
            </View>
          ))}

          <View style={[styles.summary, { borderTopColor: theme.border }]}>
            <Line label="Subtotal" value={formatRupiah(order.subtotal)} />
            {order.discountAmount > 0 ? (
              <Line label="Diskon" value={`- ${formatRupiah(order.discountAmount)}`} />
            ) : null}
            <Line
              label={order.fulfillmentType === 'PICKUP' ? 'Ambil sendiri' : 'Ongkos kirim'}
              value={order.deliveryFee > 0 ? formatRupiah(order.deliveryFee) : 'Gratis'}
            />
            <Line label="Total" value={formatRupiah(order.grandTotal)} strong />
          </View>
        </View>
      ) : null}
    </View>
  );
};

/** Halaman pembayaran QRIS: tampilkan QR & pantau status (ringan) sampai dibayar. */
export default function PaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { theme, isDark } = useThemeContext();
  const { width } = useCustomerLayout();
  const isDesktop = width > 768;

  // Detail lengkap diambil sekali; yang di-poll tiap 5 detik hanya status pembayaran.
  const { data: order, isLoading, isError, refetch } = useOrderDetail(id);
  usePaymentStatus(id, order?.statusCode);

  const cancelOrder = useCancelOrder();
  const remaining = useCountdown(order?.paymentDueAt);
  const [isSaving, setIsSaving] = useState(false);

  const cardBg = isDark ? '#18181B' : '#FFFFFF';
  const goHome = () => router.replace('/');
  const goToDetail = () => router.replace({ pathname: '/order-detail', params: { id: id ?? '' } });

  const handleCancel = async () => {
    if (!id) return;
    const ok = await confirmAction('Batalkan Pesanan?', 'QR pembayaran akan ditutup dan pesanan dibatalkan.', 'Batalkan');
    if (!ok) return;
    cancelOrder.mutate(
      { id },
      { onError: (error) => showAlert('Gagal Membatalkan', getApiErrorMessage(error, 'Pesanan tidak dapat dibatalkan.')) }
    );
  };

  const handleSave = async () => {
    if (!order?.payment?.qrUrl) return;
    setIsSaving(true);
    try {
      await saveQrImage(order.payment.qrUrl, order.orderNumber);
    } finally {
      setIsSaving(false);
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
        <View style={[styles.sectionCard, styles.centerCard, { backgroundColor: cardBg, borderColor: theme.border }]}>
          <ThemedText style={[styles.title, { color: theme.text }]}>Pesanan tidak ditemukan</ThemedText>
          <Pressable onPress={() => refetch()} style={[styles.primaryBtn, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.primaryBtnText}>Coba Lagi</ThemedText>
          </Pressable>
        </View>
      );
    }

    // Sudah dibayar
    if (PAID_STATUSES.includes(order.statusCode)) {
      const good = toneColors('success', isDark);
      return (
        <View style={[styles.sectionCard, styles.centerCard, { backgroundColor: cardBg, borderColor: theme.border }]}>
          <View style={[styles.resultIcon, { backgroundColor: good.bg }]}>
            <ThemedText style={[styles.resultIconText, { color: good.text }]}>✓</ThemedText>
          </View>
          <ThemedText style={[styles.title, { color: theme.text }]}>Pembayaran Berhasil</ThemedText>
          <ThemedText style={[styles.amount, { color: theme.text }]}>{formatRupiah(order.grandTotal)}</ThemedText>
          <ThemedText style={[styles.muted, { color: theme.textSecondary }]}>{order.orderNumber}</ThemedText>
          <Pressable onPress={goToDetail} style={[styles.primaryBtn, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.primaryBtnText}>Lihat Pesanan</ThemedText>
          </Pressable>
        </View>
      );
    }

    // Ditutup tanpa pembayaran (kedaluwarsa / dibatalkan)
    if (order.statusCode !== 'AWAITING_PAYMENT') {
      const bad = toneColors('danger', isDark);
      return (
        <View style={[styles.sectionCard, styles.centerCard, { backgroundColor: cardBg, borderColor: theme.border }]}>
          <View style={[styles.resultIcon, { backgroundColor: bad.bg }]}>
            <ThemedText style={[styles.resultIconText, { color: bad.text }]}>✕</ThemedText>
          </View>
          <StatusBadge kind="order" status={order.statusCode} />
          <ThemedText style={[styles.muted, { color: theme.textSecondary }]}>
            {order.cancelReason ?? 'Pesanan ini sudah tidak dapat dibayar.'}
          </ThemedText>
          <Pressable onPress={() => router.replace('/order')} style={[styles.primaryBtn, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.primaryBtnText}>Pesan Lagi</ThemedText>
          </Pressable>
        </View>
      );
    }

    // Menunggu pembayaran
    const expired = remaining === 0;
    const timer = toneColors(expired ? 'danger' : 'warning', isDark);
    const qrUrl = order.payment?.qrUrl;

    return (
      <>
        {/* Nomor pesanan */}
        <View style={[styles.orderNumberCard, { backgroundColor: theme.backgroundElement }]}>
          <ThemedText style={[styles.orderNumber, { color: theme.text }]} selectable>
            {order.orderNumber}
          </ThemedText>
        </View>

        {/* Nominal + QR */}
        <View style={[styles.sectionCard, styles.qrCard, { backgroundColor: theme.backgroundElement, borderColor: 'transparent' }]}>
          <ThemedText style={[styles.amount, { color: theme.text }]}>{formatRupiah(order.grandTotal)}</ThemedText>
          <View style={[styles.timerPill, { backgroundColor: timer.bg }]}>
            <ThemedText style={[styles.timerText, { color: timer.text }]}>
              {expired ? 'Waktu pembayaran habis' : `Bayar dalam ${formatCountdown(remaining)}`}
            </ThemedText>
          </View>

          <View style={styles.qrFrame}>
            <View style={styles.qrBox}>
              {qrUrl ? (
                <Image
                  source={{ uri: qrUrl }}
                  style={[styles.qrImage, expired && styles.qrExpired]}
                  contentFit="contain"
                  accessibilityLabel="Kode QR QRIS"
                />
              ) : (
                <ActivityIndicator color={Brand.navy} />
              )}
            </View>
            <View style={[styles.qrisBand, { backgroundColor: isDark ? '#2A2A2E' : Brand.navy }]}>
              <ThemedText style={styles.qrisBandText}>QRIS</ThemedText>
            </View>
          </View>

          <Pressable
            onPress={handleSave}
            disabled={!qrUrl || expired || isSaving}
            accessibilityRole="button"
            accessibilityLabel="Simpan gambar QR"
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: isDark ? '#2A2A2E' : Brand.navy,
                opacity: !qrUrl || expired ? 0.5 : pressed ? 0.85 : 1,
              },
              styles.clickable,
            ]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.actionBtnText}>Simpan</ThemedText>
            )}
          </Pressable>

          <Pressable
            onPress={handleCancel}
            disabled={cancelOrder.isPending}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.actionBtn,
              { backgroundColor: Brand.red, opacity: cancelOrder.isPending ? 0.6 : pressed ? 0.85 : 1 },
              styles.clickable,
            ]}
          >
            {cancelOrder.isPending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.actionBtnText}>Batalkan Pesanan</ThemedText>
            )}
          </Pressable>

          <View style={styles.waitingRow}>
            <ActivityIndicator size="small" color={theme.primary} />
            <ThemedText style={[styles.muted, { color: theme.textSecondary }]}>
              Menunggu pembayaran. Scan dengan e-wallet atau m-banking.
            </ThemedText>
          </View>
        </View>

        <OrderBreakdown order={order} />
      </>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeaderBar
        title="Selesaikan Pembayaran"
        icon="home"
        onBack={goHome}
        maxWidth={isDesktop ? 600 : '100%'}
      />
      <ScrollView contentContainerStyle={[styles.scroll, { maxWidth: isDesktop ? 600 : '100%' }]}>
        {renderBody()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { width: '100%', alignSelf: 'center', padding: 16, paddingBottom: 40, gap: 14 },
  center: { paddingVertical: 60, alignItems: 'center' },
  sectionCard: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  centerCard: { alignItems: 'center', padding: 24, gap: 10 },
  orderNumberCard: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  orderNumber: { fontSize: 15, fontWeight: '600', letterSpacing: 0.5 },
  qrCard: { alignItems: 'center', padding: 20, gap: 12 },
  title: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  amount: { fontSize: 30, lineHeight: 38, fontWeight: '800' },
  muted: { fontSize: 13, textAlign: 'center', flexShrink: 1 },
  timerPill: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 999 },
  timerText: { fontSize: 13, fontWeight: '700', fontVariant: ['tabular-nums'] },
  qrFrame: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    overflow: 'hidden',
  },
  qrBox: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF', // QR selalu di atas putih agar terbaca scanner (juga di dark mode)
    padding: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: { width: '100%', height: '100%' },
  qrExpired: { opacity: 0.2 },
  qrisBand: { paddingVertical: 10, alignItems: 'center' },
  qrisBandText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800', letterSpacing: 2 },
  actionBtn: {
    width: '100%',
    maxWidth: 380,
    height: 46,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  waitingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 16,
  },
  accordionTitle: { fontSize: 14, fontWeight: '700' },
  accordionBody: { borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 18, paddingVertical: 12, gap: 12 },
  dayBlock: { gap: 4 },
  dayTitle: { fontSize: 13, fontWeight: '700', marginBottom: 2 },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  lineLabel: { fontSize: 13, flex: 1 },
  lineValue: { fontSize: 13, fontVariant: ['tabular-nums'] },
  strong: { fontSize: 14, fontWeight: '700' },
  summary: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 4 },
  primaryBtn: {
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 12,
    ...Platform.select({ web: { cursor: 'pointer' } as object }),
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  resultIcon: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
  resultIconText: { fontSize: 30, fontWeight: '800' },
  clickable: Platform.select({ web: { cursor: 'pointer' } as object, default: {} }) as object,
});

import React from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { CheckoutHeader } from '@/components/checkout/CheckoutHeader';
import { CheckoutStickyFooter } from '@/components/checkout/CheckoutStickyFooter';
import { FulfillmentMethodCard } from '@/components/checkout/FulfillmentMethodCard';
import { OrderItemsSummaryCard } from '@/components/checkout/OrderItemsSummaryCard';
import { PaymentDetailCard } from '@/components/checkout/PaymentDetailCard';
import { PaymentMethodCard } from '@/components/checkout/PaymentMethodCard';
import { PromoCodeCard } from '@/components/checkout/PromoCodeCard';
import { useCheckoutPalette } from '@/components/checkout/checkoutPalette';
import { useCreateOrder } from '@/features/order/useOrders';
import { useScrollActivity } from '@/hooks/use-scroll-activity';
import { getApiErrorMessage } from '@/services/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { showAlert } from '@/utils/alert';

export default function CheckoutScreen() {
  const router = useRouter();
  const palette = useCheckoutPalette();

  const token = useAuthStore((s) => s.token);
  const selectedDateKeys = useCartStore((s) => s.selectedDateKeys);
  const getTotalItemsCount = useCartStore((s) => s.getTotalItemsCount);
  const totalItemsCount = getTotalItemsCount();
  const fulfillmentType = useCartStore((s) => s.fulfillmentType);
  const selectedAddressId = useCartStore((s) => s.selectedAddressId);
  const notes = useCartStore((s) => s.notes);
  const buildOrderDays = useCartStore((s) => s.buildOrderDays);
  const clearCart = useCartStore((s) => s.clearCart);

  const createOrder = useCreateOrder();
  const { isScrolling, onScroll } = useScrollActivity();

  const isCartEmpty = selectedDateKeys.length === 0 || totalItemsCount === 0;

  const handlePay = () => {
    if (!token) {
      showAlert('Masuk Dulu', 'Silakan masuk ke akun Anda untuk melanjutkan pembayaran.', { tone: 'warning' });
      router.push('/login');
      return;
    }

    if (fulfillmentType === 'DELIVERY' && !selectedAddressId) {
      showAlert('Alamat Belum Dipilih', 'Tambahkan atau pilih alamat pengantaran terlebih dahulu.', { tone: 'warning' });
      return;
    }

    const days = buildOrderDays();
    if (days.length === 0) {
      showAlert('Keranjang Kosong', 'Belum ada menu yang dipilih.', { tone: 'warning' });
      return;
    }

    createOrder.mutate(
      {
        fulfillmentType,
        addressId: fulfillmentType === 'DELIVERY' ? selectedAddressId : null,
        notes: notes.trim() || null,
        days,
      },
      {
        onSuccess: (order) => {
          clearCart();
          router.replace({ pathname: '/payment', params: { id: order.orderId } });
        },
        onError: (error) => {
          showAlert('Pesanan Gagal Dibuat', getApiErrorMessage(error, 'Terjadi kesalahan saat membuat pesanan.'), { tone: 'error' });
        },
      }
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: palette.pageBg }]}>
      {/* 1. Header with circular back button and title */}
      <CheckoutHeader />

      {/* 2. Scrollable Body Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
      >
        <View style={styles.mainContainer}>
          {isCartEmpty ? (
            /* Empty Cart Placeholder if accessed without items */
            <View style={[styles.emptyCard, { backgroundColor: palette.cardBg }]}>
              <ThemedText style={[styles.emptyTitle, { color: palette.cardTitle }]}>
                Keranjang Kosong
              </ThemedText>
              <ThemedText style={[styles.emptySubtitle, { color: palette.cardSubtext }]}>
                Belum ada menu MPASI yang dipilih. Silakan tentukan tanggal dan porsi pesananmu terlebih dahulu.
              </ThemedText>
              <Pressable
                onPress={() => router.replace('/order')}
                style={({ pressed }) => [
                  styles.backToOrderBtn,
                  {
                    backgroundColor: palette.actionPillBtnBg,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <ThemedText style={[styles.backToOrderBtnText, { color: palette.actionPillBtnText }]}>
                  Pilih Menu Katering
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <>
              {/* Card 1: Fulfillment Method (Pesan Antar vs Ambil Sendiri) */}
              <FulfillmentMethodCard />

              {/* Card 2: Pesananmu Summary (Berdasarkan: Hari / Kategori) */}
              <OrderItemsSummaryCard />

              {/* Card 3: Metode Pembayaran (QRIS; Tunai belum tersedia) */}
              <PaymentMethodCard />

              {/* Card 4: Kode Promo (tampilan saja, belum terhubung ke backend) */}
              <PromoCodeCard />

              {/* Card 5: Detail Pembayaran Breakdown */}
              <PaymentDetailCard />
            </>
          )}
        </View>
      </ScrollView>

      {/* 3. Sticky Bottom Footer: Bayar QRIS */}
      {!isCartEmpty ? (
        <CheckoutStickyFooter
          onPayPress={handlePay}
          isSubmitting={createOrder.isPending}
          compact={isScrolling}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 110,
  },
  mainContainer: {
    width: '100%',
    alignSelf: 'center',
    gap: 16,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
      },
    }),
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    maxWidth: 320,
  },
  backToOrderBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backToOrderBtnText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

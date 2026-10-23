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
import { CouponCard } from '@/components/checkout/CouponCard';
import { FulfillmentMethodCard } from '@/components/checkout/FulfillmentMethodCard';
import { OrderItemsSummaryCard } from '@/components/checkout/OrderItemsSummaryCard';
import { PaymentDetailCard } from '@/components/checkout/PaymentDetailCard';
import { useCheckoutPalette } from '@/components/checkout/checkoutPalette';
import { useCartStore } from '@/store/useCartStore';

export default function CheckoutScreen() {
  const router = useRouter();
  const palette = useCheckoutPalette();

  const selectedDateKeys = useCartStore((s) => s.selectedDateKeys);
  const getTotalItemsCount = useCartStore((s) => s.getTotalItemsCount);
  const totalItemsCount = getTotalItemsCount();

  const isCartEmpty = selectedDateKeys.length === 0 || totalItemsCount === 0;

  return (
    <View style={[styles.root, { backgroundColor: palette.pageBg }]}>
      {/* 1. Header with circular back button and title */}
      <CheckoutHeader />

      {/* 2. Scrollable Body Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
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

              {/* Card 3: Kupon / Voucher Promo */}
              <CouponCard />

              {/* Card 4: Detail Pembayaran Breakdown */}
              <PaymentDetailCard />
            </>
          )}
        </View>
      </ScrollView>

      {/* 3. Sticky Bottom Footer (Inert Bayar button) */}
      {!isCartEmpty ? (
        <CheckoutStickyFooter />
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
    maxWidth: 600,
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

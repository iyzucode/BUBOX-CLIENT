import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useAddresses } from '@/features/biodata/useAddresses';
import { FulfillmentType, useCartStore } from '@/store/useCartStore';
import { useCheckoutPalette } from './checkoutPalette';

export const FulfillmentMethodCard: React.FC = () => {
  const router = useRouter();
  const palette = useCheckoutPalette();

  const fulfillmentType = useCartStore((s) => s.fulfillmentType);
  const setFulfillmentType = useCartStore((s) => s.setFulfillmentType);
  const selectedAddressId = useCartStore((s) => s.selectedAddressId);
  const setSelectedAddressId = useCartStore((s) => s.setSelectedAddressId);

  // Fetch user addresses from API
  const { data: addresses } = useAddresses();

  // Find active selected address or default to primary address or first available
  const activeAddress = React.useMemo(() => {
    if (!addresses || addresses.length === 0) return null;
    if (selectedAddressId) {
      const found = addresses.find((a) => a.id === selectedAddressId);
      if (found) return found;
    }
    const primary = addresses.find((a) => a.isPrimary);
    return primary || addresses[0];
  }, [addresses, selectedAddressId]);

  // Synchronize initial selectedAddressId once fetched
  React.useEffect(() => {
    if (activeAddress && !selectedAddressId) {
      setSelectedAddressId(activeAddress.id);
    }
  }, [activeAddress, selectedAddressId, setSelectedAddressId]);

  const handleSelectMethod = (type: FulfillmentType) => {
    setFulfillmentType(type);
  };

  const handleEditAddress = () => {
    router.push('/addresses');
  };

  const isDelivery = fulfillmentType === 'DELIVERY';

  return (
    <View style={[styles.card, { backgroundColor: palette.cardBg }]}>
      {/* 1. Title */}
      <ThemedText style={[styles.cardTitle, { color: palette.cardTitle }]}>
        Metode Pemesanan
      </ThemedText>

      {/* 2. Two Options: Pesan Antar vs Ambil Sendiri */}
      <View style={styles.optionsRow}>
        {/* Option A: Pesan Antar */}
        <Pressable
          onPress={() => handleSelectMethod('DELIVERY')}
          style={({ pressed }) => [
            styles.optionBtn,
            {
              backgroundColor: isDelivery
                ? palette.optionActiveBg
                : palette.optionBg,
              borderColor: isDelivery
                ? palette.optionActiveBorder
                : palette.optionBorder,
            },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Pilih Pesan Antar"
        >
          <View style={styles.optionTextCol}>
            <ThemedText style={[styles.optionTitle, { color: palette.optionText }]}>
              Pesan Antar
            </ThemedText>
            <ThemedText style={[styles.optionSubtext, { color: palette.optionSubtext }]}>
              Langsung ke alamatmu
            </ThemedText>
          </View>

          {/* Pin Location Icon */}
          <View style={styles.iconWrapper}>
            {Platform.OS === 'web' ? (
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill={palette.optionIconColor}
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
            ) : (
              <ThemedText style={[styles.fallbackIcon, { color: palette.optionIconColor }]}>
                📍
              </ThemedText>
            )}
          </View>
        </Pressable>

        {/* Option B: Ambil Sendiri */}
        <Pressable
          onPress={() => handleSelectMethod('PICKUP')}
          style={({ pressed }) => [
            styles.optionBtn,
            {
              backgroundColor: !isDelivery
                ? palette.optionActiveBg
                : palette.optionBg,
              borderColor: !isDelivery
                ? palette.optionActiveBorder
                : palette.optionBorder,
            },
            pressed && styles.pressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Pilih Ambil Sendiri"
        >
          <View style={styles.optionTextCol}>
            <ThemedText style={[styles.optionTitle, { color: palette.optionText }]}>
              Ambil Sendiri
            </ThemedText>
            <ThemedText style={[styles.optionSubtext, { color: palette.optionSubtext }]}>
              Dari outlet terdekat
            </ThemedText>
          </View>

          {/* Storefront Icon */}
          <View style={styles.iconWrapper}>
            {Platform.OS === 'web' ? (
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke={palette.optionIconColor}
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path d="M9 22V12h6v10" />
              </svg>
            ) : (
              <ThemedText style={[styles.fallbackIcon, { color: palette.optionIconColor }]}>
                🏪
              </ThemedText>
            )}
          </View>
        </Pressable>
      </View>

      {/* 3. Address or Outlet Detail Box */}
      <View style={[styles.detailBox, { backgroundColor: palette.nestedBoxBg }]}>
        {isDelivery ? (
          /* Case Delivery: User Address */
          <>
            <View style={styles.detailTextCol}>
              <ThemedText style={[styles.detailTitle, { color: palette.cardTitle }]} numberOfLines={1}>
                {activeAddress?.label || 'Alamat Pengantaran'}
              </ThemedText>
              <ThemedText style={[styles.detailSubtext, { color: palette.cardSubtext }]} numberOfLines={2}>
                {activeAddress
                  ? `${activeAddress.fullAddress}${activeAddress.subdistrict ? `, ${activeAddress.subdistrict}` : ''}`
                  : 'Belum ada alamat pengantaran yang dipilih.'}
              </ThemedText>
            </View>

            <Pressable
              onPress={handleEditAddress}
              style={({ pressed }) => [
                styles.actionPillBtn,
                { backgroundColor: palette.actionPillBtnBg },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Ubah alamat"
            >
              <ThemedText style={[styles.actionPillBtnText, { color: palette.actionPillBtnText }]}>
                Ubah
              </ThemedText>
            </Pressable>
          </>
        ) : (
          /* Case Pickup: Default Outlet (Outlet Luanna Brosot) */
          <>
            <View style={styles.detailTextCol}>
              <ThemedText style={[styles.detailTitle, { color: palette.cardTitle }]} numberOfLines={1}>
                Outlet Luanna Brosot
              </ThemedText>
              <ThemedText style={[styles.detailSubtext, { color: palette.cardSubtext }]} numberOfLines={2}>
                Jl. Brosot - Galur, Kulon Progo, D.I. Yogyakarta (Pengambilan pkl 06.30 - 09.00 WIB)
              </ThemedText>
            </View>

            <Pressable
              onPress={() => {}}
              style={({ pressed }) => [
                styles.actionPillBtn,
                { backgroundColor: palette.actionPillBtnBg },
                pressed && styles.pressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel="Pilih outlet"
            >
              <ThemedText style={[styles.actionPillBtnText, { color: palette.actionPillBtnText }]}>
                Ubah
              </ThemedText>
            </Pressable>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 24,
    padding: 16,
    gap: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '500',
    letterSpacing: -0.2,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  optionBtn: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.5,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 80,
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  optionTextCol: {
    flex: 1,
    gap: 2,
    paddingRight: 6,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionSubtext: {
    fontSize: 10,
    lineHeight: 13,
  },
  iconWrapper: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIcon: {
    fontSize: 22,
  },
  detailBox: {
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  detailTextCol: {
    flex: 1,
    gap: 2,
  },
  detailTitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailSubtext: {
    fontSize: 11,
    lineHeight: 15,
  },
  actionPillBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { cursor: 'pointer' } as any,
    }),
  },
  actionPillBtnText: {
    fontSize: 12,
    fontWeight: '500',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

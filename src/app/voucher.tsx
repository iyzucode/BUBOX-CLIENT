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
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ScreenHeaderBar } from '@/components/ui/ScreenHeaderBar';
import { VoucherTicket } from '@/components/voucher/VoucherTicket';
import { useCheckVoucher, useAvailableVouchers } from '@/features/voucher/useVouchers';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import { useCartStore } from '@/store/useCartStore';
import { VoucherOption } from '@/types/voucher';

/** Pilih voucher dari daftar, atau masukkan kode (termasuk voucher rahasia). */
export default function VoucherScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const token = useAuthStore((s) => s.token);
  const subtotal = useCartStore((s) => s.getSubtotal());
  const selectedVoucher = useCartStore((s) => s.selectedVoucher);
  const setSelectedVoucher = useCartStore((s) => s.setSelectedVoucher);

  const { data: vouchers, isPending, isError, error, refetch } = useAvailableVouchers(subtotal);
  const checkVoucher = useCheckVoucher();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/checkout');
  };

  const choose = (voucher: VoucherOption) => {
    setSelectedVoucher(voucher);
    goBack();
  };

  const handleToggle = (voucher: VoucherOption) => {
    if (selectedVoucher?.id === voucher.id) {
      setSelectedVoucher(null); // ketuk lagi = batal pakai
      return;
    }
    if (voucher.isEligible) choose(voucher);
  };

  const handleApplyCode = () => {
    const trimmed = code.trim();
    if (!trimmed || checkVoucher.isPending) return;
    setCodeError(null);
    checkVoucher.mutate(
      { code: trimmed, subtotal, paymentMethod: 'QRIS' },
      {
        onSuccess: (voucher) => {
          if (voucher.isEligible) choose(voucher);
          else setCodeError(voucher.ineligibleReason ?? 'Voucher belum bisa dipakai.');
        },
        onError: (err) => setCodeError(getApiErrorMessage(err, 'Kode voucher tidak dapat dicek.')),
      }
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeaderBar title="Pilih atau Masukkan Voucher" onBack={goBack} />

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 16) + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        {!token ? (
          <ThemedText style={[styles.empty, { color: theme.textSecondary }]}>
            Masuk ke akunmu untuk melihat dan memakai voucher.
          </ThemedText>
        ) : (
          <>
            {/* Kolom kode voucher */}
            <View style={[styles.codeBox, { backgroundColor: theme.backgroundElement }]}>
              <View style={styles.codeRow}>
                <TextInput
                  value={code}
                  onChangeText={(text) => {
                    setCode(text.toUpperCase().replace(/\s/g, ''));
                    if (codeError) setCodeError(null);
                  }}
                  onSubmitEditing={handleApplyCode}
                  placeholder="Masukkan kode voucher"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="characters"
                  autoCorrect={false}
                  maxLength={30}
                  returnKeyType="done"
                  style={[styles.codeInput, { color: theme.text, backgroundColor: theme.card }]}
                  accessibilityLabel="Kode voucher"
                />
                <Pressable
                  onPress={handleApplyCode}
                  disabled={!code.trim() || checkVoucher.isPending}
                  style={({ pressed }) => [
                    styles.applyBtn,
                    {
                      backgroundColor: theme.primary,
                      opacity: !code.trim() ? 0.5 : pressed ? 0.85 : 1,
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel="Pakai kode voucher"
                >
                  {checkVoucher.isPending ? (
                    <ActivityIndicator size="small" color={theme.onPrimary} />
                  ) : (
                    <ThemedText style={[styles.applyText, { color: theme.onPrimary }]}>Pakai</ThemedText>
                  )}
                </Pressable>
              </View>
              {codeError ? (
                <ThemedText style={[styles.codeError, { color: theme.danger }]}>{codeError}</ThemedText>
              ) : null}
            </View>

            {/* Daftar voucher */}
            {isPending ? (
              <ActivityIndicator style={styles.loader} color={theme.primary} />
            ) : isError ? (
              <View style={styles.emptyWrap}>
                <ThemedText style={[styles.empty, { color: theme.textSecondary }]}>
                  {getApiErrorMessage(error, 'Gagal memuat voucher.')}
                </ThemedText>
                <Pressable onPress={() => refetch()} accessibilityRole="button">
                  <ThemedText style={[styles.retry, { color: theme.primary }]}>Coba lagi</ThemedText>
                </Pressable>
              </View>
            ) : vouchers.length === 0 ? (
              <ThemedText style={[styles.empty, { color: theme.textSecondary }]}>
                Belum ada voucher yang tersedia saat ini. Punya kode? Masukkan di atas.
              </ThemedText>
            ) : (
              vouchers.map((voucher) => (
                <VoucherTicket
                  key={voucher.id}
                  voucher={voucher}
                  subtotal={subtotal}
                  selected={selectedVoucher?.id === voucher.id}
                  action={
                    selectedVoucher?.id === voucher.id
                      ? { label: 'Dipakai', variant: 'outline', onPress: () => handleToggle(voucher) }
                      : { label: 'Pakai', disabled: !voucher.isEligible, onPress: () => handleToggle(voucher) }
                  }
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 14 },
  codeBox: { borderRadius: 18, padding: 10, gap: 8 },
  codeRow: { flexDirection: 'row', gap: 8 },
  codeInput: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    // 16px mencegah iOS Safari auto-zoom saat input difokuskan
    fontSize: 16,
    letterSpacing: 0.5,
    ...Platform.select({ web: { outlineWidth: 0 } }),
  },
  applyBtn: {
    height: 46,
    minWidth: 76,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  applyText: { fontSize: 15, fontWeight: '700' },
  codeError: { fontSize: 13, lineHeight: 18, paddingHorizontal: 4 },
  loader: { marginTop: 32 },
  emptyWrap: { alignItems: 'center', gap: 8, marginTop: 24 },
  empty: { fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 24 },
  retry: { fontSize: 14, fontWeight: '700' },
});

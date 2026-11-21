import React from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useOrderSettings, useUpdateOrderSettings } from '@/features/order/useOrders';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import { OrderSettings, UpdateOrderSettingsRequest } from '@/types/order';
import { showAlert } from '@/utils/alert';

/**
 * Kerangka halaman pengaturan pesanan (Cutoff, Pembayaran): memuat pengaturan dari server lalu
 * menampilkan form halaman itu. Form diberi key updatedAt agar di-reset dari data server setelah tersimpan.
 */
export function OrderSettingsScreen({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: (settings: OrderSettings) => React.ReactNode;
}) {
  const theme = useTheme();
  const { data: settings, isLoading, isError, error } = useOrderSettings();

  return (
    <View style={[settingsStyles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title={title} subtitle={subtitle} fallbackHref="/admin" />

      <ScrollView contentContainerStyle={settingsStyles.scroll}>
        {isLoading ? (
          <ActivityIndicator style={settingsStyles.loader} color={theme.primary} />
        ) : isError || !settings ? (
          <ThemedText style={[settingsStyles.small, { color: theme.textSecondary }]}>
            {getApiErrorMessage(error, 'Gagal memuat pengaturan.')}
          </ThemedText>
        ) : (
          children(settings)
        )}
      </ScrollView>
    </View>
  );
}

/**
 * Server menyimpan semua pengaturan pesanan sekaligus: tiap halaman hanya mengubah bagiannya sendiri,
 * bagian lain dikirim apa adanya dari data server.
 */
export function useSaveOrderSettings(settings: OrderSettings) {
  const update = useUpdateOrderSettings();

  const save = (changes: Partial<UpdateOrderSettingsRequest>) =>
    update.mutate(
      {
        cutoffDaysBefore: settings.cutoffDaysBefore,
        cutoffTime: settings.cutoffTime,
        timeZone: settings.timeZone,
        paymentTimeoutMinutes: settings.paymentTimeoutMinutes,
        deliveryFeeRule: settings.deliveryFeeRule,
        pickupFeeRule: settings.pickupFeeRule,
        serviceFeeType: settings.serviceFeeType,
        serviceFeeValue: settings.serviceFeeValue,
        taxPercent: settings.taxPercent,
        ...changes,
      },
      {
        onSuccess: () => showAlert('Tersimpan', 'Pengaturan berhasil diperbarui.', { tone: 'success' }),
        onError: (err) =>
          showAlert('Gagal Menyimpan', getApiErrorMessage(err, 'Pengaturan tidak dapat disimpan.'), { tone: 'error' }),
      }
    );

  return { save, isPending: update.isPending };
}

export function SettingsSaveButton({ onPress, isPending }: { onPress: () => void; isPending: boolean }) {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={isPending}
      style={[settingsStyles.saveBtn, { backgroundColor: theme.primary, opacity: isPending ? 0.6 : 1 }]}
    >
      {isPending ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText style={settingsStyles.saveText}>Simpan</ThemedText>}
    </Pressable>
  );
}

export const settingsStyles = StyleSheet.create({
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

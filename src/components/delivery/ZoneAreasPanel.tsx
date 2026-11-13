import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { WILAYAH_LEVEL_LABEL } from '@/features/delivery/deliveryUtils';
import { useZoneAreas } from '@/features/delivery/useDelivery';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import { DeliveryZone } from '@/types/delivery';

interface Props {
  zone: DeliveryZone;
}

/**
 * Daftar wilayah milik zona, baca-saja. Pemetaan diatur dari sisi wilayah (menu Wilayah Antar)
 * supaya satu wilayah hanya punya satu tempat untuk diubah.
 */
export const ZoneAreasPanel: React.FC<Props> = ({ zone }) => {
  const theme = useTheme();
  const router = useRouter();
  const areas = useZoneAreas(zone.id);

  const muted = { color: theme.textSecondary };
  const uncovered = (areas.data ?? []).filter((a) => !a.isCovered).length;

  return (
    <View style={[styles.panel, { borderTopColor: theme.border }]}>
      <View style={styles.headerRow}>
        <ThemedText style={[styles.small, styles.bold, { color: theme.text }]}>Wilayah zona ini</ThemedText>
        <Pressable
          onPress={() => router.push('/admin/delivery-areas')}
          style={({ pressed }) => [styles.linkBtn, { opacity: pressed ? 0.7 : 1 }]}
          accessibilityRole="link"
        >
          <ThemedText style={[styles.small, styles.bold, { color: theme.primary }]}>Atur di Wilayah Antar ›</ThemedText>
        </Pressable>
      </View>

      {areas.isLoading ? (
        <ActivityIndicator size="small" color={theme.primary} />
      ) : areas.isError ? (
        <ThemedText style={[styles.tiny, muted]}>{getApiErrorMessage(areas.error, 'Gagal memuat wilayah.')}</ThemedText>
      ) : (areas.data ?? []).length === 0 ? (
        <ThemedText style={[styles.tiny, muted]}>
          Belum ada wilayah. Buka menu Wilayah Antar, cari wilayahnya, lalu pilih zona {zone.name}.
        </ThemedText>
      ) : (
        <>
          <ThemedText style={[styles.tiny, muted]}>
            Wilayah turunannya otomatis ikut zona ini, kecuali yang dipilihkan zona lain.
          </ThemedText>
          {uncovered > 0 ? (
            <ThemedText style={[styles.tiny, styles.bold, { color: theme.warning }]}>
              ⚠ {uncovered} wilayah belum ditandai terjangkau, jadi pesanan ke sana masih ditolak.
            </ThemedText>
          ) : null}
          {(areas.data ?? []).map((area) => (
            <View key={area.code} style={[styles.row, { borderBottomColor: theme.border }]}>
              <View style={styles.flex1}>
                <ThemedText style={[styles.small, styles.bold, { color: theme.text }]}>
                  {area.name} <ThemedText style={[styles.tiny, muted]}>· {WILAYAH_LEVEL_LABEL[area.level]}</ThemedText>
                </ThemedText>
                <ThemedText style={[styles.tiny, muted]} numberOfLines={1}>
                  {area.path || 'Indonesia'} · {area.code}
                </ThemedText>
              </View>
              {!area.isCovered ? (
                <ThemedText style={[styles.tiny, styles.bold, { color: theme.warning }]}>Belum terjangkau</ThemedText>
              ) : null}
            </View>
          ))}
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  panel: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10, gap: 6 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  linkBtn: { paddingVertical: 2, ...Platform.select({ web: { cursor: 'pointer' } }) },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  flex1: { flex: 1 },
  small: { fontSize: 13 },
  tiny: { fontSize: 11 },
  bold: { fontWeight: '700' },
});

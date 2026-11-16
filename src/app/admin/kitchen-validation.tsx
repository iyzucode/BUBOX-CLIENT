import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { KitchenDateNav, KitchenRecapList } from '@/components/kitchen/KitchenParts';
import { ThemedText } from '@/components/themed-text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SelectModalPicker } from '@/components/ui/SelectModalPicker';
import { useThemeContext } from '@/context/ThemeContext';
import { useDrivers, useSetDayDriver } from '@/features/delivery/useDelivery';
import { useCancelKitchenRelease, useKitchenValidation, useReleaseKitchen } from '@/features/kitchen/useKitchen';
import { useGetMenuCategories } from '@/features/menu/useMenu';
import { addDaysKey, formatTime, shortOrderNumber } from '@/features/order/adminBoardUtils';
import { toDateKey } from '@/features/order/dateUtils';
import { formatDateTime, formatLongDate, toneColors } from '@/features/order/orderStatus';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import type { KitchenIssue } from '@/types/kitchen';
import { confirmAction, showAlert } from '@/utils/alert';

const clickable = Platform.select({ web: { cursor: 'pointer' as const } }) ?? {};
const ZONE_DRIVER = '__ZONE__';

type CheckState = 'ok' | 'wait' | 'warn';

/**
 * Validasi Dapur (admin, H-1): periksa pesanan satu tanggal kirim setelah cutoff + batas waktu bayar, lalu rilis
 * ke dapur. Dapur hanya melihat tanggal yang sudah dirilis.
 */
export default function KitchenValidationScreen() {
  const theme = useTheme();
  const { isDark } = useThemeContext();
  const [date, setDate] = useState(() => addDaysKey(toDateKey(new Date()), 1));
  const [driverIds, setDriverIds] = useState<string[] | null>(null);

  const { data, isPending, isError, error, refetch, isFetching } = useKitchenValidation(date);
  const { data: categories } = useGetMenuCategories();
  const release = useReleaseKitchen();
  const cancelRelease = useCancelKitchenRelease();
  const setDayDriver = useSetDayDriver();
  const drivers = useDrivers(driverIds != null);

  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };
  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];

  const doRelease = async () => {
    if (!data) return;
    const warnings = [
      data.needsDriver.length > 0 ? `${data.needsDriver.length} kiriman belum punya driver` : null,
      data.paymentReview.length > 0 ? `${data.paymentReview.length} pembayaran perlu ditinjau` : null,
    ].filter(Boolean);
    const ok = await confirmAction(
      data.release ? 'Rilis Ulang ke Dapur?' : 'Rilis ke Dapur?',
      [
        `${data.packages} paket · ${data.portions} porsi untuk ${formatLongDate(date)}.`,
        warnings.length > 0 ? `Masih ada: ${warnings.join(', ')}.` : 'Semua pemeriksaan sudah beres.',
      ].join('\n'),
      { confirmText: 'Rilis', tone: warnings.length > 0 ? 'warning' : 'info' }
    );
    if (!ok) return;
    release.mutate(
      { date },
      {
        onSuccess: () => showAlert('Dirilis ke Dapur', `Dapur sudah bisa melihat daftar ${formatLongDate(date)}.`, { tone: 'success' }),
        onError: (e) => showAlert('Gagal Merilis', getApiErrorMessage(e, 'Daftar tidak dapat dirilis.'), { tone: 'error' }),
      }
    );
  };

  const doCancelRelease = async () => {
    const ok = await confirmAction(
      'Batalkan Rilis?',
      'Dapur tidak lagi melihat daftar tanggal ini sampai dirilis ulang. Paket yang sudah ditandai siap tetap siap.',
      { confirmText: 'Batalkan rilis' }
    );
    if (!ok) return;
    cancelRelease.mutate(
      { date },
      { onError: (e) => showAlert('Gagal Membatalkan', getApiErrorMessage(e, 'Rilis tidak dapat dibatalkan.'), { tone: 'error' }) }
    );
  };

  const assignDriver = (driverUserId: string | null) => {
    if (!driverIds) return;
    const ids = driverIds;
    setDriverIds(null);
    setDayDriver.mutate(
      { orderDayIds: ids, driverUserId, reason: null },
      { onError: (e) => showAlert('Gagal Mengatur Driver', getApiErrorMessage(e, 'Driver tidak dapat diatur.'), { tone: 'error' }) }
    );
  };

  const checkIcon = (state: CheckState) => (state === 'ok' ? '✓' : state === 'wait' ? '⏳' : '⚠');
  const checkColor = (state: CheckState) =>
    state === 'ok' ? toneColors('success', isDark).text : state === 'wait' ? theme.textSecondary : toneColors('warning', isDark).text;

  const issueList = (issues: KitchenIssue[]) =>
    issues.slice(0, 8).map((i) => (
      <ThemedText key={`${i.orderId}-${i.orderDayId ?? ''}`} style={[styles.issue, muted]} numberOfLines={1}>
        • {shortOrderNumber(i.orderNumber)} · {i.name}{i.detail ? ` · ${i.detail}` : ''}
      </ThemedText>
    ));

  const renderBody = () => {
    if (isPending) return <ActivityIndicator style={styles.loader} color={theme.primary} />;
    if (isError || !data) {
      return (
        <Pressable onPress={() => refetch()} style={card}>
          <ThemedText style={muted}>{getApiErrorMessage(error, 'Data validasi tidak dapat dimuat.')} Ketuk untuk coba lagi.</ThemedText>
        </Pressable>
      );
    }

    const checks: { key: string; state: CheckState; title: string; blocking: boolean; body?: React.ReactNode }[] = [
      {
        key: 'cutoff',
        state: data.cutoffPassed ? 'ok' : 'wait',
        blocking: true,
        title: data.cutoffPassed
          ? `Cutoff ${formatDateTime(data.cutoffAt)} sudah lewat`
          : `Cutoff ${formatDateTime(data.cutoffAt)}: pesanan masih bisa masuk`,
      },
      {
        key: 'awaiting',
        state: data.awaitingPayment.length === 0 ? 'ok' : 'wait',
        blocking: true,
        title:
          data.awaitingPayment.length === 0
            ? 'Tidak ada pesanan yang menunggu pembayaran'
            : `${data.awaitingPayment.length} pesanan masih menunggu pembayaran (paling lambat ${formatTime(data.paymentClosesAt)})`,
        body: data.awaitingPayment.length > 0 ? (
          <>
            {issueList(data.awaitingPayment)}
            <ThemedText style={[styles.issue, muted]}>Yang tidak dibayar akan kedaluwarsa otomatis.</ThemedText>
          </>
        ) : undefined,
      },
      {
        key: 'driver',
        state: data.needsDriver.length === 0 ? 'ok' : 'warn',
        blocking: false,
        title: data.needsDriver.length === 0 ? 'Semua Pesan Antar sudah punya driver' : `${data.needsDriver.length} kiriman belum punya driver`,
        body: data.needsDriver.length > 0 ? (
          <>
            {issueList(data.needsDriver)}
            <Pressable
              onPress={() => setDriverIds(data.needsDriver.map((i) => i.orderDayId).filter((x): x is string => !!x))}
              style={[styles.smallBtn, clickable, { backgroundColor: theme.primary }]}
              accessibilityRole="button"
            >
              <ThemedText style={styles.smallBtnText}>Atur driver ({data.needsDriver.length})</ThemedText>
            </Pressable>
          </>
        ) : undefined,
      },
      {
        key: 'review',
        state: data.paymentReview.length === 0 ? 'ok' : 'warn',
        blocking: false,
        title: data.paymentReview.length === 0 ? 'Tidak ada pembayaran yang perlu ditinjau' : `${data.paymentReview.length} pembayaran perlu ditinjau`,
        body: data.paymentReview.length > 0 ? (
          <>
            {issueList(data.paymentReview)}
            <ThemedText style={[styles.issue, muted]}>Cocokkan di dashboard Midtrans, lihat detailnya di menu Pesanan.</ThemedText>
          </>
        ) : undefined,
      },
    ];

    const relTone = toneColors(data.release ? 'success' : 'neutral', isDark);
    const busy = release.isPending || cancelRelease.isPending;

    return (
      <>
        {/* Status rilis */}
        <View style={[styles.banner, { backgroundColor: data.release ? relTone.bg : theme.backgroundElement }]}>
          <View style={styles.flex}>
            <ThemedText style={[styles.bannerTitle, { color: data.release ? relTone.text : theme.text }]}>
              {data.release ? '✓ Sudah dirilis ke dapur' : 'Belum dirilis ke dapur'}
            </ThemedText>
            <ThemedText style={[styles.small, { color: data.release ? relTone.text : theme.textSecondary }]}>
              {data.release
                ? `${formatDateTime(data.release.releasedAt)}${data.release.releasedByName ? ` oleh ${data.release.releasedByName}` : ''} · ${data.release.dayCount} paket, ${data.release.portions} porsi`
                : 'Dapur belum bisa melihat daftar tanggal ini.'}
            </ThemedText>
          </View>
          {data.release ? (
            <Pressable onPress={doCancelRelease} disabled={busy} style={[styles.outlineBtn, clickable, { borderColor: theme.danger }]} accessibilityRole="button">
              <ThemedText style={[styles.outlineBtnText, { color: theme.danger }]}>Batalkan rilis</ThemedText>
            </Pressable>
          ) : null}
        </View>

        {/* Ceklis */}
        <View style={card}>
          <ThemedText style={[styles.cardTitle, strong]}>Pemeriksaan</ThemedText>
          {checks.map((c) => (
            <View key={c.key} style={styles.check}>
              <ThemedText style={[styles.checkIcon, { color: checkColor(c.state) }]}>{checkIcon(c.state)}</ThemedText>
              <View style={styles.flex}>
                <ThemedText style={[styles.checkTitle, strong]}>
                  {c.title}
                  {c.state !== 'ok' ? (
                    <ThemedText style={[styles.small, muted]}>{c.blocking ? '  · wajib beres' : '  · peringatan'}</ThemedText>
                  ) : null}
                </ThemedText>
                {c.body}
              </View>
            </View>
          ))}
        </View>

        {/* Ringkasan per kelompok */}
        <View style={card}>
          <View style={styles.cardHead}>
            <ThemedText style={[styles.cardTitle, strong]}>Per outlet & zona</ThemedText>
            <ThemedText style={[styles.small, muted]}>{data.packages} paket · {data.portions} porsi</ThemedText>
          </View>
          {data.groups.length === 0 ? (
            <ThemedText style={[styles.small, muted]}>Belum ada pesanan yang dibayar untuk tanggal ini.</ThemedText>
          ) : (
            data.groups.map((g) => (
              <View key={g.key} style={[styles.groupRow, { borderTopColor: theme.border }]}>
                <ThemedText style={styles.groupIcon}>{g.kind === 'OUTLET' ? '🏪' : '🛵'}</ThemedText>
                <View style={styles.flex}>
                  <ThemedText style={[styles.groupName, strong]}>{g.name}</ThemedText>
                  {g.subtitle ? <ThemedText style={[styles.small, muted]}>{g.subtitle}</ThemedText> : null}
                </View>
                <ThemedText style={[styles.groupCount, strong]}>{g.packages} paket · {g.portions} porsi</ThemedText>
              </View>
            ))
          )}
        </View>

        {/* Rekap masak */}
        <View style={card}>
          <ThemedText style={[styles.cardTitle, strong]}>🍳 Rekap masak</ThemedText>
          <KitchenRecapList recap={data.recap} categories={categories} />
        </View>

        {/* Rilis */}
        <View style={styles.releaseBar}>
          {data.blockers.length > 0 ? (
            <ThemedText style={[styles.small, muted, styles.flex]}>{data.blockers.join(' ')}</ThemedText>
          ) : (
            <View style={styles.flex} />
          )}
          <Pressable
            onPress={doRelease}
            disabled={!data.canRelease || busy}
            style={[styles.releaseBtn, clickable, { backgroundColor: theme.primary }, (!data.canRelease || busy) && styles.disabled]}
            accessibilityRole="button"
          >
            {release.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <ThemedText style={styles.releaseBtnText}>{data.release ? 'Rilis ulang ke dapur' : 'Rilis ke dapur'}</ThemedText>
            )}
          </Pressable>
        </View>
      </>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Validasi Dapur" subtitle="Periksa pesanan H-1 lalu rilis ke dapur" fallbackHref="/admin" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <KitchenDateNav date={date} onChange={setDate} />
        {isFetching && !isPending ? <ThemedText style={[styles.small, muted]}>Memperbarui…</ThemedText> : null}
        {renderBody()}
      </ScrollView>

      <SelectModalPicker
        visible={driverIds != null}
        title={driverIds && driverIds.length > 1 ? `Driver untuk ${driverIds.length} kiriman` : 'Pilih driver'}
        isLoading={drivers.isPending}
        items={[
          { value: ZONE_DRIVER, label: 'Ikuti zona', subtitle: 'Hapus penugasan manual, kembali ke driver zona' },
          ...(drivers.data ?? []).map((d) => ({
            value: d.userId,
            label: d.fullName,
            subtitle: d.zones.length > 0 ? `Zona: ${d.zones.join(', ')}` : 'Belum memegang zona',
          })),
        ]}
        onSelect={(item) => assignDriver(item.value === ZONE_DRIVER ? null : item.value)}
        onClose={() => setDriverIds(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 40, maxWidth: 900, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  loader: { marginTop: 40 },
  small: { fontSize: 12 },
  banner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, padding: 14 },
  bannerTitle: { fontSize: 15, fontWeight: '700' },
  card: { borderWidth: 1, borderRadius: 12, padding: 16, gap: 12 },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  check: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  checkIcon: { fontSize: 16, fontWeight: '800', width: 20, textAlign: 'center' },
  checkTitle: { fontSize: 14, fontWeight: '600' },
  issue: { fontSize: 12, marginTop: 3 },
  smallBtn: { alignSelf: 'flex-start', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7, marginTop: 8 },
  smallBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  outlineBtn: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 8 },
  outlineBtnText: { fontSize: 13, fontWeight: '700' },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: StyleSheet.hairlineWidth, paddingTop: 10 },
  groupIcon: { fontSize: 18 },
  groupName: { fontSize: 14, fontWeight: '600' },
  groupCount: { fontSize: 13, fontWeight: '600' },
  releaseBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  releaseBtn: { borderRadius: 12, paddingHorizontal: 22, paddingVertical: 13, minWidth: 180, alignItems: 'center' },
  releaseBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  disabled: { opacity: 0.45 },
});

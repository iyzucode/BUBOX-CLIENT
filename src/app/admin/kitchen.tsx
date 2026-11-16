import React, { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { KitchenDateNav, KitchenRecapList } from '@/components/kitchen/KitchenParts';
import { ThemedText } from '@/components/themed-text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useThemeContext } from '@/context/ThemeContext';
import { useKitchenBoard, useMarkKitchenReady } from '@/features/kitchen/useKitchen';
import { useGetMenuCategories } from '@/features/menu/useMenu';
import { bulkResultMessage, shortOrderNumber } from '@/features/order/adminBoardUtils';
import { toDateKey } from '@/features/order/dateUtils';
import { formatDateTime, formatLongDate, toneColors } from '@/features/order/orderStatus';
import { useLeavePageWarning } from '@/hooks/use-leave-page-warning';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import type { KitchenGroup, KitchenPackage } from '@/types/kitchen';
import { confirmAction, showAlert } from '@/utils/alert';

const clickable = Platform.select({ web: { cursor: 'pointer' as const } }) ?? {};
const RECAP = 'RECAP';
const GROUP_KEY = 'bubox-kitchen-group';
const draftKey = (date: string) => `bubox-kitchen-draft:${date}`;

// Penyimpanan per perangkat (kelompok terakhir & draf centang); aman bila localStorage tidak tersedia
const readStorage = (key: string): string | null => {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage.getItem(key);
  } catch {
    return null;
  }
};
const writeStorage = (key: string, value: string | null) => {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // tidak tersedia: cukup berlaku di sesi ini
  }
};
const readDraft = (date: string): Record<string, string[]> => {
  try {
    return JSON.parse(readStorage(draftKey(date)) ?? '{}') as Record<string, string[]>;
  } catch {
    return {};
  }
};

/**
 * Dapur (hari H): daftar yang sudah dirilis admin. "Rekap masak" = total per menu untuk dimasak;
 * per outlet / zona = paket untuk dikemas. Centangan disimpan sebagai draf di perangkat dan baru dikirim
 * lewat tombol "Simpan siap" di bawah kelompok.
 */
export default function KitchenScreen() {
  const theme = useTheme();
  const { isDark } = useThemeContext();
  const [date, setDate] = useState(() => toDateKey(new Date()));
  const [selected, setSelected] = useState<string>(() => readStorage(GROUP_KEY) ?? RECAP);
  const [draftState, setDraftState] = useState(() => ({ date, checks: readDraft(date) }));

  const { data, isPending, isError, error, refetch, isFetching, dataUpdatedAt } = useKitchenBoard(date);
  const { data: categories } = useGetMenuCategories();
  const markReady = useMarkKitchenReady();

  // Draf mengikuti tanggal: tanggal berganti → muat draf tanggal itu
  if (draftState.date !== date) setDraftState({ date, checks: readDraft(date) });
  const checks = draftState.date === date ? draftState.checks : {};

  const groups = data?.released ? data.groups : [];
  const group = groups.find((g) => g.key === selected) ?? null;
  const view = group ? group.key : RECAP;

  // Hanya paket yang masih bisa dicentang (belum siap, tidak batal) yang dihitung dari draf
  const checkable = (g: KitchenGroup) => new Set(g.items.filter((p) => !p.isReady && !p.cancelledAfterRelease).map((p) => p.orderDayId));
  const draftOf = (g: KitchenGroup) => {
    const ok = checkable(g);
    return (checks[g.key] ?? []).filter((id) => ok.has(id));
  };
  const totalDraft = groups.reduce((sum, g) => sum + draftOf(g).length, 0);
  useLeavePageWarning(totalDraft > 0);

  const saveChecks = (next: Record<string, string[]>) => {
    setDraftState({ date, checks: next });
    const hasAny = Object.values(next).some((ids) => ids.length > 0);
    writeStorage(draftKey(date), hasAny ? JSON.stringify(next) : null);
  };

  const choose = (key: string) => {
    setSelected(key);
    writeStorage(GROUP_KEY, key);
  };

  const toggle = (g: KitchenGroup, p: KitchenPackage) => {
    const current = checks[g.key] ?? [];
    saveChecks({ ...checks, [g.key]: current.includes(p.orderDayId) ? current.filter((x) => x !== p.orderDayId) : [...current, p.orderDayId] });
  };

  const toggleAll = (g: KitchenGroup) => {
    const all = [...checkable(g)];
    const allChecked = all.length > 0 && all.every((id) => (checks[g.key] ?? []).includes(id));
    saveChecks({ ...checks, [g.key]: allChecked ? [] : all });
  };

  const submit = async (g: KitchenGroup) => {
    const ids = draftOf(g);
    if (ids.length === 0) return;
    const ok = await confirmAction(
      `Simpan ${ids.length} Paket Siap?`,
      `${g.name}: status paket jadi Siap dan tidak bisa dikembalikan.`,
      { confirmText: 'Simpan', tone: 'info' }
    );
    if (!ok) return;
    markReady.mutate(
      { date, orderDayIds: ids },
      {
        onSuccess: (res) => {
          const failedIds = new Set(res.failed.map((f) => f.orderDayId));
          saveChecks({ ...checks, [g.key]: ids.filter((id) => failedIds.has(id)) });
          showAlert(
            res.failed.length > 0 ? 'Sebagian Gagal Disimpan' : 'Tersimpan',
            bulkResultMessage(res.succeeded, res.failed, 'ditandai siap'),
            { tone: res.failed.length > 0 ? 'warning' : 'success' }
          );
        },
        onError: (e) => showAlert('Gagal Menyimpan', getApiErrorMessage(e, 'Paket tidak dapat disimpan.'), { tone: 'error' }),
      }
    );
  };

  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };
  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];
  const success = toneColors('success', isDark);
  const danger = toneColors('danger', isDark);

  const chip = (key: string, label: string, sub: string | null, done: boolean) => {
    const active = view === key;
    return (
      <Pressable
        key={key}
        onPress={() => choose(key)}
        style={[styles.chip, clickable, { borderColor: active ? theme.primary : theme.border, backgroundColor: active ? theme.primaryLight : theme.card }]}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
        aria-selected={active}
      >
        <ThemedText style={[styles.chipText, { color: active ? theme.primary : theme.text }]} numberOfLines={1}>{label}</ThemedText>
        {sub ? <ThemedText style={[styles.chipSub, { color: done ? success.text : theme.textSecondary }]}>{sub}</ThemedText> : null}
      </Pressable>
    );
  };

  const renderPackage = (g: KitchenGroup, p: KitchenPackage) => {
    const checked = (checks[g.key] ?? []).includes(p.orderDayId);
    const locked = p.isReady || p.cancelledAfterRelease;
    const boxOn = p.isReady || checked;
    return (
      <Pressable
        key={p.orderDayId}
        onPress={() => !locked && toggle(g, p)}
        disabled={locked}
        style={[
          styles.pkg,
          !locked && clickable,
          { borderColor: checked ? theme.primary : theme.border },
          checked && { backgroundColor: theme.primaryLight },
          p.isReady && { backgroundColor: success.bg, borderColor: success.bg },
          p.cancelledAfterRelease && { backgroundColor: danger.bg, borderColor: danger.bg },
        ]}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: boxOn, disabled: locked }}
        aria-checked={boxOn}
        accessibilityLabel={`${p.recipientName} ${shortOrderNumber(p.orderNumber)}`}
      >
        <View
          style={[
            styles.bigBox,
            { borderColor: p.isReady ? success.text : checked ? theme.primary : theme.border, backgroundColor: p.isReady ? success.text : checked ? theme.primary : theme.card },
            p.cancelledAfterRelease && { borderColor: danger.text, backgroundColor: 'transparent' },
          ]}
        >
          {p.cancelledAfterRelease ? (
            <ThemedText style={[styles.bigTick, { color: danger.text }]}>✕</ThemedText>
          ) : boxOn ? (
            <ThemedText style={styles.bigTick}>✓</ThemedText>
          ) : null}
        </View>
        <View style={styles.flex}>
          <View style={styles.pkgHead}>
            <ThemedText style={[styles.pkgName, strong, p.cancelledAfterRelease && styles.strike]} numberOfLines={1}>
              {p.recipientName}
            </ThemedText>
            <ThemedText style={[styles.pkgNo, muted]}>{shortOrderNumber(p.orderNumber)}</ThemedText>
          </View>
          {p.items.map((i) => (
            <ThemedText key={`${p.orderDayId}-${i.menuName}`} style={[styles.pkgItem, strong, p.cancelledAfterRelease && styles.strike]}>
              <ThemedText style={[styles.pkgQty, { color: theme.primary }]}>{i.qty}×</ThemedText> {i.menuName}
            </ThemedText>
          ))}
          {p.notes ? (
            <View style={[styles.note, { borderColor: theme.warning, backgroundColor: toneColors('warning', isDark).bg }]}>
              <ThemedText style={[styles.noteText, { color: toneColors('warning', isDark).text }]}>📝 {p.notes}</ThemedText>
            </View>
          ) : null}
          {p.isReady ? <ThemedText style={[styles.pkgState, { color: success.text }]}>✓ Siap</ThemedText> : null}
          {p.cancelledAfterRelease ? (
            <ThemedText style={[styles.pkgState, { color: danger.text }]}>Dibatalkan admin setelah dirilis, jangan dikemas</ThemedText>
          ) : null}
        </View>
      </Pressable>
    );
  };

  const renderGroup = (g: KitchenGroup) => {
    const draft = draftOf(g);
    const remaining = checkable(g).size;
    const allChecked = remaining > 0 && draft.length === remaining;
    return (
      <>
        <View style={card}>
          <View style={styles.groupHead}>
            <ThemedText style={styles.groupIcon}>{g.kind === 'OUTLET' ? '🏪' : '🛵'}</ThemedText>
            <View style={styles.flex}>
              <ThemedText style={[styles.groupName, strong]}>{g.name}</ThemedText>
              {g.subtitle ? <ThemedText style={[styles.small, muted]}>{g.subtitle}</ThemedText> : null}
            </View>
            <View style={styles.groupStats}>
              <ThemedText style={[styles.groupProgress, { color: g.readyPackages === g.packages && g.packages > 0 ? success.text : theme.text }]}>
                {g.readyPackages}/{g.packages} siap
              </ThemedText>
              <ThemedText style={[styles.small, muted]}>{g.portions} porsi</ThemedText>
            </View>
          </View>
          <View style={styles.miniRecap}>
            {g.recap.map((m) => (
              <View key={m.menuId} style={[styles.miniChip, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText style={[styles.miniText, strong]}>
                  {m.menuName} <ThemedText style={[styles.miniQty, { color: theme.primary }]}>{m.qty}</ThemedText>
                </ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.listHead}>
          <ThemedText style={[styles.listTitle, strong]}>Paket ({g.items.length})</ThemedText>
          {remaining > 0 ? (
            <Pressable onPress={() => toggleAll(g)} style={[styles.linkBtn, clickable]} accessibilityRole="button">
              <ThemedText style={[styles.link, { color: theme.primary }]}>{allChecked ? 'Batal centang semua' : 'Centang semua'}</ThemedText>
            </Pressable>
          ) : null}
        </View>
        <View style={styles.pkgList}>{g.items.map((p) => renderPackage(g, p))}</View>

        {/* Simpan di paling bawah, setelah semua paket kelompok ini selesai dicek */}
        <View style={[styles.saveBar, { borderTopColor: theme.border }]}>
          <ThemedText style={[styles.small, muted, styles.flex]}>
            {remaining === 0 ? 'Semua paket kelompok ini sudah siap.' : `${draft.length} dari ${remaining} paket dicentang. Belum tersimpan sampai tombol ditekan.`}
          </ThemedText>
          <Pressable
            onPress={() => submit(g)}
            disabled={draft.length === 0 || markReady.isPending}
            style={[styles.saveBtn, clickable, { backgroundColor: theme.primary }, (draft.length === 0 || markReady.isPending) && styles.disabled]}
            accessibilityRole="button"
          >
            {markReady.isPending ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText style={styles.saveBtnText}>Simpan siap ({draft.length} paket)</ThemedText>}
          </Pressable>
        </View>
      </>
    );
  };

  const renderBody = () => {
    if (isPending) return <ActivityIndicator style={styles.loader} color={theme.primary} />;
    if (isError || !data) {
      return (
        <Pressable onPress={() => refetch()} style={card}>
          <ThemedText style={muted}>{getApiErrorMessage(error, 'Data dapur tidak dapat dimuat.')} Ketuk untuk coba lagi.</ThemedText>
        </Pressable>
      );
    }
    if (!data.released) {
      return (
        <View style={[card, styles.emptyCard]}>
          <ThemedText style={styles.emptyIcon}>🔒</ThemedText>
          <ThemedText style={[styles.emptyTitle, strong]}>Belum dirilis admin</ThemedText>
          <ThemedText style={[styles.small, muted, styles.center]}>
            Daftar masak {formatLongDate(date)} akan muncul di sini setelah admin memvalidasi dan merilisnya.
          </ThemedText>
        </View>
      );
    }

    return (
      <>
        <View style={[styles.summary, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <ThemedText style={[styles.summaryText, strong]}>
            {data.packages} paket · {data.portions} porsi ·{' '}
            <ThemedText style={[styles.summaryText, { color: data.readyPackages === data.packages && data.packages > 0 ? success.text : theme.primary }]}>
              {data.readyPackages}/{data.packages} siap
            </ThemedText>
          </ThemedText>
          {data.release ? (
            <ThemedText style={[styles.small, muted]}>
              Dirilis {formatDateTime(data.release.releasedAt)}{data.release.releasedByName ? ` oleh ${data.release.releasedByName}` : ''}
            </ThemedText>
          ) : null}
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {chip(RECAP, '🍳 Rekap masak', `${data.portions} porsi`, false)}
          {groups.map((g) =>
            chip(g.key, `${g.kind === 'OUTLET' ? '🏪' : '🛵'} ${g.name}`, `${g.readyPackages}/${g.packages} ✓`, g.packages > 0 && g.readyPackages === g.packages)
          )}
        </ScrollView>

        {group ? (
          renderGroup(group)
        ) : (
          <View style={card}>
            <ThemedText style={[styles.cardTitle, strong]}>Total yang dimasak</ThemedText>
            <KitchenRecapList recap={data.recap} categories={categories} large />
          </View>
        )}
      </>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Dapur" subtitle="Masak & kemas per outlet dan zona" fallbackHref="/admin" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <KitchenDateNav date={date} onChange={setDate} />
        {renderBody()}
        <ThemedText style={[styles.small, muted, styles.footer]}>
          {isFetching ? 'Memperbarui…' : dataUpdatedAt ? `Diperbarui otomatis tiap menit · terakhir ${formatDateTime(new Date(dataUpdatedAt).toISOString())}` : ''}
        </ThemedText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 40, maxWidth: 900, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  loader: { marginTop: 40 },
  small: { fontSize: 12 },
  footer: { textAlign: 'right' },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  emptyCard: { alignItems: 'center', paddingVertical: 36 },
  emptyIcon: { fontSize: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700' },
  summary: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, gap: 2 },
  summaryText: { fontSize: 16, fontWeight: '700' },
  chips: { gap: 8, paddingVertical: 2 },
  chip: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 9, minWidth: 120, gap: 1 },
  chipText: { fontSize: 14, fontWeight: '700' },
  chipSub: { fontSize: 12, fontWeight: '600' },
  groupHead: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  groupIcon: { fontSize: 24 },
  groupName: { fontSize: 18, fontWeight: '800' },
  groupStats: { alignItems: 'flex-end' },
  groupProgress: { fontSize: 16, fontWeight: '800' },
  miniRecap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  miniChip: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  miniText: { fontSize: 13, fontWeight: '500' },
  miniQty: { fontSize: 14, fontWeight: '800' },
  listHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  listTitle: { fontSize: 15, fontWeight: '700' },
  linkBtn: { paddingVertical: 4, paddingHorizontal: 4 },
  link: { fontSize: 14, fontWeight: '700' },
  pkgList: { gap: 10 },
  pkg: { flexDirection: 'row', gap: 14, borderWidth: 1.5, borderRadius: 14, padding: 14, alignItems: 'flex-start' },
  bigBox: { width: 32, height: 32, borderRadius: 8, borderWidth: 2, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  bigTick: { color: '#FFFFFF', fontSize: 18, fontWeight: '900', lineHeight: 22 },
  pkgHead: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  pkgName: { fontSize: 17, fontWeight: '700', flexShrink: 1 },
  pkgNo: { fontSize: 12, fontWeight: '600' },
  pkgItem: { fontSize: 15, marginTop: 4 },
  pkgQty: { fontSize: 15, fontWeight: '800' },
  pkgState: { fontSize: 13, fontWeight: '700', marginTop: 6 },
  strike: { textDecorationLine: 'line-through' },
  note: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginTop: 8 },
  noteText: { fontSize: 14, fontWeight: '700' },
  saveBar: { flexDirection: 'row', alignItems: 'center', gap: 12, borderTopWidth: 1, paddingTop: 14 },
  saveBtn: { borderRadius: 12, paddingHorizontal: 22, paddingVertical: 14, minWidth: 220, alignItems: 'center' },
  saveBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  disabled: { opacity: 0.45 },
});

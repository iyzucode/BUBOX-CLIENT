import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { BoardFilterPanel, BoardFilters, EMPTY_FILTERS, countActiveFilters } from '@/components/admin-orders/BoardFilterPanel';
import { BoardSummary } from '@/components/admin-orders/BoardSummary';
import { DayTable, OrderTable } from '@/components/admin-orders/BoardTables';
import { BoardTopBar } from '@/components/admin-orders/BoardTopBar';
import { BulkActionBar } from '@/components/admin-orders/BulkActionBar';
import { OrderDetailPanel } from '@/components/admin-orders/OrderDetailPanel';
import { ThemedText } from '@/components/themed-text';
import { DeliveryBoard } from '@/components/order/DeliveryBoard';
import { ReasonModal } from '@/components/order/ReasonModal';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SelectModalPicker } from '@/components/ui/SelectModalPicker';
import { useDrivers, useSetDayDriver } from '@/features/delivery/useDelivery';
import {
  DAY_SORTS,
  DAY_TABS,
  ORDER_SORTS,
  ORDER_TABS,
  PAGE_SIZES,
  addDaysKey,
  bulkResultMessage,
  bulkTargets,
  formatTime,
  shortOrderNumber,
} from '@/features/order/adminBoardUtils';
import { toDateKey } from '@/features/order/dateUtils';
import { formatLongDate, formatShortDate, nextDayStatus } from '@/features/order/orderStatus';
import { buildKitchenSheetHtml, printHtml } from '@/features/order/kitchenSheetPrint';
import {
  downloadBoardExport,
  fetchKitchenSheet,
  useAdminBoardDays,
  useAdminBoardOrders,
  useBoardActivity,
  useBulkCancelDays,
  useBulkDayStatus,
  useMarkDaysRefunded,
} from '@/features/order/useAdminBoard';
import { useCancelDayByAdmin, useCancelOrderByAdmin, useUpdateDayStatus } from '@/features/order/useOrders';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorCode, getApiErrorMessage } from '@/services/apiError';
import { useAuthStore } from '@/store/useAuthStore';
import type { AdminBoardParams, AdminDayRow, BoardView, DateBasis, DayTab, OrderTab } from '@/types/adminOrders';
import type { OrderDayStatusCode } from '@/types/order';
import { confirmAction, showAlert } from '@/utils/alert';

type Mode = 'board' | 'delivery';
type CancelTarget =
  | { kind: 'day'; orderDayId: string; label: string }
  | { kind: 'days'; orderDayIds: string[]; label: string }
  | { kind: 'order'; orderId: string; label: string };
/** Hari kirim yang akan diatur drivernya; bulk = dari bar aksi massal (pilihan dikosongkan setelah berhasil). */
type DriverTarget = { ids: string[]; bulk: boolean };
type RefundTarget = { ids: string[]; label: string; bulk: boolean };

const EMPTY_SELECTION = new Map<string, AdminDayRow>();

const ZONE_DRIVER = '__ZONE__';
const clickable = Platform.select({ web: { cursor: 'pointer' as const } }) ?? {};

/**
 * Layar Pesanan (Admin / Owner, juga Kitchen & Driver untuk tampilan per hari kirim):
 * periode, filter bertingkat, tab status, ringkasan, rekap dapur, daftar per hari kirim / per pesanan,
 * dan panel detail. Papan Antar (penugasan driver per hari) tetap sebagai tab tersendiri.
 */
export default function AdminOrdersScreen() {
  const theme = useTheme();
  const roles = useAuthStore((s) => s.user?.roles ?? []).map((r) => r.toLowerCase());
  const isManager = roles.some((r) => r === 'admin' || r === 'super admin');
  const canSeeOrders = isManager || roles.includes('owner');
  const canAdvance = isManager || roles.includes('kitchen') || roles.includes('driver');

  const today = toDateKey(new Date());
  const [mode, setMode] = useState<Mode>('board');
  const [view, setView] = useState<BoardView>('days');
  const [basis, setBasis] = useState<DateBasis>('DELIVERY');
  const [range, setRange] = useState({ from: today, to: today });
  const [filters, setFilters] = useState<BoardFilters>(EMPTY_FILTERS);
  const [dayTab, setDayTab] = useState<DayTab>('ALL');
  const [orderTab, setOrderTab] = useState<OrderTab>('ALL');
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput.trim(), 400);
  const [daySort, setDaySort] = useState('DATE_ASC');
  const [orderSort, setOrderSort] = useState('NEWEST');
  const [pageState, setPageState] = useState({ key: '', page: 1 });
  const [pageSize, setPageSize] = useState(20);
  const [sortOpen, setSortOpen] = useState(false);
  const [detail, setDetail] = useState<{ orderId: string; dayId: string | null } | null>(null);
  const [driverTarget, setDriverTarget] = useState<DriverTarget | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);
  const [refundTarget, setRefundTarget] = useState<RefundTarget | null>(null);
  const [selectionState, setSelectionState] = useState({ key: '', rows: EMPTY_SELECTION });
  const [exporting, setExporting] = useState(false);
  const [printing, setPrinting] = useState(false);
  // Indikator pesanan baru: dihitung sejak `seenAt`; baris yang dibuat setelah `newSince` diberi label "Baru"
  const [seenAt, setSeenAt] = useState(() => new Date().toISOString());
  const [newSince, setNewSince] = useState<string | null>(null);

  const isDays = view === 'days' || !canSeeOrders;
  const tab = isDays ? dayTab : orderTab;
  const sort = isDays ? daySort : orderSort;

  const criteria: Omit<AdminBoardParams, 'page'> = {
    dateBasis: basis,
    dateFrom: range.from,
    dateTo: range.to,
    q: search || undefined,
    fulfillment: filters.fulfillment.join(',') || undefined,
    zoneIds: filters.zones.join(',') || undefined,
    driverIds: isDays ? filters.drivers.join(',') || undefined : undefined,
    outletIds: filters.outlets.join(',') || undefined,
    categoryCodes: filters.categories.join(',') || undefined,
    payments: filters.payments.join(',') || undefined,
    vouchers: filters.vouchers.join(',') || undefined,
    refunds: filters.refunds.join(',') || undefined,
    menuId: isDays ? filters.menu?.id : undefined,
    tab,
    sort,
    pageSize,
  };

  // Halaman disimpan bersama kriterianya: kriteria berubah → otomatis kembali ke halaman 1
  const criteriaKey = JSON.stringify(criteria);
  const page = pageState.key === criteriaKey ? pageState.page : 1;
  const setPage = (update: (p: number) => number) => setPageState({ key: criteriaKey, page: update(page) });
  const params: AdminBoardParams = { ...criteria, page };

  const daysQuery = useAdminBoardDays(params, mode === 'board' && isDays);
  const ordersQuery = useAdminBoardOrders(params, mode === 'board' && !isDays);
  const active = isDays ? daysQuery : ordersQuery;
  const result = active.data;

  const updateStatus = useUpdateDayStatus();
  const cancelDay = useCancelDayByAdmin();
  const cancelOrder = useCancelOrderByAdmin();
  const setDayDriver = useSetDayDriver();
  const bulkStatus = useBulkDayStatus();
  const bulkCancel = useBulkCancelDays();
  const markRefunded = useMarkDaysRefunded();
  const drivers = useDrivers(isManager && driverTarget != null);
  const activity = useBoardActivity(seenAt, mode === 'board');
  const busyDayId = updateStatus.isPending ? updateStatus.variables?.orderDayId ?? null : null;
  const bulkBusy = bulkStatus.isPending || bulkCancel.isPending || markRefunded.isPending || setDayDriver.isPending;

  // ---------- Pilihan aksi massal (per hari kirim) ----------
  // Pilihan disimpan bersama kriterianya: filter / tab / periode berubah → pilihan otomatis kosong
  const canSelect = isDays && (canAdvance || isManager);
  const selection = selectionState.key === criteriaKey ? selectionState.rows : EMPTY_SELECTION;
  const setSelection = (next: Map<string, AdminDayRow>) => setSelectionState({ key: criteriaKey, rows: next });
  const clearSelection = () => setSelectionState({ key: '', rows: EMPTY_SELECTION });
  // Data baris terbaru (hasil refresh) menggantikan salinan saat dicentang
  const selectedRows = useMemo(() => {
    const fresh = new Map((daysQuery.data?.items ?? []).map((r) => [r.orderDayId, r]));
    return [...selection.values()].map((r) => fresh.get(r.orderDayId) ?? r);
  }, [selection, daysQuery.data?.items]);
  const targets = useMemo(() => bulkTargets(selectedRows), [selectedRows]);

  const toggleRow = (row: AdminDayRow) => {
    const next = new Map(selection);
    if (next.has(row.orderDayId)) next.delete(row.orderDayId);
    else next.set(row.orderDayId, row);
    setSelection(next);
  };
  const togglePage = (rows: AdminDayRow[], select: boolean) => {
    const next = new Map(selection);
    rows.forEach((r) => (select ? next.set(r.orderDayId, r) : next.delete(r.orderDayId)));
    setSelection(next);
  };

  const reportBulk = (title: string, res: { succeeded: number; failed: { orderNumber: string | null; message: string }[] }, doneText: string) =>
    showAlert(res.failed.length > 0 ? `${title}: Sebagian Gagal` : title, bulkResultMessage(res.succeeded, res.failed, doneText), {
      tone: res.failed.length > 0 ? 'warning' : 'success',
    });

  const bulkAdvance = async (status: OrderDayStatusCode, ids: string[], label: string) => {
    const ok = await confirmAction(`${label} ${ids.length} Hari Kirim?`, 'Status yang sudah dimajukan tidak bisa dikembalikan.', {
      confirmText: label,
      tone: 'info',
    });
    if (!ok) return;
    bulkStatus.mutate(
      { orderDayIds: ids, statusCode: status },
      {
        onSuccess: (res) => {
          clearSelection();
          reportBulk(label, res, 'diperbarui');
        },
        onError: (error) => showAlert('Gagal Memperbarui', getApiErrorMessage(error, 'Status tidak dapat diubah.'), { tone: 'error' }),
      }
    );
  };

  const submitRefund = (note: string) => {
    if (!refundTarget) return;
    const target = refundTarget;
    markRefunded.mutate(
      { orderDayIds: target.ids, note: note || null },
      {
        onSuccess: (res) => {
          setRefundTarget(null);
          if (target.bulk) clearSelection();
          if (res.failed.length > 0 || target.ids.length > 1) reportBulk('Refund Ditandai', res, 'ditandai sudah direfund');
        },
        onError: (error) => showAlert('Gagal Menandai Refund', getApiErrorMessage(error, 'Refund tidak dapat ditandai.'), { tone: 'error' }),
      }
    );
  };

  const runExport = async () => {
    setExporting(true);
    try {
      // Cadangan bila header nama file tidak terbaca; formatnya sama dengan nama dari server
      const period = range.from === range.to ? range.from : `${range.from}_${range.to}`;
      const fileName = `${isDays ? 'pesanan-per-hari' : 'transaksi'}_${basis === 'CREATED' ? 'pesan' : 'kirim'}_${period}.xlsx`;
      await downloadBoardExport(isDays ? 'days' : 'orders', params, fileName);
    } catch (error) {
      showAlert('Gagal Mengekspor', getApiErrorMessage(error, 'File Excel tidak dapat dibuat.'), { tone: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const runPrint = async () => {
    setPrinting(true);
    try {
      const sheet = await fetchKitchenSheet(params);
      const filterLabels = [
        ...(tab !== 'ALL' ? [`Tab: ${DAY_TABS.find((t) => t.id === tab)?.label ?? tab}`] : []),
        ...(search ? [`Cari: "${search}"`] : []),
        ...chips.map((c) => c.text),
      ];
      printHtml(buildKitchenSheetHtml(sheet, { basisLabel: basis === 'CREATED' ? 'Tanggal pesan' : 'Tanggal kirim', filters: filterLabels }));
    } catch (error) {
      showAlert('Gagal Mencetak', getApiErrorMessage(error, 'Lembar dapur tidak dapat dibuat.'), { tone: 'error' });
    } finally {
      setPrinting(false);
    }
  };

  // ---------- Pesanan baru ----------
  const newOrders = activity.data?.newOrders ?? 0;
  const newlyPaid = activity.data?.newlyPaid ?? 0;
  const showNewOrders = () => {
    // Tampilkan pesanan sejak terakhir dilihat: acuan tanggal pesan, terbaru di atas, tanpa filter
    setNewSince(seenAt);
    setSeenAt(activity.data?.serverTime ?? new Date().toISOString());
    setBasis('CREATED');
    setRange({ from: toDateKey(new Date(seenAt)), to: today });
    setFilters({ ...EMPTY_FILTERS });
    setDayTab('ALL');
    setOrderTab('ALL');
    setDaySort('NEWEST');
    setOrderSort('NEWEST');
    setSearchInput('');
  };

  const advance = (orderDayId: string, next: OrderDayStatusCode) =>
    updateStatus.mutate(
      { orderDayId, statusCode: next },
      {
        onError: (error) => {
          if (getApiErrorCode(error) === 'DRIVER_NOT_ASSIGNED') {
            showAlert('Belum Ada Driver', 'Atur driver dulu sebelum memberangkatkan kiriman ini.', { tone: 'warning' });
            return;
          }
          showAlert('Gagal Memperbarui', getApiErrorMessage(error, 'Status tidak dapat diubah.'), { tone: 'error' });
        },
      }
    );

  const submitCancel = (reason: string) => {
    if (!cancelTarget) return;
    const onSuccess = () => setCancelTarget(null);
    const onError = (error: unknown) => showAlert('Gagal Membatalkan', getApiErrorMessage(error, 'Pembatalan gagal.'), { tone: 'error' });
    if (cancelTarget.kind === 'day') cancelDay.mutate({ orderDayId: cancelTarget.orderDayId, reason }, { onSuccess, onError });
    else if (cancelTarget.kind === 'days') {
      bulkCancel.mutate(
        { orderDayIds: cancelTarget.orderDayIds, reason },
        {
          onSuccess: (res) => {
            setCancelTarget(null);
            clearSelection();
            reportBulk('Hari Kirim Dibatalkan', res, 'dibatalkan');
          },
          onError,
        }
      );
    } else cancelOrder.mutate({ orderId: cancelTarget.orderId, reason }, { onSuccess, onError });
  };

  const assignDriver = (driverUserId: string | null) => {
    if (!driverTarget) return;
    const { ids, bulk } = driverTarget;
    setDriverTarget(null);
    setDayDriver.mutate(
      { orderDayIds: ids, driverUserId, reason: null },
      {
        onSuccess: (res) => {
          if (bulk) clearSelection();
          if (res.updated < ids.length) {
            showAlert('Sebagian Tidak Diubah', `${ids.length - res.updated} kiriman sudah berangkat sehingga drivernya tidak bisa diubah lagi.`, { tone: 'warning' });
          }
        },
        onError: (error) => showAlert('Gagal Mengatur Driver', getApiErrorMessage(error, 'Driver tidak dapat diatur.'), { tone: 'error' }),
      }
    );
  };

  const tabs = isDays ? DAY_TABS : ORDER_TABS;
  const sorts = isDays ? DAY_SORTS : ORDER_SORTS;
  const totalPages = Math.max(1, Math.ceil((result?.totalCount ?? 0) / pageSize));
  const multiDay = range.from !== range.to || basis === 'CREATED';

  // Chip filter aktif (bisa dihapus satu per satu)
  const chips = (() => {
    const f = result?.facets;
    const label = (list: { id: string; label: string }[] | undefined, id: string) => list?.find((o) => o.id === id)?.label ?? id;
    const list: { key: string; text: string; remove: () => void }[] = [];
    const drop = (key: keyof BoardFilters, id: string) =>
      setFilters((prev) => ({ ...prev, [key]: (prev[key] as string[]).filter((x) => x !== id) }));
    filters.fulfillment.forEach((m) => list.push({ key: `m-${m}`, text: m === 'DELIVERY' ? 'Pesan Antar' : 'Ambil Sendiri', remove: () => drop('fulfillment', m) }));
    filters.zones.forEach((z) => list.push({ key: `z-${z}`, text: `Zona: ${label(f?.zones, z)}`, remove: () => drop('zones', z) }));
    if (isDays) filters.drivers.forEach((d) => list.push({ key: `d-${d}`, text: `Driver: ${label(f?.drivers, d)}`, remove: () => drop('drivers', d) }));
    filters.outlets.forEach((o) => list.push({ key: `o-${o}`, text: `Outlet: ${label(f?.outlets, o)}`, remove: () => drop('outlets', o) }));
    filters.categories.forEach((c) => list.push({ key: `c-${c}`, text: label(f?.categories, c), remove: () => drop('categories', c) }));
    filters.payments.forEach((x) => list.push({ key: `p-${x}`, text: `Bayar: ${label(f?.payments, x)}`, remove: () => drop('payments', x) }));
    filters.vouchers.forEach((x) => list.push({ key: `v-${x}`, text: x === 'NONE' ? 'Tanpa voucher' : `Voucher: ${x}`, remove: () => drop('vouchers', x) }));
    filters.refunds.forEach((x) => list.push({ key: `r-${x}`, text: label(f?.refunds, x), remove: () => drop('refunds', x) }));
    if (filters.menu && isDays) list.push({ key: 'menu', text: `Menu: ${filters.menu.name}`, remove: () => setFilters((p) => ({ ...p, menu: null })) });
    return list;
  })();

  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };

  const renderBoard = () => (
    <>
      <BoardTopBar
        basis={basis}
        onBasisChange={setBasis}
        from={range.from}
        to={range.to}
        onRangeChange={(from, to) => setRange({ from, to })}
      />

      <View style={styles.body}>
        <View style={styles.side}>
          <BoardFilterPanel view={isDays ? 'days' : 'orders'} facets={result?.facets} value={filters} onChange={setFilters} />
        </View>

        <View style={styles.main}>
          {/* Judul + sakelar tampilan */}
          <View style={styles.titleRow}>
            <View style={styles.flex}>
              <ThemedText style={[styles.title, strong]}>{isDays ? 'Daftar pengiriman' : 'Daftar pesanan'}</ThemedText>
              <ThemedText style={[styles.small, muted]}>
                {result ? `${result.summary.rows} ${isDays ? 'pengiriman' : 'pesanan'}` : 'Memuat…'} ·{' '}
                {range.from === range.to ? formatLongDate(range.from) : `${formatShortDate(range.from)} – ${formatShortDate(range.to)}`}
              </ThemedText>
            </View>
            {newOrders + newlyPaid > 0 ? (
              <Pressable
                onPress={showNewOrders}
                style={[styles.newPill, clickable, { backgroundColor: theme.primary }]}
                accessibilityRole="button"
                accessibilityLabel="Tampilkan pesanan baru"
              >
                <ThemedText style={styles.newPillText}>
                  🔔 {[newOrders > 0 ? `${newOrders} pesanan baru` : null, newlyPaid > 0 ? `${newlyPaid} baru dibayar` : null]
                    .filter(Boolean)
                    .join(' · ')}{' '}
                  · Lihat
                </ThemedText>
              </Pressable>
            ) : null}
            <Pressable
              onPress={() => {
                active.refetch();
                activity.refetch();
              }}
              style={[styles.refresh, clickable]}
              accessibilityRole="button"
              accessibilityLabel="Muat ulang daftar"
            >
              <ThemedText style={[styles.small, muted]}>
                {active.isFetching ? 'Memperbarui…' : active.dataUpdatedAt ? `Diperbarui ${formatTime(new Date(active.dataUpdatedAt).toISOString())}` : 'Muat ulang'} ⟳
              </ThemedText>
            </Pressable>
            {canSeeOrders ? (
              <View style={[styles.toggle, { backgroundColor: theme.backgroundElement }]}>
                {(['days', 'orders'] as BoardView[]).map((v) => (
                  <Pressable
                    key={v}
                    onPress={() => setView(v)}
                    style={[styles.toggleBtn, clickable, view === v && { backgroundColor: theme.card }]}
                    accessibilityRole="button"
                    accessibilityState={{ selected: view === v }}
                  >
                    <ThemedText style={[styles.toggleText, { color: view === v ? theme.primary : theme.textSecondary }]}>
                      {v === 'days' ? 'Per Hari Kirim' : 'Per Pesanan'}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          <View style={[styles.info, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={[styles.small, muted]}>
              ⓘ{' '}
              {isDays
                ? 'Satu baris = satu jadwal kirim. Pesanan 7 hari muncul sebagai 7 pengiriman dengan status masing-masing.'
                : 'Satu baris = satu pesanan. Lihat pembayaran, total, dan progres seluruh hari kirim di satu tempat.'}
            </ThemedText>
          </View>

          <BoardSummary
            view={isDays ? 'days' : 'orders'}
            summary={result?.summary}
            production={result?.production ?? []}
            activeMenuId={filters.menu?.id ?? null}
            onMenuPress={(m) =>
              setFilters((p) => ({ ...p, menu: p.menu?.id === m.menuId ? null : { id: m.menuId, name: m.menuName } }))
            }
            onAttentionPress={() => (isDays ? setDayTab('ATTENTION') : setOrderTab('ATTENTION'))}
          />

          {/* Tab status */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.tabs, { borderColor: theme.border }]}>
            {tabs.map((t) => {
              const selected = t.id === tab;
              const count = result?.tabCounts[t.id] ?? 0;
              const attention = t.id === 'ATTENTION';
              return (
                <Pressable
                  key={t.id}
                  onPress={() => (isDays ? setDayTab(t.id as DayTab) : setOrderTab(t.id as OrderTab))}
                  style={[
                    styles.tab,
                    clickable,
                    { borderBottomColor: selected ? theme.primary : 'transparent' },
                    attention && count > 0 && { backgroundColor: theme.primaryLight },
                  ]}
                  accessibilityRole="tab"
                  accessibilityState={{ selected }}
                >
                  <ThemedText style={[styles.tabText, { color: selected ? theme.primary : attention && count > 0 ? theme.warning : theme.textSecondary }]}>
                    {attention ? '⚠ ' : ''}{t.label}
                  </ThemedText>
                  <View style={[styles.count, { backgroundColor: selected ? theme.primary : theme.backgroundElement }]}>
                    <ThemedText style={[styles.countText, { color: selected ? '#FFFFFF' : theme.textSecondary }]}>{count}</ThemedText>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Cari + urutkan */}
          <View style={styles.toolbar}>
            <TextInput
              value={searchInput}
              onChangeText={setSearchInput}
              placeholder="🔍 Cari no. pesanan, nama pelanggan / penerima, email, atau no. HP"
              placeholderTextColor={theme.textSecondary}
              style={[styles.search, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
            />
            <Pressable
              onPress={() => setSortOpen(true)}
              style={[styles.sortBtn, clickable, { borderColor: theme.border, backgroundColor: theme.card }]}
              accessibilityRole="button"
            >
              <ThemedText style={[styles.small, strong]} numberOfLines={1}>
                ↕ {sorts.find((s) => s.id === sort)?.label}
              </ThemedText>
            </Pressable>
            {isDays && Platform.OS === 'web' ? (
              <Pressable
                onPress={runPrint}
                disabled={printing}
                style={[styles.sortBtn, clickable, { borderColor: theme.border, backgroundColor: theme.card }, printing && styles.disabled]}
                accessibilityRole="button"
              >
                <ThemedText style={[styles.small, strong]} numberOfLines={1}>{printing ? 'Menyiapkan…' : '🖨 Cetak dapur'}</ThemedText>
              </Pressable>
            ) : null}
            {canSeeOrders && Platform.OS === 'web' ? (
              <Pressable
                onPress={runExport}
                disabled={exporting}
                style={[styles.sortBtn, clickable, { borderColor: theme.border, backgroundColor: theme.card }, exporting && styles.disabled]}
                accessibilityRole="button"
              >
                <ThemedText style={[styles.small, strong]} numberOfLines={1}>
                  {exporting ? 'Mengekspor…' : isDays ? '⬇ Ekspor Excel' : '⬇ Ekspor transaksi'}
                </ThemedText>
              </Pressable>
            ) : null}
          </View>

          {chips.length > 0 ? (
            <View style={styles.chips}>
              {chips.map((c) => (
                <Pressable key={c.key} onPress={c.remove} style={[styles.chip, clickable, { backgroundColor: theme.backgroundElement }]} accessibilityLabel={`Hapus filter ${c.text}`}>
                  <ThemedText style={[styles.small, strong]}>{c.text} ✕</ThemedText>
                </Pressable>
              ))}
              <Pressable onPress={() => setFilters({ ...EMPTY_FILTERS })} style={clickable}>
                <ThemedText style={[styles.small, styles.bold, { color: theme.primary }]}>Reset</ThemedText>
              </Pressable>
            </View>
          ) : null}

          {canSelect && selection.size > 0 ? (
            <BulkActionBar
              count={selection.size}
              targets={targets}
              canAdvance={canAdvance}
              canManage={isManager}
              busy={bulkBusy}
              onAdvance={bulkAdvance}
              onAssignDriver={(ids) => setDriverTarget({ ids, bulk: true })}
              onMarkRefund={(ids) => setRefundTarget({ ids, label: `${ids.length} hari kirim`, bulk: true })}
              onCancel={(ids) => setCancelTarget({ kind: 'days', orderDayIds: ids, label: `${ids.length} hari kirim` })}
              onClear={clearSelection}
            />
          ) : null}

          {/* Daftar */}
          {active.isPending ? (
            <ActivityIndicator style={styles.loader} color={theme.primary} />
          ) : active.isError ? (
            <Pressable onPress={() => active.refetch()} style={[styles.empty, { borderColor: theme.border }]}>
              <ThemedText style={[styles.small, muted]}>{getApiErrorMessage(active.error, 'Gagal memuat data.')} Ketuk untuk coba lagi.</ThemedText>
            </Pressable>
          ) : !result || result.items.length === 0 ? (
            <View style={[styles.empty, { borderColor: theme.border }]}>
              <ThemedText style={[styles.small, muted]}>
                {search || countActiveFilters(filters, view) > 0 || tab !== 'ALL'
                  ? 'Tidak ada data yang cocok dengan pencarian / filter ini.'
                  : 'Belum ada pesanan di periode ini.'}
              </ThemedText>
            </View>
          ) : isDays ? (
            <DayTable
              rows={daysQuery.data?.items ?? []}
              showDate={multiDay}
              busyDayId={busyDayId}
              canAdvance={canAdvance}
              canAssignDriver={isManager}
              canMarkRefund={isManager}
              newSince={newSince}
              selection={canSelect ? { ids: new Set(selection.keys()), onToggle: toggleRow, onTogglePage: togglePage } : null}
              onOpen={(r) => setDetail({ orderId: r.orderId, dayId: r.orderDayId })}
              onAdvance={(r) => {
                const next = nextDayStatus(r.dayStatus, r.fulfillmentType);
                if (next) advance(r.orderDayId, next);
              }}
              onAssignDriver={(r) => setDriverTarget({ ids: [r.orderDayId], bulk: false })}
              onMarkRefund={(r) =>
                setRefundTarget({ ids: [r.orderDayId], label: `${shortOrderNumber(r.orderNumber)} · ${formatShortDate(r.deliveryDate)}`, bulk: false })
              }
            />
          ) : (
            <OrderTable rows={ordersQuery.data?.items ?? []} newSince={newSince} onOpen={(r) => setDetail({ orderId: r.orderId, dayId: null })} />
          )}

          {/* Paging */}
          {result && result.totalCount > 0 ? (
            <View style={styles.pager}>
              <ThemedText style={[styles.small, muted, styles.flex]}>
                Menampilkan {(result.page - 1) * result.pageSize + 1}–{Math.min(result.page * result.pageSize, result.totalCount)} dari {result.totalCount}
                {active.isFetching ? ' · memuat…' : ''}
              </ThemedText>
              <ThemedText style={[styles.small, muted]}>Baris</ThemedText>
              {PAGE_SIZES.map((s) => (
                <Pressable key={s} onPress={() => setPageSize(s)} style={[styles.pageBtn, clickable, s === pageSize && { backgroundColor: theme.primaryLight }]}>
                  <ThemedText style={[styles.small, { color: s === pageSize ? theme.primary : theme.text }]}>{s}</ThemedText>
                </Pressable>
              ))}
              <View style={styles.pageNav}>
                <Pressable onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={[styles.pageBtn, clickable, page <= 1 && styles.disabled]}>
                  <ThemedText style={strong}>‹</ThemedText>
                </Pressable>
                <ThemedText style={[styles.small, strong]}>{page} / {totalPages}</ThemedText>
                <Pressable onPress={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={[styles.pageBtn, clickable, page >= totalPages && styles.disabled]}>
                  <ThemedText style={strong}>›</ThemedText>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
      </View>
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Pesanan" subtitle="Daftar pesanan · Papan antar" fallbackHref="/admin" />

      <View style={[styles.modeTabs, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        {(['board', 'delivery'] as Mode[]).map((m) => (
          <Pressable
            key={m}
            onPress={() => setMode(m)}
            style={[styles.modeTab, clickable, { borderBottomColor: mode === m ? theme.primary : 'transparent' }]}
          >
            <ThemedText style={[styles.small, styles.bold, { color: mode === m ? theme.primary : theme.textSecondary }]}>
              {m === 'board' ? '🧾 Daftar Pesanan' : '🛵 Papan Antar'}
            </ThemedText>
          </Pressable>
        ))}
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {mode === 'board' ? (
          renderBoard()
        ) : (
          <View style={styles.deliveryWrap}>
            <View style={[styles.dayNav, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <Pressable onPress={() => setRange((r) => ({ from: addDaysKey(r.from, -1), to: addDaysKey(r.from, -1) }))} style={[styles.pageBtn, clickable]}>
                <ThemedText style={strong}>‹</ThemedText>
              </Pressable>
              <Pressable onPress={() => setRange({ from: today, to: today })} style={[styles.flex, clickable]}>
                <ThemedText style={[styles.dayNavText, strong]}>🗓️ {formatLongDate(range.from)}</ThemedText>
              </Pressable>
              <Pressable onPress={() => setRange((r) => ({ from: addDaysKey(r.from, 1), to: addDaysKey(r.from, 1) }))} style={[styles.pageBtn, clickable]}>
                <ThemedText style={strong}>›</ThemedText>
              </Pressable>
            </View>
            {/* key: pilihan kiriman direset saat tanggal berganti */}
            <DeliveryBoard key={range.from} date={range.from} />
          </View>
        )}
      </ScrollView>

      {detail ? (
        <OrderDetailPanel
          orderId={detail.orderId}
          focusDayId={detail.dayId}
          canManage={isManager}
          canAdvance={canAdvance}
          busyDayId={busyDayId}
          onClose={() => setDetail(null)}
          onAdvanceDay={(day, next) => advance(day.id, next)}
          onAssignDriver={(ids) => setDriverTarget({ ids, bulk: false })}
          onCancelDay={(day, order) =>
            setCancelTarget({ kind: 'day', orderDayId: day.id, label: `${order.orderNumber} · ${formatShortDate(day.deliveryDate)}` })
          }
          onCancelOrder={(order) => setCancelTarget({ kind: 'order', orderId: order.id, label: order.orderNumber })}
          onMarkRefund={(ids, order) =>
            setRefundTarget({ ids, label: ids.length > 1 ? `${order.orderNumber} · ${ids.length} hari` : order.orderNumber, bulk: false })
          }
        />
      ) : null}

      <SelectModalPicker
        visible={sortOpen}
        title="Urutkan"
        items={sorts.map((s) => ({ value: s.id, label: s.label }))}
        selectedValue={sort}
        onSelect={(item) => {
          if (isDays) setDaySort(item.value);
          else setOrderSort(item.value);
          setSortOpen(false);
        }}
        onClose={() => setSortOpen(false)}
      />

      <SelectModalPicker
        visible={driverTarget != null}
        title={driverTarget && driverTarget.ids.length > 1 ? `Driver untuk ${driverTarget.ids.length} hari kirim` : 'Pilih driver'}
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
        onClose={() => setDriverTarget(null)}
      />

      <ReasonModal
        visible={!!cancelTarget}
        title={cancelTarget?.kind === 'order' ? '✕ Batalkan Pesanan' : '⚠ Batalkan Hari Kirim (Force Majeure)'}
        description={cancelTarget ? `${cancelTarget.label}. Jika sudah dibayar, refund dilakukan manual di luar sistem.` : undefined}
        confirmLabel="Batalkan"
        isSubmitting={cancelDay.isPending || cancelOrder.isPending || bulkCancel.isPending}
        onCancel={() => setCancelTarget(null)}
        onSubmit={submitCancel}
      />

      <ReasonModal
        visible={!!refundTarget}
        title="✓ Tandai Sudah Direfund"
        description={refundTarget ? `${refundTarget.label}. Pastikan dana sudah dikembalikan ke pelanggan di luar sistem.` : undefined}
        placeholder="Catatan (opsional), mis. Transfer BCA 14/11 ref 123"
        optional
        maxLength={300}
        tone="primary"
        confirmLabel="Tandai direfund"
        isSubmitting={markRefunded.isPending}
        onCancel={() => setRefundTarget(null)}
        onSubmit={submitRefund}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 40, width: '100%', maxWidth: 1400, alignSelf: 'center' },
  modeTabs: { flexDirection: 'row', borderBottomWidth: 1, paddingHorizontal: 16 },
  modeTab: { paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 2 },
  body: { flexDirection: 'row', alignItems: 'flex-start', gap: 14 },
  side: { width: 240 },
  main: { flex: 1, gap: 12, minWidth: 0 },
  flex: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 20, fontWeight: '800' },
  toggle: { flexDirection: 'row', borderRadius: 12, padding: 4 },
  toggleBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 9 },
  toggleText: { fontSize: 13, fontWeight: '700' },
  info: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  tabs: { flexDirection: 'row', gap: 4, borderBottomWidth: 1 },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 9, borderBottomWidth: 2, borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  tabText: { fontSize: 13, fontWeight: '700' },
  count: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1, minWidth: 22, alignItems: 'center' },
  countText: { fontSize: 11, fontWeight: '800' },
  toolbar: { flexDirection: 'row', gap: 10 },
  search: { flex: 1, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  newPill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  newPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  refresh: { paddingHorizontal: 4, paddingVertical: 4 },
  sortBtn: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center', maxWidth: 230 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  small: { fontSize: 12 },
  bold: { fontWeight: '700' },
  loader: { marginTop: 40 },
  empty: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 12, padding: 30, alignItems: 'center' },
  pager: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pageNav: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 10 },
  pageBtn: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  disabled: { opacity: 0.35 },
  deliveryWrap: { gap: 12, maxWidth: 760, width: '100%', alignSelf: 'center' },
  dayNav: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 10 },
  dayNavText: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
});

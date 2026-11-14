import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { BoardFilterDrawer, BoardFilters, EMPTY_FILTERS, countActiveFilters } from '@/components/admin-orders/BoardFilterDrawer';
import { AttentionBanner, BoardSummary, KitchenRecap } from '@/components/admin-orders/BoardSummary';
import { DayTable, OrderTable } from '@/components/admin-orders/BoardTables';
import { BoardTopBar } from '@/components/admin-orders/BoardTopBar';
import { BulkActionBar } from '@/components/admin-orders/BulkActionBar';
import { MenuButton } from '@/components/admin-orders/MenuButton';
import { OrderDetailPanel } from '@/components/admin-orders/OrderDetailPanel';
import { ThemedText } from '@/components/themed-text';
import { ReasonModal } from '@/components/order/ReasonModal';
import { SelectModalPicker } from '@/components/ui/SelectModalPicker';
import { useDrivers, useSetDayDriver } from '@/features/delivery/useDelivery';
import {
  DAY_SORTS,
  DAY_TABS,
  ORDER_SORTS,
  ORDER_TABS,
  PAGE_SIZES,
  bulkResultMessage,
  bulkTargets,
  formatTime,
  shortOrderNumber,
} from '@/features/order/adminBoardUtils';
import { toDateKey } from '@/features/order/dateUtils';
import { buildKitchenSheetHtml, printHtml } from '@/features/order/kitchenSheetPrint';
import { formatShortDate, nextDayStatus } from '@/features/order/orderStatus';
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

/** Tab yang selalu terlihat; sisanya masuk "Lainnya". */
const DAY_MAIN_TABS: DayTab[] = ['ATTENTION', 'ALL', 'CONFIRMED', 'PREPARING'];
const ORDER_MAIN_TABS: OrderTab[] = ['ATTENTION', 'ALL', 'PAID', 'IN_PROGRESS'];
const tabLabel = (id: string, label: string) => (id === 'ATTENTION' ? 'Perlu tindakan' : label);

/**
 * Layar Pesanan (Admin / Owner, juga Kitchen & Driver untuk tampilan per hari kirim): periode, ringkasan,
 * banner perlu tindakan, tab status, filter (panel samping), daftar per hari kirim / per pesanan, aksi massal,
 * rekap dapur, dan panel detail.
 */
export default function AdminOrdersScreen() {
  const theme = useTheme();
  const roles = useAuthStore((s) => s.user?.roles ?? []).map((r) => r.toLowerCase());
  const isManager = roles.some((r) => r === 'admin' || r === 'super admin');
  const canSeeOrders = isManager || roles.includes('owner');
  const canAdvance = isManager || roles.includes('kitchen') || roles.includes('driver');

  const today = toDateKey(new Date());
  const [view, setView] = useState<BoardView>('days');
  const [basis, setBasis] = useState<DateBasis>('DELIVERY');
  const [range, setRange] = useState({ from: today, to: today });
  const [filters, setFilters] = useState<BoardFilters>(EMPTY_FILTERS);
  // Tab awal "Perlu tindakan"; bila ternyata kosong, otomatis pindah ke "Semua" (sekali, saat layar dibuka)
  const [dayTab, setDayTab] = useState<DayTab>('ATTENTION');
  const [orderTab, setOrderTab] = useState<OrderTab>('ATTENTION');
  const [dayTabResolved, setDayTabResolved] = useState(false);
  const [orderTabResolved, setOrderTabResolved] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const search = useDebouncedValue(searchInput.trim(), 400);
  const [daySort, setDaySort] = useState('DATE_ASC');
  const [orderSort, setOrderSort] = useState('NEWEST');
  const [pageState, setPageState] = useState({ key: '', page: 1 });
  const [pageSize, setPageSize] = useState(10);
  const [filterOpen, setFilterOpen] = useState(false);
  const [detail, setDetail] = useState<{ orderId: string; dayId: string | null } | null>(null);
  const [driverTarget, setDriverTarget] = useState<DriverTarget | null>(null);
  const [cancelTarget, setCancelTarget] = useState<CancelTarget | null>(null);
  const [refundTarget, setRefundTarget] = useState<RefundTarget | null>(null);
  const [selectionState, setSelectionState] = useState({ key: '', rows: EMPTY_SELECTION });
  const [exporting, setExporting] = useState(false);
  const [printing, setPrinting] = useState(false);
  // Indikator pesanan baru: dihitung sejak `seenAt`
  const [seenAt, setSeenAt] = useState(() => new Date().toISOString());

  const isDays = view === 'days' || !canSeeOrders;
  const tab = isDays ? dayTab : orderTab;
  const sort = isDays ? daySort : orderSort;

  // Kriteria daftar tanpa tab/urutan/halaman: pilihan centang tetap selama kriteria ini sama
  const baseCriteria = {
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
  };
  const criteria: Omit<AdminBoardParams, 'page'> = { ...baseCriteria, tab, sort, pageSize };

  // Halaman disimpan bersama kriterianya: kriteria berubah → otomatis kembali ke halaman 1
  const criteriaKey = JSON.stringify(criteria);
  const selectionKey = JSON.stringify({ ...baseCriteria, isDays });
  const page = pageState.key === criteriaKey ? pageState.page : 1;
  const setPage = (update: (p: number) => number) => setPageState({ key: criteriaKey, page: update(page) });
  const params: AdminBoardParams = { ...criteria, page };

  const daysQuery = useAdminBoardDays(params, isDays);
  const ordersQuery = useAdminBoardOrders(params, !isDays);
  const active = isDays ? daysQuery : ordersQuery;
  const result = active.data;

  // Tab awal: "Perlu tindakan" bila ada, selain itu "Semua" (diputuskan dari hasil pertama)
  if (!dayTabResolved && daysQuery.data && !daysQuery.isPlaceholderData) {
    setDayTabResolved(true);
    if (dayTab === 'ATTENTION' && (daysQuery.data.tabCounts.ATTENTION ?? 0) === 0) setDayTab('ALL');
  }
  if (!orderTabResolved && ordersQuery.data && !ordersQuery.isPlaceholderData) {
    setOrderTabResolved(true);
    if (orderTab === 'ATTENTION' && (ordersQuery.data.tabCounts.ATTENTION ?? 0) === 0) setOrderTab('ALL');
  }
  const chooseTab = (id: string) => {
    if (isDays) {
      setDayTabResolved(true);
      setDayTab(id as DayTab);
    } else {
      setOrderTabResolved(true);
      setOrderTab(id as OrderTab);
    }
  };

  const updateStatus = useUpdateDayStatus();
  const cancelDay = useCancelDayByAdmin();
  const cancelOrder = useCancelOrderByAdmin();
  const setDayDriver = useSetDayDriver();
  const bulkStatus = useBulkDayStatus();
  const bulkCancel = useBulkCancelDays();
  const markRefunded = useMarkDaysRefunded();
  const drivers = useDrivers(isManager && driverTarget != null);
  const activity = useBoardActivity(seenAt, true);
  const busyDayId = updateStatus.isPending ? updateStatus.variables?.orderDayId ?? null : null;
  const bulkBusy = bulkStatus.isPending || bulkCancel.isPending || markRefunded.isPending || setDayDriver.isPending;

  // ---------- Pilihan aksi massal (per hari kirim) ----------
  const canSelect = isDays && (canAdvance || isManager);
  const selection = selectionState.key === selectionKey ? selectionState.rows : EMPTY_SELECTION;
  const setSelection = (next: Map<string, AdminDayRow>) => setSelectionState({ key: selectionKey, rows: next });
  const clearSelection = () => setSelectionState({ key: '', rows: EMPTY_SELECTION });
  // Data baris terbaru (hasil refresh) menggantikan salinan saat dicentang
  const selectedRows = useMemo(() => {
    const fresh = new Map([...(daysQuery.data?.items ?? []), ...(daysQuery.data?.attention.rows ?? [])].map((r) => [r.orderDayId, r]));
    return [...selection.values()].map((r) => fresh.get(r.orderDayId) ?? r);
  }, [selection, daysQuery.data?.items, daysQuery.data?.attention.rows]);
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

  // ---------- Banner perlu tindakan: centang barisnya dulu, aksi lewat bar aksi massal ----------
  const selectAttention = (pick: (r: AdminDayRow) => boolean) => {
    const rows = (result?.attention.rows ?? []).filter(pick);
    setSelection(new Map(rows.map((r) => [r.orderDayId, r])));
    chooseTab('ATTENTION');
  };
  const reviewPayments = () => {
    setFilters((f) => ({ ...f, payments: ['REVIEW'] }));
    chooseTab('ALL');
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

  const runPrint = async () => {
    setPrinting(true);
    try {
      const sheet = await fetchKitchenSheet(params);
      const filterLabels = [
        ...(tab !== 'ALL' ? [`Tab: ${tabLabel(tab, DAY_TABS.find((t) => t.id === tab)?.label ?? tab)}`] : []),
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
    setSeenAt(activity.data?.serverTime ?? new Date().toISOString());
    setBasis('CREATED');
    setRange({ from: toDateKey(new Date(seenAt)), to: today });
    setFilters({ ...EMPTY_FILTERS });
    setDayTabResolved(true);
    setOrderTabResolved(true);
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

  const allTabs: { id: string; label: string }[] = isDays ? DAY_TABS : ORDER_TABS;
  const mainIds: string[] = isDays ? DAY_MAIN_TABS : ORDER_MAIN_TABS;
  const mainTabs = mainIds.map((id) => allTabs.find((t) => t.id === id)).filter((t): t is { id: string; label: string } => !!t);
  const moreTabs = allTabs.filter((t) => !mainIds.includes(t.id));
  const activeMore = moreTabs.find((t) => t.id === tab);
  const sorts = isDays ? DAY_SORTS : ORDER_SORTS;
  const totalPages = Math.max(1, Math.ceil((result?.totalCount ?? 0) / pageSize));
  const multiDay = range.from !== range.to || basis === 'CREATED';
  const activeFilters = countActiveFilters(filters, isDays ? 'days' : 'orders');
  const unit = isDays ? 'pengiriman' : 'pesanan';
  // Saat tab awal masih ditentukan / data berganti, jangan tampilkan "kosong" sebelum waktunya
  const loadingList = active.isPending || (active.isFetching && (result?.items.length ?? 0) === 0);

  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };
  const outline = [styles.toolBtn, clickable, { borderColor: theme.border, backgroundColor: theme.card }];

  const tabButton = (t: { id: string; label: string }) => {
    const selected = t.id === tab;
    const count = result?.tabCounts[t.id] ?? 0;
    return (
      <Pressable
        key={t.id}
        onPress={() => chooseTab(t.id)}
        style={[styles.tab, clickable, { borderBottomColor: selected ? theme.primary : 'transparent' }]}
        accessibilityRole="tab"
        accessibilityState={{ selected }}
        aria-selected={selected}
      >
        <ThemedText style={[styles.tabText, { color: selected ? theme.primary : theme.text }]}>{tabLabel(t.id, t.label)}</ThemedText>
        <View style={[styles.count, selected && { backgroundColor: theme.primaryLight }]}>
          <ThemedText style={[styles.countText, { color: selected ? theme.primary : theme.textSecondary }]}>{count}</ThemedText>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Judul & periode */}
        <View style={styles.header}>
          <View style={styles.flex}>
            <ThemedText style={[styles.crumb, muted]}>OPERASIONAL  /  PESANAN</ThemedText>
            <ThemedText style={[styles.title, strong]}>{isDays ? 'Daftar pengiriman' : 'Daftar pesanan'}</ThemedText>
            <ThemedText style={[styles.subtitle, muted]}>Kelola jadwal, persiapan, dan pengantaran pesanan.</ThemedText>
          </View>
          <View style={styles.headerRight}>
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
            <BoardTopBar basis={basis} onBasisChange={setBasis} from={range.from} to={range.to} onRangeChange={(from, to) => setRange({ from, to })} />
          </View>
        </View>

        <BoardSummary view={isDays ? 'days' : 'orders'} summary={result?.summary} />

        <AttentionBanner
          view={isDays ? 'days' : 'orders'}
          attention={result?.attention}
          canManage={isManager}
          onAssignDrivers={() => selectAttention((r) => r.needsDriver)}
          onMarkRefunds={() => selectAttention((r) => r.refundPending)}
          onReviewPayments={reviewPayments}
          onShowAll={() => chooseTab('ATTENTION')}
        />

        {/* Kartu daftar */}
        <View style={[styles.listCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          {/* Tab status + sakelar tampilan */}
          <View style={[styles.tabsRow, { borderColor: theme.border }]}>
            <View style={styles.tabs}>
              {mainTabs.map(tabButton)}
              {moreTabs.length > 0 ? (
                <MenuButton
                  style={[styles.tab, { borderBottomColor: activeMore ? theme.primary : 'transparent' }]}
                  accessibilityLabel="Tab status lainnya"
                  items={moreTabs.map((t) => ({
                    key: t.id,
                    label: t.label,
                    hint: String(result?.tabCounts[t.id] ?? 0),
                    selected: t.id === tab,
                    onPress: () => chooseTab(t.id),
                  }))}
                >
                  <ThemedText style={[styles.tabText, { color: activeMore ? theme.primary : theme.text }]}>
                    {activeMore ? activeMore.label : 'Lainnya'}
                  </ThemedText>
                  {activeMore ? (
                    <View style={[styles.count, { backgroundColor: theme.primaryLight }]}>
                      <ThemedText style={[styles.countText, { color: theme.primary }]}>{result?.tabCounts[activeMore.id] ?? 0}</ThemedText>
                    </View>
                  ) : null}
                  <ThemedText style={[styles.tabText, muted]}>⌄</ThemedText>
                </MenuButton>
              ) : null}
            </View>
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
                    <ThemedText style={[styles.toggleText, { color: view === v ? theme.text : theme.textSecondary }]}>
                      {v === 'days' ? 'Per hari kirim' : 'Per pesanan'}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            ) : null}
          </View>

          {/* Cari, filter, urutkan, cetak, ekspor */}
          <View style={styles.toolbar}>
            <View style={[styles.searchBox, { borderColor: theme.border, backgroundColor: theme.card }]}>
              <ThemedText style={[styles.searchIcon, muted]}>⌕</ThemedText>
              <TextInput
                value={searchInput}
                onChangeText={setSearchInput}
                placeholder="Cari no. pesanan atau nama pelanggan…"
                placeholderTextColor={theme.textSecondary}
                style={[styles.search, { color: theme.text }]}
              />
            </View>
            <Pressable
              onPress={() => setFilterOpen(true)}
              style={[...outline, activeFilters > 0 && { borderColor: theme.primary }]}
              accessibilityRole="button"
              accessibilityLabel="Buka filter"
            >
              <ThemedText style={[styles.toolText, strong]}>☰ Filter</ThemedText>
              {activeFilters > 0 ? (
                <View style={[styles.filterBadge, { backgroundColor: theme.primary }]}>
                  <ThemedText style={styles.filterBadgeText}>{activeFilters}</ThemedText>
                </View>
              ) : null}
            </Pressable>
            <View style={styles.flex} />
            <MenuButton
              style={[...outline, styles.sortBtn]}
              align="right"
              accessibilityLabel="Urutkan"
              items={sorts.map((s) => ({
                key: s.id,
                label: s.label,
                selected: s.id === sort,
                onPress: () => (isDays ? setDaySort(s.id) : setOrderSort(s.id)),
              }))}
            >
              <ThemedText style={[styles.toolText, strong]} numberOfLines={1}>⇅ {sorts.find((s) => s.id === sort)?.label}</ThemedText>
              <ThemedText style={[styles.toolText, muted]}>⌄</ThemedText>
            </MenuButton>
            {isDays && Platform.OS === 'web' ? (
              <Pressable onPress={runPrint} disabled={printing} style={[...outline, printing && styles.disabled]} accessibilityRole="button">
                <ThemedText style={[styles.toolText, strong]}>{printing ? 'Menyiapkan…' : '🖨 Cetak'}</ThemedText>
              </Pressable>
            ) : null}
            {canSeeOrders && Platform.OS === 'web' ? (
              <Pressable onPress={runExport} disabled={exporting} style={[...outline, exporting && styles.disabled]} accessibilityRole="button" accessibilityLabel={isDays ? 'Ekspor Excel per hari kirim' : 'Ekspor transaksi'}>
                <ThemedText style={[styles.toolText, strong]}>{exporting ? 'Mengekspor…' : 'Ekspor'}</ThemedText>
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
              <Pressable onPress={() => setFilters({ ...EMPTY_FILTERS })} style={clickable} accessibilityRole="button">
                <ThemedText style={[styles.small, styles.bold, { color: theme.primary }]}>Reset</ThemedText>
              </Pressable>
            </View>
          ) : null}

          {canSelect && selection.size > 0 ? (
            <View style={styles.bulkWrap}>
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
            </View>
          ) : null}

          {/* Daftar */}
          {loadingList ? (
            <ActivityIndicator style={styles.loader} color={theme.primary} />
          ) : active.isError ? (
            <Pressable onPress={() => active.refetch()} style={styles.empty}>
              <ThemedText style={[styles.small, muted]}>{getApiErrorMessage(active.error, 'Gagal memuat data.')} Ketuk untuk coba lagi.</ThemedText>
            </Pressable>
          ) : !result || result.items.length === 0 ? (
            <View style={styles.empty}>
              <ThemedText style={[styles.small, muted]}>
                {tab === 'ATTENTION' && !search && activeFilters === 0
                  ? 'Tidak ada yang perlu ditindak. 🎉'
                  : search || activeFilters > 0 || tab !== 'ALL'
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
            <OrderTable rows={ordersQuery.data?.items ?? []} onOpen={(r) => setDetail({ orderId: r.orderId, dayId: null })} />
          )}

          {/* Paging */}
          {result && result.totalCount > 0 ? (
            <View style={styles.pager}>
              <ThemedText style={[styles.small, muted, styles.flex]}>
                Menampilkan {(result.page - 1) * result.pageSize + 1}–{Math.min(result.page * result.pageSize, result.totalCount)} dari {result.totalCount} {unit}
              </ThemedText>
              <MenuButton
                style={styles.pageSize}
                align="right"
                menuWidth={160}
                accessibilityLabel="Jumlah baris per halaman"
                items={PAGE_SIZES.map((s) => ({ key: String(s), label: `${s} per halaman`, selected: s === pageSize, onPress: () => setPageSize(s) }))}
              >
                <ThemedText style={[styles.small, muted]}>{pageSize} per halaman ⌄</ThemedText>
              </MenuButton>
              <View style={styles.pageNav}>
                <Pressable onPress={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={[styles.pageBtn, clickable, page <= 1 && styles.disabled]} accessibilityLabel="Halaman sebelumnya">
                  <ThemedText style={strong}>‹</ThemedText>
                </Pressable>
                <ThemedText style={[styles.small, strong]}>{page} / {totalPages}</ThemedText>
                <Pressable onPress={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={[styles.pageBtn, clickable, page >= totalPages && styles.disabled]} accessibilityLabel="Halaman berikutnya">
                  <ThemedText style={strong}>›</ThemedText>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        {isDays ? (
          <KitchenRecap
            production={result?.production ?? []}
            activeMenuId={filters.menu?.id ?? null}
            onMenuPress={(m) => setFilters((p) => ({ ...p, menu: p.menu?.id === m.menuId ? null : { id: m.menuId, name: m.menuName } }))}
          />
        ) : null}

        {/* Kaki halaman */}
        <View style={styles.footer}>
          <ThemedText style={[styles.small, muted, styles.flex]}>
            {isDays ? 'Satu baris mewakili satu jadwal kirim.' : 'Satu baris mewakili satu pesanan beserta seluruh hari kirimnya.'}
          </ThemedText>
          <Pressable
            onPress={() => {
              active.refetch();
              activity.refetch();
            }}
            style={clickable}
            accessibilityRole="button"
            accessibilityLabel="Muat ulang daftar"
          >
            <ThemedText style={[styles.small, muted]}>
              {active.isFetching ? 'Memperbarui…' : active.dataUpdatedAt ? `Terakhir diperbarui ${formatTime(new Date(active.dataUpdatedAt).toISOString())}` : 'Muat ulang'} ⟳
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>

      {filterOpen ? (
        <BoardFilterDrawer
          view={isDays ? 'days' : 'orders'}
          facets={result?.facets}
          value={filters}
          onClose={() => setFilterOpen(false)}
          onApply={(next) => {
            setFilters(next);
            setFilterOpen(false);
          }}
        />
      ) : null}

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
  scroll: { padding: 24, gap: 16, paddingBottom: 40, width: '100%', maxWidth: 1400, alignSelf: 'center' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 10, flexWrap: 'wrap' },
  crumb: { fontSize: 11, fontWeight: '600', letterSpacing: 0.4 },
  title: { fontSize: 26, fontWeight: '700', marginTop: 6 },
  subtitle: { fontSize: 13, marginTop: 2 },
  newPill: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  newPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  listCard: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  tabsRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, borderBottomWidth: 1 },
  tabs: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  tab: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 6, paddingVertical: 14, borderBottomWidth: 2 },
  tabText: { fontSize: 14, fontWeight: '500' },
  count: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 1, minWidth: 22, alignItems: 'center' },
  countText: { fontSize: 12, fontWeight: '600' },
  toggle: { flexDirection: 'row', borderRadius: 9, padding: 3 },
  toggleBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 7 },
  toggleText: { fontSize: 12, fontWeight: '600' },
  toolbar: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, flexWrap: 'wrap' },
  searchBox: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, minWidth: 280, flexBasis: 380, flexShrink: 1 },
  searchIcon: { fontSize: 16 },
  search: { flex: 1, paddingVertical: 9, fontSize: 13 },
  toolBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9 },
  toolText: { fontSize: 13, fontWeight: '500' },
  sortBtn: { maxWidth: 240 },
  filterBadge: { borderRadius: 999, minWidth: 18, paddingHorizontal: 5, alignItems: 'center' },
  filterBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingBottom: 12, marginTop: -4 },
  chip: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  bulkWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  small: { fontSize: 12 },
  bold: { fontWeight: '700' },
  loader: { marginVertical: 40 },
  empty: { padding: 40, alignItems: 'center' },
  pager: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  pageSize: { paddingHorizontal: 6, paddingVertical: 4 },
  pageNav: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  pageBtn: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  disabled: { opacity: 0.35 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
});

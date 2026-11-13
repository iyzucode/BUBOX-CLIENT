import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { PickerItem, SelectModalPicker } from '@/components/ui/SelectModalPicker';
import { WILAYAH_LEVEL_LABEL } from '@/features/delivery/deliveryUtils';
import {
  useAreaChildren,
  useDeliveryZones,
  useSearchWilayah,
  useSetCoverage,
  useSetZoneArea,
} from '@/features/delivery/useDelivery';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import { AreaNode, WilayahSearchItem } from '@/types/delivery';
import { showAlert } from '@/utils/alert';

const LEVEL_LABEL = WILAYAH_LEVEL_LABEL;

const CHILD_LEVEL_LABEL: Record<number, string> = {
  0: 'provinsi',
  1: 'kabupaten/kota',
  2: 'kecamatan',
  3: 'kelurahan/desa',
};

const INHERIT = '__inherit__';

type CoverageChoice = 'inherit' | 'covered' | 'excluded';

const toChoice = (rule: boolean | null): CoverageChoice =>
  rule === null ? 'inherit' : rule ? 'covered' : 'excluded';

/** Induk langsung sebuah kode wilayah: 34.71.01.1001 → 34.71.01, 34 → null. */
function parentOf(code: string): string | null {
  const idx = code.lastIndexOf('.');
  return idx < 0 ? null : code.slice(0, idx);
}

/**
 * Admin: wilayah mana yang terjangkau pengantaran dan masuk zona mana.
 * Aturan paling spesifik menang (kelurahan > kecamatan > kab/kota > provinsi); tanpa aturan = ikut induk.
 */
export default function AdminDeliveryAreasScreen() {
  const theme = useTheme();
  const [parentCode, setParentCode] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [zonePickerFor, setZonePickerFor] = useState<AreaNode | null>(null);

  const area = useAreaChildren(parentCode);
  const search = useSearchWilayah(query);
  const zones = useDeliveryZones();
  const setCoverage = useSetCoverage();
  const setZoneArea = useSetZoneArea();

  const searching = query.trim().length >= 3;
  const busyCode =
    (setCoverage.isPending && setCoverage.variables?.wilayahCode) ||
    (setZoneArea.isPending && setZoneArea.variables?.wilayahCode) ||
    null;

  const zoneItems = useMemo<PickerItem[]>(() => {
    const items: PickerItem[] = [
      { value: INHERIT, label: 'Ikut induk', subtitle: 'Hapus pemetaan zona di wilayah ini' },
    ];
    (zones.data ?? []).forEach((z) =>
      items.push({
        value: z.id,
        label: z.isActive ? z.name : `${z.name} (nonaktif)`,
        subtitle: z.driverName ? `Driver: ${z.driverName}` : 'Belum ada driver',
      })
    );
    return items;
  }, [zones.data]);

  const onError = (title: string) => (error: unknown) =>
    showAlert(title, getApiErrorMessage(error, 'Perubahan tidak tersimpan.'), { tone: 'error' });

  const handleCoverage = (node: AreaNode, choice: CoverageChoice) => {
    if (choice === toChoice(node.coverageRule)) return;
    setCoverage.mutate(
      { wilayahCode: node.code, isCovered: choice === 'inherit' ? null : choice === 'covered' },
      { onError: onError('Gagal Mengubah Jangkauan') }
    );
  };

  const handlePickZone = (item: PickerItem) => {
    const node = zonePickerFor;
    setZonePickerFor(null);
    if (!node) return;
    const zoneId = item.value === INHERIT ? null : item.value;
    if (zoneId === node.zoneRuleId) return;
    setZoneArea.mutate({ wilayahCode: node.code, zoneId }, { onError: onError('Gagal Mengubah Zona') });
  };

  const openSearchResult = (item: WilayahSearchItem) => {
    setQuery('');
    // Kelurahan tidak punya anak: tampilkan kecamatannya agar kelurahan itu terlihat di daftar
    setParentCode(item.level === 4 ? parentOf(item.code) : item.code);
  };

  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };
  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];

  const renderCoverageControl = (node: AreaNode) => {
    const current = toChoice(node.coverageRule);
    const options: { key: CoverageChoice; label: string; color: string }[] = [
      { key: 'inherit', label: 'Ikut induk', color: theme.textSecondary },
      { key: 'covered', label: 'Terjangkau', color: theme.success },
      { key: 'excluded', label: 'Tidak', color: theme.danger },
    ];
    return (
      <View style={[styles.segment, { backgroundColor: theme.backgroundElement }]}>
        {options.map((o) => {
          const active = o.key === current;
          return (
            <Pressable
              key={o.key}
              onPress={() => handleCoverage(node, o.key)}
              disabled={busyCode === node.code}
              style={[styles.segmentBtn, active && { backgroundColor: theme.card, borderColor: o.color }]}
              accessibilityRole="radio"
              aria-checked={active}
              accessibilityLabel={`${o.label} untuk ${node.name}`}
            >
              <ThemedText style={[styles.tiny, styles.bold, { color: active ? o.color : theme.textSecondary }]}>
                {o.label}
              </ThemedText>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderZoneControl = (node: AreaNode) => (
    <Pressable
      onPress={() => setZonePickerFor(node)}
      disabled={busyCode === node.code}
      style={({ pressed }) => [
        styles.zoneBtn,
        { borderColor: node.zoneRuleId ? theme.secondary : theme.border, opacity: pressed ? 0.8 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Pilih zona untuk ${node.name}`}
    >
      <ThemedText style={[styles.tiny, muted]}>Zona</ThemedText>
      <ThemedText style={[styles.small, styles.bold, strong]} numberOfLines={1}>
        {node.zoneRuleId ? node.zoneName : 'Ikut induk'}
      </ThemedText>
    </Pressable>
  );

  /** Keterangan efektif: terjangkau/tidak dan zona beserta asal aturannya. */
  const renderEffective = (node: AreaNode) => {
    const coverageFrom =
      node.coverageSourceCode && node.coverageSourceCode !== node.code ? ` · dari ${node.coverageSourceName}` : '';
    const zoneFrom = node.zoneSourceCode && node.zoneSourceCode !== node.code ? ` · dari ${node.zoneSourceName}` : '';
    return (
      <View style={styles.effectiveCol}>
        <View style={styles.inlineRow}>
          <View style={[styles.dot, { backgroundColor: node.isCovered ? theme.success : theme.textSecondary }]} />
          <ThemedText style={[styles.tiny, { color: node.isCovered ? theme.success : theme.textSecondary }]}>
            {node.isCovered ? 'Terjangkau' : node.coverageSourceCode ? 'Tidak terjangkau' : 'Belum diatur'}
            {coverageFrom}
          </ThemedText>
        </View>
        {node.zoneId ? (
          <ThemedText style={[styles.tiny, muted]} numberOfLines={1}>
            🗺️ {node.zoneName}
            {node.zoneIsActive ? '' : ' (nonaktif)'}
            {zoneFrom} · 🛵 {node.driverName ?? 'belum ada driver'}
          </ThemedText>
        ) : null}
        {node.coverageRulesBelow + node.zoneRulesBelow > 0 ? (
          <ThemedText style={[styles.tiny, muted]}>
            {[
              node.coverageRulesBelow > 0 ? `${node.coverageRulesBelow} aturan jangkauan` : null,
              node.zoneRulesBelow > 0 ? `${node.zoneRulesBelow} pemetaan zona` : null,
            ]
              .filter(Boolean)
              .join(' · ')}{' '}
            di wilayah bawahnya
          </ThemedText>
        ) : null}
        {node.warning ? (
          <ThemedText style={[styles.tiny, styles.bold, { color: theme.warning }]}>⚠ {node.warning}</ThemedText>
        ) : null}
      </View>
    );
  };

  const renderNode = (node: AreaNode, isParent = false) => {
    const busy = busyCode === node.code;
    const drillable = !isParent && node.hasChildren;
    return (
      <View
        key={node.code}
        style={[
          isParent ? card : [styles.row, { borderBottomColor: theme.border }],
          isParent && { borderColor: theme.secondary },
        ]}
      >
        <Pressable
          onPress={drillable ? () => setParentCode(node.code) : undefined}
          disabled={!drillable}
          style={({ pressed }) => [styles.nameCol, drillable && pressed && { opacity: 0.7 }, drillable && styles.pointer]}
          accessibilityRole={drillable ? 'button' : undefined}
          accessibilityLabel={drillable ? `Buka ${node.name}` : undefined}
        >
          <View style={styles.inlineRow}>
            <ThemedText style={[isParent ? styles.title : styles.name, strong]} numberOfLines={1}>
              {node.name}
            </ThemedText>
            {drillable ? <ThemedText style={[styles.chevron, muted]}>›</ThemedText> : null}
            {busy ? <ActivityIndicator size="small" color={theme.primary} /> : null}
          </View>
          <ThemedText style={[styles.tiny, muted]}>
            {LEVEL_LABEL[node.level]} · {node.code}
          </ThemedText>
          {renderEffective(node)}
        </Pressable>

        <View style={styles.controlsCol}>
          {renderCoverageControl(node)}
          {renderZoneControl(node)}
        </View>
      </View>
    );
  };

  const data = area.data;
  const childLabel = CHILD_LEVEL_LABEL[data?.parent?.level ?? 0];

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Wilayah Antar" subtitle="Jangkauan pengantaran & zona driver" fallbackHref="/admin" />

      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={area.isRefetching} onRefresh={() => area.refetch()} />}
      >
        <View style={[card, styles.helpCard]}>
          <ThemedText style={[styles.small, muted]}>
            Atur di level mana saja. Aturan paling spesifik yang berlaku: mis. Kota Yogyakarta “Terjangkau” tetapi
            Kecamatan Jetis “Tidak”. Wilayah tanpa aturan sama sekali dianggap tidak terjangkau, dan pesanan ke
            sana ditolak.
          </ThemedText>
        </View>

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="🔍 Cari provinsi / kota / kecamatan / kelurahan atau kode pos"
          placeholderTextColor={theme.textSecondary}
          style={[styles.search, { color: theme.text, borderColor: theme.border, backgroundColor: theme.card }]}
        />

        {searching ? (
          <View style={card}>
            {search.isLoading ? (
              <ActivityIndicator color={theme.primary} />
            ) : (search.data ?? []).length === 0 ? (
              <ThemedText style={[styles.small, muted]}>Tidak ada wilayah yang cocok.</ThemedText>
            ) : (
              (search.data ?? []).map((item) => (
                <Pressable
                  key={item.code}
                  onPress={() => openSearchResult(item)}
                  style={({ pressed }) => [styles.searchItem, { borderBottomColor: theme.border, opacity: pressed ? 0.7 : 1 }]}
                >
                  <ThemedText style={[styles.small, styles.bold, strong]}>
                    {item.name}{' '}
                    <ThemedText style={[styles.tiny, muted]}>
                      · {LEVEL_LABEL[item.level]}
                      {item.postalCode ? ` · ${item.postalCode}` : ''}
                    </ThemedText>
                  </ThemedText>
                  <ThemedText style={[styles.tiny, muted]}>
                    {item.path || 'Indonesia'}
                    {item.zoneName ? ` · 🗺️ ${item.zoneName}` : ''}
                  </ThemedText>
                </Pressable>
              ))
            )}
          </View>
        ) : (
          <>
            {/* Breadcrumb */}
            <View style={styles.crumbs}>
              <Pressable onPress={() => setParentCode(null)} style={styles.pointer}>
                <ThemedText style={[styles.small, styles.bold, { color: parentCode ? theme.primary : theme.text }]}>
                  Indonesia
                </ThemedText>
              </Pressable>
              {(data?.breadcrumb ?? []).map((c, i, arr) => {
                const last = i === arr.length - 1;
                return (
                  <React.Fragment key={c.code}>
                    <ThemedText style={[styles.small, muted]}>›</ThemedText>
                    <Pressable onPress={() => setParentCode(c.code)} disabled={last} style={!last && styles.pointer}>
                      <ThemedText style={[styles.small, styles.bold, { color: last ? theme.text : theme.primary }]}>
                        {c.name}
                      </ThemedText>
                    </Pressable>
                  </React.Fragment>
                );
              })}
            </View>

            {area.isLoading ? (
              <ActivityIndicator style={styles.loader} color={theme.primary} />
            ) : area.isError ? (
              <Pressable onPress={() => area.refetch()}>
                <ThemedText style={[styles.small, muted, styles.center]}>
                  {getApiErrorMessage(area.error, 'Gagal memuat wilayah.')} Ketuk untuk coba lagi.
                </ThemedText>
              </Pressable>
            ) : data ? (
              <>
                {data.parent ? renderNode(data.parent, true) : null}

                <View style={[card, styles.listCard]}>
                  <ThemedText style={[styles.small, styles.bold, muted, styles.listHeader]}>
                    {data.children.length} {childLabel}
                    {data.parent ? ` di ${data.parent.name}` : ''}
                  </ThemedText>
                  {data.children.map((node) => renderNode(node))}
                </View>
              </>
            ) : null}
          </>
        )}
      </ScrollView>

      <SelectModalPicker
        visible={!!zonePickerFor}
        title={zonePickerFor ? `Zona untuk ${zonePickerFor.name}` : 'Pilih zona'}
        placeholder="Cari zona..."
        items={zoneItems}
        isLoading={zones.isLoading}
        selectedValue={zonePickerFor ? zonePickerFor.zoneRuleId ?? INHERIT : undefined}
        onSelect={handlePickZone}
        onClose={() => setZonePickerFor(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 40, maxWidth: 1040, width: '100%', alignSelf: 'center' },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  helpCard: { paddingVertical: 10 },
  listCard: { paddingVertical: 4, gap: 0 },
  listHeader: { paddingVertical: 8 },
  search: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  searchItem: { paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, gap: 2, ...Platform.select({ web: { cursor: 'pointer' } }) },
  crumbs: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  nameCol: { flex: 1, minWidth: 260, gap: 2 },
  controlsCol: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap', maxWidth: '100%' },
  effectiveCol: { gap: 2, marginTop: 4 },
  inlineRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  name: { fontSize: 14, fontWeight: '600', flexShrink: 1 },
  title: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  chevron: { fontSize: 18, lineHeight: 18 },
  segment: { flexDirection: 'row', borderRadius: 10, padding: 3, gap: 2 },
  segmentBtn: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  zoneBtn: {
    width: 170,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  small: { fontSize: 13 },
  tiny: { fontSize: 11 },
  bold: { fontWeight: '700' },
  center: { textAlign: 'center' },
  loader: { marginTop: 30 },
  pointer: Platform.select({ web: { cursor: 'pointer' } }) ?? {},
});

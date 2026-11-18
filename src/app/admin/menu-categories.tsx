import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import {
  useCreateMenuCategory,
  useDeleteMenuCategory,
  useGetMasterMenus,
  useGetMenuCategories,
  useUpdateMenuCategory,
} from '@/features/menu/useMenu';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import type { MenuCategory, MenuType } from '@/types/menu';
import { confirmAction, showAlert } from '@/utils/alert';

const clickable = Platform.select({ web: { cursor: 'pointer' as const } }) ?? {};
const MAX_NAME_LENGTH = 50;

const SECTIONS: { type: MenuType; title: string; hint: string }[] = [
  { type: 'UTAMA', title: 'Kategori Utama', hint: 'Muncul sebagai pilihan "Kategori menu" di layar pesan.' },
  { type: 'SEKUNDER', title: 'Kategori Sekunder', hint: 'Tampil sebagai pelengkap di setiap hari kirim.' },
];

type FormState = { category: MenuCategory | null; name: string; type: MenuType; isActive: boolean };

/** Admin: tambah, ubah, urutkan, nonaktifkan, dan hapus kategori menu. */
export default function AdminMenuCategoriesScreen() {
  const theme = useTheme();
  const categories = useGetMenuCategories(undefined, true);
  const menus = useGetMasterMenus(undefined, undefined, true);
  const createCategory = useCreateMenuCategory();
  const updateCategory = useUpdateMenuCategory();
  const deleteCategory = useDeleteMenuCategory();
  const [form, setForm] = useState<FormState | null>(null);
  const [reordering, setReordering] = useState(false);

  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };
  const all = categories.data ?? [];
  const ofType = (type: MenuType) => all.filter((c) => c.categoryType === type);
  const menuCount = (id: string) => (menus.data ?? []).filter((m) => m.categoryId === id).length;
  const nextOrder = (type: MenuType) => Math.max(0, ...ofType(type).map((c) => c.displayOrder)) + 1;
  const busy = updateCategory.isPending || deleteCategory.isPending || reordering;

  const toRequest = (c: MenuCategory, patch: Partial<Pick<MenuCategory, 'displayOrder' | 'isActive'>>) => ({
    name: c.name,
    categoryType: c.categoryType,
    displayOrder: patch.displayOrder ?? c.displayOrder,
    isActive: patch.isActive ?? c.isActive,
  });

  const submitForm = () => {
    if (!form) return;
    const name = form.name.trim();
    if (!name) {
      showAlert('Nama Belum Diisi', 'Isi nama kategori terlebih dahulu.', { tone: 'warning' });
      return;
    }
    const onSuccess = () => setForm(null);
    const onError = (error: unknown) => showAlert('Gagal Menyimpan', getApiErrorMessage(error, 'Kategori tidak dapat disimpan.'), { tone: 'error' });

    if (form.category) {
      // Pindah tipe: masuk ke urutan paling bawah di tipe barunya
      const displayOrder = form.type === form.category.categoryType ? form.category.displayOrder : nextOrder(form.type);
      updateCategory.mutate(
        { id: form.category.id, data: { name, categoryType: form.type, displayOrder, isActive: form.isActive } },
        { onSuccess, onError }
      );
    } else {
      createCategory.mutate(
        { name, categoryType: form.type, displayOrder: nextOrder(form.type), isActive: form.isActive },
        { onSuccess, onError }
      );
    }
  };

  const toggleActive = (c: MenuCategory) =>
    updateCategory.mutate(
      { id: c.id, data: toRequest(c, { isActive: !c.isActive }) },
      { onError: (error) => showAlert('Gagal Mengubah Status', getApiErrorMessage(error, 'Status tidak dapat diubah.'), { tone: 'error' }) }
    );

  const move = async (list: MenuCategory[], index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    [next[index], next[target]] = [next[target], next[index]];

    // Pakai ulang nomor urut yang ada; bila ada yang kembar, susun ulang dari 1
    const current = list.map((c) => c.displayOrder);
    const slots = new Set(current).size === current.length ? [...current].sort((a, b) => a - b) : list.map((_, i) => i + 1);
    const changes = next
      .map((c, i) => ({ c, displayOrder: slots[i] }))
      .filter(({ c, displayOrder }) => c.displayOrder !== displayOrder);

    setReordering(true);
    try {
      await Promise.all(changes.map(({ c, displayOrder }) => updateCategory.mutateAsync({ id: c.id, data: toRequest(c, { displayOrder }) })));
    } catch (error) {
      showAlert('Gagal Mengubah Urutan', getApiErrorMessage(error, 'Urutan tidak dapat diubah.'), { tone: 'error' });
    } finally {
      setReordering(false);
    }
  };

  const remove = async (c: MenuCategory) => {
    const ok = await confirmAction('Hapus Kategori?', `Kategori ${c.name} akan dihapus.`, { confirmText: 'Hapus' });
    if (!ok) return;
    deleteCategory.mutate(c.id, {
      onError: (error) => showAlert('Gagal Menghapus', getApiErrorMessage(error, 'Kategori tidak dapat dihapus.'), { tone: 'error' }),
    });
  };

  const renderRow = (c: MenuCategory, list: MenuCategory[], index: number) => {
    const count = menuCount(c.id);
    return (
      <View key={c.id} style={[styles.row, { borderTopColor: theme.border }, index === 0 && styles.rowFirst]}>
        <View style={styles.orderCol}>
          <Pressable
            onPress={() => move(list, index, -1)}
            disabled={busy || index === 0}
            style={[styles.orderBtn, clickable, { borderColor: theme.border }, (busy || index === 0) && styles.disabled]}
            accessibilityRole="button"
            accessibilityLabel={`Naikkan ${c.name}`}
          >
            <ThemedText style={[styles.orderIcon, strong]}>▲</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => move(list, index, 1)}
            disabled={busy || index === list.length - 1}
            style={[styles.orderBtn, clickable, { borderColor: theme.border }, (busy || index === list.length - 1) && styles.disabled]}
            accessibilityRole="button"
            accessibilityLabel={`Turunkan ${c.name}`}
          >
            <ThemedText style={[styles.orderIcon, strong]}>▼</ThemedText>
          </Pressable>
        </View>

        <View style={styles.nameCol}>
          <ThemedText style={[styles.name, strong, !c.isActive && { color: theme.textSecondary }]} numberOfLines={1}>{c.name}</ThemedText>
          <ThemedText style={[styles.small, muted]}>
            {count} menu{c.isActive ? '' : ' · Disembunyikan dari pelanggan'}
          </ThemedText>
        </View>

        <View style={styles.actions}>
          <View style={styles.switchWrap}>
            <ThemedText style={[styles.small, muted]}>{c.isActive ? 'Aktif' : 'Nonaktif'}</ThemedText>
            <Switch
              value={c.isActive}
              onValueChange={() => toggleActive(c)}
              disabled={busy}
              trackColor={{ true: theme.primary, false: theme.border }}
              accessibilityLabel={`Status ${c.name}`}
            />
          </View>
          <Pressable
            onPress={() => setForm({ category: c, name: c.name, type: c.categoryType, isActive: c.isActive })}
            style={[styles.textBtn, clickable, { borderColor: theme.border }]}
            accessibilityRole="button"
            accessibilityLabel={`Ubah ${c.name}`}
          >
            <ThemedText style={[styles.textBtnLabel, strong]}>Ubah</ThemedText>
          </Pressable>
          <Pressable
            onPress={() => remove(c)}
            disabled={busy}
            style={[styles.textBtn, clickable, { borderColor: theme.danger }, busy && styles.disabled]}
            accessibilityRole="button"
            accessibilityLabel={`Hapus ${c.name}`}
          >
            <ThemedText style={[styles.textBtnLabel, { color: theme.danger }]}>Hapus</ThemedText>
          </Pressable>
        </View>
      </View>
    );
  };

  const saving = createCategory.isPending || updateCategory.isPending;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader
        title="Kelola Kategori Menu"
        subtitle="Kategori yang dipakai di menu dan layar pesan"
        fallbackHref="/admin"
        right={
          <Pressable
            onPress={() => setForm({ category: null, name: '', type: 'UTAMA', isActive: true })}
            style={[styles.addBtn, clickable, { backgroundColor: theme.primary }]}
            accessibilityRole="button"
          >
            <ThemedText style={styles.addBtnText}>+ Tambah</ThemedText>
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={styles.scroll}>
        {categories.isPending ? (
          <ActivityIndicator style={styles.loader} color={theme.primary} />
        ) : categories.isError ? (
          <Pressable onPress={() => categories.refetch()} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ThemedText style={muted}>{getApiErrorMessage(categories.error, 'Kategori tidak dapat dimuat.')} Ketuk untuk coba lagi.</ThemedText>
          </Pressable>
        ) : (
          SECTIONS.map((section) => {
            const list = ofType(section.type);
            return (
              <View key={section.type} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ThemedText style={[styles.sectionTitle, strong]}>{section.title}</ThemedText>
                <ThemedText style={[styles.small, muted]}>{section.hint}</ThemedText>
                {list.length === 0 ? (
                  <ThemedText style={[styles.small, muted, styles.empty]}>Belum ada kategori.</ThemedText>
                ) : (
                  <View style={styles.list}>{list.map((c, i) => renderRow(c, list, i))}</View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      <Modal visible={!!form} transparent animationType="fade" onRequestClose={() => setForm(null)}>
        {form ? (
          <View style={styles.overlay}>
            <View style={[styles.modal, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <ThemedText style={[styles.modalTitle, strong]}>{form.category ? 'Ubah Kategori' : 'Tambah Kategori'}</ThemedText>

              <View style={styles.field}>
                <ThemedText style={[styles.label, strong]}>Nama kategori</ThemedText>
                <TextInput
                  value={form.name}
                  onChangeText={(name) => setForm({ ...form, name })}
                  placeholder="Mis. Puree"
                  placeholderTextColor={theme.textSecondary}
                  maxLength={MAX_NAME_LENGTH}
                  autoFocus
                  style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
                  accessibilityLabel="Nama kategori"
                />
              </View>

              <View style={styles.field}>
                <ThemedText style={[styles.label, strong]}>Tipe</ThemedText>
                <View style={[styles.segment, { backgroundColor: theme.backgroundElement }]}>
                  {SECTIONS.map((s) => {
                    const active = form.type === s.type;
                    return (
                      <Pressable
                        key={s.type}
                        onPress={() => setForm({ ...form, type: s.type })}
                        style={[styles.segmentBtn, clickable, active && { backgroundColor: theme.card, borderColor: theme.primary }]}
                        accessibilityRole="radio"
                        aria-checked={active}
                      >
                        <ThemedText style={[styles.segmentText, { color: active ? theme.primary : theme.textSecondary }]}>
                          {s.type === 'UTAMA' ? 'Utama' : 'Sekunder'}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
                <ThemedText style={[styles.small, muted]}>{SECTIONS.find((s) => s.type === form.type)?.hint}</ThemedText>
              </View>

              <View style={styles.activeRow}>
                <View style={styles.nameCol}>
                  <ThemedText style={[styles.label, strong]}>Aktif</ThemedText>
                  <ThemedText style={[styles.small, muted]}>Kategori nonaktif dan menunya disembunyikan dari pelanggan.</ThemedText>
                </View>
                <Switch
                  value={form.isActive}
                  onValueChange={(isActive) => setForm({ ...form, isActive })}
                  trackColor={{ true: theme.primary, false: theme.border }}
                  accessibilityLabel="Kategori aktif"
                />
              </View>

              <View style={styles.modalActions}>
                <Pressable onPress={() => setForm(null)} style={[styles.modalBtn, clickable, { borderColor: theme.border }]} accessibilityRole="button">
                  <ThemedText style={[styles.modalBtnText, strong]}>Batal</ThemedText>
                </Pressable>
                <Pressable
                  onPress={submitForm}
                  disabled={saving}
                  style={[styles.modalBtn, clickable, { backgroundColor: theme.primary, borderColor: theme.primary }, saving && styles.disabled]}
                  accessibilityRole="button"
                >
                  {saving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <ThemedText style={[styles.modalBtnText, styles.onPrimary]}>Simpan</ThemedText>}
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 14, paddingBottom: 40, maxWidth: 860, width: '100%', alignSelf: 'center' },
  loader: { marginTop: 40 },
  card: { borderWidth: 1, borderRadius: 14, padding: 16, gap: 4 },
  sectionTitle: { fontSize: 16, fontWeight: '700' },
  small: { fontSize: 12 },
  empty: { paddingTop: 12 },
  list: { marginTop: 10 },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 12, borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 10 },
  rowFirst: { borderTopWidth: 0 },
  orderCol: { flexDirection: 'row', gap: 4 },
  orderBtn: { width: 30, height: 30, borderWidth: 1, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  orderIcon: { fontSize: 10 },
  nameCol: { flex: 1, minWidth: 140, gap: 2 },
  name: { fontSize: 15, fontWeight: '600' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  switchWrap: { flexDirection: 'row', alignItems: 'center', gap: 6, marginRight: 4 },
  textBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  textBtnLabel: { fontSize: 13, fontWeight: '600' },
  disabled: { opacity: 0.4 },
  addBtn: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  overlay: { flex: 1, backgroundColor: 'rgba(15, 23, 42, 0.55)', alignItems: 'center', justifyContent: 'center', padding: 20 },
  modal: { width: '100%', maxWidth: 440, borderWidth: 1, borderRadius: 18, padding: 20, gap: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  field: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600' },
  input: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  segment: { flexDirection: 'row', borderRadius: 10, padding: 3, gap: 3 },
  segmentBtn: { flex: 1, alignItems: 'center', borderWidth: 1, borderColor: 'transparent', borderRadius: 8, paddingVertical: 8 },
  segmentText: { fontSize: 14, fontWeight: '600' },
  activeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  modalActions: { flexDirection: 'row', gap: 10 },
  modalBtn: { flex: 1, minHeight: 44, borderWidth: 1, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  modalBtnText: { fontSize: 15, fontWeight: '700' },
  onPrimary: { color: '#FFFFFF' },
});

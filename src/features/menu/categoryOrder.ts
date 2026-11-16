import type { MenuCategory } from '@/types/menu';

export interface CategoryGroup<T> {
  key: string;
  label: string;
  items: T[];
}

/**
 * Kelompokkan item per kategori menu. Urutan: kategori utama lalu pelengkap, masing-masing sesuai urutan tampil
 * yang diatur admin; kategori yang tidak dikenal di akhir sesuai urutan kemunculannya.
 * Kategori dicocokkan lewat id (bila ada) atau nama.
 */
export function groupByCategory<T>(
  items: T[],
  categoryOf: (item: T) => { id?: string | null; name?: string | null },
  categories: MenuCategory[] | undefined
): CategoryGroup<T>[] {
  const ordered = [...(categories ?? [])].sort(
    (a, b) => (a.categoryType === b.categoryType ? 0 : a.categoryType === 'UTAMA' ? -1 : 1) || a.displayOrder - b.displayOrder
  );

  const groups = new Map<string, CategoryGroup<T> & { rank: number }>();
  items.forEach((item, index) => {
    const { id, name } = categoryOf(item);
    const category = ordered.find(
      (c) => (id && c.id.toLowerCase() === id.toLowerCase()) || (!!name && c.name.toLowerCase() === name.toLowerCase())
    );
    const key = (category?.id ?? id ?? name ?? 'lainnya').toLowerCase();
    const existing = groups.get(key);
    if (existing) existing.items.push(item);
    else {
      groups.set(key, {
        key,
        label: category?.name ?? (name || 'Lainnya'),
        items: [item],
        rank: category ? ordered.indexOf(category) : ordered.length + index,
      });
    }
  });
  return [...groups.values()].sort((a, b) => a.rank - b.rank);
}

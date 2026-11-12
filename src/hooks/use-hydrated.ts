import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * false saat render di server (export web statis) dan saat hydrate pertama di browser,
 * lalu true pada render berikutnya.
 *
 * Pakai untuk nilai yang berbeda antara server dan browser (lebar jendela, localStorage, dll.).
 * Saat hydrate, React tidak memperbaiki style/atribut yang berbeda dari HTML statis, jadi render
 * pertama harus sama dengan server; setelah itu React merender ulang dengan nilai asli.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}

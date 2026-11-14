import { useEffect, useState } from 'react';

/**
 * Nilai yang baru ikut berubah setelah `value` tidak berubah selama `delayMs`.
 * Dipakai untuk kolom pencarian agar API tidak dipanggil di setiap ketikan huruf.
 */
export function useDebouncedValue<T>(value: T, delayMs = 400): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

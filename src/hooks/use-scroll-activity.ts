import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Menandai apakah sebuah ScrollView sedang di-scroll.
 * `isScrolling` menjadi true begitu ada event scroll, lalu kembali false
 * setelah tidak ada event scroll selama `idleDelayMs`.
 */
export function useScrollActivity(idleDelayMs = 220) {
  const [isScrolling, setIsScrolling] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onScroll = useCallback(() => {
    setIsScrolling(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIsScrolling(false), idleDelayMs);
  }, [idleDelayMs]);

  useEffect(
    () => () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    },
    [],
  );

  return { isScrolling, onScroll };
}

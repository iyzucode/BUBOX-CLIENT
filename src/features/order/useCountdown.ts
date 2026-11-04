import { useEffect, useState } from 'react';

/** Sisa waktu (ms) menuju targetIso, diperbarui tiap detik. 0 bila sudah lewat. */
export function useCountdown(targetIso?: string | null): number {
  const target = targetIso ? new Date(targetIso).getTime() : 0;
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!target) return;
    const timer = setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= target) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [target]);

  return target ? Math.max(0, target - now) : 0;
}

export function formatCountdown(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

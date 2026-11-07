import { useState } from 'react';

import { useCountdown } from '@/features/order/useCountdown';

/** Jeda kirim ulang OTP; sama dengan aturan server (60 detik). */
export const OTP_RESEND_COOLDOWN_MS = 60_000;

/**
 * Hitung mundur sebelum tombol "Kirim ulang" aktif.
 * `startActive` true bila OTP baru saja dikirim saat layar dibuka (mis. setelah daftar).
 */
export function useResendCooldown(startActive: boolean) {
  const [availableAt, setAvailableAt] = useState<string | null>(() =>
    startActive ? new Date(Date.now() + OTP_RESEND_COOLDOWN_MS).toISOString() : null
  );
  const remainingMs = useCountdown(availableAt);

  return {
    secondsLeft: Math.ceil(remainingMs / 1000),
    canResend: remainingMs <= 0,
    restart: () => setAvailableAt(new Date(Date.now() + OTP_RESEND_COOLDOWN_MS).toISOString()),
  };
}

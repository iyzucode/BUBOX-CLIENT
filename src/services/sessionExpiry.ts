type SessionExpiredListener = () => void;

let listener: SessionExpiredListener | null = null;

/** Didaftarkan sekali di root layout: yang menangani pengalihan ke layar login. */
export function onSessionExpired(next: SessionExpiredListener) {
  listener = next;
  return () => {
    if (listener === next) listener = null;
  };
}

/** Dipanggil API client saat token ditolak server. */
export function notifySessionExpired() {
  listener?.();
}

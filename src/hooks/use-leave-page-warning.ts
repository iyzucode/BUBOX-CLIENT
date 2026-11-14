import { useEffect } from 'react';
import { Platform } from 'react-native';

/**
 * Web: minta konfirmasi browser sebelum halaman di-refresh, ditutup, atau ditinggal ke situs lain
 * selama `enabled` true. Isi & tampilan dialog ditentukan browser (pesan kustom diabaikan semua
 * browser modern), jadi tidak bisa memakai pop-up tema LUANNA.
 *
 * Tidak berpengaruh pada navigasi di dalam aplikasi (tombol kembali, router.push/replace) dan tidak
 * melakukan apa pun di Android/iOS.
 */
export function useLeavePageWarning(enabled: boolean) {
  useEffect(() => {
    if (Platform.OS !== 'web' || !enabled) return;

    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Chrome/Edge versi lama hanya menampilkan dialog bila returnValue diisi
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled]);
}

import { useEffect } from 'react';
import { Platform } from 'react-native';

/** Lebar tampilan desktop yang dipakai area admin di web, termasuk saat dibuka di HP. */
export const ADMIN_DESKTOP_WIDTH = 1280;

/** Harus sama dengan meta viewport di src/app/+html.tsx. */
const DEFAULT_VIEWPORT = 'width=device-width, initial-scale=1, shrink-to-fit=no';

/**
 * Viewport desktop: render selebar ADMIN_DESKTOP_WIDTH, lalu diperkecil (initial-scale) agar pas
 * selebar layar perangkat. Skala ditulis eksplisit karena beberapa browser HP tidak menghitung ulang
 * skala saat meta viewport diganti setelah halaman dimuat. Logika yang sama ada di +html.tsx.
 */
function desktopViewport(): string {
  const screenWidth = typeof window !== 'undefined' ? window.screen?.width || ADMIN_DESKTOP_WIDTH : ADMIN_DESKTOP_WIDTH;
  const scale = Math.min(1, screenWidth / ADMIN_DESKTOP_WIDTH);
  return `width=${ADMIN_DESKTOP_WIDTH}, initial-scale=${scale.toFixed(3)}`;
}

/**
 * Web: kunci halaman ke tampilan desktop selama `enabled` (area admin), seperti fitur "Situs desktop"
 * di browser HP: browser merender selebar ADMIN_DESKTOP_WIDTH lalu memperkecilnya agar pas di layar
 * (pengguna tetap bisa cubit-perbesar), sehingga sidebar & tata letak admin selalu versi desktop.
 * Saat keluar dari area admin, viewport dikembalikan ke lebar perangkat (layar customer).
 * Browser desktop mengabaikan meta viewport, jadi tidak ada efek di laptop/PC.
 *
 * Catatan: useWindowDimensions tetap melaporkan lebar fisik HP (react-native-web menghitung dari
 * visualViewport × zoom), jadi keputusan "tampilan desktop" untuk admin dibuat di _layout.tsx
 * berdasarkan rute, bukan lebar layar.
 *
 * Tidak berpengaruh di aplikasi Android/iOS.
 */
export function useDesktopViewport(enabled: boolean) {
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;

    let meta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'viewport';
      document.head.appendChild(meta);
    }

    const next = enabled ? desktopViewport() : DEFAULT_VIEWPORT;
    if (meta.getAttribute('content') !== next) {
      meta.setAttribute('content', next);
    }
  }, [enabled]);
}

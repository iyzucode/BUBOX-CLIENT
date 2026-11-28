import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';

/** Jeda minimal antarpengukuran posisi saat layar digulir. */
const SYNC_THROTTLE_MS = 100;
/** Gulir dianggap berhenti bila tidak ada event gulir selama ini. */
const SCROLL_IDLE_MS = 160;
/** Setelah menggulir otomatis, luncuran berikutnya ditahan selama animasi berjalan. */
const AUTO_SCROLL_LOCK_MS = 600;

const measureY = (node: View | null | undefined) =>
  new Promise<{ y: number; h: number } | null>((resolve) => {
    if (!node) {
      resolve(null);
      return;
    }
    node.measureInWindow((_x, y, _w, h) => resolve({ y, h }));
  });

/**
 * Gulir layar order:
 * - Tab hari menempel di atas layar setelah deretan tanggal di kartu "Tanggal pemesanan" tergulir keluar layar.
 * - Dua posisi henti: akhir konfigurasi terlihat penuh (bagian bawahnya tepat di atas bar checkout) atau
 *   konfigurasi tersembunyi penuh (menu tepat di bawah tab yang menempel). Bila gulir berhenti di antara keduanya,
 *   layar meluncur ke salah satunya sesuai arah gulir terakhir. Di dalam konfigurasi (bila lebih tinggi dari layar,
 *   mis. kategori terbuka) dan di dalam daftar menu gulir tetap bebas.
 * Posisi diukur saat dibutuhkan (bukan dari onLayout): di web onLayout tidak terpicu saat konten di atasnya berubah.
 *
 * @param pinnedHeight tinggi total tab yang menempel (termasuk safe area atas).
 * @param bottomInset tinggi area bawah yang tertutup bar checkout.
 */
export function usePinnedDayTabs(pinnedHeight: number, bottomInset: number) {
  const scrollRef = useRef<ScrollView>(null);
  const rootRef = useRef<View>(null);
  /** Deretan tanggal di kartu "Tanggal pemesanan". */
  const chipsRowRef = useRef<View>(null);
  /** Awal daftar menu hari yang dipilih. */
  const menuRef = useRef<View>(null);
  /** Panel konfigurasi (tanggal & kategori). */
  const configRef = useRef<View>(null);
  const scrollY = useRef(0);
  /** Posisi saat rangkaian gulir saat ini dimulai (null = sedang diam). */
  const scrollStartY = useRef<number | null>(null);
  const maxScrollY = useRef(0);
  const viewportHeight = useRef(0);
  const direction = useRef<'up' | 'down'>('down');
  const isDragging = useRef(false);
  const lockUntil = useRef(0);
  const lastSync = useRef(0);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(
    () => () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
      if (idleTimer.current) clearTimeout(idleTimer.current);
    },
    []
  );

  const sync = useCallback(async () => {
    lastSync.current = Date.now();
    const [root, row] = await Promise.all([measureY(rootRef.current), measureY(chipsRowRef.current)]);
    if (!root) return;
    // Menempel begitu deretan tanggal seluruhnya sudah tergulir keluar dari atas layar
    setIsPinned(!!row && row.y + row.h <= root.y);
  }, []);

  /** Posisi gulir saat konfigurasi tersembunyi penuh (menu tepat di bawah tab yang menempel). */
  const menuOffset = useCallback(async () => {
    const [root, menu] = await Promise.all([measureY(rootRef.current), measureY(menuRef.current)]);
    if (!root || !menu) return null;
    return Math.max(0, scrollY.current + menu.y - root.y - pinnedHeight);
  }, [pinnedHeight]);

  const autoScrollTo = useCallback((y: number) => {
    lockUntil.current = Date.now() + AUTO_SCROLL_LOCK_MS;
    scrollRef.current?.scrollTo({ y, animated: true });
  }, []);

  /** Gulir berhenti di antara akhir konfigurasi & posisi menu: luncurkan ke salah satunya sesuai arah gulir. */
  const snapIfBetween = useCallback(async () => {
    const startY = scrollStartY.current;
    scrollStartY.current = null;
    if (isDragging.current || Date.now() < lockUntil.current) return;
    const [root, menu, config] = await Promise.all([
      measureY(rootRef.current),
      measureY(menuRef.current),
      measureY(configRef.current),
    ]);
    if (!root || !menu || !config) return;
    const y = scrollY.current;
    // Menu pendek: posisi menu dibatasi ujung gulir
    const menuStop = Math.min(Math.max(0, y + menu.y - root.y - pinnedHeight), maxScrollY.current);
    // Posisi saat bagian bawah konfigurasi tepat terlihat di atas bar checkout (0 bila konfigurasi muat di layar)
    const configBottom = y + config.y + config.h - root.y;
    const configStop = Math.max(0, configBottom - (viewportHeight.current - bottomInset));
    if (menuStop - configStop <= 8 || y <= configStop + 1 || y >= menuStop - 1) return;
    if (direction.current === 'up') {
      autoScrollTo(configStop);
      return;
    }
    // Gulir ke bawah yang dimulai dari dalam konfigurasi berhenti dulu di akhir konfigurasi (bagian bawahnya,
    // mis. kategori terakhir, bisa terlihat); gulir ke bawah berikutnya dari sana baru meluncur ke menu.
    const startedInsideConfig = startY != null && startY < configStop - 1;
    autoScrollTo(startedInsideConfig ? configStop : menuStop);
  }, [autoScrollTo, pinnedHeight, bottomInset]);

  const scheduleSnap = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(snapIfBetween, SCROLL_IDLE_MS);
  }, [snapIfBetween]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      if (scrollStartY.current == null) scrollStartY.current = scrollY.current;
      const delta = contentOffset.y - scrollY.current;
      if (Math.abs(delta) > 0.5) direction.current = delta > 0 ? 'down' : 'up';
      scrollY.current = contentOffset.y;
      viewportHeight.current = layoutMeasurement.height;
      maxScrollY.current = Math.max(0, contentSize.height - layoutMeasurement.height);

      if (syncTimer.current) clearTimeout(syncTimer.current);
      const elapsed = Date.now() - lastSync.current;
      if (elapsed >= SYNC_THROTTLE_MS) sync();
      // Pengukuran terakhir setelah gulir berhenti, agar status tidak tertinggal
      else syncTimer.current = setTimeout(sync, SYNC_THROTTLE_MS - elapsed);

      scheduleSnap();
    },
    [sync, scheduleSnap]
  );

  // Android/iOS: jangan meluncur selama jari masih menahan layar. Di web event ini tidak selalu
  // berpasangan (onScrollEndDrag bisa tidak terpicu), jadi cukup mengandalkan jeda gulir.
  const handleScrollBeginDrag = useCallback(() => {
    if (Platform.OS !== 'web') isDragging.current = true;
  }, []);
  const handleScrollEndDrag = useCallback(() => {
    isDragging.current = false;
    scheduleSnap();
  }, [scheduleSnap]);

  /** Gulir sehingga awal daftar menu berada tepat di bawah tab yang menempel. */
  const scrollToMenu = useCallback(async () => {
    const offset = await menuOffset();
    if (offset == null) return;
    autoScrollTo(offset);
  }, [menuOffset, autoScrollTo]);

  return {
    scrollRef,
    rootRef,
    chipsRowRef,
    menuRef,
    configRef,
    isPinned,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    scrollToMenu,
  };
}

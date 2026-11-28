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
 * - Dua posisi henti: konfigurasi terlihat penuh (atas) atau tersembunyi penuh (menu tepat di bawah tab yang
 *   menempel). Bila gulir berhenti di antara keduanya, layar meluncur ke salah satunya sesuai arah gulir terakhir.
 *   Di dalam daftar menu gulir tetap bebas.
 * Posisi diukur saat dibutuhkan (bukan dari onLayout): di web onLayout tidak terpicu saat konten di atasnya berubah.
 *
 * @param pinnedHeight tinggi total tab yang menempel (termasuk safe area atas).
 */
export function usePinnedDayTabs(pinnedHeight: number) {
  const scrollRef = useRef<ScrollView>(null);
  const rootRef = useRef<View>(null);
  /** Deretan tanggal di kartu "Tanggal pemesanan". */
  const chipsRowRef = useRef<View>(null);
  /** Awal daftar menu hari yang dipilih. */
  const menuRef = useRef<View>(null);
  const scrollY = useRef(0);
  const maxScrollY = useRef(0);
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

  /** Gulir berhenti di antara posisi atas & posisi menu: luncurkan ke salah satunya sesuai arah gulir. */
  const snapIfBetween = useCallback(async () => {
    if (isDragging.current || Date.now() < lockUntil.current) return;
    const offset = await menuOffset();
    if (offset == null) return;
    // Menu pendek: posisi menu dibatasi ujung gulir
    const menuStop = Math.min(offset, maxScrollY.current);
    const y = scrollY.current;
    if (menuStop <= 8 || y <= 1 || y >= menuStop - 1) return;
    autoScrollTo(direction.current === 'down' ? menuStop : 0);
  }, [menuOffset, autoScrollTo]);

  const scheduleSnap = useCallback(() => {
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(snapIfBetween, SCROLL_IDLE_MS);
  }, [snapIfBetween]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      const delta = contentOffset.y - scrollY.current;
      if (Math.abs(delta) > 0.5) direction.current = delta > 0 ? 'down' : 'up';
      scrollY.current = contentOffset.y;
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
    isPinned,
    handleScroll,
    handleScrollBeginDrag,
    handleScrollEndDrag,
    scrollToMenu,
  };
}

import { useCallback, useEffect, useRef, useState } from 'react';
import type { NativeScrollEvent, NativeSyntheticEvent, ScrollView, View } from 'react-native';

/** Jeda minimal antarpengukuran posisi saat layar digulir. */
const SYNC_THROTTLE_MS = 120;
/** Setelah melompat ke satu hari, hari aktif tidak dihitung ulang selama animasi gulir berjalan. */
const JUMP_LOCK_MS = 700;
/** Jarak kartu hari dari bawah deretan tanggal setelah melompat. */
const JUMP_GAP = 8;
/** Kartu dianggap sedang dilihat bila bagian atasnya sudah melewati garis ini (di bawah deretan tanggal). */
const ACTIVE_LINE_OFFSET = 24;

type Box = { y: number; h: number };

const measure = (node: View | null | undefined) =>
  new Promise<Box | null>((resolve) => {
    if (!node) {
      resolve(null);
      return;
    }
    node.measureInWindow((_x, y, _w, h) => resolve({ y, h }));
  });

/**
 * Pelacak hari di layar order: kapan deretan tanggal sudah tergulir keluar layar (lalu ditampilkan menempel
 * di atas), hari mana yang sedang dilihat, dan lompat ke kartu hari tertentu.
 * Posisi selalu diukur saat dibutuhkan (bukan dari onLayout), karena di web onLayout tidak terpicu
 * ketika kartu bergeser akibat kartu di atasnya dibuka / ditutup.
 *
 * @param pinnedHeight tinggi total deretan tanggal saat menempel di atas layar.
 */
export function useDayTracker(pinnedHeight: number) {
  const scrollRef = useRef<ScrollView>(null);
  const rootRef = useRef<View>(null);
  const chipsRowRef = useRef<View>(null);
  const dayNodes = useRef(new Map<string, View>());
  const scrollY = useRef(0);
  const atBottom = useRef(false);
  const lockUntil = useRef(0);
  const lastSync = useRef(0);
  const syncSeq = useRef(0);
  const trailing = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [isPinned, setIsPinned] = useState(false);

  useEffect(
    () => () => {
      if (trailing.current) clearTimeout(trailing.current);
    },
    []
  );

  const registerDay = useCallback((key: string, node: View | null) => {
    if (node) dayNodes.current.set(key, node);
    else dayNodes.current.delete(key);
  }, []);

  const sync = useCallback(async () => {
    const seq = ++syncSeq.current;
    lastSync.current = Date.now();
    const [root, row, days] = await Promise.all([
      measure(rootRef.current),
      measure(chipsRowRef.current),
      Promise.all([...dayNodes.current].map(async ([key, node]) => ({ key, box: await measure(node) }))),
    ]);
    // Hasil pengukuran lama diabaikan bila sudah ada pengukuran yang lebih baru
    if (seq !== syncSeq.current || !root) return;

    setIsPinned(!!row && row.y + row.h <= root.y);
    if (Date.now() < lockUntil.current) return;

    const measured = days
      .filter((d): d is { key: string; box: Box } => d.box != null)
      .sort((a, b) => a.box.y - b.box.y);
    if (measured.length === 0) return;

    const line = root.y + pinnedHeight + ACTIVE_LINE_OFFSET;
    let current = measured[0].key;
    measured.forEach((d) => {
      if (d.box.y <= line) current = d.key;
    });
    // Kartu terakhir yang pendek tidak pernah mencapai garis: anggap aktif saat gulir sudah di dasar
    if (atBottom.current) current = measured[measured.length - 1].key;
    setActiveKey(current);
  }, [pinnedHeight]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
      scrollY.current = contentOffset.y;
      atBottom.current = contentOffset.y + layoutMeasurement.height >= contentSize.height - 8;

      if (trailing.current) clearTimeout(trailing.current);
      const elapsed = Date.now() - lastSync.current;
      if (elapsed >= SYNC_THROTTLE_MS) sync();
      // Pengukuran terakhir setelah gulir berhenti, agar status tidak tertinggal
      else trailing.current = setTimeout(sync, SYNC_THROTTLE_MS - elapsed);
    },
    [sync]
  );

  const jumpTo = useCallback(
    async (key: string) => {
      setActiveKey(key);
      lockUntil.current = Date.now() + JUMP_LOCK_MS;
      const [root, day] = await Promise.all([measure(rootRef.current), measure(dayNodes.current.get(key))]);
      if (!root || !day) return;

      // Kartu berhenti tepat di bawah deretan tanggal yang menempel di atas layar
      const target = scrollY.current + day.y - root.y - pinnedHeight - JUMP_GAP;
      scrollRef.current?.scrollTo({ y: Math.max(0, target), animated: true });
    },
    [pinnedHeight]
  );

  return { scrollRef, rootRef, chipsRowRef, activeKey, isPinned, registerDay, handleScroll, jumpTo };
}

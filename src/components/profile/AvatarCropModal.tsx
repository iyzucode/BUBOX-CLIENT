import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  GestureResponderEvent,
  Image,
  Modal,
  PanResponder,
  PanResponderGestureState,
  Platform,
  Pressable,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

/** Gambar hasil pilihan galeri; ukuran dalam piksel asli (sama dengan koordinat crop). */
export interface AvatarCropSource {
  uri: string;
  width: number;
  height: number;
}

/** Area persegi dalam piksel gambar asli yang akan dipotong. */
export interface AvatarCropRect {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

interface AvatarCropModalProps {
  /** Null = modal tertutup. */
  source: AvatarCropSource | null;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: (rect: AvatarCropRect) => void;
}

const MAX_ZOOM = 4;
const MAX_FRAME = 360;
/** Jarak lingkaran ke tepi area pratinjau, agar bagian di luar lingkaran tetap terlihat (redup). */
const CIRCLE_INSET = 20;
const WEB_ONLY = (style: object) => (Platform.OS === 'web' ? style : null);

/**
 * Atur foto profil sebelum diunggah: geser untuk memposisikan, zoom lewat
 * cubit (layar sentuh) atau scroll mouse. Hasilnya area persegi di bawah lingkaran.
 */
export const AvatarCropModal: React.FC<AvatarCropModalProps> = ({ source, isSaving, onCancel, onConfirm }) => {
  return (
    <Modal visible={!!source} transparent animationType="fade" onRequestClose={() => !isSaving && onCancel()}>
      <View style={styles.backdrop}>
        {source ? (
          // key: tiap foto baru mulai dari posisi & zoom awal.
          <CropEditor key={source.uri} source={source} isSaving={isSaving} onCancel={onCancel} onConfirm={onConfirm} />
        ) : null}
      </View>
    </Modal>
  );
};

interface Transform {
  zoom: number;
  x: number;
  y: number;
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
const touchDistance = (touches: { pageX: number; pageY: number }[]) =>
  Math.hypot(touches[0].pageX - touches[1].pageX, touches[0].pageY - touches[1].pageY);

/**
 * Status gesture yang berubah di setiap event (posisi awal geser, jarak cubit).
 * Disimpan di luar state React agar handler PanResponder selalu membaca nilai terbaru;
 * tiap perubahan posisi/zoom diteruskan ke React lewat `onChange`.
 */
class CropGestureController {
  private current: Transform = { zoom: 1, x: 0, y: 0 };
  private pan = { startX: 0, startY: 0, dx0: 0, dy0: 0, pinchDist: 0, pinchZoom: 1, resetPan: false };
  private readonly normalize: (t: Transform) => Transform;
  private readonly onChange: (t: Transform) => void;

  constructor(normalize: (t: Transform) => Transform, onChange: (t: Transform) => void) {
    this.normalize = normalize;
    this.onChange = onChange;
  }

  private apply(next: Transform) {
    this.current = this.normalize(next);
    this.onChange(this.current);
  }

  setZoom(zoom: number) {
    this.apply({ ...this.current, zoom });
  }

  zoomBy(factor: number) {
    this.setZoom(this.current.zoom * factor);
  }

  /** Geser (1 jari / mouse) & cubit (2 jari) di area foto. */
  readonly photoResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder: () => true,
    onPanResponderTerminationRequest: () => false,
    onPanResponderGrant: () => {
      this.pan = {
        startX: this.current.x,
        startY: this.current.y,
        dx0: 0,
        dy0: 0,
        pinchDist: 0,
        pinchZoom: this.current.zoom,
        resetPan: false,
      };
    },
    onPanResponderMove: (evt: GestureResponderEvent, gs: PanResponderGestureState) => {
      const g = this.pan;
      const touches = evt.nativeEvent.touches ?? [];
      if (touches.length >= 2) {
        const dist = touchDistance(touches);
        if (!g.pinchDist) {
          g.pinchDist = dist;
          g.pinchZoom = this.current.zoom;
        } else if (dist > 0) {
          this.setZoom((g.pinchZoom * dist) / g.pinchDist);
        }
        g.resetPan = true;
        return;
      }
      if (g.resetPan) {
        // Kembali ke 1 jari setelah cubit: lanjut geser dari posisi sekarang tanpa lompatan.
        g.startX = this.current.x;
        g.startY = this.current.y;
        g.dx0 = gs.dx;
        g.dy0 = gs.dy;
        g.pinchDist = 0;
        g.resetPan = false;
      }
      this.apply({ ...this.current, x: g.startX + gs.dx - g.dx0, y: g.startY + gs.dy - g.dy0 });
    },
  });

}

const CropEditor: React.FC<Omit<AvatarCropModalProps, 'source'> & { source: AvatarCropSource }> = ({
  source,
  isSaving,
  onCancel,
  onConfirm,
}) => {
  const theme = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  // Ukuran area dikunci saat dibuka: penanganan gesture di bawah memakai geometri tetap ini.
  const [frame] = useState(() => Math.min(windowWidth - 32, MAX_FRAME));
  const circle = frame - CIRCLE_INSET * 2;
  // Skala dasar: sisi terpendek gambar pas dengan lingkaran (zoom 1).
  const baseScale = circle / Math.min(source.width, source.height);

  /** Batasi geser agar lingkaran selalu tertutup gambar (tidak ada area kosong). */
  const normalize = (next: Transform): Transform => {
    const zoom = clamp(next.zoom, 1, MAX_ZOOM);
    const scale = baseScale * zoom;
    const maxX = (source.width * scale - circle) / 2;
    const maxY = (source.height * scale - circle) / 2;
    return { zoom, x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) };
  };

  const [transform, setTransform] = useState<Transform>({ zoom: 1, x: 0, y: 0 });
  // Geometri tetap selama editor terbuka (frame dikunci, source sama karena key), jadi aman dibuat sekali.
  const [controller] = useState(() => new CropGestureController(normalize, setTransform));

  // Scroll mouse untuk zoom (web).
  const areaRef = useRef<View>(null);
  useEffect(() => {
    if (Platform.OS !== 'web') return;
    const node = areaRef.current as unknown as HTMLElement | null;
    if (!node?.addEventListener) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      controller.zoomBy(Math.exp(-e.deltaY * 0.0015));
    };
    node.addEventListener('wheel', onWheel, { passive: false });
    return () => node.removeEventListener('wheel', onWheel);
  }, [controller]);

  const handleConfirm = () => {
    const { zoom, x, y } = transform;
    const scale = baseScale * zoom;
    const side = Math.max(1, Math.floor(Math.min(circle / scale, source.width, source.height)));
    // Pusat lingkaran dalam koordinat gambar asli.
    const centerX = source.width / 2 - x / scale;
    const centerY = source.height / 2 - y / scale;
    onConfirm({
      originX: clamp(Math.round(centerX - side / 2), 0, source.width - side),
      originY: clamp(Math.round(centerY - side / 2), 0, source.height - side),
      width: side,
      height: side,
    });
  };

  const scale = baseScale * transform.zoom;
  const imageWidth = source.width * scale;
  const imageHeight = source.height * scale;
  const ring = frame; // tebal bingkai gelap: cukup untuk menutup sudut area

  return (
    <View style={[styles.card, { backgroundColor: theme.card, width: frame + 32 }]}>
      <ThemedText style={[styles.title, { color: theme.text }]}>Sesuaikan Foto</ThemedText>

      <View ref={areaRef} style={[styles.area, { width: frame, height: frame }]}>
        <Image
          source={{ uri: source.uri }}
          resizeMode="stretch"
          style={{
            position: 'absolute',
            width: imageWidth,
            height: imageHeight,
            left: frame / 2 - imageWidth / 2 + transform.x,
            top: frame / 2 - imageHeight / 2 + transform.y,
          }}
        />
        {/* Area di luar lingkaran diredupkan: border tebal pada lingkaran besar. */}
        <View
          pointerEvents="none"
          style={[
            styles.mask,
            {
              left: CIRCLE_INSET - ring,
              top: CIRCLE_INSET - ring,
              width: circle + ring * 2,
              height: circle + ring * 2,
              borderRadius: circle / 2 + ring,
              borderWidth: ring,
            },
          ]}
        />
        <View
          pointerEvents="none"
          style={[
            styles.circleOutline,
            { left: CIRCLE_INSET, top: CIRCLE_INSET, width: circle, height: circle, borderRadius: circle / 2 },
          ]}
        />
        {/* Lapisan penangkap gesture di atas foto (mencegah drag gambar bawaan browser). */}
        <View
          {...controller.photoResponder.panHandlers}
          style={[StyleSheet.absoluteFill, WEB_ONLY({ cursor: 'grab', touchAction: 'none', userSelect: 'none' })]}
          accessibilityLabel="Area atur posisi foto"
        />
      </View>

      <View style={styles.actions}>
        <Pressable
          onPress={onCancel}
          disabled={isSaving}
          style={[styles.actionButton, { borderColor: theme.border, opacity: isSaving ? 0.5 : 1 }]}
          accessibilityRole="button"
        >
          <ThemedText style={[styles.actionText, { color: theme.text }]}>Batal</ThemedText>
        </Pressable>
        <Pressable
          onPress={handleConfirm}
          disabled={isSaving}
          style={[styles.actionButton, styles.primaryButton, { backgroundColor: theme.primary }]}
          accessibilityRole="button"
        >
          {isSaving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ThemedText style={[styles.actionText, styles.primaryText]}>Simpan</ThemedText>
          )}
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
  },
  area: {
    overflow: 'hidden',
    backgroundColor: '#000000',
    borderRadius: 12,
  },
  mask: {
    position: 'absolute',
    borderColor: 'rgba(0, 0, 0, 0.6)',
  },
  circleOutline: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
  },
  actions: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    gap: 12,
    marginTop: 4,
  },
  actionButton: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    borderWidth: 0,
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  primaryText: {
    color: '#FFFFFF',
  },
});

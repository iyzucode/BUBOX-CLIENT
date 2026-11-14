import React, { useRef, useState } from 'react';
import { Modal, Platform, Pressable, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';

const clickable = Platform.select({ web: { cursor: 'pointer' as const } }) ?? {};

export interface MenuItem {
  key: string;
  label: string;
  /** Teks kecil di kanan, mis. jumlah. */
  hint?: string;
  selected?: boolean;
  onPress: () => void;
}

interface MenuButtonProps {
  items: MenuItem[];
  /** Isi tombol pemicu. */
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Rata kanan menu terhadap tombol (untuk tombol di sisi kanan layar). */
  align?: 'left' | 'right';
  menuWidth?: number;
  accessibilityLabel?: string;
}

/** Tombol dengan menu tarik-turun kecil (ditampilkan di atas layar, tertutup saat klik di luar). */
export const MenuButton: React.FC<MenuButtonProps> = ({
  items, children, style, align = 'left', menuWidth = 220, accessibilityLabel,
}) => {
  const theme = useTheme();
  const anchor = useRef<View>(null);
  const [pos, setPos] = useState<{ x: number; y: number; w: number; h: number } | null>(null);

  const open = () => anchor.current?.measureInWindow((x, y, w, h) => setPos({ x, y, w, h }));
  const close = () => setPos(null);

  return (
    <>
      <Pressable
        ref={anchor}
        onPress={open}
        style={[clickable, style]}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ expanded: !!pos }}
      >
        {children}
      </Pressable>
      <Modal visible={!!pos} transparent animationType="none" onRequestClose={close}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Tutup menu" />
        {pos ? (
          <View
            style={[
              styles.menu,
              {
                top: pos.y + pos.h + 4,
                left: align === 'right' ? Math.max(8, pos.x + pos.w - menuWidth) : pos.x,
                width: menuWidth,
                backgroundColor: theme.card,
                borderColor: theme.border,
              },
            ]}
            accessibilityRole="menu"
          >
            {items.map((item) => (
              <Pressable
                key={item.key}
                onPress={() => {
                  close();
                  item.onPress();
                }}
                style={({ hovered, pressed }) => [
                  styles.item,
                  clickable,
                  (hovered || pressed) && { backgroundColor: theme.backgroundElement },
                  item.selected && { backgroundColor: theme.primaryLight },
                ]}
                accessibilityRole="menuitem"
                accessibilityState={{ selected: !!item.selected }}
              >
                <ThemedText style={[styles.label, { color: item.selected ? theme.primary : theme.text }]} numberOfLines={1}>
                  {item.label}
                </ThemedText>
                {item.hint ? <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>{item.hint}</ThemedText> : null}
              </Pressable>
            ))}
          </View>
        ) : null}
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  menu: {
    position: 'absolute',
    borderWidth: 1,
    borderRadius: 10,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  item: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 9, marginHorizontal: 4, borderRadius: 7 },
  label: { flex: 1, fontSize: 13, fontWeight: '500' },
  hint: { fontSize: 12 },
});

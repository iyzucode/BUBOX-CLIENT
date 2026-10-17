import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { useProfilePalette } from './profilePalette';
import {
  OrderIconUnpaid,
  OrderIconActive,
  OrderIconCompleted,
  OrderIconCancelled,
} from './ProfileIcons';

interface OrderStatusItem {
  id: string;
  label: string;
  icon: (color: string) => React.ReactNode;
}

export const ProfileOrderStatusBar: React.FC = () => {
  const router = useRouter();
  const palette = useProfilePalette();

  const statuses: OrderStatusItem[] = [
    {
      id: 'unpaid',
      label: 'Belum Bayar',
      icon: (color) => <OrderIconUnpaid size={28} color={color} />,
    },
    {
      id: 'active',
      label: 'Aktif',
      icon: (color) => <OrderIconActive size={28} color={color} />,
    },
    {
      id: 'completed',
      label: 'Selesai',
      icon: (color) => <OrderIconCompleted size={28} color={color} />,
    },
    {
      id: 'cancelled',
      label: 'Dibatalkan',
      icon: (color) => <OrderIconCancelled size={28} color={color} />,
    },
  ];

  const handleStatusPress = (statusId: string) => {
    // Navigate to order page or history
    router.push('/order');
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.cardBg,
          borderColor: palette.cardBorder,
        },
      ]}
    >
      {/* Header Title */}
      <View style={styles.header}>
        <ThemedText style={[styles.headerTitle, { color: palette.cardTitle }]}>
          Pesanan Saya
        </ThemedText>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: palette.divider }]} />

      {/* 4 Status Action Columns */}
      <View style={styles.statusRow}>
        {statuses.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => handleStatusPress(item.id)}
            style={({ pressed }) => [
              styles.statusCol,
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Lihat pesanan ${item.label}`}
          >
            {/* White Rounded Square Button */}
            <View
              style={[
                styles.iconBox,
                {
                  backgroundColor: palette.actionBoxBg,
                  borderColor: palette.actionBoxBorder,
                },
              ]}
            >
              {item.icon(palette.actionIconColor)}
            </View>

            {/* Label below button */}
            <ThemedText
              style={[styles.statusLabel, { color: palette.actionLabel }]}
              numberOfLines={1}
            >
              {item.label}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: '100%',
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  divider: {
    height: 1,
    width: '100%',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  statusCol: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    flex: 1,
    ...Platform.select({
      web: { cursor: 'pointer' },
    }),
  },
  iconBox: {
    width: 58,
    height: 58,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1.5 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
      web: {
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      } as any,
    }),
  },
  statusLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
});

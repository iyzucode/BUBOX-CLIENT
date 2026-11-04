import React from 'react';
import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { useThemeContext } from '@/context/ThemeContext';
import { DAY_STATUS_META, ORDER_STATUS_META, toneColors } from '@/features/order/orderStatus';
import { OrderDayStatusCode, OrderStatusCode } from '@/types/order';

type StatusBadgeProps =
  | { kind: 'order'; status: OrderStatusCode; size?: 'sm' | 'md' }
  | { kind: 'day'; status: OrderDayStatusCode; size?: 'sm' | 'md' };

export const StatusBadge: React.FC<StatusBadgeProps> = (props) => {
  const { isDark } = useThemeContext();
  const meta = props.kind === 'order' ? ORDER_STATUS_META[props.status] : DAY_STATUS_META[props.status];
  const colors = toneColors(meta?.tone ?? 'neutral', isDark);
  const small = props.size === 'sm';

  return (
    <View style={[styles.badge, small && styles.badgeSm, { backgroundColor: colors.bg }]}>
      <ThemedText style={[styles.text, small && styles.textSm, { color: colors.text }]}>
        {meta ? `${meta.icon} ${meta.label}` : props.status}
      </ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
  textSm: {
    fontSize: 11,
  },
});

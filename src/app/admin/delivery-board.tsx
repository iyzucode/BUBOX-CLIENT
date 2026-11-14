import React, { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { DeliveryBoard } from '@/components/order/DeliveryBoard';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { addDaysKey } from '@/features/order/adminBoardUtils';
import { toDateKey } from '@/features/order/dateUtils';
import { formatLongDate } from '@/features/order/orderStatus';
import { useTheme } from '@/hooks/use-theme';

const clickable = Platform.select({ web: { cursor: 'pointer' as const } }) ?? {};

/** Papan Antar: kiriman satu tanggal dikelompokkan per driver, untuk penugasan & keberangkatan. */
export default function AdminDeliveryBoardScreen() {
  const theme = useTheme();
  const today = toDateKey(new Date());
  const [date, setDate] = useState(today);
  const strong = { color: theme.text };

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title="Papan Antar" subtitle="Kiriman per driver untuk satu tanggal" fallbackHref="/admin" />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={[styles.dayNav, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Pressable onPress={() => setDate((d) => addDaysKey(d, -1))} style={[styles.navBtn, clickable]} accessibilityLabel="Hari sebelumnya">
            <ThemedText style={strong}>‹</ThemedText>
          </Pressable>
          <Pressable onPress={() => setDate(today)} style={[styles.flex, clickable]} accessibilityLabel="Kembali ke hari ini">
            <ThemedText style={[styles.dayNavText, strong]}>🗓️ {formatLongDate(date)}</ThemedText>
          </Pressable>
          <Pressable onPress={() => setDate((d) => addDaysKey(d, 1))} style={[styles.navBtn, clickable]} accessibilityLabel="Hari berikutnya">
            <ThemedText style={strong}>›</ThemedText>
          </Pressable>
        </View>
        {/* key: pilihan kiriman direset saat tanggal berganti */}
        <DeliveryBoard key={date} date={date} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 40, maxWidth: 760, width: '100%', alignSelf: 'center' },
  flex: { flex: 1 },
  dayNav: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderRadius: 14, padding: 10 },
  navBtn: { paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8 },
  dayNavText: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
});

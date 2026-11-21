import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import {
  OrderSettingsScreen,
  SettingsSaveButton,
  settingsStyles as styles,
  useSaveOrderSettings,
} from '@/components/order/OrderSettingsShell';
import { formatDateTime, formatShortDate } from '@/features/order/orderStatus';
import { useOrderCutoffInfo } from '@/features/order/useOrders';
import { useTheme } from '@/hooks/use-theme';
import { OrderSettings } from '@/types/order';
import { showAlert } from '@/utils/alert';

const DAY_OPTIONS = [0, 1, 2, 3];

/** Batas pemesanan: hari & jam cutoff (Admin / Super Admin). */
export default function AdminCutoffScreen() {
  return (
    <OrderSettingsScreen title="Cutoff" subtitle="Batas hari & jam pemesanan">
      {(settings) => <CutoffForm key={settings.updatedAt ?? 'default'} settings={settings} />}
    </OrderSettingsScreen>
  );
}

const CutoffForm: React.FC<{ settings: OrderSettings }> = ({ settings }) => {
  const theme = useTheme();
  const { data: cutoff } = useOrderCutoffInfo();
  const { save, isPending } = useSaveOrderSettings(settings);

  const [daysBefore, setDaysBefore] = useState(settings.cutoffDaysBefore);
  const [cutoffTime, setCutoffTime] = useState(settings.cutoffTime);

  const handleSave = () => {
    if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(cutoffTime.trim())) {
      showAlert('Jam Tidak Valid', 'Gunakan format HH:mm, contoh 17:00.', { tone: 'warning' });
      return;
    }
    save({ cutoffDaysBefore: daysBefore, cutoffTime: cutoffTime.trim() });
  };

  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];
  const input = [styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }];
  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };

  return (
    <>
      {/* Ringkasan aturan yang berlaku */}
      <View style={[card, { backgroundColor: theme.primaryLight }]}>
        <ThemedText style={[styles.sectionTitle, strong]}>
          ⏰ Pesan paling lambat {settings.cutoffDaysBefore === 0 ? 'hari H' : `H-${settings.cutoffDaysBefore}`} pukul{' '}
          {settings.cutoffTime}
        </ThemedText>
        {cutoff ? (
          <ThemedText style={[styles.small, muted]}>
            Saat ini tanggal kirim paling awal: {formatShortDate(cutoff.earliestDeliveryDate)}
          </ThemedText>
        ) : null}
        <ThemedText style={[styles.tiny, muted]}>
          🌐 {settings.timeZone}
          {settings.updatedAt ? ` · diubah ${formatDateTime(settings.updatedAt)}` : ''}
        </ThemedText>
      </View>

      <View style={card}>
        <ThemedText style={[styles.label, strong]}>Hari cutoff</ThemedText>
        <View style={styles.segment}>
          {DAY_OPTIONS.map((d) => {
            const active = d === daysBefore;
            return (
              <Pressable
                key={d}
                onPress={() => setDaysBefore(d)}
                style={[styles.segmentBtn, { backgroundColor: active ? theme.primary : theme.backgroundElement }]}
              >
                <ThemedText style={[styles.small, styles.bold, { color: active ? '#FFFFFF' : theme.text }]}>
                  {d === 0 ? 'Hari H' : `H-${d}`}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>

        <ThemedText style={[styles.label, strong]}>Jam cutoff</ThemedText>
        <TextInput
          value={cutoffTime}
          onChangeText={setCutoffTime}
          placeholder="17:00"
          placeholderTextColor={theme.textSecondary}
          maxLength={5}
          keyboardType="numbers-and-punctuation"
          style={input}
        />
        <ThemedText style={[styles.tiny, muted]}>
          Pembayaran yang selesai setelah jam ini tetap diterima selama masih dalam batas waktu bayar QRIS (diatur di
          menu Pembayaran).
        </ThemedText>
      </View>

      <SettingsSaveButton onPress={handleSave} isPending={isPending} />
    </>
  );
};

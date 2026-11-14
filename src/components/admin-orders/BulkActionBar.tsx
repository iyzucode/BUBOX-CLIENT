import React from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import type { BulkTargets } from '@/features/order/adminBoardUtils';
import { useTheme } from '@/hooks/use-theme';
import type { OrderDayStatusCode } from '@/types/order';

const clickable = Platform.select({ web: { cursor: 'pointer' as const } }) ?? {};

interface BulkActionBarProps {
  count: number;
  targets: BulkTargets;
  /** Kitchen / Driver / Admin: majukan status. */
  canAdvance: boolean;
  /** Admin: driver, refund, batalkan. */
  canManage: boolean;
  busy: boolean;
  onAdvance: (status: OrderDayStatusCode, ids: string[], label: string) => void;
  onAssignDriver: (ids: string[]) => void;
  onMarkRefund: (ids: string[]) => void;
  onCancel: (ids: string[]) => void;
  onClear: () => void;
}

/**
 * Bar aksi untuk hari kirim yang dicentang. Tiap tombol hanya berlaku untuk hari yang cocok
 * (mis. "Siapkan (3)" dari 5 yang dipilih), sehingga tidak ada kiriman yang dipaksa ke status yang salah.
 */
export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  count, targets, canAdvance, canManage, busy, onAdvance, onAssignDriver, onMarkRefund, onCancel, onClear,
}) => {
  const theme = useTheme();

  const button = (key: string, label: string, onPress: () => void, variant: 'primary' | 'outline' | 'danger' = 'outline') => (
    <Pressable
      key={key}
      onPress={onPress}
      disabled={busy}
      style={[
        styles.btn,
        clickable,
        variant === 'primary' && { backgroundColor: theme.primary, borderColor: theme.primary },
        variant === 'outline' && { borderColor: theme.border, backgroundColor: theme.card },
        variant === 'danger' && { borderColor: theme.danger, backgroundColor: theme.card },
        busy && styles.disabled,
      ]}
      accessibilityRole="button"
    >
      <ThemedText
        style={[styles.btnText, { color: variant === 'primary' ? '#FFFFFF' : variant === 'danger' ? theme.danger : theme.text }]}
      >
        {label}
      </ThemedText>
    </Pressable>
  );

  const nothing =
    (!canAdvance || targets.advance.length === 0) &&
    (!canManage || (targets.driver.length === 0 && targets.refund.length === 0 && targets.cancel.length === 0));

  return (
    <View style={[styles.bar, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
      <ThemedText style={[styles.count, { color: theme.text }]}>{count} dipilih</ThemedText>
      {busy ? <ActivityIndicator size="small" color={theme.primary} /> : null}

      <View style={styles.actions}>
        {canAdvance
          ? targets.advance.map((t) => button(`adv-${t.status}`, `${t.label} (${t.ids.length})`, () => onAdvance(t.status, t.ids, t.label), 'primary'))
          : null}
        {canManage && targets.driver.length > 0 ? button('driver', `Atur driver (${targets.driver.length})`, () => onAssignDriver(targets.driver)) : null}
        {canManage && targets.refund.length > 0 ? button('refund', `Tandai direfund (${targets.refund.length})`, () => onMarkRefund(targets.refund)) : null}
        {canManage && targets.cancel.length > 0 ? button('cancel', `Batalkan (${targets.cancel.length})`, () => onCancel(targets.cancel), 'danger') : null}
        {nothing ? (
          <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>Tidak ada aksi yang berlaku untuk pilihan ini.</ThemedText>
        ) : null}
      </View>

      {targets.blockedNoDriver > 0 && canAdvance ? (
        <ThemedText style={[styles.hint, { color: theme.warning }]}>{targets.blockedNoDriver} belum punya driver, tidak bisa diberangkatkan</ThemedText>
      ) : null}

      <Pressable onPress={onClear} style={[styles.clear, clickable]} accessibilityRole="button" accessibilityLabel="Batal pilih">
        <ThemedText style={[styles.btnText, { color: theme.primary }]}>Batal pilih ✕</ThemedText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  count: { fontSize: 13, fontWeight: '800' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6, flex: 1 },
  btn: { borderWidth: 1, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 6 },
  btnText: { fontSize: 12, fontWeight: '700' },
  hint: { fontSize: 11 },
  clear: { paddingHorizontal: 6, paddingVertical: 4 },
  disabled: { opacity: 0.5 },
});

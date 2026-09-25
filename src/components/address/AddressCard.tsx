import React from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useTheme } from '@/hooks/use-theme';
import { Address } from '@/types/address';

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => void;
  onSetPrimary: (id: string) => void;
  isSettingPrimary?: boolean;
  isDeleting?: boolean;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  onEdit,
  onDelete,
  onSetPrimary,
  isSettingPrimary,
  isDeleting,
}) => {
  const theme = useTheme();

  const handleDeletePress = () => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Apakah Anda yakin ingin menghapus alamat "${address.label}"?`)) {
        onDelete(address.id);
      }
    } else {
      Alert.alert(
        'Hapus Alamat',
        `Apakah Anda yakin ingin menghapus alamat "${address.label}"?`,
        [
          { text: 'Batal', style: 'cancel' },
          { text: 'Hapus', style: 'destructive', onPress: () => onDelete(address.id) },
        ]
      );
    }
  };

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: address.isPrimary ? theme.primary : theme.border,
          borderWidth: address.isPrimary ? 1.5 : 1,
        },
      ]}
    >
      {/* Header Row: Label & Primary Badge */}
      <View style={styles.headerRow}>
        <View style={styles.labelGroup}>
          <View
            style={[
              styles.labelBadge,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
            ]}
          >
            <ThemedText type="smallBold" style={styles.labelText}>
              {address.label}
            </ThemedText>
          </View>

          {address.isPrimary && (
            <View style={styles.primaryBadge}>
              <ThemedText type="code" style={styles.primaryBadgeText}>
                ★ UTAMA
              </ThemedText>
            </View>
          )}
        </View>

        <ThemedText type="small" style={styles.recipientName}>
          {address.recipientName}
        </ThemedText>
      </View>

      {/* Phone Number */}
      <View style={styles.phoneRow}>
        <ThemedText style={{ fontSize: 13 }}>📞</ThemedText>
        <ThemedText type="small" style={styles.phoneText}>
          {address.phoneNumber}
        </ThemedText>
      </View>

      {/* Full Address */}
      <ThemedText type="default" style={styles.addressText}>
        {address.fullAddress}
      </ThemedText>

      {/* Region details */}
      <ThemedText type="small" style={styles.regionText}>
        {address.subdistrict}, {address.city}, {address.province} {address.postalCode}
      </ThemedText>

      {/* Notes / Kurir Landmark */}
      {address.notes ? (
        <View
          style={[
            styles.notesBox,
            { backgroundColor: theme.backgroundElement, borderColor: theme.border },
          ]}
        >
          <ThemedText type="small" style={styles.notesLabel}>
            Catatan Kurir / Patokan:
          </ThemedText>
          <ThemedText type="small" style={styles.notesText}>
            {address.notes}
          </ThemedText>
        </View>
      ) : null}

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        {!address.isPrimary && (
          <Pressable
            onPress={() => onSetPrimary(address.id)}
            disabled={isSettingPrimary}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <ThemedText type="smallBold" style={{ color: theme.primary, fontSize: 12 }}>
              {isSettingPrimary ? 'Memproses...' : 'Jadikan Utama'}
            </ThemedText>
          </Pressable>
        )}

        <View style={styles.rightActions}>
          <Pressable
            onPress={() => onEdit(address)}
            style={({ pressed }) => [
              styles.actionBtn,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: theme.border,
              },
              pressed && styles.pressed,
            ]}
          >
            <ThemedText type="smallBold" style={{ fontSize: 12 }}>
              ✏ Edit
            </ThemedText>
          </Pressable>

          <Pressable
            onPress={handleDeletePress}
            disabled={isDeleting}
            style={({ pressed }) => [
              styles.actionBtnDanger,
              pressed && styles.pressed,
            ]}
          >
            <ThemedText type="smallBold" style={styles.dangerBtnText}>
              {isDeleting ? '...' : '🗑 Hapus'}
            </ThemedText>
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  labelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  labelText: {
    fontSize: 12,
  },
  primaryBadge: {
    backgroundColor: '#10B98118',
    borderColor: '#10B98150',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  primaryBadgeText: {
    fontSize: 10,
    color: '#10B981',
    fontWeight: '700',
  },
  recipientName: {
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.9,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  phoneText: {
    fontSize: 13,
    opacity: 0.8,
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  regionText: {
    fontSize: 13,
    opacity: 0.7,
  },
  notesBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    gap: 2,
    marginTop: 2,
  },
  notesLabel: {
    fontSize: 11,
    opacity: 0.6,
  },
  notesText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ffffff10',
    flexWrap: 'wrap',
    gap: 8,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  actionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  actionBtnDanger: {
    backgroundColor: '#EF444415',
    borderColor: '#EF444430',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    cursor: 'pointer' as any,
  },
  dangerBtnText: {
    color: '#EF4444',
    fontSize: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});

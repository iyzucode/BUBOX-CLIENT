import React, { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { useThemeContext } from '@/context/ThemeContext';
import { Address } from '@/types/address';

interface AddressCardProps {
  address: Address;
  onEdit: (address: Address) => void;
  onDelete: (id: string) => void;
  onSetPrimary: (id: string) => void;
  isSettingPrimary?: boolean;
  isDeleting?: boolean;
  isMenuOpen?: boolean;
  onToggleMenu?: () => void;
  onCloseMenu?: () => void;
}

export const AddressCard: React.FC<AddressCardProps> = ({
  address,
  onEdit,
  onDelete,
  onSetPrimary,
  isSettingPrimary,
  isDeleting,
  isMenuOpen: isMenuOpenProp,
  onToggleMenu,
  onCloseMenu,
}) => {
  const { isDark } = useThemeContext();
  const [internalMenuOpen, setInternalMenuOpen] = useState(false);
  const isControlled = typeof isMenuOpenProp === 'boolean';
  const isMenuOpen = isControlled ? isMenuOpenProp : internalMenuOpen;

  const handleToggleMenu = () => {
    if (isControlled) {
      onToggleMenu?.();
    } else {
      setInternalMenuOpen((prev) => !prev);
    }
  };

  const handleCloseMenu = () => {
    if (isControlled) {
      onCloseMenu?.();
    } else {
      setInternalMenuOpen(false);
    }
  };

  const popoverTextColor = isDark ? '#F3F4F6' : '#111827';

  const handleDeletePress = () => {
    handleCloseMenu();
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

  const formattedAddress = [
    address.fullAddress,
    address.subdistrict ? `Kecamatan ${address.subdistrict}` : null,
    address.city,
    address.province,
    address.postalCode,
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <View
      style={[
        styles.cardWrapper,
        isMenuOpen && { zIndex: 1000 },
      ]}
    >
      {/* 1. Pill Badge "UTAMA" sitting on top-left of the card */}
      {address.isPrimary && (
        <View style={styles.primaryBadgeWrapper}>
          <View style={styles.primaryBadge}>
            <ThemedText style={styles.primaryBadgeText}>UTAMA</ThemedText>
          </View>
        </View>
      )}

      {/* 2. Main Card Body */}
      <View
        style={[
          styles.card,
          {
            backgroundColor: isDark ? '#262A32' : '#D9D9D9',
          },
          isMenuOpen && { zIndex: 1000 },
        ]}
      >
        {/* Header Bar: Location Pin Icon + Label + Three Dots Button */}
        <View style={styles.headerRow}>
          <View style={styles.labelGroup}>
            <View style={styles.pinSquare}>
              {Platform.OS === 'web' ? (
                <svg
                  width="13"
                  height="13"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              ) : (
                <ThemedText style={{ fontSize: 11, color: '#FFFFFF' }}>📍</ThemedText>
              )}
            </View>
            <ThemedText
              style={[
                styles.labelText,
                { color: isDark ? '#F3F4F6' : '#111827' },
              ]}
            >
              {address.label}
            </ThemedText>
          </View>

          {/* Three Dots Action Button */}
          <Pressable
            onPress={handleToggleMenu}
            style={({ pressed }) => [
              styles.threeDotsBtn,
              pressed && styles.buttonPressed,
            ]}
            accessibilityLabel={`Menu Opsi ${address.label}`}
            accessibilityRole="button"
          >
            {Platform.OS === 'web' ? (
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
                color={isDark ? '#E5E7EB' : '#111827'}
              >
                <circle cx="5" cy="12" r="2.2" />
                <circle cx="12" cy="12" r="2.2" />
                <circle cx="19" cy="12" r="2.2" />
              </svg>
            ) : (
              <ThemedText style={[styles.dotsText, { color: isDark ? '#E5E7EB' : '#111827' }]}>
                •••
              </ThemedText>
            )}
          </Pressable>
        </View>

        {/* Divider Line */}
        <View
          style={[
            styles.divider,
            { backgroundColor: isDark ? '#3E4552' : '#B8B8B8' },
          ]}
        />

        {/* Details Content */}
        <View style={styles.contentBody}>
          <ThemedText
            style={[
              styles.recipientName,
              { color: isDark ? '#F9FAFB' : '#111827' },
            ]}
          >
            {address.recipientName}
          </ThemedText>

          <ThemedText
            style={[
              styles.phoneText,
              { color: isDark ? '#E5E7EB' : '#1F2937' },
            ]}
          >
            {address.phoneNumber}
          </ThemedText>

          <ThemedText
            style={[
              styles.addressText,
              { color: isDark ? '#D1D5DB' : '#374151' },
            ]}
          >
            {formattedAddress}
          </ThemedText>

          {/* Special Notes / Patokan in Bold */}
          {address.notes ? (
            <ThemedText
              style={[
                styles.notesText,
                { color: isDark ? '#FFFFFF' : '#111827' },
              ]}
            >
              {address.notes}
            </ThemedText>
          ) : null}
        </View>

        {/* 3. Popover Dropdown Menu (Triggered by Three Dots) */}
        {isMenuOpen && (
          <>
            {/* Backdrop for closing popover when clicking anywhere outside */}
            <Pressable
              style={styles.popoverBackdrop}
              onPress={handleCloseMenu}
            />

            <View
              style={[
                styles.popoverMenu,
                {
                  backgroundColor: isDark ? '#374151' : '#9CA3AF',
                },
              ]}
            >
              {/* Option: Edit */}
              <Pressable
                onPress={() => {
                  handleCloseMenu();
                  onEdit(address);
                }}
                style={({ pressed }) => [
                  styles.popoverItem,
                  pressed && styles.popoverItemPressed,
                ]}
                accessibilityLabel="Edit Alamat"
                accessibilityRole="button"
              >
                <ThemedText style={[styles.popoverItemText, { color: popoverTextColor }]}>
                  Edit
                </ThemedText>
                {Platform.OS === 'web' ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={popoverTextColor}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                ) : (
                  <ThemedText style={{ fontSize: 13, color: popoverTextColor }}>✏</ThemedText>
                )}
              </Pressable>

              <View style={styles.popoverDivider} />

              {/* Option: Hapus */}
              <Pressable
                onPress={handleDeletePress}
                disabled={isDeleting}
                style={({ pressed }) => [
                  styles.popoverItem,
                  pressed && styles.popoverItemPressed,
                ]}
                accessibilityLabel="Hapus Alamat"
                accessibilityRole="button"
              >
                <ThemedText style={[styles.popoverItemText, { color: popoverTextColor }]}>
                  {isDeleting ? 'Menghapus...' : 'Hapus'}
                </ThemedText>
                {Platform.OS === 'web' ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke={popoverTextColor}
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  </svg>
                ) : (
                  <ThemedText style={{ fontSize: 13, color: popoverTextColor }}>🗑</ThemedText>
                )}
              </Pressable>

              {/* Option: Jadikan Utama (if not primary) */}
              {!address.isPrimary && (
                <>
                  <View style={styles.popoverDivider} />
                  <Pressable
                    onPress={() => {
                      handleCloseMenu();
                      onSetPrimary(address.id);
                    }}
                    disabled={isSettingPrimary}
                    style={({ pressed }) => [
                      styles.popoverItem,
                      pressed && styles.popoverItemPressed,
                    ]}
                    accessibilityLabel="Jadikan Alamat Utama"
                    accessibilityRole="button"
                  >
                    <ThemedText style={[styles.popoverItemText, { color: popoverTextColor }]}>
                      {isSettingPrimary ? 'Memproses...' : 'Jadikan Utama'}
                    </ThemedText>
                    {Platform.OS === 'web' ? (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke={popoverTextColor}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                      </svg>
                    ) : (
                      <ThemedText style={{ fontSize: 13, color: popoverTextColor }}>★</ThemedText>
                    )}
                  </Pressable>
                </>
              )}
            </View>
          </>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    width: '100%',
    position: 'relative',
    marginBottom: 16,
    zIndex: 1,
  },
  primaryBadgeWrapper: {
    flexDirection: 'row',
    marginLeft: 14,
    marginBottom: -4,
    zIndex: 1,
  },
  primaryBadge: {
    backgroundColor: '#5C5C5C',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 8,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  primaryBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  card: {
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 18,
    position: 'relative',
    zIndex: 2,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
      },
      default: {
        elevation: 2,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  labelGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  pinSquare: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: '#5C5C5C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.1,
  },
  threeDotsBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  dotsText: {
    fontSize: 18,
    letterSpacing: 1.5,
  },
  divider: {
    height: 1,
    width: '100%',
    marginTop: 10,
    marginBottom: 12,
  },
  contentBody: {
    gap: 3,
  },
  recipientName: {
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  phoneText: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '400',
    lineHeight: 19,
    marginTop: 2,
  },
  notesText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    marginTop: 4,
  },
  popoverBackdrop: {
    ...Platform.select({
      web: {
        position: 'fixed' as any,
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 990,
      },
      default: {
        ...(StyleSheet.absoluteFill as any),
        zIndex: 990,
      },
    }),
  },
  popoverMenu: {
    position: 'absolute',
    top: 38,
    right: 14,
    minWidth: 170,
    borderRadius: 8,
    paddingVertical: 6,
    zIndex: 1000,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
      },
      default: {
        elevation: 6,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25,
        shadowRadius: 6,
      },
    }),
  },
  popoverItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 12,
    cursor: 'pointer' as any,
  },
  popoverItemPressed: {
    opacity: 0.7,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  popoverItemText: {
    fontSize: 12.5,
    fontWeight: '600',
    color: '#111827',
  },
  popoverDivider: {
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
    marginHorizontal: 8,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { AddressCard } from '@/components/address/AddressCard';
import { useThemeContext } from '@/context/ThemeContext';
import {
  useAddresses,
  useDeleteAddress,
  useSetPrimaryAddress,
} from '@/features/biodata/useAddresses';
import { Address } from '@/types/address';

export default function AddressesScreen() {
  const { isDark, theme } = useThemeContext();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const { data: addresses, isLoading, isError, error, refetch } = useAddresses();
  const setPrimaryMutation = useSetPrimaryAddress();
  const deleteMutation = useDeleteAddress();

  const handleOpenAdd = () => {
    router.push('/address-form');
  };

  const handleOpenEdit = (addr: Address) => {
    router.push({
      pathname: '/address-form',
      params: { id: addr.id },
    });
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await setPrimaryMutation.mutateAsync(id);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        'Gagal menjadikan alamat utama.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Gagal', msg);
      }
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        'Gagal menghapus alamat.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Gagal', msg);
      }
    }
  };

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/profile');
    }
  };

  const headerPaddingTop = insets.top > 0 ? insets.top + 8 : 16;

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: isDark ? '#111827' : '#FFFFFF' },
      ]}
    >
      {/* 1. CUSTOM TOP HEADER (Dark Grey Bar with Circle 'X' & 'Alamat' Text) */}
      <View
        style={[
          styles.headerBar,
          {
            paddingTop: headerPaddingTop,
            backgroundColor: isDark ? '#1F2937' : '#616161',
          },
        ]}
      >
        <View
          style={[
            styles.headerInner,
            { maxWidth: isDesktop ? 600 : '100%' },
          ]}
        >
          {/* Circular Close / Cancel Button */}
          <Pressable
            onPress={handleClose}
            style={({ pressed }) => [
              styles.closeCircleButton,
              pressed && styles.buttonPressed,
            ]}
            accessibilityLabel="Tutup dan Kembali"
            accessibilityRole="button"
          >
            {Platform.OS === 'web' ? (
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#111827"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            ) : (
              <ThemedText style={styles.closeIconText}>✕</ThemedText>
            )}
          </Pressable>

          {/* Right Header Title */}
          <ThemedText style={styles.headerTitle}>Alamat</ThemedText>
        </View>
      </View>

      {/* 2. SCROLLABLE ADDRESS LIST */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { maxWidth: isDesktop ? 600 : '100%' },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        onScrollBeginDrag={() => setOpenMenuId(null)}
      >
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText style={[styles.loadingText, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Memuat daftar alamat...
            </ThemedText>
          </View>
        ) : isError ? (
          <View
            style={[
              styles.stateCard,
              {
                backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
                borderColor: isDark ? '#374151' : '#E5E7EB',
              },
            ]}
          >
            <ThemedText style={{ fontSize: 32 }}>⚠️</ThemedText>
            <ThemedText style={[styles.stateTitle, { color: theme.text }]}>
              Gagal Memuat Alamat
            </ThemedText>
            <ThemedText style={[styles.stateDesc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              {error?.response?.data?.message || 'Terjadi kesalahan saat memuat data alamat.'}
            </ThemedText>
            <Pressable
              onPress={() => refetch()}
              style={({ pressed }) => [
                styles.retryButton,
                { backgroundColor: theme.primary },
                pressed && styles.buttonPressed,
              ]}
            >
              <ThemedText style={styles.retryButtonText}>Coba Lagi</ThemedText>
            </Pressable>
          </View>
        ) : !addresses || addresses.length === 0 ? (
          <View
            style={[
              styles.stateCard,
              {
                backgroundColor: isDark ? '#1F2937' : '#F3F4F6',
                borderColor: isDark ? '#374151' : '#E5E7EB',
              },
            ]}
          >
            <View style={styles.emptyIconCircle}>
              <ThemedText style={{ fontSize: 34 }}>📍</ThemedText>
            </View>
            <ThemedText style={[styles.stateTitle, { color: theme.text }]}>
              Belum Ada Alamat Tersimpan
            </ThemedText>
            <ThemedText style={[styles.stateDesc, { color: isDark ? '#9CA3AF' : '#6B7280' }]}>
              Tambahkan alamat rumah atau pengantaran katering si kecil dengan menekan tombol Tambah baru di bawah.
            </ThemedText>
          </View>
        ) : (
          <View style={styles.addressListContainer}>
            {addresses.map((addr) => (
              <AddressCard
                key={addr.id}
                address={addr}
                isMenuOpen={openMenuId === addr.id}
                onToggleMenu={() =>
                  setOpenMenuId((prev) => (prev === addr.id ? null : addr.id))
                }
                onCloseMenu={() => setOpenMenuId(null)}
                onEdit={(a) => {
                  setOpenMenuId(null);
                  handleOpenEdit(a);
                }}
                onDelete={(id) => {
                  setOpenMenuId(null);
                  handleDelete(id);
                }}
                onSetPrimary={(id) => {
                  setOpenMenuId(null);
                  handleSetPrimary(id);
                }}
                isSettingPrimary={
                  setPrimaryMutation.isPending &&
                  setPrimaryMutation.variables === addr.id
                }
                isDeleting={
                  deleteMutation.isPending &&
                  deleteMutation.variables === addr.id
                }
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* 3. STICKY BOTTOM BUTTON "Tambah baru +" */}
      <View
        style={[
          styles.stickyContainer,
          {
            maxWidth: isDesktop ? 600 : '100%',
            bottom: insets.bottom > 0 ? insets.bottom + 16 : 24,
          },
        ]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={handleOpenAdd}
          style={({ pressed }) => [
            styles.stickyAddButton,
            { backgroundColor: isDark ? '#374151' : '#D9D9D9' },
            pressed && styles.buttonPressed,
          ]}
          accessibilityLabel="Tambah Alamat Baru"
          accessibilityRole="button"
        >
          <ThemedText
            style={[
              styles.stickyAddText,
              { color: isDark ? '#F9FAFB' : '#111827' },
            ]}
          >
            Tambah baru
          </ThemedText>

          <View style={styles.plusCircle}>
            {Platform.OS === 'web' ? (
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="3.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            ) : (
              <ThemedText style={styles.plusIconText}>+</ThemedText>
            )}
          </View>
        </Pressable>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  headerBar: {
    width: '100%',
    paddingBottom: 16,
    paddingHorizontal: 20,
    zIndex: 20,
  },
  headerInner: {
    width: '100%',
    alignSelf: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeCircleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      web: {
        boxShadow: '0 2px 10px rgba(0, 0, 0, 0.15)',
        cursor: 'pointer',
      },
      default: {
        elevation: 4,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
    }),
  },
  closeIconText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 110,
  },
  addressListContainer: {
    width: '100%',
  },
  centerBox: {
    paddingVertical: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
  },
  stateCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    gap: 12,
    marginTop: 20,
  },
  emptyIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stateTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  stateDesc: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    maxWidth: 380,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 10,
    cursor: 'pointer' as any,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  stickyContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignSelf: 'center',
    alignItems: 'flex-end',
    paddingRight: 18,
    zIndex: 50,
    pointerEvents: 'box-none' as any,
  },
  stickyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingLeft: 18,
    paddingRight: 10,
    borderRadius: 24,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.16)',
        cursor: 'pointer',
      },
      default: {
        elevation: 6,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
    }),
  },
  stickyAddText: {
    fontSize: 15,
    fontWeight: '600',
  },
  plusCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusIconText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});

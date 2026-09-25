import React from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Navbar } from '@/components/ui/Navbar';
import { AddressCard } from '@/components/address/AddressCard';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  useAddresses,
  useDeleteAddress,
  useSetPrimaryAddress,
} from '@/features/biodata/useAddresses';
import { Address } from '@/types/address';

export default function AddressesScreen() {
  const theme = useTheme();
  const router = useRouter();

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

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Navbar */}
        <Navbar />

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button & Breadcrumb */}
          <View style={styles.topNavRow}>
            <Pressable
              onPress={() => router.push('/profile')}
              style={({ pressed }) => [
                styles.backBtn,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
                pressed && styles.pressed,
              ]}
            >
              <ThemedText type="smallBold" style={{ color: theme.text }}>
                ← Kembali ke Profil
              </ThemedText>
            </Pressable>
          </View>

          {/* Header Title & Add Button */}
          <View style={styles.headerRow}>
            <View style={{ flex: 1, gap: 4 }}>
              <ThemedText type="title" style={styles.title}>
                Alamat Pengiriman
              </ThemedText>
              <ThemedText type="small" style={styles.subtitle}>
                Kelola alamat pengantaran katering MPASI si kecil. Anda dapat menambahkan beberapa alamat berbeda.
              </ThemedText>
            </View>

            <Pressable
              onPress={handleOpenAdd}
              style={({ pressed }) => [
                styles.addBtn,
                { backgroundColor: theme.primary },
                pressed && styles.pressed,
              ]}
            >
              <ThemedText type="smallBold" style={styles.addBtnText}>
                + Tambah Alamat
              </ThemedText>
            </Pressable>
          </View>

          {/* List or State */}
          {isLoading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText type="small" style={{ opacity: 0.7, marginTop: 8 }}>
                Memuat daftar alamat...
              </ThemedText>
            </View>
          ) : isError ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <ThemedText style={{ fontSize: 32 }}>⚠️</ThemedText>
              <ThemedText type="subtitle">Gagal Memuat Alamat</ThemedText>
              <ThemedText type="small" style={styles.emptyDesc}>
                {error?.response?.data?.message || 'Terjadi kesalahan saat memuat data alamat.'}
              </ThemedText>
              <Pressable
                onPress={() => refetch()}
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
              >
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                  Coba Lagi
                </ThemedText>
              </Pressable>
            </View>
          ) : !addresses || addresses.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View
                style={[
                  styles.iconCircle,
                  {
                    backgroundColor: theme.primary + '15',
                    borderColor: theme.primary + '30',
                  },
                ]}
              >
                <ThemedText style={{ fontSize: 36 }}>📍</ThemedText>
              </View>
              <ThemedText type="subtitle" style={styles.emptyTitle}>
                Belum Ada Alamat Tersimpan
              </ThemedText>
              <ThemedText type="small" style={styles.emptyDesc}>
                Tambahkan alamat rumah, kantor, atau tujuan pengantaran Anda agar pengiriman katering dapat diproses dengan cepat.
              </ThemedText>
              <Pressable
                onPress={handleOpenAdd}
                style={[styles.actionButton, { backgroundColor: theme.primary }]}
              >
                <ThemedText type="smallBold" style={{ color: '#FFFFFF' }}>
                  + Tambah Alamat Pertama
                </ThemedText>
              </Pressable>
            </View>
          ) : (
            <View style={styles.addressList}>
              {addresses.map((addr) => (
                <AddressCard
                  key={addr.id}
                  address={addr}
                  onEdit={handleOpenEdit}
                  onDelete={handleDelete}
                  onSetPrimary={handleSetPrimary}
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
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContent: {
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: BottomTabInset + 24,
    gap: 12,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 12,
    paddingVertical: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.7,
    maxWidth: 520,
    lineHeight: 18,
  },
  addBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
  },
  centerBox: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 32,
    alignItems: 'center',
    textAlign: 'center',
    gap: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  emptyDesc: {
    fontSize: 13,
    textAlign: 'center',
    opacity: 0.7,
    maxWidth: 420,
    lineHeight: 18,
  },
  actionButton: {
    marginTop: 6,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    cursor: 'pointer' as any,
  },
  addressList: {
    gap: 12,
  },
  pressed: {
    opacity: 0.7,
  },
});

import React, { useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AddressMapSection } from '@/components/address/AddressMapSection';
import { ThemedText } from '@/components/themed-text';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { TimePickerField } from '@/components/ui/TimePickerField';
import { useSearchWilayah } from '@/features/delivery/useDelivery';
import { useAdminOutlets, useDeleteOutlet, useSaveOutlet } from '@/features/outlet/useOutlets';
import { useTheme } from '@/hooks/use-theme';
import { getApiErrorMessage } from '@/services/apiError';
import { Outlet } from '@/types/outlet';
import { ResolvedLocation } from '@/types/region';
import { confirmAction, showAlert } from '@/utils/alert';

const VILLAGE_CODE_PATTERN = /^\d{2}\.\d{2}\.\d{2}\.\d{4}$/;

interface SelectedWilayah {
  code: string;
  /** "Kelurahan, Kecamatan, Kab/Kota, Provinsi" atau "Kelurahan › ..." dari hasil cari. */
  label: string;
}

/** Buat / ubah outlet (Admin / Super Admin). Tanpa `id` = outlet baru. */
export default function AdminOutletFormScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { data: outlets, isPending, isError, error } = useAdminOutlets();
  const outlet = id ? outlets?.find((o) => o.id === id) : undefined;

  return (
    <View style={[styles.root, { backgroundColor: theme.background }]}>
      <ScreenHeader title={id ? 'Ubah Outlet' : 'Outlet Baru'} fallbackHref="/admin/outlets" />
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {id && isPending ? (
          <ActivityIndicator style={styles.loader} color={theme.primary} />
        ) : id && (isError || !outlet) ? (
          <ThemedText style={[styles.small, { color: theme.textSecondary }]}>
            {getApiErrorMessage(error, 'Outlet tidak ditemukan.')}
          </ThemedText>
        ) : (
          <OutletForm key={outlet?.id ?? 'new'} outlet={outlet} />
        )}
      </ScrollView>
    </View>
  );
}

const OutletForm: React.FC<{ outlet?: Outlet }> = ({ outlet }) => {
  const theme = useTheme();
  const router = useRouter();
  const save = useSaveOutlet();
  const remove = useDeleteOutlet();

  const [name, setName] = useState(outlet?.name ?? '');
  const [fullAddress, setFullAddress] = useState(outlet?.fullAddress ?? '');
  const [autoFilledAddress, setAutoFilledAddress] = useState('');
  const [wilayah, setWilayah] = useState<SelectedWilayah | null>(
    outlet ? { code: outlet.wilayahCode, label: outlet.wilayahPath } : null
  );
  const [wilayahQuery, setWilayahQuery] = useState('');
  const [pickupStart, setPickupStart] = useState<string | null>(outlet?.pickupStartTime ?? null);
  const [pickupEnd, setPickupEnd] = useState<string | null>(outlet?.pickupEndTime ?? null);
  const [whatsapp, setWhatsapp] = useState(outlet?.whatsappNumber ?? '');
  const [latitude, setLatitude] = useState<number | null>(outlet?.latitude ?? null);
  const [longitude, setLongitude] = useState<number | null>(outlet?.longitude ?? null);
  const [isActive, setIsActive] = useState(outlet?.isActive ?? true);

  const search = useSearchWilayah(wilayahQuery);
  const villages = (search.data ?? []).filter((w) => w.level === 4);

  const leaveForm = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/admin/outlets');
  };

  // Titik dipilih di Google Maps: koordinat, alamat (bila belum diubah manual), dan kelurahan ikut terisi.
  const handleLocationPicked = (location: ResolvedLocation) => {
    setLatitude(location.latitude);
    setLongitude(location.longitude);
    if (!fullAddress.trim() || fullAddress === autoFilledAddress) {
      setFullAddress(location.formattedAddress);
      setAutoFilledAddress(location.formattedAddress);
    }
    if (location.village && VILLAGE_CODE_PATTERN.test(location.village.code)) {
      const parts = [location.village, location.district, location.city, location.province]
        .filter((p): p is NonNullable<typeof p> => !!p)
        .map((p) => p.name);
      setWilayah({ code: location.village.code, label: parts.join(', ') });
    } else {
      showAlert('Lengkapi Wilayah', 'Kelurahan dari titik peta tidak dikenali. Cari kelurahannya di kolom Wilayah.', {
        tone: 'warning',
      });
    }
  };

  const handleSave = () => {
    if (!wilayah) {
      showAlert('Wilayah Belum Dipilih', 'Pilih kelurahan/desa outlet dari peta atau kolom pencarian wilayah.', {
        tone: 'warning',
      });
      return;
    }
    if (!pickupStart !== !pickupEnd) {
      showAlert('Jam Ambil Belum Lengkap', 'Pilih jam mulai dan jam selesai, atau kosongkan keduanya.', { tone: 'warning' });
      return;
    }
    if (pickupStart && pickupEnd && pickupEnd <= pickupStart) {
      showAlert('Jam Ambil Tidak Valid', 'Jam selesai harus setelah jam mulai.', { tone: 'warning' });
      return;
    }

    save.mutate(
      {
        id: outlet?.id,
        data: {
          name: name.trim(),
          fullAddress: fullAddress.trim(),
          wilayahCode: wilayah.code,
          pickupStartTime: pickupStart,
          pickupEndTime: pickupEnd,
          whatsappNumber: whatsapp.trim() || null,
          latitude,
          longitude,
          isActive,
        },
      },
      {
        onSuccess: async (saved) => {
          await showAlert('Tersimpan', `Outlet ${saved.name} berhasil disimpan.`, { tone: 'success' });
          leaveForm();
        },
        onError: (err) =>
          showAlert('Gagal Menyimpan', getApiErrorMessage(err, 'Outlet tidak dapat disimpan.'), { tone: 'error' }),
      }
    );
  };

  const handleDelete = async () => {
    if (!outlet) return;
    if ((outlet.orderCount ?? 0) > 0) {
      showAlert(
        'Outlet Sudah Dipakai',
        `Outlet ini sudah dipakai ${outlet.orderCount} pesanan sehingga tidak bisa dihapus. Nonaktifkan saja agar tidak muncul di pilihan customer.`,
        { tone: 'warning' }
      );
      return;
    }
    const ok = await confirmAction('Hapus Outlet?', `Outlet ${outlet.name} akan dihapus permanen.`, {
      confirmText: 'Hapus',
    });
    if (!ok) return;
    remove.mutate(outlet.id, {
      onSuccess: leaveForm,
      onError: (err) => showAlert('Gagal Menghapus', getApiErrorMessage(err, 'Outlet tidak dapat dihapus.'), { tone: 'error' }),
    });
  };

  const card = [styles.card, { backgroundColor: theme.card, borderColor: theme.border }];
  const input = [styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }];
  const muted = { color: theme.textSecondary };
  const strong = { color: theme.text };
  const hasPoint = latitude != null && longitude != null;
  const canDelete = (outlet?.orderCount ?? 0) === 0;

  return (
    <>
      <View style={card}>
        <ThemedText style={[styles.label, strong]}>Nama outlet</ThemedText>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Outlet Luanna Brosot"
          placeholderTextColor={theme.textSecondary}
          maxLength={100}
          style={input}
        />

        <ThemedText style={[styles.label, strong]}>Jam ambil (opsional, WIB)</ThemedText>
        <View style={styles.timeRow}>
          <View style={styles.flex}>
            <TimePickerField value={pickupStart} onChange={setPickupStart} placeholder="Mulai" title="Jam mulai ambil" />
          </View>
          <ThemedText style={[styles.small, muted]}>sampai</ThemedText>
          <View style={styles.flex}>
            <TimePickerField value={pickupEnd} onChange={setPickupEnd} placeholder="Selesai" title="Jam selesai ambil" />
          </View>
        </View>
        {pickupStart || pickupEnd ? (
          <Pressable
            onPress={() => {
              setPickupStart(null);
              setPickupEnd(null);
            }}
            accessibilityRole="button"
            style={styles.linkBtn}
          >
            <ThemedText style={[styles.small, styles.bold, { color: theme.danger }]}>Kosongkan jam ambil</ThemedText>
          </Pressable>
        ) : null}
        <ThemedText style={[styles.tiny, muted]}>Ditampilkan ke customer di checkout dan detail pesanan.</ThemedText>

        <ThemedText style={[styles.label, strong]}>Nomor WhatsApp (opsional)</ThemedText>
        <TextInput
          value={whatsapp}
          onChangeText={setWhatsapp}
          placeholder="081234567890"
          placeholderTextColor={theme.textSecondary}
          keyboardType="phone-pad"
          maxLength={20}
          style={input}
        />
      </View>

      <View style={card}>
        <ThemedText style={[styles.label, strong]}>Titik peta (opsional)</ThemedText>
        <AddressMapSection
          latitude={latitude}
          longitude={longitude}
          onLocationPicked={handleLocationPicked}
          onCoordinatesChange={(lat, lng) => {
            setLatitude(lat);
            setLongitude(lng);
          }}
        />
        {hasPoint ? (
          <Pressable
            onPress={() => {
              setLatitude(null);
              setLongitude(null);
            }}
            accessibilityRole="button"
            style={styles.linkBtn}
          >
            <ThemedText style={[styles.small, styles.bold, { color: theme.danger }]}>Hapus titik peta</ThemedText>
          </Pressable>
        ) : null}
        <ThemedText style={[styles.tiny, muted]}>
          Customer bisa membuka lokasi outlet di Google Maps. Memilih titik juga mengisi alamat dan kelurahan.
        </ThemedText>

        <ThemedText style={[styles.label, strong]}>Alamat lengkap</ThemedText>
        <TextInput
          value={fullAddress}
          onChangeText={setFullAddress}
          placeholder="Jl. Brosot - Galur No. 1"
          placeholderTextColor={theme.textSecondary}
          maxLength={500}
          multiline
          style={[input, styles.multiline]}
        />

        <ThemedText style={[styles.label, strong]}>Wilayah (kelurahan/desa)</ThemedText>
        {wilayah ? (
          <View style={[styles.selected, { backgroundColor: theme.backgroundElement }]}>
            <ThemedText style={[styles.small, styles.flex, strong]}>{wilayah.label}</ThemedText>
            <Pressable onPress={() => setWilayah(null)} accessibilityRole="button" style={styles.linkBtn}>
              <ThemedText style={[styles.small, styles.bold, { color: theme.primary }]}>Ganti</ThemedText>
            </Pressable>
          </View>
        ) : (
          <>
            <TextInput
              value={wilayahQuery}
              onChangeText={setWilayahQuery}
              placeholder="Cari nama kelurahan atau kode pos"
              placeholderTextColor={theme.textSecondary}
              style={input}
            />
            {wilayahQuery.trim().length >= 3 ? (
              search.isLoading ? (
                <ActivityIndicator color={theme.primary} />
              ) : villages.length === 0 ? (
                <ThemedText style={[styles.tiny, muted]}>Tidak ada kelurahan yang cocok.</ThemedText>
              ) : (
                <View style={[styles.results, { borderColor: theme.border }]}>
                  {villages.slice(0, 20).map((w) => (
                    <Pressable
                      key={w.code}
                      onPress={() => {
                        setWilayah({ code: w.code, label: `${w.name} · ${w.path}` });
                        setWilayahQuery('');
                      }}
                      style={({ pressed }) => [
                        styles.resultRow,
                        { borderColor: theme.border, backgroundColor: pressed ? theme.backgroundElement : 'transparent' },
                      ]}
                      accessibilityRole="button"
                    >
                      <ThemedText style={[styles.small, styles.bold, strong]}>
                        {w.name}
                        {w.postalCode ? ` · ${w.postalCode}` : ''}
                      </ThemedText>
                      <ThemedText style={[styles.tiny, muted]} numberOfLines={1}>
                        {w.path}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
              )
            ) : (
              <ThemedText style={[styles.tiny, muted]}>Ketik minimal 3 huruf, atau 5 digit kode pos.</ThemedText>
            )}
          </>
        )}
      </View>

      <View style={card}>
        <View style={styles.switchRow}>
          <View style={styles.flex}>
            <ThemedText style={[styles.label, strong]}>Aktif</ThemedText>
            <ThemedText style={[styles.tiny, muted]}>Outlet nonaktif tidak muncul di pilihan customer.</ThemedText>
          </View>
          <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: theme.primary, false: theme.border }} />
        </View>
      </View>

      <Pressable
        onPress={handleSave}
        disabled={save.isPending}
        style={[styles.saveBtn, { backgroundColor: theme.primary, opacity: save.isPending ? 0.6 : 1 }]}
        accessibilityRole="button"
      >
        {save.isPending ? <ActivityIndicator color="#FFFFFF" /> : <ThemedText style={styles.saveText}>Simpan</ThemedText>}
      </Pressable>

      {outlet ? (
        <Pressable
          onPress={handleDelete}
          disabled={remove.isPending}
          style={[styles.deleteBtn, { borderColor: theme.danger, opacity: canDelete ? 1 : 0.45 }]}
          accessibilityRole="button"
          accessibilityHint={canDelete ? undefined : 'Outlet sudah dipakai pesanan, tidak bisa dihapus'}
        >
          <ThemedText style={[styles.small, styles.bold, { color: theme.danger }]}>Hapus Outlet</ThemedText>
        </Pressable>
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { padding: 16, gap: 12, paddingBottom: 40, maxWidth: 560, width: '100%', alignSelf: 'center' },
  loader: { marginTop: 30 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14, gap: 8 },
  label: { fontSize: 13, fontWeight: '700', marginTop: 4 },
  small: { fontSize: 13, lineHeight: 18 },
  tiny: { fontSize: 11, lineHeight: 15 },
  bold: { fontWeight: '700' },
  flex: { flex: 1 },
  input: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16 },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  selected: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, padding: 12 },
  results: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  resultRow: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderBottomWidth: StyleSheet.hairlineWidth,
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  linkBtn: { alignSelf: 'flex-start', paddingVertical: 4, ...Platform.select({ web: { cursor: 'pointer' } }) },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  saveBtn: {
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  deleteBtn: {
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    ...Platform.select({ web: { cursor: 'pointer' } }),
  },
});

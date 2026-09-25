import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Navbar } from '@/components/ui/Navbar';
import { SelectModalPicker } from '@/components/ui/SelectModalPicker';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  useAddress,
  useCreateAddress,
  useUpdateAddress,
} from '@/features/biodata/useAddresses';
import {
  useCities,
  useDistricts,
  useProvinces,
  useVillages,
} from '@/features/general/useRegions';
import { CreateAddressRequest } from '@/types/address';

const QUICK_LABELS = ['Rumah', 'Kantor', 'Apartemen', 'Kos', 'Rumah Nenek'];

interface SelectedRegion {
  code: string;
  name: string;
}

export default function AddressFormScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  // Address detail (for edit mode)
  const { data: addressDetail, isLoading: isLoadingDetail } = useAddress(id);
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();

  // Basic form states
  const [label, setLabel] = useState('Rumah');
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Regional cascading states
  const [selectedProvince, setSelectedProvince] = useState<SelectedRegion | null>(null);
  const [selectedCity, setSelectedCity] = useState<SelectedRegion | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<SelectedRegion | null>(null);
  const [selectedVillage, setSelectedVillage] = useState<SelectedRegion | null>(null);
  const [postalCode, setPostalCode] = useState('');

  // Picker visibility states
  const [showProvincePicker, setShowProvincePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showDistrictPicker, setShowDistrictPicker] = useState(false);
  const [showVillagePicker, setShowVillagePicker] = useState(false);

  // Region Queries (Group: General)
  const { data: provinces, isLoading: isLoadingProvinces } = useProvinces();
  const { data: cities, isLoading: isLoadingCities } = useCities(selectedProvince?.code);
  const { data: districts, isLoading: isLoadingDistricts } = useDistricts(selectedCity?.code);
  const { data: villages, isLoading: isLoadingVillages } = useVillages(selectedDistrict?.code);

  // Prepopulate when editing
  useEffect(() => {
    if (addressDetail) {
      setLabel(addressDetail.label || 'Rumah');
      setRecipientName(addressDetail.recipientName || '');
      setPhoneNumber(addressDetail.phoneNumber || '');
      setFullAddress(addressDetail.fullAddress || '');
      setPostalCode(addressDetail.postalCode || '');
      setNotes(addressDetail.notes || '');
      setIsPrimary(addressDetail.isPrimary || false);

      if (addressDetail.province) {
        setSelectedProvince({ code: '', name: addressDetail.province });
      }
      if (addressDetail.city) {
        setSelectedCity({ code: '', name: addressDetail.city });
      }
      if (addressDetail.subdistrict) {
        setSelectedDistrict({ code: '', name: addressDetail.subdistrict });
      }
    }
  }, [addressDetail]);

  // Handle province selection
  const handleSelectProvince = (item: { value: string; label: string }) => {
    setSelectedProvince({ code: item.value, name: item.label });
    setSelectedCity(null);
    setSelectedDistrict(null);
    setSelectedVillage(null);
    setPostalCode('');
    setShowProvincePicker(false);
  };

  // Handle city selection
  const handleSelectCity = (item: { value: string; label: string }) => {
    setSelectedCity({ code: item.value, name: item.label });
    setSelectedDistrict(null);
    setSelectedVillage(null);
    setPostalCode('');
    setShowCityPicker(false);
  };

  // Handle district selection
  const handleSelectDistrict = (item: { value: string; label: string }) => {
    setSelectedDistrict({ code: item.value, name: item.label });
    setSelectedVillage(null);
    setPostalCode('');
    setShowDistrictPicker(false);
  };

  // Handle village selection + AUTO FILL POSTAL CODE
  const handleSelectVillage = (item: { value: string; label: string; subtitle?: string }) => {
    setSelectedVillage({ code: item.value, name: item.label });
    if (item.subtitle && item.subtitle.trim().length > 0) {
      // Extract numeric postal code
      const codeMatch = item.subtitle.match(/\d{5}/);
      if (codeMatch) {
        setPostalCode(codeMatch[0]);
      } else {
        setPostalCode(item.subtitle);
      }
    }
    setShowVillagePicker(false);
  };

  const handleSubmit = async () => {
    const provinceName = selectedProvince?.name || '';
    const cityName = selectedCity?.name || '';
    const districtName = selectedDistrict?.name || '';
    const villageName = selectedVillage?.name || '';

    if (
      !label.trim() ||
      !recipientName.trim() ||
      !phoneNumber.trim() ||
      !fullAddress.trim() ||
      !provinceName.trim() ||
      !cityName.trim() ||
      !districtName.trim() ||
      !postalCode.trim()
    ) {
      setErrorMessage('Mohon lengkapi semua bidang wajib bertanda bintang (*), termasuk pilihan wilayah.');
      return;
    }

    setErrorMessage('');

    // Combine district and village for subdistrict field
    const subdistrictCombined = villageName
      ? `${districtName}, ${villageName}`
      : districtName;

    const payload: CreateAddressRequest = {
      label: label.trim(),
      recipientName: recipientName.trim(),
      phoneNumber: phoneNumber.trim(),
      fullAddress: fullAddress.trim(),
      subdistrict: subdistrictCombined,
      city: cityName.trim(),
      province: provinceName.trim(),
      postalCode: postalCode.trim(),
      notes: notes.trim() || undefined,
      isPrimary,
    };

    try {
      if (isEditMode && id) {
        await updateMutation.mutateAsync({ id, data: payload });
      } else {
        await createMutation.mutateAsync(payload);
      }
      router.back();
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.response?.data?.detail ||
        'Gagal menyimpan alamat. Silakan periksa kembali formulir Anda.';
      if (Platform.OS === 'web') {
        window.alert(msg);
      } else {
        Alert.alert('Gagal', msg);
      }
    }
  };

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  if (isEditMode && isLoadingDetail) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <Navbar />
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={theme.primary} />
            <ThemedText type="small" style={{ marginTop: 12, opacity: 0.7 }}>
              Memuat detail alamat...
            </ThemedText>
          </View>
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Navbar */}
        <Navbar />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Navigation Row */}
            <View style={styles.topNavRow}>
              <Pressable
                onPress={() => router.back()}
                style={({ pressed }) => [
                  styles.backBtn,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                  pressed && styles.pressed,
                ]}
              >
                <ThemedText type="smallBold">
                  ← Kembali ke Daftar Alamat
                </ThemedText>
              </Pressable>
            </View>

            {/* Header Title */}
            <View style={styles.headerSection}>
              <ThemedText type="title" style={styles.title}>
                {isEditMode ? 'Ubah Alamat Pengiriman' : 'Tambah Alamat Baru'}
              </ThemedText>
              <ThemedText type="small" style={styles.subtitle}>
                Pilih wilayah administratif secara bertingkat (Provinsi ➔ Kota ➔ Kecamatan ➔ Kelurahan) untuk pengisian otomatis kode pos.
              </ThemedText>
            </View>

            {/* Form Card */}
            <View
              style={[
                styles.formCard,
                {
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                },
              ]}
            >
              {errorMessage ? (
                <View style={styles.errorBox}>
                  <ThemedText type="small" style={styles.errorText}>
                    {errorMessage}
                  </ThemedText>
                </View>
              ) : null}

              {/* Label Alamat */}
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold" style={styles.fieldLabel}>
                  Label Alamat *
                </ThemedText>
                <View style={styles.quickLabelRow}>
                  {QUICK_LABELS.map((item) => (
                    <Pressable
                      key={item}
                      onPress={() => setLabel(item)}
                      style={[
                        styles.chip,
                        {
                          backgroundColor:
                            label === item
                              ? theme.primary + '20'
                              : theme.backgroundElement,
                          borderColor:
                            label === item ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      <ThemedText
                        type="small"
                        style={{
                          color: label === item ? theme.primary : undefined,
                          fontWeight: label === item ? '700' : '400',
                        }}
                      >
                        {item}
                      </ThemedText>
                    </Pressable>
                  ))}
                </View>
                <TextInput
                  value={label}
                  onChangeText={setLabel}
                  placeholder="Contoh: Rumah, Kantor, Kos"
                  placeholderTextColor={theme.border}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>

              {/* Recipient Name & Phone Number */}
              <View style={styles.rowTwoCols}>
                <View style={[styles.fieldGroup, { flex: 1, minWidth: 240 }]}>
                  <ThemedText type="smallBold" style={styles.fieldLabel}>
                    Nama Penerima *
                  </ThemedText>
                  <TextInput
                    value={recipientName}
                    onChangeText={setRecipientName}
                    placeholder="Nama Lengkap Penerima"
                    placeholderTextColor={theme.border}
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundElement,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                  />
                </View>

                <View style={[styles.fieldGroup, { flex: 1, minWidth: 240 }]}>
                  <ThemedText type="smallBold" style={styles.fieldLabel}>
                    Nomor HP / WhatsApp *
                  </ThemedText>
                  <TextInput
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    placeholder="08xxxxxxxxxx"
                    placeholderTextColor={theme.border}
                    keyboardType="phone-pad"
                    style={[
                      styles.input,
                      {
                        backgroundColor: theme.backgroundElement,
                        color: theme.text,
                        borderColor: theme.border,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* SECTION: DROPDOWN WILAYAH BERJENJANG */}
              <View style={styles.dividerBox}>
                <ThemedText type="smallBold" style={styles.dividerTitle}>
                  📍 WILAYAH ADMINISTRATIF INDONESIA
                </ThemedText>
              </View>

              {/* Row 1: Provinsi & Kota/Kabupaten */}
              <View style={styles.rowTwoCols}>
                {/* 1. Provinsi Picker */}
                <View style={[styles.fieldGroup, { flex: 1, minWidth: 240 }]}>
                  <ThemedText type="smallBold" style={styles.fieldLabel}>
                    Provinsi *
                  </ThemedText>
                  <Pressable
                    onPress={() => setShowProvincePicker(true)}
                    style={({ pressed }) => [
                      styles.pickerButton,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <ThemedText
                      type="default"
                      style={[
                        styles.pickerValueText,
                        !selectedProvince && { opacity: 0.5 },
                      ]}
                      numberOfLines={1}
                    >
                      {selectedProvince ? selectedProvince.name : 'Pilih Provinsi...'}
                    </ThemedText>
                    <ThemedText style={{ opacity: 0.6, fontSize: 12 }}>▼</ThemedText>
                  </Pressable>
                </View>

                {/* 2. Kota/Kabupaten Picker */}
                <View style={[styles.fieldGroup, { flex: 1, minWidth: 240 }]}>
                  <ThemedText type="smallBold" style={styles.fieldLabel}>
                    Kota / Kabupaten *
                  </ThemedText>
                  <Pressable
                    onPress={() => {
                      if (!selectedProvince?.code) {
                        Alert.alert('Perhatian', 'Silakan pilih Provinsi terlebih dahulu.');
                        return;
                      }
                      setShowCityPicker(true);
                    }}
                    style={({ pressed }) => [
                      styles.pickerButton,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                        opacity: selectedProvince?.code ? 1 : 0.6,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <ThemedText
                      type="default"
                      style={[
                        styles.pickerValueText,
                        !selectedCity && { opacity: 0.5 },
                      ]}
                      numberOfLines={1}
                    >
                      {selectedCity ? selectedCity.name : 'Pilih Kota / Kab...'}
                    </ThemedText>
                    <ThemedText style={{ opacity: 0.6, fontSize: 12 }}>▼</ThemedText>
                  </Pressable>
                </View>
              </View>

              {/* Row 2: Kecamatan & Kelurahan/Desa */}
              <View style={styles.rowTwoCols}>
                {/* 3. Kecamatan Picker */}
                <View style={[styles.fieldGroup, { flex: 1, minWidth: 240 }]}>
                  <ThemedText type="smallBold" style={styles.fieldLabel}>
                    Kecamatan *
                  </ThemedText>
                  <Pressable
                    onPress={() => {
                      if (!selectedCity?.code) {
                        Alert.alert('Perhatian', 'Silakan pilih Kota/Kabupaten terlebih dahulu.');
                        return;
                      }
                      setShowDistrictPicker(true);
                    }}
                    style={({ pressed }) => [
                      styles.pickerButton,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                        opacity: selectedCity?.code ? 1 : 0.6,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <ThemedText
                      type="default"
                      style={[
                        styles.pickerValueText,
                        !selectedDistrict && { opacity: 0.5 },
                      ]}
                      numberOfLines={1}
                    >
                      {selectedDistrict ? selectedDistrict.name : 'Pilih Kecamatan...'}
                    </ThemedText>
                    <ThemedText style={{ opacity: 0.6, fontSize: 12 }}>▼</ThemedText>
                  </Pressable>
                </View>

                {/* 4. Kelurahan / Desa Picker */}
                <View style={[styles.fieldGroup, { flex: 1, minWidth: 240 }]}>
                  <ThemedText type="smallBold" style={styles.fieldLabel}>
                    Kelurahan / Desa
                  </ThemedText>
                  <Pressable
                    onPress={() => {
                      if (!selectedDistrict?.code) {
                        Alert.alert('Perhatian', 'Silakan pilih Kecamatan terlebih dahulu.');
                        return;
                      }
                      setShowVillagePicker(true);
                    }}
                    style={({ pressed }) => [
                      styles.pickerButton,
                      {
                        backgroundColor: theme.backgroundElement,
                        borderColor: theme.border,
                        opacity: selectedDistrict?.code ? 1 : 0.6,
                      },
                      pressed && styles.pressed,
                    ]}
                  >
                    <ThemedText
                      type="default"
                      style={[
                        styles.pickerValueText,
                        !selectedVillage && { opacity: 0.5 },
                      ]}
                      numberOfLines={1}
                    >
                      {selectedVillage ? selectedVillage.name : 'Pilih Kelurahan / Desa...'}
                    </ThemedText>
                    <ThemedText style={{ opacity: 0.6, fontSize: 12 }}>▼</ThemedText>
                  </Pressable>
                </View>
              </View>

              {/* Row 3: Kode Pos (Auto-filled) */}
              <View style={styles.fieldGroup}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <ThemedText type="smallBold" style={styles.fieldLabel}>
                    Kode Pos *
                  </ThemedText>
                  {postalCode ? (
                    <ThemedText type="code" style={{ fontSize: 11, color: '#10B981' }}>
                      ✓ Terisi otomatis dari master data
                    </ThemedText>
                  ) : null}
                </View>
                <TextInput
                  value={postalCode}
                  onChangeText={setPostalCode}
                  placeholder="Kode pos (otomatis terisi saat memilih kelurahan)"
                  placeholderTextColor={theme.border}
                  keyboardType="numeric"
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: postalCode ? '#10B98180' : theme.border,
                      borderWidth: postalCode ? 1.5 : 1,
                    },
                  ]}
                />
              </View>

              {/* Full Address (Textarea) */}
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold" style={styles.fieldLabel}>
                  Alamat Lengkap (Jalan, RT/RW, No. Rumah/Unit) *
                </ThemedText>
                <TextInput
                  value={fullAddress}
                  onChangeText={setFullAddress}
                  placeholder="Nama Jalan, Nomor Rumah/Gedung, RT/RW, Blok/Unit"
                  placeholderTextColor={theme.border}
                  multiline
                  numberOfLines={3}
                  style={[
                    styles.input,
                    styles.textArea,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>

              {/* Notes / Kurir Landmark */}
              <View style={styles.fieldGroup}>
                <ThemedText type="smallBold" style={styles.fieldLabel}>
                  Catatan Kurir / Patokan Lokasi (Opsional)
                </ThemedText>
                <TextInput
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Contoh: Pagar hitam depan warung, bel masuk sebelah kanan"
                  placeholderTextColor={theme.border}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.border,
                    },
                  ]}
                />
              </View>

              {/* Primary Address Toggle */}
              <View
                style={[
                  styles.primaryToggleRow,
                  {
                    backgroundColor: theme.backgroundElement,
                    borderColor: theme.border,
                  },
                ]}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <ThemedText type="smallBold">Jadikan Alamat Utama</ThemedText>
                  <ThemedText type="small" style={{ opacity: 0.6, fontSize: 12 }}>
                    Alamat utama akan otomatis dipilih saat checkout pesanan katering
                  </ThemedText>
                </View>
                <Switch
                  value={isPrimary}
                  onValueChange={setIsPrimary}
                  trackColor={{ false: theme.border, true: theme.primary }}
                  thumbColor="#FFFFFF"
                />
              </View>

              {/* Action Buttons */}
              <View style={[styles.actionRow, { borderTopColor: theme.border }]}>
                <Pressable
                  onPress={() => router.back()}
                  disabled={isSubmitting}
                  style={({ pressed }) => [
                    styles.cancelBtn,
                    {
                      backgroundColor: theme.backgroundElement,
                      borderColor: theme.border,
                    },
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText type="smallBold">Batal</ThemedText>
                </Pressable>

                <Pressable
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                  style={({ pressed }) => [
                    styles.saveBtn,
                    { backgroundColor: theme.primary },
                    isSubmitting && { opacity: 0.7 },
                    pressed && styles.pressed,
                  ]}
                >
                  <ThemedText type="smallBold" style={styles.saveBtnText}>
                    {isSubmitting
                      ? 'Menyimpan...'
                      : isEditMode
                      ? 'Simpan Perubahan'
                      : 'Simpan Alamat Baru'}
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* 1. Modal Picker Provinsi */}
        <SelectModalPicker
          visible={showProvincePicker}
          title="Pilih Provinsi"
          placeholder="Cari provinsi..."
          isLoading={isLoadingProvinces}
          selectedValue={selectedProvince?.code}
          items={(provinces || []).map((p) => ({
            value: p.code,
            label: p.name,
          }))}
          onSelect={handleSelectProvince}
          onClose={() => setShowProvincePicker(false)}
        />

        {/* 2. Modal Picker Kota/Kabupaten */}
        <SelectModalPicker
          visible={showCityPicker}
          title="Pilih Kota / Kabupaten"
          placeholder="Cari kota atau kabupaten..."
          isLoading={isLoadingCities}
          selectedValue={selectedCity?.code}
          items={(cities || []).map((c) => ({
            value: c.code,
            label: c.name,
          }))}
          onSelect={handleSelectCity}
          onClose={() => setShowCityPicker(false)}
        />

        {/* 3. Modal Picker Kecamatan */}
        <SelectModalPicker
          visible={showDistrictPicker}
          title="Pilih Kecamatan"
          placeholder="Cari kecamatan..."
          isLoading={isLoadingDistricts}
          selectedValue={selectedDistrict?.code}
          items={(districts || []).map((d) => ({
            value: d.code,
            label: d.name,
          }))}
          onSelect={handleSelectDistrict}
          onClose={() => setShowDistrictPicker(false)}
        />

        {/* 4. Modal Picker Kelurahan / Desa */}
        <SelectModalPicker
          visible={showVillagePicker}
          title="Pilih Kelurahan / Desa"
          placeholder="Cari kelurahan / desa..."
          isLoading={isLoadingVillages}
          selectedValue={selectedVillage?.code}
          items={(villages || []).map((v) => ({
            value: v.code,
            label: v.name,
            subtitle: v.postalCode ? `Kode Pos: ${v.postalCode}` : undefined,
          }))}
          onSelect={handleSelectVillage}
          onClose={() => setShowVillagePicker(false)}
        />
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
  headerSection: {
    gap: 4,
    paddingVertical: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    opacity: 0.7,
    lineHeight: 18,
    maxWidth: 600,
  },
  formCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  errorBox: {
    backgroundColor: '#EF444415',
    borderColor: '#EF444440',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    fontSize: 12,
    opacity: 0.8,
  },
  quickLabelRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 14,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  input: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    fontSize: 14,
  },
  pickerButton: {
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer' as any,
  },
  pickerValueText: {
    fontSize: 14,
    flex: 1,
    marginRight: 8,
  },
  dividerBox: {
    paddingVertical: 4,
    marginTop: 4,
  },
  dividerTitle: {
    fontSize: 11,
    letterSpacing: 0.8,
    opacity: 0.6,
  },
  textArea: {
    height: 80,
    paddingTop: 10,
    paddingBottom: 10,
    textAlignVertical: 'top',
  },
  rowTwoCols: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  primaryToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    paddingTop: 14,
    borderTopWidth: 1,
    marginTop: 4,
  },
  cancelBtn: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
});

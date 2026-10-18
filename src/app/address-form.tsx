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
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { SelectModalPicker } from '@/components/ui/SelectModalPicker';
import { AddressLocationPicker } from '@/components/address/AddressLocationPicker';
import { FloatingLabelPillInput } from '@/components/ui/FloatingLabelPillInput';
import { useThemeContext } from '@/context/ThemeContext';
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

interface SelectedRegion {
  code: string;
  name: string;
}

export default function AddressFormScreen() {
  const { isDark } = useThemeContext();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = Boolean(id);

  // Address detail (for edit mode)
  const { data: addressDetail, isLoading: isLoadingDetail } = useAddress(id);
  const createMutation = useCreateAddress();
  const updateMutation = useUpdateAddress();

  // Basic form states
  const [label, setLabel] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [fullAddress, setFullAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isPrimary, setIsPrimary] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Location Coordinate states
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);

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
      setLabel(addressDetail.label || '');
      setRecipientName(addressDetail.recipientName || '');
      setPhoneNumber(addressDetail.phoneNumber || '');
      setFullAddress(addressDetail.fullAddress || '');
      setPostalCode(addressDetail.postalCode || '');
      setNotes(addressDetail.notes || '');
      setIsPrimary(addressDetail.isPrimary || false);

      if (addressDetail.latitude != null) {
        setLatitude(addressDetail.latitude);
      }
      if (addressDetail.longitude != null) {
        setLongitude(addressDetail.longitude);
      }

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
      setErrorMessage('Mohon lengkapi semua bidang wajib, termasuk pilihan wilayah.');
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
      latitude: latitude != null ? latitude : undefined,
      longitude: longitude != null ? longitude : undefined,
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

  // Theming colors according to user design
  const headerBg = isDark ? '#1E2229' : '#555A63';
  const sheetBg = isDark ? '#262A32' : '#D9D9D9';
  const pillBg = isDark ? '#374151' : '#B8B8B8';
  const textPrimary = isDark ? '#F9FAFB' : '#111827';
  const placeholderColor = isDark ? '#9CA3AF' : '#6B7280';
  const labelColor = isDark ? '#D1D5DB' : '#6B7280';
  const dividerColor = isDark ? 'rgba(255, 255, 255, 0.12)' : '#BFBFBF';
  const submitBtnBg = isDark ? '#4B5563' : '#666666';

  if (isEditMode && isLoadingDetail) {
    return (
      <View style={[styles.container, { backgroundColor: headerBg }]}>
        <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <ThemedText style={{ marginTop: 12, color: '#FFFFFF' }}>
              Memuat detail alamat...
            </ThemedText>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: headerBg }]}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        {/* Main Content Wrapper (Desktop Max-Width Constraint) */}
        <View style={[styles.mainWrapper, { maxWidth: isDesktop ? 600 : '100%' }]}>
          {/* 1. HEADER BAR */}
          <View style={[styles.header, { backgroundColor: headerBg }]}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.headerBackBtn,
                pressed && styles.buttonPressed,
              ]}
              accessibilityLabel="Kembali"
              accessibilityRole="button"
            >
              {Platform.OS === 'web' ? (
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#111827"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              ) : (
                <ThemedText style={{ fontSize: 16, color: '#111827', fontWeight: 'bold' }}>
                  ❮
                </ThemedText>
              )}
            </Pressable>

            <ThemedText style={styles.headerTitle}>
              {isEditMode ? 'Ubah Alamat' : 'Tambah Alamat'}
            </ThemedText>
          </View>

          {/* 2. SCROLLABLE FORM & MAP CONTAINER */}
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* INTERACTIVE OPENSTREETMAP LOCATION PICKER */}
              <AddressLocationPicker
                initialLatitude={latitude}
                initialLongitude={longitude}
                onLocationChange={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                height={230}
              />

              {/* 3. CURVED BOTTOM SHEET FORM CONTAINER */}
              <View style={[styles.sheetContainer, { backgroundColor: sheetBg }]}>
                {/* Drag Handle Bar Pill */}
                <View style={styles.dragHandle} />

                {/* Error Banner */}
                {errorMessage ? (
                  <View style={styles.errorBox}>
                    <ThemedText style={styles.errorText}>
                      {errorMessage}
                    </ThemedText>
                  </View>
                ) : null}

                {/* SECTION 1: IDENTITAS & KONTAK */}
                <View style={styles.sectionGroup}>
                  {/* Nama Alamat */}
                  <FloatingLabelPillInput
                    label="Nama alamat"
                    hint="Cth: Rumah Utama, Kos, Apartemen"
                    value={label}
                    onChangeText={setLabel}
                    pillBg={pillBg}
                    textColor={textPrimary}
                    labelColor={labelColor}
                    placeholderColor={placeholderColor}
                  />

                  {/* Nama Penerima */}
                  <FloatingLabelPillInput
                    label="Nama penerima"
                    hint="Cth: Budi Santoso"
                    value={recipientName}
                    onChangeText={setRecipientName}
                    pillBg={pillBg}
                    textColor={textPrimary}
                    labelColor={labelColor}
                    placeholderColor={placeholderColor}
                  />

                  {/* No Handphone Penerima */}
                  <FloatingLabelPillInput
                    label="No handphone penerima"
                    hint="Cth: 08123456789"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    pillBg={pillBg}
                    textColor={textPrimary}
                    labelColor={labelColor}
                    placeholderColor={placeholderColor}
                  />
                </View>

                {/* DIVIDER 1 */}
                <View style={[styles.divider, { backgroundColor: dividerColor }]} />

                {/* SECTION 2: WILAYAH BERJENJANG & ALAMAT LENGKAP */}
                <View style={styles.sectionGroup}>
                  {/* Dropdown 1: Provinsi */}
                  <View style={styles.dropdownWrapper}>
                    {selectedProvince && (
                      <View style={styles.floatingDropdownLabelWrapper}>
                        <ThemedText style={[styles.floatingDropdownLabel, { color: labelColor }]}>
                          Provinsi
                        </ThemedText>
                      </View>
                    )}
                    <Pressable
                      onPress={() => setShowProvincePicker(true)}
                      style={({ pressed }) => [
                        styles.pillDropdown,
                        { backgroundColor: pillBg },
                        pressed && styles.buttonPressed,
                      ]}
                      accessibilityLabel="Pilih Provinsi"
                    >
                      <ThemedText
                        style={[
                          styles.dropdownText,
                          { color: selectedProvince ? textPrimary : placeholderColor },
                        ]}
                        numberOfLines={1}
                      >
                        {selectedProvince ? selectedProvince.name : 'Provinsi'}
                      </ThemedText>
                      {Platform.OS === 'web' ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={textPrimary}
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      ) : (
                        <ThemedText style={{ color: textPrimary, fontSize: 13 }}>▼</ThemedText>
                      )}
                    </Pressable>
                  </View>

                  {/* Dropdown 2: Kota / Kabupaten */}
                  <View style={styles.dropdownWrapper}>
                    {selectedCity && (
                      <View style={styles.floatingDropdownLabelWrapper}>
                        <ThemedText style={[styles.floatingDropdownLabel, { color: labelColor }]}>
                          Kota / Kabupaten
                        </ThemedText>
                      </View>
                    )}
                    <Pressable
                      onPress={() => {
                        if (!selectedProvince?.code) {
                          if (Platform.OS === 'web') {
                            window.alert('Silakan pilih Provinsi terlebih dahulu.');
                          } else {
                            Alert.alert('Perhatian', 'Silakan pilih Provinsi terlebih dahulu.');
                          }
                          return;
                        }
                        setShowCityPicker(true);
                      }}
                      style={({ pressed }) => [
                        styles.pillDropdown,
                        {
                          backgroundColor: pillBg,
                          opacity: selectedProvince ? 1 : 0.7,
                        },
                        pressed && styles.buttonPressed,
                      ]}
                      accessibilityLabel="Pilih Kota / Kabupaten"
                    >
                      <ThemedText
                        style={[
                          styles.dropdownText,
                          { color: selectedCity ? textPrimary : placeholderColor },
                        ]}
                        numberOfLines={1}
                      >
                        {selectedCity ? selectedCity.name : 'Kota / Kabupaten'}
                      </ThemedText>
                      {Platform.OS === 'web' ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={textPrimary}
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      ) : (
                        <ThemedText style={{ color: textPrimary, fontSize: 13 }}>▼</ThemedText>
                      )}
                    </Pressable>
                  </View>

                  {/* Dropdown 3: Kecamatan */}
                  <View style={styles.dropdownWrapper}>
                    {selectedDistrict && (
                      <View style={styles.floatingDropdownLabelWrapper}>
                        <ThemedText style={[styles.floatingDropdownLabel, { color: labelColor }]}>
                          Kecamatan
                        </ThemedText>
                      </View>
                    )}
                    <Pressable
                      onPress={() => {
                        if (!selectedCity?.code) {
                          if (Platform.OS === 'web') {
                            window.alert('Silakan pilih Kota/Kabupaten terlebih dahulu.');
                          } else {
                            Alert.alert('Perhatian', 'Silakan pilih Kota/Kabupaten terlebih dahulu.');
                          }
                          return;
                        }
                        setShowDistrictPicker(true);
                      }}
                      style={({ pressed }) => [
                        styles.pillDropdown,
                        {
                          backgroundColor: pillBg,
                          opacity: selectedCity ? 1 : 0.7,
                        },
                        pressed && styles.buttonPressed,
                      ]}
                      accessibilityLabel="Pilih Kecamatan"
                    >
                      <ThemedText
                        style={[
                          styles.dropdownText,
                          { color: selectedDistrict ? textPrimary : placeholderColor },
                        ]}
                        numberOfLines={1}
                      >
                        {selectedDistrict ? selectedDistrict.name : 'Kecamatan'}
                      </ThemedText>
                      {Platform.OS === 'web' ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={textPrimary}
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      ) : (
                        <ThemedText style={{ color: textPrimary, fontSize: 13 }}>▼</ThemedText>
                      )}
                    </Pressable>
                  </View>

                  {/* Dropdown 4: Kelurahan / Desa */}
                  <View style={styles.dropdownWrapper}>
                    {selectedVillage && (
                      <View style={styles.floatingDropdownLabelWrapper}>
                        <ThemedText style={[styles.floatingDropdownLabel, { color: labelColor }]}>
                          Kelurahan / Desa
                        </ThemedText>
                      </View>
                    )}
                    <Pressable
                      onPress={() => {
                        if (!selectedDistrict?.code) {
                          if (Platform.OS === 'web') {
                            window.alert('Silakan pilih Kecamatan terlebih dahulu.');
                          } else {
                            Alert.alert('Perhatian', 'Silakan pilih Kecamatan terlebih dahulu.');
                          }
                          return;
                        }
                        setShowVillagePicker(true);
                      }}
                      style={({ pressed }) => [
                        styles.pillDropdown,
                        {
                          backgroundColor: pillBg,
                          opacity: selectedDistrict ? 1 : 0.7,
                        },
                        pressed && styles.buttonPressed,
                      ]}
                      accessibilityLabel="Pilih Kelurahan / Desa"
                    >
                      <ThemedText
                        style={[
                          styles.dropdownText,
                          { color: selectedVillage ? textPrimary : placeholderColor },
                        ]}
                        numberOfLines={1}
                      >
                        {selectedVillage ? selectedVillage.name : 'Kelurahan / Desa'}
                      </ThemedText>
                      {Platform.OS === 'web' ? (
                        <svg
                          width="18"
                          height="18"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke={textPrimary}
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      ) : (
                        <ThemedText style={{ color: textPrimary, fontSize: 13 }}>▼</ThemedText>
                      )}
                    </Pressable>
                  </View>

                  {/* Kode Pos (Auto-filled from village or editable) */}
                  <FloatingLabelPillInput
                    label="Kode Pos"
                    hint="Cth: 10230"
                    value={postalCode}
                    onChangeText={setPostalCode}
                    keyboardType="numeric"
                    pillBg={pillBg}
                    textColor={textPrimary}
                    labelColor={labelColor}
                    placeholderColor={placeholderColor}
                  />

                  {/* Alamat Lengkap */}
                  <FloatingLabelPillInput
                    label="Alamat Lengkap"
                    hint="Cth: Jl. Kebon Kacang No. 12, RT 01/RW 02"
                    value={fullAddress}
                    onChangeText={setFullAddress}
                    multiline
                    numberOfLines={2}
                    pillBg={pillBg}
                    textColor={textPrimary}
                    labelColor={labelColor}
                    placeholderColor={placeholderColor}
                  />
                </View>

                {/* DIVIDER 2 */}
                <View style={[styles.divider, { backgroundColor: dividerColor }]} />

                {/* SECTION 3: CATATAN */}
                <View style={styles.sectionGroup}>
                  <FloatingLabelPillInput
                    label="Catatan"
                    hint="Cth: Pagar hitam depan warung, bel masuk kanan"
                    value={notes}
                    onChangeText={setNotes}
                    pillBg={pillBg}
                    textColor={textPrimary}
                    labelColor={labelColor}
                    placeholderColor={placeholderColor}
                  />
                </View>

                {/* DIVIDER 3 */}
                <View style={[styles.divider, { backgroundColor: dividerColor }]} />

                {/* SECTION 4: JADIKAN UTAMA & TOMBOL SIMPAN */}
                <View style={styles.sectionGroup}>
                  {/* Switch Pill Toggle */}
                  <View
                    style={[
                      styles.pillToggleContainer,
                      { backgroundColor: pillBg },
                    ]}
                  >
                    <ThemedText
                      style={[
                        styles.toggleLabel,
                        { color: placeholderColor },
                      ]}
                    >
                      Jadikan alamat utama
                    </ThemedText>
                    <Switch
                      value={isPrimary}
                      onValueChange={setIsPrimary}
                      trackColor={{ false: '#9E9E9E', true: '#4B5563' }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  {/* Submit Button */}
                  <Pressable
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                    style={({ pressed }) => [
                      styles.submitButton,
                      { backgroundColor: submitBtnBg },
                      isSubmitting && { opacity: 0.7 },
                      pressed && styles.buttonPressed,
                    ]}
                    accessibilityLabel="Simpan Alamat"
                    accessibilityRole="button"
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <ThemedText style={styles.submitButtonText}>
                        Simpan
                      </ThemedText>
                    )}
                  </Pressable>
                </View>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  mainWrapper: {
    flex: 1,
    width: '100%',
    alignSelf: 'center',
  },
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 14,
    zIndex: 20,
  },
  headerBackBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.15)',
      },
      default: {
        elevation: 3,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 3,
      },
    }),
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  sheetContainer: {
    marginTop: -30, // overlaps bottom part of the map seamlessly
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 48,
    zIndex: 20,
    ...Platform.select({
      web: {
        boxShadow: '0 -4px 18px rgba(0, 0, 0, 0.12)',
      },
      default: {
        elevation: 8,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
    }),
  },
  dragHandle: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignSelf: 'center',
    marginBottom: 20,
  },
  sectionGroup: {
    gap: 6,
  },
  pillInput: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '500',
    outlineStyle: 'none' as any,
  },
  multilineInput: {
    minHeight: 52,
    textAlignVertical: 'center',
  },
  pillDropdown: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 13,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  dropdownWrapper: {
    width: '100%',
    position: 'relative',
    paddingTop: 16,
  },
  floatingDropdownLabelWrapper: {
    position: 'absolute',
    top: 0,
    left: 18,
    zIndex: 2,
  },
  floatingDropdownLabel: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.15,
  },
  dropdownText: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    marginRight: 8,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  pillToggleContainer: {
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    cursor: 'pointer' as any,
    ...Platform.select({
      web: {
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
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
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  errorBox: {
    backgroundColor: '#EF444422',
    borderWidth: 1,
    borderColor: '#EF444466',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 14,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12.5,
    fontWeight: '600',
    textAlign: 'center',
  },
});

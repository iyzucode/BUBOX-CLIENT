import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  useCreateMenu,
  useGetDetailMenu,
  useUpdateMenu,
} from '@/features/menu/useMenu';
import { CreateMenuRequest, MenuType, UpdateMenuRequest } from '@/types/menu';

const DAYS = [
  { id: 1, name: 'Senin' },
  { id: 2, name: 'Selasa' },
  { id: 3, name: 'Rabu' },
  { id: 4, name: 'Kamis' },
  { id: 5, name: 'Jumat' },
  { id: 6, name: 'Sabtu' },
  { id: 7, name: 'Minggu' },
];

const PRESET_CATEGORIES = ['Bubur', 'Nasi Tim', 'Sup', 'Snack', 'Pelengkap'];

export default function AdminMenuFormScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; day?: string; type?: string }>();

  const isEditMode = Boolean(params.id);
  const menuId = params.id;

  // Detail query for edit mode
  const { data: menuDetail, isLoading: isLoadingDetail } = useGetDetailMenu(menuId);

  // Mutations
  const createMenuMutation = useCreateMenu();
  const updateMenuMutation = useUpdateMenu();

  // Form states
  const [formDayOfWeek, setFormDayOfWeek] = useState<number>(
    params.day ? parseInt(params.day, 10) || 1 : 1
  );
  const [formMenuType, setFormMenuType] = useState<MenuType>(
    params.type === 'SEKUNDER' ? 'SEKUNDER' : 'UTAMA'
  );
  const [formCategory, setFormCategory] = useState<string>('Bubur');
  const [formName, setFormName] = useState<string>('');
  const [formPrice, setFormPrice] = useState<string>('');
  const [formDescription, setFormDescription] = useState<string>('');
  const [formIngredients, setFormIngredients] = useState<string>('');
  const [formNutritionInfo, setFormNutritionInfo] = useState<string>('');
  const [formImageUrl, setFormImageUrl] = useState<string | null>(null);
  const [formIsActive, setFormIsActive] = useState<boolean>(true);
  const [formError, setFormError] = useState<string | null>(null);

  // Populate data when editing
  useEffect(() => {
    if (menuDetail) {
      setFormDayOfWeek(menuDetail.dayOfWeek);
      setFormMenuType(menuDetail.menuType);
      setFormCategory(menuDetail.category);
      setFormName(menuDetail.name);
      setFormPrice(menuDetail.price.toString());
      setFormDescription(menuDetail.description || '');
      setFormIngredients(menuDetail.ingredients || '');
      setFormNutritionInfo(menuDetail.nutritionInfo || '');
      setFormImageUrl(menuDetail.imageUrl || null);
      setFormIsActive(menuDetail.isActive);
    }
  }, [menuDetail]);

  const handlePickImage = () => {
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png,image/webp,image/jpg';
      input.onchange = (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Batas maksimal 1 MB = 1048576 bytes
        if (file.size > 1048576) {
          const fileSizeKb = Math.round(file.size / 1024);
          setFormError(
            `Ukuran file terlalu besar (${fileSizeKb} KB). Batas maksimal ukuran gambar adalah 1 MB (1024 KB).`
          );
          return;
        }

        setFormError(null);
        const reader = new FileReader();
        reader.onload = () => {
          setFormImageUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    }
  };

  const handleRemoveImage = () => {
    setFormImageUrl(null);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      setFormError('Nama hidangan wajib diisi.');
      return;
    }

    const parsedPrice = parseFloat(formPrice);
    if (isNaN(parsedPrice) || parsedPrice < 0) {
      setFormError('Harga harus berupa angka valid (minimal 0).');
      return;
    }

    setFormError(null);

    try {
      if (isEditMode && menuId) {
        const updateData: UpdateMenuRequest = {
          dayOfWeek: formDayOfWeek,
          menuType: formMenuType,
          category: formCategory.trim(),
          name: formName.trim(),
          price: parsedPrice,
          description: formDescription.trim() || undefined,
          ingredients: formIngredients.trim() || undefined,
          nutritionInfo: formNutritionInfo.trim() || undefined,
          imageUrl: formImageUrl || null,
          isActive: formIsActive,
        };

        await updateMenuMutation.mutateAsync({
          id: menuId,
          data: updateData,
        });
      } else {
        const createData: CreateMenuRequest = {
          dayOfWeek: formDayOfWeek,
          menuType: formMenuType,
          category: formCategory.trim(),
          name: formName.trim(),
          price: parsedPrice,
          description: formDescription.trim() || undefined,
          ingredients: formIngredients.trim() || undefined,
          nutritionInfo: formNutritionInfo.trim() || undefined,
          imageUrl: formImageUrl || null,
          isActive: formIsActive,
        };

        await createMenuMutation.mutateAsync(createData);
      }

      router.back();
    } catch (err: any) {
      setFormError(err.response?.data?.message || err.message || 'Gagal menyimpan menu.');
    }
  };

  const isSubmitting = createMenuMutation.isPending || updateMenuMutation.isPending;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
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
                  { backgroundColor: theme.card, borderColor: theme.border },
                  pressed && styles.pressed,
                ]}
              >
                <ThemedText style={{ fontSize: 16 }}>←</ThemedText>
                <ThemedText style={[styles.backBtnText, { color: theme.secondary }]}>
                  Kembali ke Menu
                </ThemedText>
              </Pressable>
            </View>

            {/* Header Title Card */}
            <View
              style={[
                styles.headerCard,
                { backgroundColor: theme.card, borderColor: theme.border },
              ]}
            >
              <View style={styles.headerTagRow}>
                <View
                  style={[
                    styles.tagBadge,
                    {
                      backgroundColor: isEditMode ? '#EFF6FF' : '#FFF0E8',
                    },
                  ]}
                >
                  <ThemedText
                    style={[
                      styles.tagBadgeText,
                      { color: isEditMode ? '#0284C7' : theme.primary },
                    ]}
                  >
                    {isEditMode ? 'EDIT MODE' : 'TAMBAH MENU'}
                  </ThemedText>
                </View>
              </View>

              <ThemedText style={[styles.pageTitle, { color: theme.secondary }]}>
                {isEditMode ? 'Ubah Hidangan MPASI' : 'Tambah Hidangan Baru'}
              </ThemedText>
              <ThemedText style={styles.pageSubtitle}>
                Lengkapi rincian menu harian MPASI Bubox untuk siklus rotasi nutrisi si kecil.
              </ThemedText>
            </View>

            {/* Loading Detail Spinner */}
            {isEditMode && isLoadingDetail && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={theme.primary} />
                <ThemedText style={{ color: '#64748B', marginTop: 10 }}>
                  Memuat data hidangan...
                </ThemedText>
              </View>
            )}

            {/* Main Form Content */}
            {(!isEditMode || !isLoadingDetail) && (
              <View
                style={[
                  styles.formCard,
                  { backgroundColor: theme.card, borderColor: theme.border },
                ]}
              >
                {formError && (
                  <View style={styles.errorBanner}>
                    <ThemedText style={styles.errorBannerText}>⚠️ {formError}</ThemedText>
                  </View>
                )}

                {/* 1. Gambar Hidangan (Base64 Maks 1MB) */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.inputLabel}>Foto / Gambar Hidangan</ThemedText>
                  <ThemedText style={styles.fieldHint}>
                    Format gambar JPG, PNG, atau WebP (Maksimal 1 MB). Disimpan dalam format Base64.
                  </ThemedText>

                  {formImageUrl ? (
                    <View style={styles.imagePreviewContainer}>
                      <Image
                        source={{ uri: formImageUrl }}
                        style={styles.imagePreview}
                        resizeMode="cover"
                      />
                      <View style={styles.imagePreviewActions}>
                        <Pressable
                          onPress={handlePickImage}
                          style={[styles.imgActionBtn, { borderColor: theme.border }]}
                        >
                          <ThemedText style={{ fontSize: 12, fontWeight: '700', color: '#0284C7' }}>
                            Ganti Foto
                          </ThemedText>
                        </Pressable>
                        <Pressable
                          onPress={handleRemoveImage}
                          style={[styles.imgActionBtn, { borderColor: '#FCA5A5', backgroundColor: '#FEF2F2' }]}
                        >
                          <ThemedText style={{ fontSize: 12, fontWeight: '700', color: '#DC2626' }}>
                            Hapus
                          </ThemedText>
                        </Pressable>
                      </View>
                    </View>
                  ) : (
                    <Pressable
                      onPress={handlePickImage}
                      style={({ pressed }) => [
                        styles.uploadBox,
                        { borderColor: theme.border },
                        pressed && styles.pressed,
                      ]}
                    >
                      <ThemedText style={{ fontSize: 32 }}>📷</ThemedText>
                      <ThemedText style={{ fontSize: 14, fontWeight: '700', color: theme.secondary }}>
                        Pilih Gambar Hidangan
                      </ThemedText>
                      <ThemedText style={{ fontSize: 12, color: '#94A3B8' }}>
                        Klik untuk memilih file foto (Maks. 1 MB)
                      </ThemedText>
                    </Pressable>
                  )}
                </View>

                {/* 2. Hari Penyajian */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.inputLabel}>Hari Penyajian *</ThemedText>
                  <ThemedText style={styles.fieldHint}>
                    Pilih hari saat menu ini disajikan dalam rotasi mingguan.
                  </ThemedText>
                  <View style={styles.pillRow}>
                    {DAYS.map((d) => {
                      const isSelected = formDayOfWeek === d.id;
                      return (
                        <Pressable
                          key={d.id}
                          onPress={() => setFormDayOfWeek(d.id)}
                          style={[
                            styles.formPill,
                            isSelected
                              ? { backgroundColor: theme.primary, borderColor: theme.primary }
                              : { backgroundColor: '#F8FAFC', borderColor: theme.border },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.formPillText,
                              { color: isSelected ? '#FFFFFF' : '#475569' },
                              isSelected && { fontWeight: '700' },
                            ]}
                          >
                            {d.name}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                {/* 3. Klasifikasi Menu */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.inputLabel}>Klasifikasi Menu *</ThemedText>
                  <View style={styles.typeToggleRow}>
                    <Pressable
                      onPress={() => setFormMenuType('UTAMA')}
                      style={[
                        styles.typeToggleBtn,
                        formMenuType === 'UTAMA'
                          ? { backgroundColor: '#0284C7', borderColor: '#0284C7' }
                          : { backgroundColor: '#F8FAFC', borderColor: theme.border },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.typeToggleText,
                          { color: formMenuType === 'UTAMA' ? '#FFFFFF' : '#64748B' },
                        ]}
                      >
                        🍲 Menu Utama (Rotasi Harian)
                      </ThemedText>
                    </Pressable>

                    <Pressable
                      onPress={() => setFormMenuType('SEKUNDER')}
                      style={[
                        styles.typeToggleBtn,
                        formMenuType === 'SEKUNDER'
                          ? { backgroundColor: '#16A34A', borderColor: '#16A34A' }
                          : { backgroundColor: '#F8FAFC', borderColor: theme.border },
                      ]}
                    >
                      <ThemedText
                        style={[
                          styles.typeToggleText,
                          { color: formMenuType === 'SEKUNDER' ? '#FFFFFF' : '#64748B' },
                        ]}
                      >
                        🥗 Menu Sekunder (Lauk / Snack)
                      </ThemedText>
                    </Pressable>
                  </View>
                </View>

                {/* 4. Kategori Makanan */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.inputLabel}>Kategori Makanan *</ThemedText>
                  <View style={styles.presetCategoryRow}>
                    {PRESET_CATEGORIES.map((cat) => {
                      const isSelected = formCategory === cat;
                      return (
                        <Pressable
                          key={cat}
                          onPress={() => setFormCategory(cat)}
                          style={[
                            styles.catPill,
                            isSelected
                              ? {
                                  backgroundColor: theme.primaryLight || '#FFF0E8',
                                  borderColor: theme.primary,
                                }
                              : { backgroundColor: '#FFFFFF', borderColor: theme.border },
                          ]}
                        >
                          <ThemedText
                            style={[
                              styles.catPillText,
                              { color: isSelected ? theme.primary : '#64748B' },
                              isSelected && { fontWeight: '700' },
                            ]}
                          >
                            {cat}
                          </ThemedText>
                        </Pressable>
                      );
                    })}
                  </View>
                  <TextInput
                    style={[styles.inputField, { borderColor: theme.border }]}
                    placeholder="Atau ketik kategori kustom..."
                    placeholderTextColor="#94A3B8"
                    value={formCategory}
                    onChangeText={setFormCategory}
                  />
                </View>

                {/* 5. Nama Hidangan */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.inputLabel}>Nama Hidangan *</ThemedText>
                  <TextInput
                    style={[styles.inputField, { borderColor: theme.border }]}
                    placeholder="Contoh: Bubur Daging Ayam Wortel"
                    placeholderTextColor="#94A3B8"
                    value={formName}
                    onChangeText={setFormName}
                  />
                </View>

                {/* 6. Harga Satuan */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.inputLabel}>Harga Satuan (Rp) *</ThemedText>
                  <TextInput
                    style={[styles.inputField, { borderColor: theme.border }]}
                    placeholder="Contoh: 25000"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    value={formPrice}
                    onChangeText={setFormPrice}
                  />
                </View>

                {/* 7. Bahan Pangan */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.inputLabel}>Bahan Pangan (Ingredients)</ThemedText>
                  <TextInput
                    style={[styles.inputField, { borderColor: theme.border }]}
                    placeholder="Contoh: Beras organik, fillet dada ayam, wortel segar, kaldu ayam kampung"
                    placeholderTextColor="#94A3B8"
                    value={formIngredients}
                    onChangeText={setFormIngredients}
                  />
                </View>

                {/* 8. Informasi Gizi */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.inputLabel}>Informasi Nutrisi & Gizi</ThemedText>
                  <TextInput
                    style={[styles.inputField, { borderColor: theme.border }]}
                    placeholder="Contoh: Energi 145 kkal, Protein 8.5g, Lemak 3.2g, Zat Besi 1.8mg"
                    placeholderTextColor="#94A3B8"
                    value={formNutritionInfo}
                    onChangeText={setFormNutritionInfo}
                  />
                </View>

                {/* 9. Deskripsi Singkat */}
                <View style={styles.formGroup}>
                  <ThemedText style={styles.inputLabel}>Deskripsi Lengkap</ThemedText>
                  <TextInput
                    style={[styles.inputField, styles.inputArea, { borderColor: theme.border }]}
                    placeholder="Deskripsi cita rasa, tekstur, atau keunggulan nutrisi hidangan ini..."
                    placeholderTextColor="#94A3B8"
                    multiline
                    numberOfLines={4}
                    value={formDescription}
                    onChangeText={setFormDescription}
                  />
                </View>

                {/* 10. Status Aktif */}
                <View style={styles.statusToggleRow}>
                  <Pressable
                    onPress={() => setFormIsActive(!formIsActive)}
                    style={[
                      styles.checkboxBox,
                      formIsActive && {
                        backgroundColor: theme.primary,
                        borderColor: theme.primary,
                      },
                    ]}
                  >
                    {formIsActive && (
                      <ThemedText style={{ color: '#FFFFFF', fontSize: 13 }}>✓</ThemedText>
                    )}
                  </Pressable>
                  <View style={{ gap: 2 }}>
                    <ThemedText style={{ fontSize: 14, fontWeight: '700' }}>
                      Status Menu Aktif
                    </ThemedText>
                    <ThemedText style={{ fontSize: 12, color: '#64748B' }}>
                      Menu aktif akan tampil di katalog pemesanan pelanggan
                    </ThemedText>
                  </View>
                </View>

                {/* Action Buttons */}
                <View style={[styles.formActionRow, { borderTopColor: theme.border }]}>
                  <Pressable
                    onPress={() => router.back()}
                    disabled={isSubmitting}
                    style={[styles.cancelBtn, { borderColor: theme.border }]}
                  >
                    <ThemedText style={{ color: '#64748B', fontWeight: '600', fontSize: 14 }}>
                      Batal
                    </ThemedText>
                  </Pressable>

                  <Pressable
                    onPress={handleSave}
                    disabled={isSubmitting}
                    style={[
                      styles.saveBtn,
                      { backgroundColor: theme.primary },
                      isSubmitting && { opacity: 0.7 },
                    ]}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <ThemedText style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 14 }}>
                        {isEditMode ? 'Simpan Perubahan' : 'Tambah Menu'}
                      </ThemedText>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: BottomTabInset + 40,
    gap: 16,
  },
  topNavRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  headerCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 8,
  },
  headerTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  pageSubtitle: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 24,
    gap: 20,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    padding: 12,
    borderRadius: 12,
  },
  errorBannerText: {
    color: '#DC2626',
    fontSize: 13,
    fontWeight: '600',
  },
  formGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: '#334155',
  },
  fieldHint: {
    fontSize: 11,
    color: '#94A3B8',
  },
  imagePreviewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  imagePreview: {
    width: 80,
    height: 80,
    borderRadius: 10,
  },
  imagePreviewActions: {
    gap: 8,
  },
  imgActionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  uploadBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FAFAFA',
    cursor: 'pointer' as any,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  formPillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  typeToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  typeToggleBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    cursor: 'pointer' as any,
  },
  typeToggleText: {
    fontSize: 13,
    fontWeight: '700',
  },
  presetCategoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  inputField: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
    backgroundColor: '#FFFFFF',
  },
  inputArea: {
    height: 90,
    textAlignVertical: 'top',
  },
  statusToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 6,
  },
  checkboxBox: {
    width: 24,
    height: 24,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer' as any,
  },
  formActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    borderTopWidth: 1,
    paddingTop: 18,
    marginTop: 6,
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    cursor: 'pointer' as any,
  },
  saveBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    cursor: 'pointer' as any,
  },
  pressed: {
    opacity: 0.75,
    transform: [{ scale: 0.98 }],
  },
});
